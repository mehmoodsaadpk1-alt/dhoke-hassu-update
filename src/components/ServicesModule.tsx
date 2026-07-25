/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Search, 
  MapPin, 
  Phone, 
  PlusCircle, 
  ArrowLeft, 
  Star, 
  CheckCircle, 
  AlertCircle,
  MessageCircle, 
  Calendar, 
  Clock,
  X,
  Sparkles,
  Bookmark,
  Share2,
  Flag,
  ShieldAlert,
  SlidersHorizontal,
  Check,
  Edit,
  Trash2,
  ThumbsUp,
  Briefcase,
  DollarSign,
  Heart,
  Share,
  MessageSquare
} from 'lucide-react';
import { ServiceItem, ServiceComment, Language, User, ServiceReview, AdItem } from '../types';
import { getCurrentUserLocation } from '../utils/locationService';
import { isUserAdminOrModerator } from './AlertsModule';
import { dbGetActiveAds, dbUploadServiceImage, isSupabaseConfigured } from '../utils/supabaseClient';
import AdBannerCard from './AdBannerCard';
import { useAdRotator } from '../hooks/useAdRotator';
import { analytics } from '../services/AnalyticsService';

const viewedServices = new Set<string>();

interface ServicesModuleProps {
  items: ServiceItem[];
  onAddItem: (newItem: ServiceItem) => void;
  onUpdateServices?: (updated: ServiceItem[]) => void;
  currentUser?: User;
  currentLanguage: Language;
  onNavigateToCreate: () => void;
  onNavigateToList: () => void;
  onNavigateToDetail: (itemId: string) => void;
  onNavigateToBookings?: () => void;
  selectedItemId: string | null;
  activeView: 'list' | 'detail' | 'create' | 'bookings';
  /** Optional loading flag when services are being fetched */
  loading?: boolean;
  /** Optional error message if fetching fails */
  errorMessage?: string;
}
export default function ServicesModule({
  items,
  onAddItem,
  onUpdateServices,
  currentUser,
  currentLanguage,
  onNavigateToCreate,
  onNavigateToList,
  onNavigateToDetail,
  onNavigateToBookings,
  selectedItemId,
  activeView,
  loading,
  errorMessage
}: ServicesModuleProps) {
const servicesBannerMap = useAdRotator('Technical Services', 1, 1, 'Banner');
  const servicesAdMap = useAdRotator('Technical Services', 200, 5, 'Feed');
  const isEn = currentLanguage === 'en';

  // Legacy ad load removed – ads are handled via useAdRotator hook

  const isAdmin = isUserAdminOrModerator(currentUser);

  if (activeView === 'detail' && selectedItemId) {
    if (!viewedServices.has(selectedItemId)) {
      viewedServices.add(selectedItemId);
      analytics.track("service_view", { entity_type: 'service',
        module: "services",
        entity_id: selectedItemId
      });
    }
  }


  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArea, setSelectedArea] = useState<string>(getCurrentUserLocation());
  const [sortBy, setSortBy] = useState<'rating' | 'newest'>('rating');
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Custom Filter toggles
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);

  // Bookmarks / Saved
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dhoke_connect_saved_services');
      if (saved) setSavedIds(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load saved services", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dhoke_connect_saved_services', JSON.stringify(savedIds));
  }, [savedIds]);

  // Form States (Create & Edit)
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Electrician');
  const [formExperience, setFormExperience] = useState('1 Year');
  const [formArea, setFormArea] = useState('Dhoke Hassu');
  const [formDescription, setFormDescription] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formWhatsApp, setFormWhatsApp] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formHours, setFormHours] = useState('9 AM - 6 PM');
  const [formImage, setFormImage] = useState('');
  const [formGalleryImages, setFormGalleryImages] = useState('');
  const [formPricing, setFormPricing] = useState('');
  const [formAvailability, setFormAvailability] = useState<'Available' | 'Busy'>('Available');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // Review Submissions
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const categories = [
    'All',
    'Electrician',
    'Plumber',
    'Carpenter',
    'Painter',
    'AC Technician',
    'Mobile Repair',
    'Computer Repair',
    'Internet/Cable',
    'Home Cleaning',
    'Tutor',
    'Doctor',
    'Nurse',
    'Pharmacy',
    'Mechanic',
    'Tailor',
    'Beautician',
    'Photographer',
    'Movers',
    'Other'
  ];

  const areas = [
    'All',
    'Dhoke Hassu',
    'Sector 1',
    'Sector 2',
    'Sector 3',
    'Gali 4',
    'Gali 5',
    'Main Road'
  ];

  // Helper check if current user owns listing
  const isListingOwner = (item: ServiceItem) => {
    if (!currentUser) return false;
    return item.name === currentUser.fullName || item.contact === currentUser.mobileNumber;
  };

  // Filter items
  const filteredItems = items.filter(item => {
    // 1. Regular users only see Approved listings. Admins & Owners see all (Pending, Rejected)
    if (!isAdmin && !isListingOwner(item) && item.status === 'Pending') return false;
    if (!isAdmin && !isListingOwner(item) && item.status === 'Rejected') return false;

    // 2. Hide reported items
    if (item.reported && !isAdmin) return false;

    // 3. Category & location filters
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesArea = selectedArea === 'All' || item.area === selectedArea;

    // 4. Search filter
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery?.toLowerCase()) || 
                          (item.title && item.title?.toLowerCase().includes(searchQuery?.toLowerCase())) ||
                          item.description?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
                          item.category?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
                          item.area?.toLowerCase().includes(searchQuery?.toLowerCase());

    // 5. Verification & Featured filters
    const matchesVerified = !showOnlyVerified || item.verified;
    const matchesFeatured = !showOnlyFeatured || item.featured;

    return matchesCategory && matchesArea && matchesSearch && matchesVerified && matchesFeatured;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    // Featured always pinned/sorted first
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;

    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    // Newest sort
    const dateA = new Date(a.dateAdded || 0).getTime() || 0;
    const dateB = new Date(b.dateAdded || 0).getTime() || 0;
    return dateB - dateA;
  });
  // Apply pagination after sorting
  const paginatedItems = sortedItems?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

  // Toggle Save Service
  const handleToggleSave = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (savedIds.includes(id)) {
      setSavedIds(savedIds.filter(savedId => savedId !== id));
    } else {
      setSavedIds([...savedIds, id]);
    }
  };

  // Submit Listing Form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formTitle?.trim()) newErrors.title = isEn ? 'Business or Service Name is required' : 'سروس یا کاروبار کا نام ضروری ہے';
    if (!formName?.trim()) newErrors.name = isEn ? 'Provider name is required' : 'فراہم کنندہ کا نام ضروری ہے';
    if (!formContact?.trim()) newErrors.contact = isEn ? 'Contact number is required' : 'رابطہ نمبر درج کریں';
    if (!formDescription?.trim()) newErrors.description = isEn ? 'Service description is required' : 'سروس کی تفصیل لکھیں';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setPublishSuccess(true);

    const defaultImage = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400';
    const finalImage = formImage?.trim() || defaultImage;
    const galleryList = formGalleryImages?.split('\n').map(url => url?.trim()).filter(Boolean);

    if (editingItemId) {
      // Edit Mode
      if (onUpdateServices) {
        const updated = items.map(item => {
          if (item.id === editingItemId) {
            return {
              ...item,
              title: formTitle,
              name: formName,
              category: formCategory,
              experience: formExperience,
              area: formArea,
              contact: formContact,
              whatsAppNumber: formWhatsApp,
              address: formAddress,
              workingHours: formHours,
              image: finalImage,
              galleryImages: galleryList,
              pricing: formPricing,
              availability: formAvailability,
            };
          }
          return item;
        });
        onUpdateServices(updated);
      }
    } else {
      // Create Mode
      const newService: ServiceItem = {
        id: `service-${Date.now()}`,
        title: formTitle,
        name: formName,
        category: formCategory,
        experience: formExperience,
        area: formArea,
        rating: 5.0,
        availability: formAvailability,
        contact: formContact,
        description: formDescription,
        whatsAppNumber: formWhatsApp,
        address: formAddress,
        workingHours: formHours,
        image: finalImage,
        galleryImages: galleryList,
        pricing: formPricing,
        reported: false,
        verified: false,
        reviewCount: 0,
        dateAdded: new Date().toISOString(),
        status: 'Pending', // Requires Admin approval
        featured: false,
        reviews: []
      };
      
      onAddItem(newService);
      
      analytics.track("service_create", { entity_type: 'service',
        module: "services",
        entity_id: newService.id,
        metadata: {
          category: newService.category,
          location: newService.area
        }
      });
    }

    // Reset States
    setEditingItemId(null);
    setFormTitle('');
    setFormName('');
    setFormCategory('Electrician');
    setFormExperience('1 Year');
    setFormArea('Dhoke Hassu');
    setFormDescription('');
    setFormContact('');
    setFormWhatsApp('');
    setFormAddress('');
    setFormHours('9 AM - 6 PM');
    setFormImage('');
    setFormGalleryImages('');
    setFormPricing('');
    setFormAvailability('Available');

    setTimeout(() => {
      setPublishSuccess(false);
      onNavigateToList();
    }, 1200);
  };

  // Upload Handlers for Logo & Gallery
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;
    setIsUploadingLogo(true);
    if (isSupabaseConfigured) {
      const url = await dbUploadServiceImage(file);
      if (url) {
        setFormImage(url);
      } else {
        const localUrl = URL.createObjectURL(file);
        setFormImage(localUrl);
      }
    } else {
      const localUrl = URL.createObjectURL(file);
      setFormImage(localUrl);
    }
    setIsUploadingLogo(false);
    e.target.value = '';
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingGallery(true);
    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      if (isSupabaseConfigured) {
        const url = await dbUploadServiceImage(file);
        if (url) {
          uploadedUrls.push(url);
        } else {
          uploadedUrls.push(URL.createObjectURL(file));
        }
      } else {
        uploadedUrls.push(URL.createObjectURL(file));
      }
    }
    if (uploadedUrls.length > 0) {
      setFormGalleryImages(prev => {
        const current = prev?.trim();
        const addition = uploadedUrls.join('\n');
        return current ? `${current}\n${addition}` : addition;
      });
    }
    setIsUploadingGallery(false);
    e.target.value = '';
  };

  // Open Edit Mode
  const handleEditClick = (item: ServiceItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingItemId(item.id);
    setFormTitle(item.title || '');
    setFormName(item.name);
    setFormCategory(item.category);
    setFormExperience(item.experience);
    setFormArea(item.area);
    setFormDescription(item.description);
    setFormContact(item.contact);
    setFormWhatsApp(item.whatsAppNumber || '');
    setFormAddress(item.address || '');
    setFormHours(item.workingHours || '9 AM - 6 PM');
    setFormImage(item.image || '');
    setFormGalleryImages((item.galleryImages || []).join('\n'));
    setFormPricing(item.pricing || '');
    setFormAvailability(item.availability);
    
    onNavigateToCreate();
  };

  // Delete Listing
  const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(isEn ? "Are you sure you want to remove this service listing?" : "کیا آپ واقعی یہ لسٹنگ حذف کرنا چاہتے ہیں؟")) {
      if (onUpdateServices) {
        onUpdateServices(items.filter(i => i.id !== id));
      }
      onNavigateToList();
    }
  };

  // Admin Verification Toggle
  const handleToggleVerify = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) return;
    if (onUpdateServices) {
      onUpdateServices(items.map(item => {
        if (item.id === id) {
          return { ...item, verified: !item.verified };
        }
        return item;
      }));
    }
  };

  // Admin Feature Toggle
  const handleToggleFeature = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) return;
    if (onUpdateServices) {
      onUpdateServices(items.map(item => {
        if (item.id === id) {
          return { ...item, featured: !item.featured };
        }
        return item;
      }));
    }
  };

  // Admin Approval
  const handleApproveStatus = (id: string, approve: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) return;
    if (onUpdateServices) {
      onUpdateServices(items.map(item => {
        if (item.id === id) {
          return { ...item, status: approve ? 'Approved' : 'Rejected' };
        }
        return item;
      }));
    }
  };

  // Submit written review
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText?.trim() || !selectedItemId || !onUpdateServices) return;

    const target = items.find(i => i.id === selectedItemId);
    if (!target) return;

    const newReview: ServiceReview = {
      id: `rev-${Date.now()}`,
      user: currentUser?.fullName || (isEn ? 'Anonymous Resident' : 'خفیہ رہائشی'),
      rating: reviewRating,
      text: reviewText,
      date: new Date().toLocaleDateString(isEn ? 'en-US' : 'ur-PK')
    };

    const updatedReviews = [...(target.reviews || []), newReview];
    const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = parseFloat((totalRating / updatedReviews.length).toFixed(1));

    const updatedItems = items.map(item => {
      if (item.id === selectedItemId) {
        return {
          ...item,
          reviews: updatedReviews,
          rating: avgRating,
          reviewCount: updatedReviews.length
        };
      }
      return item;
    });

    onUpdateServices(updatedItems);
    setReviewText('');
    setReviewSuccess(true);
    setTimeout(() => setReviewSuccess(false), 2000);
  };

  const selectedItem = items.find(i => i.id === selectedItemId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" id="services-module-root">
      {/* Top Banner Ad Segment */}
      {servicesBannerMap[0] && (
        <div className="mb-6">
          <AdBannerCard ad={servicesBannerMap[0]} />
        </div>
      )}

      
      {/* HEADER ACTION AREA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isEn ? 'Services Directory' : 'خدمات اور ہنرمند گائیڈ'}
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {isEn 
              ? 'Find and connect with trusted local service providers in Dhoke Hassu.' 
              : 'ڈھوک حسو کے ہنرمندوں اور سروس فراہم کرنے والوں کی لسٹنگ دیکھیں۔'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeView !== 'list' && (
            <button
              onClick={onNavigateToList}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? 'View Directory' : 'ڈائریکٹری دیکھیں'}</span>
            </button>
          )}

          {activeView !== 'create' && (
            <button
              onClick={() => {
                setEditingItemId(null);
                setFormTitle('');
                setFormName(currentUser?.fullName || '');
                setFormCategory('Electrician');
                setFormExperience('1 Year');
                setFormArea('Dhoke Hassu');
                setFormDescription('');
                setFormContact(currentUser?.mobileNumber || '');
                setFormWhatsApp(currentUser?.mobileNumber || '');
                setFormAddress('');
                setFormHours('9 AM - 6 PM');
                setFormImage('');
                setFormGalleryImages('');
                setFormPricing('');
                onNavigateToCreate();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer font-bold"
              id="list-service-btn"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isEn ? 'Register as Provider' : 'اپنی سروس رجسٹر کریں'}</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW: MAIN SERVICES DIRECTORY FEED */}
      {activeView === 'list' && (
        <div className="space-y-6">
          
          {/* SEARCH AND ADVANCED FILTERS CARD */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4" id="services-filter-box">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={isEn ? 'Search by business name, provider, keyword...' : 'سروس یا ہنرمند تلاش کریں...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-10 pe-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 font-semibold"
                />
              </div>

              {/* Area select */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 shrink-0 font-bold">{isEn ? 'Location:' : 'مقام:'}</label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-emerald-500 text-slate-800 font-bold"
                >
                  {areas.map(a => (
                    <option key={a} value={a}>
                      {isEn ? a : (a === 'All' ? 'تمام مقامات' : a)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting select */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 shrink-0 font-bold">{isEn ? 'Sort:' : 'ترتیب:'}</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'rating' | 'newest')}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-emerald-500 text-slate-800 font-bold"
                >
                  <option value="rating">{isEn ? 'Highest Rating' : 'بہترین ریٹنگ'}</option>
                  <option value="newest">{isEn ? 'Newest Listings' : 'جدید ترین'}</option>
                </select>
              </div>
            </div>

            {/* Quick Toggle Toggles */}
            <div className="flex items-center gap-4 pt-2 border-t border-slate-50">
              <label className="flex items-center gap-2 text-xs font-extrabold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyVerified}
                  onChange={() => setShowOnlyVerified(!showOnlyVerified)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                />
                <span>{isEn ? 'Verified Providers' : 'تصدیق شدہ ہنرمند'}</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-extrabold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyFeatured}
                  onChange={() => setShowOnlyFeatured(!showOnlyFeatured)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                />
                <span>{isEn ? 'Featured Services' : 'نمایاں سروسز'}</span>
              </label>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin border-t border-slate-50 pt-3">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all border cursor-pointer font-bold ${
                      isActive 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isEn ? cat : cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* LISTINGS DISPLAY GRID */}
          {loading ? (
            // Loading skeletons (show 6 placeholder cards)
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="services-cards-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white border rounded-2xl p-5 border-slate-200">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-slate-200 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-full" />
                    <div className="h-3 bg-slate-200 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : errorMessage ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
              <AlertCircle className="w-12 h-12 text-slate-350 mx-auto mb-3" />
              <p className="text-base font-extrabold text-slate-800">{isEn ? 'Failed to load services' : 'سروسز لوڈ کرنے میں ناکامی'}</p>
              <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700">
                {isEn ? 'Retry' : 'دوبارہ کوشش'}
              </button>
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
              <ShieldAlert className="w-12 h-12 text-slate-350 mx-auto mb-3" />
              <p className="text-base font-extrabold text-slate-800">{isEn ? 'No Listings Found' : 'کوئی سروس لسٹنگ نہیں ملی'}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isEn ? 'Adjust your active category, location, or search keywords and try again.' : 'کیٹیگری یا مقام تبدیل کر کے دوبارہ کوشش کریں.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="services-cards-grid">
              {(() => {
                const elements = [];
                for (let i = 0; i < paginatedItems.length; i++) {
                  const item = paginatedItems[i];
                  const isSaved = savedIds.includes(item.id);
                  const ad = servicesAdMap[i];

                  elements.push(
                    <div
                      key={item.id}
                      onClick={() => onNavigateToDetail(item.id)}
                      className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative ${
                        item.featured 
                          ? 'border-blue-400 bg-emerald-50/5 ring-1 ring-emerald-50' 
                          : 'border-slate-200'
                      }`}
                      id={`service-card-${item.id}`}
                    >
                      {/* Featured / Verified / Pending status tags */}
                      <div className="absolute top-5 start-5 flex items-center gap-1.5 z-10">
                        {item.featured && (
                          <span className="bg-emerald-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            {isEn ? 'Featured' : 'نمایاں'}
                          </span>
                        )}
                        {item.status === 'Pending' && (
                          <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                            {isEn ? 'Pending Approval' : 'منظوری کا انتظار'}
                          </span>
                        )}
                      </div>

                      <div>
                        {/* Image & Title Header */}
                        <div className="flex items-start gap-4">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=150'}
                            alt={item.title || item.name}
                            className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <h3 className="text-base font-black text-slate-900 leading-snug">
                                {item.title || item.name}
                              </h3>
                              {item.verified && (
                                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" title={isEn ? "Verified Provider" : "تصدیق شدہ ہنرمند"} />
                              )}
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block uppercase tracking-wider font-bold">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-slate-600 text-xs font-semibold mt-4 line-clamp-3 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Provider rating and reviews count */}
                        <div className="flex items-center gap-4 mt-4 text-xs font-extrabold text-slate-700">
                          <div className="flex items-center gap-1 text-emerald-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span>{item.rating || 5.0}</span>
                          </div>
                          <span className="text-slate-400 font-medium">
                            ({item.reviewCount || 0} {isEn ? 'reviews' : 'تبصرے'})
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-500 font-medium">{item.experience} {isEn ? 'Exp' : 'تجربہ'}</span>
                        </div>
                      </div>

                      {/* Footer Location, Phone and Save buttons */}
                      <div className="mt-5 flex items-center justify-between border-t border-slate-50 pt-4">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-450" />
                          <span>{item.area}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleToggleSave(item.id, e)}
                            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                              isSaved 
                                ? 'bg-emerald-50 border-blue-200 text-emerald-600' 
                                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5 fill-current" />
                          </button>

                          {/* Admin Action Buttons */}
                          {isAdmin && (
                            <>
                              <button
                                onClick={(e) => handleToggleVerify(item.id, e)}
                                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                                  item.verified ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'
                                }`}
                                title={item.verified ? (isEn ? "Unverify" : "غیر تصدیق کریں") : (isEn ? "Verify" : "تصدیق کریں")}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleToggleFeature(item.id, e)}
                                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                                  item.featured ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'
                                }`}
                                title={item.featured ? (isEn ? "Unfeature" : "عام کریں") : (isEn ? "Feature" : "نمایاں کریں")}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          
                          {/* Owner / Admin Edit & Delete */}
                          {(isListingOwner(item) || isAdmin) && (
                            <>
                              <button
                                onClick={(e) => handleEditClick(item, e)}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                                title={isEn ? "Edit" : "ترمیم"}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(item.id, e)}
                                className="p-1.5 text-slate-450 hover:text-red-650 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                title={isEn ? "Delete" : "حذف"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  );

                  // Inject Technical Services active ad via rotation
                  if (ad) {
                    elements.push(
                      <div key={`ad-services-${i}-${ad.id}`} className="md:col-span-2 lg:col-span-3">
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

      {/* VIEW: DETAILED SERVICE INFO */}
      {activeView === 'detail' && selectedItem && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="services-detail-view">
          
          {/* Main Info Area (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs p-6 md:p-8 space-y-6">
              
              {/* Header block */}
              <div className="flex items-start gap-4 border-b border-slate-50 pb-5">
                <img
                  src={selectedItem.image || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=150'}
                  alt={selectedItem.title || selectedItem.name}
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-100"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
                      {selectedItem.title || selectedItem.name}
                    </h1>
                    {selectedItem.verified && (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" title={isEn ? "Verified Provider" : "تصدیق شدہ ہنرمند"} />
                    )}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-100 inline-block uppercase tracking-wider font-bold">
                    {selectedItem.category}
                  </span>
                </div>
              </div>

              {/* Description Details */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider font-bold">
                  {isEn ? 'About Service' : 'تفصیل اور خصوصیات'}
                </h3>
                <p className="text-slate-700 text-sm font-semibold leading-relaxed whitespace-pre-wrap">
                  {selectedItem.description}
                </p>
              </div>

              {/* Gallery Images (If any) */}
              {selectedItem.galleryImages && selectedItem.galleryImages.length > 0 && (
                <div className="space-y-3 border-t border-slate-50 pt-5">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider font-bold">
                    {isEn ? 'Work Gallery' : 'کام کی تصاویر'}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedItem.galleryImages.map((imgUrl, idx) => (
                      <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" className="relative group overflow-hidden rounded-2xl h-24 border border-slate-100">
                        <img
                          src={imgUrl}
                          alt="Gallery item"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-6 border-t border-slate-100 pt-6">
                <h3 className="text-base font-black text-slate-900 font-bold">
                  {isEn ? `Reviews (${selectedItem.reviews?.length || 0})` : `صارفین کے تبصرے (${selectedItem.reviews?.length || 0})`}
                </h3>

                {/* Add Review Form */}
                <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500 font-bold">{isEn ? 'Your Rating:' : 'آپ کی ریٹنگ:'}</span>
                    <div className="flex items-center gap-1 text-emerald-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-0.5 hover:scale-115 transition-transform"
                        >
                          <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-current' : 'text-slate-350'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    placeholder={isEn ? 'Write your experience with this service provider...' : 'اپنا تجربہ لکھیں...'}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                  />

                  <div className="flex items-center justify-between">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-sm transition-all cursor-pointer font-bold"
                    >
                      {isEn ? 'Submit Review' : 'تبصرہ جمع کریں'}
                    </button>
                    {reviewSuccess && <span className="text-[10px] font-bold text-emerald-600 animate-pulse">✓ {isEn ? 'Submitted' : 'شائع ہو گیا'}</span>}
                  </div>
                </form>

                {/* Listing of reviews */}
                <div className="space-y-4">
                  {!selectedItem.reviews || selectedItem.reviews.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium text-center py-6">
                      {isEn ? 'No reviews submitted yet. Be the first to review!' : 'ابھی تک کوئی تبصرہ نہیں ہے۔ پہلا ریویو آپ لکھیں!'}
                    </p>
                  ) : (
                    selectedItem.reviews.map((rev) => (
                      <div key={rev.id} className="border-b border-slate-50 pb-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800">{rev.user}</span>
                          <span className="text-[10px] font-bold text-slate-400">{rev.date}</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-emerald-500">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {rev.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>
          </div>

          {/* Contact & Availability Card (Right 1 Column) */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
              
              {/* Availability Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider font-bold">
                  {isEn ? 'Listing Status' : 'سروس کی حالت'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  selectedItem.availability === 'Available' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-750'
                }`}>
                  {selectedItem.availability === 'Available' ? (isEn ? 'Available' : 'دستیاب') : (isEn ? 'Busy' : 'مصروف')}
                </span>
              </div>

              {/* Quick Info Grid */}
              <div className="space-y-4 border-t border-b border-slate-50 py-5">
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-2xl transition-all"
                  data-profile-name={selectedItem.name}
                  data-profile-id={selectedItem.user_id || ''}
                  onClick={() => {
                    analytics.track("provider_profile_view", { entity_type: 'service',
                      module: "services",
                      entity_id: selectedItem.user_id || selectedItem.name
                    });
                  }}
                >
                  <UserIcon className="w-5 h-5 text-slate-450" />
                  <div>
                    <span className="text-[9px] font-black text-slate-450 uppercase block">{isEn ? 'Provider' : 'نام ہنرمند'}</span>
                    <span className="text-xs font-black text-slate-800 hover:text-emerald-600 hover:underline">{selectedItem.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-slate-400" />
                  <div>
                    <span className="text-[9px] font-black text-slate-450 uppercase block block">{isEn ? 'Experience' : 'تجربہ کار'}</span>
                    <span className="text-xs font-black text-slate-800">{selectedItem.experience}</span>
                  </div>
                </div>

                {selectedItem.pricing && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-slate-400" />
                    <div>
                      <span className="text-[9px] font-black text-slate-450 uppercase block block">{isEn ? 'Estimated Pricing' : 'اندازہ لاگت'}</span>
                      <span className="text-xs font-black text-slate-800">{selectedItem.pricing}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div>
                    <span className="text-[9px] font-black text-slate-450 uppercase block block">{isEn ? 'Working Hours' : 'کام کے اوقات'}</span>
                    <span className="text-xs font-black text-slate-800">{selectedItem.workingHours || '9 AM - 6 PM'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <span className="text-[9px] font-black text-slate-450 uppercase block block">{isEn ? 'Service Location' : 'سروس کی جگہ'}</span>
                    <span className="text-xs font-black text-slate-800">{selectedItem.address || selectedItem.area}</span>
                  </div>
                </div>
              </div>

              {/* Direct call & WhatsApp Actions */}
              <div className="space-y-2.5">
                <a
                  href={`tel:${selectedItem.contact}`}
                  onClick={() => {
                    analytics.track("service_contact", { entity_type: 'service',
                      module: "services",
                      entity_id: selectedItem.id,
                      metadata: { contact_type: 'phone' }
                    });
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold shadow-sm transition-all font-bold"
                >
                  <Phone className="w-4 h-4" />
                  {isEn ? 'Call Provider' : 'رابطہ کریں'}
                </a>

                {selectedItem.whatsAppNumber && (
                  <a
                    href={`https://wa.me/${selectedItem.whatsAppNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      analytics.track("service_contact", { entity_type: 'service',
                        module: "services",
                        entity_id: selectedItem.id,
                        metadata: { contact_type: 'whatsapp' }
                      });
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold shadow-sm transition-all font-bold"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {isEn ? 'WhatsApp Provider' : 'واٹس ایپ کریں'}
                  </a>
                )}
              </div>

              {/* Admin Approval Panels */}
              {isAdmin && selectedItem.status === 'Pending' && (
                <div className="border-t border-slate-100 pt-5 space-y-2.5">
                  <span className="text-xs font-black text-slate-500 uppercase block font-bold">
                    {isEn ? 'Admin Actions required:' : 'ایڈمنسٹریشن ایکشنز:'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleApproveStatus(selectedItem.id, true, e)}
                      className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-755 rounded-2xl text-xs font-extrabold transition-all cursor-pointer font-bold"
                    >
                      {isEn ? 'Approve' : 'منظور کریں'}
                    </button>
                    <button
                      onClick={(e) => handleApproveStatus(selectedItem.id, false, e)}
                      className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-755 rounded-2xl text-xs font-extrabold transition-all cursor-pointer font-bold"
                    >
                      {isEn ? 'Reject' : 'مسترد کریں'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* VIEW: REGISTER / EDIT SERVICE LISTING FORM */}
      {activeView === 'create' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn" id="services-create-view">
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
            
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-xl font-black text-slate-950 flex items-center gap-2">
                📢 {editingItemId ? (isEn ? 'Edit Service Listing' : 'لسٹنگ میں ترمیم کریں') : (isEn ? 'Register Service Provider' : 'ہنرمند رجسٹر کریں')}
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed font-bold">
                {isEn 
                  ? 'Promote your local services to Dhoke Hassu Connect residents. Provide verified information for direct inquiries.' 
                  : 'محلے کے لوگوں کو اپنے کاروبار یا ہنر کے متعلق معلومات فراہم کریں۔ معلومات درست ہونی چاہئیں۔'}
              </p>
            </div>

            {publishSuccess ? (
              <div className="py-12 text-center bg-emerald-50 rounded-2xl border border-emerald-100 space-y-3" id="service-publish-success">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
                <h3 className="text-lg font-black text-emerald-950 font-bold">
                  {isEn ? 'Service Listing Published Successfully!' : 'سروس لسٹنگ کامیابی کے ساتھ شائع ہو گئی!'}
                </h3>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5" id="services-create-form">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Business / Service Name */}
                  <div className="space-y-1.5 col-span-full">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Business / Service Name' : 'کاروبار یا سروس کا نام'} *
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder={isEn ? 'e.g. Al-Rehman Plumbing Solutions' : 'مثال کے طور پر: الرحمن پلمبنگ ورکس'}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 font-semibold ${
                        errors.title ? 'border-red-400 focus:border-red-500' : 'border-slate-200'
                      }`}
                      id="form-title"
                    />
                    {errors.title && <p className="text-[10px] text-red-500 font-bold">{errors.title}</p>}
                  </div>

                  {/* Provider Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Provider Name' : 'ہنرمند کا نام'} *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={isEn ? 'e.g. Zahid Mehmood' : 'مثال کے طور پر: زاہد محمود'}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 font-semibold ${
                        errors.name ? 'border-red-400 focus:border-red-500' : 'border-slate-200'
                      }`}
                      id="form-name"
                    />
                    {errors.name && <p className="text-[10px] text-red-500 font-bold">{errors.name}</p>}
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Category' : 'اقسام'} *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 font-bold"
                      id="form-category"
                    >
                      {categories.filter(c => c !== 'All').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Experience */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Years of Experience' : 'تجربہ'} *
                    </label>
                    <select
                      value={formExperience}
                      onChange={(e) => setFormExperience(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 font-bold"
                      id="form-experience"
                    >
                      <option value="1 Year">{isEn ? '1 Year' : '1 سال'}</option>
                      <option value="2 Years">{isEn ? '2 Years' : '2 سال'}</option>
                      <option value="3 Years">{isEn ? '3 Years' : '3 سال'}</option>
                      <option value="5+ Years">{isEn ? '5+ Years' : '5 سال سے زائد'}</option>
                      <option value="10+ Years">{isEn ? '10+ Years' : '10 سال سے زائد'}</option>
                    </select>
                  </div>

                  {/* Pricing Info */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Pricing (Optional)' : 'ریٹ یا لاگت (اختیاری)'}
                    </label>
                    <input
                      type="text"
                      value={formPricing}
                      onChange={(e) => setFormPricing(e.target.value)}
                      placeholder={isEn ? 'e.g. Call for estimate / Rs. 500 Visit fee' : 'مثال کے طور پر: 500 وزٹ فیس'}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                      id="form-pricing"
                    />
                  </div>

                  {/* Service Area */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Service Area' : 'سروس کی جگہ'} *
                    </label>
                    <input
                      type="text"
                      value={formArea}
                      onChange={(e) => setFormArea(e.target.value)}
                      placeholder="e.g. Dhoke Hassu, Sector 2"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                      id="form-area"
                    />
                  </div>

                  {/* Working Hours */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Working Hours' : 'کام کے اوقات'} *
                    </label>
                    <input
                      type="text"
                      value={formHours}
                      onChange={(e) => setFormHours(e.target.value)}
                      placeholder="e.g. 9 AM - 6 PM"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                      id="form-hours"
                    />
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Phone Number' : 'رابطہ نمبر'} *
                    </label>
                    <input
                      type="tel"
                      value={formContact}
                      onChange={(e) => setFormContact(e.target.value)}
                      placeholder="03xx-xxxxxxx"
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 font-semibold ${
                        errors.contact ? 'border-red-400 focus:border-red-500' : 'border-slate-200'
                      }`}
                      id="form-contact"
                    />
                    {errors.contact && <p className="text-[10px] text-red-500 font-bold">{errors.contact}</p>}
                  </div>

                  {/* WhatsApp Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'WhatsApp Number (Optional)' : 'واٹس ایپ نمبر (اختیاری)'}
                    </label>
                    <input
                      type="tel"
                      value={formWhatsApp}
                      onChange={(e) => setFormWhatsApp(e.target.value)}
                      placeholder="03xx-xxxxxxx"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                      id="form-whatsapp"
                    />
                  </div>

                  {/* Physical Address */}
                  <div className="space-y-1.5 col-span-full">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Shop / Office Address' : 'دکان یا دفتر کا پتہ'}
                    </label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder={isEn ? 'e.g. Shop 3, Main Market' : 'پتہ درج کریں...'}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                      id="form-address"
                    />
                  </div>

                  {/* Profile Logo/Image */}
                  <div className="space-y-1.5 col-span-full">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Profile Cover / Logo' : 'پروفائل یا لوگو'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        placeholder="https://example.com/logo.jpg"
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                        id="form-image"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        id="service-logo-file-input"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('service-logo-file-input')?.click()}
                        disabled={isUploadingLogo}
                        className="px-4 py-3 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60 text-emerald-700 font-extrabold text-xs rounded-2xl transition-all cursor-pointer border border-blue-200"
                      >
                        {isUploadingLogo ? (isEn ? 'Uploading...' : 'اپلوڈ ہو رہا ہے...') : (isEn ? '📷 Upload' : '📷 اپلوڈ')}
                      </button>
                    </div>
                    {formImage && (
                      <div className="mt-2 relative inline-block">
                        <img src={formImage} alt="Logo preview" className="w-16 h-16 rounded-2xl object-cover border border-slate-200" />
                        <button
                          type="button"
                          onClick={() => setFormImage('')}
                          className="absolute -top-1.5 -end-1.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-650"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Gallery URL list */}
                  <div className="space-y-1.5 col-span-full">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Work Gallery Images' : 'اپنے کام کے فوٹوز'}
                    </label>
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={formGalleryImages}
                        onChange={(e) => setFormGalleryImages(e.target.value)}
                        placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                        id="form-gallery"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        id="service-gallery-file-input"
                        className="hidden"
                        onChange={handleGalleryUpload}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('service-gallery-file-input')?.click()}
                        disabled={isUploadingGallery}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed text-emerald-700 font-bold text-sm rounded-2xl border-2 border-dashed border-blue-200 transition-all cursor-pointer"
                      >
                        {isUploadingGallery ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            <span>{isEn ? 'Uploading...' : 'اپلوڈ ہو رہا ہے...'}</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4"/>
                              <rect x="3" y="3" width="18" height="18" rx="3" strokeLinecap="round" strokeLinejoin="round" opacity="0"/>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                              <circle cx="12" cy="13" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>{isEn ? '📷 Upload Work Gallery Photos' : '📷 کام کے فوٹوز اپلوڈ کریں'}</span>
                          </>
                        )}
                      </button>
                    </div>
                    {formGalleryImages?.trim() && (
                      <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {formGalleryImages?.split('\n').map((url, idx) => {
                          const trimmed = url?.trim();
                          if (!trimmed) return null;
                          return (
                            <div key={idx} className="relative group overflow-hidden rounded-2xl h-16 border border-slate-200">
                              <img src={trimmed} alt="Work gallery preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setFormGalleryImages(prev => 
                                    prev?.split('\n').filter((_, i) => i !== idx).join('\n')
                                  );
                                }}
                                className="absolute top-1 end-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-650 opacity-90"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Description details */}
                  <div className="space-y-1.5 col-span-full">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Describe Your Services & Rates' : 'اپنی سروسز کے متعلق تفصیل لکھیں'} *
                    </label>
                    <textarea
                      rows={5}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder={isEn ? 'e.g. Specialist in home electrical wiring, UPS repair, and fan installations...' : 'سروسز کی تفصیل لکھیں...'}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 font-semibold ${
                        errors.description ? 'border-red-400 focus:border-red-500' : 'border-slate-200'
                      }`}
                      id="form-description"
                    />
                    {errors.description && <p className="text-[10px] text-red-500 font-bold">{errors.description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer font-bold"
                    id="submit-service-form"
                  >
                    {editingItemId ? (isEn ? 'Save Changes' : 'تبدیلیاں محفوظ کریں') : (isEn ? 'Register Now' : 'رجسٹر کریں')}
                  </button>

                  <button
                    type="button"
                    onClick={onNavigateToList}
                    className="px-6 py-3 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer font-bold"
                    id="cancel-service-form"
                  >
                    {isEn ? 'Cancel' : 'منسوخ کریں'}
                  </button>
                </div>

              </form>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

