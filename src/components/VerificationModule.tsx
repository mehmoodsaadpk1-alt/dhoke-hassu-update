/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  UserCheck, 
  Store, 
  Building, 
  ArrowLeft, 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Info, 
  Sparkles,
  Award,
  ChevronRight,
  Shield,
  HelpCircle,
  FileCheck2,
  Lock,
  Eye,
  Trash2,
  RefreshCw,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { Language, User } from '../types';
import { addVerifiedEntity, removeVerifiedEntity } from '../utils/verification';
import {
  isSupabaseConfigured,
  dbGetVerificationRequests,
  dbSaveVerificationRequest
} from '../utils/supabaseClient';

// Verification application request structure
export interface VerificationRequest {
  id: string;
  type: 'User' | 'Business' | 'Organization';
  name: string;
  contactNumber: string;
  email: string;
  area: string;
  supportingDocument: string; // File URL or base64
  additionalNotes?: string;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected';
  applicationDate: string;
  lastUpdated: string;
  adminRemarks?: string;
}

interface VerificationModuleProps {
  currentLanguage: Language;
  currentPath: string;
  navigate: (path: string, paramId?: string) => void;
  currentUser: User;
  onUpdateUser: (updated: User) => void;
}

const LOCAL_AREAS = [
  'Dhoke Hassu',
  'Pirwadhai',
  'Satellite Town',
  'Dhoke Khabba',
  'Kashmir Road',
  'Saddar',
  'Chungi No. 22',
  'Faizabad'
];

const PRESETS = {
  en: {
    title: 'Verification Center',
    subtitle: 'Build community trust, verify your identity, and get your official blue badge.'
  },
  ur: {
    title: 'تصدیق کا مرکز',
    subtitle: 'کمیونٹی کا اعتماد حاصل کریں، اپنی شناخت کی تصدیق کریں، اور آفیشل نیلا بیج حاصل کریں۔'
  }
};

