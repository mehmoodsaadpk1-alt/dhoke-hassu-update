import React, { useState } from 'react';
import { X, ShieldAlert, Award, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { tvsSubmitRequest } from '../utils/tvs';
import { User } from '../types';

interface TvsApplicationModalProps {
  currentUser: User;
  currentLanguage: 'en' | 'ur';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (certId: string) => void;
}

export default function TvsApplicationModal({
  currentUser,
  currentLanguage,
  isOpen,
  onClose,
  onSuccess
}: TvsApplicationModalProps) {
  const isEn = currentLanguage === 'en';

  // Form states
  const [entityName, setEntityName] = useState(currentUser.fullName || '');
  const [entityType, setEntityType] = useState<'Individual' | 'Business' | 'Government' | 'NGO' | 'Educational' | 'Healthcare' | 'Journalist' | 'Leader' | 'Public Figure' | 'Emergency'>('Individual');
  const [level, setLevel] = useState<'Basic' | 'Professional' | 'Premium' | 'Gold Trusted'>('Basic');
  const [cnic, setCnic] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ type: string; url: string; expiryDate?: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Simulate file upload, storing mock path inside the secure tvs-secure-docs private bucket
      const securePath = `tvs-secure-docs/applications/${currentUser.id}_${Date.now()}_${file.name}`;
      setAttachedFiles(prev => [...prev, {
        type,
        url: securePath,
        expiryDate: new Date(Date.now() + 365 * 24 * 3600000).toISOString().split('T')[0] // 1 year metadata default
      }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityName.trim()) {
      setErrorMsg(isEn ? 'Entity name is required.' : 'نام لازمی ہے۔');
      return;
    }
    const cnicClean = cnic.replace(/\D/g, '');
    if (cnicClean.length < 13) {
      setErrorMsg(isEn ? 'Identification number (CNIC/License) must be at least 13 digits.' : 'شناختی کارڈ نمبر کم از کم 13 ہندسوں کا ہونا چاہئے۔');
      return;
    }
    if (attachedFiles.length === 0) {
      setErrorMsg(isEn ? 'Please attach at least one supporting document.' : 'براہ کرم کم از کم ایک شناختی دستاویز منسلک کریں۔');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await tvsSubmitRequest(
        currentUser.id,
        entityName,
        entityType,
        level,
        cnicClean,
        attachedFiles,
        currentUser
      );

      if (res.success) {
        alert(isEn 
          ? `Application submitted successfully! Your tracking certificate ID: ${res.certId}` 
          : `درخواست کامیابی سے جمع ہو گئی! سرٹیفکیٹ نمبر: ${res.certId}`
        );
        onSuccess(res.certId || '');
        onClose();
      } else {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto leading-normal">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-650" />
            <h3 className="font-black text-slate-900 text-sm">
              {isEn ? 'Apply for Trust & Verification' : 'تصدیقی بیج کے لئے درخواست دیں'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg border-none bg-transparent cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">
              {isEn ? 'Entity Name (Individual/Business/Org)' : 'سرکاری نام (انفرادی/کاروبار/تنظیم)'}
            </label>
            <input 
              type="text" 
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder={isEn ? 'e.g. Zia-ur-Rehman' : 'مثال: ضیاء الرحمن'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">
                {isEn ? 'Entity Type' : 'نوعیت'}
              </label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none"
              >
                <option value="Individual">{isEn ? 'Individual' : 'انفرادی'}</option>
                <option value="Business">{isEn ? 'Business' : 'کاروبار'}</option>
                <option value="Government">{isEn ? 'Government' : 'سرکاری ادارہ'}</option>
                <option value="NGO">{isEn ? 'NGO' : 'این جی او'}</option>
                <option value="Educational">{isEn ? 'Educational' : 'تعلیمی ادارہ'}</option>
                <option value="Healthcare">{isEn ? 'Healthcare' : 'صحت کا ادارہ'}</option>
                <option value="Journalist">{isEn ? 'Journalist' : 'صحافی'}</option>
                <option value="Leader">{isEn ? 'Community Leader' : 'عوامی رہنما'}</option>
                <option value="Emergency">{isEn ? 'Emergency Services' : 'امدادی خدمات'}</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">
                {isEn ? 'Verification Level' : 'تصدیقی درجہ'}
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none"
              >
                <option value="Basic">{isEn ? 'Basic Verified' : 'بنیادی تصدیق'}</option>
                <option value="Professional">{isEn ? 'Professional Verified' : 'پیشہ ورانہ'}</option>
                <option value="Premium">{isEn ? 'Premium Verified' : 'پریمیم'}</option>
                <option value="Gold Trusted">{isEn ? 'Gold Trusted' : 'گولڈ ٹرسٹڈ'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">
              {isEn ? 'CNIC / National Identity / Business ID' : 'شناختی کارڈ نمبر یا تجارتی رجسٹریشن نمبر'}
            </label>
            <input 
              type="text" 
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
              placeholder="e.g. 37405-1234567-1"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 font-semibold mt-1">
              🔒 {isEn ? 'Your ID number is securely hashed before submission to prevent duplicate identity registry. The plain text is never stored.' : 'آپ کا شناختی نمبر محفوظ طریقے سے ہیش کیا جائے گا۔'}
            </p>
          </div>

          {/* Attachments Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              {isEn ? 'Upload Proof Documents (CNIC/Licenses)' : 'دستاویزات اپلوڈ کریں'}
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1.5 relative">
                <FileText className="w-5 h-5 mx-auto text-slate-400" />
                <p className="text-[10px] font-bold text-slate-600">{isEn ? 'CNIC / ID Front' : 'شناختی کارڈ فرنٹ'}</p>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={(e) => handleAddFile(e, 'CNIC')}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1.5 relative">
                <FileText className="w-5 h-5 mx-auto text-slate-400" />
                <p className="text-[10px] font-bold text-slate-600">{isEn ? 'Business / Org Docs' : 'کاروباری دستاویز'}</p>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={(e) => handleAddFile(e, 'Organization Documents')}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                />
              </div>
            </div>

            {attachedFiles.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase">{isEn ? 'Uploaded Documents:' : 'منسلک دستاویزات:'}</p>
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-indigo-50/40 p-2 rounded-xl text-[10px] font-bold text-indigo-700">
                    <span className="truncate">{file.type} (Stored Securely)</span>
                    <span className="text-slate-400">✓ Attached</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-5 border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-black rounded-xl cursor-pointer bg-transparent"
            >
              {isEn ? 'Cancel' : 'منسوخ'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-350 text-white text-xs font-black rounded-xl cursor-pointer border-none shadow-md"
            >
              {isSubmitting ? (isEn ? 'Submitting...' : 'جمع ہو رہا ہے...') : (isEn ? 'Submit Application' : 'درخواست جمع کریں')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
