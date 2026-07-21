import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { analytics } from '../services/AnalyticsService';

const viewedMarketplaceItems = new Set<string>();

import { MarketplaceItem, ItemImage, ItemChat, User } from '../types';
import {
  dbGetMarketplaceListings,
  dbSaveMarketplaceListing,
  dbDeleteMarketplaceListing,
  dbSaveMarketplaceImages,
  dbUploadMarketplaceImage,
  dbDeleteMarketplaceImage,
  dbGetItemChats,
  dbSendItemChatMessage,
  dbGetItemFavorites,
  dbToggleItemFavorite,
  dbReportMarketplaceItem,
  dbIncrementItemViews,
  dbTriggerNotification,
  dbGetOrCreatePrivateConversation,
  dbSendMessage
} from '../utils/supabaseClient';
import { mockBuySell } from '../mockData';
import { getCurrentUserLocation } from '../utils/locationService';
import { optimizeImage } from '../utils/imageService';

// Map initial mock data to our new type structure
const getInitialMockData = (): MarketplaceItem[] => {
  const local = localStorage.getItem('dhoke_marketplace_listings');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // fallback
    }
  }

  const mappedMock: MarketplaceItem[] = mockBuySell.map((item, idx) => ({
    id: item.id || `mock-item-${idx}`,
    title: item.title,
    description: item.description || 'No description provided.',
    price: parseFloat(item.price.replace(/[^0-9]/g, '')) || undefined,
    priceText: item.price.includes('Negotiable') ? 'Negotiable' : undefined,
    category: item.category,
    condition: (item.condition as any) || 'Used',
    location: item.area || 'Dhoke Hassu',
    posted_by: 'mock-seller-id',
    posted_at: new Date(Date.now() - idx * 3600000).toISOString(),
    is_sold: false,
    views: Math.floor(Math.random() * 150) + 10,
    images: item.image ? [{ id: `img-${idx}`, item_id: item.id, path: item.image, order: 0 }] : []
  }));

  localStorage.setItem('dhoke_marketplace_listings', JSON.stringify(mappedMock));
  return mappedMock;
};