const translations = {
  en: {
    verificationCenter: 'Verification Center',
    subtitle: 'Build community trust, verify your identity, and get your official blue badge.',
    benefitsTitle: 'Benefits of Verification',
    benefitsDesc: 'Why you should get your profile or business verified:',
    benefit1Title: 'Official Blue Badge',
    benefit1Desc: 'Displays a verified badge on your posts, comments, profile, and listings.',
    benefit2Title: 'Higher Visibility',
    benefit2Desc: 'Verified listings rank higher in searches, jobs, and marketplace results.',
    benefit3Title: 'Stronger Credibility',
    benefit3Desc: 'Builds ultimate trust with neighbors, customers, and partners in Dhoke Hassu.',
    benefit4Title: 'Advanced Safety',
    benefit4Desc: 'Reduces impersonation risk and proves you are an active, real community member.',
    benefit5Title: 'Priority Support',
    benefit5Desc: 'Get fast responses on issues, reports, and community support tickets.',
    
    typesTitle: 'Verification Types Available',
    typeUser: 'User / Resident',
    typeUserDesc: 'For individual citizens, community organizers, and volunteers of Dhoke Hassu.',
    typeBusiness: 'Local Business',
    typeBusinessDesc: 'For shopkeepers, contractors, vendors, and business owners to verify their enterprise.',
    typeOrg: 'Organization / Institution',
    typeOrgDesc: 'For local mosques, sports leagues, NGOs, and Union Council offices.',
    
    myStatusTitle: 'My Verification Status',
    applyButton: 'Apply for Verification',
    viewStatusButton: 'Track Application Status',
    noActiveRequest: 'You do not have any active verification requests.',
    activeRequestPending: 'You have an active request pending review.',
    verifiedSuccess: 'Congratulations! Your account is officially verified.',
    
    // Application Form
    applyTitle: 'Submit Verification Request',
    formType: 'Verification Type',
    formName: 'Full Name / Business Name',
    formContact: 'Contact Number',
    formEmail: 'Email Address',
    formArea: 'Select Zone / Area',
    formDoc: 'Supporting Documents (CNIC / Business License / Utility Bill)',
    formNotes: 'Additional Notes / Explanation (Optional)',
    dragDropText: 'Drag and drop an image here, or click to select a file',
    submitBtn: 'Submit Verification Request',
    submitting: 'Submitting application...',
    successSubmit: 'Application submitted successfully!',
    
    // Status Page
    statusTitle: 'Verification Tracking',
    appDate: 'Application Date',
    lastUpdated: 'Last Updated',
    adminRemarks: 'Admin Remarks & Feedback',
    statusPending: 'Pending',
    statusReview: 'Under Review',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
    historyTitle: 'Verification History',
    noHistory: 'No previous verification attempts found.',
    backToCenter: 'Back to Verification Center',
    
    // Sandbox / Simulator
    sandboxTitle: 'Developer Testing Sandbox (Admin Actions Simulator)',
    sandboxDesc: 'Dhoke Hassu Connect admins typically process these requests. Use these buttons to simulate admin decisions instantly and test badge placement:',
    simApprove: 'Simulate Admin Approval',
    simReject: 'Simulate Admin Rejection',
    simReview: 'Set to "Under Review"',
    simReset: 'Reset & Delete Request'
  },
  ur: {
    verificationCenter: 'تصدیق کا مرکز',
    subtitle: 'کمیونٹی کا اعتماد حاصل کریں، اپنی شناخت کی تصدیق کریں، اور آفیشل نیلا بیج حاصل کریں۔',
    benefitsTitle: 'تصدیق کے فوائد',
    benefitsDesc: 'آپ کو اپنا پروفائل یا کاروبار کیوں تصدیق کروانا چاہئے:',
    benefit1Title: 'آفیشل نیلا بیج',
    benefit1Desc: 'آپ کی پوسٹس، تبصروں، پروفائل، اور لسٹنگز پر تصدیق شدہ کا بیج دکھاتا ہے۔',
    benefit2Title: 'بہتر اور زیادہ نمائش',
    benefit2Desc: 'تصدیق شدہ لسٹنگز سرچ، نوکریوں اور مارکیٹ پلیس میں اوپر نظر آتی ہیں۔',
    benefit3Title: 'اعلیٰ ساکھ اور بھروسہ',
    benefit3Desc: 'ڈھوک حسو کے پڑوسیوں، گاہکوں اور شراکت داروں کے ساتھ بہترین اعتماد قائم کریں۔',
    benefit4Title: 'اعلیٰ درجے کی حفاظت',
    benefit4Desc: 'جعلی پروفائلز کا خطرہ ختم کرتا ہے اور ثابت کرتا ہے کہ آپ ایک حقیقی شہری ہیں۔',
    benefit5Title: 'ترجیحی سپورٹ',
    benefit5Desc: 'کمیونٹی کے مسائل، شکایات اور سپورٹ کے معاملات پر فوری جواب پائیں۔',
    
    typesTitle: 'دستیاب تصدیق کی اقسام',
    typeUser: 'شہری / رہائشی',
    typeUserDesc: 'ڈھوک حسو کے انفرادی شہریوں، کمیونٹی کے منتظمین اور رضا کاروں کے لیے۔',
    typeBusiness: 'مقامی کاروبار',
    typeBusinessDesc: 'دکانداروں، ٹھیکیداروں، اور کاروباری مالکان کے لیے اپنے ادارے کی تصدیق کے لیے۔',
    typeOrg: 'ادارہ / تنظیم',
    typeOrgDesc: 'مقامی مساجد، اسپورٹس لیگز، این جی اوز، اور یونین کونسل کے دفاتر کے لیے۔',
    
    myStatusTitle: 'میری تصدیق کی صورتحال',
    applyButton: 'تصدیق کے لیے درخواست دیں',
    viewStatusButton: 'درخواست کی صورتحال دیکھیں',
    noActiveRequest: 'آپ کی کوئی تصدیقی درخواست فعال نہیں ہے۔',
    activeRequestPending: 'آپ کی درخواست فی الحال زیرِ جائزہ ہے۔',
    verifiedSuccess: 'مبارک ہو! آپ کا اکاؤنٹ آفیشل طور پر تصدیق شدہ ہے۔',
    
    // Application Form
    applyTitle: 'تصدیق کی درخواست جمع کروائیں',
    formType: 'تصدیق کی قسم',
    formName: 'پورا نام / کاروباری نام',
    formContact: 'رابطہ نمبر',
    formEmail: 'ای میل ایڈریس',
    formArea: 'زون / علاقہ منتخب کریں',
    formDoc: 'معاون دستاویزات (CNIC / شناختی کارڈ / بزنس لائسنس / یوٹیلٹی بل)',
    formNotes: 'اضافی معلومات (اختیاری)',
    dragDropText: 'یہاں تصویر ڈریگ کریں، یا فائل منتخب کرنے کے لیے کلک کریں',
    submitBtn: 'درخواست جمع کروائیں',
    submitting: 'درخواست جمع کی جا رہی ہے...',
    successSubmit: 'درخواست کامیابی کے ساتھ جمع ہو گئی ہے!',
    
    // Status Page
    statusTitle: 'تصدیق کی ٹریکنگ',
    appDate: 'درخواست کی تاریخ',
    lastUpdated: 'آخری بار اپ ڈیٹ',
    adminRemarks: 'ایڈمن کے ریمارکس اور فیڈ بیک',
    statusPending: 'زیر التوا',
    statusReview: 'زیرِ جائزہ',
    statusApproved: 'منظور شدہ',
    statusRejected: 'مسترد شدہ',
    historyTitle: 'تصدیق کی ہسٹری',
    noHistory: 'پہلے کی کوئی تصدیقی درخواستیں نہیں ملی۔',
    backToCenter: 'واپس تصدیق کے مرکز پر جائیں',
    
    // Sandbox / Simulator
    sandboxTitle: 'ڈویلپر ٹیسٹنگ سینڈ باکس (ایڈمن ایکشن سیمولیٹر)',
    sandboxDesc: 'ڈھوک حسو کنیکٹ کے ایڈمنز عام طور پر ان درخواستوں پر فیصلہ کرتے ہیں۔ بیج اور تصدیقی عمل کی جانچ کے لیے فوری طور پر ایڈمن کے فیصلوں کو سیمولیٹ کریں:',
    simApprove: 'تصدیق منظور کریں',
    simReject: 'تصدیق مسترد کریں',
    simReview: '"زیرِ جائزہ" پر سیٹ کریں',
    simReset: 'درخواست ری سیٹ اور ڈیلیٹ کریں'
  }
};

