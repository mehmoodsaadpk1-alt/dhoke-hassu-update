/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, 
  Search, 
  PlusCircle, 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Star, 
  Share2, 
  Bookmark, 
  BookmarkCheck,
  Plus, 
  MessageSquare, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  MessageCircle,
  Calendar,
  Send,
  Sparkles,
  Clock,
  User as UserIcon,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag
} from 'lucide-react';
import { BusinessItem, Language, AdItem, User } from '../types';
import { dbGetActiveAds, dbUploadServiceImage } from '../utils/supabaseClient';
import AdBannerCard from './AdBannerCard';
import { useAdRotator } from '../hooks/useAdRotator';
import { getAreaColor, getAreas } from '../utils/locationData';
import { useAdmin } from '../contexts/AdminContext';
import { getCurrentUserLocation } from '../utils/locationService';
import { isEntityVerified } from '../utils/verification';

interface BusinessModuleProps {
  businesses: BusinessItem[];
  onAddBusiness: (business: BusinessItem) => void;
  currentUser?: User | null;
  currentLanguage: Language;
  onNavigateToCreate: () => void;
  onNavigateToList: () => void;
  onNavigateToDetail: (businessId: string) => void;
  selectedBusinessId: string | null;
  activeView: 'list' | 'detail' | 'create';
  onShareToCommunity?: (business: BusinessItem) => void;
}
export default function BusinessModule({
  businesses,
  onAddBusiness,
  currentUser,
  currentLanguage,
  onNavigateToCreate,
  onNavigateToList,
  onNavigateToDetail,
  selectedBusinessId,
  activeView,
  onShareToCommunity
}: BusinessModuleProps) {
const businessBannerMap = useAdRotator('Businesses', 1, 1, 'Banner');
  const businessAdMap = useAdRotator('Businesses', 200, 5, 'Feed');
  const isEn = currentLanguage === 'en';

  // Legacy ad state removed – ads are handled via useAdRotator hook (businessAdMap)

  // State managers
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Saved / Bookmark State
  const [savedBusinesses, setSavedBusinesses] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('dhoke_connect_saved_businesses');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Reported Listings State
  const [reportedBusinesses, setReportedBusinesses] = useState<Record<string, boolean>>(() => {
    try {
      const reported = localStorage.getItem('dhoke_connect_reported_businesses');
      return reported ? JSON.parse(reported) : {};
    } catch {
      return {};
    }
  });

  const [reportModalBusinessId, setReportModalBusinessId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  // Active business detail interactions
  const [activeTab, setActiveTab] = useState<'posts' | 'reviews'>('posts');
  const [newPostText, setNewPostText] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [businessReviews, setBusinessReviews] = useState<Record<string, BusinessItem['reviews']>>({});
  const [businessPosts, setBusinessPosts] = useState<Record<string, BusinessItem['posts']>>({});
  
  // Image zoom modal
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  const { isAdmin: isContextAdmin } = useAdmin();

  // Form states for registering business
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Shops');
  const [formDescription, setFormDescription] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formArea, setFormArea] = useState('Dhoke Hassu');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [formGallery, setFormGallery] = useState<string[]>([]);
  const [formOwnerName, setFormOwnerName] = useState('');
  const [formOpeningHours, setFormOpeningHours] = useState('09:00 AM - 10:00 PM');
  const [formAllowMessages, setFormAllowMessages] = useState(true);

  // Form errors & success
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Upload loading states
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const url = await dbUploadServiceImage(file);
      if (url) {
        setFormCoverImage(url);
      } else {
        // Fallback local url
        setFormCoverImage(URL.createObjectURL(file));
      }
    } catch (err) {
      console.error(err);
      setFormCoverImage(URL.createObjectURL(file));
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingGallery(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await dbUploadServiceImage(files[i]);
        if (url) {
          urls.push(url);
        } else {
          urls.push(URL.createObjectURL(files[i]));
        }
      }
      setFormGallery(prev => [...prev, ...urls]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingGallery(false);
    }
  };

  // 8 Specific Categories requested
  const categories = [
    'All',
    'Shops',
    'Restaurants',
    'Services',
    'Health',
    'Education',
    'Real Estate',
    'Home Services',
    'Other'
  ];

  // Areas list for input helper
  const areas = [
    'Dhoke Hassu',
    'Hazara Colony',
    'Main Road',
    'Saddar Bazar',
    'Railway Gate',
    'Main Chowk',
    'Metro Road'
  ];

  // Simulating loading transition on query/filter changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, showSavedOnly]);

  const toggleSave = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedBusinesses(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem('dhoke_connect_saved_businesses', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCall = (business: BusinessItem) => {
    alert(isEn 
      ? `Dialing ${business.name} at ${business.contact}...`
      : `${business.name} کو اس نمبر پر کال کی جا رہی ہے: ${business.contact}...`
    );
    window.open(`tel:${business.contact}`);
  };

  const handleMessage = (business: BusinessItem) => {
    if ((window as any).openChat) {
      const firstMsg = isEn 
        ? `Hi, I'm interested in your business services/products at ${business.name}.`
        : `السلام علیکم، میں ${business.name} پر آپ کی کاروباری خدمات/مصنوعات میں دلچسپی رکھتا ہوں۔`;
      (window as any).openChat(business.contact, business.name, business.logo || business.image, firstMsg);
    } else {
      const msg = prompt(isEn ? "Enter your query/message:" : "اپنا پیغام لکھیں:");
      if (msg) {
        alert(isEn 
          ? `Query dispatched safely to ${business.name}!`
          : `${business.name} کو آپ کا پیغام کامیابی سے بھیج دیا گیا ہے!`
        );
      }
    }
  };

  const triggerReport = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReportModalBusinessId(id);
  };

  const submitReport = () => {
    if (!reportReason?.trim()) return;
    setReportedBusinesses(prev => {
      const updated = { ...prev, [reportModalBusinessId!]: true };
      localStorage.setItem('dhoke_connect_reported_businesses', JSON.stringify(updated));
      return updated;
    });
    setReportModalBusinessId(null);
    setReportReason('');
    alert(isEn 
      ? 'Thank you! The report has been received. Our community admins will investigate this listing.' 
      : 'شکریہ! رپورٹ موصول ہو گئی۔ ہمارے ایڈمنسٹریٹرز اس لسٹنگ کا جائزہ لیں گے۔'
    );
  };

  // Preset demo assets for creation simulator
  const loadDemoAssets = () => {
    const randomNum = Math.floor(Math.random() * 100);
    setFormCoverImage(`https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200`);
    setFormGallery([
      `https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=600`,
      `https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=600`,
      `https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=600`
    ]);
    alert(isEn ? 'Demo images populated into form!' : 'ڈیمو تصویریں فارم میں درج کر دی گئی ہیں!');
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formName?.trim()) {
      newErrors.name = isEn ? 'Business Name is required' : 'کاروبار کا نام ضروری ہے';
    }
    if (!formPhone?.trim()) {
      newErrors.phone = isEn ? 'Contact Phone is required' : 'رابطہ نمبر ضروری ہے';
    }
    if (!formAddress?.trim()) {
      newErrors.address = isEn ? 'Shop Address is required' : 'پتہ ضروری ہے';
    }
    if (!formDescription?.trim()) {
      newErrors.description = isEn ? 'Business Description is required' : 'کاروبار کی تفصیل ضروری ہے';
    }
    if (!formOwnerName?.trim()) {
      newErrors.owner = isEn ? 'Owner Name is required' : 'مالک کا نام ضروری ہے';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    const defaultCover = formCoverImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200';
    const defaultLogo = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150';

    const newBusiness: BusinessItem = {
      id: `bu-user-${Date.now()}`,
      name: formName,
      category: formCategory,
      rating: 5.0,
      address: formAddress,
      area: formArea,
      contact: formPhone,
      image: formGallery[0] || defaultCover,
      coverImage: defaultCover,
      logo: defaultLogo,
      description: formDescription,
      shortDescription: formDescription?.substring(0, 85) + '...',
      featured: false,
      openingHours: formOpeningHours,
      allowMessages: formAllowMessages,
      ownerName: formOwnerName,
      ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      ownerBio: isEn 
        ? `Dedicated entrepreneur serving Rawalpindi residents with standard products.`
        : `راولپنڈی کے رہائشیوں کو بہترین معیار کی مصنوعات فراہم کرنے والے پرعزم مالک۔`,
      images: formGallery.length > 0 ? formGallery : [defaultCover],
      posts: [],
      reviews: [],
      status: 'Pending'
    };

    onAddBusiness(newBusiness);
    setSuccess(true);

    // Reset Form
    setFormName('');
    setFormDescription('');
    setFormPhone('');
    setFormAddress('');
    setFormOwnerName('');
    setFormCoverImage('');
    setFormGallery([]);
    setFormOpeningHours('09:00 AM - 10:00 PM');
    setFormAllowMessages(true);

    setTimeout(() => {
      setSuccess(false);
      onNavigateToList();
    }, 1800);
  };

  const currentBusiness = businesses.find(b => b.id === selectedBusinessId) || businesses[0];

  const getCurrentReviews = (businessId: string, initialReviews: BusinessItem['reviews']) => {
    return businessReviews[businessId] || initialReviews || [];
  };

  const getCurrentPosts = (businessId: string, initialPosts: BusinessItem['posts']) => {
    return businessPosts[businessId] || initialPosts || [];
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText?.trim()) return;

    const newReview = {
      id: `br-user-${Date.now()}`,
      user: isEn ? 'You (Verified Resident)' : 'آپ (تصدیق شدہ شہری)',
      rating: newReviewRating,
      text: newReviewText,
      date: isEn ? 'Just now' : 'ابھی ابھی'
    };

    const currentList = getCurrentReviews(currentBusiness.id, currentBusiness.reviews);
    const updatedReviews = [newReview, ...currentList];
    
    // Calculate new average rating
    const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const newAverage = parseFloat((totalRating / updatedReviews.length).toFixed(1));

    // Save updated reviews list local state map
    setBusinessReviews({
      ...businessReviews,
      [currentBusiness.id]: updatedReviews
    });

    // Write directly to DB
    const updatedBusiness: BusinessItem = {
      ...currentBusiness,
      reviews: updatedReviews,
      rating: newAverage
    };

    // Propagate up to AppShell state and sync with Supabase Client
    onAddBusiness(updatedBusiness);

    setNewReviewText('');
    setNewReviewRating(5);
    alert(isEn ? 'Review posted to business directory!' : 'تبصرہ کامیابی سے شائع ہو گیا ہے!');
  };

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText?.trim()) return;

    const newPost = {
      id: `bp-user-${Date.now()}`,
      content: newPostText,
      date: isEn ? 'Just now' : 'ابھی ابھی'
    };

    const currentList = getCurrentPosts(currentBusiness.id, currentBusiness.posts);
    setBusinessPosts({
      ...businessPosts,
      [currentBusiness.id]: [newPost, ...currentList]
    });

    setNewPostText('');
    alert(isEn ? 'Update published to business board!' : 'کاروبار کے وال بورڈ پر اپڈیٹ شائع ہو گئی!');
  };

  // Filtering Logic
  const userLoc = getCurrentUserLocation();
  const filteredBusinesses = businesses.filter(bus => {
    // Hide reported listings
    if (reportedBusinesses[bus.id]) return false;

    // Check status moderation
    const isAdmin = currentUser?.email?.toLowerCase().includes('admin') || 
                    currentUser?.email?.toLowerCase().includes('moderator') || 
                    (currentUser as any)?.role?.toLowerCase().includes('admin') || 
                    (currentUser as any)?.role?.toLowerCase().includes('moderator') || 
                    currentUser?.fullName?.toLowerCase().includes('admin') || 
                    currentUser?.fullName?.toLowerCase().includes('moderator') || 
                    isContextAdmin;
    const isOwner = currentUser && (bus.ownerName === currentUser.fullName || bus.contact === currentUser.mobileNumber);
    if (!isAdmin && !isOwner && bus.status === 'Pending') return false;
    if (!isAdmin && !isOwner && bus.status === 'Rejected') return false;

    const matchesLocation = !bus.area || bus.area?.toLowerCase() === userLoc?.toLowerCase();
    if (!matchesLocation) return false;

    const matchesSearch = bus.name?.toLowerCase().includes(searchQuery?.toLowerCase()) || 
                          bus.address?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
                          (bus.area && bus.area?.toLowerCase().includes(searchQuery?.toLowerCase())) ||
                          (bus.description && bus.description?.toLowerCase().includes(searchQuery?.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || bus.category === selectedCategory;
    const matchesSaved = !showSavedOnly || savedBusinesses[bus.id];
    
    return matchesSearch && matchesCategory && matchesSaved;
  });

  // Ad rotation map – computed at component level (Rules of Hooks compliance)


  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4" id="business-module-container">
      {/* Top Banner Ad Segment */}
      {businessBannerMap[0] && (
        <div className="mb-6">
          <AdBannerCard ad={businessBannerMap[0]} />
        </div>
      )}

      
      {/* ----------------- BUSINESS LIST VIEW ----------------- */}
      {activeView === 'list' && (
        <div className="space-y-6">
          {/* Header Block */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Store className="w-7 h-7 text-emerald-600" />
                {isEn ? 'Local Businesses' : 'مقامی کاروبار'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {isEn ? 'Discover and support shops, services, and local utilities in Dhoke Hassu' : 'ڈھوک حسو میں دکانیں، کارآمد سروسز اور روزمرہ سہولیات تلاش کریں'}
              </p>
            </div>
            
            <button
              onClick={onNavigateToCreate}
              className="flex items-center justify-center gap-2 py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-sm hover:shadow-md transition-all shrink-0 cursor-pointer self-start sm:self-auto"
              id="create-business-button-nav"
            >
              <PlusCircle className="w-4 h-4" />
              {isEn ? 'Add Business' : 'اپنا کاروبار درج کریں'}
            </button>
          </div>

          {/* Search bar & Saved Toggle Filter */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch" id="business-search-section">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? 'Search business by name, category, or area (e.g., Main Road)...' : 'کاروبار کا نام، کیٹیگری یا علاقہ تلاش کریں (جیسے مین روڈ)...'}
                className="w-full ps-11 pe-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all shadow-sm"
                id="business-search-input"
              />
            </div>

            {/* Saved Listings Filter Toggle */}
            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`px-5 py-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                showSavedOnly 
                  ? 'bg-emerald-50 border-blue-200 text-emerald-600' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              id="saved-listings-filter-toggle"
            >
              {showSavedOnly ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {isEn ? 'Saved Items' : 'محفوظ کردہ کاروبار'}
            </button>
          </div>

          {/* Categories Horizontal Scrolling Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none select-none" id="business-filter-chips">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-full border transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-extrabold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
                id={`chip-${cat?.toLowerCase().replace(' ', '-')}`}
              >
                {cat === 'All' && (isEn ? 'All' : 'تمام')}
                {cat === 'Shops' && (isEn ? 'Shops 🛍️' : 'دکانیں 🛍️')}
                {cat === 'Restaurants' && (isEn ? 'Restaurants 🍲' : 'ہوٹل و ریسٹورنٹ 🍲')}
                {cat === 'Services' && (isEn ? 'Services ⚙️' : 'سروسز ⚙️')}
                {cat === 'Health' && (isEn ? 'Health 🏥' : 'صحت و میڈیکل 🏥')}
                {cat === 'Education' && (isEn ? 'Education 🎓' : 'تعلیم 🎓')}
                {cat === 'Real Estate' && (isEn ? 'Real Estate 🏢' : 'رئیل اسٹیٹ 🏢')}
                {cat === 'Home Services' && (isEn ? 'Home Services 🛠️' : 'ہوم سروسز 🛠️')}
                {cat === 'Other' && (isEn ? 'Other 📦' : 'دیگر 📦')}
              </button>
            ))}
          </div>

          {/* Business Listings Grid: Desktop -> 2 Columns, Mobile -> 1 Column */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="business-skeletons">
              {[1, 2, 4].map((n) => (
                <div key={n} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-xs animate-pulse">
                  <div className="w-full h-40 bg-slate-100 rounded-2xl" />
                  <div className="space-y-2">
                    <div className="w-1/4 h-3 bg-slate-100 rounded" />
                    <div className="w-3/4 h-5 bg-slate-100 rounded" />
                    <div className="w-1/2 h-3.5 bg-slate-100 rounded" />
                  </div>
                  <div className="w-full h-8 bg-slate-50 rounded-xl pt-2" />
                </div>
              ))}
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm" id="business-empty-state">
              <div className="text-5xl mb-3">🏪</div>
              <h3 className="text-base font-black text-slate-800">
                {isEn ? 'No listings found match your criteria' : 'تلاش کے مطابق کوئی کاروبار دستیاب نہیں ہے'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                {isEn 
                  ? 'Try modifying your search keywords, category chips, or register your own brand to the directory.' 
                  : 'براہ کرم تلاش کا لفظ تبدیل کریں یا اپنے کاروبار کو رجسٹر کر کے لسٹ میں شامل کریں۔'}
              </p>
              {showSavedOnly && (
                <button
                  onClick={() => setShowSavedOnly(false)}
                  className="mt-4 py-2 px-4 bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                  {isEn ? 'Show All Businesses' : 'تمام کاروبار دیکھیں'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="business-grid">
              {(() => {
                const elements = [];
                for (let i = 0; i < filteredBusinesses.length; i++) {
                  const bus = filteredBusinesses[i];
                  const isSaved = savedBusinesses[bus.id];
                  const ad = businessAdMap[i];

                  elements.push(
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={bus.id}
                      className="bg-white rounded-3xl border border-slate-200/60 p-5 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-xs relative group overflow-hidden"
                      id={`business-card-${bus.id}`}
                    >
                      <div className="space-y-3.5">
                        {/* Cover image with Save overlay badge */}
                        <div className="relative w-full h-44 bg-slate-100 rounded-2xl overflow-hidden shadow-xs">
                          <img 
                            src={bus.coverImage || bus.image || 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=600'} 
                            alt={bus.name} 
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          {bus.featured && (
                            <span className="absolute top-3 start-3 bg-yellow-400 text-slate-950 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                              <Sparkles className="w-2.5 h-2.5 fill-current" />
                              {isEn ? 'Featured' : 'نمایاں'}
                            </span>
                          )}

                          {/* Fast Bookmark Toggle Button on Image */}
                          <button
                            onClick={(e) => toggleSave(bus.id, e)}
                            className="absolute top-3 end-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-emerald-600 flex items-center justify-center transition-all shadow-sm cursor-pointer border-0"
                            title={isEn ? "Save Business" : "محفوظ کریں"}
                          >
                            {isSaved ? (
                              <BookmarkCheck className="w-4 h-4 text-emerald-600 fill-current" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                          
                          {/* Rating bubble */}
                          <span className="absolute bottom-3 end-3 bg-black/75 text-white text-[10px] font-black px-2 py-0.5 rounded-xl flex items-center gap-0.5 backdrop-blur-xs shadow-xs">
                            ⭐ {bus.rating.toFixed(1)}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="inline-block text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {bus.category}
                          </span>
                          
                          <h3 
                            onClick={() => onNavigateToDetail(bus.id)}
                            className="font-black text-slate-900 text-base md:text-lg hover:text-emerald-600 cursor-pointer transition-colors leading-tight line-clamp-1 pt-0.5 flex items-center gap-1.5"
                          >
                            <span>{bus.name}</span>
                            {isEntityVerified(bus.name) && (
                              <span className="inline-flex items-center justify-center bg-[#2563eb] text-white rounded-full p-0.5 shrink-0" title="Verified Business" style={{ width: '14px', height: '14px' }}>
                                <svg className="w-2 h-2 stroke-white fill-none" viewBox="0 0 24 24" style={{ strokeWidth: 4 }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                          </h3>

                          {/* Location area specified strictly */}
                          <p className="text-xs text-slate-500 font-bold flex items-center gap-1">
                            📍 {bus.area || 'Dhoke Hassu'} • <span className="text-slate-400 font-normal truncate max-w-[180px]">{bus.address}</span>
                          </p>
                        </div>

                        {/* Short Description */}
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed h-9">
                          {bus.shortDescription || bus.description}
                        </p>
                      </div>

                      {/* Footer Row (View, Save, Contact actions) */}
                      <div className="flex items-center gap-2 pt-3.5 border-t border-slate-100 mt-4">
                        {/* Contact button */}
                        <button
                          onClick={() => handleCall(bus)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border-0"
                          id={`business-contact-btn-${bus.id}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {isEn ? 'Call' : 'کال کریں'}
                        </button>
                        
                        <button
                          onClick={() => onNavigateToDetail(bus.id)}
                          className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-2xl transition-all cursor-pointer text-center font-bold border-0"
                          id={`business-view-btn-${bus.id}`}
                        >
                          {isEn ? 'View Detail' : 'تفصیل دیکھیں'}
                        </button>

                        {/* Save Option */}
                        <button
                          onClick={(e) => toggleSave(bus.id, e)}
                          className={`p-2 rounded-2xl border transition-all cursor-pointer ${
                            isSaved 
                              ? 'bg-emerald-50 border-blue-200 text-emerald-600' 
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'
                          }`}
                          id={`business-save-btn-${bus.id}`}
                          title={isEn ? "Save" : "محفوظ کریں"}
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>

                        {/* Share to Community button */}
                        {onShareToCommunity && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onShareToCommunity(bus);
                            }}
                            className="p-2 rounded-2xl border bg-white border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-emerald-600 transition-all cursor-pointer border-0 flex items-center justify-center"
                            id={`business-share-btn-${bus.id}`}
                            title={isEn ? "Share to Community Feed" : "کمیونٹی فیڈ پر شیئر کریں"}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );

                  // Inject ad if provided by the rotation map
                  if (ad) {
                    elements.push(
                      <div key={`ad-bus-${i}-${ad.id}`} className="md:col-span-2">
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
      )}

      {/* ----------------- BUSINESS DETAIL VIEW ----------------- */}
      {activeView === 'detail' && currentBusiness && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-6" id="business-detail-card">
          {/* Cover Photo */}
          <div className="relative h-56 sm:h-72 bg-slate-100">
            <img 
              src={currentBusiness.coverImage || currentBusiness.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200'} 
              alt={currentBusiness.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Back Arrow Overlay */}
            <button
              onClick={onNavigateToList}
              className="absolute top-4 start-4 inline-flex items-center gap-1.5 text-xs font-black text-slate-700 hover:text-slate-950 bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-2xl transition-all cursor-pointer shadow-md border-0"
              id="business-detail-back"
            >
              <ArrowLeft className="w-4 h-4" />
              {isEn ? 'Back' : 'واپس جائیں'}
            </button>

            {/* Quick stats rating badge */}
            <div className="absolute top-4 end-4 bg-black/60 backdrop-blur-xs text-white text-xs font-bold px-3 py-1.5 rounded-2xl flex items-center gap-1 shadow-sm">
              ⭐ {currentBusiness.rating.toFixed(1)} {isEn ? 'Rating' : 'درجہ بندی'}
            </div>

            {/* Profile Avatar overlay */}
            <div className="absolute -bottom-12 start-6 sm:start-10 w-24 h-24 sm:w-28 sm:h-28 bg-white p-1 rounded-2xl shadow-md border border-slate-150 overflow-hidden">
              <img 
                src={currentBusiness.image || currentBusiness.logo || 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=150'} 
                alt={`${currentBusiness.name} logo`} 
                className="w-full h-full object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Profile Details Container */}
          <div className="px-5 sm:px-10 pt-14 pb-8 space-y-6">
            
            {/* Headline Details */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {currentBusiness.category}
                  </span>
                  <span className="inline-flex items-center text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    📍 {currentBusiness.area || 'Dhoke Hassu'}
                  </span>
                  {currentBusiness.featured && (
                    <span className="inline-flex items-center text-[9px] font-black text-yellow-700 bg-yellow-400/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      ⭐ {isEn ? 'Featured Hub' : 'نمایاں مرکز'}
                    </span>
                  )}
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 leading-tight flex items-center gap-2">
                  <span>{currentBusiness.name}</span>
                  {isEntityVerified(currentBusiness.name) && (
                    <span className="inline-flex items-center justify-center bg-[#2563eb] text-white rounded-full p-0.5 shrink-0" title="Verified Business" style={{ width: '16px', height: '16px' }}>
                      <svg className="w-2.5 h-2.5 stroke-white fill-none" viewBox="0 0 24 24" style={{ strokeWidth: 4 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </h1>

                {/* Star visual rating */}
                <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                  <div className="flex gap-0.5 text-yellow-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < Math.floor(currentBusiness.rating) ? 'fill-current' : 'text-slate-200'}`} 
                      />
                    ))}
                  </div>
                  <span className="ms-1 text-slate-500">({currentBusiness.rating.toFixed(1)})</span>
                </div>
              </div>

              {/* Follow, Bookmark & Report actions */}
              <div className="flex gap-2 shrink-0 flex-wrap">
                {/* Save Toggle */}
                <button
                  onClick={() => toggleSave(currentBusiness.id)}
                  className={`py-2 px-4 text-xs font-extrabold rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                    savedBusinesses[currentBusiness.id]
                      ? 'bg-emerald-50 border-blue-200 text-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                  id="business-detail-save-btn"
                >
                  {savedBusinesses[currentBusiness.id] ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  {savedBusinesses[currentBusiness.id] 
                    ? (isEn ? 'Saved' : 'محفوظ ہے') 
                    : (isEn ? 'Save' : 'محفوظ کریں')
                  }
                </button>

                {/* Share Option */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert(isEn ? 'Share link copied to clipboard!' : 'لنک کاپی ہو گیا ہے!');
                  }}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl transition-all cursor-pointer"
                  title={isEn ? "Share Link" : "لنک شیئر کریں"}
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* Share to Community button */}
                {onShareToCommunity && (
                  <button
                    onClick={() => onShareToCommunity(currentBusiness)}
                    className="py-2 px-4 text-xs font-extrabold rounded-2xl border border-blue-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-all cursor-pointer flex items-center gap-1.5"
                    title={isEn ? "Share to Community Feed" : "کمیونٹی فیڈ پر شیئر کریں"}
                  >
                    <Send className="w-4 h-4" />
                    {isEn ? 'Share to Feed' : 'فیڈ پر شیئر کریں'}
                  </button>
                )}

                {/* Report Option */}
                <button
                  onClick={(e) => triggerReport(currentBusiness.id, e)}
                  className="p-2 border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-2xl transition-all cursor-pointer"
                  title={isEn ? "Report Listing" : "رپورٹ کریں"}
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Opening hours & contact card info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  {isEn ? 'Business Hours' : 'کام کے اوقات'}
                </span>
                <span className="text-sm font-bold text-slate-800 block">
                  {currentBusiness.openingHours || '09:00 AM - 10:00 PM'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  {isEn ? 'Contact Mobile' : 'فون نمبر'}
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono block">
                  {currentBusiness.contact}
                </span>
              </div>

              <div className="space-y-1 col-span-1 sm:col-span-1">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  {isEn ? 'Area Location' : 'مقام'}
                </span>
                <span className="text-sm font-bold text-slate-800 block truncate">
                  {currentBusiness.area || 'Dhoke Hassu'}
                </span>
              </div>
            </div>

            {/* Gallery Images Section */}
            {currentBusiness.images && currentBusiness.images.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  🖼️ {isEn ? 'Product & Shop Gallery' : 'دکان اور گیلری کی تصاویر'}
                </h3>
                
                <div className="grid grid-cols-3 gap-3">
                  {currentBusiness.images.map((img, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setActiveGalleryIndex(idx)}
                      className={`relative aspect-video rounded-2xl bg-slate-50 overflow-hidden cursor-pointer border-2 transition-all ${
                        activeGalleryIndex === idx ? 'border-emerald-600 scale-[0.98]' : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <img 
                        src={img} 
                        alt="Gallery preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>

                {/* Display Enlarged Gallery View */}
                <div className="relative aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden mt-2">
                  <img 
                    src={currentBusiness.images[activeGalleryIndex]} 
                    alt="Active Large Gallery" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-3 start-3 bg-black/70 text-white text-[10px] font-mono px-2 py-1 rounded">
                    {activeGalleryIndex + 1} / {currentBusiness.images.length}
                  </div>

                  {currentBusiness.images.length > 1 && (
                    <>
                      <button 
                        onClick={() => setActiveGalleryIndex(prev => (prev === 0 ? currentBusiness.images!.length - 1 : prev - 1))}
                        className="absolute start-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center cursor-pointer border-0"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setActiveGalleryIndex(prev => (prev === currentBusiness.images!.length - 1 ? 0 : prev + 1))}
                        className="absolute end-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center cursor-pointer border-0"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Owner Profile Card */}
            <div className="border border-slate-200 rounded-2xl p-5 space-y-3.5 bg-slate-50/50">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block">
                👤 {isEn ? 'Owner Profile' : 'مالک کا پروفائل'}
              </span>

              <div className="flex items-center gap-3.5">
                <img 
                  src={currentBusiness.ownerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} 
                  alt={currentBusiness.ownerName || 'Owner'} 
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all"
                  referrerPolicy="no-referrer"
                  data-profile-name={currentBusiness.ownerName || ''}
                  data-profile-avatar={currentBusiness.ownerAvatar || ''}
                />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <span
                      className="cursor-pointer hover:text-emerald-600 hover:underline transition-colors"
                      data-profile-name={currentBusiness.ownerName || ''}
                      data-profile-avatar={currentBusiness.ownerAvatar || ''}
                    >{currentBusiness.ownerName || (isEn ? 'Local entrepreneur' : 'مقامی دکاندار')}</span>
                    {isEntityVerified(currentBusiness.ownerName || '') && (
                      <span className="inline-flex items-center justify-center bg-[#2563eb] text-white rounded-full p-0.5 shrink-0" title="Verified Owner" style={{ width: '12px', height: '12px' }}>
                        <svg className="w-1.5 h-1.5 stroke-white fill-none" viewBox="0 0 24 24" style={{ strokeWidth: 4 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    {isEn ? 'Verified Proprietor' : 'تصدیق شدہ کاروباری مالک'}
                  </p>
                </div>
              </div>

              {currentBusiness.ownerBio && (
                <p className="text-xs text-slate-600 italic leading-relaxed ps-1 border-s-2 border-slate-300">
                  "{currentBusiness.ownerBio}"
                </p>
              )}
            </div>

            {/* Long Description Text */}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900">
                ℹ️ {isEn ? 'Description & Services' : 'تفصیل اور سروسز'}
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {currentBusiness.description}
              </p>
            </div>

            {/* CTA action row */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleCall(currentBusiness)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow hover:shadow-md transition-all cursor-pointer font-bold border-0"
                id="business-detail-call"
              >
                <Phone className="w-4 h-4" />
                {isEn ? 'Call Store' : 'رابطہ کریں'}
              </button>

              {currentBusiness.allowMessages !== false && (
                <button
                  onClick={() => handleMessage(currentBusiness)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow hover:shadow-md transition-all cursor-pointer font-bold border-0"
                  id="business-detail-message"
                >
                  <MessageSquare className="w-4 h-4" />
                  {isEn ? 'Message Chat' : 'چیٹ پیغام'}
                </button>
              )}
            </div>

            {/* Interactive Wall & Review Tabs */}
            <div className="pt-6 border-t border-slate-100">
              {/* Tabs buttons */}
              <div className="flex border-b border-slate-200 mb-4 select-none">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
                    activeTab === 'posts'
                      ? 'border-emerald-600 text-emerald-600 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  📝 {isEn ? 'Owner Updates' : 'دکان کی اپڈیٹس'} ({getCurrentPosts(currentBusiness.id, currentBusiness.posts).length})
                </button>

                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
                    activeTab === 'reviews'
                      ? 'border-emerald-600 text-emerald-600 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  ⭐ {isEn ? 'Citizen Reviews' : 'شہریوں کے تبصرے'} ({getCurrentReviews(currentBusiness.id, currentBusiness.reviews).length})
                </button>
              </div>

              {/* POSTS TAB CONTENT */}
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  <form onSubmit={handleAddPost} className="bg-slate-50 rounded-2xl p-3 border border-slate-200/50 flex gap-2">
                    <input
                      type="text"
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      placeholder={isEn ? "Post announcement on your shop's timeline..." : "دکان کی ٹائم لائن پر اعلان لکھیں..."}
                      className="flex-1 bg-white border border-slate-200 rounded-xl text-xs px-3 focus:outline-none focus:border-emerald-500 shadow-sm"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer font-bold shrink-0 border-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isEn ? 'Publish' : 'شائع کریں'}
                    </button>
                  </form>

                  {getCurrentPosts(currentBusiness.id, currentBusiness.posts).length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-xs italic">
                      {isEn ? 'No timeline updates posted by proprietor yet.' : 'دکاندار کی طرف سے تاحال کوئی اعلان شیئر نہیں کیا گیا۔'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {getCurrentPosts(currentBusiness.id, currentBusiness.posts).map((post) => (
                        <div key={post.id} className="p-3.5 border border-slate-100 rounded-2xl space-y-1.5 bg-white shadow-xs">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                            <span className="text-emerald-600">📢 {isEn ? 'Official Shop Bulletin' : 'سرکاری دکان کا اعلان'}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {post.date}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                            {post.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* REVIEWS TAB CONTENT */}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <form onSubmit={handleAddReview} className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50 space-y-3 shadow-xs">
                    <h4 className="text-xs font-black text-slate-800">
                      ✍️ {isEn ? 'Submit Review & Rating' : 'تبصرہ اور درجہ بندی لکھیں'}
                    </h4>
                    
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500 me-2">{isEn ? 'Rating Star:' : 'درجہ:'}</span>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewReviewRating(i + 1)}
                          className="text-yellow-400 hover:scale-110 transition-transform cursor-pointer border-0 bg-transparent"
                        >
                          <Star className={`w-5 h-5 ${i < newReviewRating ? 'fill-current' : 'text-slate-200'}`} />
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newReviewText}
                        onChange={(e) => setNewReviewText(e.target.value)}
                        placeholder={isEn ? "Tell the community about your experience..." : "اس دکان کے متعلق اپنا سچا تجربہ بتائیں..."}
                        className="flex-1 bg-white border border-slate-200 rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:border-emerald-500 shadow-sm"
                      />
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 rounded-xl flex items-center justify-center cursor-pointer font-bold shrink-0 border-0"
                      >
                        {isEn ? 'Submit' : 'درج کریں'}
                      </button>
                    </div>
                  </form>

                  {getCurrentReviews(currentBusiness.id, currentBusiness.reviews).length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-xs italic">
                      {isEn ? 'No customer feedback yet. Be the first to express opinion!' : 'اس دکان پر ابھی تک کوئی تبصرہ نہیں ہے۔ پہلا تبصرہ آپ کریں!'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {getCurrentReviews(currentBusiness.id, currentBusiness.reviews).map((rev) => (
                        <div key={rev.id} className="p-3.5 border border-slate-100 rounded-2xl space-y-1 bg-white shadow-xs">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-black text-slate-800 flex items-center gap-1">
                              👤 {rev.user}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {rev.date}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-yellow-450 text-xs font-bold">
                            <div className="flex gap-0.5 text-yellow-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-slate-100'}`} />
                              ))}
                            </div>
                            <span className="text-[11px] text-slate-500 font-extrabold font-mono">({rev.rating.toFixed(1)}/5.0)</span>
                          </div>
                          
                          <p className="text-xs text-slate-600 leading-relaxed italic pt-1">
                            "{rev.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ----------------- REGISTER / ADD BUSINESS VIEW ----------------- */}
      {activeView === 'create' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-6" id="create-business-form-card">
          <button
            onClick={onNavigateToList}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-2xl transition-all cursor-pointer border-0"
            id="business-create-back"
          >
            <ArrowLeft className="w-4 h-4" />
            {isEn ? 'Back to Directory' : 'کاروبار کی فہرست پر واپس جائیں'}
          </button>

          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              🏪 {isEn ? 'Register Local Business' : 'مقامی کاروبار رجسٹر کریں'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isEn ? 'Connect with hundreds of residents in Dhoke Hassu & boost your physical and online store sales organically' : 'ڈھوک حسو کے سینکڑوں رہائشیوں سے جڑیں اور اپنے کاروبار اور گاہکوں میں اضافہ کریں'}
            </p>
          </div>

          {success ? (
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3" id="create-business-success">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-base font-black text-emerald-800">
                {isEn ? 'Business Registered Successfully!' : 'کاروبار کامیابی سے درج ہو گیا ہے!'}
              </h3>
              <p className="text-xs text-emerald-600">
                {isEn ? 'Your listings are now live & visible for all Dhoke Hassu citizens.' : 'آپ کا برانڈ اور دکان اب لائیو ہے اور ہر کوئی دیکھ سکتا ہے۔'}
              </p>
            </div>
          ) : (
            <form onSubmit={handlePublish} className="space-y-5" id="create-business-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Business Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isEn ? 'Business / Shop Name' : 'دکان یا برانڈ کا نام'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={isEn ? 'e.g., Dhoke Sweets & Bakers' : 'مثال کے طور پر: ڈھوک سویٹس اینڈ بیکرز'}
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.name ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'} rounded-2xl text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all`}
                    id="input-bus-name"
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-bold">{errors.name}</p>}
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isEn ? 'Business Category' : 'کاروباری کیٹیگری'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer"
                    id="select-bus-category"
                  >
                    {categories.filter(c => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'Shops' && (isEn ? 'Shops' : 'دکانیں / شاپس')}
                        {cat === 'Restaurants' && (isEn ? 'Restaurants' : 'ہوٹل و ریسٹورنٹس')}
                        {cat === 'Services' && (isEn ? 'Services' : 'پیشہ ورانہ سروسز')}
                        {cat === 'Health' && (isEn ? 'Health' : 'طبی و صحت')}
                        {cat === 'Education' && (isEn ? 'Education' : 'تعلیم و اسکول')}
                        {cat === 'Real Estate' && (isEn ? 'Real Estate' : 'رئیل اسٹیٹ ایجنسی')}
                        {cat === 'Home Services' && (isEn ? 'Home Services' : 'ہوم سروسز')}
                        {cat === 'Other' && (isEn ? 'Other' : 'دیگر کاروبار')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contact phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isEn ? 'Contact Phone Number' : 'رابطہ فون نمبر'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g., 0312-5556789"
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.phone ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'} rounded-2xl text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all`}
                    id="input-bus-phone"
                  />
                  {errors.phone && <p className="text-[10px] text-red-500 font-bold">{errors.phone}</p>}
                </div>

                {/* Owner Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isEn ? 'Proprietor / Owner Name' : 'مالک کا نام'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formOwnerName}
                    onChange={(e) => setFormOwnerName(e.target.value)}
                    placeholder={isEn ? "e.g., Haji Muhammad Irfan" : "مثال کے طور پر: حاجی محمد عرفان"}
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.owner ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'} rounded-2xl text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all`}
                    id="input-bus-owner"
                  />
                  {errors.owner && <p className="text-[10px] text-red-500 font-bold">{errors.owner}</p>}
                </div>

                {/* Area Location (Strict requirement) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isEn ? 'Select Area Location' : 'اپنا قریبی علاقہ منتخب کریں'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer"
                    id="select-bus-area"
                  >
                    {areas.map((ar) => (
                      <option key={ar} value={ar}>{ar}</option>
                    ))}
                  </select>
                </div>

                {/* Opening Hours */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isEn ? 'Opening & Closing Hours' : 'دکان کھلنے اور بند ہونے کا وقت'}
                  </label>
                  <input
                    type="text"
                    value={formOpeningHours}
                    onChange={(e) => setFormOpeningHours(e.target.value)}
                    placeholder="e.g., 09:00 AM - 11:00 PM"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
                    id="input-bus-hours"
                  />
                </div>

                {/* Allow Messages Toggle */}
                <div className="flex items-center gap-3 bg-white p-4 border border-slate-200 rounded-2xl mt-4">
                  <div className="flex-1">
                    <label className="text-sm font-bold text-slate-900 block">
                      {isEn ? 'Allow Users to Message' : 'صارفین کو پیغام بھیجنے کی اجازت دیں'}
                    </label>
                    <p className="text-xs text-slate-500 font-medium">
                      {isEn ? 'Users can start a chat directly from your business page.' : 'صارفین آپ کے کاروباری صفحہ سے براہ راست چیٹ شروع کر سکتے ہیں۔'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormAllowMessages(!formAllowMessages)}
                    className={`w-12 h-6 rounded-full transition-colors relative border-0 cursor-pointer ${
                      formAllowMessages ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-transform ${
                      formAllowMessages ? 'left-[calc(100%-1.25rem)]' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Shop Physical Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {isEn ? 'Complete Physical Shop Address' : 'دکان کا مکمل پتہ'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder={isEn ? 'e.g., Shop No. 12, Gali No. 4, near Railway Crossing Road, Rawalpindi' : 'مثال کے طور پر: دکان نمبر 12، گلی نمبر 4، ریلوے کراسنگ کے قریب، راولپنڈی'}
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.address ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'} rounded-2xl text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all`}
                  id="input-bus-address"
                />
                {errors.address && <p className="text-[10px] text-red-500 font-bold">{errors.address}</p>}
              </div>

              {/* Core Store Image / Logo Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isEn ? 'Upload Cover Photo' : 'کور تصویر اپلوڈ کریں'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="business-cover-upload-file"
                      className="hidden"
                      onChange={handleCoverUpload}
                    />
                    <button
                      type="button"
                      disabled={isUploadingCover}
                      onClick={() => document.getElementById('business-cover-upload-file')?.click()}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border-0 disabled:opacity-50"
                    >
                      {isUploadingCover ? (
                        <span>{isEn ? 'Uploading...' : 'اپلوڈ ہو رہا ہے...'}</span>
                      ) : (
                        <span>📷 {isEn ? 'Upload Cover Image' : 'کور امیج اپلوڈ کریں'}</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isEn ? 'Upload Store & Product Gallery' : 'دکان اور پروڈکٹ گیلری اپلوڈ کریں'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      id="business-gallery-upload-files"
                      className="hidden"
                      onChange={handleGalleryUpload}
                    />
                    <button
                      type="button"
                      disabled={isUploadingGallery}
                      onClick={() => document.getElementById('business-gallery-upload-files')?.click()}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border-0 disabled:opacity-50"
                    >
                      {isUploadingGallery ? (
                        <span>{isEn ? 'Uploading...' : 'اپلوڈ ہو رہا ہے...'}</span>
                      ) : (
                        <span>📷 {isEn ? 'Upload Gallery Photos' : 'کام کی تصاویر اپلوڈ کریں'}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Loaded Preview indicators */}
              {(formCoverImage || formGallery.length > 0) && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {isEn ? 'Loaded media files preview' : 'اپ لوڈ کردہ تصاویر کا پیش نظارہ'}
                  </h4>
                  <div className="grid grid-cols-4 gap-3">
                    {formCoverImage && (
                      <div className="space-y-1 relative">
                        <span className="text-[8px] bg-black/60 text-white px-1 rounded absolute top-1 start-1">{isEn ? 'Cover' : 'کور'}</span>
                        <img src={formCoverImage} className="w-full aspect-square rounded-xl object-cover border border-slate-200" alt="Cover preview" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    {formGallery.map((img, idx) => (
                      <div key={idx} className="space-y-1 relative">
                        <span className="text-[8px] bg-black/60 text-white px-1 rounded absolute top-1 start-1">{isEn ? `Item ${idx+1}` : `تصویر ${idx+1}`}</span>
                        <img src={img} className="w-full aspect-square rounded-xl object-cover border border-slate-200" alt="Gallery item" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {isEn ? 'Description & Core Services' : 'کاروبار کی تفصیل اور خصوصیات'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={isEn ? 'Detail your products, special offers, customer focus, and services...' : 'اپنی دکان، خاص آفرز اور روزمرہ مصنوعات کے متعلق تفصیل درج کریں...'}
                  rows={4}
                  className={`w-full px-4 py-3 bg-slate-50 border ${errors.description ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'} rounded-2xl text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all resize-none`}
                  id="input-bus-description"
                />
                {errors.description && <p className="text-[10px] text-red-500 font-bold">{errors.description}</p>}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer text-center font-bold border-0"
                  id="btn-publish-business"
                >
                  {isEn ? 'Publish Business Listing' : 'کاروبار لائیو شائع کریں'}
                </button>
                <button
                  type="button"
                  onClick={onNavigateToList}
                  className="px-6 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold transition-all cursor-pointer font-bold border-0"
                >
                  {isEn ? 'Cancel' : 'منسوخ کریں'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ----------------- REPORT LISTING DIALOG MODAL ----------------- */}
      <AnimatePresence>
        {reportModalBusinessId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-xl space-y-4"
              id="report-listing-modal"
            >
              <div className="flex items-center gap-2 text-red-600 border-b border-slate-100 pb-3">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  {isEn ? 'Report Directory Listing' : 'کاروباری لسٹنگ کی رپورٹ کریں'}
                </h3>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p>
                  {isEn 
                    ? 'Please tell us why this listing violates community safety or consists of spam/fake numbers:' 
                    : 'براہ کرم اس لسٹنگ کے خلاف رپورٹ کی وجہ بتائیں تاکہ کمیونٹی کو محفوظ رکھا جا سکے:'}
                </p>

                <textarea
                  value={reportReason}
                  rows={3}
                  placeholder={isEn ? "Reason for reporting (e.g., Closed permanently, incorrect number)..." : "رپورٹ کی وجہ (مثال کے طور پر: مستقل بند ہے، غلط معلومات)..."}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-red-500 resize-none font-medium text-slate-800"
                  onChange={(e) => setReportReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={submitReport}
                  disabled={!reportReason?.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-2xl shadow-xs cursor-pointer border-0"
                >
                  {isEn ? 'Submit Report' : 'رپورٹ بھیجیں'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReportModalBusinessId(null);
                    setReportReason('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl cursor-pointer border-0"
                >
                  {isEn ? 'Cancel' : 'منسوخ کریں'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

