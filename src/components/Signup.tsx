/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DateOfBirthPicker } from './DateOfBirthPicker';
import { Mail, Lock, User, MapPin, Globe, CheckCircle, ShieldCheck, Calendar } from 'lucide-react';
import { Language, User as UserType, Gender } from '../types';
import { translations } from '../translations';
import { supabase, isSupabaseConfigured, dbSaveUserProfile } from '../utils/supabaseClient';
import { AppInput, AppSelect, AppButton, AppDivider } from './ui';
import { validateDemographics } from '../utils/demographics';

interface SignupProps {
  onSignupSuccess: (user: UserType) => void;
  onNavigateToLogin: () => void;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function Signup({
  onSignupSuccess,
  onNavigateToLogin,
  currentLanguage,
  onLanguageChange
}: SignupProps) {
  const t = translations[currentLanguage];
  
  // States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [area, setArea] = useState('Dhoke Hassu');
  const [gender, setGender] = useState<Gender | ''>('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!fullName?.trim()) {
      setError(currentLanguage === 'en' ? 'Full name is required' : 'پورا نام درج کرنا ضروری ہے');
      return;
    }
    if (!email?.trim()) {
      setError(currentLanguage === 'en' ? 'Email address is required' : 'ای میل ایڈریس درج کرنا ضروری ہے');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(currentLanguage === 'en' ? 'Please enter a valid email address' : 'براہ کرم ایک درست ای میل ایڈریس درج کریں');
      return;
    }
    if (!password) {
      setError(currentLanguage === 'en' ? 'Password is required' : 'پاس ورڈ درج کرنا ضروری ہے');
      return;
    }
    if (password.length < 6) {
      setError(currentLanguage === 'en' ? 'Password must be at least 6 characters' : 'پاس ورڈ کم از کم 6 ہندسوں کا ہونا چاہیے');
      return;
    }
    if (password !== confirmPassword) {
      setError(currentLanguage === 'en' ? 'Passwords do not match' : 'پاس ورڈز میچ نہیں ہو رہے');
      return;
    }
    if (!area) {
      setError(currentLanguage === 'en' ? 'Please select your residential area' : 'براہ کرم اپنا رہائشی علاقہ منتخب کریں');
      return;
    }

    // Demographics validation
    const demoVal = validateDemographics(gender, dateOfBirth, currentLanguage);
    if (!demoVal.isValid) {
      setError(demoVal.error || 'Validation failed');
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
      const { data, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            fullName: fullName,
            area: area,
            gender: gender,
            dateOfBirth: dateOfBirth
          }
        }
      });

      if (authError) {
        if (authError.message?.toLowerCase().includes('already registered')) {
          console.log("[Signup Audit] Email already exists in auth.users. Attempting auto-recovery for missing profile.");
          // Attempt to log them in with the provided password
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
          });

          if (signInError || !signInData.user) {
            setError(currentLanguage === 'en' ? 'User already registered but incorrect password provided. Please log in.' : 'یہ ای میل پہلے سے موجود ہے۔ براہ کرم درست پاس ورڈ کے ساتھ لاگ ان کریں۔');
            return;
          }

          console.log("[Signup Audit] Auto-recovery: Sign in successful. Checking profiles table...");
          const existingProfile = await dbGetUserProfile(signInData.user.id);
          
          if (!existingProfile) {
            console.log("[Signup Audit] Auto-recovery: No profile found. Recreating profile row now...");
            const recoveredProfile: UserType = {
              id: signInData.user.id,
              fullName: fullName,
              email: email,
              area: area,
              gender: gender as Gender,
              dateOfBirth: dateOfBirth,
              joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              reputationScore: 100,
              verified: false
            };
            await dbSaveUserProfile(recoveredProfile);
            setSuccessMsg(currentLanguage === 'en' ? 'Profile recovered successfully! Logging you in...' : 'پروفائل کامیابی سے بحال ہو گئی! آپ کو لاگ ان کیا جا رہا ہے...');
            setTimeout(() => {
              onSignupSuccess(recoveredProfile);
            }, 1500);
            return;
          } else {
            console.log("[Signup Audit] Auto-recovery: Profile already exists. Just logging them in.");
            setSuccessMsg(currentLanguage === 'en' ? 'Account exists! Logging you in...' : 'اکاؤنٹ موجود ہے! لاگ ان کیا جا رہا ہے...');
            setTimeout(() => {
              onSignupSuccess(existingProfile);
            }, 1500);
            return;
          }
        } else {
          setError(authError.message);
          return;
        }
      }

      if (!data.user) {
        setError(currentLanguage === 'en' ? 'Signup failed. User not created.' : 'رجسٹریشن ناکام ہو گئی۔ صارف نہیں بنایا جا سکا۔');
        return;
      }

      // Automatically create matching record in profiles table for new signups
      const profileData: UserType = {
        id: data.user.id,
        fullName: fullName,
        email: email,
        area: area,
        gender: gender as Gender,
        dateOfBirth: dateOfBirth,
        joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        reputationScore: 100,
        verified: false
      };

      const saved = await dbSaveUserProfile(profileData);
      if (!saved) {
        console.warn("Could not write user profile to the public.profiles database table.");
      }

      setSuccessMsg(currentLanguage === 'en' ? 'Account created successfully! Logging you in...' : 'اکاؤنٹ کامیابی سے بن گیا ہے! آپ کو لاگ ان کیا جا رہا ہے...');
      
      setTimeout(() => {
        onSignupSuccess(profileData);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during registration.");
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
        <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center mt-6">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-lg mb-2">
            <svg className="w-6 h-6 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C7.03 2 3 6.03 3 11V22H14C18.97 22 23 17.97 23 13C23 8.03 18.97 2 12 2ZM19 13C19 15.76 16.76 18 14 18H7V11C7 8.24 9.24 6 12 6C14.76 6 17 8.24 17 11V13C17 14.1 16.1 15 15 15C13.9 15 13 14.1 13 13V11H11V13C11 15.21 12.79 17 15 17C17.21 17 19 15.21 19 13V11C19 9.34 17.66 8 16 8C14.34 8 13 9.34 13 11V14.5C13 15.33 12.33 16 11.5 16C10.67 16 10 15.33 10 14.5V11C10 7.69 12.69 5 16 5C19.86 5 23 8.14 23 12V13Z" />
              <path d="M17.42 2.58C17.24 2.58 17.06 2.59 16.89 2.61C18.57 3.55 19.89 5.05 20.57 6.86C20.85 6.09 21 5.27 21 4.42C21 3.51 20.8 2.64 20.45 1.84C19.57 2.31 18.53 2.58 17.42 2.58Z" opacity="0.3"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold font-['Noto_Sans_Arabic'] text-white drop-shadow-md text-center" dir="ltr">
            اکاؤنٹ بنائیں
          </h1>
          <p className="text-xs font-medium text-green-100 font-['Noto_Sans_Arabic'] tracking-wide" dir="ltr">
            راولپنڈی کے مقامی نیٹ ورک میں شامل ہوں
          </p>
        </div>
      </div>

      {/* Main Form Area */}
      <div className="px-6 md:px-10 pt-10 pb-12 bg-white flex-1 flex flex-col relative z-10 rounded-t-[32px] md:rounded-t-none md:rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none">
        
        {/* Desktop Heading */}
        <div className="hidden md:block text-center mb-8 relative z-20">
          <h1 className="text-2xl font-extrabold font-['Noto_Sans_Arabic'] text-slate-900 drop-shadow-sm">
            {currentLanguage === 'en' ? 'Create an Account' : 'اکاؤنٹ بنائیں'}
          </h1>
          <p className="text-sm font-medium opacity-90 text-slate-500 mt-2 font-['Noto_Sans_Arabic']" dir="ltr">
            {currentLanguage === 'en' ? 'Join Dhoke Hassu Connect' : 'ڈھوک حسو کنیکٹ میں شامل ہوں'}
          </p>
        </div>

        {/* Language & Info bar (Desktop only) */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#308B54]" />
            <span>Secure Signup</span>
          </div>
          <button
            onClick={() => onLanguageChange(currentLanguage === 'en' ? 'ur' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-full font-semibold transition-all duration-200"
            type="button"
          >
            <Globe className="w-3.5 h-3.5 text-[#308B54]" />
            {currentLanguage === 'en' ? '(اردو)' : '(English)'}
          </button>
        </div>

        {/* Mobile Language toggle absolute position */}
        <button
          onClick={() => onLanguageChange(currentLanguage === 'en' ? 'ur' : 'en')}
          className="md:hidden absolute top-4 end-4 flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[10px] rounded-full font-semibold transition-all duration-200 z-50 backdrop-blur-md"
          type="button"
        >
          <Globe className="w-3 h-3" />
          {currentLanguage === 'en' ? 'اردو' : 'EN'}
        </button>

        {/* Success/Error Alerts */}
        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-action" />
            {successMsg}
          </div>
        )}

        {/* SIGNUP FORM */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Full Name */}
          <AppInput
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t.fullNamePlaceholder}
            label={t.fullName}
            leadingIcon={<User className="w-4 h-4" />}
          />

          {/* Email Address */}
          <AppInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.mobilePlaceholder}
            label={t.mobileNumber}
            leadingIcon={<Mail className="w-4 h-4" />}
          />

          {/* Area Dropdown */}
          <AppSelect
            value={area}
            onChange={(e) => setArea(e.target.value)}
            label={t.selectArea}
            leadingIcon={<MapPin className="w-4 h-4" />}
          >
            <option value="Dhoke Hassu">{t.areaDhokeHassu}</option>
            <option value="Dhoke Khabba">{t.areaDhokeKhabba}</option>
            <option value="Satellite Town">{t.areaSatelliteTown}</option>
            <option value="Other">{t.areaOther}</option>
          </AppSelect>

          {/* Gender Dropdown */}
          <AppSelect
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            label={t.gender}
            leadingIcon={<User className="w-4 h-4" />}
            requiredIndicator
          >
            <option value="" disabled>{t.selectGender}</option>
            <option value="Male">{t.genderMale}</option>
            <option value="Female">{t.genderFemale}</option>
            <option value="Prefer not to say">{t.genderPreferNotToSay}</option>
          </AppSelect>

          {/* Date of Birth Picker using native component */}
          <DateOfBirthPicker
            value={dateOfBirth}
            onChange={setDateOfBirth}
            label={t.dateOfBirth}
          />

          {/* Password */}
          <AppInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.passwordPlaceholder}
            label={t.password}
            leadingIcon={<Lock className="w-4 h-4" />}
          />

          {/* Confirm Password */}
          <AppInput
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t.confirmPasswordPlaceholder}
            label={t.confirmPassword}
            leadingIcon={<Lock className="w-4 h-4" />}
          />

          {/* Submit Button */}
          <AppButton type="submit" variant="success" className="w-full">
            {t.signupBtn}
          </AppButton>
        </form>

        {/* Divider */}
        <AppDivider label="Or" className="my-5" />

        {/* Google Signup Button */}
        <AppButton
          type="button"
          onClick={handleGoogleSignIn}
          variant="outline"
          className="w-full"
          leftIcon={
            <svg className="w-4 h-4 me-2.5" viewBox="0 0 24 24">
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

        {/* Back to Login link */}
        <div className="text-center mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={onNavigateToLogin}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            {t.alreadyHaveAccount}
          </button>
        </div>
      </div>
    </div>
  );
}
