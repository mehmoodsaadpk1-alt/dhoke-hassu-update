/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  MapPin, 
  Clock, 
  User as UserIcon, 
  Share2, 
  ThumbsUp, 
  Flag, 
  ArrowLeft, 
  PlusCircle, 
  CheckCircle,
  AlertOctagon,
  Droplet,
  Zap,
  Shield,
  Milestone,
  HelpCircle,
  Bookmark,
  Phone,
  CloudSun,
  Activity,
  History,
  Info,
  Loader2,
  Calendar,
  Pin,
  Trash2,
  Edit3,
  Archive,
  AlertCircle,
  Map,
  Volume2,
  VolumeX,
  Bell,
  Eye,
  Paperclip,
  Check
} from 'lucide-react';
import { AlertItem, Language, User, AdItem } from '../types';
import { dbGetActiveAds, dbUploadServiceImage } from '../utils/supabaseClient';
import AdBannerCard from './AdBannerCard';
import { useAdRotator } from '../hooks/useAdRotator';
import { getCurrentUserLocation } from '../utils/locationService';

export function isUserAdminOrModerator(user?: User): boolean {
  if (!user) return false;
  const email = user.email?.toLowerCase() || '';
  const role = (user as any).role?.toLowerCase() || '';
  const fullName = user.fullName?.toLowerCase() || '';
  return email.includes('admin') || email.includes('moderator') || role.includes('admin') || role.includes('moderator') || fullName.includes('admin') || fullName.includes('moderator') || sessionStorage.getItem('admin_authenticated') === 'true';
}

// Web Audio API double chime synthesizer for Critical and High priority alerts
export function playAlertSound(priority: string) {
  if (priority === 'Low' || priority === 'Normal' || priority === 'Medium') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Play double beep
    const time = ctx.currentTime;
    
    const playBeep = (startDelay: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time + startDelay);
      
      gain.gain.setValueAtTime(0.2, time + startDelay);
      gain.gain.exponentialRampToValueAtTime(0.01, time + startDelay + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time + startDelay);
      osc.stop(time + startDelay + 0.25);
    };

    const baseFreq = priority === 'Critical' ? 880 : 660; // Higher frequency for critical
    playBeep(0, baseFreq);
    playBeep(0.15, baseFreq);
  } catch (e) {
    console.warn("Failed to play synthesized alert sound:", e);
  }
}

// Request Browser Notifications
export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

// Trigger Browser Notification
export function triggerBrowserNotification(title: string, message: string, onClick?: () => void) {
  if ("Notification" in window && Notification.permission === "granted") {
    const notif = new Notification(title, {
      body: message,
      icon: 'https://images.unsplash.com/photo-1516156008625-3a9d6067ffd5?auto=format&fit=crop&q=80&w=150'
    });
    if (onClick) {
      notif.onclick = () => {
        window.focus();
        onClick();
      };
    }
  }
}

// Check Quiet Hours / Do Not Disturb
export interface QuietHoursSettings {
  dndEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
}

export function isCurrentlyInQuietHours(settings?: QuietHoursSettings): boolean {
  if (!settings || !settings.dndEnabled) return false;
  
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeVal = currentHour * 60 + currentMin;

    const [startHour, startMin] = settings.quietHoursStart?.split(':').map(Number);
    const [endHour, endMin] = settings.quietHoursEnd?.split(':').map(Number);
    const startTimeVal = startHour * 60 + startMin;
    const endTimeVal = endHour * 60 + endMin;

    if (startTimeVal < endTimeVal) {
      // Quiet hours start and end in the same day (e.g. 13:00 to 17:00)
      return currentTimeVal >= startTimeVal && currentTimeVal <= endTimeVal;
    } else {
      // Quiet hours span midnight (e.g. 22:00 to 07:00)
      return currentTimeVal >= startTimeVal || currentTimeVal <= endTimeVal;
    }
  } catch {
    return false;
  }
}

interface AlertsModuleProps {
  items: AlertItem[];
  onAddAlert: (newAlert: AlertItem) => void;
  onUpdateAlerts?: (updated: AlertItem[]) => void;
  currentLanguage: Language;
  onNavigateToCreate: () => void;
  onNavigateToList: () => void;
  onNavigateToHistory: () => void;
  onNavigateToDetail: (itemId: string) => void;
  selectedItemId: string | null;
  activeView: 'list' | 'detail' | 'create' | 'history';
  currentUser?: User;
}