export function useMarketplace(currentUser: User | null) {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    condition: ''
  });

  // Local storage chats fallback
  const getOfflineChats = useCallback((itemId: string): ItemChat[] => {
    const local = localStorage.getItem(`dhoke_chat_${itemId}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        return [];
      }
    }
    return [];
  }, []);

  const saveOfflineChat = useCallback((itemId: string, chat: ItemChat) => {
    const chats = getOfflineChats(itemId);
    const updated = [...chats, chat];
    localStorage.setItem(`dhoke_chat_${itemId}`, JSON.stringify(updated));
  }, [getOfflineChats]);

  // Load initial listings & favorites
  const fetchItems = useCallback(async () => {
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      const dbItems = await dbGetMarketplaceListings([]);
      setItems(dbItems);
      
      if (currentUser?.id) {
        const favIds = await dbGetItemFavorites(currentUser.id, []);
        setFavorites(favIds);
      }
    } else {
      // Offline/Local
      setItems(getInitialMockData());
      if (currentUser?.id) {
        const offlineFavs = localStorage.getItem(`dhoke_favs_${currentUser.id}`);
        setFavorites(offlineFavs ? JSON.parse(offlineFavs) : []);
      }
    }
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Real-time subscription to items
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('realtime:marketplace_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_items' }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems]);

  // Create Listing
  const createItem = async (
    itemData: Omit<MarketplaceItem, 'id' | 'posted_by' | 'posted_at' | 'is_sold' | 'views'>,
    images: (File | string)[]
  ) => {
    if (!currentUser) return false;
    const newItemId = isSupabaseConfigured ? undefined : `item-${Date.now()}`;
    
    const itemToSave: Partial<MarketplaceItem> = {
      title: itemData.title,
      description: itemData.description,
      price: itemData.price,
      priceText: itemData.priceText,
      category: itemData.category,
      condition: itemData.condition,
      location: itemData.location || 'Dhoke Hassu',
      posted_by: currentUser.id || 'mock-user-id',
      is_sold: false,
      views: 0
    };

    if (isSupabaseConfigured && supabase) {
      const uploadedUrls: string[] = [];
      try {
        // 1. Process and upload all images first. If any fails, cleanup and abort.
        for (const img of images) {
          if (typeof img === 'string') {
            uploadedUrls.push(img);
          } else {
            const optimized = await optimizeImage(img);
            const url = await dbUploadMarketplaceImage(optimized);
            if (!url) {
              // Failed: Delete already uploaded images from Storage
              console.error("Image upload failed. Cleaning up already uploaded images.");
              for (const uploadedUrl of uploadedUrls) {
                if (!uploadedUrl.startsWith('http') || uploadedUrl.includes('unsplash.com')) continue; // Skip presets
                await dbDeleteMarketplaceImage(uploadedUrl);
              }
              return false;
            }
            uploadedUrls.push(url);
          }
        }

        // 2. All uploads succeeded (or were presets). Insert the listing.
        const { data, error } = await supabase
          .from('marketplace_items')
          .insert([itemToSave])
          .select()
          .single();

        if (error || !data) {
          console.error("Error creating marketplace item:", error);
          // Cleanup uploaded images from Storage
          for (const uploadedUrl of uploadedUrls) {
            if (!uploadedUrl.startsWith('http') || uploadedUrl.includes('unsplash.com')) continue;
            await dbDeleteMarketplaceImage(uploadedUrl);
          }
          return false;
        }

        // 3. Save references to the uploaded images in the database.
        if (uploadedUrls.length > 0) {
          const imgs: Partial<ItemImage>[] = uploadedUrls.map((url, idx) => ({
            item_id: data.id,
            path: url,
            order: idx
          }));
          const imgSaveSuccess = await dbSaveMarketplaceImages(imgs);
          if (!imgSaveSuccess) {
            console.error("Failed to save image references. Cleaning up database listing and storage files.");
            // Delete listing
            await supabase.from('marketplace_items').delete().eq('id', data.id);
            // Cleanup storage files
            for (const uploadedUrl of uploadedUrls) {
              if (!uploadedUrl.startsWith('http') || uploadedUrl.includes('unsplash.com')) continue;
              await dbDeleteMarketplaceImage(uploadedUrl);
            }
            return false;
          }
        }
        await fetchItems();
        analytics.track("listing_create", { entity_type: 'unknown',
          module: "marketplace",
          entity_id: data.id,
          metadata: {
            category: itemToSave.category,
            has_images: uploadedUrls.length > 0,
            price_type: itemToSave.price ? 'fixed' : (itemToSave.priceText || 'free')
          }
        });
        return true;
      } catch (err) {
        console.error("Exception creating marketplace item:", err);
        // Cleanup uploaded images on general exception
        for (const uploadedUrl of uploadedUrls) {
          if (!uploadedUrl.startsWith('http') || uploadedUrl.includes('unsplash.com')) continue;
          await dbDeleteMarketplaceImage(uploadedUrl);
        }
        return false;
      }
    } else {
      // Offline mode
      const offlineUrls: string[] = [];
      for (const img of images) {
        if (typeof img === 'string') {
          offlineUrls.push(img);
        } else {
          offlineUrls.push(URL.createObjectURL(img));
        }
      }

      const offlineItem: MarketplaceItem = {
        ...(itemToSave as any),
        id: newItemId!,
        posted_at: new Date().toISOString(),
        images: offlineUrls.map((url, idx) => ({
          id: `img-${Date.now()}-${idx}`,
          item_id: newItemId!,
          path: url,
          order: idx
        })),
        seller_profile: {
          full_name: currentUser.fullName,
          profile_photo: currentUser.profilePhoto
        }
      };

      const updated = [offlineItem, ...items];
      localStorage.setItem('dhoke_marketplace_listings', JSON.stringify(updated));
      setItems(updated);
      analytics.track("listing_create", { entity_type: 'unknown',
        module: "marketplace",
        entity_id: newItemId!,
        metadata: {
          category: itemToSave.category,
          has_images: images.length > 0,
          price_type: itemToSave.price ? 'fixed' : (itemToSave.priceText || 'free')
        }
      });
      return true;
    }
  };

  // Chat message sender
  const sendMessage = async (itemId: string, content: string, sellerUserId?: string, itemTitle?: string) => {
    if (!currentUser) return false;

    const chatMsg: Partial<ItemChat> = {
      item_id: itemId,
      sender_id: currentUser.id || 'mock-user-id',
      sender_name: currentUser.fullName,
      content: content
    };

    if (isSupabaseConfigured && supabase) {
      const success = await dbSendItemChatMessage(chatMsg);
      console.log('[useMarketplace] dbSendItemChatMessage result:', success);

      if (success && sellerUserId && sellerUserId !== (currentUser.id || 'mock-user-id')) {
        let convId: string | null = null;
        // --- Write to the main conversations/messages table so it appears in the Chat tab ---
        try {
          convId = await dbGetOrCreatePrivateConversation(currentUser.id!, sellerUserId);
          if (convId) {
            await dbSendMessage(
              convId,
              currentUser.id!,
              `[Inquiry on "${itemTitle || 'Listing'}"]: ${content}`,
              'text'
            );
            console.log('[useMarketplace] Synced message to main chat conversation:', convId);
          }
        } catch (convErr) {
          console.warn('[useMarketplace] Failed to sync to main chat:', convErr);
        }

        // --- BROADCAST to seller's personal channel (websocket, no RLS needed) ---
        try {
          const broadcastChannel = supabase.channel(`marketplace:seller:${sellerUserId}`);
          
          broadcastChannel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              try {
                await broadcastChannel.send({
                  type: 'broadcast',
                  event: 'new_inquiry',
                  payload: {
                    item_id: itemId,
                    item_title: itemTitle || 'Your Listing',
                    sender_name: currentUser.fullName,
                    sender_id: currentUser.id,
                    conversation_id: convId || itemId, // Fallback to itemId if main conversation creation failed
                    content: content,
                    sent_at: new Date().toISOString()
                  }
                });
              } catch (broadcastErr) {
                console.warn('[useMarketplace] Broadcast failed:', broadcastErr);
              } finally {
                supabase.removeChannel(broadcastChannel);
              }
            } else {
               supabase.removeChannel(broadcastChannel);
            }
          });
        } catch (err) {
          console.warn('[useMarketplace] Channel init failed', err);
        }

        // --- Also attempt DB notification insert (best-effort) ---
        try {
          await dbTriggerNotification(
            sellerUserId,
            currentUser.id || null,
            'chat',
            'New Inquiry on Your Listing',
            `${currentUser.fullName} sent you a message: "${content?.slice(0, 60)}${content.length > 60 ? '...' : ''}"`,
            'chat',
            convId || itemId
          );
        } catch (e) {
          console.warn('[useMarketplace] DB notification failed (non-blocking):', e);
        }
      }
      return success;
    } else {
      const offlineMsg: ItemChat = {
        id: `chat-${Date.now()}`,
        item_id: itemId,
        sender_id: currentUser.id || 'mock-user-id',
        sender_name: currentUser.fullName,
        content: content,
        sent_at: new Date().toISOString()
      };
      saveOfflineChat(itemId, offlineMsg);
      // Trigger state updates
      window.dispatchEvent(new CustomEvent(`chat_update_${itemId}`, { detail: offlineMsg }));
      return true;
    }
  };

  // Bookmark Toggle
  const toggleFavorite = async (itemId: string) => {
    if (!currentUser) return false;
    const isFav = favorites.includes(itemId);
    const newFavorites = isFav
      ? favorites.filter(id => id !== itemId)
      : [...favorites, itemId];

    if (isSupabaseConfigured && supabase) {
      const success = await dbToggleItemFavorite(currentUser.id!, itemId, !isFav);
      if (success) {
        setFavorites(newFavorites);
        analytics.track(isFav ? "listing_unsave" : "listing_save", { entity_type: 'unknown', module: "marketplace", entity_id: itemId });
        return true;
      }
      return false;
    } else {
      localStorage.setItem(`dhoke_favs_${currentUser.id}`, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
      analytics.track(isFav ? "listing_unsave" : "listing_save", { entity_type: 'unknown', module: "marketplace", entity_id: itemId });
      return true;
    }
  };

  // Fetch own listings
  const fetchMyListings = useCallback(() => {
    if (!currentUser) return [];
    return items.filter(item => item.posted_by === currentUser.id);
  }, [items, currentUser]);

  // Mark item as Sold
  const markAsSold = async (itemId: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('marketplace_items')
        .update({ is_sold: true })
        .eq('id', itemId);
      
      if (!error) {
        await fetchItems();
        return true;
      }
      return false;
    } else {
      const updated = items.map(item =>
        item.id === itemId ? { ...item, is_sold: true } : item
      );
      localStorage.setItem('dhoke_marketplace_listings', JSON.stringify(updated));
      setItems(updated);
      return true;
    }
  };

  // Report Item
  const reportItem = async (itemId: string, reason: string) => {
    if (!currentUser) return false;
    if (isSupabaseConfigured && supabase) {
      return dbReportMarketplaceItem({
        item_id: itemId,
        reporter_id: currentUser.id!,
        reason: reason
      });
    } else {
      console.log(`[Offline Mode] Reported item ${itemId} for reason: ${reason}`);
      return true;
    }
  };

  // Increment views
  const incrementViews = async (itemId: string) => {
    if (viewedMarketplaceItems.has(itemId)) return;
    viewedMarketplaceItems.add(itemId);
    
    analytics.track("listing_view", { entity_type: 'unknown',
      module: "marketplace",
      entity_id: itemId
    });

    if (isSupabaseConfigured && supabase) {
      await dbIncrementItemViews(itemId);
    } else {
      const updated = items.map(item =>
        item.id === itemId ? { ...item, views: (item.views || 0) + 1 } : item
      );
      localStorage.setItem('dhoke_marketplace_listings', JSON.stringify(updated));
      setItems(updated);
    }
  };

  // Filter listings based on category, search queries, and selected range
  const userLoc = getCurrentUserLocation();
  const filteredItems = items.filter(item => {
    if (item.is_sold) return false;

    const matchesLocation = !item.location || item.location?.toLowerCase() === userLoc?.toLowerCase();
    if (!matchesLocation) return false;
    
    const titleMatch = item.title ? item.title?.toLowerCase().includes(searchQuery?.toLowerCase()) : false;
    const descMatch = item.description ? item.description?.toLowerCase().includes(searchQuery?.toLowerCase()) : false;
    const locMatch = item.location ? item.location?.toLowerCase().includes(searchQuery?.toLowerCase()) : false;
    
    const matchesSearch = titleMatch || descMatch || locMatch;

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

    const priceNum = item.price || 0;
    const matchesMinPrice = !filters.minPrice || priceNum >= parseFloat(filters.minPrice);
    const matchesMaxPrice = !filters.maxPrice || priceNum <= parseFloat(filters.maxPrice);
    const matchesCondition = !filters.condition || item.condition === filters.condition;

    return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesCondition;
  });

  // Delete Listing
  const deleteItem = async (itemId: string) => {
    if (!currentUser) return false;
    const itemToDelete = items.find(item => item.id === itemId);
    if (!itemToDelete) return false;

    if (isSupabaseConfigured && supabase) {
      try {
        const imagesToDelete = itemToDelete.images || [];
        const success = await dbDeleteMarketplaceListing(itemId);
        if (success) {
          // Clean up storage files
          for (const img of imagesToDelete) {
            if (img.path.startsWith('http') && !img.path.includes('unsplash.com')) {
              await dbDeleteMarketplaceImage(img.path);
            }
          }
          await fetchItems();
          return true;
        }
        return false;
      } catch (err) {
        console.error("Exception deleting marketplace listing:", err);
        return false;
      }
    } else {
      // Offline mode
      const updated = items.filter(item => item.id !== itemId);
      localStorage.setItem('dhoke_marketplace_listings', JSON.stringify(updated));
      setItems(updated);
      return true;
    }
  };

  return {
    items: filteredItems,
    allItems: items,
    favorites,
    loading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filters,
    setFilters,
    fetchItems,
    createItem,
    deleteItem,
    sendMessage,
    toggleFavorite,
    fetchMyListings,
    markAsSold,
    reportItem,
    incrementViews,
    getOfflineChats
  };
}
