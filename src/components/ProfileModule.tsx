/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass } from 'lucide-react';
import { 
  dbGetCities, 
  dbGetAreas, 
  detectBrowserLocation, 
  findNearestArea 
} from '../utils/locationService';
import { City, Area } from '../types';
import {
  User as UserIcon,
  ShieldCheck,
  Calendar,
  MapPin,
  Award,
  Edit,
  ArrowLeft,
  Camera,
  MessageSquare,
  Sparkles,
  CheckCircle,
  Clock,
  Facebook,
  Twitter,
  Linkedin,
  Globe,
  Plus,
  Share2,
  Trash2,
  Tag,
  Briefcase,
  Store,
  Building2,
  Phone,
  Bookmark,
  ChevronRight,
  Info,
  ThumbsUp,
  AlertTriangle,
  X,
  Video,
  Upload
} from 'lucide-react';
import { User, Post, JobItem, BusinessItem, PropertyItem, BuySellItem, ServiceItem, AlertItem, EventItem, DealItem, Language, Gender } from '../types';
import FollowListModal from './FollowListModal';
import DateOfBirthPicker from './DateOfBirthPicker';
import { isEntityVerified } from '../utils/verification';
import { validateDemographics } from '../utils/demographics';

interface ProfileModuleProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  currentLanguage: Language;
  currentPath: string;
  navigate: (path: string, paramId?: string) => void;
  posts: Post[];
  events: EventItem[];
  marketplaceItems: BuySellItem[];
  businesses: BusinessItem[];
  jobs: JobItem[];
  services: ServiceItem[];
  alerts: AlertItem[];
  deals: DealItem[];
}

// Preset assets for easy simulation in Edit Profile
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
];

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1621274790572-7c325d6bc67f?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200',
];

// Badge configuration
interface BadgeDef {
  id: string;
  nameEn: string;
  nameUr: string;
  descEn: string;
  descUr: string;
  icon: string;
  color: string;
  bgColor: string;
  pointsRequired: number;
}

const BADGES_CONFIG: BadgeDef[] = [
  {
    id: 'new-member',
    nameEn: 'New Member',
    nameUr: 'نیا ممبر',
    descEn: 'Joined Dhoke Hassu Connect within the last 30 days',
    descUr: 'آخری 30 دنوں کے دوران نیٹ ورک میں شمولیت اختیار کی',
    icon: '🌱',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    pointsRequired: 0,
  },
  {
    id: 'active-member',
    nameEn: 'Active Member',
    nameUr: 'فعال رکن',
    descEn: 'Earn 50+ reputation points through interactions',
    descUr: 'کمیونٹی سرگرمی سے 50 پبلک پوائنٹس حاصل کریں',
    icon: '⚡',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    pointsRequired: 50,
  },
  {
    id: 'verified-user',
    nameEn: 'Verified User',
    nameUr: 'تصدیق شدہ شہری',
    descEn: 'Resident verified by peer neighborhood confirmation',
    descUr: 'محلے کے شہریوں کی تصدیق کے بعد حاصل ہونے والا بیج',
    icon: '🛡️',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200',
    pointsRequired: 100,
  },
  {
    id: 'top-contributor',
    nameEn: 'Top Contributor',
    nameUr: 'اعلیٰ معاون',
    descEn: 'Earn 150+ reputation points with useful posts and items',
    descUr: 'مفید معلومات شیئر کر کے 150 پوائنٹس حاصل کریں',
    icon: '👑',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    pointsRequired: 150,
  },
  {
    id: 'local-business',
    nameEn: 'Local Business Owner',
    nameUr: 'مقامی تاجر',
    descEn: 'Registered a certified business in the directory',
    descUr: 'کاروباری ڈائریکٹری میں کاروبار رجسٹرڈ کر کے بیج پائیں',
    icon: '🏪',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    pointsRequired: 180,
  },
  {
    id: 'event-organizer',
    nameEn: 'Event Organizer',
    nameUr: 'تقریب منتظم',
    descEn: 'Organized or RSVP\'d to a local community meetup',
    descUr: 'مقامی کمیونٹی ایونٹ یا میٹنگ کا انعقاد کروانے والے منتظم',
    icon: '📅',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200',
    pointsRequired: 220,
  },
  {
    id: 'community-helper',
    nameEn: 'Community Helper',
    nameUr: 'معاشرتی مددگار',
    descEn: 'Earn 250+ points and report neighborhood issues responsibly',
    descUr: 'عوامی مسائل کی نشاندہی اور رپورٹ کرنے والے معزز شہری',
    icon: '🤝',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 border-cyan-200',
    pointsRequired: 250,
  },
];

