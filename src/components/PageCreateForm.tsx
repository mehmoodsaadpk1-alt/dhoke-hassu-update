import React, { useState, useRef } from 'react';
import { 
  Building2, Globe, Phone, Mail, MapPin, 
  ImagePlus, X, AlertCircle, Users, Lock, ChevronDown, CheckCircle2 
} from 'lucide-react';
import { dbCreatePage, dbUploadPageImage } from '../utils/supabaseClient';

interface PageCreateFormProps {
  currentUser: any;
  currentLanguage: 'en' | 'ur';
  onCancel: () => void;
  onSuccess: (newPage: any) => void;
}

export default function PageCreateForm({ 
  currentUser, 
  currentLanguage, 
  onCancel, 
  onSuccess 
}: PageCreateFormProps) {
  const isEn = currentLanguage === 'en';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Business');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState('Public');
  const [allowMessages, setAllowMessages] = useState(true);
  const [allowReviews, setAllowReviews] = useState(true);

  // Files
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Business', 'Brand', 'Community', 'Public Figure', 'Entertainment', 'Education', 'Other'
  ];

  const handleProfileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name?.trim() || !slug?.trim()) {
      setError(isEn ? 'Name and Username/Slug are required.' : 'نام اور یوزر نیم ضروری ہیں۔');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let profile_photo_url = '';
      let cover_photo_url = '';

      if (profileFile) {
        const url = await dbUploadPageImage(profileFile);
        if (url) profile_photo_url = url;
      }
      if (coverFile) {
        const url = await dbUploadPageImage(coverFile);
        if (url) cover_photo_url = url;
      }

      const pageData = {
        owner_id: currentUser.id,
        name: name?.trim(),
        slug: slug?.trim(),
        category,
        description: description?.trim(),
        logo_url: profile_photo_url,
        cover_url: cover_photo_url,
        website: website?.trim(),
        phone: phone?.trim(),
        email: email?.trim(),
        address: address?.trim(),
        location: location?.trim(),
        visibility,
        is_private: visibility === 'Private',
        allow_messages: allowMessages,
        allow_reviews: allowReviews
      };

      const newPage = await dbCreatePage(pageData);
      
      if (!newPage) {
        throw new Error('Database returned null');
      }

      onSuccess(newPage);
    } catch (err: any) {
      console.error('Create Page Error:', err);
      let errMsg = isEn ? 'Failed to create page.' : 'صفحہ بنانے میں ناکامی۔';
      if (err.message) {
        errMsg += ` (${err.message})`;
      } else if (err.error?.message) {
        errMsg += ` (${err.error.message})`;
      } else if (err.code) {
        errMsg += ` (Error code: ${err.code})`;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn max-w-4xl mx-auto">
      <div className="p-6 md:p-8 border-b border-slate-200">
        <h2 className="text-2xl font-black text-slate-900">{isEn ? 'Create a Page' : 'صفحہ بنائیں'}</h2>
        <p className="text-slate-500 font-semibold mt-1">
          {isEn ? 'Connect with your audience and build your brand.' : 'اپنے سامعین سے جڑیں اور اپنا برانڈ بنائیں۔'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-start gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        {/* --- Media Uploads --- */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-900">{isEn ? 'Media' : 'میڈیا'}</h3>
          
          <div className="space-y-6">
            {/* Cover Photo */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {isEn ? 'Cover Photo' : 'کور فوٹو'}
              </label>
              <div 
                className={`relative w-full h-48 md:h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                  coverPreview ? 'border-transparent' : 'border-slate-300 hover:border-blue-500 bg-slate-50'
                }`}
                onClick={() => coverInputRef.current?.click()}
              >
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-bold text-sm bg-black/60 px-4 py-2 rounded-xl backdrop-blur-sm">
                        {isEn ? 'Change Cover' : 'کور تبدیل کریں'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm font-bold text-slate-500">{isEn ? 'Add Cover Photo' : 'کور فوٹو شامل کریں'}</span>
                  </>
                )}
                <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverSelect} />
              </div>
            </div>

            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {isEn ? 'Profile Photo' : 'پروفائل فوٹو'}
              </label>
              <div 
                className={`relative w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                  profilePreview ? 'border-transparent' : 'border-slate-300 hover:border-blue-500 bg-slate-50'
                }`}
                onClick={() => profileInputRef.current?.click()}
              >
                {profilePreview ? (
                  <>
                    <img src={profilePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImagePlus className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <ImagePlus className="w-8 h-8 text-slate-400" />
                )}
                <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={handleProfileSelect} />
              </div>
            </div>
          </div>
        </div>

        {/* --- Basic Information --- */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2">{isEn ? 'Basic Information' : 'بنیادی معلومات'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">{isEn ? 'Page Name *' : 'صفحہ کا نام *'}</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder={isEn ? "E.g. Ali's Bakery" : "مثال: علی بیکری"}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">{isEn ? 'Username / Slug *' : 'یوزر نیم *'}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                <input 
                  type="text" 
                  value={slug} 
                  onChange={e => setSlug(e.target.value?.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} 
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="alis-bakery"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">{isEn ? 'Category' : 'زمرہ'}</label>
            <div className="relative">
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-semibold appearance-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">{isEn ? 'Description' : 'تفصیل'}</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              placeholder={isEn ? "Tell people about your page..." : "لوگوں کو اپنے صفحہ کے بارے میں بتائیں..."}
            />
          </div>
        </div>

        {/* --- Contact Information --- */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2">{isEn ? 'Contact Information' : 'رابطہ کی معلومات'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="url" 
                value={website} 
                onChange={e => setWebsite(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder={isEn ? "Website URL" : "ویب سائٹ کا ربط"}
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder={isEn ? "Phone Number" : "فون نمبر"}
              />
            </div>
            <div className="relative md:col-span-2">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder={isEn ? "Email Address" : "ای میل ایڈریس"}
              />
            </div>
            <div className="relative md:col-span-2">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={address} 
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder={isEn ? "Street Address" : "گلی کا پتہ"}
              />
            </div>
            <div className="relative md:col-span-2">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={location} 
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder={isEn ? "City, Country" : "شہر، ملک"}
              />
            </div>
          </div>
        </div>

        {/* --- Settings --- */}
        <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <h3 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-2">{isEn ? 'Settings' : 'ترتیبات'}</h3>
          
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">{isEn ? 'Visibility' : 'مرئیت'}</p>
                <p className="text-xs font-semibold text-slate-500">{isEn ? 'Who can see this page' : 'یہ صفحہ کون دیکھ سکتا ہے'}</p>
              </div>
              <div className="relative w-40">
                <select 
                  value={visibility} 
                  onChange={e => setVisibility(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold appearance-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${allowMessages ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                {allowMessages && <CheckCircle2 className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{isEn ? 'Allow Messages' : 'پیغامات کی اجازت دیں'}</p>
                <p className="text-xs font-semibold text-slate-500">{isEn ? 'Let users send messages to your page' : 'صارفین کو آپ کے صفحہ پر پیغامات بھیجنے کی اجازت دیں'}</p>
              </div>
              <input type="checkbox" className="hidden" checked={allowMessages} onChange={e => setAllowMessages(e.target.checked)} />
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${allowReviews ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                {allowReviews && <CheckCircle2 className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{isEn ? 'Allow Reviews' : 'جائزوں کی اجازت دیں'}</p>
                <p className="text-xs font-semibold text-slate-500">{isEn ? 'Let users leave reviews on your page' : 'صارفین کو آپ کے صفحہ پر جائزے چھوڑنے کی اجازت دیں'}</p>
              </div>
              <input type="checkbox" className="hidden" checked={allowReviews} onChange={e => setAllowReviews(e.target.checked)} />
            </label>
          </div>
        </div>

        {/* --- Actions --- */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
          >
            {isEn ? 'Cancel' : 'منسوخ کریں'}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white text-sm font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? (isEn ? 'Creating...' : 'بن رہا ہے...') : (isEn ? 'Create Page' : 'صفحہ بنائیں')}
          </button>
        </div>
      </form>
    </div>
  );
}
