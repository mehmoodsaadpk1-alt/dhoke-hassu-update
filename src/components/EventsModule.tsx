/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  User as UserIcon, 
  Share2, 
  Bookmark, 
  CheckCircle, 
  PlusCircle, 
  ArrowLeft, 
  Search, 
  Sparkles,
  Ticket,
  Users,
  Bell,
  Check,
  Tag,
  AlertCircle,
  Pin,
  Trash2,
  Edit,
  XCircle,
  UserCheck,
  Map,
  Download,
  AlertOctagon,
  Flag,
  Upload
} from 'lucide-react';
import { EventItem, Language, User, EventAttendee } from '../types';
import AdBannerCard from './AdBannerCard';
import { useAdRotator } from '../hooks/useAdRotator';
import { analytics } from '../services/AnalyticsService';

const viewedEvents = new Set<string>();
import { isUserAdminOrModerator } from './AlertsModule';
import { getCurrentUserLocation } from '../utils/locationService';

interface EventsModuleProps {
  events: EventItem[];
  onAddEvent: (newEvent: EventItem) => void;
  onUpdateEvents?: (updated: EventItem[]) => void;
  currentUser?: User;
  currentLanguage: Language;
  onNavigateToCreate: () => void;
  onNavigateToList: () => void;
  onNavigateToDetail: (eventId: string) => void;
  selectedEventId: string | null;
  activeView: 'list' | 'detail' | 'create';
}

