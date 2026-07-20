const fs = require('fs');
const path = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/SettingsModule.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state for privacy settings
content = content.replace(
  "const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');",
  `const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [privacyType, setPrivacyType] = useState<'public' | 'private'>(currentUser?.privacyType || 'public');
  const [messagePrivacy, setMessagePrivacy] = useState<'everyone' | 'followers' | 'nobody'>(currentUser?.messagePrivacy || 'everyone');
  const [storyPrivacy, setStoryPrivacy] = useState<'everyone' | 'followers' | 'close_friends' | 'only_me'>(currentUser?.storyPrivacy || 'everyone');`
);

// 2. Add handlePrivacyChange
content = content.replace(
  "const handleLanguageChange = (lang: 'en' | 'ur') => {",
  `const handlePrivacyChange = async (key: string, value: string) => {
    try {
      if (key === 'privacyType') setPrivacyType(value as any);
      if (key === 'messagePrivacy') setMessagePrivacy(value as any);
      if (key === 'storyPrivacy') setStoryPrivacy(value as any);
      
      const updateData = {};
      updateData[key === 'privacyType' ? 'privacy_type' : key === 'messagePrivacy' ? 'message_privacy' : 'story_privacy'] = value;
      
      if (currentUser?.id && window.supabase) {
        await window.supabase.from('profiles').update(updateData).eq('user_id', currentUser.id);
      }
    } catch(e) {}
  };

  const handleLanguageChange = (lang: 'en' | 'ur') => {`
);

// 3. Inject Privacy & Safety section in render
const oldSecurity = `<div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{isEn ? 'Security' : 'سیکیورٹی'}</h3>`;

const newPrivacy = `<div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{isEn ? 'Privacy & Safety' : 'پرائیویسی اور سیفٹی'}</h3>
              
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{isEn ? 'Account Privacy' : 'اکاؤنٹ پرائیویسی'}</span>
                </div>
                <select value={privacyType} onChange={(e) => handlePrivacyChange('privacyType', e.target.value)} className="w-full p-2 border rounded-lg">
                  <option value="public">{isEn ? 'Public (Anyone can follow)' : 'پبلک'}</option>
                  <option value="private">{isEn ? 'Private (Approve followers)' : 'پرائیویٹ'}</option>
                </select>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{isEn ? 'Who can message me?' : 'کون مجھے میسج کر سکتا ہے؟'}</span>
                </div>
                <select value={messagePrivacy} onChange={(e) => handlePrivacyChange('messagePrivacy', e.target.value)} className="w-full p-2 border rounded-lg">
                  <option value="everyone">{isEn ? 'Everyone' : 'ہر کوئی'}</option>
                  <option value="followers">{isEn ? 'Followers Only' : 'صرف فالوورز'}</option>
                  <option value="nobody">{isEn ? 'Nobody' : 'کوئی نہیں'}</option>
                </select>
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-slate-200 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{isEn ? 'Story Privacy' : 'سٹوری پرائیویسی'}</span>
                </div>
                <select value={storyPrivacy} onChange={(e) => handlePrivacyChange('storyPrivacy', e.target.value)} className="w-full p-2 border rounded-lg">
                  <option value="everyone">{isEn ? 'Everyone' : 'ہر کوئی'}</option>
                  <option value="followers">{isEn ? 'Followers Only' : 'صرف فالوورز'}</option>
                  <option value="only_me">{isEn ? 'Only Me' : 'صرف میں'}</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{isEn ? 'Security' : 'سیکیورٹی'}</h3>`;

content = content.replace(oldSecurity, newPrivacy);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched SettingsModule.tsx');
