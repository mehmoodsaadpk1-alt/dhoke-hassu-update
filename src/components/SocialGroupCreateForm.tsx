import React, { useState } from 'react';
import { Camera, Image as ImageIcon, AlertTriangle, X } from 'lucide-react';
import { AppInput, AppTextarea, AppButton } from './ui';
import { dbCreateGroupAdvanced, dbUploadGroupImage, dbTriggerNotification } from '../utils/supabaseClient';
import { User, Group } from '../types';

interface SocialGroupCreateFormProps {
  currentUser: User;
  currentLanguage: 'en' | 'ur';
  onSuccess: (newGroup: Group) => void;
  onCancel: () => void;
}

export default function SocialGroupCreateForm({ currentUser, currentLanguage, onSuccess, onCancel }: SocialGroupCreateFormProps) {
  const isEn = currentLanguage === 'en';
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Community',
    visibility: 'public',
    tags: '',
    rules: '',
    location: ''
  });
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CATEGORIES = [
    'Community', 'Technology', 'Sports', 'Education', 'Gaming', 
    'Health', 'Business', 'Arts & Culture', 'Entertainment', 'Other'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'logo') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError(isEn ? 'Image size must be less than 5MB' : 'تصویر کا سائز 5MB سے کم ہونا چاہیے');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (type === 'cover') {
          setCoverFile(file);
          setCoverPreview(event.target?.result as string);
        } else {
          setLogoFile(file);
          setLogoPreview(event.target?.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.name?.trim()) return isEn ? 'Group name is required' : 'گروپ کا نام درکار ہے';
    if (!formData.description?.trim()) return isEn ? 'Description is required' : 'تفصیل درکار ہے';
    if (formData.name.length > 50) return isEn ? 'Name is too long' : 'نام بہت طویل ہے';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let cover_url = '';
      let logo_url = '';

      if (coverFile) {
        const url = await dbUploadGroupImage(coverFile);
        if (!url) throw new Error('Failed to upload cover image. See console for full debug trace.');
        cover_url = url;
      }

      if (logoFile) {
        const url = await dbUploadGroupImage(logoFile);
        if (!url) throw new Error('Failed to upload logo image. See console for full debug trace.');
        logo_url = url;
      }

      const tagsArray = formData.tags
        ?.split(',')
        .map(t => t?.trim())
        .filter(t => t.length > 0);

      const groupPayload = {
        name: formData.name?.trim(),
        description: formData.description?.trim(),
        category: formData.category,
        visibility: formData.visibility,
        tags: tagsArray,
        rules: formData.rules?.trim(),
        location: formData.location?.trim(),
        cover_url: cover_url || null,
        logo_url: logo_url || null,
        owner_id: currentUser.id
      };

      const newGroup = await dbCreateGroupAdvanced(groupPayload, currentUser.id);

      if (!newGroup) {
        throw new Error('Supabase did not return the created group object.');
      }

      await dbTriggerNotification({
        user_id: currentUser.id,
        type: 'system',
        title: isEn ? 'Group Created Successfully' : 'گروپ کامیابی سے بن گیا',
        message: isEn ? `Your group "${newGroup.name}" is now live.` : `آپ کا گروپ "${newGroup.name}" اب لائیو ہے۔`,
        is_read: false
      });

      onSuccess(newGroup as Group);

    } catch (err: any) {
      console.error('Create group error:', err);
      // Display the EXACT Supabase error
      const errorMessage = err.message || JSON.stringify(err);
      setError(`DATABASE ERROR: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn max-w-3xl mx-auto">
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {isEn ? 'Create New Group' : 'نیا گروپ بنائیں'}
            </h2>
            <p className="text-sm font-semibold text-slate-500 mt-1">
              {isEn ? 'Build a community around your interests' : 'اپنی دلچسپیوں کے گرد ایک کمیونٹی بنائیں'}
            </p>
          </div>
          <button 
            onClick={onCancel}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm font-bold text-red-700">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {isEn ? 'Group Imagery' : 'گروپ کی تصاویر'}
            </h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                {isEn ? 'Cover Image' : 'کور تصویر'}
              </label>
              <div className="relative h-48 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors overflow-hidden group">
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-full flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        {isEn ? 'Change Cover' : 'کور تبدیل کریں'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-sm font-semibold">{isEn ? 'Upload Cover Image' : 'کور تصویر اپ لوڈ کریں'}</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'cover')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4">
              <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors overflow-hidden group shrink-0">
                {logoPreview ? (
                  <>
                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <Camera className="w-6 h-6 opacity-50" />
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'logo')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800">{isEn ? 'Group Icon (Optional)' : 'گروپ آئیکن (اختیاری)'}</h4>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  {isEn ? 'A square image works best. This will represent your group in lists and searches.' : 'مربع تصویر بہترین ہے۔ یہ آپ کے گروپ کی نمائندگی کرے گی۔'}
                </p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {isEn ? 'Basic Information' : 'بنیادی معلومات'}
            </h3>
            
            <AppInput
              label={isEn ? "Group Name *" : "گروپ کا نام *"}
              placeholder={isEn ? "e.g. Dhoke Hassu Tech Enthusiasts" : "مثلاً ڈھوک حسو ٹیک کے شوقین"}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              maxLength={50}
            />

            <AppTextarea
              label={isEn ? "Description *" : "تفصیل *"}
              placeholder={isEn ? "What is this group about?" : "یہ گروپ کس بارے میں ہے؟"}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
              rows={4}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  {isEn ? 'Category *' : 'زمرہ *'}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-emerald-500 text-slate-700"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  {isEn ? 'Privacy *' : 'پرائیویسی *'}
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => handleInputChange('visibility', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-emerald-500 text-slate-700"
                >
                  <option value="public">{isEn ? 'Public (Anyone can see and join)' : 'پبلک (کوئی بھی دیکھ سکتا ہے)'}</option>
                  <option value="private">{isEn ? 'Private (Approval required to join)' : 'پرائیویٹ (شمولیت کے لیے منظوری)'}</option>
                  <option value="hidden">{isEn ? 'Hidden (Invite only)' : 'پوشیدہ (صرف دعوت)'}</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {isEn ? 'Advanced Settings (Optional)' : 'ایڈوانسڈ سیٹنگز (اختیاری)'}
            </h3>

            <AppInput
              label={isEn ? "Location" : "مقام"}
              placeholder={isEn ? "e.g. Rawalpindi" : "مثلاً راولپنڈی"}
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />

            <AppInput
              label={isEn ? "Tags" : "ٹیگز"}
              placeholder={isEn ? "Comma separated (e.g. tech, coding)" : "کوما سے الگ کریں (مثلاً ٹیک، کوڈنگ)"}
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
            />

            <AppTextarea
              label={isEn ? "Group Rules" : "گروپ کے اصول"}
              placeholder={isEn ? "List the rules members must follow..." : "وہ اصول لکھیں جن پر ممبران کو عمل کرنا ہوگا..."}
              value={formData.rules}
              onChange={(e) => handleInputChange('rules', e.target.value)}
              rows={4}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <AppButton
              variant="outline"
              type="button"
              onClick={onCancel}
              disabled={loading}
            >
              {isEn ? 'Cancel' : 'منسوخ کریں'}
            </AppButton>
            <AppButton
              variant="primary"
              type="submit"
              disabled={loading}
              className="px-8"
            >
              {loading ? (isEn ? 'Creating...' : 'بن رہا ہے...') : (isEn ? 'Create Group' : 'گروپ بنائیں')}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}



