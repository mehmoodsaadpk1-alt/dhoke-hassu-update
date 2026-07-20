import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Share2, 
  Heart, 
  Plus, 
  ChevronLeft, 
  Tag, 
  Store, 
  Calendar, 
  ArrowLeft,
  CheckCircle,
  Flag,
  Clock,
  ExternalLink,
  Sparkles,
  Info,
  Upload,
  Send
} from 'lucide-react';
import { DealItem, Language, AdItem } from '../types';
import { dbGetActiveAds } from '../utils/supabaseClient';
import AdBannerCard from './AdBannerCard';
import { useAdRotator } from '../hooks/useAdRotator';

interface DealsModuleProps {
  deals: DealItem[];
  onAddDeal: (newDeal: DealItem) => void;
  currentLanguage: Language;
  onNavigateToCreate: () => void;
  onNavigateToList: () => void;
  onNavigateToDetail: (dealId: string) => void;
  onNavigateToSaved: () => void;
  selectedDealId: string | null;
  activeView: 'list' | 'detail' | 'create' | 'saved';
  onReportDeal?: (id: string) => void;
}

const PRESET_DEAL_IMAGES: Record<string, string> = {
  Food: 'https://images.unsplash.com/photo-1589118949245-7d38baf380d6?auto=format&fit=crop&q=80&w=600',
  Shopping: 'https://images.unsplash.com/photo-1472851294608-062f824d296e?auto=format&fit=crop&q=80&w=600',
  Services: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600',
  Education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600',
  Health: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600',
  Electronics: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600',
  Fashion: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600',
  Other: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=600'
};
export default function DealsModule({
  deals,
  onAddDeal,
  currentLanguage,
  onNavigateToCreate,
  onNavigateToList,
  onNavigateToDetail,
  onNavigateToSaved,
  selectedDealId,
  activeView,
  onReportDeal
}: DealsModuleProps) {
  const dealsBannerMap = useAdRotator('Deals & Offers', 2, 1, 'Banner');
  const globalBannerMap = useAdRotator('Banner Carousel', 2, 1, 'Banner');
  const dealsAdMap = useAdRotator('Deals & Offers', 200, 5, 'Feed');

  const topBannerAd = dealsBannerMap[0] || globalBannerMap[0];
  const bottomBannerAd = dealsBannerMap[1] || globalBannerMap[1];
  // Local states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  // Legacy ad load removed – ads are handled via useAdRotator hook

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reportedDeals, setReportedDeals] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('dhoke_reported_deals');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Saved/Bookmarked deals state
  const [savedDeals, setSavedDeals] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('dhoke_saved_deals');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Persist states
  useEffect(() => {
    localStorage.setItem('dhoke_saved_deals', JSON.stringify(savedDeals));
  }, [savedDeals]);

  useEffect(() => {
    localStorage.setItem('dhoke_reported_deals', JSON.stringify(reportedDeals));
  }, [reportedDeals]);

  // Loading state simulation on filter changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  // Form State for creating a deal
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Food');
  const [formBusinessName, setFormBusinessName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formArea, setFormArea] = useState('');
  const [formDiscountText, setFormDiscountText] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formTerms, setFormTerms] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { dbUploadPostImage } = await import('../utils/supabaseClient');
      const uploadedUrl = await dbUploadPostImage(file);
      if (uploadedUrl) {
        setFormImages(prev => [...prev, uploadedUrl]);
        alert(currentLanguage === 'en' ? 'Image uploaded successfully!' : 'تصویر کامیابی سے اپ لوڈ ہو گئی!');
      } else {
        alert(currentLanguage === 'en' ? 'Failed to upload image' : 'تصویر اپ لوڈ کرنے میں ناکامی');
      }
    } catch (err) {
      console.error(err);
      alert('Upload error');
    } finally {
      setUploadingImage(false);
    }
  };
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);

  // Active detail image gallery index
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Expiry check function
  const isExpired = (dateStr: string) => {
    if (!dateStr) return false;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(dateStr);
      expiry.setHours(0, 0, 0, 0);
      return expiry < today;
    } catch {
      return false;
    }
  };

  const t = {
    en: {
      header: "Local Deals",
      searchPlaceholder: "Search trending offers in Dhoke Hassu...",
      all: "All Offers",
      categories: {
        Food: "Food",
        Shopping: "Shopping",
        Services: "Services",
        Education: "Education",
        Health: "Health",
        Electronics: "Electronics",
        Fashion: "Fashion",
        Other: "Other"
      },
      viewBtn: "View Deal",
      saveBtn: "Save",
      saved: "Saved",
      shareBtn: "Share",
      copied: "Offer link copied to clipboard!",
      createHeader: "Publish Deal / Offer",
      createTitle: "Offer Title",
      createCategory: "Offer Category",
      createBusiness: "Business Name",
      createDesc: "Offer Description / Details",
      createArea: "Area in Dhoke Hassu",
      createDiscount: "Discount / Offer Text",
      createDiscountPlaceholder: "e.g., Buy 1 Get 1 Free or 30% OFF",
      createExpiry: "Expiry Date",
      createContact: "Contact Number",
      createTerms: "Terms & Conditions (Optional)",
      createTermsPlaceholder: "e.g., Valid for dine-in only",
      createImages: "Offer Images",
      imagePlaceholder: "Enter image URL or select category preset below",
      addPreset: "Use Preset Image",
      publishBtn: "Publish Offer",
      fieldRequired: "This field is required",
      presetImagesTitle: "Or choose from standard templates:",
      uploadBtn: "Add Image URL",
      successTitle: "Offer Published Successfully!",
      successDesc: "Your deal is now visible on the main feed. Members can view and contact your business directly.",
      goToList: "View Deals Feed",
      savedDealsTitle: "Saved Offers",
      noSavedDesc: "You haven't bookmarked any deals yet. Save your favorite discounts to access them anytime!",
      browseAll: "Browse All Deals",
      reportListing: "Report Offer",
      reportedAlert: "This offer has been reported for review. Thank you for keeping our community safe!",
      expiredBadge: "Expired Offer",
      expiresOn: "Expires on",
      activeLabel: "Active Offer",
      postedBy: "Business",
      callBtn: "Call Now",
      msgBtn: "Message",
      validity: "Validity Period",
      termsLabel: "Terms & Conditions",
      emptyFeed: "No deals found in this category. Be the first to share one!",
      postButtonText: "Create Offer",
      viewSavedButtonText: "Saved Deals"
    },
    ur: {
      header: "مقامی ڈیلز",
      searchPlaceholder: "ڈھوک حسو میں بہترین آفرز تلاش کریں...",
      all: "تمام آفرز",
      categories: {
        Food: "کھانا پیینا",
        Shopping: "خریداری",
        Services: "خدمات",
        Education: "تعلیم",
        Health: "صحت",
        Electronics: "الیکٹرانکس",
        Fashion: "فیشن",
        Other: "دیگر"
      },
      viewBtn: "ڈیل دیکھیں",
      saveBtn: "محفوظ کریں",
      saved: "محفوظ ہو گیا",
      shareBtn: "شیئر کریں",
      copied: "آفر کا لنک کاپی ہو گیا ہے!",
      createHeader: "اشتہار / آفر شائع کریں",
      createTitle: "آفر کا عنوان",
      createCategory: "آفر کی کیٹیگری",
      createBusiness: "کاروبار کا نام",
      createDesc: "آفر کی تفصیلی وضاحت",
      createArea: "ڈھوک حسو میں علاقہ/گلی",
      createDiscount: "رعایت / آفر کی تفصیل",
      createDiscountPlaceholder: "مثال: ایک خریدیں ایک مفت حاصل کریں یا 30 فیصد رعایت",
      createExpiry: "آخری تاریخ",
      createContact: "رابطہ نمبر",
      createTerms: "شرائط و ضوابط (اختیاری)",
      createTermsPlaceholder: "مثال: صرف دکان پر خریداری کے لیے",
      createImages: "آفر کی تصاویر",
      imagePlaceholder: "تصویر کا لنک درج کریں یا نیچے سے منتخب کریں",
      addPreset: "پریسیٹ استعمال کریں",
      publishBtn: "آفر شائع کریں",
      fieldRequired: "یہ فیلڈ لازمی ہے",
      presetImagesTitle: "یا ذیل میں سے تصویر منتخب کریں:",
      uploadBtn: "تصویر شامل کریں",
      successTitle: "آفر کامیابی سے پوسٹ ہو گئی!",
      successDesc: "آپ کی ڈیل اب لائیو ہو چکی ہے اور کمیونٹی کے دیگر ممبران اسے دیکھ سکتے ہیں۔",
      goToList: "ڈیلز فیڈ دیکھیں",
      savedDealsTitle: "محفوظ کردہ آفرز",
      noSavedDesc: "آپ نے کوئی آفر محفوظ نہیں کی۔ اپنی پسندیدہ رعایت کو یہاں محفوظ کریں!",
      browseAll: "تمام ڈیلز دیکھیں",
      reportListing: "رپورٹ کریں",
      reportedAlert: "اس آفر کی رپورٹ درج کر لی گئی ہے۔ شکریہ!",
      expiredBadge: "میعاد ختم",
      expiresOn: "میعاد ختم ہونے کی تاریخ",
      activeLabel: "فعال آفر",
      postedBy: "کاروبار",
      callBtn: "کال کریں",
      msgBtn: "پیغام",
      validity: "میعاد",
      termsLabel: "شرائط و ضوابط",
      emptyFeed: "اس کیٹیگری میں کوئی آفر دستیاب نہیں ہے۔ پہلی آفر پوسٹ کریں!",
      postButtonText: "آفر بنائیں",
      viewSavedButtonText: "محفوظ کردہ"
    }
  }[currentLanguage];

  const categoriesList = [
    'Food',
    'Shopping',
    'Services',
    'Education',
    'Health',
    'Electronics',
    'Fashion',
    'Other'
  ];

  // Toggle saving
  const handleToggleSave = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedDeals(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Toggle report
  const handleToggleReport = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReportedDeals(prev => {
      const isRep = !prev[id];
      if (isRep) {
        alert(t.reportedAlert);
      }
      return {
        ...prev,
        [id]: isRep
      };
    });
  };

  // Preset Selection for Creating Deals
  const handleSelectPreset = (category: string) => {
    const url = PRESET_DEAL_IMAGES[category];
    if (url) {
      if (formImages.includes(url)) {
        setFormImages(prev => prev.filter(img => img !== url));
      } else {
        setFormImages(prev => [...prev, url]);
      }
    }
  };

  const handleAddCustomImageUrl = () => {
    if (imageUrlInput?.trim()) {
      setFormImages(prev => [...prev, imageUrlInput?.trim()]);
      setImageUrlInput('');
    }
  };

  const handleRemoveFormImage = (index: number) => {
    setFormImages(prev => prev.filter((_, i) => i !== index));
  };

  // Share offer helper
  const handleShare = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}/deals/detail?dealId=${id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(t.copied);
    });
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formTitle?.trim()) errors.title = t.fieldRequired;
    if (!formBusinessName?.trim()) errors.businessName = t.fieldRequired;
    if (!formDescription?.trim()) errors.description = t.fieldRequired;
    if (!formArea?.trim()) errors.area = t.fieldRequired;
    if (!formDiscountText?.trim()) errors.discountText = t.fieldRequired;
    if (!formExpiryDate?.trim()) errors.expiryDate = t.fieldRequired;
    if (!formContact?.trim()) errors.contact = t.fieldRequired;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const finalImages = formImages.length > 0 ? formImages : [PRESET_DEAL_IMAGES[formCategory] || PRESET_DEAL_IMAGES.Other];

    const newDeal: DealItem = {
      id: `dl_${Date.now()}`,
      title: formTitle,
      category: formCategory,
      businessName: formBusinessName,
      description: formDescription,
      area: formArea,
      discountText: formDiscountText,
      expiryDate: formExpiryDate,
      images: finalImages,
      contact: formContact,
      terms: formTerms || undefined
    };

    onAddDeal(newDeal);
    setIsSuccessMessage(true);

    // Reset fields
    setFormTitle('');
    setFormBusinessName('');
    setFormDescription('');
    setFormArea('');
    setFormDiscountText('');
    setFormExpiryDate('');
    setFormContact('');
    setFormTerms('');
    setFormImages([]);
  };

  // Filter deals based on search, category and reported state
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      // Hide reported deals
      if (reportedDeals[deal.id] || deal.reported) return false;

      // Category Filter Check
      if (selectedCategory !== 'All' && deal.category !== selectedCategory) {
        return false;
      }

      // Saved only check
      if (activeView === 'saved' && !savedDeals[deal.id]) {
        return false;
      }

      // Search Query Check
      if (searchQuery?.trim()) {
        const query = searchQuery?.toLowerCase();
        return (
          deal.title?.toLowerCase().includes(query) ||
          deal.businessName?.toLowerCase().includes(query) ||
          deal.discountText?.toLowerCase().includes(query) ||
          deal.area?.toLowerCase().includes(query) ||
          deal.description?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [deals, selectedCategory, searchQuery, activeView, savedDeals, reportedDeals]);


  // Selected deal for Detail view
  const selectedDeal = useMemo(() => {
    if (!selectedDealId) return null;
    return deals.find(d => d.id === selectedDealId) || null;
  }, [deals, selectedDealId]);

  // =======================================================
  // VIEW: CREATE OFFER / PUBLISH DEAL
  // =======================================================
  if (activeView === 'create') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden p-6 max-w-3xl mx-auto space-y-6" id="deals-create-root">
      {/* Top Banner Ad Segment */}
      {topBannerAd && (
        <div className="mb-6">
          <AdBannerCard ad={topBannerAd} />
        </div>
      )}

        {/* Header navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToList}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors cursor-pointer border-0"
            id="deal-create-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-black text-slate-950 leading-none">
            {t.createHeader}
          </h2>
        </div>

        {isSuccessMessage ? (
          <div className="py-8 text-center space-y-4" id="deal-success-screen">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-900">{t.successTitle}</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">{t.successDesc}</p>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={() => {
                  setIsSuccessMessage(false);
                  onNavigateToList();
                }}
                className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-sm transition-all cursor-pointer border-0"
                id="deal-success-view-list"
              >
                {t.goToList}
              </button>
              <button
                onClick={() => {
                  setIsSuccessMessage(false);
                }}
                className="py-3 px-6 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl transition-all cursor-pointer"
                id="deal-success-create-another"
              >
                {currentLanguage === 'en' ? 'Post Another Offer' : 'ایک اور آفر بنائیں'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn" id="deal-create-form">
            {/* Offer Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{t.createTitle} <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={currentLanguage === 'en' ? "e.g., Special Eid Discount on All Boutique Suits" : "مثال: تمام سوٹس پر عید کی خصوصی رعایت"}
                className={`w-full border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.title ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-blue-500'}`}
                id="deal-form-title-input"
              />
              {formErrors.title && <p className="text-xs font-semibold text-red-500">{formErrors.title}</p>}
            </div>

            {/* Category and Business Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{t.createCategory}</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all focus:border-blue-500"
                  id="deal-form-category-select"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{t.categories[cat as keyof typeof t.categories] || cat}</option>
                  ))}
                </select>
              </div>

              {/* Business Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{t.createBusiness} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formBusinessName}
                  onChange={(e) => setFormBusinessName(e.target.value)}
                  placeholder="e.g., Siddique Sweets, Hamza Mobile"
                  className={`w-full border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.businessName ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-blue-500'}`}
                  id="deal-form-business-input"
                />
                {formErrors.businessName && <p className="text-xs font-semibold text-red-500">{formErrors.businessName}</p>}
              </div>
            </div>

            {/* Area and Discount / Offer Text Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Discount / Offer Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{t.createDiscount} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formDiscountText}
                  onChange={(e) => setFormDiscountText(e.target.value)}
                  placeholder={t.createDiscountPlaceholder}
                  className={`w-full border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.discountText ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-blue-500'}`}
                  id="deal-form-discount-input"
                />
                {formErrors.discountText && <p className="text-xs font-semibold text-red-500">{formErrors.discountText}</p>}
              </div>

              {/* Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{t.createArea} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value)}
                  placeholder="e.g., Street 10, Main Bazar Road"
                  className={`w-full border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.area ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-blue-500'}`}
                  id="deal-form-area-input"
                />
                {formErrors.area && <p className="text-xs font-semibold text-red-500">{formErrors.area}</p>}
              </div>
            </div>

            {/* Expiry Date and Contact Number Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Expiry Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{t.createExpiry} <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={formExpiryDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                  className={`w-full border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.expiryDate ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-blue-500'}`}
                  id="deal-form-expiry-input"
                />
                {formErrors.expiryDate && <p className="text-xs font-semibold text-red-500">{formErrors.expiryDate}</p>}
              </div>

              {/* Contact Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{t.createContact} <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  placeholder="e.g., 0321-5551234"
                  className={`w-full border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.contact ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-blue-500'}`}
                  id="deal-form-contact-input"
                />
                {formErrors.contact && <p className="text-xs font-semibold text-red-500">{formErrors.contact}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{t.createDesc} <span className="text-red-500">*</span></label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={currentLanguage === 'en' ? "Explain what the offer includes, why it's great, how to claim it..." : "تفصیل لکھیں کہ اس آفر میں کیا شامل ہے، یہ کس طرح حاصل کی جا سکتی ہے..."}
                rows={4}
                className={`w-full border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.description ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-blue-500'}`}
                id="deal-form-desc-textarea"
              />
              {formErrors.description && <p className="text-xs font-semibold text-red-500">{formErrors.description}</p>}
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{t.createTerms}</label>
              <input
                type="text"
                value={formTerms}
                onChange={(e) => setFormTerms(e.target.value)}
                placeholder={t.createTermsPlaceholder}
                className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all focus:border-blue-500"
                id="deal-form-terms-input"
              />
            </div>

            {/* Images & Presets Selection */}
            <div className="space-y-3.5 pt-3 border-t border-slate-100">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">{t.createImages}</label>
              
              {/* Custom URL Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder={t.imagePlaceholder}
                  className="flex-1 border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all focus:border-blue-500"
                  id="deal-form-custom-image-url"
                />
                <button
                  type="button"
                  onClick={handleAddCustomImageUrl}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer border-0"
                  id="deal-form-add-image-url-btn"
                >
                  {t.uploadBtn}
                </button>
              </div>

              {/* File Upload from Gallery */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryUpload}
                  className="hidden"
                  id="deal-gallery-upload-input"
                  disabled={uploadingImage}
                />
                <label
                  htmlFor="deal-gallery-upload-input"
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-dashed rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    uploadingImage 
                      ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-blue-50/50 border-blue-200 hover:bg-blue-50 text-blue-700'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  {uploadingImage 
                    ? (currentLanguage === 'en' ? 'Uploading Image...' : 'اپ لوڈ ہو رہا ہے...') 
                    : (currentLanguage === 'en' ? 'Upload Image from Gallery' : 'گیلری سے تصویر اپ لوڈ کریں')
                  }
                </label>
              </div>

              {/* Category Presets Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold text-slate-500">{t.presetImagesTitle}</span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2" id="deal-form-presets-grid">
                  {Object.entries(PRESET_DEAL_IMAGES).map(([category, url]) => {
                    const isSelected = formImages.includes(url);
                    return (
                      <div 
                        key={category}
                        onClick={() => handleSelectPreset(category)}
                        className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 ${isSelected ? 'border-blue-600 scale-95 ring-2 ring-blue-100' : 'border-transparent'}`}
                        title={category}
                      >
                        <img src={url} alt={category} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-1">
                          <span className="text-[9px] font-black text-white text-center bg-black/60 px-1.5 py-0.5 rounded-md truncate max-w-full">
                            {t.categories[category as keyof typeof t.categories] || category}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white drop-shadow-md" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Images List */}
              {formImages.length > 0 && (
                <div className="space-y-2" id="deal-selected-images-preview">
                  <span className="text-[11px] font-extrabold text-slate-500">
                    {currentLanguage === 'en' ? 'Selected Images:' : 'منتخب کردہ تصاویر:'} ({formImages.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {formImages.map((url, index) => (
                      <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group">
                        <img src={url} alt="Deal Thumbnail" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveFormImage(index)}
                          className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity border-0"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="pt-4 flex gap-3 border-t border-slate-100">
              <button
                type="submit"
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer text-center border-0"
                id="deal-form-submit-btn"
              >
                🚀 {t.publishBtn}
              </button>
              <button
                type="button"
                onClick={onNavigateToList}
                className="py-3.5 px-6 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl transition-all cursor-pointer"
                id="deal-form-cancel-btn"
              >
                {currentLanguage === 'en' ? 'Cancel' : 'منسوخ کریں'}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // =======================================================
  // VIEW: DEAL DETAIL VIEW
  // =======================================================
  if (activeView === 'detail' && selectedDeal) {
    const images = selectedDeal.images && selectedDeal.images.length > 0 
      ? selectedDeal.images 
      : [PRESET_DEAL_IMAGES.Other];
    const isSaved = !!savedDeals[selectedDeal.id];
    const expired = isExpired(selectedDeal.expiryDate);

    return (
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden max-w-4xl mx-auto space-y-6 animate-fadeIn" id={`deal-detail-container-${selectedDeal.id}`}>
        {/* Gallery Overlay */}
        <div className="relative">
          {/* Back button */}
          <button
            onClick={onNavigateToList}
            className="absolute top-4 left-4 z-10 p-2.5 bg-white/95 text-slate-800 hover:bg-white rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs border-0"
            id="deal-detail-back-btn"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{currentLanguage === 'en' ? 'Back' : 'واپس'}</span>
          </button>

          {/* Large Image */}
          <div className="w-full h-80 sm:h-[450px] bg-slate-100 relative overflow-hidden">
            <img 
              src={images[activeImageIndex]} 
              alt={selectedDeal.title} 
              className="w-full h-full object-cover"
            />
            {/* Gallery Indicator */}
            <span className="absolute bottom-4 right-4 bg-black/75 text-white text-xs font-black px-3 py-1.5 rounded-xl backdrop-blur-xs">
              {activeImageIndex + 1} / {images.length}
            </span>

            {/* Discount Stamp */}
            <div className="absolute bottom-4 left-4 bg-green-500 text-white font-black text-sm px-4 py-2 rounded-2xl shadow-lg border border-green-400">
              🎉 {selectedDeal.discountText}
            </div>

            {/* Expired Overlay */}
            {expired && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="bg-rose-600 text-white font-black text-xl tracking-wider uppercase px-6 py-3 rounded-2xl shadow-lg border border-rose-500">
                  ⚠️ {t.expiredBadge}
                </span>
              </div>
            )}
          </div>

          {/* Image Thumbnails strip */}
          {images.length > 1 && (
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex gap-2 overflow-x-auto" id="deal-detail-thumbnails">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${idx === activeImageIndex ? 'border-blue-600 scale-95 shadow-sm' : 'border-slate-200 opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Area */}
        <div className="p-6 space-y-6">
          {/* Header metadata */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <span className="inline-flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider font-extrabold">
                🏷️ {t.categories[selectedDeal.category as keyof typeof t.categories] || selectedDeal.category}
              </span>
              
              {/* Expiry / Status text */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-extrabold flex items-center gap-1 ${expired ? 'text-rose-600' : 'text-emerald-600'}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {expired ? t.expiredBadge : t.activeLabel}
                </span>

                {/* Report button */}
                <button
                  onClick={(e) => {
                    handleToggleReport(selectedDeal.id, e);
                    onNavigateToList();
                  }}
                  className="p-1 px-2.5 hover:bg-rose-50 border border-slate-200 text-rose-600 hover:text-rose-700 font-extrabold text-[10px] rounded-lg cursor-pointer flex items-center gap-1"
                  id="deal-detail-report-btn"
                >
                  <Flag className="w-3 h-3" />
                  <span>{t.reportListing}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {selectedDeal.title}
                </h1>
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-sm">
                  <Store className="w-4 h-4 text-blue-600" />
                  <span>{selectedDeal.businessName}</span>
                  <span className="text-slate-300">•</span>
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedDeal.area}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details & Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100" id="deal-detail-specs">
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">{t.validity}</span>
                <span className="text-xs font-black text-slate-800">
                  {t.expiresOn}: {selectedDeal.expiryDate}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
              <Tag className="w-5 h-5 text-green-500" />
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">{t.createDiscount}</span>
                <span className="text-xs font-black text-green-600">{selectedDeal.discountText}</span>
              </div>
            </div>
          </div>

          {/* Offer Description */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              📝 {currentLanguage === 'en' ? 'Offer Details' : 'آفر کی تفصیلات'}
            </h3>
            <div className="text-sm text-slate-600 leading-relaxed bg-slate-50/20 border border-slate-100 p-4 rounded-2xl whitespace-pre-wrap">
              {selectedDeal.description}
            </div>
          </div>

          {/* Terms & Conditions */}
          {selectedDeal.terms && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                ⚠️ {t.termsLabel}
              </h3>
              <div className="text-xs text-slate-500 bg-amber-50/50 border border-amber-100/60 p-4 rounded-2xl whitespace-pre-wrap flex gap-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{selectedDeal.terms}</span>
              </div>
            </div>
          )}

          {/* Contact and Business Details Block */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between" id="deal-detail-business-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 text-white font-black rounded-full flex items-center justify-center text-lg shadow-sm">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">{t.postedBy}</span>
                <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                  {selectedDeal.businessName}
                </h4>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">📞 {selectedDeal.contact}</p>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{currentLanguage === 'en' ? 'Verified Store' : 'تصدیق شدہ'}</span>
            </span>
          </div>

          {/* Primary Action Button Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
            {/* Call */}
            <button
              onClick={() => {
                alert(currentLanguage === 'en' 
                  ? `Dialing ${selectedDeal.businessName}: ${selectedDeal.contact}`
                  : `رابطہ کیا جا رہا ہے: ${selectedDeal.contact}`
                );
                window.open(`tel:${selectedDeal.contact}`);
              }}
              disabled={expired}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-6 text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border-0 ${
                expired ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-green-500 hover:bg-green-600'
              }`}
              id="deal-call-now-btn"
            >
              <Phone className="w-4 h-4" />
              <span>{t.callBtn}</span>
            </button>

            {/* Message */}
            <button
              onClick={() => {
                if ((window as any).openChat) {
                  (window as any).openChat(selectedDeal.contact, selectedDeal.businessName, '');
                } else {
                  window.open(`sms:${selectedDeal.contact}?body=Assalam-o-Alaikum, I am calling about your offer: ${selectedDeal.title}`);
                }
              }}
              disabled={expired}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-6 text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer border-0 ${
                expired ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#2563eb] hover:bg-blue-700'
              }`}
              id="deal-msg-now-btn"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.msgBtn}</span>
            </button>

            {/* Save */}
            <button
              onClick={() => handleToggleSave(selectedDeal.id)}
              className={`py-3 px-4 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs ${isSaved ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
              id="deal-save-toggle-btn"
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-600 text-rose-600' : ''}`} />
              <span>{isSaved ? t.saved : t.saveBtn}</span>
            </button>

            {/* Share */}
            <button
              onClick={() => handleShare(selectedDeal.id)}
              className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs"
              id="deal-share-action-btn"
            >
              <Share2 className="w-4 h-4" />
              <span>{t.shareBtn}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =======================================================
  // VIEW: SAVED DEALS ONLY
  // =======================================================
  if (activeView === 'saved') {
    return (
      <div className="space-y-6" id="deals-saved-root">
        {/* Header Panel */}
        <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs" id="deals-saved-header-panel">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToList}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors cursor-pointer border-0"
              id="saved-deals-back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                ❤️ {t.savedDealsTitle}
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {currentLanguage === 'en' 
                  ? 'Your bookmarked discounts and premium business offers' 
                  : 'آپ کے محفوظ کردہ ڈسکاؤنٹس اور آفرز'}
              </p>
            </div>
          </div>
        </div>

        {/* Saved Listings Grid */}
        {filteredDeals.length === 0 ? (
          <div className="bg-white border border-slate-200/60 p-12 rounded-3xl text-center space-y-4 shadow-sm" id="deals-saved-empty">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 fill-rose-500" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-850 text-base">
                {currentLanguage === 'en' ? 'No Saved Offers' : 'کوئی محفوظ کردہ ڈیل نہیں ہے'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {t.noSavedDesc}
              </p>
            </div>
            <button
              onClick={onNavigateToList}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer border-0"
              id="saved-deals-browse-btn"
            >
              {t.browseAll}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="saved-deals-grid">
            {filteredDeals.map((deal) => {
              const displayImg = deal.images && deal.images.length > 0 ? deal.images[0] : PRESET_DEAL_IMAGES.Other;
              const expired = isExpired(deal.expiryDate);
              const isSaved = !!savedDeals[deal.id];

              return (
                <div
                  key={deal.id}
                  onClick={() => onNavigateToDetail(deal.id)}
                  className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-sm relative cursor-pointer"
                  id={`saved-deal-card-${deal.id}`}
                >
                  <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                    <img src={displayImg} alt={deal.title} className="w-full h-full object-cover" />
                    
                    {/* Category Label */}
                    <span className="absolute top-3 left-3 bg-black/75 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs font-sans">
                      {t.categories[deal.category as keyof typeof t.categories] || deal.category}
                    </span>

                    {/* Expiry Badge / Stamp */}
                    {expired && (
                      <span className="absolute top-3 right-3 bg-rose-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm font-sans">
                        {t.expiredBadge}
                      </span>
                    )}

                    {/* Discount Text Stamp */}
                    <div className="absolute bottom-3 left-3 bg-green-500 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-md border border-green-400">
                      🎉 {deal.discountText}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-900 text-sm leading-snug truncate">
                        {deal.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
                        <Store className="w-3.5 h-3.5 text-blue-600" />
                        <span className="truncate max-w-[120px]">{deal.businessName}</span>
                        <span>•</span>
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{deal.area}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1.5 border-t border-slate-100">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {deal.expiryDate}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Remove from Saved button */}
                        <button
                          onClick={(e) => handleToggleSave(deal.id, e)}
                          className="p-1 hover:bg-slate-100 text-rose-500 hover:text-rose-600 rounded transition-colors border-0"
                          title="Remove"
                        >
                          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                        </button>
                        <span className="text-blue-600 hover:text-blue-700 font-extrabold cursor-pointer flex items-center gap-0.5">
                          {t.viewBtn} &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // =======================================================
  // VIEW: MAIN DEALS LIST VIEW
  // =======================================================
  return (
    <div className="space-y-6" id="deals-list-root">
      {/* Top Banner Ad Segment */}
      {topBannerAd && (
        <div className="mb-6">
          <AdBannerCard ad={topBannerAd} />
        </div>
      )}

      {/* Top Banner and Actions (Facebook style, White, Blue, Green, Clean) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="deals-header-dashboard">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-950 flex items-center gap-2 tracking-tight">
            🔥 {t.header}
          </h2>
          <p className="text-xs text-slate-500 font-bold">
            {currentLanguage === 'en' 
              ? 'Find exclusive discounts, promo codes, and free services in Dhoke Hassu' 
              : 'ڈھوک حسو میں خصوصی رعایتیں، پرومو کوڈز اور مفت سروسز تلاش کریں'}
          </p>
        </div>

        {/* Header Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Saved offers navigation */}
          <button
            onClick={onNavigateToSaved}
            className="flex items-center gap-1.5 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer border-0"
            id="deals-nav-saved-btn"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>{t.viewSavedButtonText}</span>
          </button>

          {/* Create deal navigation */}
          <button
            onClick={onNavigateToCreate}
            className="flex items-center gap-1.5 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-green-100 transition-all cursor-pointer border-0"
            id="deals-nav-create-btn"
          >
            <Plus className="w-4 h-4" />
            <span>{t.postButtonText}</span>
          </button>
        </div>
      </div>

      {/* Search Input and Category Filters row */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-xs space-y-4" id="deals-filters-dashboard">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-3 bg-slate-100/70 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-full text-sm focus:outline-none transition-all placeholder:text-slate-400 font-medium"
            id="deals-search-input"
          />
        </div>

        {/* Category Filters scroll list */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth" id="deals-category-chips">
          {/* All Chip */}
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-1.5 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer border ${
              selectedCategory === 'All' 
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            ✨ {t.all}
          </button>

          {/* Individual categories */}
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer border ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat === 'Food' && '🍔 '}
              {cat === 'Shopping' && '🛍️ '}
              {cat === 'Services' && '🛠️ '}
              {cat === 'Education' && '📚 '}
              {cat === 'Health' && '💊 '}
              {cat === 'Electronics' && '🔌 '}
              {cat === 'Fashion' && '👗 '}
              {cat === 'Other' && '🔮 '}
              {t.categories[cat as keyof typeof t.categories] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Deals Feed */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3" id="deals-feed-loading">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-extrabold text-slate-500 tracking-wider">Loading premium deals...</span>
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-16 text-center space-y-4 shadow-sm" id="deals-feed-empty">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Tag className="w-8 h-8 text-blue-500" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-800 text-base">{currentLanguage === 'en' ? 'No Live Offers Found' : 'کوئی آفرز نہیں ملیں'}</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{t.emptyFeed}</p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="py-2.5 px-6 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
            id="deals-feed-reset-filters"
          >
            {currentLanguage === 'en' ? 'Reset Filters' : 'فلٹرز صاف کریں'}
          </button>
        </div>
      ) : (
        /* Vertical-only cards grid: 2 columns on desktop, 1 column on mobile as requested */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="deals-feed-grid">
          {(() => {
            const elements = [];
            for (let i = 0; i < filteredDeals.length; i++) {
              const deal = filteredDeals[i];
              const displayImg = deal.images && deal.images.length > 0 ? deal.images[0] : PRESET_DEAL_IMAGES.Other;
              const expired = isExpired(deal.expiryDate);
              const isSaved = !!savedDeals[deal.id];
              const ad = dealsAdMap[i];

              elements.push(
                <div
                  key={deal.id}
                  onClick={() => onNavigateToDetail(deal.id)}
                  className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:border-blue-400 hover:shadow-md transition-all duration-300 flex flex-col justify-between shadow-sm relative group cursor-pointer"
                  id={`deal-feed-card-${deal.id}`}
                >
                  {/* Cover Image Block */}
                  <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                    <img 
                      src={displayImg} 
                      alt={deal.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    {/* Category overlay label */}
                    <span className="absolute top-3 left-3 bg-black/75 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs font-sans">
                      {t.categories[deal.category as keyof typeof t.categories] || deal.category}
                    </span>

                    {/* Expired Label Stamp */}
                    {expired && (
                      <span className="absolute top-3 right-3 bg-rose-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md font-sans border border-rose-500">
                        ⚠️ {t.expiredBadge}
                      </span>
                    )}

                    {/* Discount Text Overlay (Bright Green or Blue background) */}
                    <div className="absolute bottom-3 left-3 bg-emerald-500 text-white text-[11px] font-black px-3.5 py-1.5 rounded-xl shadow-lg border border-emerald-400 font-sans tracking-tight">
                      ⚡ {deal.discountText}
                    </div>

                    {/* Save toggle quick action */}
                    <button
                      onClick={(e) => handleToggleSave(deal.id, e)}
                      className="absolute bottom-3 right-3 p-2 bg-white/95 text-slate-600 hover:bg-white rounded-full shadow-md hover:scale-105 transition-all cursor-pointer border-0"
                      id={`deal-card-save-overlay-${deal.id}`}
                    >
                      <Heart className={`w-3.5 h-3.5 transition-colors ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
                    </button>
                  </div>

                  {/* Content Block */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors">
                        {deal.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
                        <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                          <Store className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate max-w-[140px]">{deal.businessName}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{deal.area}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1">
                        {deal.description}
                      </p>
                    </div>

                    {/* Expiry and Actions Panel */}
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-3 border-t border-slate-100">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {t.expiresOn}: {deal.expiryDate}
                      </span>

                      <div className="flex items-center gap-1">
                        {/* View Button */}
                        <span className="text-[#2563eb] group-hover:underline font-black cursor-pointer flex items-center gap-0.5 px-2 py-1 text-xs">
                          {t.viewBtn} &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );

              // Inject Deals active ad via rotation
              if (ad) {
                elements.push(
                  <div key={`ad-deals-${i}-${ad.id}`} className="md:col-span-2">
                    <AdBannerCard ad={ad} />
                  </div>
                );
              }
            }
            return elements;
          })()}
        </div>
      )}

      {/* Bottom Banner Ad Segment */}
      {bottomBannerAd && (
        <div className="mt-8 mb-6">
          <AdBannerCard ad={bottomBannerAd} />
        </div>
      )}
    </div>
  );
}
