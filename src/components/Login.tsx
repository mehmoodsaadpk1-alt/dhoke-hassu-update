/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Globe, ShieldCheck } from 'lucide-react';
import { Language, User } from '../types';
import { translations } from '../translations';
import { supabase, isSupabaseConfigured, dbGetUserProfile } from '../utils/supabaseClient';
import { AppInput, AppButton, AppDivider } from './ui';

// Leaf icon for the DH logo
const LeafIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C7.03 2 3 6.03 3 11V22H14C18.97 22 23 17.97 23 13C23 8.03 18.97 2 12 2ZM19 13C19 15.76 16.76 18 14 18H7V11C7 8.24 9.24 6 12 6C14.76 6 17 8.24 17 11V13C17 14.1 16.1 15 15 15C13.9 15 13 14.1 13 13V11H11V13C11 15.21 12.79 17 15 17C17.21 17 19 15.21 19 13V11C19 9.34 17.66 8 16 8C14.34 8 13 9.34 13 11V14.5C13 15.33 12.33 16 11.5 16C10.67 16 10 15.33 10 14.5V11C10 7.69 12.69 5 16 5C19.86 5 23 8.14 23 12V13Z" />
    <path d="M17.42 2.58C17.24 2.58 17.06 2.59 16.89 2.61C18.57 3.55 19.89 5.05 20.57 6.86C20.85 6.09 21 5.27 21 4.42C21 3.51 20.8 2.64 20.45 1.84C19.57 2.31 18.53 2.58 17.42 2.58Z" opacity="0.3"/>
    <path d="M12 2C10.37 2 8.84 2.44 7.51 3.2C9.43 3.65 11 5.17 11 7.15V9.15H13V7.15C13 5.17 14.57 3.65 16.49 3.2C15.16 2.44 13.63 2 12 2Z" opacity="0.5"/>
  </svg>
);

const DualLabel = ({ en, ur }: { en: string, ur: string }) => (
  <div className="flex justify-start items-center gap-1.5 text-xs font-bold text-slate-800 mb-1.5 px-2" dir="rtl">
    <span className="font-['Noto_Sans_Arabic'] text-sm">{ur}</span>
    <span className="text-slate-400 font-normal">/</span>
    <span className="text-[10px] tracking-wide mt-0.5 text-slate-500">{en}</span>
  </div>
);

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToSignup: () => void;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigateToForgotPassword: () => void;
}

