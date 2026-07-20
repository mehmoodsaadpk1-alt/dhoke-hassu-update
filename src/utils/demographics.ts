/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function calculateAge(dobString?: string): number {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function getAgeGroup(age: number): string {
  if (age <= 0) return 'Unknown';
  if (age <= 17) return '13–17';
  if (age <= 24) return '18–24';
  if (age <= 34) return '25–34';
  if (age <= 44) return '35–44';
  if (age <= 54) return '45–54';
  if (age <= 64) return '55–64';
  return '65+';
}

export function validateDemographics(
  gender?: string, 
  dobString?: string, 
  lang: 'en' | 'ur' = 'en'
): { isValid: boolean; error: string | null } {
  const isEn = lang === 'en';
  
  if (!gender) {
    return { 
      isValid: false, 
      error: isEn ? 'Gender is required' : 'جنس منتخب کرنا لازمی ہے' 
    };
  }
  if (!['Male', 'Female', 'Prefer not to say'].includes(gender)) {
    return { 
      isValid: false, 
      error: isEn ? 'Invalid gender option selected' : 'غلط صنف منتخب کی گئی ہے' 
    };
  }
  if (!dobString) {
    return { 
      isValid: false, 
      error: isEn ? 'Date of birth is required' : 'تاریخ پیدائش درج کرنا لازمی ہے' 
    };
  }
  
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) {
    return { 
      isValid: false, 
      error: isEn ? 'Invalid date format' : 'غلط تاریخ کی شکل' 
    };
  }
  
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dobDateOnly = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
  
  if (dobDateOnly.getTime() === todayDateOnly.getTime()) {
    return { 
      isValid: false, 
      error: isEn ? 'Date of birth cannot be today' : 'تاریخ پیدائش آج کی نہیں ہو سکتی' 
    };
  }
  if (dobDateOnly > todayDateOnly) {
    return { 
      isValid: false, 
      error: isEn ? 'Date of birth cannot be in the future' : 'تاریخ پیدائش مستقبل کی نہیں ہو سکتی' 
    };
  }
  
  const age = calculateAge(dobString);
  if (age === 0 && dobString !== "") {
    return { 
      isValid: false, 
      error: isEn ? 'Could not calculate age' : 'عمر کا حساب نہیں لگایا جا سکا' 
    };
  }
  if (age < 0) {
    return { 
      isValid: false, 
      error: isEn ? 'Date of birth cannot be in the future' : 'تاریخ پیدائش مستقبل کی نہیں ہو سکتی' 
    };
  }
  if (age > 120) {
    return { 
      isValid: false, 
      error: isEn ? 'Maximum age allowed is 120 years' : 'زیادہ سے زیادہ عمر 120 سال ہو سکتی ہے' 
    };
  }
  
  return { isValid: true, error: null };
}
