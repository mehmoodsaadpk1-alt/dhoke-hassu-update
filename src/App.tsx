/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Language, AuthState, User } from './types';
import Login from './components/Login';
import Signup from './components/Signup';
import AppShell from './components/AppShell';
import AdminDashboard from './components/AdminDashboard';
import { translations } from './translations';
import { Globe, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured, dbSaveUserProfile } from './utils/supabaseClient';
import LocationSetupWizard from './components/LocationSetupWizard';

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
              setAuthState('LOGIN');
            }
          }
        } catch (err) {
          console.error("Error restoring session:", err);
          setUser(null);
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
          } else if (event === 'SIGNED_IN' && session) {
            const profile = await syncUserProfile(session.user);
            if (profile) {
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
            setAuthState('LOGIN');
          }
        } catch (err) {
          console.error("Exception in auth state change handler:", err);
          setUser(null);
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
    setUser(registeredUser);
    setAuthState('LOGGED_IN');
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Failed to sign out from Supabase:", err);
      }
    }
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

    if (!isSupabaseConfigured || !supabase) {
      setForgotError('Supabase is not configured.');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/`
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
      <AdminDashboard 
        currentLanguage={currentLanguage} 
        onExitAdmin={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {authState !== 'LOGGED_IN' ? (
        /* AUTHENTICATION CONTAINER (With clean neutral gradient background) */
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 bg-slate-50 relative overflow-hidden">
          
          {/* Ambient decorative background blobs */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl -translate-x-12 -translate-y-12" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-100/30 rounded-full blur-3xl translate-x-12 translate-y-12" />

          {/* Quick instructions bar */}
          <div className="w-full max-w-md text-center mb-6 z-10">
            <p className="text-xs text-slate-400 font-medium bg-slate-100 border border-slate-200/50 py-1.5 px-4 rounded-full inline-block">
              💡 {currentLanguage === 'en' ? 'Rawalpindi Community App Foundation' : 'راولپنڈی کمیونٹی ایپ فاؤنڈیشن'}
            </p>
          </div>

          <div className="relative z-10 w-full flex justify-center">
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
          </div>

          {/* Footer of Auth Screen */}
          <footer className="mt-8 text-center text-xs text-slate-400 font-medium max-w-sm px-4">
            <p>© 2026 {t.appName}. Designed for Rawalpindi Districts.</p>
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
    </div>
  );
}