export default function Login({
  onLoginSuccess,
  onNavigateToSignup,
  currentLanguage,
  onLanguageChange,
  onNavigateToForgotPassword
}: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email?.trim()) {
      setError('ای میل ایڈریس درج کرنا ضروری ہے');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('براہ کرم ایک درست ای میل ایڈریس درج کریں');
      return;
    }
    if (!password) {
      setError('پاس ورڈ درج کرنا ضروری ہے');
      return;
    }
    
    setError('');

    if (!isSupabaseConfigured || !supabase) {
      setError('سپی بیس کنفیگر نہیں ہے۔ براہ کرم اپنے انوائرمنٹ میں NEXT_PUBLIC_SUPABASE_URL اور NEXT_PUBLIC_SUPABASE_ANON_KEY شامل کریں۔');
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!data.user) {
        setError('صارف نہیں ملا');
        return;
      }

      const profile = await dbGetUserProfile(data.user.id);
      if (!profile) {
        await supabase.auth.signOut();
        setError('آپ کا اکاؤنٹ موجود نہیں۔ براہ کرم منتظم سے رابطہ کریں۔');
        return;
      }
      
      const loggedInUser: User = {
        id: data.user.id,
        fullName: profile.fullName || data.user.user_metadata?.fullName || 'Local Resident',
        email: email,
        area: profile.area || data.user.user_metadata?.area || 'Dhoke Hassu',
        mobileNumber: profile.mobileNumber || undefined,
        verified: profile.verified || false,
        profilePhoto: profile.profilePhoto || undefined,
        coverPhoto: profile.coverPhoto || undefined
      };

      onLoginSuccess(loggedInUser);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during login.");
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('سپی بیس کنفیگر نہیں ہے۔');
      return;
    }
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}${window.location.search}`
        }
      });
      if (authError) {
        setError(authError.message);
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    }
  };

  return (
    <div className="w-full max-w-md bg-white overflow-hidden flex flex-col min-h-screen md:min-h-0 sm:rounded-[36px] md:rounded-2xl md:shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative md:py-8" dir="ltr">
      
      {/* --- DESKTOP CORNER MANDALAS --- */}
      <div className="hidden md:block absolute top-0 left-0 w-40 h-40 opacity-40 pointer-events-none -translate-x-12 -translate-y-12 z-0">
        <div className="w-full h-full rounded-full bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-multiply bg-[#2A7649]" />
      </div>
      <div className="hidden md:block absolute bottom-0 left-0 w-40 h-40 opacity-40 pointer-events-none -translate-x-12 translate-y-12 z-0">
        <div className="w-full h-full rounded-full bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-multiply bg-[#2A7649]" />
      </div>

      {/* --- MOBILE: FULL BLEED HEADER (HIDDEN ON DESKTOP) --- */}
      <div className="md:hidden w-full h-[35vh] bg-gradient-to-br from-[#1a5130] via-[#2A7649] to-[#348A54] relative flex flex-col items-center justify-center -mb-8 z-0">
        {/* Mobile Background Pattern */}
        <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay pointer-events-none" />
        
        {/* Mobile Logo & Welcome */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg mb-3">
            <LeafIcon className="w-8 h-8 text-white drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-extrabold font-['Noto_Sans_Arabic'] text-white drop-shadow-md text-center" dir="ltr">
            خوش آمدید
          </h1>
          <p className="text-sm font-medium text-green-100 font-['Noto_Sans_Arabic'] mt-1 tracking-wide" dir="ltr">
            ڈھوک حسو کنیکٹ
          </p>
        </div>
      </div>

      {/* Main Form Area */}
      <div className="px-6 md:px-10 pt-10 pb-12 bg-white flex-1 flex flex-col relative z-10 rounded-t-[32px] md:rounded-t-none md:rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none">
        
        {/* Desktop Heading */}
        <div className="hidden md:block text-center mb-10 relative z-20">
          <h1 className="text-2xl font-extrabold font-['Noto_Sans_Arabic'] text-slate-900 drop-shadow-sm">
            ڈی ایچ کنیکٹ پورٹل - لاگ ان
          </h1>
        </div>
        
        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email / Phone Field */}
          <div className="space-y-0">
            <DualLabel en="Email or Phone Number" ur="ای میل یا فون نمبر" />
            <div dir="ltr">
              <AppInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or Phone Number"
                leadingIcon={<UserIcon className="w-4 h-4" />}
                className="!rounded-full !ps-10 bg-slate-50 border-slate-200 text-sm font-medium text-left"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-0">
            <DualLabel en="Password" ur="پاس ورڈ" />
            <div dir="ltr">
              <AppInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leadingIcon={<Lock className="w-4 h-4" />}
                className="!rounded-full !ps-10 bg-slate-50 border-slate-200 font-medium tracking-widest text-left"
              />
            </div>
          </div>

          {/* Login Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#348A54] hover:bg-[#2A7649] text-white rounded-full py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all font-['Noto_Sans_Arabic']"
              dir="ltr"
            >
              لاگ ان کریں
            </button>
          </div>

          {/* Forgot Password */}
          <div className="text-center mt-2">
            <button
              type="button"
              onClick={onNavigateToForgotPassword}
              className="text-xs font-bold text-slate-600 hover:text-[#348A54] transition-colors font-['Noto_Sans_Arabic']"
              dir="ltr"
            >
              پاس ورڈ بھول گئے؟ Forgot Password?
            </button>
          </div>
        </form>

        {/* OR Divider */}
        <div className="flex items-center my-6 opacity-60">
          <div className="flex-1 h-px bg-slate-300"></div>
          <span className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">OR</span>
          <div className="flex-1 h-px bg-slate-300"></div>
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-full py-3 text-sm font-bold shadow-sm hover:shadow transition-all font-['Noto_Sans_Arabic'] flex items-center justify-center gap-2"
          dir="ltr"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google سے لاگ ان کریں
        </button>

        {/* Create Account link */}
        <div className="text-center mt-8 pb-4 flex-1 flex flex-col justify-end">
          <button
            onClick={onNavigateToSignup}
            className="text-lg font-bold text-[#348A54] hover:underline cursor-pointer font-['Noto_Sans_Arabic']"
            dir="ltr"
          >
            نیا اکاؤنٹ بنائیں
          </button>
        </div>

        {/* Admin Portal Gateway (Added below login flow) */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            onClick={() => {
              window.history.pushState({}, '', '/admin');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#348A54] font-bold transition-all font-['Noto_Sans_Arabic']"
            dir="ltr"
          >
            <ShieldCheck className="w-4 h-4" />
            ایڈمن پینل (Admin Panel)
          </button>
        </div>
      </div>
    </div>
  );
}
