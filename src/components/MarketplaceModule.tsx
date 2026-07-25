import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Phone, 
  MessageCircle, 
  Share2, 
  Heart, 
  Plus, 
  ChevronLeft, 
  Camera, 
  ArrowLeft,
  CheckCircle,
  Eye,
  X,
  User as UserIcon,
  MapPin,
  Clock,
  Tag,
  Filter,
  Send,
  Flag,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { MarketplaceItem, ItemImage, ItemChat, User, Language, AdItem } from '../types';
import { useMarketplace } from '../hooks/useMarketplace';
import { isSupabaseConfigured, supabase, dbGetActiveAds, dbGetItemChats } from '../utils/supabaseClient';
import AdBannerCard from './AdBannerCard';
import { useAdRotator } from '../hooks/useAdRotator';
import { useAdStore } from '../store/adStore';

interface MarketplaceModuleProps {
  currentUser: User | null;
  currentLanguage: Language;
  currentPath: string;
  navigate: (path: string, paramId?: string) => void;
  selectedItemId: string | null;
}

const CATEGORIES = [
  { id: 'All', labelEn: 'All', labelUr: 'سب' },
  { id: 'Mobiles & Electronics', labelEn: 'Electronics', labelUr: 'الیکٹرانکس' },
  { id: 'Vehicles', labelEn: 'Vehicles', labelUr: 'گاڑیاں' },
  { id: 'Property (Rent/Sale)', labelEn: 'Property', labelUr: 'جائداد' },
  { id: 'Furniture', labelEn: 'Furniture', labelUr: 'فرنیچر' },
  { id: 'Clothing', labelEn: 'Clothing', labelUr: 'کپڑے' },
  { id: 'Home Appliances', labelEn: 'Appliances', labelUr: 'گھریلو سامان' },
  { id: 'Services', labelEn: 'Services', labelUr: 'خدمات' },
  { id: 'Others', labelEn: 'Others', labelUr: 'دیگر' }
];
export default function MarketplaceModule({
  currentUser,
  currentLanguage,
  currentPath,
  navigate,
  selectedItemId
}: MarketplaceModuleProps) {
const marketplaceBannerMap = useAdRotator('Marketplace', 1, 1, 'Banner');
  const marketplaceAdMap = useAdRotator('Marketplace', 200, 5, 'Feed');
  const {
    items,
    allItems,
    favorites,
    loading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filters,
    setFilters,
    createItem,
    sendMessage,
    toggleFavorite,
    fetchMyListings,
    markAsSold,
    reportItem,
    incrementViews,
    getOfflineChats
  } = useMarketplace(currentUser);

  // View state
  const activeView = useMemo(() => {
    if (currentPath === '/marketplace/create' || currentPath === '/marketplace/post') return 'create';
    if (currentPath === '/marketplace/detail') return 'detail';
    if (currentPath === '/marketplace/my-listings') return 'my-listings';
    if (currentPath.startsWith('/marketplace/chat')) return 'chat';
    return 'list';
  }, [currentPath]);

  // Load active ads directly from store for the top banner
  const { ads } = useAdStore();
  const activeAds = ads['Marketplace'] || [];
  // Ad rotation map – computed at component level (Rules of Hooks compliance)


  // Modals
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  
  // Selected Item details & view tracker
  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return allItems.find(item => item.id === selectedItemId) || null;
  }, [allItems, selectedItemId]);

  useEffect(() => {
    if (activeView === 'detail' && selectedItemId) {
      incrementViews(selectedItemId);
    }
  }, [activeView, selectedItemId]);

  // Image zoom/preview index
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formPriceText, setFormPriceText] = useState('Negotiable');
  const [formCategory, setFormCategory] = useState('Mobiles & Electronics');
  const [formCondition, setFormCondition] = useState<'New' | 'Used' | 'Fair'>('Used');
  const [formLocation, setFormLocation] = useState('Dhoke Hassu');
  const [formContact, setFormContact] = useState('');
  const [formImages, setFormImages] = useState<(File | string)[]>([]);
  const [imgUrlInput, setImgUrlInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isPosting, setIsPosting] = useState(false);

  // Chat window state
  const [chatMessages, setChatMessages] = useState<ItemChat[]>([]);
  const [newMsgText, setNewMsgText] = useState('');

  // Report handling
  const handleReportSubmit = async () => {
    if (!selectedItemId || !reportReason) return;
    await reportItem(selectedItemId, reportReason);
    setReportReason('');
    setIsReportOpen(false);
    alert(currentLanguage === 'en' ? 'Report submitted successfully. Thank you!' : 'رپورٹ کامیابی کے ساتھ جمع ہو گئی۔ شکریہ!');
  };

  // Preset Template Images for easy posting
  const PRESET_IMAGES = [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=400'
  ];

  // Load chat messages when entering chat view
  useEffect(() => {
    if (activeView !== 'chat' || !selectedItemId) return;
    
    let isMounted = true;
    const loadChats = async () => {
      if (isSupabaseConfigured && supabase) {
        const msgs = await dbGetItemChats(selectedItemId, []);
        if (isMounted) setChatMessages(msgs);
      } else {
        if (isMounted) setChatMessages(getOfflineChats(selectedItemId));
      }
    };
    loadChats();

    // Listen for offline chats trigger
    const handleOfflineUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ItemChat>;
      if (customEvent.detail && customEvent.detail.item_id === selectedItemId) {
        setChatMessages(prev => [...prev, customEvent.detail]);
      }
    };
    window.addEventListener(`chat_update_${selectedItemId}`, handleOfflineUpdate);

    // Setup Supabase Realtime for chat messages
    let channel: any;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel(`realtime:item_chats:${selectedItemId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'item_chats',
          filter: `item_id=eq.${selectedItemId}`
        }, (payload) => {
          const newMsg = payload.new as ItemChat;
          setChatMessages(prev => {
            // Remove any optimistic placeholder that matches this message
            const withoutOptimistic = prev.filter(m => 
              !(m.id.startsWith('optimistic-') && 
                m.sender_id === newMsg.sender_id && 
                m.content === newMsg.content)
            );
            // Avoid duplicates from other sources
            if (withoutOptimistic.some(m => m.id === newMsg.id)) return withoutOptimistic;
            return [...withoutOptimistic, newMsg];
          });
        })
        .subscribe();
    }

    return () => {
      isMounted = false;
      window.removeEventListener(`chat_update_${selectedItemId}`, handleOfflineUpdate);
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeView, selectedItemId, getOfflineChats]);

  // Handle Send Chat Message
  const handleSendChat = async () => {
    if (!newMsgText?.trim() || !selectedItemId) return;
    const txt = newMsgText?.trim();
    setNewMsgText('');

    // Optimistically add the message to UI instantly
    const optimisticMsg: ItemChat = {
      id: `optimistic-${Date.now()}`,
      item_id: selectedItemId,
      sender_id: currentUser?.id || 'mock-user-id',
      sender_name: currentUser?.fullName || 'You',
      content: txt,
      sent_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, optimisticMsg]);

    const sellerUserId = selectedItem?.posted_by;
    const itemTitle = selectedItem?.title;
    const success = await sendMessage(selectedItemId, txt, sellerUserId, itemTitle);
    
    if (!success) {
      // Rollback optimistic update on failure
      setChatMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setNewMsgText(txt);
    } else {
      if (chatMessages.length === 0) {
        analytics.track("marketplace_chat_start", { entity_type: 'listing',
          module: "marketplace",
          entity_id: selectedItemId
        });
      }
      if (!isSupabaseConfigured) {
        // In offline mode, replace optimistic with persisted version
        setChatMessages(getOfflineChats(selectedItemId));
      }
    }
    // In Supabase mode, the realtime subscription will receive the actual INSERT
    // and deduplicate/replace the optimistic message naturally.
  };

  // Handle Form Submission
  const handlePostAd = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formTitle?.trim()) errors.title = 'Title is required';
    if (!formDescription?.trim()) errors.description = 'Description is required';
    if (!formContact?.trim()) errors.contact = 'Contact number is required';
    if (formImages.length === 0) errors.images = 'At least one image is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsPosting(true);
    const success = await createItem({
      title: formTitle,
      description: formDescription,
      price: formPrice ? parseFloat(formPrice) : undefined,
      priceText: formPrice ? undefined : formPriceText,
      category: formCategory,
      condition: formCondition,
      location: formLocation
    }, formImages);

    setIsPosting(false);
    if (success) {
      // Reset form
      setFormTitle('');
      setFormDescription('');
      setFormPrice('');
      setFormPriceText('Negotiable');
      setFormImages([]);
      setFormContact('');
      navigate('/marketplace');
    } else {
      alert('Failed to publish listing. Please try again.');
    }
  };

  // Toggle Favorite Action helper
  const handleToggleFav = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(itemId);
  };

  // Get condition badge styling
  const getConditionStyle = (cond: string) => {
    switch (cond) {
      case 'New': return 'bg-green-100 text-green-800 border border-green-200';
      case 'Used': return 'bg-orange-100 text-orange-800 border border-orange-200';
      default: return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  // Format Date to relative string (e.g. 2h ago)
  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 600);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Categories Scroll component
  const CategoryTabs = () => (
    <div className="flex overflow-x-auto gap-2 py-3 px-4 bg-white border-b scrollbar-none sticky top-0 z-10">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          onClick={() => setSelectedCategory(cat.id)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
            selectedCategory === cat.id
              ? 'bg-[#2E7D32] text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {currentLanguage === 'en' ? cat.labelEn : cat.labelUr}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pb-16 font-sans">
      
      {/* 1. LISTING FEED VIEW */}
      {activeView === 'list' && (
        <>
          {/* Header & Search */}
          <div className="bg-white px-4 pt-4 pb-3 border-b shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-[#2E7D32] w-6 h-6" />
                <h1 className="text-xl font-bold text-slate-800">
                  {currentLanguage === 'en' ? 'Marketplace' : 'خرید و فروخت'}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/marketplace/my-listings')}
                  className="text-xs px-3 py-1.5 border border-slate-200 rounded-xl font-medium text-slate-700 bg-slate-50 hover:bg-slate-100"
                >
                  {currentLanguage === 'en' ? 'My Ads' : 'میری اشتہارات'}
                </button>
                <button
                  onClick={() => navigate('/marketplace/create')}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#2E7D32] text-white rounded-xl font-medium hover:bg-green-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {currentLanguage === 'en' ? 'Sell' : 'بیچیں'}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={currentLanguage === 'en' ? 'Search items...' : 'چیزیں تلاش کریں...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 ps-9 pe-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:bg-white"
                />
              </div>
              <button
                onClick={() => setIsFilterOpen(true)}
                className="px-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Scroller */}
          <CategoryTabs />

          {/* Top Banner Ad Segment */}
          {marketplaceBannerMap[0] && (
            <div className="p-4 max-w-5xl mx-auto w-full pb-0">
              <AdBannerCard ad={marketplaceBannerMap[0]} />
            </div>
          )}

          {/* Listings Feed Grid */}
          <div className="p-4 max-w-5xl mx-auto w-full">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E7D32]"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">
                  {currentLanguage === 'en' ? 'No items found matching filters.' : 'فلٹرز کے مطابق کوئی چیز نہیں ملی۔'}
                </p>
                <button
                  onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setFilters({ minPrice: '', maxPrice: '', condition: '' }); }}
                  className="mt-4 text-xs font-semibold text-[#2E7D32] hover:underline"
                >
                  {currentLanguage === 'en' ? 'Clear Filters' : 'فلٹرز صاف کریں'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(() => {
                  const elements = [];
                  for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const ad = marketplaceAdMap[i];
                    const thumbnail = item.images && item.images.length > 0
                      ? item.images[0].path
                      : 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400';

                    elements.push(
                      <div
                        key={item.id}
                        onClick={() => navigate('/marketplace/detail', item.id)}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200 cursor-pointer relative group"
                      >
                        {/* Image Frame */}
                        <div className="aspect-square relative bg-slate-100 overflow-hidden">
                          <img
                            src={thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            onClick={(e) => handleToggleFav(item.id, e)}
                            className="absolute top-2 end-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 shadow-sm transition-colors"
                          >
                            <Heart
                              className={`w-4 h-4 ${favorites.includes(item.id) ? 'fill-red-500 text-red-500' : 'text-slate-600'}`}
                            />
                          </button>
                          <span className={`absolute bottom-2 start-2 px-2 py-0.5 rounded text-[10px] font-bold ${getConditionStyle(item.condition)}`}>
                            {item.condition}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-800 text-sm line-clamp-1 mb-1">
                              {item.title}
                            </h3>
                            <div className="text-[#2E7D32] font-bold text-base mb-2">
                              {item.price ? `PKR ${item.price.toLocaleString()}` : (item.priceText || 'Negotiable')}
                            </div>
                          </div>

                          <div>
                            {item.seller_profile?.full_name && (
                              <div className="text-[10px] text-slate-400 font-medium mb-1">
                                {currentLanguage === 'en' ? 'By: ' : 'از: '}{item.seller_profile.full_name}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="line-clamp-1">{item.location}</span>
                            </div>

                            <div className="flex items-center justify-between border-t pt-2">
                              <span className="text-[10px] text-slate-400">
                                {formatRelativeTime(item.posted_at)}
                              </span>
                              {item.posted_by !== (currentUser?.id || 'mock-user-id') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/marketplace/chat', item.id);
                                  }}
                                  className="flex items-center gap-0.5 text-xs text-emerald-600 hover:text-blue-800 font-semibold"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  {currentLanguage === 'en' ? 'Chat' : 'چیٹ'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );

                    // Inject Marketplace active ad from rotator
                    if (ad) {
                      elements.push(
                        <div key={`ad-market-${i}-${ad.id}`} className="col-span-2 md:col-span-3 lg:col-span-4 my-2">
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
        </>
      )}

      {/* 2. POST / CREATE AD SCREEN */}
      {activeView === 'create' && (
        <div className="p-4 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => navigate('/marketplace')} className="p-1 hover:bg-slate-200 rounded-full">
              <ChevronLeft className="w-6 h-6 text-slate-700" />
            </button>
            <h1 className="text-lg font-bold text-slate-800">
              {currentLanguage === 'en' ? 'Post New Listing' : 'نیا اشتہار شائع کریں'}
            </h1>
          </div>

          <form onSubmit={handlePostAd} className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {currentLanguage === 'en' ? 'Item Title' : 'عنوان'} *
              </label>
              <input
                type="text"
                placeholder={currentLanguage === 'en' ? 'e.g. iPhone 13 Pro Max...' : 'مثال کے طور پر آئی فون 13...'}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
              />
              {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {currentLanguage === 'en' ? 'Category' : 'زمرہ'}
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                >
                  {CATEGORIES.filter(c => c.id !== 'All').map(c => (
                    <option key={c.id} value={c.id}>
                      {currentLanguage === 'en' ? c.labelEn : c.labelUr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {currentLanguage === 'en' ? 'Condition' : 'حالت'}
                </label>
                <select
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value as any)}
                  className="w-full border rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                >
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {currentLanguage === 'en' ? 'Price (PKR)' : 'قیمت'}
                </label>
                <input
                  type="number"
                  placeholder="Leave empty for negotiable"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {currentLanguage === 'en' ? 'Price Note' : 'قیمت کی تفصیل'}
                </label>
                <select
                  value={formPriceText}
                  onChange={(e) => setFormPriceText(e.target.value)}
                  disabled={!!formPrice}
                  className="w-full border rounded-xl p-2.5 text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                >
                  <option value="Negotiable">Negotiable</option>
                  <option value="Call for price">Call for price</option>
                  <option value="Free">Free</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {currentLanguage === 'en' ? 'Description' : 'تفصیل'} *
              </label>
              <textarea
                rows={3}
                placeholder={currentLanguage === 'en' ? 'Describe key details, defects, accessories included...' : 'تفصیل درج کریں...'}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
              />
              {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {currentLanguage === 'en' ? 'Location' : 'مقام'}
              </label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {currentLanguage === 'en' ? 'Contact Details (Phone / WhatsApp)' : 'رابطہ نمبر'} *
              </label>
              <input
                type="text"
                placeholder="e.g. +92 300 1234567"
                value={formContact}
                onChange={(e) => setFormContact(e.target.value)}
                className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
              />
              {formErrors.contact && <p className="text-red-500 text-xs mt-1">{formErrors.contact}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {currentLanguage === 'en' ? 'Photos (Max 5)' : 'تصاویر (زیادہ سے زیادہ 5)'} *
              </label>

              {/* Upload Drop Zone / Button */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                  const newImages = [...formImages, ...files]?.slice(0, 5);
                  setFormImages(newImages);
                }}
                className="border-2 border-dashed border-slate-300 hover:border-[#2E7D32] rounded-2xl p-6 text-center cursor-pointer bg-slate-50 transition-colors flex flex-col items-center justify-center gap-2 mb-3"
                onClick={() => document.getElementById('marketplace-file-input')?.click()}
              >
                <Camera className="w-8 h-8 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">
                  {currentLanguage === 'en' ? 'Click or Drag & Drop to Upload Images' : 'تصاویر اپ لوڈ کرنے کے لیے کلک کریں یا یہاں ڈریگ کریں'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {currentLanguage === 'en' ? 'Supports JPEG, PNG, WEBP (Max 5 images)' : 'جے پی جی، پی این جی، ویب پی (زیادہ سے زیادہ 5 تصاویر)'}
                </span>
                <input
                  id="marketplace-file-input"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const newImages = [...formImages, ...files]?.slice(0, 5);
                    setFormImages(newImages);
                  }}
                  className="hidden"
                />
              </div>

              {/* Presets */}
              <div className="mb-3">
                <span className="text-[10px] text-slate-400 block mb-1">Or choose a preset template:</span>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {PRESET_IMAGES.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (formImages.length < 5 && !formImages.some(img => typeof img === 'string' && img === url)) {
                          setFormImages([...formImages, url]);
                        }
                      }}
                      className="w-12 h-12 rounded border overflow-hidden flex-shrink-0 opacity-80 hover:opacity-100"
                    >
                      <img src={url} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Previews */}
              {formImages.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {formImages.map((img, idx) => {
                    const src = typeof img === 'string' ? img : URL.createObjectURL(img);
                    return (
                      <div key={idx} className="relative aspect-square border rounded-xl overflow-hidden group shadow-sm bg-slate-100">
                        <img src={src} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormImages(formImages.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1 end-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {formErrors.images && <p className="text-red-500 text-xs mt-1">{formErrors.images}</p>}
            </div>

            <button
              type="submit"
              disabled={isPosting}
              className="w-full py-3 bg-[#2E7D32] hover:bg-green-800 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
            >
              {isPosting ? 'Publishing...' : (currentLanguage === 'en' ? 'Post Ad' : 'اشتہار شائع کریں')}
            </button>
          </form>
        </div>
      )}

      {/* 3. ITEM DETAILS PAGE VIEW */}
      {activeView === 'detail' && selectedItem && (
        <div className="max-w-2xl mx-auto w-full p-4 space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/marketplace')} className="flex items-center gap-1 text-slate-700 hover:text-[#2E7D32]">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-semibold">{currentLanguage === 'en' ? 'Back' : 'پیچھے'}</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => toggleFavorite(selectedItem.id)}
                className="p-2 border rounded-full bg-white text-slate-600 hover:bg-slate-50 shadow-sm"
              >
                <Heart className={`w-5 h-5 ${favorites.includes(selectedItem.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/marketplace/detail?itemId=${selectedItem.id}`);
                  alert(currentLanguage === 'en' ? 'Link copied!' : 'لنک کاپی ہو گیا!');
                }}
                className="p-2 border rounded-full bg-white text-slate-600 hover:bg-slate-50 shadow-sm"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Gallery Frame */}
            <div className="w-full flex justify-center bg-slate-900 relative overflow-hidden rounded-t-xl border-b border-slate-200">
              <div className="w-full max-w-[700px] h-60 sm:h-80 relative flex items-center justify-center">
                <img
                  src={selectedItem.images && selectedItem.images.length > 0 ? selectedItem.images[activeImgIndex]?.path : 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=600'}
                  alt={selectedItem.title}
                  className="w-full h-full max-h-[500px] object-contain block"
                />
                             {selectedItem.images && selectedItem.images.length > 1 && (
                <div className="absolute bottom-4 start-0 end-0 flex justify-center gap-1">
                  {selectedItem.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImgIndex(i)}
                      className={`w-2 h-2 rounded-full ${activeImgIndex === i ? 'bg-[#2E7D32]' : 'bg-white/60'}`}
                    />
                  ))}
                </div>
              )}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-800 mb-1">{selectedItem.title}</h1>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${getConditionStyle(selectedItem.condition)}`}>
                    {selectedItem.condition} Condition
                  </span>
                </div>
                <div className="text-2xl font-black text-[#2E7D32] whitespace-nowrap">
                  {selectedItem.price ? `PKR ${selectedItem.price.toLocaleString()}` : (selectedItem.priceText || 'Negotiable')}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-b py-2.5">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{selectedItem.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{formatRelativeTime(selectedItem.posted_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>{selectedItem.views || 0} views</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-1">
                  {currentLanguage === 'en' ? 'Description' : 'تفصیل'}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedItem.description}
                </p>
              </div>

              {/* Seller details card */}
              <div 
                className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors"
                data-profile-name={selectedItem.seller_profile?.full_name || 'Seller'}
                data-profile-avatar={selectedItem.seller_profile?.profile_photo || ''}
                data-profile-id={selectedItem.posted_by || ''}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm overflow-hidden">
                    {selectedItem.seller_profile?.profile_photo ? (
                      <img src={selectedItem.seller_profile.profile_photo} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800 flex items-center gap-1">
                      {selectedItem.seller_profile?.full_name || 'Seller'}
                      {selectedItem.seller_profile?.verified && (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                      )}
                    </div>
                    <span className="text-xs text-slate-400">Verified community member</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`tel:${selectedItem.location}`}
                    className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl"
                    onClick={() => analytics.track("seller_contact", { entity_type: 'listing', module: "marketplace", entity_id: selectedItem.id, metadata: { contact_type: 'phone' }})}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/${selectedItem.location.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl"
                    onClick={() => analytics.track("seller_contact", { entity_type: 'listing', module: "marketplace", entity_id: selectedItem.id, metadata: { contact_type: 'whatsapp' }})}
                  >
                    <Send className="w-4 h-4 rotate-45" />
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {selectedItem.posted_by === (currentUser?.id || 'mock-user-id') ? (
                  <button
                    disabled
                    className="w-full py-3 bg-slate-100 text-slate-400 font-bold rounded-2xl text-center text-sm border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    {currentLanguage === 'en' ? 'Boost (Coming Soon)' : 'فروغ دیں'}
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => navigate('/marketplace/chat', selectedItem.id)}
                      className="py-3 bg-[#2E7D32] hover:bg-green-800 text-white font-bold rounded-2xl text-center text-sm shadow-sm transition-colors"
                    >
                      {currentLanguage === 'en' ? 'Chat Seller' : 'فروخت کنندہ سے چیٹ'}
                    </button>
                    <button
                      disabled
                      className="py-3 bg-slate-100 text-slate-400 font-bold rounded-2xl text-center text-sm border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      {currentLanguage === 'en' ? 'Boost (Coming Soon)' : 'فروغ دیں'}
                    </button>
                  </div>
                )}
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => setIsReportOpen(true)}
                  className="text-xs text-red-500 hover:underline flex items-center gap-1 mx-auto font-medium"
                >
                  <Flag className="w-3.5 h-3.5" />
                  {currentLanguage === 'en' ? 'Report inappropriate listing' : 'غیر مناسب مواد کی رپورٹ کریں'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CHAT SYSTEM WINDOW */}
      {activeView === 'chat' && selectedItem && (
        <div className="flex flex-col h-[calc(100vh-64px)] max-w-2xl mx-auto w-full bg-white border-x">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-white">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/marketplace/detail', selectedItem.id)} className="p-1 hover:bg-slate-100 rounded-full">
                <ChevronLeft className="w-6 h-6 text-slate-700" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden">
                  <img
                    src={selectedItem.images && selectedItem.images.length > 0 ? selectedItem.images[0].path : 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=100'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 line-clamp-1">{selectedItem.title}</h2>
                  <p className="text-xs font-bold text-[#2E7D32]">
                    {selectedItem.price ? `PKR ${selectedItem.price.toLocaleString()}` : (selectedItem.priceText || 'Negotiable')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {chatMessages.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-xs">
                {currentLanguage === 'en' ? 'Ask seller details, offer price or negotiate.' : 'چیٹ شروع کرنے کے لیے کوئی پیغام بھیجیں۔'}
              </div>
            ) : (
              chatMessages.map(msg => {
                const isMe = msg.sender_id === (currentUser?.id || 'mock-user-id');
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      isMe ? 'bg-[#2E7D32] text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                    }`}>
                      {!isMe && <span className="block text-[10px] font-bold text-slate-500 mb-0.5">{msg.sender_name}</span>}
                      <p>{msg.content}</p>
                      <span className={`block text-[9px] text-end mt-1 ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                        {formatRelativeTime(msg.sent_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message input */}
          <div className="border-t p-3 bg-white flex gap-2 items-center">
            <input
              type="text"
              placeholder={currentLanguage === 'en' ? 'Type a message...' : 'پیغام لکھیں...'}
              value={newMsgText}
              onChange={(e) => setNewMsgText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
              className="flex-1 border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            />
            <button
              onClick={handleSendChat}
              className="p-2.5 bg-[#2E7D32] text-white rounded-full hover:bg-green-800 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* 5. MY LISTINGS MANAGER VIEW */}
      {activeView === 'my-listings' && (
        <div className="p-4 max-w-xl mx-auto w-full space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/marketplace')} className="p-1 hover:bg-slate-200 rounded-full">
              <ChevronLeft className="w-6 h-6 text-slate-700" />
            </button>
            <h1 className="text-lg font-bold text-slate-800">
              {currentLanguage === 'en' ? 'My Marketplace Ads' : 'میری لسٹنگز'}
            </h1>
          </div>

          <div className="space-y-3">
            {fetchMyListings().length === 0 ? (
              <div className="text-center py-16 bg-white border rounded-2xl p-8">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">
                  {currentLanguage === 'en' ? 'You have not posted any ads yet.' : 'آپ نے ابھی تک کوئی اشتہار پوسٹ نہیں کیا۔'}
                </p>
                <button
                  onClick={() => navigate('/marketplace/create')}
                  className="mt-4 px-4 py-2 bg-[#2E7D32] text-white rounded-xl text-xs font-semibold hover:bg-green-800"
                >
                  {currentLanguage === 'en' ? 'Post An Ad' : 'نیا اشتہار لگائیں'}
                </button>
              </div>
            ) : (
              fetchMyListings().map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-3 flex gap-3 shadow-sm justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <div className="w-16 h-16 rounded overflow-hidden bg-slate-100 flex-shrink-0">
                      <img
                        src={item.images && item.images.length > 0 ? item.images[0].path : 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=200'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-[#2E7D32] font-semibold mt-0.5">
                        {item.price ? `PKR ${item.price.toLocaleString()}` : (item.priceText || 'Negotiable')}
                      </p>
                      <div className="flex gap-2 items-center text-[10px] text-slate-400 mt-1.5">
                        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {item.views || 0}</span>
                        {item.is_sold && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-bold">SOLD</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {!item.is_sold && (
                      <button
                        onClick={() => markAsSold(item.id)}
                        className="px-2.5 py-1.5 bg-[#2E7D32] text-white rounded-xl text-[11px] font-bold hover:bg-green-800"
                      >
                        {currentLanguage === 'en' ? 'Mark Sold' : 'فروخت شدہ'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* FILTER PANEL MODAL */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-5 space-y-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">
                {currentLanguage === 'en' ? 'Filter Listings' : 'اشتہارات فلٹر کریں'}
              </h3>
              <button onClick={() => setIsFilterOpen(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Price Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="border rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="border rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Condition</label>
                <div className="flex gap-2">
                  {['New', 'Used', 'Fair'].map(cond => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setFilters({ ...filters, condition: filters.condition === cond ? '' : cond })}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                        filters.condition === cond
                          ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setFilters({ minPrice: '', maxPrice: '', condition: '' });
                  setIsFilterOpen(false);
                }}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100"
              >
                Clear
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-2.5 bg-[#2E7D32] text-white rounded-xl text-xs font-bold hover:bg-green-800 shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT LISTING MODAL */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                {currentLanguage === 'en' ? 'Report Listing' : 'رپورٹ کریں'}
              </h3>
              <button onClick={() => setIsReportOpen(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Reason for report</label>
              <textarea
                rows={3}
                placeholder="e.g. Inappropriate item, counterfeit products, duplicate listing, fake seller..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsReportOpen(false)}
                className="flex-1 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