function generateUUID() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const MOCK_DOCS = [
  { name: 'CNIC Front & Back Mockup', url: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400' },
  { name: 'Trade Registration License', url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=400' },
  { name: 'Sui Gas Utility Bill Verification', url: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&q=80&w=400' }
];

export default function VerificationModule({
  currentLanguage,
  currentPath,
  navigate,
  currentUser,
  onUpdateUser
}: VerificationModuleProps) {
  const isUr = currentLanguage === 'ur';
  const t = translations[currentLanguage];

  // Load and save verification requests in localStorage
  const [requests, setRequests] = useState<VerificationRequest[]>(() => {
    try {
      const saved = localStorage.getItem('dhoke_connect_verification_requests');
      if (saved) {
        const parsed: any[] = JSON.parse(saved);
        return parsed.filter(r => r.user_id === currentUser.id);
      }
    } catch {}
    return [];
  });

  const saveRequests = (updatedRequests: VerificationRequest[]) => {
    setRequests(updatedRequests);
    try {
      const saved = localStorage.getItem('dhoke_connect_verification_requests') || '[]';
      const fullList: any[] = JSON.parse(saved);
      const filtered = fullList.filter(r => r.user_id !== currentUser.id);
      const merged = [...filtered, updatedRequests.map(r => ({ ...r, user_id: currentUser.id }))];
      localStorage.setItem('dhoke_connect_verification_requests', JSON.stringify(merged.flat()));
    } catch (err) {
      console.warn('Status saving requests:', err);
    }
    if (isSupabaseConfigured) {
      updatedRequests.forEach(r => {
        dbSaveVerificationRequest({ ...r, user_id: currentUser.id });
      });
    }
  };

  // Synchronize verification requests with Supabase if configured
  React.useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function fetchRequests() {
      try {
        const fetched = await dbGetVerificationRequests([], currentUser.id);
        setRequests(fetched);
        
        // Auto-heal: if we find an approved request in database but profile verified is false
        if (fetched.some(r => r.status === 'Approved') && !currentUser.verified) {
          onUpdateUser({ ...currentUser, verified: true });
        }
      } catch (err) {
        console.warn("Status loading verification requests from Supabase:", err);
      }
    }

    fetchRequests();
  }, [currentUser.id, currentUser.verified]);

  // General auto-heal for local/state changes
  React.useEffect(() => {
    if (requests.some(r => r.status === 'Approved') && !currentUser.verified) {
      onUpdateUser({ ...currentUser, verified: true });
    }
  }, [requests, currentUser.verified]);

  // If user is verified, map any pending/under-review requests to Approved status for UI rendering
  const processedRequests = requests.map(r => {
    if (currentUser.verified && (r.status === 'Pending' || r.status === 'Under Review')) {
      return { ...r, status: 'Approved' as const };
    }
    return r;
  });

  // Find if there is an active request (Pending or Under Review)
  const activeRequest = processedRequests.find(r => r.status === 'Pending' || r.status === 'Under Review');
  const pastRequests = processedRequests.filter(r => r.status === 'Approved' || r.status === 'Rejected');

  // Form states
  const [formType, setFormType] = useState<'User' | 'Business' | 'Organization'>('User');
  const [formName, setFormName] = useState(currentUser.fullName || '');
  const [formContact, setFormContact] = useState(currentUser.mobileNumber || '');
  const [formEmail, setFormEmail] = useState('');
  const [formArea, setFormArea] = useState(currentUser.area || 'Dhoke Hassu');
  const [formDoc, setFormDoc] = useState('');
  const [formNotes, setFormNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // File picker handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormDoc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormDoc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Prevent duplicate submissions if there is already an active request
    if (activeRequest) {
      setFormError(isUr ? 'آپ کی پہلے ہی ایک درخواست زیرِ غور ہے۔' : 'You already have an active verification request under process.');
      return;
    }

    if (!formName?.trim() || !formContact?.trim() || !formEmail?.trim()) {
      setFormError(isUr ? 'براہ کرم تمام لازمی فیلڈز پُر کریں۔' : 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    // Simulate network latency for high-quality feel
    setTimeout(() => {
      const newRequest: VerificationRequest & { user_id: string } = {
        id: generateUUID(),
        user_id: currentUser.id,
        type: formType,
        name: formName,
        contactNumber: formContact,
        email: formEmail,
        area: formArea,
        supportingDocument: formDoc,
        additionalNotes: formNotes,
        status: 'Pending',
        applicationDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      const updated = [newRequest, ...requests];
      saveRequests(updated);
      setIsSubmitting(false);

      // Clear form
      setFormNotes('');
      setFormDoc('');
      
      // Navigate to status page
      navigate('/verification/status');
    }, 1200);
  };

  // Admin Sandbox Simulators
  const simulateStatusChange = (reqId: string, newStatus: 'Pending' | 'Under Review' | 'Approved' | 'Rejected', remarks?: string) => {
    const updated = requests.map(r => {
      if (r.id === reqId) {
        return {
          ...r,
          status: newStatus,
          lastUpdated: new Date().toISOString().split('T')[0],
          adminRemarks: remarks || (newStatus === 'Approved' ? 'Verified by Dhoke Hassu local council administrative committee.' : newStatus === 'Rejected' ? 'Document copy is blur or incomplete.' : undefined)
        };
      }
      return r;
    });

    saveRequests(updated);

    // Find the modified request
    const targetReq = updated.find(r => r.id === reqId);
    if (targetReq) {
      if (newStatus === 'Approved') {
        // Add to verified names list
        addVerifiedEntity(targetReq.name);
        
        // If it's the current user, update their user profile state too!
        if (targetReq.name?.toLowerCase() === currentUser.fullName?.toLowerCase()) {
          const updatedUser = { ...currentUser, verified: true };
          onUpdateUser(updatedUser);
        }
      } else {
        // Remove from verified names list if previously approved
        removeVerifiedEntity(targetReq.name);
        if (targetReq.name?.toLowerCase() === currentUser.fullName?.toLowerCase()) {
          const updatedUser = { ...currentUser, verified: false };
          onUpdateUser(updatedUser);
        }
      }
    }
  };

  const deleteRequest = (reqId: string) => {
    const req = requests.find(r => r.id === reqId);
    if (req) {
      removeVerifiedEntity(req.name);
      if (req.name?.toLowerCase() === currentUser.fullName?.toLowerCase()) {
        const updatedUser = { ...currentUser, verified: false };
        onUpdateUser(updatedUser);
      }
    }
    const filtered = requests.filter(r => r.id !== reqId);
    saveRequests(filtered);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 pb-12" id="verification-system-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {currentPath !== '/verification' && (
              <button 
                onClick={() => navigate('/verification')}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer border-0"
                id="back-to-verification-center-btn"
                title={t.backToCenter}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-blue-600 fill-blue-50/50" />
              {t.verificationCenter}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {t.subtitle}
          </p>
        </div>

        <div className="flex gap-2">
          {currentUser.verified && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-sm">
              <ShieldCheck className="w-4 h-4 text-green-600 fill-current text-white shrink-0" />
              {isUr ? 'آفیشل تصدیق شدہ' : 'Officially Verified'}
            </span>
          )}
        </div>
      </div>

      {/* RENDER VIEW ACCORDING TO PATH */}
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: LANDING CENTER */}
        {currentPath === '/verification' && (
          <motion.div 
            key="landing"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* MY VERIFICATION STATUS CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-4" id="my-verification-status-card">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  {t.myStatusTitle}
                </h3>
              </div>

              {currentUser.verified ? (
                <div className="bg-green-50/60 border border-green-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <ShieldCheck className="w-6 h-6 stroke-2" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {isUr ? 'آپ کا اکاؤنٹ مکمل تصدیق شدہ ہے!' : 'Your Account is Verified!'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {t.verifiedSuccess}
                      </p>
                    </div>
                  </div>
                  
                  {processedRequests.some(r => r.name?.toLowerCase() === currentUser.fullName?.toLowerCase()) ? (
                    <button
                      onClick={() => navigate('/verification/status')}
                      className="w-full sm:w-auto py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                      id="view-verified-app-btn"
                    >
                      {t.viewStatusButton}
                    </button>
                  ) : null}
                </div>
              ) : activeRequest ? (
                <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {t.activeRequestPending}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {isUr ? `درخواست کی قسم: ${activeRequest.type} • جمع کردہ نام: ${activeRequest.name}` : `Type: ${activeRequest.type} • Name submitted: ${activeRequest.name}`}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => navigate('/verification/status')}
                    className="w-full sm:w-auto py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer border-0"
                    id="track-active-app-btn"
                  >
                    {t.viewStatusButton}
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center space-y-3">
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    {t.noActiveRequest}
                  </p>
                  
                  <button
                    onClick={() => navigate('/verification/apply')}
                    className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer border-0"
                    id="apply-for-verification-btn"
                  >
                    {t.applyButton}
                  </button>
                </div>
              )}
            </div>

            {/* BENEFITS SECTION */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-5" id="benefits-section">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500 fill-current" />
                  {t.benefitsTitle}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.benefitsDesc}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50/80 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-blue-600 fill-blue-500" style={{ stroke: 'white' }} />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                      {t.benefit1Title}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      {t.benefit1Desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50/80 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                      {t.benefit2Title}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      {t.benefit2Desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50/80 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                      {t.benefit3Title}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      {t.benefit3Desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50/80 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                      {t.benefit4Title}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      {t.benefit4Desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50/80 transition-colors md:col-span-2">
                  <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                      {t.benefit5Title}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      {t.benefit5Desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* VERIFICATION TYPES GRID */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-5" id="types-section">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-800" />
                  {t.typesTitle}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 hover:bg-slate-100/60 rounded-2xl p-4 border border-slate-150 transition-colors text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-slate-800 text-xs sm:text-sm">
                    {t.typeUser}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed">
                    {t.typeUserDesc}
                  </p>
                </div>

                <div className="bg-slate-50 hover:bg-slate-100/60 rounded-2xl p-4 border border-slate-150 transition-colors text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                    <Store className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-slate-800 text-xs sm:text-sm">
                    {t.typeBusiness}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed">
                    {t.typeBusinessDesc}
                  </p>
                </div>

                <div className="bg-slate-50 hover:bg-slate-100/60 rounded-2xl p-4 border border-slate-150 transition-colors text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-xs">
                    <Building className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-slate-800 text-xs sm:text-sm">
                    {t.typeOrg}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed">
                    {t.typeOrgDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* VERIFICATION HISTORY SECTION */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-4" id="history-section">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-600" />
                  {t.historyTitle}
                </h3>
              </div>

              {pastRequests.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-bold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200" id="empty-history-state">
                  {t.noHistory}
                </div>
              ) : (
                <div className="space-y-3" id="history-requests-list">
                  {pastRequests.map((req) => (
                    <div 
                      key={req.id}
                      className="border border-slate-200/70 rounded-2xl p-4 hover:border-slate-300 bg-white/50 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xs cursor-pointer"
                      onClick={() => navigate('/verification/status')}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            req.type === 'User' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                            req.type === 'Business' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            'bg-purple-50 text-purple-600 border border-purple-100'
                          }`}>
                            {req.type === 'User' ? t.typeUser : req.type === 'Business' ? t.typeBusiness : t.typeOrg}
                          </span>
                          <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                            {req.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 pt-0.5">
                          <span>📍 {req.area}</span>
                          <span>•</span>
                          <span>📅 {req.applicationDate}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${
                          req.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {req.status === 'Approved' ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <XCircle className="w-3.5 h-3.5 text-red-600" />}
                          {req.status === 'Approved' ? t.statusApproved : t.statusRejected}
                        </span>
                        
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        )}

        {/* VIEW 2: APPLY FOR VERIFICATION */}
        {currentPath === '/verification/apply' && (
          <motion.div 
            key="apply"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-6"
          >
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-1.5">
                <Shield className="w-5.5 h-5.5 text-blue-600" />
                {t.applyTitle}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isUr ? 'درخواست فارم پُر کریں اور اپنے آفیشل بیج کے لیے ضروری کاغذات جمع کروائیں۔' : 'Complete the form and submit supporting documents for peer authentication review.'}
              </p>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-700 text-xs font-bold p-3.5 rounded-xl border border-red-200/80 flex items-center gap-2">
                <ShieldAlert className="w-4.5 h-4.5 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type Grid selection */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  {t.formType} *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('User');
                      setFormName(currentUser.fullName);
                    }}
                    className={`py-3 px-2 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      formType === 'User' 
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{t.typeUser}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('Business');
                      setFormName('');
                    }}
                    className={`py-3 px-2 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      formType === 'Business' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>{t.typeBusiness}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('Organization');
                      setFormName('');
                    }}
                    className={`py-3 px-2 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      formType === 'Organization' 
                        ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm' 
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>{t.typeOrg}</span>
                  </button>
                </div>
              </div>

              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  {t.formName} *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder={formType === 'User' ? 'e.g. Sajid Khan' : 'e.g. Al-Hamd General Store'}
                />
              </div>

              {/* Contact number */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  {t.formContact} *
                </label>
                <div className="relative">
                  <Phone className="absolute start-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="w-full ps-10 pe-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="e.g. 0333-1234567"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  {t.formEmail} *
                </label>
                <div className="relative">
                  <Mail className="absolute start-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full ps-10 pe-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="e.g. s.khan@domain.com"
                  />
                </div>
              </div>

              {/* Zone / Area Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  {t.formArea} *
                </label>
                <div className="relative">
                  <MapPin className="absolute start-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                  <select
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    className="w-full ps-10 pe-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                  >
                    {LOCAL_AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Supporting Document section removed by user request */}

              {/* Additional comments */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  {t.formNotes}
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                  placeholder={isUr ? 'تصدیق سے متعلق کوئی اضافی معلومات یہاں لکھیں۔' : 'Explain why this entity should be verified or link any social profiles.'}
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 border-0"
                  id="submit-verification-app-btn"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                      <span>{t.submitting}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 stroke-2" />
                      <span>{t.submitBtn}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/verification')}
                  className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer border-0"
                >
                  {isUr ? 'منسوخ کریں' : 'Cancel'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* VIEW 3: APPLICATION STATUS TRACKING */}
        {currentPath === '/verification/status' && (
          <motion.div 
            key="status"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {processedRequests.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-8 text-center space-y-4" id="empty-status-state">
                <p className="text-sm text-slate-400 font-bold">
                  {t.noActiveRequest}
                </p>
                <button
                  onClick={() => navigate('/verification/apply')}
                  className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer border-0"
                >
                  {t.applyButton}
                </button>
              </div>
            ) : (
              // Show the most recent request status
              (() => {
                const req = processedRequests[0]; // Recent request
                return (
                  <div className="space-y-6" id={`request-details-card-${req.id}`}>
                    
                    {/* STATUS SUMMARY BANNER */}
                    <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-5 relative overflow-hidden">
                      {/* Top status indicator ribbon */}
                      <div className={`absolute top-0 start-0 w-2.5 h-full ${
                        req.status === 'Pending' ? 'bg-yellow-400' :
                        req.status === 'Under Review' ? 'bg-blue-500' :
                        req.status === 'Approved' ? 'bg-green-500' :
                        'bg-red-500'
                      }`} />

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="space-y-1 ps-1">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                            {t.statusTitle}
                          </span>
                          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                            {req.name}
                            
                            {req.status === 'Approved' && (
                              <ShieldCheck className="w-5 h-5 text-blue-600 fill-current text-white shrink-0" />
                            )}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {isUr ? `درخواست کی قسم: ${req.type} • زون: ${req.area}` : `Type: ${req.type} • Zone: ${req.area}`}
                          </p>
                        </div>

                        {/* Status chip */}
                        <div className="shrink-0 ps-1 sm:ps-0">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border ${
                            req.status === 'Pending' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                            req.status === 'Under Review' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            req.status === 'Approved' ? 'bg-green-50 text-green-800 border-green-200' :
                            'bg-red-50 text-red-800 border-red-200'
                          }`}>
                            {req.status === 'Pending' && <Clock className="w-4 h-4 animate-pulse text-yellow-600" />}
                            {req.status === 'Under Review' && <Info className="w-4 h-4 text-blue-600" />}
                            {req.status === 'Approved' && <CheckCircle className="w-4 h-4 text-green-600" />}
                            {req.status === 'Rejected' && <XCircle className="w-4 h-4 text-red-600" />}
                            
                            {req.status === 'Pending' ? t.statusPending : 
                             req.status === 'Under Review' ? t.statusReview : 
                             req.status === 'Approved' ? t.statusApproved : 
                             t.statusRejected}
                          </span>
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-slate-400 font-semibold">{t.appDate}</span>
                          <p className="font-bold text-slate-800">{req.applicationDate}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-slate-400 font-semibold">{t.lastUpdated}</span>
                          <p className="font-bold text-slate-800">{req.lastUpdated}</p>
                        </div>
                      </div>

                      {/* Supporting document preview block */}
                      {req.supportingDocument && (
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <span className="text-xs text-slate-400 font-semibold block">{isUr ? 'جمع کروائی گئی دستاویز:' : 'Submitted Document Copy:'}</span>
                          <div className="h-32 sm:h-44 w-full sm:w-72 rounded-2xl overflow-hidden border border-slate-200 relative group">
                            <img src={req.supportingDocument} alt="Supporting Doc" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="bg-white/90 text-slate-800 text-[10px] font-bold px-3 py-1 rounded-xl shadow-xs flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                {isUr ? 'تفصیل دیکھیں' : 'View Document'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Admin Remarks card */}
                      {req.adminRemarks && (
                        <div className="pt-4 border-t border-slate-150" id="admin-remarks-card">
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                            <div className="absolute top-0 end-0 p-3 text-slate-200">
                              <ShieldCheck className="w-12 h-12" />
                            </div>
                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5 relative z-10">
                              💬 {t.adminRemarks}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold italic relative z-10 whitespace-pre-wrap">
                              "{req.adminRemarks}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>



                    <div className="text-center">
                      <button
                        onClick={() => navigate('/verification')}
                        className="inline-flex items-center gap-1.5 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border-0"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        {t.backToCenter}
                      </button>
                    </div>

                  </div>
                );
              })()
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
