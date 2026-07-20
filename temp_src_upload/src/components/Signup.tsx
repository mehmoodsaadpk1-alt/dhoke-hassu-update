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
          redirectTo: `${window.location.origin}/`
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
      {/* Action green accent banner to differentiate signup visually */}
      <div className="h-2 bg-action w-full" />

      <div className="p-8">
        {/* Language & Info bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-action" />
            <span>Secure Signup</span>
          </div>
          <button
            onClick={() => onLanguageChange(currentLanguage === 'en' ? 'ur' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-full font-semibold transition-all duration-200"
          >
            <Globe className="w-3.5 h-3.5 text-action" />
            {t.languageToggle}
          </button>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            {t.signupTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t.signupSubtitle}
          </p>
        </div>

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
            <svg className="w-4 h-4 mr-2.5" viewBox="0 0 24 24">
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