// Convert absolute/relative time into relative Urdu/English times
function getRelativeTime(timestampStr: string, isEn: boolean): string {
  if (!timestampStr) return isEn ? 'Just now' : 'ابھی ابھی';
  
  if (timestampStr === 'Just now' || timestampStr === 'ابھی ابھی') return timestampStr;
  if (timestampStr.includes('ago') || timestampStr.includes('پہلے')) return timestampStr;
  if (timestampStr.includes('mins') || timestampStr.includes('hours') || timestampStr.includes('day')) return timestampStr;
  
  try {
    const date = new Date(timestampStr);
    if (isNaN(date.getTime())) return timestampStr;
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return isEn ? 'Just now' : 'ابھی ابھی';
    if (diffMin < 60) return isEn ? `${diffMin}m ago` : `${diffMin} منٹ پہلے`;
    if (diffHour < 24) return isEn ? `${diffHour}h ago` : `${diffHour} گھنٹے پہلے`;
    if (diffDay === 1) return isEn ? 'Yesterday' : 'کل';
    return isEn ? `${diffDay}d ago` : `${diffDay} دن پہلے`;
  } catch (e) {
    return timestampStr;
  }
}
export default function AlertsModule({
  items,
  onAddAlert,
  onUpdateAlerts,
  currentLanguage,
  onNavigateToCreate,
  onNavigateToList,
  onNavigateToHistory,
  onNavigateToDetail,
  selectedItemId,
  activeView,
  currentUser
}: AlertsModuleProps) {
const alertsBannerMap = useAdRotator('Local Alerts', 1, 1, 'Banner');
  const alertsAdMap = useAdRotator('Local Alerts', 200, 5, 'Feed');
  const isEn = currentLanguage === 'en';

  // Legacy ad load removed – ads are handled via useAdRotator hook

  const isAdmin = isUserAdminOrModerator(currentUser);
  const isModerator = isAdmin || (currentUser?.fullName?.toLowerCase().includes('moderator') || currentUser?.email?.toLowerCase().includes('moderator'));

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');
  const [loading, setLoading] = useState(false);

  // Sound & Notification Settings (Saved to Local Storage)
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('alerts_sound_enabled') !== 'false');
  const [browserNotifEnabled, setBrowserNotifEnabled] = useState(() => localStorage.getItem('alerts_browser_enabled') !== 'false');
  const [badgesEnabled, setBadgesEnabled] = useState(() => localStorage.getItem('alerts_badges_enabled') !== 'false');
  const [criticalFilterEnabled, setCriticalFilterEnabled] = useState(() => localStorage.getItem('alerts_critical_enabled') !== 'false');
  const [highFilterEnabled, setHighFilterEnabled] = useState(() => localStorage.getItem('alerts_high_enabled') !== 'false');
  const [dndEnabled, setDndEnabled] = useState(() => localStorage.getItem('alerts_dnd_enabled') === 'true');
  const [quietStart, setQuietStart] = useState(() => localStorage.getItem('alerts_quiet_start') || '22:00');
  const [quietEnd, setQuietEnd] = useState(() => localStorage.getItem('alerts_quiet_end') || '07:00');

  useEffect(() => {
    localStorage.setItem('alerts_sound_enabled', String(soundEnabled));
    localStorage.setItem('alerts_browser_enabled', String(browserNotifEnabled));
    localStorage.setItem('alerts_badges_enabled', String(badgesEnabled));
    localStorage.setItem('alerts_critical_enabled', String(criticalFilterEnabled));
    localStorage.setItem('alerts_high_enabled', String(highFilterEnabled));
    localStorage.setItem('alerts_dnd_enabled', String(dndEnabled));
    localStorage.setItem('alerts_quiet_start', quietStart);
    localStorage.setItem('alerts_quiet_end', quietEnd);
  }, [soundEnabled, browserNotifEnabled, badgesEnabled, criticalFilterEnabled, highFilterEnabled, dndEnabled, quietStart, quietEnd]);

  // Request browser permission if toggled on
  useEffect(() => {
    if (browserNotifEnabled) {
      requestNotificationPermission();
    }
  }, [browserNotifEnabled]);

  // Saved / Bookmarks
  const [savedAlertIds, setSavedAlertIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dhoke_connect_saved_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('dhoke_connect_saved_alerts', JSON.stringify(savedAlertIds));
  }, [savedAlertIds]);

  const [reportedAlertIds, setReportedAlertIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dhoke_connect_reported_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('dhoke_connect_reported_alerts', JSON.stringify(reportedAlertIds));
  }, [reportedAlertIds]);

  const [confirmedIds, setConfirmedIds] = useState<Record<string, boolean>>({});

  // Form States
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Emergency');
  const [formArea, setFormArea] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<string>('Normal');
  const [formImage, setFormImage] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formExpiryTime, setFormExpiryTime] = useState('');
  const [formLatitude, setFormLatitude] = useState('');
  const [formLongitude, setFormLongitude] = useState('');
  const [formAttachments, setFormAttachments] = useState('');
  const [formVisibility, setFormVisibility] = useState<'Public' | 'Neighbors'>('Public');
  const [formStatus, setFormStatus] = useState<'Active' | 'Expired' | 'Archived'>('Active');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await dbUploadServiceImage(file);
      if (url) {
        setFormImage(url);
      } else {
        setFormImage(URL.createObjectURL(file));
      }
    } catch (err) {
      console.error("Upload error in AlertsModule:", err);
      setFormImage(URL.createObjectURL(file));
    } finally {
      setIsUploading(false);
    }
  };

  // Toast / Copy status
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Simulating live filter load
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedPriority, searchQuery, sortBy]);

  const categories = [
    'All',
    'Emergency',
    'Security',
    'Crime',
    'Missing Person',
    'Fire',
    'Ambulance',
    'Police',
    'Gas Leak',
    'Electricity',
    'Water Supply',
    'Road Accident',
    'Traffic',
    'Weather',
    'Community Notice',
    'Utility',
    'Other'
  ];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Emergency': return <AlertTriangle className="w-4 h-4 text-red-650 animate-pulse" />;
      case 'Security': 
      case 'Crime': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'Missing Person': return <Activity className="w-4 h-4 text-purple-600" />;
      case 'Traffic': 
      case 'Road Accident': return <Milestone className="w-4 h-4 text-slate-500" />;
      case 'Electricity':
      case 'Utility': return <Zap className="w-4 h-4 text-amber-500" />;
      case 'Community Notice': return <Info className="w-4 h-4 text-emerald-650" />;
      case 'Weather': return <CloudSun className="w-4 h-4 text-orange-500" />;
      default: return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getPriorityStyles = (priority: string | undefined) => {
    switch (priority) {
      case 'Critical':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          badge: 'bg-red-600 text-white',
          dot: 'bg-red-500 animate-ping',
          text: isEn ? 'Critical' : 'انتہائی اہم'
        };
      case 'High':
        return {
          bg: 'bg-orange-50 text-orange-850 border-orange-200',
          badge: 'bg-orange-500 text-white',
          dot: 'bg-orange-500',
          text: isEn ? 'High' : 'شدید'
        };
      case 'Medium':
        return {
          bg: 'bg-amber-50 text-amber-850 border-amber-200',
          badge: 'bg-amber-500 text-white',
          dot: 'bg-amber-500',
          text: isEn ? 'Medium' : 'درمیانہ'
        };
      case 'Low':
      default:
        return {
          bg: 'bg-slate-50 text-slate-650 border-slate-200',
          badge: 'bg-slate-500 text-white',
          dot: 'bg-slate-400',
          text: isEn ? 'Low' : 'معمولی'
        };
    }
  };

  // Helper expired check
  const isAlertExpired = (item: AlertItem) => {
    if (item.status === 'Expired' || item.status === 'Archived') return true;
    if (item.expiryTime) {
      try {
        const expiry = new Date(item.expiryTime);
        if (!isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
          return true;
        }
      } catch {
        return false;
      }
    }
    return false;
  };

  // Filter items
  const userLoc = getCurrentUserLocation();
  const activeAlerts = items.filter(item => {
    const isExpired = isAlertExpired(item);
    
    // Hide expired/archived from active list
    if (activeView === 'list' && isExpired) return false;
    // Show only expired in archive history
    if (activeView === 'history' && !isExpired) return false;

    // Check status moderation
    const adminCheck = isUserAdminOrModerator(currentUser);
    const isOwner = currentUser && (item.postedBy === currentUser.fullName);
    if (!adminCheck && !isOwner && item.status === 'Pending') return false;
    if (!adminCheck && !isOwner && item.status === 'Rejected') return false;

    // Location check
    const matchesLocation = !item.area || 
                            item.area?.toLowerCase().includes(userLoc?.toLowerCase()) || 
                            userLoc?.toLowerCase().includes(item.area?.toLowerCase()) ||
                            userLoc?.toLowerCase() === 'dhoke hassu' ||
                            isOwner ||
                            adminCheck;
    if (!matchesLocation) return false;

    // Filters check
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesPriority = selectedPriority === 'All' || item.priority === selectedPriority;
    
    const matchesSearch = (item.title || '')?.toLowerCase().includes(searchQuery?.toLowerCase()) || 
                          (item.description || '')?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
                          (item.area || '')?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
                          (item.category || '')?.toLowerCase().includes(searchQuery?.toLowerCase());
    return matchesCategory && matchesPriority && matchesSearch;
  });

  // Critical Alerts Badge count
  const criticalCount = items.filter(item => !isAlertExpired(item) && item.priority === 'Critical').length;

  // Sorting
  const sortedAlerts = [...activeAlerts].sort((a, b) => {
    // Pinned Critical alerts always at the top of the feed
    const aIsCritical = a.priority === 'Critical';
    const bIsCritical = b.priority === 'Critical';
    if (aIsCritical && !bIsCritical) return -1;
    if (!aIsCritical && bIsCritical) return 1;

    if (sortBy === 'priority') {
      const w: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Normal: 1, Low: 1 };
      return (w[b.priority || 'Normal'] || 1) - (w[a.priority || 'Normal'] || 1);
    }
    
    const timeA = new Date(a.postedTime || a.created_at || 0).getTime() || 0;
    const timeB = new Date(b.postedTime || b.created_at || 0).getTime() || 0;
    
    if (sortBy === 'oldest') return timeA - timeB;
    return timeB - timeA; // Default newest
  });

  // Handle verify upvote
  const handleConfirm = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirmedIds[id]) return;
    setConfirmedIds({ ...confirmedIds, [id]: true });

    if (onUpdateAlerts) {
      onUpdateAlerts(items.map(alert => {
        if (alert.id === id) {
          return { ...alert, confirmationsCount: alert.confirmationsCount + 1 };
        }
        return alert;
      }));
    }
  };

  // Toggle bookmark/save
  const handleToggleSave = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (savedAlertIds.includes(id)) {
      setSavedAlertIds(savedAlertIds.filter(savedId => savedId !== id));
    } else {
      setSavedAlertIds([...savedAlertIds, id]);
    }
  };

  // Delete Alert (Admin Only)
  const handleDeleteAlert = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) return;
    if (confirm(isEn ? "Are you sure you want to permanently delete this alert?" : "کیا آپ یہ الرٹ حذف کرنا چاہتے ہیں؟")) {
      if (onUpdateAlerts) {
        onUpdateAlerts(items.filter(a => a.id !== id));
      }
      onNavigateToList();
    }
  };

  // Toggle status to Expired / Archive (Admin / Moderator)
  const handleToggleArchive = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isModerator) return;
    if (onUpdateAlerts) {
      onUpdateAlerts(items.map(alert => {
        if (alert.id === id) {
          const nextStatus = alert.status === 'Archived' ? 'Active' : 'Archived';
          return { ...alert, status: nextStatus };
        }
        return alert;
      }));
    }
  };

  // Approve pending alert (Admin/Moderator)
  const handleApproveAlert = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin && !isModerator) return;
    if (onUpdateAlerts) {
      onUpdateAlerts(items.map(alert => {
        if (alert.id === id && alert.status === 'Pending') {
          return { ...alert, status: 'Active' };
        }
        return alert;
      }));
    }
  };

  // Reject pending alert (Admin/Moderator)
  const handleRejectAlert = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin && !isModerator) return;
    if (onUpdateAlerts) {
      onUpdateAlerts(items.map(alert => {
        if (alert.id === id && alert.status === 'Pending') {
          return { ...alert, status: 'Rejected' };
        }
        return alert;
      }));
    }
  };

  // Submit form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formTitle?.trim()) newErrors.title = isEn ? 'Alert title is required' : 'الرٹ کا عنوان ضروری ہے';
    if (!formArea?.trim()) newErrors.area = isEn ? 'Location/Area is required' : 'متاثرہ علاقہ ضروری ہے';
    if (!formDescription?.trim()) newErrors.description = isEn ? 'Guidelines description is required' : 'تفصیل ضروری ہے';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setPublishSuccess(true);

    const attachmentsList = formAttachments?.split('\n').map(url => url?.trim()).filter(Boolean);

    if (editingAlertId) {
      // Update mode
      if (onUpdateAlerts) {
        onUpdateAlerts(items.map((alert): AlertItem => {
          if (alert.id === editingAlertId) {
            return {
              ...alert,
              title: formTitle,
              category: formCategory,
              description: formDescription,
              area: formArea,
              priority: formPriority,
              image: formImage?.trim() || undefined,
              contact: formContact?.trim() || undefined,
              expiryTime: formExpiryTime?.trim() || undefined,
              latitude: formLatitude ? parseFloat(formLatitude) : undefined,
              longitude: formLongitude ? parseFloat(formLongitude) : undefined,
              attachments: attachmentsList,
              visibility: formVisibility,
              status: formStatus,
              updatedTime: new Date().toISOString()
            };
          }
          return alert;
        }));
      }
    } else {
      // Create mode
      const newAlert: AlertItem = {
        id: `alert-${Date.now()}`,
        title: formTitle,
        category: formCategory,
        description: formDescription,
        area: formArea,
        postedTime: new Date().toISOString(),
        severity: formPriority === 'Critical' ? 'Urgent' : formPriority === 'High' ? 'Medium' : 'Information',
        priority: formPriority,
        confirmationsCount: 1,
        postedBy: currentUser?.fullName || (isEn ? 'Dhoke Resident' : 'تصدیق شدہ رہائشی'),
        image: formImage?.trim() || undefined,
        contact: formContact?.trim() || undefined,
        expiryTime: formExpiryTime?.trim() || undefined,
        latitude: formLatitude ? parseFloat(formLatitude) : undefined,
        longitude: formLongitude ? parseFloat(formLongitude) : undefined,
        attachments: attachmentsList,
        visibility: formVisibility,
        status: 'Active',
        relatedUpdates: [isEn ? 'Alert published.' : 'الرٹ جاری کیا گیا۔'],
        reported: false
      };
      
      onAddAlert(newAlert);

      // Play Sound if enabled and not DND
      const isDnd = isCurrentlyInQuietHours({ dndEnabled, quietHoursStart: quietStart, quietHoursEnd: quietEnd });
      if (soundEnabled && !isDnd) {
        playAlertSound(formPriority);
      }
      
      // Show browser notification if enabled
      if (browserNotifEnabled && Notification.permission === 'granted') {
        triggerBrowserNotification(formTitle, formDescription, () => {
          onNavigateToDetail(newAlert.id);
        });
      }
    }

    // Reset Form
    setEditingAlertId(null);
    setFormTitle('');
    setFormCategory('Emergency');
    setFormArea('');
    setFormDescription('');
    setFormPriority('Normal');
    setFormImage('');
    setFormContact('');
    setFormExpiryTime('');
    setFormLatitude('');
    setFormLongitude('');
    setFormAttachments('');
    setFormVisibility('Public');
    setFormStatus('Active');

    setTimeout(() => {
      setPublishSuccess(false);
      onNavigateToList();
    }, 1200);
  };

  // Open edit mode
  const handleEditAlert = (item: AlertItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isModerator) return;

    setEditingAlertId(item.id);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormArea(item.area);
    setFormDescription(item.description);
    setFormPriority(item.priority || 'Normal');
    setFormImage(item.image || '');
    setFormContact(item.contact || '');
    setFormExpiryTime(item.expiryTime || '');
    setFormLatitude(item.latitude ? String(item.latitude) : '');
    setFormLongitude(item.longitude ? String(item.longitude) : '');
    setFormAttachments((item.attachments || []).join('\n'));
    setFormVisibility(item.visibility || 'Public');
    setFormStatus(item.status || 'Active');

    onNavigateToCreate();
  };

  // Copy details link
  const handleCopyLink = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = `${window.location.origin}/alerts/detail?alertId=${id}`;
    navigator.clipboard.writeText(link);
    showToast(isEn ? "Link copied to clipboard!" : "لنک کاپی ہو گیا!");
  };

  // Report Invalid Alert
  const handleReportAlert = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (reportedAlertIds.includes(id)) return;
    setReportedAlertIds([...reportedAlertIds, id]);
    showToast(isEn ? "Alert reported for review." : "الرٹ کی شکایت درج ہو گئی ہے۔");
  };

  const selectedItem = items.find(i => i.id === selectedItemId);


  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" id="alerts-module-root">
      {/* Top Banner Ad Segment */}
      {alertsBannerMap[0] && (
        <div className="mb-6">
          <AdBannerCard ad={alertsBannerMap[0]} />
        </div>
      )}

      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 end-5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg z-50 text-xs font-bold animate-bounce">
          {toast}
        </div>
      )}

      {/* HEADER BLOCK */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6" id="alerts-header">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {isEn ? 'Emergency & Alerts' : 'ہنگامی حالات اور الرٹس'}
            </h1>
            {badgesEnabled && criticalCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse shadow-md">
                {criticalCount} {isEn ? 'Critical' : 'اہم'}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {isEn 
              ? 'Stay updated with critical neighborhood alerts, security issues, and utility notices in Dhoke Hassu.' 
              : 'ڈھوک حسو میں سیکیورٹی، پانی، بجلی کی بندش اور ہنگامی صورتحال کے متعلق لائیو اپ ڈیٹس۔'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeView !== 'list' && (
            <button
              onClick={onNavigateToList}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? 'View Active Alerts' : 'سرگرم الرٹس دیکھیں'}</span>
            </button>
          )}

          {activeView !== 'history' && (
            <button
              onClick={onNavigateToHistory}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer font-bold"
            >
              <Archive className="w-4 h-4 text-slate-450" />
              <span>{isEn ? 'History / Expired' : 'تاریخچہ / آرکائیو'}</span>
            </button>
          )}

          {activeView !== 'create' && (
            <button
              onClick={() => {
                setEditingAlertId(null);
                setFormTitle('');
                setFormCategory('Emergency');
                setFormArea('');
                setFormDescription('');
                setFormPriority('Normal');
                setFormImage('');
                setFormContact('');
                setFormExpiryTime('');
                setFormLatitude('');
                setFormLongitude('');
                setFormAttachments('');
                setFormVisibility('Public');
                setFormStatus('Active');
                onNavigateToCreate();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer font-bold"
              id="create-alert-btn"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isEn ? 'Post Emergency Alert' : 'نیا الرٹ جاری کریں'}</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW: MAIN LIST VIEW */}
      {activeView === 'list' && (
        <div className="space-y-6">
          
          {/* USER SOUNDS, DND & BROWSER PREFERENCES SETTINGS PANEL */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
            
            {/* Sound Toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl transition-all ${soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800">{isEn ? 'Alert Sounds' : 'الرٹ کی آوازیں'}</span>
                <span className="text-[9px] font-bold text-slate-450">{soundEnabled ? (isEn ? 'On' : 'آن') : (isEn ? 'Off' : 'آف')}</span>
              </div>
            </label>

            {/* Browser Notifications Toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <button
                onClick={() => setBrowserNotifEnabled(!browserNotifEnabled)}
                className={`p-2 rounded-xl transition-all ${browserNotifEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}
              >
                <Bell className="w-4 h-4" />
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800">{isEn ? 'Browser Notif' : 'براؤزر اطلاعات'}</span>
                <span className="text-[9px] font-bold text-slate-450">{browserNotifEnabled ? (isEn ? 'On' : 'آن') : (isEn ? 'Off' : 'آف')}</span>
              </div>
            </label>

            {/* Do Not Disturb Toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <button
                onClick={() => setDndEnabled(!dndEnabled)}
                className={`p-2 rounded-xl transition-all ${dndEnabled ? 'bg-purple-100 text-purple-650' : 'bg-slate-200 text-slate-400'}`}
              >
                <Clock className="w-4 h-4" />
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800">{isEn ? 'Quiet Hours (DND)' : 'پرسکون اوقات'}</span>
                <span className="text-[9px] font-bold text-slate-450">{dndEnabled ? `${quietStart} - ${quietEnd}` : (isEn ? 'Disabled' : 'بند')}</span>
              </div>
            </label>

            {/* DND Hours config */}
            {dndEnabled && (
              <div className="flex items-center gap-1">
                <input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="px-2 py-1 border rounded bg-white text-xs text-slate-800 font-bold"
                />
                <span className="text-xs text-slate-400 font-bold">to</span>
                <input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="px-2 py-1 border rounded bg-white text-xs text-slate-800 font-bold"
                />
              </div>
            )}

          </div>

          {/* SEARCH, SORT AND FILTERS BAR */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4" id="alerts-filter-bar">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={isEn ? 'Search by keyword, details, area...' : 'الرٹ تلاش کریں...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-10 pe-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-semibold"
                />
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 shrink-0 font-bold">{isEn ? 'Priority:' : 'اہمیت:'}</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 font-bold"
                >
                  <option value="All">{isEn ? 'All Priorities' : 'تمام الرٹس'}</option>
                  <option value="Low">{isEn ? 'Low' : 'معمولی'}</option>
                  <option value="Medium">{isEn ? 'Medium' : 'درمیانی'}</option>
                  <option value="High">{isEn ? 'High' : 'شدید'}</option>
                  <option value="Critical">{isEn ? 'Critical' : 'انتہائی اہم'}</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 shrink-0 font-bold">{isEn ? 'Sort:' : 'ترتیب:'}</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'priority')}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 font-bold"
                >
                  <option value="newest">{isEn ? 'Newest First' : 'جدید ترین پہلے'}</option>
                  <option value="oldest">{isEn ? 'Oldest First' : 'پرانے الرٹس پہلے'}</option>
                  <option value="priority">{isEn ? 'Highest Priority' : 'اہمیت کے مطابق'}</option>
                </select>
              </div>
            </div>

            {/* Categories pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin border-t border-slate-50 pt-3">
              {categories.map(cat => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border cursor-pointer font-bold ${
                      isActive 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isEn ? cat : cat}
                  </button>
                );
              })}
            </div>

          </div>

          {/* CRITICAL BANNER (Dismissable sticky widget) */}
          {criticalCount > 0 && selectedCategory === 'All' && !searchQuery && (
            <div className="bg-red-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-red-200 animate-pulse relative overflow-hidden" id="critical-banner">
              <div className="absolute top-0 end-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-x-10 -translate-y-10" />
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider">{isEn ? `${criticalCount} Pinned Critical Emergencies` : `${criticalCount} اہم الرٹس پن شدہ ہیں`}</h4>
                  <p className="text-xs font-bold text-red-50 mt-0.5">{isEn ? 'Please follow direct emergency instructions listed below.' : 'برائے مہربانی نیچے درج کردہ ہدایات پر عمل کریں۔'}</p>
                </div>
              </div>
            </div>
          )}

          {/* ALERTS DISPLAY */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white border border-slate-250 rounded-2xl" id="alerts-loading">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">{isEn ? 'Syncing active alerts...' : 'تازہ الرٹس آ رہے ہیں...'}</p>
            </div>
          ) : sortedAlerts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
              <AlertOctagon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-extrabold text-slate-800">{isEn ? 'No Alerts Found' : 'کوئی الرٹس نہیں ملے'}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isEn ? 'All quiet in Dhoke Hassu Connect. Adjust filters to check old alerts.' : 'ڈھوک حسو میں سب خیریت ہے۔ آرکائیو چیک کرنے کے لیے فلٹرز تبدیل کریں۔'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="alerts-grid">
              {(() => {
                const elements = [];
                let renderCount = 0;
                for (let i = 0; i < sortedAlerts.length; i++) {
                  const item = sortedAlerts[i];
                  const isCritical = item.priority === 'Critical';
                  const isSaved = savedAlertIds.includes(item.id);
                  const isReported = reportedAlertIds.includes(item.id);
                  const sev = getPriorityStyles(item.priority);
                  const ad = alertsAdMap[i];

                  if (isReported && !isAdmin) continue;
                  renderCount++;

                  elements.push(
                    <div
                      key={item.id}
                      onClick={() => onNavigateToDetail(item.id)}
                      className={`bg-white border rounded-3xl p-5 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative ${
                        isCritical 
                          ? 'border-red-500 shadow-sm shadow-red-50 ring-1 ring-red-100 bg-red-50/5' 
                          : 'border-slate-150'
                      }`}
                    >
                      <div>
                        {/* Priority header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border font-bold ${sev.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                              {sev.text}
                            </span>
                            
                            {isCritical && (
                              <span className="flex items-center gap-1 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                <Pin className="w-2.5 h-2.5 rotate-45" />
                                {isEn ? 'Pinned' : 'پن شدہ'}
                              </span>
                            )}

                            {item.visibility === 'Neighbors' && (
                              <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 font-bold">
                                <Eye className="w-2.5 h-2.5" />
                                {isEn ? 'Neighbors' : 'محلہ'}
                              </span>
                            )}
                          </div>

                          {/* Category label */}
                          <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-bold">
                            {getCategoryIcon(item.category)}
                            <span>{item.category}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="mt-3.5 space-y-1.5">
                          <h3 className="text-base font-black text-slate-900 leading-snug">
                            {item.title}
                          </h3>
                          <p className="text-slate-600 text-xs font-semibold line-clamp-3 leading-relaxed">
                            {item.description}
                          </p>
                          {item.image && (
                            <div className="mt-3 w-full h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                              <img src={item.image} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                            </div>
                          )}
                        </div>

                        {/* Location & Time info */}
                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-slate-500 border-t border-slate-50 pt-3 font-bold">
                          <span className="flex items-center gap-1 shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.area}</span>
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{getRelativeTime(item.postedTime || item.created_at || '', isEn)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
                        <div className="flex items-center gap-1.5">
                          {/* Verify Confirm vote */}
                          <button
                            onClick={(e) => handleConfirm(item.id, e)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer font-bold ${
                              confirmedIds[item.id]
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{item.confirmationsCount + (confirmedIds[item.id] ? 1 : 0)}</span>
                          </button>

                          {/* Save Button */}
                          <button
                            onClick={(e) => handleToggleSave(item.id, e)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isSaved 
                                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5 fill-current" />
                          </button>

                          {/* Copy Link Button */}
                          <button
                            onClick={(e) => handleCopyLink(item.id, e)}
                            className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title={isEn ? "Copy Link" : "لنک کاپی کریں"}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Admin / Moderator actions */}
                        <div className="flex items-center gap-1">
                          {isModerator && (
                            <>
                              <button
                                onClick={(e) => handleEditAlert(item, e)}
                                className="p-1.5 text-slate-450 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title={isEn ? "Edit" : "ترمیم"}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleToggleArchive(item.id, e)}
                                className="p-1.5 text-slate-450 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                                title={item.status === 'Archived' ? (isEn ? "Activate" : "چالو کریں") : (isEn ? "Archive" : "آرکائیو")}
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                              {item.status === 'Pending' && (
                                <>
                                  <button
                                    onClick={(e) => handleApproveAlert(item.id, e)}
                                    className="p-1.5 text-slate-450 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                                    title={isEn ? "Approve" : "منظور کریں"}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => handleRejectAlert(item.id, e)}
                                    className="p-1.5 text-slate-450 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title={isEn ? "Reject" : "رد کریں"}
                                  >
                                    <AlertOctagon className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                          {isAdmin && (
                            <button
                              onClick={(e) => handleDeleteAlert(item.id, e)}
                              className="p-1.5 text-slate-450 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title={isEn ? "Delete" : "حذف"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          {/* Users can report listing */}
                          {!isAdmin && !isModerator && (
                            <button
                              onClick={(e) => handleReportAlert(item.id, e)}
                              className="p-1.5 text-slate-350 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title={isEn ? "Report Alert" : "شکایت درج کریں"}
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );

                  // Inject Local Alerts active ad via rotation
                  if (ad) {
                    elements.push(
                      <div key={`ad-alerts-${i}-${ad.id}`} className="md:col-span-2">
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

      {/* VIEW: EXPIRED / RESOLVED ALERTS HISTORY */}
      {activeView === 'history' && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-600 font-bold">
              {isEn 
                ? 'Historical archive showing resolved alerts, expired notices, and cleared incidents.' 
                : 'آرکائیو میں پرانے نوٹسز اور حل شدہ ہنگامی الرٹس شامل ہیں۔'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.filter(isAlertExpired).length === 0 ? (
              <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-extrabold text-slate-800">{isEn ? 'History Archive Empty' : 'آرکائیو خالی ہے'}</p>
              </div>
            ) : (
              items.filter(isAlertExpired).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigateToDetail(item.id)}
                  className="bg-white border border-slate-200 opacity-70 hover:opacity-100 hover:shadow-md transition-all duration-200 cursor-pointer rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase font-bold">
                      {item.category}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                      {isEn ? 'Resolved / Expired' : 'حل شدہ'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-700 line-clamp-1 mt-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-xs font-semibold line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-[11px] font-bold text-slate-400 border-t border-slate-50 pt-3 font-bold">
                    <span>{item.area}</span>
                    <span>{getRelativeTime(item.postedTime || item.created_at || '', isEn)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW: DETAILED COMPONENT FOR INDIVIDUAL ALERT */}
      {activeView === 'detail' && selectedItem && (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn" id="alerts-detail-view">
          
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Image banner */}
            {selectedItem.image && (
              <div className="w-full h-64 overflow-hidden relative">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <h1 className="absolute bottom-5 start-5 end-5 text-xl md:text-2xl font-black text-white leading-tight">
                  {selectedItem.title}
                </h1>
              </div>
            )}

            <div className="p-6 md:p-8 space-y-6">
              {!selectedItem.image && (
                <div className="border-b border-slate-150 pb-4">
                  <h1 className="text-2xl font-black text-slate-900 leading-tight">
                    {selectedItem.title}
                  </h1>
                </div>
              )}

              {/* Status and priority tags */}
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border font-bold ${getPriorityStyles(selectedItem.priority).bg}`}>
                  {getPriorityStyles(selectedItem.priority).text}
                </span>

                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-black font-bold">
                  {getCategoryIcon(selectedItem.category)}
                  <span>{selectedItem.category}</span>
                </span>

                {isAlertExpired(selectedItem) && (
                  <span className="bg-red-50 text-red-700 text-xs font-black px-3 py-1 rounded-full font-bold">
                    {isEn ? 'Resolved / Expired' : 'حل شدہ'}
                  </span>
                )}
              </div>

              {/* Detailed Guidelines Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider font-bold">
                  {isEn ? 'Incident Guidelines' : 'الرٹ اور ہدایات'}
                </h4>
                <p className="text-slate-700 text-sm font-semibold leading-relaxed whitespace-pre-wrap">
                  {selectedItem.description}
                </p>
              </div>

              {/* Attachments Section */}
              {selectedItem.attachments && selectedItem.attachments.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider font-bold">
                    {isEn ? 'Attachments & Resources' : 'منسلک فائلیں'}
                  </h4>
                  <div className="space-y-2">
                    {selectedItem.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-bold bg-blue-50 px-3 py-2 rounded-xl transition-all"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Link #{idx + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Map Location Section */}
              {(selectedItem.latitude || selectedItem.longitude) && (
                <div className="space-y-2.5 border-t border-slate-100 pt-5">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider font-bold">
                    {isEn ? 'Map coordinates / Location' : 'گوگل میپ لوکیشن'}
                  </h4>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedItem.latitude},${selectedItem.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex flex-col justify-center items-center py-6 bg-slate-50 border border-slate-150 rounded-2xl hover:bg-slate-100 transition-colors"
                  >
                    <Map className="w-8 h-8 text-blue-600" />
                    <span className="text-xs font-black text-slate-700 mt-2">
                      Lat: {selectedItem.latitude}, Lng: {selectedItem.longitude}
                    </span>
                    <span className="text-[10px] font-bold text-slate-450 mt-0.5">
                      {isEn ? '(Click to open in Google Maps)' : '(گوگل میپ پر کھولنے کے لیے کلک کریں)'}
                    </span>
                  </a>
                </div>
              )}

              {/* Location properties metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-bold">
                    {isEn ? 'Location / Area' : 'مقام یا متاثرہ گلی'}
                  </span>
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 font-bold">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {selectedItem.area}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-bold">
                    {isEn ? 'Date & Time Posted' : 'تاریخ اور وقت اشاعت'}
                  </span>
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 font-bold">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {getRelativeTime(selectedItem.postedTime || selectedItem.created_at || '', isEn)}
                  </span>
                </div>

                {selectedItem.expiryTime && (
                  <div className="space-y-1 col-span-full border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-bold">
                      {isEn ? 'Expires At' : 'مدت ختم ہونے کا وقت'}
                    </span>
                    <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 font-bold">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {new Date(selectedItem.expiryTime).toLocaleString(isEn ? 'en-US' : 'ur-PK')}
                    </span>
                  </div>
                )}
              </div>

              {/* Publisher Contact details */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase block font-bold">
                      {isEn ? 'Posted By' : 'جاری کنندہ'}
                    </span>
                    <span className="text-xs font-black text-slate-800 font-bold">
                      {selectedItem.postedBy}
                    </span>
                  </div>
                </div>

                {selectedItem.contact && (
                  <a
                    href={`tel:${selectedItem.contact}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedItem.contact}</span>
                  </a>
                )}
              </div>

              {/* Actions footer for edit/archive/delete */}
              {isModerator && (
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-5">
                  <button
                    onClick={(e) => handleEditAlert(selectedItem, e)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-750 border border-blue-200 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all cursor-pointer font-bold"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Edit Details' : 'ترمیم کریں'}</span>
                  </button>
                  <button
                    onClick={(e) => handleToggleArchive(selectedItem.id, e)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer font-bold"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{selectedItem.status === 'Archived' ? (isEn ? 'Activate' : 'چالو کریں') : (isEn ? 'Mark Archive' : 'آرکائیو کریں')}</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={(e) => handleDeleteAlert(selectedItem.id, e)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-750 border border-red-200 hover:bg-red-100 rounded-xl text-xs font-bold transition-all cursor-pointer font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Delete Alert' : 'حذف کریں'}</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* VIEW: CREATE & EDIT VIEW */}
      {activeView === 'create' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn" id="alerts-create-view">
          
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
            
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-xl font-black text-slate-950 flex items-center gap-2">
                📢 {editingAlertId ? (isEn ? 'Edit Incident Alert' : 'الرٹ میں ترمیم کریں') : (isEn ? 'Broadcast New Incident Alert' : 'نیا الرٹ جاری کریں')}
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed font-bold">
                {isEn 
                  ? 'Keep Dhoke Hassu safe and updated. Ensure details are highly accurate. Avoid spreading unverified rumors.' 
                  : 'ڈھوک حسو محلے کو محفوظ رکھیں۔ تمام معلومات کی سچائی کی ذمہ داری آپ پر ہے۔ غیر تصدیق شدہ افواہیں پھیلانے سے گریز کریں۔'}
              </p>
            </div>

            {publishSuccess ? (
              <div className="py-12 text-center bg-emerald-50 rounded-2xl border border-emerald-100 space-y-3" id="alert-publish-success">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
                <h3 className="text-lg font-black text-emerald-900 font-bold">
                  {isEn ? 'Alert Updated/Broadcast Successfully!' : 'الرٹ کامیابی کے ساتھ شائع ہو گیا!'}
                </h3>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5" id="alerts-create-form">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Title */}
                  <div className="space-y-1.5 col-span-full">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Alert Title' : 'الرٹ کا عنوان'} *
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder={isEn ? 'e.g. Water Line Pipe Broken near Gali 4' : 'مثال کے طور پر: گلی 4 میں پانی کا مین والو ٹوٹ گیا'}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-semibold ${
                        errors.title ? 'border-red-400 focus:border-red-500' : 'border-slate-200'
                      }`}
                      id="form-title"
                    />
                    {errors.title && <p className="text-[10px] text-red-500 font-bold">{errors.title}</p>}
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Alert Category' : 'الرٹ کیٹیگری'} *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-bold"
                      id="form-category"
                    >
                      {categories.filter(c => c !== 'All').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Alert Priority' : 'الرٹ کی اہمیت'} *
                    </label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-bold"
                      id="form-priority"
                    >
                      <option value="Low">{isEn ? 'Low' : 'معمولی'}</option>
                      <option value="Medium">{isEn ? 'Medium' : 'درمیانی'}</option>
                      <option value="High">{isEn ? 'High' : 'شدید'}</option>
                      <option value="Critical">{isEn ? 'Critical (Pin at Top)' : 'انتہائی اہم (سب سے اوپر پن)'}</option>
                    </select>
                  </div>

                  {/* Location Area */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Affected Area / Location' : 'متاثرہ مقام یا گلی'} *
                    </label>
                    <input
                      type="text"
                      value={formArea}
                      onChange={(e) => setFormArea(e.target.value)}
                      placeholder={isEn ? 'e.g. Street 4, Sector 2' : 'مثال کے طور پر: گلی 4، سیکٹر 2'}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-semibold ${
                        errors.area ? 'border-red-400 focus:border-red-500' : 'border-slate-200'
                      }`}
                      id="form-area"
                    />
                    {errors.area && <p className="text-[10px] text-red-500 font-bold">{errors.area}</p>}
                  </div>

                  {/* Optional Expiry Time */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Expiry Date & Time (Optional)' : 'مدت ختم ہونے کا وقت (اختیاری)'}
                    </label>
                    <input
                      type="datetime-local"
                      value={formExpiryTime}
                      onChange={(e) => setFormExpiryTime(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800 font-semibold"
                      id="form-expiry-time"
                    />
                  </div>

                  {/* Latitude */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Latitude (Optional)' : 'عرض البلد (اختیاری)'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formLatitude}
                      onChange={(e) => setFormLatitude(e.target.value)}
                      placeholder="e.g. 33.6214"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800 font-semibold"
                      id="form-lat"
                    />
                  </div>

                  {/* Longitude */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Longitude (Optional)' : 'طول البلد (اختیاری)'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formLongitude}
                      onChange={(e) => setFormLongitude(e.target.value)}
                      placeholder="e.g. 73.0452"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800 font-semibold"
                      id="form-lng"
                    />
                  </div>

                  {/* Visibility */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Alert Visibility' : 'ظاہریت'}
                    </label>
                    <select
                      value={formVisibility}
                      onChange={(e) => setFormVisibility(e.target.value as 'Public' | 'Neighbors')}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800 font-bold"
                      id="form-visibility"
                    >
                      <option value="Public">{isEn ? 'Public (All Residents)' : 'عوامی (تمام رہائشی)'}</option>
                      <option value="Neighbors">{isEn ? 'Neighbors Only' : 'صرف قریبی پڑوسی'}</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Alert Status' : 'الرٹ کی حالت'}
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'Active' | 'Expired' | 'Archived')}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800 font-bold"
                      id="form-status"
                    >
                      <option value="Active">{isEn ? 'Active' : 'سرگرم'}</option>
                      <option value="Expired">{isEn ? 'Expired' : 'غیر سرگرم'}</option>
                      <option value="Archived">{isEn ? 'Archived' : 'آرکائیو شدہ'}</option>
                    </select>
                  </div>

                  {/* Optional Image Url */}
                  <div className="space-y-1.5 col-span-full">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Image Attachment URL or File Upload (Optional)' : 'تصویر کا لنک یا فائل اپلوڈ (اختیاری)'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-semibold"
                        id="form-image"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        id="alert-image-upload-file"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => document.getElementById('alert-image-upload-file')?.click()}
                        className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5 cursor-pointer border-0 disabled:opacity-50"
                      >
                        {isUploading ? (
                          <span>{isEn ? 'Uploading...' : 'اپلوڈ ہو رہا ہے...'}</span>
                        ) : (
                          <span>📷 {isEn ? 'Upload' : 'اپلوڈ'}</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Optional Attachment URLs */}
                  <div className="space-y-1.5 col-span-full">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Attachments Links (One URL per line)' : 'منسلک فائل لنکس (ہر لائن پر ایک لنک)'}
                    </label>
                    <textarea
                      rows={3}
                      value={formAttachments}
                      onChange={(e) => setFormAttachments(e.target.value)}
                      placeholder="https://example.com/doc.pdf"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 font-semibold"
                      id="form-attachments"
                    />
                  </div>

                  {/* Description Details */}
                  <div className="space-y-1.5 col-span-full">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block font-bold">
                      {isEn ? 'Incident Description / Guidelines' : 'واقعہ کی تفصیل اور ہدایات'} *
                    </label>
                    <textarea
                      rows={5}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder={isEn ? 'Provide comprehensive details and directions for neighbors...' : 'تفصیلی معلومات درج کریں...'}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-semibold ${
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
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer font-bold"
                    id="submit-alert-form"
                  >
                    {editingAlertId ? (isEn ? 'Update Alert' : 'الرٹ اپ ڈیٹ کریں') : (isEn ? 'Publish Live' : 'شائع کریں')}
                  </button>

                  <button
                    type="button"
                    onClick={onNavigateToList}
                    className="px-6 py-3 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer font-bold"
                    id="cancel-alert-form"
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
