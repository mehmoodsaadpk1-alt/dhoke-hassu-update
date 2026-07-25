/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Language, AuthState, User } from './types';
import Login from './components/Login';
import Signup from './components/Signup';
import AppShell from './components/AppShell';
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
import { translations } from './translations';
import { Globe, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured, dbSaveUserProfile } from './utils/supabaseClient';
import { analytics } from './services/AnalyticsService';
import LocationSetupWizard from './components/LocationSetupWizard';
import AnalyticsDebugPanel from './components/AnalyticsDebugPanel';

export default function App() {
  console.log('App rendered');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [authState, setAuthState] = useState<AuthState>('LOGIN');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const updateUser = useCallback((updated: User) => setUser(updated), []);
  
  // SPA routing state to intercept admin routes
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    document.documentElement.dir = currentLanguage === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    
    const syncUserProfile = async (authUser: any) => {
      const email = authUser.email || '';
      const userMetadata = authUser.user_metadata || {};
      
      if (!email) return null;

      try {
        // 1. Try to fetch existing profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error("[syncUserProfile] Failed to fetch profile due to a database/network error:", error);
          throw new Error(`syncUserProfile fetch failed: ${error.message || error.code}`);
        }
          
        if (profile) {
          console.log("[syncUserProfile] Profile loaded successfully.");
          // Profile exists, return mapped User object
          let parsedSocialLinks = {};
          if (profile.socialLinks) {
            try {
              parsedSocialLinks = typeof profile.socialLinks === 'string' 
                ? JSON.parse(profile.socialLinks) 
                : profile.socialLinks;
            } catch (e) {
              console.warn("Failed to parse socialLinks:", e);
            }
          }

          let parsedBadges = [];
          if (profile.badges) {
            try {
              parsedBadges = typeof profile.badges === 'string' 
                ? JSON.parse(profile.badges) 
                : profile.badges;
            } catch (e) {
              console.warn("Failed to parse badges:", e);
            }
          }

          return {
            id: authUser.id,
            fullName: profile.full_name || userMetadata.fullName || userMetadata.full_name || userMetadata.name || 'Google User',
            email: email,
            area: profile.area || null,
            mobileNumber: profile.mobileNumber || undefined,
            profilePhoto: profile.profile_photo || userMetadata.avatar_url || userMetadata.picture || undefined,
            gender: profile.gender || (parsedSocialLinks as any)?.gender || undefined,
            dateOfBirth: profile.date_of_birth || (parsedSocialLinks as any)?.dateOfBirth || undefined,
            provinceId: profile.province_id || (parsedSocialLinks as any)?.provinceId || undefined,
            cityId: profile.city_id || (parsedSocialLinks as any)?.cityId || undefined,
            areaId: profile.area_id || (parsedSocialLinks as any)?.areaId || undefined,
            latitude: profile.latitude || (parsedSocialLinks as any)?.latitude || undefined,
            longitude: profile.longitude || (parsedSocialLinks as any)?.longitude || undefined,
            verified: !!profile.verified,
            username: profile.username || undefined,
            bio: profile.bio || undefined,
            joinDate: profile.joinDate || undefined,
            reputationScore: profile.reputationScore ?? 100,
            coverPhoto: profile.coverPhoto || (parsedSocialLinks as any)?.coverPhoto || undefined,
            contactNumber: profile.contactNumber || undefined,
            socialLinks: parsedSocialLinks,
            badges: parsedBadges
          } as User;
        } else {
          // Profile does not exist in public.profiles table.
          // Differentiate between a brand new Google OAuth user (should auto-provision)
          // and an existing user whose profile was deleted by the Admin.
          const createdAtTime = new Date(authUser.created_at || authUser.createdAt).getTime();
          const isNewUser = (Date.now() - createdAtTime) < 60000; // 1 minute window

          if (isNewUser) {
            // New user, auto-provision it (e.g. for Google OAuth sign-in)
            const newProfile: User = {
              id: authUser.id,
              fullName: userMetadata.fullName || userMetadata.full_name || userMetadata.name || 'Google User',
              email: email,
              ...(userMetadata.area ? { area: userMetadata.area } : {}),
              profilePhoto: userMetadata.avatar_url || userMetadata.picture || undefined,
              joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              reputationScore: 100,
              verified: false
            } as User;
            
            await dbSaveUserProfile(newProfile);
            return newProfile;
          } else {
            console.warn("syncUserProfile: Profile not found in DB for existing auth user. Clearing stale profile cache.");
            localStorage.removeItem('dh_user_profile_data');
            return null;
          }
        }
      } catch (err) {
        console.warn("Error syncing user profile:", err);
        return null;
      }
    };

    // Check Supabase session on mount with retry logic and OAuth callback validation
    const checkSession = async () => {
      if (isSupabaseConfigured && supabase) {
        // Parse search params & hash fragment for OAuth callback errors/codes
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash?.substring(1));
        
        const hasError = params.has('error') || hashParams.has('error');
        const errorMsg = params.get('error_description') || hashParams.get('error_description') || 
                         params.get('error') || hashParams.get('error');
        const hasCode = params.has('code') || hashParams.has('access_token');

        if (hasError) {
          console.error("OAuth Callback Error:", errorMsg);
          // Clear credentials from URL
          window.history.replaceState({}, document.title, window.location.pathname);
          setUser(null);
          setAuthState('LOGIN');
          setIsAuthLoading(false);
          return;
        }

        try {
          let session = null;
          let retries = 2;
          
          while (retries > 0) {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
              console.warn(`Auth session restore attempt failed (retries left: ${retries - 1}):`, error.message);
            }
            if (data?.session?.user) {
              session = data.session;
              break;
            }
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 600)); // wait and retry
            }
          }

          if (session && session.user) {
            const profile = await syncUserProfile(session.user);
            if (profile) {
              analytics.identify(session.user.id);
              setUser(profile);
              setAuthState('LOGGED_IN');
              if (hasCode) {
                // Clear the auth code from the URL path for security and clean state
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            } else {
              // Sign out if profile sync failed
              console.error("Profile sync returned null, signing out user.");
              await supabase.auth.signOut();
              setUser(null);
              setAuthState('LOGIN');
            }
          } else {
            if (hasCode) {
              console.error("Auth session not retrieved despite having OAuth callback code");
              window.history.replaceState({}, document.title, window.location.pathname);
              setUser(null);
              analytics.reset();
              setAuthState('LOGIN');
            }
          }
        } catch (err) {
          console.error("Error restoring session:", err);
          setUser(null);
          analytics.reset();
          setAuthState('LOGIN');
        } finally {
          setIsAuthLoading(false);
        }
      } else {
        setIsAuthLoading(false);
      }
    };
    checkSession();

    // Listen for auth state events, e.g. PASSWORD_RECOVERY link click
    let authListener: any = null;
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          if (event === 'PASSWORD_RECOVERY') {
            setAuthState('RESET_PASSWORD');
          } else if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
            const profile = await syncUserProfile(session.user);
            if (profile) {
              analytics.identify(session.user.id);
              setUser(profile);
              setAuthState('LOGGED_IN');
            } else {
              console.error("Profile sync failed on SIGNED_IN event, signing out.");
              await supabase.auth.signOut();
              setUser(null);
              setAuthState('LOGIN');
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            analytics.reset();
            setAuthState('LOGIN');
          }
        } catch (err) {
          console.error("Exception in auth state change handler:", err);
          setUser(null);
          analytics.reset();
          setAuthState('LOGIN');
        }
      });
      authListener = subscription;
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (authListener) authListener.unsubscribe();
    };
  }, []);

  // Background Location Auto-Setup
  const hasAttemptedLocationSetup = useRef(false);
  useEffect(() => {
    if (user && (!user.provinceId || !user.cityId || !user.area)) {
      if (hasAttemptedLocationSetup.current) {
        console.log("Background location setup has already run for this session. Skipping to prevent loop.");
        return;
      }
      hasAttemptedLocationSetup.current = true;

      async function autoSetupLocation() {
        try {
          console.log("Running background location setup...");
          // Try to detect coordinates quietly
          let lat = 33.6288;
          let lng = 73.0315;
          
          try {
            const position = await new Promise<GeolocationPosition | null>((resolve) => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => resolve(pos),
                  () => resolve(null),
                  { timeout: 3000 }
                );
              } else {
                resolve(null);
              }
            });
            if (position) {
              lat = position.coords.latitude;
              lng = position.coords.longitude;
            }
          } catch (e) {
            console.warn("Background geolocation detection failed:", e);
          }

          // Fallbacks: Pakistan -> Punjab -> Rawalpindi -> Dhoke Hassu
          const provinceId = 'prov-punjab-1';
          const cityId = 'city-rwp-1';
          const areaId = 'area-dh-1';
          const areaName = 'Dhoke Hassu';

          if (
            user.provinceId === provinceId &&
            user.cityId === cityId &&
            user.areaId === areaId &&
            user.area === areaName
          ) {
            console.log("Location values are already identical to defaults. Skipping state updates.");
            return;
          }

          const updatedUser = {
            ...user,
                        provinceId,
            cityId,
            areaId,
            area: areaName,
            latitude: lat,
            longitude: lng
          };

          // Save profile and update state/local storage
          setUser(updatedUser);
          await dbSaveUserProfile(updatedUser);
          localStorage.setItem('dh_user_profile_data', JSON.stringify(updatedUser));
          console.log("Background location auto-setup completed successfully.");
        } catch (err) {
          console.error("Error in autoSetupLocation:", err);
        }
      }
      autoSetupLocation();
    }
  }, [user]);

  // Forgot Password screen states
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Reset Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);

  const t = translations[currentLanguage];

  const handleLoginSuccess = (loggedInUser: User) => {
    analytics.identify(loggedInUser.id);
    analytics.track('user_login', { entity_type: 'user', module: 'Auth' });
    setUser(loggedInUser);
    setAuthState('LOGGED_IN');
    
    // Clear popup cooldowns so it triggers immediately on every login
    localStorage.removeItem('dhoke_popup_global_last');
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dhoke_popup_last_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  };

  const handleSignupSuccess = (registeredUser: User) => {
    analytics.identify(registeredUser.id);
    analytics.track('user_signup', { entity_type: 'user', module: 'Auth' });
    setUser(registeredUser);
    setAuthState('LOGGED_IN');
  };

  const handleLogout = async () => {
    analytics.track('user_logout', { entity_type: 'user', module: 'Auth' });
    analytics.flush();
    analytics.reset();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Failed to sign out from Supabase:", err);
      }
    }
    
    // Clear application cache to prevent data leakage (only keys for this project)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('dh_') || key.startsWith('dhoke_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Reset URL to root to prevent confusing Back-button behavior
    window.history.replaceState({}, document.title, '/');

    setUser(null);
    setAuthState('LOGIN');
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail?.trim()) {
      setForgotError(currentLanguage === 'en' ? 'Please enter your registered email address' : 'براہ کرم اپنا رجسٹرڈ ای میل ایڈریس درج کریں');
      return;
    }
    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      setForgotError(currentLanguage === 'en' ? 'Please enter a valid email address' : 'براہ کرم ایک درست ای میل ایڈریس درج کریں');
      return;
    }

    setForgotError('');

    analytics.track('forgot_password', { entity_type: 'user', module: 'Auth' });

    if (!isSupabaseConfigured || !supabase) {
      setForgotError('Supabase is not configured.');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}${window.location.pathname}${window.location.search}`
      });
      if (error) {
        setForgotError(error.message);
        return;
      }
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        setForgotEmail('');
        setAuthState('LOGIN');
      }, 3000);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send recovery email.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setResetPasswordError(currentLanguage === 'en' ? 'Password is required' : 'پاس ورڈ درج کرنا ضروری ہے');
      return;
    }
    if (newPassword.length < 6) {
      setResetPasswordError(currentLanguage === 'en' ? 'Password must be at least 6 characters' : 'پاس ورڈ کم از کم 6 ہندسوں کا ہونا چاہیے');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetPasswordError(currentLanguage === 'en' ? 'Passwords do not match' : 'پاس ورڈز میچ نہیں ہو رہے');
      return;
    }

    setResetPasswordError('');

    if (!isSupabaseConfigured || !supabase) {
      setResetPasswordError('Supabase is not configured.');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setResetPasswordError(error.message);
        return;
      }
      setResetPasswordSuccess(true);
      setTimeout(() => {
        setResetPasswordSuccess(false);
        setNewPassword('');
        setConfirmNewPassword('');
        setAuthState('LOGIN');
      }, 3000);
    } catch (err: any) {
      setResetPasswordError(err.message || 'Failed to reset password.');
    }
  };

  // Rendering active screen based on AuthState
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse text-sm">
          {currentLanguage === 'en' ? 'Starting up...' : 'شروع ہو رہا ہے...'}
        </p>
      </div>
    );
  }

  if (currentPath.startsWith('/admin')) {
    return (
      <React.Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse text-sm">
            {currentLanguage === 'en' ? 'Loading Admin Dashboard...' : 'ایڈمن ڈیش بورڈ لوڈ ہو رہا ہے...'}
          </p>
        </div>
      }>
        <AdminDashboard 
          currentLanguage={currentLanguage} 
          onExitAdmin={() => {
            window.history.pushState({}, '', '/');
            setCurrentPath('/');
          }}
        />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {authState !== 'LOGGED_IN' ? (
        /* PREMIUM AUTHENTICATION CONTAINER (Mobile & Desktop) */
        <div className={`flex-1 flex flex-col min-h-screen relative overflow-hidden ${authState === 'LOGIN' ? 'bg-[url("/login-bg.jpg")] bg-cover bg-center bg-no-repeat bg-fixed' : 'bg-slate-50 md:bg-[#e8f5e9]'}`} dir="ltr">
          
          {/* Overlay for readability if image is too bright, optional but good for contrast */}
          {authState === 'LOGIN' && (
            <div className="absolute inset-0 bg-black/20 md:bg-black/40 pointer-events-none z-0" />
          )}

          {/* Mobile Background Blobs */}
          <div className={`md:hidden absolute top-0 start-0 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl -translate-x-12 -translate-y-12 ${authState === 'LOGIN' ? 'hidden' : ''}`} />
          <div className={`md:hidden absolute bottom-0 end-0 w-72 h-72 bg-green-100/30 rounded-full blur-3xl translate-x-12 translate-y-12 ${authState === 'LOGIN' ? 'hidden' : ''}`} />

          {/* Desktop Background Patterns & Geometry */}
          <div className={`hidden md:block absolute inset-0 opacity-[0.15] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none mix-blend-multiply ${authState === 'LOGIN' ? 'hidden' : ''}`} />
          <div className={`hidden md:block absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-gradient-to-br from-[#2A7649]/20 to-transparent rounded-full blur-3xl pointer-events-none ${authState === 'LOGIN' ? 'hidden' : ''}`} />
          <div className={`hidden md:block absolute -bottom-[20%] -left-[10%] w-[800px] h-[800px] bg-gradient-to-tr from-[#2A7649]/20 to-transparent rounded-full blur-3xl pointer-events-none ${authState === 'LOGIN' ? 'hidden' : ''}`} />

          {/* Desktop Header */}
          <header className="hidden md:flex relative z-10 w-full px-12 py-6 justify-between items-center bg-white/40 backdrop-blur-md border-b border-white/50 shadow-sm">
            <div className="flex flex-col items-start">
              <div className="flex items-center text-[#2A7649] font-extrabold text-3xl tracking-tighter">
                <span>D</span>
                <span className="relative">
                  H
                  <svg className="absolute -top-2 -right-2 w-4 h-4 text-[#308B54] drop-shadow-sm transform rotate-12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C7.03 2 3 6.03 3 11V22H14C18.97 22 23 17.97 23 13C23 8.03 18.97 2 12 2ZM19 13C19 15.76 16.76 18 14 18H7V11C7 8.24 9.24 6 12 6C14.76 6 17 8.24 17 11V13C17 14.1 16.1 15 15 15C13.9 15 13 14.1 13 13V11H11V13C11 15.21 12.79 17 15 17C17.21 17 19 15.21 19 13V11C19 9.34 17.66 8 16 8C14.34 8 13 9.34 13 11V14.5C13 15.33 12.33 16 11.5 16C10.67 16 10 15.33 10 14.5V11C10 7.69 12.69 5 16 5C19.86 5 23 8.14 23 12V13Z" />
                    <path d="M17.42 2.58C17.24 2.58 17.06 2.59 16.89 2.61C18.57 3.55 19.89 5.05 20.57 6.86C20.85 6.09 21 5.27 21 4.42C21 3.51 20.8 2.64 20.45 1.84C19.57 2.31 18.53 2.58 17.42 2.58Z" opacity="0.3"/>
                  </svg>
                </span>
              </div>
              <span className="text-slate-800 font-bold text-xs tracking-widest mt-0.5">Connect</span>
            </div>
            <nav className="flex items-center gap-8 font-['Noto_Sans_Arabic'] font-bold text-slate-800" dir="rtl">
              <a href="#" className="hover:text-[#2A7649] transition-colors">شرائط کی پالیسی</a>
              <a href="#" className="hover:text-[#2A7649] transition-colors">رابطہ</a>
              <a href="#" className="hover:text-[#2A7649] transition-colors">ہماری بابت</a>
            </nav>
          </header>

          <main className="relative z-10 w-full flex-1 flex justify-center items-center p-0 md:p-8">
            {authState === 'LOGIN' && (
              <Login
                onLoginSuccess={handleLoginSuccess}
                onNavigateToSignup={() => setAuthState('SIGNUP')}
                currentLanguage={currentLanguage}
                onLanguageChange={setCurrentLanguage}
                onNavigateToForgotPassword={() => {
                  setForgotError('');
                  setResetSuccess(false);
                  setAuthState('FORGOT_PASSWORD');
                }}
              />
            )}

            {authState === 'SIGNUP' && (
              <Signup
                onSignupSuccess={handleSignupSuccess}
                onNavigateToLogin={() => setAuthState('LOGIN')}
                currentLanguage={currentLanguage}
                onLanguageChange={setCurrentLanguage}
              />
            )}

            {authState === 'FORGOT_PASSWORD' && (
              <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-8 transform transition-all">
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={() => setAuthState('LOGIN')}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t.backToLogin}
                  </button>
                  
                  <button
                    onClick={() => setCurrentLanguage(currentLanguage === 'en' ? 'ur' : 'en')}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-semibold"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {t.languageToggle}
                  </button>
                </div>

                <div className="text-center mb-6">
                  <div className="inline-flex p-3 bg-blue-50 text-primary rounded-2xl mb-3">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 leading-tight">
                    {t.forgotTitle}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1.5 px-2">
                    {t.forgotSubtitle}
                  </p>
                </div>

                {forgotError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    {forgotError}
                  </div>
                )}

                {resetSuccess ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-bold flex flex-col items-center gap-2 text-center">
                    <CheckCircle className="w-8 h-8 text-action animate-bounce" />
                    <p>{currentLanguage === 'en' ? 'Reset instructions sent! Redirecting back...' : 'پاس ورڈ دوبارہ ترتیب دینے کی تفصیلات بھیج دی گئی ہیں! واپس بھیجا جا رہا ہے...'}</p>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        {t.mobileNumber}
                      </label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder={t.mobilePlaceholder}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition-all"
                    >
                      {t.sendResetBtn}
                    </button>
                  </form>
                )}
              </div>
            )}

            {authState === 'RESET_PASSWORD' && (
              <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-8 transform transition-all">
                <div className="text-center mb-6">
                  <div className="inline-flex p-3 bg-blue-50 text-primary rounded-2xl mb-3">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 leading-tight">
                    {currentLanguage === 'en' ? 'Set New Password' : 'نیا پاس ورڈ سیٹ کریں'}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1.5 px-2">
                    {currentLanguage === 'en' ? 'Please enter your new password below' : 'براہ کرم نیچے اپنا نیا پاس ورڈ درج کریں'}
                  </p>
                </div>

                {resetPasswordError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    {resetPasswordError}
                  </div>
                )}

                {resetPasswordSuccess ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-bold flex flex-col items-center gap-2 text-center">
                    <CheckCircle className="w-8 h-8 text-action animate-bounce" />
                    <p>{currentLanguage === 'en' ? 'Password updated successfully! Redirecting...' : 'پاس ورڈ کامیابی سے اپ ڈیٹ ہو گیا! بھیجا جا رہا ہے...'}</p>
                  </div>
                ) : (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        {currentLanguage === 'en' ? 'New Password' : 'نیا پاس ورڈ'}
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        {currentLanguage === 'en' ? 'Confirm New Password' : 'نئے پاس ورڈ کی تصدیق کریں'}
                      </label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition-all"
                    >
                      {currentLanguage === 'en' ? 'Update Password' : 'پاس ورڈ تبدیل کریں'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </main>
          
          {/* Desktop Footer */}
          <footer className="hidden md:flex relative z-10 w-full px-12 py-6 flex-row justify-between items-center bg-white/40 backdrop-blur-md border-t border-white/50 text-slate-700 text-sm font-bold">
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-[#2A7649] transition-colors">About Us</a>
              <a href="#" className="hover:text-[#2A7649] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#2A7649] transition-colors">Terms of Use</a>
            </div>
            <div className="flex items-center gap-6 font-['Noto_Sans_Arabic']" dir="rtl">
              <a href="#" className="hover:text-[#2A7649] transition-colors">ہماری بابت</a>
              <a href="#" className="hover:text-[#2A7649] transition-colors">رازداری کی پالیسی</a>
              <a href="#" className="hover:text-[#2A7649] transition-colors">شرائط استعمال</a>
            </div>
          </footer>
        </div>
      ) : (
        /* 3. LOGGED IN STATE - MOUNTS THE MAIN APP SHELL */
        <>
          <AppShell
            user={user!}
            onLogout={handleLogout}
            currentLanguage={currentLanguage}
            onLanguageChange={setCurrentLanguage}
            onUpdateUser={updateUser}
          />
        </>
      )}

      {/* Developer Analytics Debug Panel */}
      <AnalyticsDebugPanel />
    </div>
  );
}
