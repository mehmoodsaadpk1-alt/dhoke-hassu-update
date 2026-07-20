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
  Home, 
  Building, 
  Layers, 
  Grid, 
  Trash, 
  ArrowLeft,
  CheckCircle,
  Eye,
  Info,
  Flag,
  Ban,
  Clock
} from 'lucide-react';
import { PropertyItem, Language, AdItem } from '../types';
import { dbGetActiveAds, dbUploadPropertyImage, isSupabaseConfigured } from '../utils/supabaseClient';
import AdBannerCard from './AdBannerCard';
import { useAdRotator } from '../hooks/useAdRotator';
import { getCurrentUserLocation } from '../utils/locationService';

interface PropertyModuleProps {
  properties: PropertyItem[];
  onAddProperty: (newProperty: PropertyItem) => void;
  currentLanguage: Language;
  onNavigateToCreate: () => void;
  onNavigateToList: () => void;
  onNavigateToDetail: (propertyId: string) => void;
  onNavigateToSaved: () => void;
  selectedPropertyId: string | null;
  activeView: 'list' | 'detail' | 'create' | 'saved';
  onReportProperty?: (id: string) => void;
  onToggleAvailability?: (id: string) => void;
}

const DEFAULT_PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600'
];
export default function PropertyModule({
  properties,
  onAddProperty,
  currentLanguage,
  onNavigateToCreate,
  onNavigateToList,
  onNavigateToDetail,
  onNavigateToSaved,
  selectedPropertyId,
  activeView,
  onReportProperty,
  onToggleAvailability
}: PropertyModuleProps) {
  const propertyBannerMap = useAdRotator('Property Listings', 1, 1, 'Banner');
  const globalBannerMap = useAdRotator('Banner Carousel', 1, 1, 'Banner');
  const propertyAdMap = useAdRotator('Property Listings', 200, 5, 'Feed');
  
  const topBannerAd = propertyBannerMap[0] || globalBannerMap[0];
  // Local states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  // Legacy ad load removed – ads are handled via useAdRotator hook


  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Persistent saved properties state using localStorage
  const [savedProperties, setSavedProperties] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('dhoke_saved_properties');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist saved properties whenever they change
  useEffect(() => {
    localStorage.setItem('dhoke_saved_properties', JSON.stringify(savedProperties));
  }, [savedProperties]);

  // Simulate premium database loading transition when filters change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  // Active detail image gallery index
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Create Property form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('House');
  const [formPurpose, setFormPurpose] = useState<'Rent' | 'Sale'>('Rent');
  const [formPrice, setFormPrice] = useState('');
  const [formArea, setFormArea] = useState('');
  const [formRooms, setFormRooms] = useState('');
  const [formFloor, setFormFloor] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const t = {
    en: {
      header: "Property",
      rent: "Rent",
      sale: "Sale",
      searchPlaceholder: "Search properties in Dhoke Hassu...",
      all: "All Type",
      house: "House",
      shop: "Shop",
      plot: "Plot",
      apartment: "Apartment",
      room: "Room",
      commercial: "Commercial",
      viewBtn: "View",
      contactBtn: "Contact",
      areaLabel: "Area",
      roomsLabel: "Rooms",
      floorLabel: "Floor",
      postProperty: "Post Property",
      owner: "Posted By",
      backToList: "Back to Properties",
      description: "Description",
      callBtn: "Call",
      msgBtn: "Message",
      saveBtn: "Save",
      saved: "Saved",
      shareBtn: "Share",
      copied: "Link copied to clipboard!",
      createHeader: "Publish Property",
      createTitle: "Property Title",
      createType: "Property Category",
      createPurpose: "Rent / Sale",
      createPrice: "Price",
      createPricePlaceholder: "e.g., PKR 25,000 / month or PKR 1.2 Crore",
      createArea: "Area (e.g., 5 Marla)",
      createRooms: "Number of Rooms (Optional)",
      createRoomsPlaceholder: "e.g., 2 Bed, 1 Lounge",
      createFloor: "Floor (Optional)",
      createFloorPlaceholder: "e.g., Ground, 1st, Double Story",
      createDesc: "Detailed Description",
      createContact: "Contact Mobile Number",
      createContactPlaceholder: "e.g., 0321-5551234",
      createImages: "Property Images",
      imagePlaceholder: "Enter image URL or select preset below",
      addPreset: "Use Preset Image",
      publishBtn: "Publish Property",
      fieldRequired: "This field is required",
      presetImagesTitle: "Or choose from standard templates:",
      uploadBtn: "Add Image URL",
      successTitle: "Property Posted Successfully!",
      successDesc: "Your listing has been published and is now visible in the community hub.",
      goToList: "View Listings",
      savedPropertiesTitle: "Saved Properties",
      noSavedDesc: "You have no saved properties yet. Tap the heart icon on any listing to save it.",
      browseAll: "Browse Properties",
      reportListing: "Report Listing",
      reportedAlert: "This listing has been reported for review. Thank you!",
      markUnavailable: "Mark Unavailable",
      markAvailable: "Mark Available",
      unavailableBadge: "Unavailable",
      statusLabel: "Status"
    },
    ur: {
      header: "جائیدادیں",
      rent: "کرایہ",
      sale: "فروخت",
      searchPlaceholder: "ڈھوک حسو میں جائیداد تلاش کریں...",
      all: "تمام اقسام",
      house: "مکان",
      shop: "دکان",
      plot: "پلاٹ",
      apartment: "اپارٹمنٹ",
      room: "کمرہ",
      commercial: "تجارتی",
      viewBtn: "دیکھیں",
      contactBtn: "رابطہ کریں",
      areaLabel: "رقبہ",
      roomsLabel: "کمرے",
      floorLabel: "منزل",
      postProperty: "جائیداد پوسٹ کریں",
      owner: "پوسٹ کنندہ",
      backToList: "واپس جائیدادوں پر",
      description: "تفصیل",
      callBtn: "کال کریں",
      msgBtn: "پیغام",
      saveBtn: "محفوظ کریں",
      saved: "محفوظ ہو گیا",
      shareBtn: "شیئر کریں",
      copied: "لنک کاپی ہو گیا ہے!",
      createHeader: "اپنی جائیداد شائع کریں",
      createTitle: "جائیداد کا عنوان",
      createType: "جائیداد کی کیٹیگری",
      createPurpose: "کرایہ / فروخت",
      createPrice: "قیمت",
      createPricePlaceholder: "مثال: 25,000 روپے ماہانہ یا 1.2 کروڑ روپے",
      createArea: "رقبہ (مثال: 5 مرلہ)",
      createRooms: "کمروں کی تعداد (اختیاری)",
      createRoomsPlaceholder: "مثال: 2 کمرے، 1 ہال",
      createFloor: "منزل (اختیاری)",
      createFloorPlaceholder: "مثال: گراؤنڈ فلور، فرسٹ فلور",
      createDesc: "تفصیلی وضاحت",
      createContact: "رابطہ موبائل نمبر",
      createContactPlaceholder: "مثال: 0321-5551234",
      createImages: "جائیداد کی تصاویر",
      imagePlaceholder: "تصویر کا یو آر ایل درج کریں یا نیچے سے منتخب کریں",
      addPreset: "تصویر منتخب کریں",
      publishBtn: "جائیداد شائع کریں",
      fieldRequired: "یہ فیلڈ درکار ہے",
      presetImagesTitle: "یا نیچے سے تصاویر منتخب کریں:",
      uploadBtn: "تصویر شامل کریں",
      successTitle: "جائیداد کامیابی کے ساتھ پوسٹ ہو گئی!",
      successDesc: "آپ کا اشتہار شائع ہو گیا ہے اور اب وہ سب کو نظر آ رہا ہے۔",
      goToList: "اشتہارات دیکھیں",
      savedPropertiesTitle: "محفوظ کردہ جائیدادیں",
      noSavedDesc: "آپ کے پاس کوئی محفوظ کردہ جائیداد نہیں ہے۔ محفوظ کرنے کے لیے دل کے نشان پر کلک کریں۔",
      browseAll: "تمام جائیدادیں براؤز کریں",
      reportListing: "رپورٹ کریں",
      reportedAlert: "اس اشتہار کی رپورٹ درج کر لی گئی ہے۔ شکریہ!",
      markUnavailable: "غیر دستیاب کریں",
      markAvailable: "دستیاب کریں",
      unavailableBadge: "غیر دستیاب",
      statusLabel: "حیثیت"
    }
  }[currentLanguage];

  // Category Selector chips configuration
  const categoryChips = [
    { id: 'All', label: t.all },
    { id: 'House', label: t.house },
    { id: 'Apartment', label: t.apartment },
    { id: 'Plot', label: t.plot },
    { id: 'Shop', label: t.shop },
    { id: 'Room', label: t.room },
    { id: 'Commercial', label: t.commercial },
    { id: 'Rent', label: t.rent },
    { id: 'Sale', label: t.sale }
  ];

  // Filter properties based on active category chips, search, and deleted states
  const filteredProperties = useMemo(() => {
    const userLoc = getCurrentUserLocation();
    return properties.filter(item => {
      // Filter out reported properties completely
      if (item.reported) return false;

      const matchesLocation = !item.location || item.location?.toLowerCase().includes(userLoc?.toLowerCase()) || userLoc?.toLowerCase().includes(item.location?.toLowerCase());
      if (!matchesLocation) return false;

      // Category chip check
      if (selectedCategory !== 'All') {
        const cat = selectedCategory?.toLowerCase();
        if (cat === 'rent') {
          if (item.purpose !== 'Rent') return false;
        } else if (cat === 'sale') {
          if (item.purpose !== 'Sale') return false;
        } else {
          if (item.type?.toLowerCase() !== cat) return false;
        }
      }

      // If viewing saved properties only
      if (activeView === 'saved') {
        if (!savedProperties[item.id]) return false;
      }

      // Search check
      if (searchQuery) {
        const query = searchQuery?.toLowerCase();
        return (
          (item.title && item.title?.toLowerCase().includes(query)) ||
          (item.location && item.location?.toLowerCase().includes(query)) ||
          (item.type && item.type?.toLowerCase().includes(query)) ||
          (item.description && item.description?.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [properties, selectedCategory, searchQuery, activeView, savedProperties]);

  // Find active property for Detail view
  const selectedProperty = useMemo(() => {
    if (!selectedPropertyId) return null;
    return properties.find(p => p.id === selectedPropertyId) || null;
  }, [properties, selectedPropertyId]);

  // Toggle Save Property
  const handleToggleSave = (id: string) => {
    setSavedProperties(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      return updated;
    });
  };

  // Preset image selection
  const handleSelectPreset = (url: string) => {
    if (formImages.includes(url)) {
      setFormImages(prev => prev.filter(img => img !== url));
    } else {
      setFormImages(prev => [...prev, url]);
    }
  };

  // Add custom URL
  const handleAddCustomImageUrl = () => {
    if (imageUrlInput?.trim()) {
      setFormImages(prev => [...prev, imageUrlInput?.trim()]);
      setImageUrlInput('');
    }
  };

  // Remove form image
  const handleRemoveFormImage = (index: number) => {
    setFormImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle gallery file upload from device
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      if (isSupabaseConfigured) {
        const url = await dbUploadPropertyImage(file);
        if (url) {
          setFormImages(prev => [...prev, url]);
        } else {
          // Fallback: use local object URL so user can still see the image
          const localUrl = URL.createObjectURL(file);
          setFormImages(prev => [...prev, localUrl]);
        }
      } else {
        // Offline: use local object URL
        const localUrl = URL.createObjectURL(file);
        setFormImages(prev => [...prev, localUrl]);
      }
    }
    setIsUploadingImage(false);
    // Reset file input so same file can be re-selected
    e.target.value = '';
  };

  // Handle submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formTitle?.trim()) errors.title = t.fieldRequired;
    if (!formPrice?.trim()) errors.price = t.fieldRequired;
    if (!formArea?.trim()) errors.area = t.fieldRequired;
    if (!formDescription?.trim()) errors.description = t.fieldRequired;
    if (!formContact?.trim()) errors.contact = t.fieldRequired;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    // Use default images if none selected
    const finalImages = formImages.length > 0 ? formImages : [DEFAULT_PROPERTY_IMAGES[Math.floor(Math.random() * DEFAULT_PROPERTY_IMAGES.length)]];

    const newProperty: PropertyItem = {
      id: `pr_${Date.now()}`,
      title: formTitle,
      type: formType,
      purpose: formPurpose,
      price: formPrice,
      area: formArea,
      rooms: formRooms || undefined,
      floor: formFloor || undefined,
      description: formDescription,
      contact: formContact,
      images: finalImages,
      location: 'Dhoke Hassu, Rawalpindi',
      ownerName: 'You (Local Member)',
      featured: false
    };

    onAddProperty(newProperty);
    setIsSuccessMessage(true);

    // Reset Form
    setFormTitle('');
    setFormPrice('');
    setFormArea('');
    setFormRooms('');
    setFormFloor('');
    setFormDescription('');
    setFormContact('');
    setFormImages([]);
  };

  // Copy link helper
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/property/detail?propertyId=${selectedPropertyId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(t.copied);
    });
  };

  // ==========================================
  // VIEW: CREATE / POST PROPERTY
  // ==========================================
  if (activeView === 'create') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden p-6 max-w-3xl mx-auto space-y-6" id="post-property-container">
      {/* Top Banner Ad Segment */}
      {topBannerAd && (
        <div className="mb-6">
          <AdBannerCard ad={topBannerAd} />
        </div>
      )}

        {/* Back navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToList}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors cursor-pointer"
            id="create-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-black text-slate-900 leading-none">
            {t.createHeader}
          </h2>
        </div>

        {isSuccessMessage ? (
          <div className="py-8 text-center space-y-4" id="create-success-screen">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">{t.successTitle}</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">{t.successDesc}</p>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={() => {
                  setIsSuccessMessage(false);
                  onNavigateToList();
                }}
                className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-sm transition-all cursor-pointer font-bold"
                id="success-view-list-btn"
              >
                {t.goToList}
              </button>
              <button
                onClick={() => {
                  setIsSuccessMessage(false);
                }}
                className="py-3 px-6 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl transition-all cursor-pointer"
                id="success-post-another-btn"
              >
                {currentLanguage === 'en' ? 'Post Another' : 'مزید پوسٹ کریں'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" id="create-property-form">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.createTitle} <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={currentLanguage === 'en' ? "e.g., Beautiful 5 Marla Double Story House" : "مثال: خوبصورت 5 مرلہ ڈبل سٹوری مکان"}
                className={`w-full border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.title ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-blue-500'}`}
                id="form-title-input"
              />
              {formErrors.title && <p className="text-xs font-semibold text-red-500">{formErrors.title}</p>}
            </div>

            {/* Purpose & Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.createType}</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all focus:border-blue-500"
                  id="form-type-select"
                >
                  <option value="House">{t.house}</option>
                  <option value="Apartment">{t.apartment}</option>
                  <option value="Plot">{t.plot}</option>
                  <option value="Shop">{t.shop}</option>
                  <option value="Room">{t.room}</option>
                  <option value="Commercial">{t.commercial}</option>
                </select>
              </div>

              {/* Purpose */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.createPurpose}</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormPurpose('Rent')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${formPurpose === 'Rent' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    id="form-purpose-rent"
                  >
                    {t.rent}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPurpose('Sale')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${formPurpose === 'Sale' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    id="form-purpose-sale"
                  >
                    {t.sale}
                  </button>
                </div>
              </div>
            </div>

            {/* Price & Area Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.createPrice} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder={t.createPricePlaceholder}
                  className={`w-full border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.price ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-blue-500'}`}
                  id="form-price-input"
                />
                {formErrors.price && <p className="text-xs font-semibold text-red-500">{formErrors.price}</p>}
              </div>

              {/* Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.createArea} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value)}
                  placeholder="e.g., 5 Marla, 1 Kanal"
                  className={`w-full border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.area ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-blue-500'}`}
                  id="form-area-input"
                />
                {formErrors.area && <p className="text-xs font-semibold text-red-500">{formErrors.area}</p>}
              </div>
            </div>

            {/* Rooms & Floors Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rooms */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.createRooms}</label>
                <input
                  type="text"
                  value={formRooms}
                  onChange={(e) => setFormRooms(e.target.value)}
                  placeholder={t.createRoomsPlaceholder}
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all focus:border-blue-500"
                  id="form-rooms-input"
                />
              </div>

              {/* Floor */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.createFloor}</label>
                <input
                  type="text"
                  value={formFloor}
                  onChange={(e) => setFormFloor(e.target.value)}
                  placeholder={t.createFloorPlaceholder}
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all focus:border-blue-500"
                  id="form-floor-input"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.createDesc} <span className="text-red-500">*</span></label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={currentLanguage === 'en' ? "Describe the condition, near landmarks, utilities (water, gas, electricity)..." : "جائیداد کی حالت، قریبی معروف مقامات، سہولیات (پانی، گیس، بجلی) کی تفصیل..."}
                rows={4}
                className={`w-full border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.description ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-blue-500'}`}
                id="form-desc-textarea"
              />
              {formErrors.description && <p className="text-xs font-semibold text-red-500">{formErrors.description}</p>}
            </div>

            {/* Contact */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.createContact} <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formContact}
                onChange={(e) => setFormContact(e.target.value)}
                placeholder={t.createContactPlaceholder}
                className={`w-full border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.contact ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-blue-500'}`}
                id="form-contact-input"
              />
              {formErrors.contact && <p className="text-xs font-semibold text-red-500">{formErrors.contact}</p>}
            </div>

            {/* Images Selection & Upload */}
            <div className="space-y-3.5 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">{t.createImages}</label>
              
              {/* Custom url input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder={t.imagePlaceholder}
                  className="flex-1 border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all focus:border-blue-500"
                  id="form-custom-image-url"
                />
                <button
                  type="button"
                  onClick={handleAddCustomImageUrl}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                  id="form-add-image-url-btn"
                >
                  {t.uploadBtn}
                </button>
              </div>

              {/* Gallery Upload Button */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  id="property-gallery-file-input"
                  className="hidden"
                  onChange={handleGalleryUpload}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('property-gallery-file-input')?.click()}
                  disabled={isUploadingImage}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed text-blue-700 font-bold text-sm rounded-xl border-2 border-dashed border-blue-200 transition-all cursor-pointer"
                  id="property-gallery-upload-btn"
                >
                  {isUploadingImage ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      <span>{currentLanguage === 'en' ? 'Uploading...' : 'اپلوڈ ہو رہا ہے...'}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4"/>
                        <rect x="3" y="3" width="18" height="18" rx="3" strokeLinecap="round" strokeLinejoin="round" opacity="0"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                        <circle cx="12" cy="13" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{currentLanguage === 'en' ? '📷 Upload from Gallery' : '📷 گیلری سے تصویر اپلوڈ کریں'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Presets Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500">{t.presetImagesTitle}</span>
                <div className="grid grid-cols-5 gap-2" id="form-presets-grid">
                  {DEFAULT_PROPERTY_IMAGES.map((url, idx) => {
                    const isSelected = formImages.includes(url);
                    return (
                      <div 
                        key={idx}
                        onClick={() => handleSelectPreset(url)}
                        className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 ${isSelected ? 'border-blue-600 scale-95 ring-2 ring-blue-100' : 'border-transparent'}`}
                      >
                        <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-600/25 flex items-center justify-center">
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
                <div className="space-y-2" id="selected-images-container">
                  <span className="text-[11px] font-bold text-slate-500">
                    {currentLanguage === 'en' ? 'Selected Images:' : 'منتخب کردہ تصاویر:'} ({formImages.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {formImages.map((url, index) => (
                      <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group">
                        <img src={url} alt="Selected Property" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveFormImage(index)}
                          className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit buttons */}
            <div className="pt-4 flex gap-3 border-t border-slate-100">
              <button
                type="submit"
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer text-center font-bold border-0"
                id="form-submit-publish-btn"
              >
                🚀 {t.publishBtn}
              </button>
              <button
                type="button"
                onClick={onNavigateToList}
                className="py-3.5 px-6 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl transition-all cursor-pointer"
                id="form-cancel-btn"
              >
                {currentLanguage === 'en' ? 'Cancel' : 'منسوخ کریں'}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW: PROPERTY DETAIL
  // ==========================================
  if (activeView === 'detail' && selectedProperty) {
    const images = selectedProperty.images && selectedProperty.images.length > 0 
      ? selectedProperty.images 
      : [DEFAULT_PROPERTY_IMAGES[0]];
    const isSaved = !!savedProperties[selectedProperty.id];
    const isOwner = selectedProperty.ownerName?.includes('You') || false;

    return (
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden max-w-4xl mx-auto space-y-6" id={`property-detail-container-${selectedProperty.id}`}>
        {/* Gallery & Header */}
        <div className="relative">
          {/* Back button overlay */}
          <button
            onClick={onNavigateToList}
            className="absolute top-4 left-4 z-10 p-2.5 bg-white/95 text-slate-800 hover:bg-white rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs border-0"
            id="detail-back-btn"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{currentLanguage === 'en' ? 'Back' : 'واپس'}</span>
          </button>

          {/* Main big image */}
          <div className="w-full flex justify-center bg-slate-100 relative overflow-hidden rounded-t-3xl border-b border-slate-200">
            <div className="w-full max-w-[700px] relative">
              <img 
                src={images[activeImageIndex]} 
                alt={selectedProperty.title} 
                className="w-full h-80 sm:h-[450px] object-contain block"
              />
              
              {/* Index label */}
              <span className="absolute bottom-4 right-4 bg-black/75 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl backdrop-blur-xs z-10">
                {activeImageIndex + 1} / {images.length}
              </span>
            

            {/* Unavailable Overlay */}
            {selectedProperty.unavailable && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="bg-red-600 text-white font-black text-xl tracking-wider uppercase px-6 py-3 rounded-2xl shadow-lg border border-red-500">
                  ⚠️ {t.unavailableBadge}
                </span>
              </div>
            )}
            </div>
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex gap-2 overflow-x-auto" id="detail-thumbnail-strip">
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

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Main info heading */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="inline-flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                  ⚡ {selectedProperty.purpose === 'Rent' ? t.rent : t.sale}
                </span>
                <span className="inline-flex items-center text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                  🏢 {selectedProperty.type}
                </span>
              </div>

              {/* Status and Action Panel */}
              <div className="flex items-center gap-2">
                {/* Mark unavailable / available toggle */}
                <button
                  onClick={() => onToggleAvailability?.(selectedProperty.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors border ${
                    selectedProperty.unavailable 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                      : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                  }`}
                  id="detail-toggle-avail-btn"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{selectedProperty.unavailable ? t.markAvailable : t.markUnavailable}</span>
                </button>

                {/* Report Listing Button */}
                <button
                  onClick={() => {
                    onReportProperty?.(selectedProperty.id);
                    alert(t.reportedAlert);
                    onNavigateToList();
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5 cursor-pointer transition-colors"
                  id="detail-report-btn"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{t.reportListing}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {selectedProperty.title}
                </h1>
                <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                  📍 {selectedProperty.location}
                </p>
              </div>

              <div className="bg-blue-50/50 border border-blue-100/30 p-4 rounded-2xl flex flex-col justify-center shrink-0">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider font-bold">
                  {currentLanguage === 'en' ? 'Price' : 'قیمت'}
                </span>
                <span className="text-xl sm:text-2xl font-black text-blue-600">
                  {selectedProperty.price}
                </span>
              </div>
            </div>
          </div>

          {/* Meta Specifications Grid */}
          <div className="grid grid-cols-4 gap-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100" id="detail-specs-grid">
            <div className="text-center p-2 bg-white rounded-xl shadow-xs flex flex-col items-center justify-center space-y-1">
              <Grid className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.areaLabel}</span>
              <span className="text-xs sm:text-sm font-black text-slate-800">{selectedProperty.area}</span>
            </div>
            <div className="text-center p-2 bg-white rounded-xl shadow-xs flex flex-col items-center justify-center space-y-1">
              <Home className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.roomsLabel}</span>
              <span className="text-xs sm:text-sm font-black text-slate-800">{selectedProperty.rooms || 'N/A'}</span>
            </div>
            <div className="text-center p-2 bg-white rounded-xl shadow-xs flex flex-col items-center justify-center space-y-1">
              <Layers className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.floorLabel}</span>
              <span className="text-xs sm:text-sm font-black text-slate-800">{selectedProperty.floor || 'N/A'}</span>
            </div>
            <div className="text-center p-2 bg-white rounded-xl shadow-xs flex flex-col items-center justify-center space-y-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.statusLabel}</span>
              <span className={`text-xs sm:text-sm font-black ${selectedProperty.unavailable ? 'text-rose-600' : 'text-emerald-600'}`}>
                {selectedProperty.unavailable ? t.unavailableBadge : (currentLanguage === 'en' ? 'Available' : 'دستیاب')}
              </span>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              📝 {t.description}
            </h3>
            <div className="text-sm text-slate-600 leading-relaxed bg-slate-50/20 border border-slate-100 p-4 rounded-2xl whitespace-pre-wrap">
              {selectedProperty.description || (currentLanguage === 'en' 
                ? 'No additional description provided for this property listing. Please contact the owner directly for detailed inquiries and structural conditions.'
                : 'اس جائیداد کی تفصیلی وضاحت فراہم نہیں کی گئی ہے۔ براہ کرم تفصیلی معلومات کے لیے جائیداد کے مالک سے رابطہ کریں۔')}
            </div>
          </div>

          {/* Owner Info card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between" id="detail-owner-card">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 bg-blue-600 text-white font-extrabold rounded-full flex items-center justify-center text-lg shadow-sm uppercase cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all"
                data-profile-name={selectedProperty.ownerName || 'Local Member'}
              >
                {(selectedProperty.ownerName || 'U')[0]}
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.owner}</span>
                <h4 
                  className="font-extrabold text-slate-900 text-sm leading-tight cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                  data-profile-name={selectedProperty.ownerName || 'Local Member'}
                >
                  {selectedProperty.ownerName || (currentLanguage === 'en' ? 'Local Member' : 'مقامی ممبر')}
                </h4>
                <p className="text-xs text-slate-500 font-semibold">{selectedProperty.contact}</p>
              </div>
            </div>
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{currentLanguage === 'en' ? 'Verified Post' : 'تصدیق شدہ'}</span>
            </div>
          </div>

          {/* Primary Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
            {/* Call */}
            <button
              onClick={() => {
                alert(currentLanguage === 'en' 
                  ? `Dialing ${selectedProperty.ownerName || 'Owner'}: ${selectedProperty.contact}`
                  : `رابطہ کیا جا رہا ہے: ${selectedProperty.contact}`
                );
                window.open(`tel:${selectedProperty.contact}`);
              }}
              disabled={selectedProperty.unavailable}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-6 text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border-0 ${
                selectedProperty.unavailable ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-green-500 hover:bg-green-600'
              }`}
              id="detail-call-btn"
            >
              <Phone className="w-4 h-4" />
              <span>{t.callBtn}</span>
            </button>

            {/* Message */}
            <button
              onClick={() => {
                if ((window as any).openChat) {
                  (window as any).openChat(selectedProperty.contact, selectedProperty.ownerName || 'Property Owner', '');
                } else {
                  alert(currentLanguage === 'en' 
                    ? `Send SMS to ${selectedProperty.contact}. Standard rates apply.`
                    : `رابطہ کرنے کے لیے ایس ایم ایس بھیجیں: ${selectedProperty.contact}`
                  );
                  window.open(`sms:${selectedProperty.contact}?body=Assalam-o-Alaikum, I am interested in your property: ${selectedProperty.title}`);
                }
              }}
              disabled={selectedProperty.unavailable}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-6 text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer border-0 ${
                selectedProperty.unavailable ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#2563eb] hover:bg-blue-700'
              }`}
              id="detail-message-btn"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.msgBtn}</span>
            </button>

            {/* Save */}
            <button
              onClick={() => handleToggleSave(selectedProperty.id)}
              className={`py-3 px-4 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs ${isSaved ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
              id="detail-save-btn"
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-600 text-rose-600' : ''}`} />
              <span>{isSaved ? t.saved : t.saveBtn}</span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs"
              id="detail-share-btn"
            >
              <Share2 className="w-4 h-4" />
              <span>{t.shareBtn}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: SAVED PROPERTIES
  // ==========================================
  if (activeView === 'saved') {
    return (
      <div className="space-y-6" id="property-saved-root">
        {/* Header Panel */}
        <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs" id="property-saved-header-panel">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToList}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors cursor-pointer border-0"
              id="saved-back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                ❤️ {t.savedPropertiesTitle}
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {currentLanguage === 'en' 
                  ? 'Your personally bookmarked homes, shops, and apartments' 
                  : 'آپ کے پسندیدہ مکانات، دکانیں اور فلیٹس'}
              </p>
            </div>
          </div>
        </div>

        {/* Listings Grid or Empty State */}
        {filteredProperties.length === 0 ? (
          <div className="bg-white border border-slate-200/60 p-12 rounded-3xl text-center space-y-4" id="saved-empty-container">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <Heart className="w-8 h-8 fill-rose-500" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 text-base">
                {currentLanguage === 'en' ? 'No Saved Properties' : 'کوئی محفوظ کردہ جائیداد نہیں ہے'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {t.noSavedDesc}
              </p>
            </div>
            <button
              onClick={onNavigateToList}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer font-bold border-0"
              id="saved-browse-btn"
            >
              {t.browseAll}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="saved-properties-grid">
            {filteredProperties.map((prop) => {
              const hasImages = prop.images && prop.images.length > 0;
              const displayImg = hasImages ? prop.images![0] : DEFAULT_PROPERTY_IMAGES[0];
              const isSaved = !!savedProperties[prop.id];

              return (
                <div
                  key={prop.id}
                  className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-sm relative group"
                  id={`saved-property-card-${prop.id}`}
                >
                  {/* Image Section */}
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    <img 
                      src={displayImg} 
                      alt={prop.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Purpose badge */}
                    <span className="absolute top-3 left-3 bg-black/75 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs">
                      {prop.purpose === 'Rent' ? t.rent : t.sale}
                    </span>
                    
                    {/* Save button overlay */}
                    <button
                      onClick={() => handleToggleSave(prop.id)}
                      className="absolute top-3 right-3 p-2 bg-white/95 text-slate-600 hover:bg-white rounded-full shadow-md transition-all cursor-pointer border-0"
                      id={`saved-save-btn-overlay-${prop.id}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
                    </button>

                    {/* Price overlay */}
                    <div className="absolute bottom-3 left-3 bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-md">
                      {prop.price}
                    </div>

                    {/* Unavailable Badge */}
                    {prop.unavailable && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-lg">
                          {t.unavailableBadge}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      {/* Chip indicators */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full uppercase font-bold text-blue-600">
                          {prop.type}
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                          📐 {prop.area}
                        </span>
                        {prop.rooms && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                            🛏️ {prop.rooms}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 
                        onClick={() => onNavigateToDetail(prop.id)}
                        className="font-black text-slate-900 text-sm hover:text-blue-600 cursor-pointer transition-colors leading-tight line-clamp-1"
                      >
                        {prop.title}
                      </h3>

                      {/* Address location */}
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        📍 {prop.location}
                      </p>
                    </div>

                    {/* Action buttons (View, Save, Contact) */}
                    <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 mt-2">
                      <button
                        onClick={() => onNavigateToDetail(prop.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                        id={`saved-view-detail-btn-${prop.id}`}
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.viewBtn}</span>
                      </button>

                      <button
                        onClick={() => handleToggleSave(prop.id)}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border rounded-lg transition-all cursor-pointer text-[10px] font-bold ${
                          isSaved 
                            ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                        id={`saved-save-btn-${prop.id}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
                        <span>{isSaved ? t.saved : t.saveBtn}</span>
                      </button>

                      <button
                        onClick={() => {
                          alert(currentLanguage === 'en' 
                            ? `Contacting owner at ${prop.contact}`
                            : `مالک سے اس نمبر پر رابطہ کریں: ${prop.contact}`
                          );
                          window.open(`tel:${prop.contact}`);
                        }}
                        disabled={prop.unavailable}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-white text-[10px] font-bold rounded-lg shadow-xs transition-all cursor-pointer border-0 ${
                          prop.unavailable ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                        id={`saved-call-owner-btn-${prop.id}`}
                      >
                        <Phone className="w-3 h-3" />
                        <span>{t.contactBtn}</span>
                      </button>
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

  // ==========================================
  // VIEW: LISTING PAGE
  // ==========================================
  return (
    <div className="space-y-6" id="property-list-root">
      {/* Top Banner Ad Segment */}
      {topBannerAd && (
        <div className="mb-6">
          <AdBannerCard ad={topBannerAd} />
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs" id="property-list-header-panel">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            🏡 {t.header}
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            {currentLanguage === 'en' 
              ? 'Find verified homes, shops, and plots for Rent or Sale in Dhoke Hassu' 
              : 'ڈھوک حسو میں کرائے یا فروخت کے لیے تصدیق شدہ مکانات، دکانیں اور پلاٹ تلاش کریں'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Saved properties button */}
          <button
            onClick={onNavigateToSaved}
            className="inline-flex items-center justify-center gap-1.5 bg-rose-55 hover:bg-rose-50 text-rose-600 font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all cursor-pointer font-bold border border-rose-200"
            id="list-saved-properties-btn"
          >
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            <span>{t.savedPropertiesTitle} ({Object.values(savedProperties).filter(Boolean).length})</span>
          </button>

          {/* Post Property button */}
          <button
            onClick={onNavigateToCreate}
            className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer font-bold border-0"
            id="list-post-property-btn"
          >
            <Plus className="w-4 h-4" />
            <span>{t.postProperty}</span>
          </button>
        </div>
      </div>

      {/* Top Controls: Category filters, Search Input */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-xs space-y-4" id="property-list-controls">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200/80 focus:border-blue-500 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            id="list-search-input"
          />
        </div>

        {/* Filter Chips row containing exactly: House, Apartment, Plot, Shop, Room, Commercial, Rent, Sale */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-200" id="type-chips-container">
          {categoryChips.map((chip) => {
            const isSelected = selectedCategory === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedCategory(chip.id)}
                className={`py-1.5 px-4 rounded-full text-xs font-extrabold border transition-all cursor-pointer whitespace-nowrap ${
                  isSelected 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
                id={`chip-filter-${chip.id?.toLowerCase()}`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeletons or Listings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="properties-skeleton-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 p-4 space-y-4 animate-pulse">
              <div className="aspect-video bg-slate-200 rounded-2xl w-full" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                <div className="h-3 bg-slate-100 rounded-md w-5/6" />
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <div className="h-8 bg-slate-100 rounded-lg flex-1" />
                <div className="h-8 bg-slate-100 rounded-lg flex-1" />
                <div className="h-8 bg-slate-100 rounded-lg flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-white border border-slate-200/60 p-12 rounded-3xl text-center space-y-3" id="no-properties-container">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Info className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-sm">
              {currentLanguage === 'en' ? 'No Properties Found' : 'جائیدادیں دستیاب نہیں ہیں'}
            </h4>
            <p className="text-xs text-slate-500">
              {currentLanguage === 'en' 
                ? 'Try adjusting your search filters or check another category.' 
                : 'براہ کرم تلاش کا فلٹر تبدیل کریں یا کسی دوسری کیٹیگری کو منتخب کریں۔'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="properties-grid">
          {(() => {
            const elements = [];
            for (let i = 0; i < filteredProperties.length; i++) {
              const prop = filteredProperties[i];
              const hasImages = prop.images && prop.images.length > 0;
              const displayImg = hasImages ? prop.images![0] : DEFAULT_PROPERTY_IMAGES[0];
              const isSaved = !!savedProperties[prop.id];
              const ad = propertyAdMap[i];

              elements.push(
                <div
                  key={prop.id}
                  className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-sm relative group"
                  id={`property-card-${prop.id}`}
                >
                  {/* Image Section */}
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    <img 
                      src={displayImg} 
                      alt={prop.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Purpose badge */}
                    <span className="absolute top-3 left-3 bg-black/75 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs">
                      {prop.purpose === 'Rent' ? t.rent : t.sale}
                    </span>
                    
                    {/* Save button overlay */}
                    <button
                      onClick={() => handleToggleSave(prop.id)}
                      className="absolute top-3 right-3 p-2 bg-white/95 text-slate-600 hover:bg-white rounded-full shadow-md transition-all cursor-pointer border-0"
                      id={`save-btn-overlay-${prop.id}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
                    </button>

                    {/* Price overlay */}
                    <div className="absolute bottom-3 left-3 bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-md">
                      {prop.price}
                    </div>

                    {/* Unavailable Badge */}
                    {prop.unavailable && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-red-600 text-white font-black text-xs px-3 py-1 rounded-lg">
                          {t.unavailableBadge}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      {/* Chip indicators */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full uppercase font-bold text-blue-600">
                          {prop.type}
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                          📐 {prop.area}
                        </span>
                        {prop.rooms && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                            🛏️ {prop.rooms}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 
                        onClick={() => onNavigateToDetail(prop.id)}
                        className="font-black text-slate-900 text-sm hover:text-blue-600 cursor-pointer transition-colors leading-tight line-clamp-1"
                      >
                        {prop.title}
                      </h3>

                      {/* Description excerpt */}
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {prop.description || (currentLanguage === 'en' 
                          ? 'Click to see full specifications and owner detailed notes.' 
                          : 'تفصیلات اور مالک کے خصوصی نوٹس دیکھنے کے لیے کلک کریں۔')}
                      </p>

                      {/* Address location */}
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        📍 {prop.location}
                      </p>
                    </div>

                    {/* Action buttons (View, Save, Contact) */}
                    <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 mt-2">
                      {/* View Details button */}
                      <button
                        onClick={() => onNavigateToDetail(prop.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                        id={`view-detail-btn-${prop.id}`}
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.viewBtn}</span>
                      </button>

                      {/* Save button */}
                      <button
                        onClick={() => handleToggleSave(prop.id)}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border rounded-lg transition-all cursor-pointer text-[10px] font-bold ${
                          isSaved 
                            ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                        id={`save-btn-${prop.id}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
                        <span>{isSaved ? t.saved : t.saveBtn}</span>
                      </button>

                      {/* Contact button */}
                      <button
                        onClick={() => {
                          alert(currentLanguage === 'en' 
                            ? `Contacting owner at ${prop.contact}`
                            : `مالک سے اس نمبر پر رابطہ کریں: ${prop.contact}`
                          );
                          window.open(`tel:${prop.contact}`);
                        }}
                        disabled={prop.unavailable}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-white text-[10px] font-bold rounded-lg shadow-xs transition-all cursor-pointer border-0 ${
                          prop.unavailable ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                        id={`call-owner-btn-${prop.id}`}
                      >
                        <Phone className="w-3 h-3" />
                        <span>{t.contactBtn}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );

              // Inject Property Listings active ad via rotation
              if (ad) {
                elements.push(
                  <div key={`ad-prop-${i}-${ad.id}`} className="md:col-span-2">
                    <AdBannerCard ad={ad} />
                  </div>
                );
              }
            }
            return elements;
          })()}
        </div>
      )}
    </div>
  );
}
