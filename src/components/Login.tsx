/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, Globe } from 'lucide-react';
import { Language, User } from '../types';
import { translations } from '../translations';
import { supabase, isSupabaseConfigured, dbGetUserProfile } from '../utils/supabaseClient';
import { AppInput, AppButton, AppDivider } from './ui';

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
  const t = translations[currentLanguage];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email?.trim()) {
      setError(currentLanguage === 'en' ? 'Email address is required' : 'ای میل ایڈریس درج کرنا ضروری ہے');
      return;
    }
    // Simple email verification
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(currentLanguage === 'en' ? 'Please enter a valid email address' : 'براہ کرم ایک درست ای میل ایڈریس درج کریں');
      return;
    }
    if (!password) {
      setError(currentLanguage === 'en' ? 'Password is required' : 'پاس ورڈ درج کرنا ضروری ہے');
      return;
    }
    
    setError('');

    if (!isSupabaseConfigured || !supabase) {
      setError(currentLanguage === 'en' 
        ? 'Supabase is not configured. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' 
        : 'سپی بیس کنفیگر نہیں ہے۔ براہ کرم اپنے انوائرمنٹ میں NEXT_PUBLIC_SUPABASE_URL اور NEXT_PUBLIC_SUPABASE_ANON_KEY شامل کریں۔'
      );
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
        setError(currentLanguage === 'en' ? 'User not found' : 'صارف نہیں ملا');
        return;
      }

      // Fetch user profile from profiles table
      const profile = await dbGetUserProfile(data.user.id);

      // If the profile doesn't exist in the database, the account has been deleted by an admin.
      // Sign out the auth session and show an appropriate error message.
      if (!profile) {
        await supabase.auth.signOut();
        setError(
          currentLanguage === 'en'
            ? 'Your account no longer exists. Please contact the administrator.'
            : 'آپ کا اکاؤنٹ موجود نہیں۔ براہ کرم منتظم سے رابطہ کریں۔'
        );
        return;
      }
      
      const loggedInUser: User = {
        id: data.user.id,
        fullName: profile.fullName || data.user.user_metadata?.fullName || 'Local Resident',
        email: email,
        area: profile.area || data.user.user_metadata?.area || 'Dhoke Hassu',
        mobileNumber: profile.mobileNumber || undefined,
        verified: profile.verified || false
      };

      onLoginSuccess(loggedInUser);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during login.");
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError(currentLanguage === 'en' ? 'Supabase is not configured.' : 'سپی بیس کنفیگر نہیں ہے۔');
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
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
      {/* Top Banner Accent */}
      <div className="h-2 bg-primary w-full" />
      
      <div className="p-8">
        {/* Language Selection Bar inside login card for easy discovery */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Rawalpindi Live</span>
          </div>
          <button
            onClick={() => onLanguageChange(currentLanguage === 'en' ? 'ur' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-full font-semibold transition-all duration-200"
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            {t.languageToggle}
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-50 text-primary rounded-2xl mb-3">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight tracking-tight">
            {t.appName}
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 px-4">
            {t.appSlogan}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800">
            {t.loginTitle}
          </h2>
          <p className="text-xs text-slate-500">
            {t.loginSubtitle}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2 animate-shake">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Address Field */}
          <AppInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.mobilePlaceholder}
            label={t.mobileNumber}
            leadingIcon={<Mail className="w-4 h-4" />}
          />

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-700">
                {t.password}
              </label>
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                className="text-xs text-primary font-semibold hover:underline cursor-pointer"
              >
                {t.forgotPassword}
              </button>
            </div>
            <AppInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              leadingIcon={<Lock className="w-4 h-4" />}
            />
          </div>

          {/* Login Button */}
          <AppButton type="submit" className="w-full">
            {t.loginBtn}
          </AppButton>
        </form>

        {/* Divider */}
        <AppDivider label="Or" className="my-6" />

        {/* Google Login Button */}
        <AppButton
          type="button"
          onClick={handleGoogleSignIn}
          variant="outline"
          className="w-full mb-3.5"
          leftIcon={
            <svg className="w-4 h-4 me-1 animate-pulse-once" viewBox="0 0 24 24">
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
          }
        >
          {t.continueWithGoogle}
        </AppButton>

        {/* Create Account Button */}
        <AppButton
          onClick={onNavigateToSignup}
          variant="outline"
          className="w-full"
        >
          {t.createAccount}
        </AppButton>

        {/* Extra notice for community reassurance */}
        <p className="text-[10px] text-center text-slate-400 mt-6 leading-relaxed">
          This service is designed specifically for residents of Rawalpindi (Dhoke Hassu, Dhoke Khabba, Satellite Town, etc.) to foster local harmony.
        </p>

        {/* Admin Portal Gateway */}
        <div className="mt-4 pt-4 border-t border-slate-100 text-center">
          <button
            onClick={() => {
              window.history.pushState({}, '', '/admin');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-primary font-bold transition-all"
          >
            🛡️ {currentLanguage === 'en' ? 'Administrative Access Portal' : 'انتظامی رسائی کنٹرول'}
          </button>
        </div>
      </div>
    </div>
  );
}