// Generate downloadable iCalendar (.ics) file content
const handleAddToCalendar = (event: EventItem) => {
  const formatDate = (dateStr: string, timeStr: string) => {
    try {
      const cleanD = dateStr.replace(/-/g, '');
      const cleanT = (timeStr || '09:00').replace(/:/g, '') + '00';
      return `${cleanD}T${cleanT}`;
    } catch {
      return '20260704T090000';
    }
  };
  
  const start = formatDate(event.date, event.startTime);
  const end = formatDate(event.date, event.endTime || event.startTime);
  
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `LOCATION:${event.venue || event.area}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\n");
  
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function EventsModule({
  events,
  onAddEvent,
  onUpdateEvents,
  currentUser,
  currentLanguage,
  onNavigateToCreate,
  onNavigateToList,
  onNavigateToDetail,
  selectedEventId,
  activeView
}: EventsModuleProps) {
  const isEn = currentLanguage === 'en';
  const isAdmin = isUserAdminOrModerator(currentUser);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArea, setSelectedArea] = useState<string>(getCurrentUserLocation());
  const [ticketFilter, setTicketFilter] = useState<'All' | 'Free' | 'Paid'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Upcoming' | 'Live' | 'Completed'>('All');
  const [sortBy, setSortBy] = useState<'date' | 'newest' | 'popularity'>('date');

  // Bookmarks / Saved
  const [savedEventIds, setSavedEventIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dhoke_connect_saved_events');
      const parsed = JSON.parse(saved || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('dhoke_connect_saved_events', JSON.stringify(savedEventIds));
  }, [savedEventIds]);

  const [reportedIds, setReportedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dhoke_connect_reported_events');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('dhoke_connect_reported_events', JSON.stringify(reportedIds));
  }, [reportedIds]);

  // Form States (Create / Edit)
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Community Meeting');
  const [formDescription, setFormDescription] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const { dbUploadPostImage } = await import('../utils/supabaseClient');
      const uploadedUrl = await dbUploadPostImage(file);
      if (uploadedUrl) {
        setFormCoverImage(uploadedUrl);
        alert(currentLanguage === 'en' ? 'Cover uploaded successfully!' : 'کور کامیابی سے اپ لوڈ ہو گیا!');
      } else {
        alert(currentLanguage === 'en' ? 'Failed to upload cover' : 'کور اپ لوڈ کرنے میں ناکامی');
      }
    } catch (err) {
      console.error(err);
      alert('Upload error');
    } finally {
      setUploadingCover(false);
    }
  };
  const [formGalleryImages, setFormGalleryImages] = useState('');
  const [formOrganizer, setFormOrganizer] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formArea, setFormArea] = useState('Dhoke Hassu');
  const [formGoogleMap, setFormGoogleMap] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formMaxAttendees, setFormMaxAttendees] = useState('100');
  const [formTicketPrice, setFormTicketPrice] = useState('Free');
  const [formStatus, setFormStatus] = useState<'Upcoming' | 'Live' | 'Completed' | 'Cancelled'>('Upcoming');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const categories = [
    'All',
    'Community Meeting',
    'Religious Event',
    'Sports',
    'Tournament',
    'Seminar',
    'Workshop',
    'Charity',
    'Blood Donation',
    'Health Camp',
    'School Event',
    'Cultural Event',
    'Festival',
    'Business Promotion',
    'Food Festival',
    'Family Event',
    'Kids Activity',
    'Government Notice',
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

  const isOrganizerOfEvent = (event: EventItem) => {
    if (!currentUser) return false;
    return event.organizerName === currentUser.fullName || event.contactNumber === currentUser.mobileNumber;
  };

  const isUserRegistered = (event: EventItem) => {
    if (!currentUser) return false;
    return (event.attendees || []).some(att => att.contact === currentUser.mobileNumber);
  };

  // Register user helper
  const handleRegisterUser = (event: EventItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser || !onUpdateEvents) {
      showToast(isEn ? "Please log in to register for events." : "تقریبات میں رجسٹریشن کے لیے لاگ ان کریں۔");
      return;
    }

    if (isUserRegistered(event)) {
      // Cancel Registration
      const updatedAttendees = (event.attendees || []).filter(att => att.contact !== currentUser.mobileNumber);
      const updated = events.map(item => {
        if (item.id === event.id) {
          return {
            ...item,
            attendees: updatedAttendees,
            availableSeats: (item.availableSeats !== undefined ? item.availableSeats : (item.maxAttendees || 100)) + 1
          };
        }
      });
      onUpdateEvents(updated);
      showToast(isEn ? "Registration cancelled." : "رجسٹریشن منسوخ کر دی گئی۔");

      analytics.track("event_rsvp_cancel", { entity_type: 'event',
        module: "events",
        entity_id: event.id
      });
    } else {
      // Register
      const maxLimit = event.maxAttendees || 100;
      const currentCount = (event.attendees || []).length;
      if (currentCount >= maxLimit) {
        showToast(isEn ? "Event is fully booked / Sold out!" : "نشستیں مکمل ہو چکی ہیں!");
        return;
      }

      const attendee: EventAttendee = {
        name: currentUser.fullName,
        contact: currentUser.mobileNumber || '0300-0000000',
        date: new Date().toLocaleDateString()
      };

      const updatedAttendees = [...(event.attendees || []), attendee];
      const updated = events.map(item => {
        if (item.id === event.id) {
          return {
            ...item,
            attendees: updatedAttendees,
            availableSeats: Math.max(0, maxLimit - updatedAttendees.length)
          };
        }
      });
      onUpdateEvents(updated);
      showToast(isEn ? "Successfully registered for event!" : "تقریب کے لیے کامیابی سے رجسٹر ہو گئے!");

      analytics.track("event_join", { entity_type: 'event',
        module: "events",
        entity_id: event.id
      });
    }
  };

  // Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formTitle?.trim()) newErrors.title = isEn ? 'Event Title is required' : 'عنوا ن ضروری ہے';
    if (!formOrganizer?.trim()) newErrors.organizer = isEn ? 'Organizer Name is required' : 'منتظم کا نام ضروری ہے';
    if (!formContact?.trim()) newErrors.contact = isEn ? 'Contact number is required' : 'رابطہ نمبر درج کریں';
    if (!formDate) newErrors.date = isEn ? 'Event Date is required' : 'تاریخ کا انتخاب کریں';
    if (!formDescription?.trim()) newErrors.description = isEn ? 'Description is required' : 'تفصیل درج کریں';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setPublishSuccess(true);

    const defaultCover = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600';
    const galleryList = formGalleryImages?.split('\n').map(url => url?.trim()).filter(Boolean);
    const maxAtt = parseInt(formMaxAttendees) || 100;

    if (editingEventId) {
      if (onUpdateEvents) {
        onUpdateEvents(events.map((event): EventItem => {
          if (event.id === editingEventId) {
            const currentRegs = (event.attendees || []).length;
            return {
              ...event,
              title: formTitle,
              category: formCategory,
              description: formDescription,
              coverImage: formCoverImage?.trim() || defaultCover,
              galleryImages: galleryList,
              organizerName: formOrganizer,
              contactNumber: formContact,
              venue: formVenue,
              area: formArea,
              googleMap: formGoogleMap?.trim() || undefined,
              date: formDate,
              startTime: formStartTime || '09:00',
              endTime: formEndTime || '17:00',
              registrationDeadline: formDeadline?.trim() || undefined,
              maxAttendees: maxAtt,
              ticketPrice: formTicketPrice,
              availableSeats: Math.max(0, maxAtt - currentRegs),
              status: formStatus
            };
          }
          return event;
        }));
      }
    } else {
      const newEvent: EventItem = {
        id: `event-${Date.now()}`,
        title: formTitle,
        category: formCategory,
        description: formDescription,
        coverImage: formCoverImage?.trim() || defaultCover,
        galleryImages: galleryList,
        organizerName: formOrganizer,
        contactNumber: formContact,
        venue: formVenue,
        area: formArea,
        googleMap: formGoogleMap?.trim() || undefined,
        date: formDate,
        startTime: formStartTime || '09:00',
        endTime: formEndTime || '17:00',
        registrationDeadline: formDeadline?.trim() || undefined,
        maxAttendees: maxAtt,
        ticketPrice: formTicketPrice,
        availableSeats: maxAtt,
        status: formStatus,
        interestedCount: 1,
        attendees: [],
        featured: false,
        pinned: false,
        created_at: new Date().toISOString()
      };
      onAddEvent(newEvent);

      analytics.track("event_create", { entity_type: 'event',
        module: "events",
        entity_id: newEvent.id,
        metadata: {
          category: newEvent.category,
          location: newEvent.area || 'unknown'
        }
      });
    }

    setEditingEventId(null);
    setFormTitle('');
    setFormCategory('Community Meeting');
    setFormDescription('');
    setFormCoverImage('');
    setFormGalleryImages('');
    setFormOrganizer('');
    setFormContact('');
    setFormVenue('');
    setFormArea('Dhoke Hassu');
    setFormGoogleMap('');
    setFormDate('');
    setFormStartTime('');
    setFormEndTime('');
    setFormDeadline('');
    setFormMaxAttendees('100');
    setFormTicketPrice('Free');
    setFormStatus('Upcoming');

    setTimeout(() => {
      setPublishSuccess(false);
      onNavigateToList();
    }, 1200);
  };

  // Edit action
  const handleEditClick = (event: EventItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEventId(event.id);
    setFormTitle(event.title);
    setFormCategory(event.category);
    setFormDescription(event.description);
    setFormCoverImage(event.coverImage || '');
    setFormGalleryImages((event.galleryImages || []).join('\n'));
    setFormOrganizer(event.organizerName);
    setFormContact(event.contactNumber);
    setFormVenue(event.venue || '');
    setFormArea(event.area);
    setFormGoogleMap(event.googleMap || '');
    setFormDate(event.date);
    setFormStartTime(event.startTime);
    setFormEndTime(event.endTime);
    setFormDeadline(event.registrationDeadline || '');
    setFormMaxAttendees(event.maxAttendees ? String(event.maxAttendees) : '100');
    setFormTicketPrice(event.ticketPrice || 'Free');
    setFormStatus(event.status || 'Upcoming');
    
    onNavigateToCreate();
  };

  // Delete Action
  const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(isEn ? "Are you sure you want to delete this community event?" : "کیا آپ واقعی یہ تقریب حذف کرنا چاہتے ہیں؟")) {
      if (onUpdateEvents) {
        onUpdateEvents(events.filter(event => event.id !== id));
      }
      onNavigateToList();
    }
  };

  // Close Registration (Organizer feature)
  const handleCloseRegistration = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onUpdateEvents) {
      onUpdateEvents(events.map(event => {
        if (event.id === id) {
          return { ...event, status: 'Completed' };
        }
        return event;
      }));
      showToast(isEn ? "Registrations closed." : "رجسٹریشنز بند کر دی گئیں۔");
    }
  };

  // Admin Verification and Toggles
  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) return;
    if (onUpdateEvents) {
      onUpdateEvents(events.map(event => {
        if (event.id === id) {
          return { ...event, pinned: !event.pinned };
        }
        return event;
      }));
    }
  };

  const handleToggleFeature = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) return;
    if (onUpdateEvents) {
      onUpdateEvents(events.map(event => {
        if (event.id === id) {
          return { ...event, featured: !event.featured };
        }
        return event;
      }));
    }
  };

  // Bookmark toggler
  const handleToggleSave = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Ensure savedEventIds is an array before using includes
    if (Array.isArray(savedEventIds) && savedEventIds.includes(id)) {
      setSavedEventIds(savedEventIds.filter(savedId => savedId !== id));
    } else {
      // If savedEventIds is not an array, reset to a new array containing the id
      setSavedEventIds(Array.isArray(savedEventIds) ? [...savedEventIds, id] : [id]);
    }
  };

  // Copy share Link
  const handleCopyLink = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}/events/detail?eventId=${id}`;    
    try {
      await navigator.clipboard.writeText(url);
      showToast(isEn ? 'Link copied to clipboard!' : 'لنک کاپی ہو گیا!');
      
      analytics.track("event_share", { entity_type: 'event',
        module: "events",
        entity_id: id
      });
    } catch (err) {
       console.error("Failed to copy:", err);
    }
  };

  // Report Event
  const handleReportEvent = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (reportedIds.includes(id)) return;
    setReportedIds([...reportedIds, id]);
    showToast(isEn ? "Event reported for moderation." : "تقریب کی رپورٹ درج ہو گئی ہے۔");
  };

  // Filter logic
  const filteredEvents = events.filter(event => {
    // Admin override - hide reported items for regular users
    if (event.reported && !isAdmin) return false;

    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    const matchesArea = selectedArea === 'All' || event.area === selectedArea;

    // Free/Paid check
    const matchesPrice = ticketFilter === 'All' || 
      (ticketFilter === 'Free' && (event.ticketPrice === 'Free' || !event.ticketPrice)) ||
      (ticketFilter === 'Paid' && event.ticketPrice !== 'Free' && event.ticketPrice);

    // Status check
    const matchesStatus = statusFilter === 'All' || event.status === statusFilter;

    // Search query match
    const matchesSearch = event.title?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
                          event.description?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
                          event.organizerName?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
                          event.area?.toLowerCase().includes(searchQuery?.toLowerCase());

    return matchesCategory && matchesArea && matchesPrice && matchesStatus && matchesSearch;
  });

  // Sort logic
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    // Pinned events at top
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    if (sortBy === 'newest') {
      const timeA = new Date(a.created_at || 0).getTime() || 0;
      const timeB = new Date(b.created_at || 0).getTime() || 0;
      return timeB - timeA;
    }
    
    if (sortBy === 'popularity') {
      const popA = (a.attendees || []).length;
      const popB = (b.attendees || []).length;
      return popB - popA;
    }

    // Default Sort by Event Date
    const dateA = new Date(a.date).getTime() || 0;
    const dateB = new Date(b.date).getTime() || 0;
    return dateA - dateB;
  });

  const selectedEvent = events.find(e => e.id === selectedEventId);

  if (activeView === 'detail' && selectedEvent) {
    if (!viewedEvents.has(selectedEvent.id)) {
      viewedEvents.add(selectedEvent.id);
      analytics.track("event_view", { entity_type: 'event',
        module: "events",
        entity_id: selectedEvent.id
      });
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" id="events-module-root">
      
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 end-5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-lg z-50 text-xs font-bold animate-bounce">
          {toast}
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6" id="events-header">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isEn ? 'Community Events' : 'محلے کی تقریبات اور اجتماعات'}
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {isEn 
              ? 'Discover local gatherings, tournaments, religious sessions, and events in Dhoke Hassu.' 
              : 'کرکٹ ٹورنامنٹس، کمیونٹی اجلاسوں اور محلے کی دیگر تقریبات کے متعلق معلومات۔'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeView !== 'list' && (
            <button
              onClick={onNavigateToList}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? 'All Gatherings' : 'تقریبات دیکھیں'}</span>
            </button>
          )}

          {activeView !== 'create' && (
            <button
              onClick={() => {
                setEditingEventId(null);
                setFormTitle('');
                setFormCategory('Community Meeting');
                setFormDescription('');
                setFormCoverImage('');
                setFormGalleryImages('');
                setFormOrganizer(currentUser?.fullName || '');
                setFormContact(currentUser?.mobileNumber || '');
                setFormVenue('');
                setFormArea('Dhoke Hassu');
                setFormGoogleMap('');
                setFormDate('');
                setFormStartTime('');
                setFormEndTime('');
                setFormDeadline('');
                setFormMaxAttendees('100');
                setFormTicketPrice('Free');
                setFormStatus('Upcoming');
                onNavigateToCreate();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer font-bold"
              id="create-event-btn"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isEn ? 'Organize Event' : 'نئی تقریب ترتیب دیں'}</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW: MAIN EVENTS DIRECTORY FEED */}
      {activeView === 'list' && (
        <div className="space-y-6">
          
          {/* SEARCH AND FILTERS PANEL */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4" id="events-filter-box">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={isEn ? 'Search by title, organizer, keyword...' : 'تقریب تلاش کریں...'}
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

              {/* Sort selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 shrink-0 font-bold">{isEn ? 'Sort:' : 'ترتیب:'}</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'newest' | 'popularity')}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-emerald-500 text-slate-800 font-bold"
                >
                  <option value="date">{isEn ? 'Event Date' : 'تقریب کی تاریخ'}</option>
                  <option value="newest">{isEn ? 'Recently Added' : 'حالیہ لسٹنگز'}</option>
                  <option value="popularity">{isEn ? 'Attendees Count' : 'شراکت داروں کی تعداد'}</option>
                </select>
              </div>

            </div>

            {/* Quick toggles for tickets / status */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-50 text-xs font-bold text-slate-500">
              
              <div className="flex items-center gap-2">
                <span>{isEn ? 'Ticket Pricing:' : 'ٹکٹ:'}</span>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
                  {['All', 'Free', 'Paid'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTicketFilter(type as any)}
                      className={`px-3 py-1 text-[10px] font-black cursor-pointer font-bold ${
                        ticketFilter === type ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span>{isEn ? 'Status:' : 'حالت:'}</span>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
                  {['All', 'Upcoming', 'Live', 'Completed'].map(stat => (
                    <button
                      key={stat}
                      type="button"
                      onClick={() => setStatusFilter(stat as any)}
                      className={`px-3 py-1 text-[10px] font-black cursor-pointer font-bold ${
                        statusFilter === stat ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {stat}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin border-t border-slate-50 pt-3">
              {categories.map(cat => {
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

          {/* EVENTS LIST DISPLAY */}
          {sortedEvents.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
              <AlertOctagon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-extrabold text-slate-800">{isEn ? 'No Community Events Found' : 'کوئی تقریب نہیں ملی'}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isEn ? 'Adjust your categories, date filter, or search term and try again.' : 'کیٹیگری یا فلٹر تبدیل کر کے دوبارہ کوشش کریں۔'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="events-grid-cards">
              {sortedEvents.map(event => {
                const isSaved = savedEventIds.includes(event.id);
                const registered = isUserRegistered(event);
                const regCount = (event.attendees || []).length;
                const isMobile = window.innerWidth <= 768;
                const isFull = regCount >= (event.maxAttendees || 100);

                return (
                  <div
                    key={event.id}
                    onClick={() => onNavigateToDetail(event.id)}
                    className={`bg-white border rounded-3xl overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative ${
                      event.pinned 
                        ? 'border-emerald-500 ring-1 ring-emerald-50 bg-emerald-50/5' 
                        : 'border-slate-200'
                    }`}
                    id={`event-card-${event.id}`}
                  >
                    
                    {/* Header Image cover */}
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden shrink-0">
                      <img
                        src={event.coverImage}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Pinned & Featured Status Badges */}
                      <div className="absolute top-4 start-4 flex gap-1.5 z-10">
                        {event.pinned && (
                          <span className="bg-emerald-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase font-bold">
                            <Pin className="w-2.5 h-2.5 rotate-45" />
                            {isEn ? 'Pinned' : 'پن شدہ'}
                          </span>
                        )}
                        {event.featured && (
                          <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase font-bold">
                            <Sparkles className="w-2.5 h-2.5" />
                            {isEn ? 'Featured' : 'نمایاں'}
                          </span>
                        )}
                      </div>

                      {/* Ticket price overlay */}
                      <div className="absolute bottom-4 end-4 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1 rounded-xl">
                        {event.ticketPrice || 'Free'}
                      </div>
                    </div>

                    {/* Content Detail */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider font-bold">
                          <span>{event.category}</span>
                          <span className={`px-2 py-0.5 rounded-xl ${
                            event.status === 'Live' ? 'bg-red-50 text-red-650 animate-pulse' : 'bg-slate-50 text-slate-500'
                          }`}>
                            {event.status || 'Upcoming'}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2">
                          {event.title}
                        </h3>

                        <p className="text-slate-500 text-xs font-medium line-clamp-3 leading-relaxed">
                          {event.description}
                        </p>

                      </div>

                      {/* Date venue and seats stats */}
                      <div className="mt-4 pt-4 border-t border-slate-50 space-y-2.5">
                        
                        <div className="flex items-center justify-between text-xs font-bold text-slate-650 font-bold">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{event.date}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>{event.startTime} - {event.endTime}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 font-bold">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-450" />
                            <span className="truncate max-w-[120px]">{event.venue || event.area}</span>
                          </span>

                          <span className="flex items-center gap-1 text-slate-600">
                            <Users className="w-3.5 h-3.5 text-slate-450" />
                            <span>
                              {regCount} / {event.maxAttendees || 100} {isEn ? 'Attendees' : 'شرکاء'}
                            </span>
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* Bottom Actions footer */}
                    <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleToggleSave(event.id, e)}
                          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                            isSaved 
                              ? 'bg-emerald-50 border-blue-200 text-emerald-600' 
                              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                        </button>

                        <button
                          onClick={(e) => handleCopyLink(event.id, e)}
                          className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
                          title={isEn ? "Copy Link" : "لنک کاپی کریں"}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Attend / Register Button */}
                      <button
                        onClick={(e) => handleRegisterUser(event, e)}
                        disabled={isFull && !registered}
                        className={`px-4 py-2 rounded-2xl text-xs font-black shadow-xs transition-all cursor-pointer font-bold ${
                          registered
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : isFull 
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {registered ? (isEn ? 'Registered ✓' : 'رجسٹرڈ ✓') : isFull ? (isEn ? 'Full' : 'مکمل') : (isEn ? 'Register' : 'رجسٹر کریں')}
                      </button>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* VIEW: DETAILED EVENT VIEW */}
      {activeView === 'detail' && selectedEvent && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="events-detail-view">
          
          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm p-6 md:p-8 space-y-6">
              
              {/* Header Image Cover */}
              <div className="w-full flex justify-center bg-slate-50 border-b border-slate-100 rounded-t-3xl overflow-hidden relative">
                <div className="w-full max-w-[700px] relative">
                  <img
                    src={selectedEvent.coverImage}
                    alt={selectedEvent.title}
                    className="w-full max-h-[500px] object-contain block"
                  />
                  
                  <div className="absolute top-4 start-4 flex gap-1.5 z-10">
                  {selectedEvent.pinned && (
                    <span className="bg-emerald-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase font-bold">
                      {isEn ? 'Pinned' : 'پن شدہ'}
                    </span>
                  )}
                  {selectedEvent.featured && (
                    <span className="bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase font-bold">
                      {isEn ? 'Featured' : 'نمایاں'}
                    </span>
                  )}
                  </div>
                </div>
              </div>

              {/* Title category area */}
              <div className="border-b border-slate-50 pb-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-wider font-bold">
                  <span>{selectedEvent.category}</span>
                  <span className="bg-slate-50 border border-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {selectedEvent.status || 'Upcoming'}
                  </span>
                </div>
                
                <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                  {selectedEvent.title}
                </h1>
              </div>

              {/* Full Description guidelines */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider font-bold">
                  {isEn ? 'About Gathering' : 'تقریب کی تفصیلات'}
                </h4>
                <p className="text-slate-700 text-sm font-semibold leading-relaxed whitespace-pre-wrap">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Gallery Images */}
              {selectedEvent.galleryImages && selectedEvent.galleryImages.length > 0 && (
                <div className="space-y-3 border-t border-slate-50 pt-5">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider font-bold">
                    {isEn ? 'Event Gallery' : 'تقریب کی تصاویر'}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedEvent.galleryImages.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="relative group overflow-hidden rounded-2xl h-24 border border-slate-100">
                        <img
                          src={img}
                          alt="Gallery item"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendees list (Visible to Organizer / Admin, or all if allowed) */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h3 className="text-base font-black text-slate-900 font-bold">
                  {isEn ? `Registered Attendees (${(selectedEvent.attendees || []).length})` : `شرکاء کی فہرست (${(selectedEvent.attendees || []).length})`}
                </h3>

                {(selectedEvent.attendees || []).length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium">
                    {isEn ? 'No attendees registered yet.' : 'ابھی تک کوئی رجسٹریشن نہیں ہوئی۔'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(selectedEvent.attendees || []).map((att, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-800">{att.name}</span>
                          <span className="text-[9px] font-bold text-slate-450">{isEn ? 'Registered on:' : 'رجسٹرڈ تاریخ:'} {att.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Right Action panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider font-bold">
                  {isEn ? 'Event Cost' : 'ٹکٹ کی قیمت'}
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-wider font-bold">
                  {selectedEvent.ticketPrice || 'Free'}
                </span>
              </div>

              {/* Metadata attributes */}
              <div className="space-y-4 border-t border-b border-slate-50 py-5">
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <span className="text-[9px] font-black text-slate-450 uppercase block font-bold">{isEn ? 'Date' : 'تاریخ'}</span>
                    <span className="text-xs font-black text-slate-800">{selectedEvent.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div>
                    <span className="text-[9px] font-black text-slate-450 uppercase block font-bold">{isEn ? 'Time' : 'وقت'}</span>
                    <span className="text-xs font-black text-slate-800">{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                  </div>
                </div>

                {selectedEvent.registrationDeadline && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-red-400 animate-pulse" />
                    <div>
                      <span className="text-[9px] font-black text-slate-450 uppercase block font-bold">{isEn ? 'Deadline' : 'آخری تاریخ'}</span>
                      <span className="text-xs font-black text-slate-800">{selectedEvent.registrationDeadline}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <span className="text-[9px] font-black text-slate-450 uppercase block font-bold">{isEn ? 'Venue Address' : 'پتہ / جگہ'}</span>
                    <span className="text-xs font-black text-slate-800">{selectedEvent.venue || selectedEvent.area}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-slate-400" />
                  <div>
                    <span className="text-[9px] font-black text-slate-450 uppercase block font-bold">{isEn ? 'Capacity / Seats' : 'نشستیں'}</span>
                    <span className="text-xs font-black text-slate-800">
                      {selectedEvent.availableSeats !== undefined ? selectedEvent.availableSeats : (selectedEvent.maxAttendees || 100)} / {selectedEvent.maxAttendees || 100} {isEn ? 'Left' : 'باقی'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Direct Maps coords */}
              {selectedEvent.googleMap && (
                <a
                  href={selectedEvent.googleMap}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex flex-col items-center justify-center py-4 bg-slate-50 border border-slate-150 rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  <Map className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-black text-slate-700 mt-1">{isEn ? 'Open Map' : 'نقشہ کھولیں'}</span>
                </a>
              )}

              {/* Register / Cancel Direct actions */}
              <div className="space-y-2">
                <button
                  onClick={(e) => handleRegisterUser(selectedEvent, e)}
                  disabled={(selectedEvent.availableSeats !== undefined && selectedEvent.availableSeats <= 0) && !isUserRegistered(selectedEvent)}
                  className={`w-full py-3 rounded-2xl text-xs font-black shadow-xs transition-all cursor-pointer font-bold ${
                    isUserRegistered(selectedEvent)
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : (selectedEvent.availableSeats !== undefined && selectedEvent.availableSeats <= 0)
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isUserRegistered(selectedEvent) ? (isEn ? 'Cancel Registration' : 'رجسٹریشن منسوخ کریں') : (isEn ? 'Register Now' : 'ابھی رجسٹر کریں')}
                </button>

                <button
                  onClick={() => handleAddToCalendar(selectedEvent)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-black shadow-xs transition-all font-bold"
                >
                  <Download className="w-4 h-4" />
                  <span>{isEn ? 'Add to Calendar' : 'کیلنڈر میں شامل کریں'}</span>
                </button>
              </div>

              {/* Organizer details */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase block font-bold">{isEn ? 'Organizer' : 'منتظم'}</span>
                    <span className="text-xs font-black text-slate-800 font-bold">{selectedEvent.organizerName}</span>
                  </div>
                </div>

                <a
                  href={`tel:${selectedEvent.contactNumber}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-755 rounded-2xl text-xs font-black transition-all font-bold"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{selectedEvent.contactNumber}</span>
                </a>
              </div>

              {/* Organizer control options */}
              {(isOrganizerOfEvent(selectedEvent) || isAdmin) && (
                <div className="border-t border-slate-100 pt-5 space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase block font-bold">
                    {isEn ? 'Organizer Options' : 'انتظامی اختیارات'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleEditClick(selectedEvent, e)}
                      className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-blue-755 rounded-2xl text-xs font-extrabold transition-all cursor-pointer font-bold"
                    >
                      {isEn ? 'Edit Details' : 'ترمیم'}
                    </button>
                    <button
                      onClick={(e) => handleCloseRegistration(selectedEvent.id, e)}
                      className="flex-1 py-2 bg-emerald-50 hover:bg-amber-100 text-amber-805 rounded-2xl text-xs font-extrabold transition-all cursor-pointer font-bold"
                    >
                      {isEn ? 'Close Reg' : 'بند کریں'}
                    </button>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(selectedEvent.id, e)}
                    className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-755 rounded-2xl text-xs font-extrabold transition-all cursor-pointer font-bold"
                  >
                    {isEn ? 'Cancel / Delete Event' : 'تقریب منسوخ کریں'}
                  </button>
                </div>
              )}

              {/* Admin features */}
              {isAdmin && (
                <div className="border-t border-slate-100 pt-5 space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase block font-bold">
                    {isEn ? 'Admin Moderation' : 'ایڈمن اختیارات'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleTogglePin(selectedEvent.id, e)}
                      className={`flex-1 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer font-bold ${
                        selectedEvent.pinned ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {selectedEvent.pinned ? (isEn ? 'Unpin' : 'ان پن') : (isEn ? 'Pin to Top' : 'پن کریں')}
                    </button>
                    <button
                      onClick={(e) => handleToggleFeature(selectedEvent.id, e)}
                      className={`flex-1 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer font-bold ${
                        selectedEvent.featured ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {selectedEvent.featured ? (isEn ? 'Unfeature' : 'عام کریں') : (isEn ? 'Feature' : 'نمایاں کریں')}
                    </button>
                  </div>
                </div>
              )}

              {/* Report event button */}
              {!isAdmin && !isOrganizerOfEvent(selectedEvent) && (
                <div className="border-t border-slate-100 pt-4 text-center">
                  <button
                    onClick={(e) => handleReportEvent(selectedEvent.id, e)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Flag className="w-3 h-3" />
                    <span>{isEn ? 'Report inappropriate Event' : 'تقریب کی شکایت درج کریں'}</span>
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* VIEW: ORGANIZE / CREATE EVENT FORM */}
      {activeView === 'create' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn" id="events-create-view">
          
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
            
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-xl font-black text-slate-950 flex items-center gap-2">
                📢 {editingEventId ? (isEn ? 'Edit Event Details' : 'تقریب میں ترمیم کریں') : (isEn ? 'Organize New Community Event' : 'نئی تقریب رجسٹر کریں')}
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed font-bold">
                {isEn 
                  ? 'Plan and publish events for Dhoke Hassu residents. Ensure the venue is safe and clearly mapped.' 
                  : 'اہل محلہ کے لیے کھیلوں، سیمینارز یا دیگر تقریبات کی تشہیر کریں۔ معلومات درست ہونی چاہئیں۔'}
              </p>
            </div>

            {publishSuccess ? (
              <div className="py-12 text-center bg-emerald-50 rounded-2xl border border-emerald-100 space-y-3" id="event-publish-success">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
                <h3 className="text-lg font-black text-emerald-950 font-bold">
                  {isEn ? 'Event Published Successfully!' : 'تقریب کامیابی سے رجسٹر ہو گئی!'}
                </h3>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5" id="events-create-form">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Event Title */}
                  <div className="space-y-1.5 col-span-full">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Event Title' : 'تقریب کا عنوان'} *
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder={isEn ? 'e.g. Local Cricket Tournament 2026' : 'مثال کے طور پر: سالانہ کرکٹ ٹورنامنٹ 2026'}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 font-semibold ${
                        errors.title ? 'border-red-400 focus:border-red-500' : 'border-slate-200'
                      }`}
                      id="form-title"
                    />
                    {errors.title && <p className="text-[10px] text-red-500 font-bold">{errors.title}</p>}
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Event Category' : 'تقریب کی قسم'} *
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

                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Event Date' : 'تقریب کی تاریخ'} *
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold ${
                        errors.date ? 'border-red-400 focus:border-red-500' : 'border-slate-200'
                      }`}
                      id="form-date"
                    />
                    {errors.date && <p className="text-[10px] text-red-500 font-bold">{errors.date}</p>}
                  </div>

                  {/* Start Time */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Start Time' : 'شروع ہونے کا وقت'} *
                    </label>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                      id="form-start-time"
                    />
                  </div>

                  {/* End Time */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'End Time' : 'ختم ہونے کا وقت'} *
                    </label>
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                      id="form-end-time"
                    />
                  </div>

                  {/* Organizer Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Organizer / Group Name' : 'منتظم کا نام'} *
                    </label>
                    <input
                      type="text"
                      value={formOrganizer}
                      onChange={(e) => setFormOrganizer(e.target.value)}
                      placeholder="e.g. Youth Sports Association"
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 font-semibold ${
                        errors.organizer ? 'border-red-400 focus:border-red-500' : 'border-slate-200'
                      }`}
                      id="form-organizer"
                    />
                    {errors.organizer && <p className="text-[10px] text-red-500 font-bold">{errors.organizer}</p>}
                  </div>

                  {/* Contact Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Contact Number' : 'رابطہ نمبر'} *
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

                  {/* Venue */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Specific Venue / Ground' : 'تقریب کی مخصوص جگہ'}
                    </label>
                    <input
                      type="text"
                      value={formVenue}
                      onChange={(e) => setFormVenue(e.target.value)}
                      placeholder="e.g. Main Cricket Ground, Gali 2"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                      id="form-venue"
                    />
                  </div>

                  {/* Area */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Area / Neighborhood' : 'علاقہ'} *
                    </label>
                    <input
                      type="text"
                      value={formArea}
                      onChange={(e) => setFormArea(e.target.value)}
                      placeholder="e.g. Dhoke Hassu"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                      id="form-area"
                    />
                  </div>

                  {/* Maximum Participants */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Maximum Participants / Capacity' : 'شرکاء کی آخری حد'}
                    </label>
                    <input
                      type="number"
                      value={formMaxAttendees}
                      onChange={(e) => setFormMaxAttendees(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                      id="form-max"
                    />
                  </div>

                  {/* Ticket Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Ticket Price / Fees (e.g. Free or Rs. 100)' : 'ٹکٹ کی قیمت'}
                    </label>
                    <input
                      type="text"
                      value={formTicketPrice}
                      onChange={(e) => setFormTicketPrice(e.target.value)}
                      placeholder="Free"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                      id="form-price"
                    />
                  </div>

                  {/* Registration Deadline */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Registration Deadline (Optional)' : 'رجسٹریشن کی آخری تاریخ'}
                    </label>
                    <input
                      type="date"
                      value={formDeadline}
                      onChange={(e) => setFormDeadline(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                      id="form-deadline"
                    />
                  </div>

                  {/* Map link */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Google Map Link (Optional)' : 'گوگل میپ لنک (اختیاری)'}
                    </label>
                    <input
                      type="url"
                      value={formGoogleMap}
                      onChange={(e) => setFormGoogleMap(e.target.value)}
                      placeholder="https://maps.google.com/?q=..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                      id="form-map"
                    />
                  </div>

                  {/* Cover Image */}
                  <div className="space-y-1.5 col-span-full">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Cover Banner Image URL (Optional)' : 'کور تصویر کا لنک (اختیاری)'}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={formCoverImage}
                        onChange={(e) => setFormCoverImage(e.target.value)}
                        placeholder="https://example.com/cover.jpg"
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 font-semibold"
                        id="form-cover"
                      />
                      
                      {/* Gallery upload option */}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                        id="event-cover-upload-input"
                        disabled={uploadingCover}
                      />
                      <label
                        htmlFor="event-cover-upload-input"
                        className={`flex items-center justify-center gap-1.5 px-4 py-3 border border-dashed rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                          uploadingCover 
                            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                            : 'bg-emerald-50/50 border-blue-200 hover:bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        {uploadingCover 
                          ? (isEn ? 'Uploading...' : 'اپ لوڈ ہو رہا ہے...') 
                          : (isEn ? 'Upload from Gallery' : 'گیلری سے اپ لوڈ کریں')
                        }
                      </label>
                    </div>
                  </div>

                  {/* Gallery URLs */}
                  <div className="space-y-1.5 col-span-full">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Work Gallery Image URLs (One link per line)' : 'تقریب کے متعلق دیگر فوٹوز کے لنکس (ہر لائن پر ایک لنک)'}
                    </label>
                    <textarea
                      rows={3}
                      value={formGalleryImages}
                      onChange={(e) => setFormGalleryImages(e.target.value)}
                      placeholder="https://example.com/img1.jpg&#10;https://example.com/img2.jpg"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                      id="form-gallery"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Event Status' : 'حالت'}
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-bold"
                      id="form-status"
                    >
                      <option value="Upcoming">{isEn ? 'Upcoming' : 'آنے والی'}</option>
                      <option value="Live">{isEn ? 'Live Now' : 'جاری ہے'}</option>
                      <option value="Completed">{isEn ? 'Completed' : 'مکمل شدہ'}</option>
                      <option value="Cancelled">{isEn ? 'Cancelled' : 'منسوخ شدہ'}</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5 col-span-full">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Describe Gathering / Guidelines' : 'تقریب کے متعلق تفصیل اور ہدایات'} *
                    </label>
                    <textarea
                      rows={5}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder={isEn ? 'Provide full details, itinerary, registration information...' : 'تقریب کی تفصیل درج کریں...'}
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
                    id="submit-event-form"
                  >
                    {editingEventId ? (isEn ? 'Save Changes' : 'تبدیلیاں محفوظ کریں') : (isEn ? 'Publish Event' : 'شائع کریں')}
                  </button>

                  <button
                    type="button"
                    onClick={onNavigateToList}
                    className="px-6 py-3 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer font-bold"
                    id="cancel-event-form"
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