export default function ProfileModule({
  user,
  onUpdateUser,
  currentLanguage,
  currentPath,
  navigate,
  posts,
  events,
  marketplaceItems,
  businesses,
  jobs,
  services,
  alerts,
  deals,
}: ProfileModuleProps) {
  // Determine view inside profile
  const activeSubView = 
    currentPath === '/profile/edit' ? 'edit' :
    currentPath === '/profile/activity' ? 'activity' :
    currentPath === '/profile/badges' ? 'badges' : 'main';

  // Sub-tabs for main view
  const [activeTab, setActiveTab] = useState<'posts' | 'activity' | 'badges' | 'saved'>('posts');
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [activeFollowTab, setActiveFollowTab] = useState<'followers'|'following'>('followers');

  // State initialization with localStorage persistence
  const [profileData, setProfileData] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('dh_user_profile_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not load user profile from storage:", e);
    }
    // Return default with baseline data
    return {
      fullName: user.fullName || 'Chaudhary Bashir',
      mobileNumber: user.mobileNumber || '03001234567',
      area: user.area || 'Dhoke Hassu',
      username: user.username || 'bashir_hardware',
      bio: user.bio || 'Proud Rawalpindi resident dedicated to keeping Dhoke Hassu connected, clean, and safe. Run a local hardware store.',
      joinDate: user.joinDate || 'August 2024',
      reputationScore: user.reputationScore !== undefined ? user.reputationScore : 175,
      verified: user.verified !== undefined ? user.verified : true,
      profilePhoto: user.profilePhoto || PRESET_AVATARS[0],
      coverPhoto: user.coverPhoto || PRESET_COVERS[0],
      contactNumber: user.contactNumber || '03001234567',
      gender: user.gender || undefined,
      dateOfBirth: user.dateOfBirth || undefined,
      socialLinks: user.socialLinks || {
        facebook: 'facebook.com/bashir.dh',
        twitter: 'twitter.com/bashir_hardware',
        website: 'bashirhardware.com'
      },
      badges: user.badges || ['new-member', 'active-member', 'verified-user', 'top-contributor'],
    };
  });

  // Sync to AppShell / App parent when local changes happen
  useEffect(() => {
    localStorage.setItem('dh_user_profile_data', JSON.stringify(profileData));
  }, [profileData]);

  // Keep local state in sync when user prop changes from parent (e.g. database load)
  useEffect(() => {
    if (user) {
      // Overwrite local state with fresh DB data, giving DB priority
      setProfileData(user);
    }
  }, [user]);

  // --- Profile Picture Change, Crop & Webcam States ---
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [isCamActive, setIsCamActive] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Stop camera stream safely
  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCamActive(false);
  };

  // Start webcam stream
  const handleStartCamera = async () => {
    try {
      setIsCamActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 480, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera getUserMedia failed, using simulation/upload fallback", err);
      setIsCamActive(false);
      alert(currentLanguage === 'en' 
        ? "Could not start camera (check site permissions). Please upload an image instead." 
        : "کیمرہ شروع نہیں ہو سکا۔ برائے مہربانی فائل اپلوڈ کرنے کا آپشن استعمال کریں۔"
      );
    }
  };

  // Capture photo from video stream
  const handleCapturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the current video frame
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1); // mirror effect
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setSelectedImage(dataUrl);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        handleStopCamera();
      }
    }
  };

  // Handle file input selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply cropping and update profile photo
  const handleApplyCrop = () => {
    if (!selectedImage) return;

    const canvas = document.createElement('canvas');
    canvas.width = 250;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const img = new Image();
      img.onload = async () => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 250, 250);

        // Apply crop maths:
        // Width & height of the image relative to canvas container
        const dWidth = 250 * zoom;
        const dHeight = 250 * zoom;
        
        // Offset to keep it centered + drag adjustments
        const dx = (250 - dWidth) / 2 + pan.x;
        const dy = (250 - dHeight) / 2 + pan.y;

        ctx.drawImage(img, dx, dy, dWidth, dHeight);

        const croppedUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        try {
          const { dbUploadAvatar, dbSaveUserProfile } = await import('../utils/supabaseClient');
          // Upload the base64 to Supabase Storage and get a public URL
          const uploadedUrl = await dbUploadAvatar(profileData.id, croppedUrl);
          
          if (uploadedUrl) {
            const updatedUser = { ...profileData, profilePhoto: uploadedUrl };
            
            // Immediately save to Database
            await dbSaveUserProfile(updatedUser);
            
            // Update local AppShell and Global App.tsx state so all avatars immediately refresh!
            setProfileData(updatedUser);
            onUpdateUser(updatedUser);

            if (activeSubView === 'edit') {
              setEditAvatar(uploadedUrl);
            }
            
            alert(currentLanguage === 'en' ? 'Profile picture updated!' : 'پروفائل تصویر اپڈیٹ ہو گئی!');
          } else {
            alert(currentLanguage === 'en' ? 'Failed to upload image' : 'تصویر اپلوڈ نہیں ہو سکی');
          }
        } catch (e) {
          console.error("Failed to upload avatar", e);
          alert("Error uploading avatar");
        }

        // Reset
        setSelectedImage(null);
        setShowAvatarModal(false);
      };
      img.src = selectedImage;
    }
  };

  // Drag-to-pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!selectedImage) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!selectedImage) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  // Handle local activity list
  const [activities, setActivities] = useState<{ id: string; type: string; detailsEn: string; detailsUr: string; time: string; icon: string }[]>(() => {
    try {
      const saved = localStorage.getItem('dh_user_activities');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'act-1',
        type: 'post',
        detailsEn: 'Published a community update about Rawalpindi solid waste management',
        detailsUr: 'راولپنڈی سالڈ ویسٹ مینجمنٹ کے بارے میں ایک کمیونٹی اپ ڈیٹ شائع کی',
        time: '2 hours ago',
        icon: '📝'
      },
      {
        id: 'act-2',
        type: 'business',
        detailsEn: 'Updated business details for "Bashir Hardware Store" in Dhoke Hassu',
        detailsUr: '"بشیر ہارڈ ویئر اسٹور" کے کاروباری تفصیلات کی تجدید کی',
        time: '1 day ago',
        icon: '🏪'
      },
      {
        id: 'act-3',
        type: 'marketplace',
        detailsEn: 'Listed "Industrial Grade Electric Drill" for sale in Buy & Sell',
        detailsUr: 'خرید و فروخت کے سیکشن میں "انڈسٹریل الیکٹرک ڈرل" برائے فروخت پیش کی',
        time: '3 days ago',
        icon: '🛍️'
      },
      {
        id: 'act-4',
        type: 'event',
        detailsEn: 'RSVP\'d "Interested" in Dhoke Hassu Sports Gala 2026',
        detailsUr: 'ڈھوک حسو اسپورٹس گالا 2026 میں شرکت کے عزم کا اظہار کیا',
        time: '5 days ago',
        icon: '📅'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('dh_user_activities', JSON.stringify(activities));
  }, [activities]);

  // Reputation Points trigger helper
  const addReputationPoints = (points: number, reasonEn: string, reasonUr: string, type: string) => {
    setProfileData(prev => {
      const newScore = (prev.reputationScore || 0) + points;
      
      // Calculate newly unlocked badges based on score
      const currentBadges = [...(prev.badges || [])];
      BADGES_CONFIG.forEach(badge => {
        if (newScore >= badge.pointsRequired && !currentBadges.includes(badge.id)) {
          currentBadges.push(badge.id);
        }
      });

      return {
        ...prev,
        reputationScore: newScore,
        badges: currentBadges
      };
    });

    // Add activity log
    const newAct = {
      id: `act-${Date.now()}`,
      type: 'reputation',
      detailsEn: `Earned +${points} Reputation Points: ${reasonEn}`,
      detailsUr: `عوامی ساکھ کے +${points} پوائنٹس حاصل کیے: ${reasonUr}`,
      time: 'Just now',
      icon: '✨'
    };
    setActivities(prev => [newAct, ...prev]);
  };

  // Saved items logic (simulation with actual elements from lists)
  const [savedItemsList, setSavedItemsList] = useState<{ id: string; type: 'deal' | 'property' | 'job' | 'alert'; title: string; subtitle: string; area: string; image?: string }[]>(() => {
    try {
      const saved = localStorage.getItem('dh_user_saved_items');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'saved-1',
        type: 'deal',
        title: '30% Off on Sanitary Fittings',
        subtitle: 'Bashir Hardware Store',
        area: 'Dhoke Hassu',
        image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=300'
      },
      {
        id: 'saved-2',
        type: 'property',
        title: '5 Marla House near Dhoke Hassu Ground',
        subtitle: 'PKR 35,000 / month',
        area: 'Dhoke Hassu',
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=300'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('dh_user_saved_items', JSON.stringify(savedItemsList));
  }, [savedItemsList]);

  // Calculate static counts
  const ownPosts = posts.filter(p => p.author === profileData.fullName);
  const ownBusinesses = businesses.filter(b => b.ownerName === profileData.fullName || b.contact === profileData.mobileNumber || b.name.includes('Bashir'));
  const ownJobs = jobs.filter(j => j.postedBy === profileData.fullName || j.contact === profileData.mobileNumber);
  const ownMarketplace = marketplaceItems.filter(m => m.sellerName === profileData.fullName || m.contact === profileData.mobileNumber);
  const ownServices = services.filter(s => s.name === profileData.fullName);

  // Dynamic age calculation helper
  const calculateAge = (dobString?: string) => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Edit Profile Form States
  const [editName, setEditName] = useState(profileData.fullName);
  const [editUsername, setEditUsername] = useState(profileData.username || '');
  const [editBio, setEditBio] = useState(profileData.bio || '');
  const [editArea, setEditArea] = useState(profileData.area);
  const [editContact, setEditContact] = useState(profileData.contactNumber || '');
  const [editCover, setEditCover] = useState(profileData.coverPhoto || '');
  const [editAvatar, setEditAvatar] = useState(profileData.profilePhoto || '');
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const { dbUploadPostImage } = await import('../utils/supabaseClient');
      const uploadedUrl = await dbUploadPostImage(file);
      if (uploadedUrl) {
        setEditCover(uploadedUrl);
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
  const [editFb, setEditFb] = useState(profileData.socialLinks?.facebook || '');
  const [editTw, setEditTw] = useState(profileData.socialLinks?.twitter || '');
  const [editLinkedin, setEditLinkedin] = useState(profileData.socialLinks?.linkedin || '');
  const [editWeb, setEditWeb] = useState(profileData.socialLinks?.website || '');
  const [editGender, setEditGender] = useState<Gender | ''>(profileData.gender && profileData.gender !== 'Unknown' ? profileData.gender : '');
  const [editDob, setEditDob] = useState(profileData.dateOfBirth || '');

  // Normalized location states
  // Location states removed to simplify Area input

  // Keep edit fields in sync when profile changes
  useEffect(() => {
    setEditName(profileData.fullName);
    setEditUsername(profileData.username || '');
    setEditBio(profileData.bio || '');
    setEditArea(profileData.area);
    setEditContact(profileData.contactNumber || '');
    setEditCover(profileData.coverPhoto || '');
    setEditAvatar(profileData.profilePhoto || '');
    setEditFb(profileData.socialLinks?.facebook || '');
    setEditTw(profileData.socialLinks?.twitter || '');
    setEditLinkedin(profileData.socialLinks?.linkedin || '');
    setEditWeb(profileData.socialLinks?.website || '');
    setEditGender(profileData.gender && profileData.gender !== 'Unknown' ? profileData.gender : '');
    setEditDob(profileData.dateOfBirth || '');
  }, [profileData]);

  // Handle saving of updated profile details
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName?.trim()) {
      alert(currentLanguage === 'en' ? 'Full name is required!' : 'پورا نام درج کرنا لازمی ہے!');
      return;
    }

    // Validate demographics
    const demoVal = validateDemographics(editGender, editDob, currentLanguage);
    if (!demoVal.isValid) {
      alert(demoVal.error || 'Validation failed');
      return;
    }

    // Insert console logs for debugging
    console.log("editAvatar =", editAvatar);
    console.log("editCover =", editCover);
    console.log("editGender =", editGender);
    console.log("editDob =", editDob);

    const isFirstProfileComplete = !profileData.username && editUsername;
    const additionalPoints = isFirstProfileComplete ? 25 : 0;

    const selectedAreaName = editArea;

    // Log state before creating updatedUser
    console.log("editAvatar =", editAvatar);
    console.log("editCover =", editCover);
    console.log("editGender =", editGender);
    console.log("editDob =", editDob);

    const updatedUser: User = {
      ...profileData,
      fullName: editName,
      username: editUsername,
      bio: editBio,
      area: selectedAreaName,
      contactNumber: editContact,
      coverPhoto: editCover,
      profilePhoto: editAvatar,
      gender: editGender,
      dateOfBirth: editDob,
            socialLinks: {
        ...(profileData.socialLinks || {}),
        facebook: editFb,
        twitter: editTw,
        linkedin: editLinkedin,
        website: editWeb
        // Note: coverPhoto, gender, dateOfBirth are stored in dedicated fields, not socialLinks
      }
    };

    setProfileData(updatedUser);
    onUpdateUser(updatedUser);

    if (additionalPoints > 0) {
      addReputationPoints(25, 'Profile completion details updated', 'پروفائل کی تفصیلات مکمل کرنے پر', 'profile');
      alert(currentLanguage === 'en' 
        ? 'Profile updated successfully! Unlocked +25 Reputation Points for completing profile!' 
        : 'پروفائل کامیابی سے تبدیل ہو گئی! پروفائل مکمل کرنے پر آپ کو +25 پوائنٹس ملے!'
      );
    } else {
      alert(currentLanguage === 'en' ? 'Profile details saved successfully!' : 'تبدیلیاں کامیابی سے محفوظ کر لی گئیں!');
    }

    navigate('/profile');
  };

  // UI Localized labels
  const UI_TXT = {
    en: {
      profileHeader: "User Profile & Reputation",
      memberSince: "Resident Since",
      reputationScore: "Reputation Score",
      reputationInfo: "Public points reflecting your positive neighborhood actions, helpful posts, and neighborhood responses.",
      verifiedResident: "Verified Resident",
      repLevel: "Local Rank",
      reputationSystem: "Dhoke Hassu Public Reputation System",
      editProfileBtn: "Edit Profile",
      badgesBtn: "View Badges",
      activityBtn: "Recent Activity",
      statsTitle: "Your Local Contributions",
      postsTab: "My Posts",
      activityTab: "Activity Log",
      badgesTab: "My Badges",
      savedTab: "Saved Listings",
      posts: "Community Posts",
      comments: "Comments Written",
      events: "Events RSVP'd",
      marketplace: "Marketplace Deals",
      businesses: "Registered Businesses",
      jobs: "Jobs Offered",
      services: "Services Provided",
      noPosts: "You haven't posted in the Community feed yet.",
      noActivity: "No recent activity recorded.",
      noSaved: "No saved listings. You can save deals, jobs or properties.",
      editTitle: "Edit Profile Details",
      editSubtitle: "Personalize your public local resident profile",
      fullName: "Full Name",
      username: "Username (@)",
      bio: "Bio / Description",
      bioPlaceholder: "Write a short bio about yourself for neighbors to read...",
      area: "Resident Area",
      contactPhone: "Optional Public Contact Number",
      socialLinks: "Social Networks",
      saveBtn: "Save Profile Changes",
      cancelBtn: "Cancel",
      unlocked: "Unlocked",
      locked: "Locked",
      pointsPrefix: "Points Required:",
      simulatorTitle: "Reputation Point Simulator",
      simulatorDesc: "Since there is no real-time server, you can simulate local helpful actions below to see your reputation score, level, and badges update dynamically with animations!",
      simPost: "Simulate Useful Post (+10 Pts)",
      simLike: "Simulate Receiving Reaction (+5 Pts)",
      simComment: "Simulate Participating in Community (+15 Pts)",
      simReport: "Simulate Reporting Neighborhood Utility Issue (+20 Pts)"
    },
    ur: {
      profileHeader: "صارف پروفائل اور عوامی ساکھ",
      memberSince: "علاقائی رہائشی تاریخ",
      reputationScore: "عوامی ساکھ کے پوائنٹس",
      reputationInfo: "عوامی پوائنٹس جو آپ کی کمیونٹی سرگرمیوں، مفید معلومات کی فراہمی، اور ہمسایوں کی مدد کی عکاسی کرتے ہیں۔",
      verifiedResident: "تصدیق شدہ شہری",
      repLevel: "سماجی رینک",
      reputationSystem: "ڈھوک حسو عوامی رینک سسٹم",
      editProfileBtn: "پروفائل تبدیل کریں",
      badgesBtn: "بیجز دیکھیں",
      activityBtn: "حالیہ سرگرمیاں",
      statsTitle: "آپ کے سماجی اشتراکات",
      postsTab: "میری پوسٹس",
      activityTab: "سرگرمی کا ریکارڈ",
      badgesTab: "میرے بیجز",
      savedTab: "محفوظ اشیاء",
      posts: "کمیونٹی پوسٹس",
      comments: "کئے گئے تبصرے",
      events: "تقریبات جن میں شرکت کی",
      marketplace: "خرید و فروخت اشیاء",
      businesses: "رجسٹرڈ کاروبار",
      jobs: "نوکریاں جو پوسٹ کیں",
      services: "پیش کردہ خدمات",
      noPosts: "آپ نے ابھی تک کمیونٹی فیڈ میں کچھ پوسٹ نہیں کیا۔",
      noActivity: "حالیہ کوئی سرگرمی ریکارڈ نہیں کی گئی۔",
      noSaved: "کوئی محفوظ شدہ اشتہار نہیں ہے۔ آپ ڈیلز، ملازمتیں یا جائیدادیں محفوظ کر سکتے ہیں۔",
      editTitle: "پروفائل کی تفصیلات تبدیل کریں",
      editSubtitle: "اپنے عوامی لوکل شہری پروفائل کی تفصیلات درست کریں",
      fullName: "پورا نام",
      username: "یوزر نیم (@)",
      bio: "تعارف / بائیو",
      bioPlaceholder: "اپنے بارے میں ایک مختصر تعارف لکھیں جو پڑوسی پڑھ سکیں...",
      area: "رہائشی علاقہ",
      contactPhone: "اختیاری پبلک فون نمبر",
      socialLinks: "سوشل نیٹ ورکس لنکس",
      saveBtn: "تبدیلیاں محفوظ کریں",
      cancelBtn: "کینسل کریں",
      unlocked: "حاصل شدہ",
      locked: "مقفل",
      pointsPrefix: "درکار پوائنٹس:",
      simulatorTitle: "رینک اور پوائنٹس سمیلیٹر",
      simulatorDesc: "کیونکہ اس ڈیمو میں کوئی لائیو سرور نہیں ہے، آپ نیچے دیے گئے بٹنوں کے ذریعے کمیونٹی کی مدد کے مختلف کاموں کو نقل کر سکتے ہیں اور اپنے پوائنٹس اور بیجز کو لائیو بڑھتا ہوا دیکھ سکتے ہیں!",
      simPost: "مفید پوسٹ لکھنا نقل کریں (+10 Pts)",
      simLike: "پوسٹ پر پسندیدگی ملنا نقل کریں (+5 Pts)",
      simComment: "ہمسائے کی مدد کرنا نقل کریں (+15 Pts)",
      simReport: "بجلی/پانی کا مسئلہ رپورٹ کرنا نقل کریں (+20 Pts)"
    }
  };

  const currentLangLabels = UI_TXT[currentLanguage];

  // Helper to get Rank level title based on score
  const getRankLevel = (score: number) => {
    if (score < 50) return { title: currentLanguage === 'en' ? 'Bronze Citizen' : 'کانسی شہری', color: 'text-orange-500 bg-orange-50', barColor: 'bg-orange-500' };
    if (score < 100) return { title: currentLanguage === 'en' ? 'Silver Contributor' : 'چاندی معاون', color: 'text-slate-500 bg-slate-50', barColor: 'bg-slate-500' };
    if (score < 180) return { title: currentLanguage === 'en' ? 'Gold Pillar' : 'سنہرا ستون', color: 'text-amber-500 bg-amber-50', barColor: 'bg-amber-500' };
    if (score < 250) return { title: currentLanguage === 'en' ? 'Platinum Leader' : 'پلاٹینم رہنما', color: 'text-emerald-500 bg-emerald-50', barColor: 'bg-emerald-500' };
    return { title: currentLanguage === 'en' ? 'Dhoke Hassu Ambassador' : 'ڈھوک حسو سفیر', color: 'text-indigo-600 bg-indigo-50 border border-indigo-100', barColor: 'bg-indigo-600' };
  };

  const userRank = getRankLevel(profileData.reputationScore || 0);

  // Compute unlocks percentage for progress bar
  const nextTargetPoints = profileData.reputationScore! < 50 ? 50 : 
                           profileData.reputationScore! < 100 ? 100 :
                           profileData.reputationScore! < 180 ? 180 :
                           profileData.reputationScore! < 250 ? 250 : 350;
  
  const currentLevelMin = profileData.reputationScore! < 50 ? 0 : 
                          profileData.reputationScore! < 100 ? 50 :
                          profileData.reputationScore! < 180 ? 100 :
                          profileData.reputationScore! < 250 ? 180 : 250;

  const levelProgressPercent = Math.min(
    100, 
    Math.max(0, ((profileData.reputationScore! - currentLevelMin) / (nextTargetPoints - currentLevelMin)) * 100)
  );

  const renderAvatarModal = () => {
    if (!showAvatarModal) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden" id="avatar-crop-modal">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
          {/* Modal Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div>
              <h3 className="font-black text-slate-900 text-base">
                {currentLanguage === 'en' ? 'Update Profile Picture' : 'پروفائل تصویر تبدیل کریں'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {currentLanguage === 'en' ? 'Capture from camera or upload and crop' : 'کیمرے سے تصویر لیں یا اپلوڈ کر کے کراپ کریں'}
              </p>
            </div>
            <button 
              type="button"
              onClick={() => {
                handleStopCamera();
                setSelectedImage(null);
                setShowAvatarModal(false);
              }}
              className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 flex flex-col items-center gap-6 overflow-y-auto flex-1">
            {/* Webcam video / Uploaded Photo container */}
            {!selectedImage ? (
              <div className="w-full flex flex-col items-center gap-4">
                {isCamActive ? (
                  <div className="relative w-64 h-64 rounded-2xl overflow-hidden bg-black border border-slate-200">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover scale-x-[-1]" 
                    />
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                      <button 
                        type="button"
                        onClick={handleCapturePhoto}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{currentLanguage === 'en' ? 'Capture Frame' : 'تصویر کھینچیں'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-64 h-64 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-6 text-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {currentLanguage === 'en' ? 'No Image Selected' : 'کوئی تصویر منتخب نہیں'}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {currentLanguage === 'en' ? 'Select a file or use your webcam camera' : 'فائل منتخب کریں یا ویب کیم استعمال کریں'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Cropper UI */
              <div className="w-full flex flex-col items-center gap-5">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-700">
                    {currentLanguage === 'en' ? 'Drag to position. Use zoom slider.' : 'تصویر پوزیشن کے لیے ڈریگ کریں اور زوم استعمال کریں۔'}
                  </p>
                </div>

                {/* Cropper Viewport */}
                <div 
                  className="relative w-64 h-64 bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden cursor-move select-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUp}
                >
                  <img 
                    src={selectedImage} 
                    alt="To Crop" 
                    draggable={false}
                    className="absolute pointer-events-none origin-center max-w-none"
                    style={{
                      width: '250px',
                      height: '250px',
                      objectFit: 'cover',
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      top: '0px',
                      left: '0px'
                    }}
                  />
                  {/* Circular Crop Mask overlay */}
                  <div className="absolute inset-0 border-[28px] border-slate-900/60 pointer-events-none rounded-2xl flex items-center justify-center">
                    <div className="w-[196px] h-[196px] rounded-full border border-white/50 shadow-[0_0_0_9999px_rgba(15,23,42,0.4)]" />
                  </div>
                </div>

                {/* Zoom Slider */}
                <div className="w-full space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>{currentLanguage === 'en' ? 'Zoom Out' : 'کم زوم'}</span>
                    <span>{zoom.toFixed(1)}x</span>
                    <span>{currentLanguage === 'en' ? 'Zoom In' : 'زیادہ زوم'}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.1" 
                    value={zoom} 
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer (Sticky at bottom) */}
          <div className="p-5 border-t border-slate-100 bg-white shrink-0">
            {!selectedImage ? (
              <div className="flex gap-3 w-full">
                {/* File Selector */}
                <label className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-xs font-bold text-slate-700 cursor-pointer shadow-xs">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileSelect} 
                    className="hidden" 
                  />
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span>{currentLanguage === 'en' ? 'Upload Photo' : 'اپلوڈ کریں'}</span>
                </label>

                {/* Camera Toggle */}
                {isCamActive ? (
                  <button
                    type="button"
                    onClick={handleStopCamera}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-xs font-bold text-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <X className="w-4 h-4 text-red-500" />
                    <span>{currentLanguage === 'en' ? 'Stop Camera' : 'کیمرہ بند کریں'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="flex-1 py-3 px-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Video className="w-4 h-4" />
                    <span>{currentLanguage === 'en' ? 'Use Camera' : 'کیمرہ استعمال کریں'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {currentLanguage === 'en' ? 'Cancel' : 'منسوخ کریں'}
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="flex-1 py-3 px-4 bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {currentLanguage === 'en' ? 'Crop & Save' : 'محفوظ کریں'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // VIEW 1: EDIT PROFILE FORM
  if (activeSubView === 'edit') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in" id="profile-edit-view-container">
        {renderAvatarModal()}
        {/* Back button header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/profile')}
            className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-xs"
            id="edit-profile-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {currentLangLabels.editTitle}
            </h2>
            <p className="text-xs text-slate-500">
              {currentLangLabels.editSubtitle}
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden" id="edit-profile-form">
          {/* Header images customize */}
          <div className="relative h-44 bg-slate-100">
            <img src={editCover} alt="Cover Customize" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="text-center text-white space-y-2">
                <p className="text-xs font-bold flex items-center gap-1 bg-black/50 py-1.5 px-3 rounded-full border border-white/20">
                  <Camera className="w-4 h-4" />
                  {currentLanguage === 'en' ? 'Select Cover Theme' : 'کور تھیم منتخب کریں'}
                </p>
                <div className="flex justify-center items-center gap-2">
                  {PRESET_COVERS.map((cov, idx) => (
                    <button 
                      key={idx}
                      type="button"
                      onClick={() => setEditCover(cov)}
                      className={`w-8 h-8 rounded overflow-hidden border-2 transition-all ${editCover === cov ? 'border-[#2563eb] scale-110' : 'border-white/50 hover:border-white'}`}
                    >
                      <img src={cov} alt="Preset cover" className="w-full h-full object-cover" />
                    </button>
                  ))}

                  {/* Gallery upload option */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                    id="profile-cover-upload-input"
                    disabled={uploadingCover}
                  />
                  <label
                    htmlFor="profile-cover-upload-input"
                    className="w-8 h-8 rounded bg-black/60 hover:bg-black/80 border-2 border-white/50 hover:border-white flex items-center justify-center text-white transition-all cursor-pointer"
                    title={currentLanguage === 'en' ? 'Upload cover from gallery' : 'گیلری سے کور اپ لوڈ کریں'}
                  >
                    {uploadingCover ? (
                      <span className="text-[8px]">...</span>
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Profile image customize overlay */}
            <div className="absolute -bottom-10 left-6 sm:left-10 w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-slate-200 shadow-md">
              <img src={editAvatar} alt="Profile Customize" className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors cursor-pointer"
                title="Change Avatar"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="pt-16 p-6 sm:p-8 space-y-6">
            {/* Quick avatar selection helpers */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                {currentLanguage === 'en' ? 'Or Choose Profile Avatar' : 'یا پروفائل اوتار منتخب کریں'}
              </label>
              <div className="flex gap-2.5">
                {PRESET_AVATARS.map((av, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => setEditAvatar(av)}
                    className={`w-11 h-11 rounded-full overflow-hidden border-3 transition-all ${editAvatar === av ? 'border-[#2563eb] scale-110 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'}`}
                  >
                    <img src={av} alt="Preset avatar" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {currentLangLabels.fullName} *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {currentLangLabels.username}
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value?.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. bashir_hardware"
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-mono text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {currentLangLabels.bio}
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  placeholder={currentLangLabels.bioPlaceholder}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800 font-semibold leading-relaxed"
                />
              </div>

              {/* Area Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {currentLanguage === 'en' ? 'Area / Locality' : 'علاقہ / محلہ'} *
                </label>
                <select
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold text-slate-800"
                >
                  <option value="Dhoke Hassu">Dhoke Hassu</option>
                  <option value="Dhoke Khabba">Dhoke Khabba</option>
                  <option value="Satellite Town">Satellite Town</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {currentLangLabels.contactPhone}
                </label>
                <input
                  type="tel"
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 03001234567"
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {currentLanguage === 'en' ? 'Gender' : 'صنف'} *
                </label>
                <select
                  value={editGender}
                  onChange={(e: any) => setEditGender(e.target.value as Gender)}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold text-slate-800"
                >
                  <option value="" disabled>{currentLanguage === 'en' ? 'Select Gender' : 'صنف منتخب کریں'}</option>
                  <option value="Male">{currentLanguage === 'en' ? 'Male' : 'مرد'}</option>
                  <option value="Female">{currentLanguage === 'en' ? 'Female' : 'عورت'}</option>
                  <option value="Prefer not to say">{currentLanguage === 'en' ? 'Prefer not to say' : 'ظاہر نہ کریں'}</option>
                </select>
              </div>
              <div>
                <DateOfBirthPicker
                  value={editDob}
                  onChange={setEditDob}
                  label={currentLanguage === 'en' ? 'Date of Birth' : 'تاریخ پیدائش'}
                />
              </div>
            </div>

            {/* Social Links Sub-section */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                {currentLangLabels.socialLinks}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-600 focus-within:bg-white transition-all">
                  <span className="p-3 bg-slate-100 text-blue-600 border-r border-slate-200">
                    <Facebook className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={editFb}
                    onChange={(e) => setEditFb(e.target.value)}
                    placeholder="facebook.com/yourname"
                    className="flex-1 px-3 py-2 text-xs focus:outline-none bg-transparent font-medium"
                  />
                </div>

                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-600 focus-within:bg-white transition-all">
                  <span className="p-3 bg-slate-100 text-sky-500 border-r border-slate-200">
                    <Twitter className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={editTw}
                    onChange={(e) => setEditTw(e.target.value)}
                    placeholder="twitter.com/yourname"
                    className="flex-1 px-3 py-2 text-xs focus:outline-none bg-transparent font-medium"
                  />
                </div>

                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-600 focus-within:bg-white transition-all">
                  <span className="p-3 bg-slate-100 text-blue-700 border-r border-slate-200">
                    <Linkedin className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={editLinkedin}
                    onChange={(e) => setEditLinkedin(e.target.value)}
                    placeholder="linkedin.com/in/yourname"
                    className="flex-1 px-3 py-2 text-xs focus:outline-none bg-transparent font-medium"
                  />
                </div>

                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-600 focus-within:bg-white transition-all">
                  <span className="p-3 bg-slate-100 text-slate-600 border-r border-slate-200">
                    <Globe className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={editWeb}
                    onChange={(e) => setEditWeb(e.target.value)}
                    placeholder="yourwebsite.com"
                    className="flex-1 px-3 py-2 text-xs focus:outline-none bg-transparent font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="py-2.5 px-5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {currentLangLabels.cancelBtn}
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer border-0"
              >
                {currentLangLabels.saveBtn}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // VIEW 2: RECENT ACTIVITY TIMELINE PATH OR TAB
  // VIEW 3: BADGES GRID PATH OR TAB
  // (We integrated them as both path and tab so it is robust for navigation)

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in" id="profile-main-view-container">
      {renderAvatarModal()}
      
      {/* Complete Profile Demographics Alert Prompt */}
      {(!profileData.gender || !profileData.dateOfBirth || profileData.gender === 'Unknown') && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold text-amber-850 uppercase tracking-wider">
                {currentLanguage === 'en' ? 'Complete Profile Demographics' : 'پروفائل کی معلومات مکمل کریں'}
              </h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-0.5 leading-relaxed">
                {currentLanguage === 'en' 
                  ? 'Please add your Gender and Date of Birth to participate in community polls.' 
                  : 'رائے دہی کے جائزوں میں حصہ لینے کے لئے براہ کرم اپنی صنف اور تاریخ پیدائش کی معلومات شامل کریں۔'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile/edit')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black uppercase rounded-xl transition-all shadow-xs border-0 cursor-pointer shrink-0"
          >
            {currentLanguage === 'en' ? 'Update Now' : 'ابھی تبدیل کریں'}
          </button>
        </div>
      )}

      {/* 1. FACEBOOK-INSPIRED PROFILE COVER & AVATAR BLOCK */}
      <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden relative">
        {/* Cover Photo */}
        <div className="h-48 sm:h-64 bg-slate-200 relative overflow-hidden group">
          <img src={profileData.coverPhoto} alt="Cover image" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <button 
            onClick={() => navigate('/profile/edit')}
            className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white text-[10px] sm:text-xs font-bold py-1.5 px-3 rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{currentLanguage === 'en' ? 'Edit Layout' : 'تبدیل کریں'}</span>
          </button>
        </div>

        {/* Profile Avatar Overlay & Bio Details */}
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col items-center sm:items-start gap-4">
            {/* Avatar Frame */}
            <div className="-mt-12 sm:-mt-16 relative z-10">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-lg relative group shrink-0 mx-auto sm:mx-0">
                <img src={profileData.profilePhoto} alt={profileData.fullName} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="w-full text-center sm:text-left space-y-1.5">
              <div className="flex items-center sm:justify-start justify-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  {profileData.fullName}
                </h2>
                
                {(profileData.verified || isEntityVerified(profileData.fullName)) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 shadow-xs animate-pulse">
                    <ShieldCheck className="w-3.5 h-3.5 text-action fill-current" />
                    {currentLangLabels.verifiedResident}
                  </span>
                )}
              </div>

              {profileData.username && (
                <p className="text-xs font-bold text-blue-600 font-mono">
                  @{profileData.username}
                </p>
              )}

              <div className="pt-1 select-none flex justify-center md:justify-start">
                <button
                  onClick={() => navigate('/verification')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                  id="go-to-verification-center-from-profile-btn"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 fill-blue-50" />
                  <span>{currentLanguage === 'en' ? 'Verification Center' : 'تصدیق کا مرکز'}</span>
                </button>
              </div>

              {/* Badges Quick Row */}
              <div className="flex flex-wrap justify-center md:justify-start gap-1.5 pt-1">
                {profileData.badges?.map(badgeId => {
                  const badge = BADGES_CONFIG.find(b => b.id === badgeId);
                  if (!badge) return null;
                  return (
                    <span 
                      key={badge.id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.bgColor} border shadow-xs`}
                      title={currentLanguage === 'en' ? badge.descEn : badge.descUr}
                    >
                      <span>{badge.icon}</span>
                      <span>{currentLanguage === 'en' ? badge.nameEn : badge.nameUr}</span>
                    </span>
                  );
                })}
              </div>

              {/* Map details */}
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3.5 text-[11px] text-slate-500 font-bold pt-1">
                <span className="flex items-center gap-1 bg-slate-100 py-1 px-2.5 rounded-lg border border-slate-200/50">
                  <MapPin className="w-3.5 h-3.5 text-[#2563eb]" />
                  <span>{profileData.area} Zone</span>
                </span>
                {profileData.gender && profileData.gender !== 'Unknown' && (
                  <span className="flex items-center gap-1 bg-slate-100 py-1 px-2.5 rounded-lg border border-slate-200/50">
                    <span>Gender: {profileData.gender}</span>
                  </span>
                )}
                {calculateAge(profileData.dateOfBirth) !== null && (
                  <span className="flex items-center gap-1 bg-slate-100 py-1 px-2.5 rounded-lg border border-slate-200/50">
                    <span>Age: {calculateAge(profileData.dateOfBirth)} yrs</span>
                  </span>
                )}
                <span className="flex items-center gap-1 bg-slate-100 py-1 px-2.5 rounded-lg border border-slate-200/50">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{currentLangLabels.memberSince}: {profileData.joinDate}</span>
                </span>
              </div>

              {/* Followers / Following Counts */}
              <div className="flex items-center gap-6 pt-3 justify-center md:justify-start">
                <button 
                  onClick={() => { setActiveFollowTab('followers'); setShowFollowModal(true); }}
                  className="flex flex-col hover:opacity-80 transition-opacity text-center md:text-left bg-transparent border-none cursor-pointer p-0"
                >
                  <span className="text-lg font-black text-slate-900 leading-none">{profileData.followers_count || 0}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-1">{currentLanguage === 'en' ? 'Followers' : 'فالوورز'}</span>
                </button>
                <button 
                  onClick={() => { setActiveFollowTab('following'); setShowFollowModal(true); }}
                  className="flex flex-col hover:opacity-80 transition-opacity text-center md:text-left bg-transparent border-none cursor-pointer p-0"
                >
                  <span className="text-lg font-black text-slate-900 leading-none">{profileData.following_count || 0}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-1">{currentLanguage === 'en' ? 'Following' : 'فالوونگ'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Edit Buttons */}
          <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:absolute sm:top-6 sm:right-6 justify-center">
            <button
              onClick={() => navigate('/profile/edit')}
              className="flex items-center justify-center gap-2 py-2 px-5 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-black rounded-full shadow-sm transition-all cursor-pointer border border-slate-300"
              id="edit-profile-main-btn"
            >
              <Edit className="w-4 h-4" />
              <span>{currentLangLabels.editProfileBtn}</span>
            </button>
          </div>
        </div>

        {/* Bio Text area */}
        {profileData.bio && (
          <div className="px-6 pb-6 pt-3 border-t border-slate-100 text-slate-600 text-xs sm:text-sm leading-relaxed text-center md:text-left font-medium whitespace-pre-line italic">
            "{profileData.bio}"
          </div>
        )}

        {/* Social Links Ribbon */}
        {profileData.socialLinks && (Object.values(profileData.socialLinks).some(Boolean)) && (
          <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex flex-wrap justify-center md:justify-start gap-4 text-xs font-semibold text-slate-500">
            {profileData.socialLinks.facebook && (
              <a href={`https://${profileData.socialLinks.facebook}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                <Facebook className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate max-w-[120px]">{profileData.socialLinks.facebook.replace('facebook.com/', '')}</span>
              </a>
            )}
            {profileData.socialLinks.twitter && (
              <a href={`https://${profileData.socialLinks.twitter}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-sky-500 transition-colors">
                <Twitter className="w-3.5 h-3.5 text-sky-400" />
                <span className="truncate max-w-[120px]">{profileData.socialLinks.twitter.replace('twitter.com/', '')}</span>
              </a>
            )}
            {profileData.socialLinks.linkedin && (
              <a href={`https://${profileData.socialLinks.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-800 transition-colors">
                <Linkedin className="w-3.5 h-3.5 text-blue-700" />
                <span className="truncate max-w-[120px]">{profileData.socialLinks.linkedin.replace('linkedin.com/in/', '')}</span>
              </a>
            )}
            {profileData.socialLinks.website && (
              <a href={`https://${profileData.socialLinks.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                <Globe className="w-3.5 h-3.5 text-slate-600" />
                <span className="truncate max-w-[120px]">{profileData.socialLinks.website}</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* 2. REPUTATION & LEVEL PROGRESS TRACKER CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm space-y-4 relative overflow-hidden" id="reputation-tracker-card">
        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-500" />
              {currentLangLabels.reputationSystem}
            </h3>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              {currentLangLabels.reputationInfo}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 border border-emerald-100 py-2.5 px-4 rounded-2xl shrink-0 shadow-xs">
            <span className="text-3xl font-black font-mono tracking-tight leading-none">
              {profileData.reputationScore}
            </span>
            <div className="text-left leading-none">
              <span className="block text-[9px] font-black uppercase tracking-wider text-emerald-600">Points</span>
              <span className="text-[10px] font-bold text-emerald-700 font-sans mt-0.5 block">{userRank.title}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1 bg-slate-100 py-0.5 px-2 rounded-md">
              🎯 Level Progress
            </span>
            <span>
              {profileData.reputationScore} / {nextTargetPoints} Pts to next level
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40 p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${levelProgressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${userRank.barColor} shadow-inner`}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-extrabold font-mono pt-0.5">
            <span>{currentLevelMin} Pts</span>
            <span>{nextTargetPoints} Pts</span>
          </div>
        </div>

        {/* REPUTATION PLAYGROUND SIMULATOR (Brilliant Craftsmanship!) */}
        <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            {currentLangLabels.simulatorTitle}
          </h4>
          <p className="text-[10px] text-slate-500 leading-normal mb-3.5">
            {currentLangLabels.simulatorDesc}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              onClick={() => addReputationPoints(10, 'Created useful community post', 'مفید کمیونٹی پوسٹ لکھنے پر', 'post')}
              className="py-2 px-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-[10px] font-bold rounded-xl transition-all cursor-pointer text-left flex items-center gap-2 shadow-xs group"
            >
              <span className="text-xs bg-blue-50 text-blue-600 p-1 rounded-md group-hover:bg-blue-100">📝</span>
              <span className="truncate">{currentLangLabels.simPost}</span>
            </button>

            <button
              onClick={() => addReputationPoints(5, 'Received positive reaction on list', 'پوسٹ پر پسندیدگی ملنے پر', 'reaction')}
              className="py-2 px-3 bg-white hover:bg-pink-50 border border-slate-200 hover:border-pink-300 text-slate-700 hover:text-pink-700 text-[10px] font-bold rounded-xl transition-all cursor-pointer text-left flex items-center gap-2 shadow-xs group"
            >
              <span className="text-xs bg-pink-50 text-pink-500 p-1 rounded-md group-hover:bg-pink-100">❤️</span>
              <span className="truncate">{currentLangLabels.simLike}</span>
            </button>

            <button
              onClick={() => addReputationPoints(15, 'Participated in neighborhood help chat', 'ہمسائے کی مدد کرنے پر', 'comment')}
              className="py-2 px-3 bg-white hover:bg-green-50 border border-slate-200 hover:border-green-300 text-slate-700 hover:text-green-700 text-[10px] font-bold rounded-xl transition-all cursor-pointer text-left flex items-center gap-2 shadow-xs group"
            >
              <span className="text-xs bg-green-50 text-green-600 p-1 rounded-md group-hover:bg-green-100">💬</span>
              <span className="truncate">{currentLangLabels.simComment}</span>
            </button>

            <button
              onClick={() => addReputationPoints(20, 'Reported municipal gas utility issue', 'مسئلے کی نشاندہی کرنے پر', 'report')}
              className="py-2 px-3 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-700 text-[10px] font-bold rounded-xl transition-all cursor-pointer text-left flex items-center gap-2 shadow-xs group"
            >
              <span className="text-xs bg-amber-50 text-amber-600 p-1 rounded-md group-hover:bg-amber-100">⚠️</span>
              <span className="truncate">{currentLangLabels.simReport}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. BENTO STATS GRID */}
      <div className="space-y-3" id="bento-stats-container">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
          📊 {currentLangLabels.statsTitle}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Posts */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 text-center shadow-xs flex flex-col justify-between">
            <span className="block text-xl font-black text-slate-900 font-mono">{ownPosts.length}</span>
            <span className="text-[9px] text-slate-400 font-bold block leading-snug mt-1">{currentLangLabels.posts}</span>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 text-center shadow-xs flex flex-col justify-between">
            <span className="block text-xl font-black text-slate-900 font-mono">24</span>
            <span className="text-[9px] text-slate-400 font-bold block leading-snug mt-1">{currentLangLabels.comments}</span>
          </div>

          {/* Events */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 text-center shadow-xs flex flex-col justify-between">
            <span className="block text-xl font-black text-slate-900 font-mono">4</span>
            <span className="text-[9px] text-slate-400 font-bold block leading-snug mt-1">{currentLangLabels.events}</span>
          </div>

          {/* Marketplace */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 text-center shadow-xs flex flex-col justify-between">
            <span className="block text-xl font-black text-slate-900 font-mono">{ownMarketplace.length}</span>
            <span className="text-[9px] text-slate-400 font-bold block leading-snug mt-1">{currentLangLabels.marketplace}</span>
          </div>

          {/* Businesses */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 text-center shadow-xs flex flex-col justify-between">
            <span className="block text-xl font-black text-slate-900 font-mono">{ownBusinesses.length}</span>
            <span className="text-[9px] text-slate-400 font-bold block leading-snug mt-1">{currentLangLabels.businesses}</span>
          </div>

          {/* Jobs */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 text-center shadow-xs flex flex-col justify-between">
            <span className="block text-xl font-black text-slate-900 font-mono">{ownJobs.length}</span>
            <span className="text-[9px] text-slate-400 font-bold block leading-snug mt-1">{currentLangLabels.jobs}</span>
          </div>

          {/* Services */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 text-center shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="block text-xl font-black text-slate-900 font-mono">{ownServices.length}</span>
            <span className="text-[9px] text-slate-400 font-bold block leading-snug mt-1">{currentLangLabels.services}</span>
          </div>
        </div>
      </div>

      {/* 4. TABS NAVIGATION & DETAILS VIEW */}
      <div className="space-y-4" id="profile-tabs-container">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 font-bold text-xs">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3 px-5 transition-colors border-b-2 font-black cursor-pointer uppercase tracking-wider ${activeTab === 'posts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            📌 {currentLangLabels.postsTab}
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-3 px-5 transition-colors border-b-2 font-black cursor-pointer uppercase tracking-wider ${activeTab === 'activity' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            🕒 {currentLangLabels.activityTab}
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`py-3 px-5 transition-colors border-b-2 font-black cursor-pointer uppercase tracking-wider ${activeTab === 'badges' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            🎖️ {currentLangLabels.badgesTab}
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`py-3 px-5 transition-colors border-b-2 font-black cursor-pointer uppercase tracking-wider ${activeTab === 'saved' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            🔖 {currentLangLabels.savedTab}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="min-h-48" id="profile-tab-content-area">
          <AnimatePresence mode="wait">
            {/* MY POSTS TAB */}
            {activeTab === 'posts' && (
              <motion.div
                key="posts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {ownPosts.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm text-slate-400 text-xs">
                    <p className="font-semibold">{currentLangLabels.noPosts}</p>
                  </div>
                ) : (
                  ownPosts.map(post => (
                    <div key={post.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs space-y-3 text-left">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <img src={profileData.profilePhoto} alt={profileData.fullName} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-xs">{profileData.fullName}</h4>
                            <p className="text-[10px] text-slate-400">{post.time || '1 day ago'} • {post.area}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{post.content}</p>
                      
                      {post.image && (
                        <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                          <img src={post.image} alt="Post asset" className="w-full h-auto object-contain block" />
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 font-bold">
                        <span>❤️ {post.likes} Likes</span>
                        <span>💬 {post.commentsCount} Comments</span>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* RECENT ACTIVITY TIMELINE */}
            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-3xl border border-slate-200/60 p-5 sm:p-6 shadow-sm">
                  {activities.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                      {currentLangLabels.noActivity}
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-slate-100 pl-5 ml-2.5 space-y-6 text-left">
                      {activities.map((act) => (
                        <div key={act.id} className="relative">
                          {/* Dot Badge */}
                          <span className="absolute -left-[31px] top-0.5 bg-white border-2 border-[#2563eb] w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm">
                            {act.icon}
                          </span>

                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-800">
                              {currentLanguage === 'en' ? act.detailsEn : act.detailsUr}
                            </p>
                            <span className="text-[10px] text-slate-400 font-bold font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-300" />
                              {act.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* MY BADGES GALLERY GRID */}
            {activeTab === 'badges' && (
              <motion.div
                key="badges"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
              >
                {BADGES_CONFIG.map((badge) => {
                  const unlocked = (profileData.badges || []).includes(badge.id);
                  return (
                    <div 
                      key={badge.id}
                      className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between text-left relative overflow-hidden transition-all duration-200 ${
                        unlocked 
                          ? 'border-emerald-200 hover:border-emerald-400' 
                          : 'border-slate-200 bg-slate-50/50 opacity-60'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl">{badge.icon}</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            unlocked 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200/50'
                          }`}>
                            {unlocked ? currentLangLabels.unlocked : currentLangLabels.locked}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-slate-900 leading-tight">
                            {currentLanguage === 'en' ? badge.nameEn : badge.nameUr}
                          </h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                            {currentLanguage === 'en' ? badge.descEn : badge.descUr}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 mt-3 text-[9px] text-slate-400 font-bold font-mono uppercase tracking-wider">
                        {currentLangLabels.pointsPrefix} {badge.pointsRequired} Pts
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* SAVED LISTINGS */}
            {activeTab === 'saved' && (
              <motion.div
                key="saved"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {savedItemsList.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm text-slate-400 text-xs font-semibold">
                    {currentLangLabels.noSaved}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {savedItemsList.map((item) => (
                      <div 
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200/60 p-3 shadow-xs hover:border-blue-300 transition-all flex gap-3 text-left relative group cursor-pointer"
                        onClick={() => {
                          if (item.type === 'deal') navigate('/deals/detail', item.id);
                          if (item.type === 'property') navigate('/property/detail', item.id);
                        }}
                      >
                        {item.image && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-1 flex flex-col justify-center">
                          <span className="inline-block text-[8px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded leading-none w-max">
                            {item.type}
                          </span>
                          <h4 className="text-xs font-extrabold text-slate-900 truncate leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold leading-none">
                            🏢 {item.subtitle} • 📍 {item.area}
                          </p>
                        </div>

                        {/* Remove saved item */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSavedItemsList(prev => prev.filter(i => i.id !== item.id));
                          }}
                          className="absolute top-2.5 right-2.5 p-1 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg border border-slate-200/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Remove saved"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showFollowModal && (
        <FollowListModal
          isOpen={true}
          userId={profileData.id}
          viewerId={user.id}
          isEn={currentLanguage === 'en'}
          onClose={() => setShowFollowModal(false)}
          initialTab={activeFollowTab}
          currentUser={{ id: user.id }}
          onNavigateToProfile={() => setShowFollowModal(false)}
        />
      )}
    </div>
  );
}
