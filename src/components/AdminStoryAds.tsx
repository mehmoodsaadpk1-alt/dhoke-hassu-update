import React, { useState, useEffect, useRef } from 'react';
import { dbGetAllStoryAds, dbSaveStoryAd, dbDeleteStoryAd, dbUploadAdBanner } from '../utils/supabaseClient';
import { Plus, Edit2, Trash2, Pause, Play, BarChart2, Eye, MousePointerClick, FastForward, XCircle, Upload } from 'lucide-react';

interface AdminStoryAdsProps {
  currentLanguage: string;
}

export default function AdminStoryAds({ currentLanguage }: AdminStoryAdsProps) {
  const isEn = currentLanguage === 'en';
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [ctaType, setCtaType] = useState<'Website' | 'WhatsApp' | 'Phone' | 'Email' | 'Internal'>('Website');
  const [ctaValue, setCtaValue] = useState('');
  const [ctaText, setCtaText] = useState('Learn More');
  const [duration, setDuration] = useState(5);
  const [frequencyCap, setFrequencyCap] = useState(3);
  const [targetAudience, setTargetAudience] = useState('All');

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    setLoading(true);
    const data = await dbGetAllStoryAds();
    if (data) setAds(data);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      setMediaType('video');
    } else {
      setMediaType('photo');
    }

    setIsUploading(true);
    try {
      const url = await dbUploadAdBanner(file, file.name);
      if (url) {
        setMediaUrl(url);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload media");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl || !ctaValue) {
      alert("Media URL and CTA Value are required");
      return;
    }
    
    // Auto-normalize WhatsApp numbers
    let finalCtaValue = ctaValue;
    if (ctaType === 'WhatsApp') {
      const cleaned = ctaValue.replace(/[^\d+]/g, ''); // keep plus and digits
      finalCtaValue = cleaned;
    }

    const adToSave = {
      id: editingAd ? editingAd.id : crypto.randomUUID(),
      admin_id: '00000000-0000-0000-0000-000000000000',
      media_url: mediaUrl,
      media_type: mediaType,
      cta_link: ctaType === 'Website' ? finalCtaValue : '', // Backward compat
      cta_type: ctaType,
      cta_value: finalCtaValue,
      cta_text: ctaText,
      duration: duration,
      frequency_cap: frequencyCap,
      target_audience: targetAudience,
      active: editingAd ? editingAd.active : true,
      impressions: editingAd?.impressions || 0,
      clicks: editingAd?.clicks || 0,
      completions: editingAd?.completions || 0,
      skips: editingAd?.skips || 0,
      exits: editingAd?.exits || 0,
    };

    const success = await dbSaveStoryAd(adToSave);
    if (success) {
      console.log(`[ADMIN STORY] ${editingAd ? 'Update' : 'Create'} Ad`, adToSave.id);
      setIsModalOpen(false);
      setEditingAd(null);
      fetchAds();
    } else {
      console.error("[ADMIN STORY] Failed to save ad. Database write rejected.");
      alert("Failed to save Story Ad. An error occurred while writing to the database.");
    }
  };

  const handleToggleActive = async (ad: any) => {
    const success = await dbSaveStoryAd({ ...ad, active: !ad.active });
    if (success) {
      console.log(`[ADMIN STORY] ${ad.active ? 'Pause' : 'Resume'} Ad`, ad.id);
      fetchAds();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanently delete this Story Ad?")) return;
    const success = await dbDeleteStoryAd(id);
    if (success) {
      console.log("[ADMIN STORY] Delete Ad", id);
      fetchAds();
    }
  };

  const openNewModal = () => {
    setEditingAd(null);
    setMediaUrl('');
    setMediaType('photo');
    setCtaType('Website');
    setCtaValue('');
    setCtaText('Learn More');
    setDuration(5);
    setFrequencyCap(3);
    setTargetAudience('All');
    setIsModalOpen(true);
  };

  const openEditModal = (ad: any) => {
    setEditingAd(ad);
    setMediaUrl(ad.media_url);
    setMediaType(ad.media_type);
    setCtaType(ad.cta_type || 'Website');
    setCtaValue(ad.cta_value || ad.cta_link || '');
    setCtaText(ad.cta_text);
    setDuration(ad.duration || 5);
    setFrequencyCap(ad.frequency_cap || 3);
    setTargetAudience(ad.target_audience || 'All');
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Story Ads...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{isEn ? 'Story Ads Management' : 'سٹوری اشتہارات'}</h2>
          <p className="text-xs text-slate-500">Inject sponsored stories into the viewer stream with deep tracking.</p>
        </div>
        <button onClick={openNewModal} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg transition-transform hover:scale-105">
          <Plus className="w-4 h-4" />
          {isEn ? 'Create Story Ad' : 'نیا اشتہار'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ads.map(ad => {
          const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
          const completionRate = ad.impressions > 0 ? ((ad.completions / ad.impressions) * 100).toFixed(1) : '0.0';
          const skipRate = ad.impressions > 0 ? ((ad.skips / ad.impressions) * 100).toFixed(1) : '0.0';

          return (
            <div key={ad.id} className="bg-white border border-slate-200 rounded-3xl p-5 flex gap-5 shadow-sm">
              <div className="w-24 h-40 shrink-0 bg-slate-900 rounded-xl overflow-hidden relative shadow-inner border border-slate-100">
                {ad.media_type === 'video' ? (
                  <video src={ad.media_url} className="w-full h-full object-cover opacity-80" />
                ) : (
                  <img src={ad.media_url} className="w-full h-full object-cover opacity-80" />
                )}
                <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase ${ad.active ? 'bg-green-500' : 'bg-slate-500'}`}>
                  {ad.active ? 'Active' : 'Paused'}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{ad.cta_text}</h3>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleToggleActive(ad)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition" title={ad.active ? "Pause" : "Resume"}>
                        {ad.active ? <Pause className="w-4 h-4 text-amber-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
                      </button>
                      <button onClick={() => openEditModal(ad)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition" title="Edit">
                        <Edit2 className="w-4 h-4 text-blue-500" />
                      </button>
                      <button onClick={() => handleDelete(ad.id)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition" title="Delete">
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mb-3" title={ad.cta_link}>{ad.cta_link}</p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                      <Eye className="w-3.5 h-3.5 mx-auto mb-1 text-slate-400" />
                      <p className="text-[9px] font-black text-slate-400 uppercase">Views</p>
                      <p className="text-sm font-bold text-slate-800">{ad.impressions || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                      <MousePointerClick className="w-3.5 h-3.5 mx-auto mb-1 text-blue-400" />
                      <p className="text-[9px] font-black text-slate-400 uppercase">Clicks (CTR)</p>
                      <p className="text-sm font-bold text-slate-800">{ad.clicks || 0} <span className="text-[9px] font-medium text-slate-500">{ctr}%</span></p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                      <BarChart2 className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
                      <p className="text-[9px] font-black text-slate-400 uppercase">Completions</p>
                      <p className="text-sm font-bold text-slate-800">{ad.completions || 0} <span className="text-[9px] font-medium text-slate-500">{completionRate}%</span></p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 mt-2">
                  <span className="flex items-center gap-1 text-amber-600"><FastForward className="w-3 h-3" /> Skips: {ad.skips || 0} ({skipRate}%)</span>
                  <span className="flex items-center gap-1 text-rose-500"><XCircle className="w-3 h-3" /> Exits: {ad.exits || 0}</span>
                </div>
              </div>
            </div>
          );
        })}
        {ads.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">No Story Ads active. Create one above!</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200/60 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                {editingAd ? 'Edit Story Ad' : 'Create Story Ad'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 transition-colors text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="story-ad-form" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Media Type</label>
                  <select value={mediaType} onChange={(e) => setMediaType(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                    <option value="photo">Photo / Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Media URL (Storage URL)</label>
                  <div className="flex gap-2">
                    <input type="text" required value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="https://..." />
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*,video/*" className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl flex items-center gap-2 border border-slate-200 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                      <Upload className="w-4 h-4" />
                      {isUploading ? (isEn ? 'Uploading...' : 'اپ لوڈ ہو رہا ہے...') : (isEn ? 'Upload from Gallery' : 'گیلری سے اپ لوڈ کریں')}
                    </button>
                  </div>
                </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CTA Type</label>
                    <select value={ctaType} onChange={e => setCtaType(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                      <option value="Website">Website</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Phone">Phone Call</option>
                      <option value="Email">Email</option>
                      <option value="Internal">Internal App Link</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {ctaType === 'Website' && 'Website URL'}
                      {ctaType === 'WhatsApp' && 'WhatsApp Number'}
                      {ctaType === 'Phone' && 'Phone Number'}
                      {ctaType === 'Email' && 'Email Address'}
                      {ctaType === 'Internal' && 'Internal Path'}
                    </label>
                    <input 
                      type={ctaType === 'Email' ? 'email' : ctaType === 'Phone' || ctaType === 'WhatsApp' ? 'tel' : 'text'} 
                      required 
                      value={ctaValue} 
                      onChange={e => setCtaValue(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                      placeholder={
                        ctaType === 'Website' ? 'https://yourbusiness.com' :
                        ctaType === 'WhatsApp' ? '+923001234567' :
                        ctaType === 'Phone' ? '+923001234567' :
                        ctaType === 'Email' ? 'support@example.com' :
                        '/marketplace/123'
                      } 
                    />
                  </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CTA Button Text</label>
                  <input type="text" required value={ctaText} onChange={e => setCtaText(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Seconds)</label>
                    <input type="number" min="1" max="15" required value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Frequency Cap (Views per user)</label>
                    <input type="number" min="1" required value={frequencyCap} onChange={e => setFrequencyCap(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                  <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                    <option value="All">All Users</option>
                    <option value="Male 18-30">Males 18-30</option>
                    <option value="Female 18-30">Females 18-30</option>
                    <option value="Business Owners">Business Owners</option>
                  </select>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-sm transition-colors border-0">
                Cancel
              </button>
              <button type="submit" form="story-ad-form" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-blue-500/30 border-0">
                {editingAd ? 'Save Changes' : 'Create Ad'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
