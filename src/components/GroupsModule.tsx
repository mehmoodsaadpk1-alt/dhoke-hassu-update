import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, X, Check, Users, Lock, Unlock, MoreVertical, 
  Edit2, Trash2, Pin, Share2, UserMinus, ChevronRight, 
  BookOpen, Shield, Info, Flag, AlertTriangle, ArrowLeft,
  Camera, Image as ImageIcon, Send, MessageCircle, Heart, UserPlus, LogOut, CheckCircle2
} from 'lucide-react';
import { GroupItem, GroupPost, AdItem } from '../types';
import { dbGetActiveAds } from '../utils/supabaseClient';
import AdBannerCard from './AdBannerCard';
import { useAdRotator } from '../hooks/useAdRotator';

interface GroupsModuleProps {
  groups: GroupItem[];
  onUpdateGroups: (groups: GroupItem[]) => void;
  currentUser: { fullName: string; profilePhoto?: string; area: string };
  currentLanguage: 'en' | 'ur';
  currentPath: string;
  onNavigate: (path: string, paramId?: string) => void;
  selectedGroupId: string | null;
  onSelectGroupId: (id: string | null) => void;
}

const CATEGORIES = [
  'Neighborhood',
  'Business',
  'Education',
  'Sports',
  'Religious',
  'Volunteers',
  'Buy & Sell',
  'Other'
];

const CATEGORIES_UR = {
  'Neighborhood': 'پڑوس',
  'Business': 'کاروبار',
  'Education': 'تعلیم',
  'Sports': 'کھیل',
  'Religious': 'مذہبی',
  'Volunteers': 'رضاکار',
  'Buy & Sell': 'خرید و فروخت',
  'Other': 'دیگر'
};
export default function GroupsModule({
  groups,
  onUpdateGroups,
  currentUser,
  currentLanguage,
  currentPath,
  onNavigate,
  selectedGroupId,
  onSelectGroupId
}: GroupsModuleProps) {
  const groupsBannerMap = useAdRotator('Public Groups', 1, 1, 'Banner');
  const groupsAdMap = useAdRotator('Public Groups', 200, 5, 'Feed');
  const isUr = currentLanguage === 'ur';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create form states
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Neighborhood');
  const [newArea, setNewArea] = useState(currentUser.area || 'Dhoke Hassu');
  const [newDescription, setNewDescription] = useState('');
  const [newCover, setNewCover] = useState('');
  const [newPrivacy, setNewPrivacy] = useState<'Public' | 'Private'>('Public');
  const [newRules, setNewRules] = useState<string>('');

  // Edit form states (for group management)
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCover, setEditCover] = useState('');
  const [editPrivacy, setEditPrivacy] = useState<'Public' | 'Private'>('Public');
  const [editRules, setEditRules] = useState<string>('');

  // Detail post compose state
  const [groupPostText, setGroupPostText] = useState('');

  // Modals / sub-views
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [inviteeName, setInviteeName] = useState('');

  // Mock initial load delay on category/search filter
  useEffect(() => {
    if (searchTerm || selectedCategory) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, selectedCategory]);

  const activeView = (() => {
    if (currentPath === '/groups/create') return 'create';
    if (currentPath === '/groups/manage') return 'manage';
    if (currentPath === '/groups/detail') return 'detail';
    return 'list';
  })();

  const currentGroup = groups.find(g => g.id === selectedGroupId);

  // Filtered Groups
  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.name?.toLowerCase().includes(searchTerm?.toLowerCase()) || 
                          g.description?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
                          g.area?.toLowerCase().includes(searchTerm?.toLowerCase());
    const matchesCategory = !selectedCategory || g.category === selectedCategory;
    return matchesSearch && matchesCategory && !g.reported;
  });


  // Handle Join/Leave
  const handleJoinLeave = (group: GroupItem) => {
    const isMember = group.members.includes(currentUser.fullName);
    const isRequested = group.requests?.includes(currentUser.fullName);

    const updatedGroups = groups.map(g => {
      if (g.id === group.id) {
        if (isMember) {
          // Leave group
          const newMembers = g.members.filter(m => m !== currentUser.fullName);
          const newAdmins = g.admins.filter(a => a !== currentUser.fullName);
          return {
            ...g,
            members: newMembers,
            admins: newAdmins.length === 0 ? [g.creator] : newAdmins,
            memberCount: Math.max(0, g.memberCount - 1)
          };
        } else if (isRequested) {
          // Cancel private request
          return {
            ...g,
            requests: g.requests?.filter(r => r !== currentUser.fullName) || []
          };
        } else {
          // Join or request
          if (g.privacy === 'Private') {
            const currentReqs = g.requests || [];
            if (!currentReqs.includes(currentUser.fullName)) {
              return {
                ...g,
                requests: [...currentReqs, currentUser.fullName]
              };
            }
          } else {
            return {
              ...g,
              members: [...g.members, currentUser.fullName],
              memberCount: g.memberCount + 1
            };
          }
        }
      }
      return g;
    });

    onUpdateGroups(updatedGroups);

    // Show nice alert
    if (isMember) {
      alert(isUr ? 'آپ نے گروپ چھوڑ دیا ہے۔' : `Left "${group.name}" successfully.`);
    } else {
      if (group.privacy === 'Private') {
        alert(isUr ? 'شراکت کی درخواست بھیج دی گئی ہے۔ ایڈمن کی منظوری کا انتظار کریں۔' : 'Join request sent! Pending admin approval.');
      } else {
        alert(isUr ? 'آپ گروپ میں شامل ہو گئے ہیں!' : `Joined "${group.name}" successfully!`);
      }
    }
  };

  // Report Group
  const handleReportGroup = (group: GroupItem) => {
    const confirmReport = window.confirm(
      isUr ? 'کیا آپ اس گروپ کو رپورٹ کرنا چاہتے ہیں؟' : 'Are you sure you want to report this group for community guideline violations?'
    );
    if (confirmReport) {
      const updated = groups.map(g => g.id === group.id ? { ...g, reported: true } : g);
      onUpdateGroups(updated);
      alert(isUr ? 'شکریہ! گروپ کو ریویو کے لیے مارک کر دیا گیا ہے۔' : 'Thank you. The group has been reported and sent to moderators for review.');
      if (selectedGroupId === group.id) {
        onSelectGroupId(null);
        onNavigate('/groups');
      }
    }
  };

  // Create Group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName?.trim() || !newDescription?.trim()) {
      alert(isUr ? 'براہ کرم تمام لازمی فیلڈز پُر کریں۔' : 'Please fill out all required fields.');
      return;
    }

    const defaultCovers = {
      'Neighborhood': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
      'Business': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600',
      'Education': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=600',
      'Sports': 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=600',
      'Religious': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=600',
      'Volunteers': 'https://images.unsplash.com/photo-1559027615-cd448753230d?auto=format&fit=crop&q=80&w=600',
      'Buy & Sell': 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=600',
      'Other': 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=600',
    };

    const finalCover = newCover?.trim() || defaultCovers[newCategory as keyof typeof defaultCovers] || defaultCovers['Other'];
    const rulesList = newRules?.trim() ? newRules?.split('\n').filter(r => r?.trim() !== '') : [
      'Respect all group members.',
      'No spam or irrelevant marketing.',
      'Help build a peaceful and connected neighborhood.'
    ];

    const newGroup: GroupItem = {
      id: `group-${Date.now()}`,
      name: newName,
      category: newCategory,
      area: newArea,
      description: newDescription,
      coverImage: finalCover,
      privacy: newPrivacy,
      memberCount: 1,
      rules: rulesList,
      admins: [currentUser.fullName],
      creator: currentUser.fullName,
      members: [currentUser.fullName],
      requests: [],
      recentPosts: [
        {
          id: `gp-1`,
          author: 'System Admin',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
          content: `Welcome to the newly created ${newName} group! Let's connect, share, and support each other.`,
          time: 'Just now',
          pinned: true
        }
      ]
    };

    onUpdateGroups([newGroup, ...groups]);
    alert(isUr ? 'گروپ کامیابی کے ساتھ بنا دیا گیا ہے!' : `Group "${newName}" created successfully!`);
    
    // Clear form
    setNewName('');
    setNewDescription('');
    setNewCover('');
    setNewRules('');
    setNewPrivacy('Public');

    // Select and Navigate
    onSelectGroupId(newGroup.id);
    onNavigate('/groups/detail');
  };

  // Group Detail - Post Compose
  const handleGroupPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupPostText?.trim() || !selectedGroupId) return;

    const newPost: GroupPost = {
      id: `gpost-${Date.now()}`,
      author: currentUser.fullName,
      avatar: currentUser.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
      content: groupPostText,
      time: 'Just now'
    };

    const updated = groups.map(g => {
      if (g.id === selectedGroupId) {
        return {
          ...g,
          recentPosts: [newPost, ...(g.recentPosts || [])]
        };
      }
      return g;
    });

    onUpdateGroups(updated);
    setGroupPostText('');
    alert(isUr ? 'پوسٹ شائع کر دی گئی ہے۔' : 'Post published to the group!');
  };

  // Group Management - Initialize values when path changes to manage
  useEffect(() => {
    if (activeView === 'manage' && currentGroup) {
      setEditName(currentGroup.name);
      setEditCategory(currentGroup.category);
      setEditArea(currentGroup.area);
      setEditDescription(currentGroup.description);
      setEditCover(currentGroup.coverImage);
      setEditPrivacy(currentGroup.privacy);
      setEditRules(currentGroup.rules?.join('\n') || '');
    }
  }, [activeView, selectedGroupId]);

  // Save changes from Edit form
  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup) return;

    const updated = groups.map(g => {
      if (g.id === currentGroup.id) {
        return {
          ...g,
          name: editName,
          category: editCategory,
          area: editArea,
          description: editDescription,
          coverImage: editCover,
          privacy: editPrivacy,
          rules: editRules?.split('\n').filter(r => r?.trim() !== '')
        };
      }
      return g;
    });

    onUpdateGroups(updated);
    alert(isUr ? 'گروپ کی تفصیلات کامیابی سے اپ ڈیٹ ہو گئیں۔' : 'Group details updated successfully!');
    onNavigate('/groups/detail');
  };

  // Approve member request (Private groups)
  const handleApproveRequest = (memberName: string) => {
    if (!currentGroup) return;

    const updated = groups.map(g => {
      if (g.id === currentGroup.id) {
        return {
          ...g,
          requests: g.requests?.filter(r => r !== memberName) || [],
          members: [...g.members, memberName],
          memberCount: g.memberCount + 1
        };
      }
      return g;
    });

    onUpdateGroups(updated);
    alert(isUr ? `${memberName} کی درخواست منظور کر لی گئی ہے۔` : `Approved ${memberName}'s join request.`);
  };

  // Reject/Delete member request
  const handleRejectRequest = (memberName: string) => {
    if (!currentGroup) return;

    const updated = groups.map(g => {
      if (g.id === currentGroup.id) {
        return {
          ...g,
          requests: g.requests?.filter(r => r !== memberName) || []
        };
      }
      return g;
    });

    onUpdateGroups(updated);
    alert(isUr ? `${memberName} کی درخواست خارج کر دی گئی ہے۔` : `Declined join request from ${memberName}.`);
  };

  // Remove member from group
  const handleRemoveMember = (memberName: string) => {
    if (!currentGroup) return;

    const updated = groups.map(g => {
      if (g.id === currentGroup.id) {
        return {
          ...g,
          members: g.members.filter(m => m !== memberName),
          admins: g.admins.filter(a => a !== memberName),
          memberCount: Math.max(1, g.memberCount - 1)
        };
      }
      return g;
    });

    onUpdateGroups(updated);
    alert(isUr ? `${memberName} کو گروپ سے نکال دیا گیا ہے۔` : `Removed ${memberName} from the group.`);
  };

  // Pin important post
  const handlePinPost = (postId: string) => {
    if (!currentGroup) return;

    const updated = groups.map(g => {
      if (g.id === currentGroup.id) {
        const posts = g.recentPosts?.map(p => {
          if (p.id === postId) {
            return { ...p, pinned: !p.pinned };
          }
          return p;
        });
        return { ...g, recentPosts: posts };
      }
      return g;
    });

    onUpdateGroups(updated);
  };

  // Delete post from group
  const handleDeletePost = (postId: string) => {
    if (!currentGroup) return;

    const updated = groups.map(g => {
      if (g.id === currentGroup.id) {
        return {
          ...g,
          recentPosts: g.recentPosts?.filter(p => p.id !== postId)
        };
      }
      return g;
    });

    onUpdateGroups(updated);
    alert(isUr ? 'پوسٹ حذف کر دی گئی ہے۔' : 'Post removed.');
  };

  // Invite user simulation
  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteeName?.trim()) return;
    alert(isUr 
      ? `دعوت نامہ کامیابی کے ساتھ ${inviteeName} کو بھیج دیا گیا ہے!` 
      : `Invitation successfully sent to ${inviteeName}!`
    );
    setInviteeName('');
    setShowInviteModal(false);
  };

  // Share link simulation
  const handleCopyLink = () => {
    const simulatedLink = `https://dh-connect.pk/groups/detail?id=${selectedGroupId}`;
    navigator.clipboard.writeText(simulatedLink);
    alert(isUr ? 'لنک کاپی ہو گیا ہے!' : 'Group link copied to clipboard!');
    setShowShareModal(false);
  };

  const handleShareToChat = (targetName: string) => {
    const messageBody = isUr 
      ? `گروپ "${currentGroup?.name}" جوائن کریں: https://dh-connect.pk/groups/detail?id=${selectedGroupId}` 
      : `Join our community group "${currentGroup?.name}": https://dh-connect.pk/groups/detail?id=${selectedGroupId}`;
    try {
      const storedMsgs = localStorage.getItem(`dh_chat_history_${targetName}`);
      const parsedMsgs = storedMsgs ? JSON.parse(storedMsgs) : [];
      const newMsg = {
        id: `msg-${Date.now()}`,
        sender: 'Me',
        text: messageBody,
        time: 'Just now'
      };
      localStorage.setItem(`dh_chat_history_${targetName}`, JSON.stringify([...parsedMsgs, newMsg]));
    } catch {}

    alert(isUr 
      ? `گروپ لنک کامیابی کے ساتھ ${targetName} کے چیٹ پر بھیج دیا گیا ہے!` 
      : `Group link successfully shared to ${targetName}'s chat!`
    );
    setShowShareModal(false);
  };

  // RENDER 1: LIST VIEW
  if (activeView === 'list') {
    return (
      <div className="space-y-6" id="groups-list-view">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              👥 {isUr ? 'لوکل کمیونٹی گروپس' : 'Community Groups'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isUr 
                ? 'اپنے ہمسایوں، کھیلوں، پیشوں اور دلچسپیوں سے جڑیں' 
                : 'Connect with neighbors, sports leagues, local businesses, and social circles.'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('/groups/create')}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer w-full sm:w-auto"
            id="create-group-btn"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            <span>{isUr ? 'نیا گروپ بنائیں' : 'Create Group'}</span>
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-xs space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isUr ? 'گروپ کا نام، تفصیل یا علاقہ تلاش کریں...' : 'Search groups by name, description, area...'}
              className="w-full ps-10 pe-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Horizontal scroll category tags */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2 px-1">
              {isUr ? 'زمرہ کے لحاظ سے فلٹر کریں' : 'Filter by Category'}
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`py-1.5 px-3.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${!selectedCategory ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
              >
                🌐 {isUr ? 'تمام گروپس' : 'All'}
              </button>
              {CATEGORIES.map(cat => {
                const catLabel = isUr ? CATEGORIES_UR[cat as keyof typeof CATEGORIES_UR] || cat : cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`py-1.5 px-3.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                  >
                    {catLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {/* LOADING & EMPTY STATES */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-xs">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-xs font-bold text-slate-500">{isUr ? 'برائے مہربانی انتظار کریں...' : 'Loading groups...'}</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-xs space-y-4 max-w-lg mx-auto">
            <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-slate-900 text-base">{isUr ? 'کوئی گروپ نہیں ملا' : 'No Groups Found'}</h3>
              <p className="text-xs text-slate-500">
                {isUr 
                  ? 'ہمارے پاس اس فلٹر کے لیے کوئی گروپ نہیں ہے۔ آپ پہلا گروپ بنا سکتے ہیں!' 
                  : "We couldn't find any groups matching your criteria. Try adjusting your search or category, or create a brand new group!"}
              </p>
            </div>
            <button
              onClick={() => onNavigate('/groups/create')}
              className="inline-flex py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
            >
              {isUr ? 'نیا گروپ بنائیں' : 'Create Group Now'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="groups-grid">
            {(() => {
              const elements = [];
              for (let i = 0; i < filteredGroups.length; i++) {
                const group = filteredGroups[i];
                const isMember = group.members.includes(currentUser.fullName);
                const isRequested = group.requests?.includes(currentUser.fullName);
                const catLabel = isUr ? CATEGORIES_UR[group.category as keyof typeof CATEGORIES_UR] || group.category : group.category;
                const ad = groupsAdMap[i];

                elements.push(
                  <div 
                    key={group.id} 
                    className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
                    id={`group-card-${group.id}`}
                  >
                    <div>
                      <div className="relative h-40 bg-slate-100 overflow-hidden">
                        <img src={group.coverImage} alt={group.name} className="w-full h-full object-cover" />
                        <span className={`absolute top-3 end-3 inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full text-white shadow-md ${group.privacy === 'Private' ? 'bg-red-600' : 'bg-green-600'}`}>
                          {group.privacy === 'Private' ? (
                            <>
                              <Lock className="w-2.5 h-2.5 stroke-[3px]" />
                              <span>{isUr ? 'پرائیویٹ' : 'Private'}</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-2.5 h-2.5 stroke-[3px]" />
                              <span>{isUr ? 'پبلک' : 'Public'}</span>
                            </>
                          )}
                        </span>
                        <span className="absolute bottom-3 start-3 inline-flex items-center text-[10px] font-black bg-slate-900/80 text-white px-2.5 py-1 rounded-md backdrop-blur-xs">
                          {catLabel}
                        </span>
                      </div>
                      <div className="p-5 space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-extrabold text-slate-900 text-base leading-tight hover:text-blue-600 transition-colors cursor-pointer" onClick={() => { onSelectGroupId(group.id); onNavigate('/groups/detail'); }}>
                            {group.name}
                          </h3>
                          <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                            📍 {group.area}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {group.description}
                        </p>
                        <div className="flex items-center gap-1.5 pt-1.5 text-[11px] font-bold text-slate-500">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{group.memberCount} {isUr ? 'ممبرز' : 'Members'}</span>
                          {group.creator === currentUser.fullName && (
                            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-black border border-blue-100">
                              ⭐ {isUr ? 'آپ ایڈمن ہیں' : 'Admin'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex gap-3 bg-slate-50/50">
                      <button
                        onClick={() => { onSelectGroupId(group.id); onNavigate('/groups/detail'); }}
                        className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-white"
                      >
                        <span>{isUr ? 'تفصیل دیکھیں' : 'View Group'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleJoinLeave(group)}
                        className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                          isMember ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-red-650' : isRequested ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isMember ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3px]" />
                            <span>{isUr ? 'شامل ہیں' : 'Joined'}</span>
                          </>
                        ) : isRequested ? (
                          <>
                            <Info className="w-3.5 h-3.5" />
                            <span>{isUr ? 'درخواست بھیجی گئی' : 'Requested'}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                            <span>{isUr ? 'شامل ہوں' : 'Join'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );

                // Inject Public Groups active ad via rotation
                if (ad) {
                  elements.push(
                    <div key={`ad-groups-${i}-${ad.id}`} className="md:col-span-2">
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

  // RENDER 2: DETAIL VIEW
  if (activeView === 'detail') {
    if (!currentGroup) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-xs space-y-4">
          <div className="text-red-500 text-3xl">⚠️</div>
          <p className="text-slate-600 font-bold">{isUr ? 'گروپ نہیں ملا یا حذف کر دیا گیا ہے۔' : 'Group not found or has been removed.'}</p>
          <button onClick={() => onNavigate('/groups')} className="py-2 px-5 bg-blue-600 text-white font-bold rounded-xl text-xs cursor-pointer">
            {isUr ? 'گروپس کی لسٹ پر واپس جائیں' : 'Back to Groups'}
          </button>
        </div>
      );
    }

    const isMember = currentGroup.members.includes(currentUser.fullName);
    const isRequested = currentGroup.requests?.includes(currentUser.fullName);
    const isAdmin = currentGroup.admins.includes(currentUser.fullName) || currentGroup.creator === currentUser.fullName;
    const catLabel = isUr ? CATEGORIES_UR[currentGroup.category as keyof typeof CATEGORIES_UR] || currentGroup.category : currentGroup.category;

    // Sorting posts: pinned posts first
    const sortedPosts = [...(currentGroup.recentPosts || [])].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

    return (
      <div className="space-y-6" id="group-detail-view">
        {/* Back Button */}
        <button
          onClick={() => {
            onSelectGroupId(null);
            onNavigate('/groups');
          }}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 hover:bg-slate-100 rounded-xl text-slate-600 text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isUr ? 'گروپس لسٹ پر واپس جائیں' : 'Back to Groups'}</span>
        </button>

        {/* Group Hero/Cover card */}
        <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm">
          <div className="relative h-56 sm:h-64 bg-slate-200">
            <img src={currentGroup.coverImage} alt={currentGroup.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            
            {/* Header info layered on cover */}
            <div className="absolute bottom-6 start-6 end-6 text-white space-y-2">
              <span className="inline-flex items-center text-[9px] font-black bg-blue-600 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                {catLabel}
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight drop-shadow-md">
                {currentGroup.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-200 font-semibold">
                <span className="flex items-center gap-1">📍 {currentGroup.area}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {currentGroup.memberCount} {isUr ? 'ممبرز' : 'Members'}</span>
                <span>•</span>
                <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded">
                  {currentGroup.privacy === 'Private' ? isUr ? 'پرائیویٹ گروپ' : 'Private Group' : isUr ? 'پبلک گروپ' : 'Public Group'}
                </span>
              </div>
            </div>

            {/* Quick Report option */}
            <button
              onClick={() => handleReportGroup(currentGroup)}
              className="absolute top-4 end-4 bg-black/40 backdrop-blur-xs hover:bg-red-600/90 text-white p-2 rounded-full shadow-md transition-all cursor-pointer"
              title="Report Group"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>

          {/* Core action buttons */}
          <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              {/* Join/Leave Button */}
              <button
                onClick={() => handleJoinLeave(currentGroup)}
                className={`py-2 px-5 text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isMember 
                    ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100' 
                    : isRequested 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isMember ? (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>{isUr ? 'گروپ چھوڑیں' : 'Leave Group'}</span>
                  </>
                ) : isRequested ? (
                  <>
                    <Info className="w-4 h-4" />
                    <span>{isUr ? 'درخواست بھیجی گئی ہے' : 'Requested'}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 stroke-[3px]" />
                    <span>{isUr ? 'گروپ جوائن کریں' : 'Join Group'}</span>
                  </>
                )}
              </button>

              {/* Invite button */}
              {isMember && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isUr ? 'ممبرز کو مدعو کریں' : 'Invite'}</span>
                </button>
              )}

              {/* Share button */}
              <button
                onClick={() => setShowShareModal(true)}
                className="py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>{isUr ? 'لنک شیئر کریں' : 'Share'}</span>
              </button>
            </div>

            {/* Admin Management Button */}
            {isAdmin && (
              <button
                onClick={() => onNavigate('/groups/manage')}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isUr ? 'گروپ مینجمنٹ' : 'Manage Group'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 2 Column Layout: Details sidebar and Posts feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT PANEL: Group Info Details */}
          <div className="space-y-6 lg:col-span-1">
            {/* Description & Rules info block */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  ℹ️ {isUr ? 'گروپ کے بارے میں' : 'About This Group'}
                </h3>
                <p className="text-xs font-medium text-slate-700 leading-relaxed">
                  {currentGroup.description}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  🛡️ {isUr ? 'گروپ کے اصول' : 'Group Rules'}
                </h3>
                <ul className="space-y-2">
                  {currentGroup.rules?.map((rule, rIdx) => (
                    <li key={rIdx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                      <span className="text-blue-500 font-extrabold mt-0.5 shrink-0">✓</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  👑 {isUr ? 'ایڈمنز' : 'Group Admins'}
                </h3>
                <div className="space-y-2">
                  {currentGroup.admins.map((admin, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[10px] flex items-center justify-center shadow-xs">
                        {admin[0]}
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate">{admin}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Posts composer and feed */}
          <div className="space-y-6 lg:col-span-2">
            {/* Post composer */}
            {isMember ? (
              <form onSubmit={handleGroupPostSubmit} className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                    {currentUser.fullName[0]}
                  </div>
                  <textarea
                    value={groupPostText}
                    onChange={(e) => setGroupPostText(e.target.value)}
                    placeholder={isUr ? 'گروپ میں کچھ شیئر کریں...' : 'Share something with this group...'}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:ring-2 focus:ring-blue-100 border-0 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none transition-all resize-none h-16"
                  />
                </div>
                <div className="flex justify-end border-t border-slate-100 pt-2.5">
                  <button
                    type="submit"
                    disabled={!groupPostText?.trim()}
                    className="py-1.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-extrabold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isUr ? 'پوسٹ کریں' : 'Post to Group'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-blue-50/50 rounded-2xl border border-blue-200 p-4 text-center">
                <p className="text-xs text-blue-700 font-bold">
                  🔒 {isUr 
                    ? 'صرف اس گروپ کے ممبرز ہی پوسٹ کر سکتے ہیں اور پوسٹس دیکھ سکتے ہیں۔' 
                    : 'Only group members can read and publish posts in this group.'}
                </p>
              </div>
            )}

            {/* Posts Feed */}
            {isMember && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
                  📰 {isUr ? 'حالیہ سرگرمی' : 'Recent Posts'}
                </h3>
                {sortedPosts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center text-slate-400 text-xs font-medium shadow-xs">
                    {isUr ? 'اس گروپ میں ابھی تک کوئی پوسٹ نہیں کی گئی ہے۔' : 'No posts yet in this group. Be the first to start the conversation!'}
                  </div>
                ) : (
                  sortedPosts.map(post => (
                    <div key={post.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs space-y-3 relative">
                      {/* Pinned Marker banner */}
                      {post.pinned && (
                        <div className="absolute top-0 start-0 end-0 h-1 bg-blue-500 rounded-t-2xl" />
                      )}

                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={post.avatar} 
                            alt={post.author} 
                            className="w-8 h-8 rounded-full object-cover border border-slate-100 shadow-xs cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all"
                            data-profile-name={post.author}
                            data-profile-avatar={post.avatar}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 
                                className="font-extrabold text-slate-900 text-xs cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                                data-profile-name={post.author}
                                data-profile-avatar={post.avatar}
                              >
                                {post.author}
                              </h4>
                              {post.pinned && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-black border border-blue-100">
                                  <Pin className="w-2 h-2 fill-current" />
                                  <span>{isUr ? 'پن شدہ' : 'Pinned'}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold">{post.time}</p>
                          </div>
                        </div>

                        {/* Admin Action Menu for individual posts */}
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handlePinPost(post.id)}
                              className={`p-1 rounded hover:bg-slate-100 text-xs ${post.pinned ? 'text-blue-500' : 'text-slate-400'}`}
                              title={post.pinned ? 'Unpin Post' : 'Pin Post'}
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                              title="Delete Post"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* MODAL 1: INVITE MEMBER */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-sm">
                  {isUr ? 'ہمسائے کو گروپ میں مدعو کریں' : 'Invite neighbors to group'}
                </h3>
                <button onClick={() => setShowInviteModal(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleInviteUser} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isUr ? 'ہمسائے کا نام درج کریں' : "Neighbor's Full Name"}</label>
                  <input
                    type="text"
                    required
                    value={inviteeName}
                    onChange={(e) => setInviteeName(e.target.value)}
                    placeholder={isUr ? 'پورا نام لکھیں...' : 'Enter full name...'}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setShowInviteModal(false)} className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer">
                    {isUr ? 'منسوخ کریں' : 'Cancel'}
                  </button>
                  <button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer">
                    {isUr ? 'دعوت نامہ بھیجیں' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: SHARE GROUP */}
        {showShareModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-sm">
                  {isUr ? 'گروپ لنک شیئر کریں' : 'Share Group'}
                </h3>
                <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <button
                  onClick={handleCopyLink}
                  className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  🔗 {isUr ? 'گروپ لنک کاپی کریں' : 'Copy Group Link'}
                </button>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1">
                    {isUr ? 'ہمسایہ چیٹ پر شیئر کریں' : 'Share to Chat'}
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {[
                      { id: '1', name: 'Zia-ur-Rehman (Union Council President)', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120' },
                      { id: '2', name: 'Al-Khidmat Foundation (Dhoke Hassu)', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120' },
                      { id: '3', name: 'Zia Hardware (Bashir Ahmed)', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120' }
                    ].map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleShareToChat(user.name)}
                        className="w-full p-2 hover:bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 transition-all cursor-pointer text-start"
                      >
                        <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                        <span className="text-xs font-bold text-slate-700 truncate flex-1">{user.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black">Share</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER 3: CREATE GROUP VIEW
  if (activeView === 'create') {
    return (
      <div className="space-y-6" id="groups-create-view">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('/groups')}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 hover:bg-slate-100 rounded-xl text-slate-600 text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isUr ? 'گروپس لسٹ پر واپس جائیں' : 'Back to Groups'}</span>
        </button>

        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm max-w-2xl mx-auto overflow-hidden">
          {/* Form Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              👥 {isUr ? 'نیا لوکل گروپ بنائیں' : 'Create a Neighborhood Group'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isUr 
                ? 'اپنے گلی محلے، مسجد کمیٹی، کھیلوں کی ٹیم، یا پیشے کے لوگوں سے جڑیں' 
                : 'Form a space to organize street networks, masjid discussions, local sports leagues, or volunteer groups.'}
            </p>
          </div>

          <form onSubmit={handleCreateGroup} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Group Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  {isUr ? 'گروپ کا نام' : 'Group Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={isUr ? 'مثال: دھوک حسو نوجوان کرکٹ الیون' : 'e.g. Dhoke Hassu Youth Cricket XI'}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  {isUr ? 'گروپ زمرہ' : 'Category'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {CATEGORIES.map(cat => {
                    const label = isUr ? CATEGORIES_UR[cat as keyof typeof CATEGORIES_UR] || cat : cat;
                    return <option key={cat} value={cat}>{label}</option>;
                  })}
                </select>
              </div>

              {/* Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  {isUr ? 'علاقہ / لوکیشن' : 'Area / Neighborhood'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  placeholder={isUr ? 'مثال: دھوک حسو، راولپنڈی' : 'e.g. Dhoke Hassu, Rawalpindi'}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Privacy (Public vs Private) */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  {isUr ? 'گروپ پرائیویسی' : 'Privacy Settings'} <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="radio"
                      name="privacy"
                      value="Public"
                      checked={newPrivacy === 'Public'}
                      onChange={() => setNewPrivacy('Public')}
                      className="accent-blue-600"
                    />
                    <span>🔓 {isUr ? 'پبلک' : 'Public'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="radio"
                      name="privacy"
                      value="Private"
                      checked={newPrivacy === 'Private'}
                      onChange={() => setNewPrivacy('Private')}
                      className="accent-blue-600"
                    />
                    <span>🔒 {isUr ? 'پرائیویٹ' : 'Private'}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">
                {isUr ? 'گروپ کے بارے میں مختصر معلومات' : 'Group Description'} <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={isUr ? 'گروپ کے مقاصد اور سرگرمیوں کے بارے میں تفصیل سے لکھیں...' : 'Explain the purpose, activities, and who should join this group...'}
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none h-24"
              />
            </div>

            {/* Cover image (optional URL) */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">
                {isUr ? 'گروپ کور امیج یو آر ایل (اختیاری)' : 'Cover Image URL (Optional)'}
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newCover}
                  onChange={(e) => setNewCover(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Group Rules */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">
                {isUr ? 'گروپ کے اصول و ضوابط (ہر لائن پر ایک اصول)' : 'Group Rules (One per line)'}
              </label>
              <textarea
                value={newRules}
                onChange={(e) => setNewRules(e.target.value)}
                placeholder={isUr ? 'اصول 1\nاصول 2' : 'Rule 1\nRule 2'}
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none h-20"
              />
            </div>

            {/* Submit Block */}
            <div className="border-t border-slate-100 pt-5 flex gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/groups')}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {isUr ? 'منسوخ کریں' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
              >
                👥 {isUr ? 'گروپ بنائیں' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // RENDER 4: GROUP MANAGEMENT
  if (activeView === 'manage') {
    if (!currentGroup) return null;

    return (
      <div className="space-y-6" id="groups-manage-view">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('/groups/detail')}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 hover:bg-slate-100 rounded-xl text-slate-600 text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isUr ? 'گروپ کی تفصیل پر واپس جائیں' : 'Back to Group Detail'}</span>
        </button>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                🛠️ {isUr ? 'گروپ مینجمنٹ اور ایڈمن سیٹنگز' : 'Group Admin Settings'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isUr 
                  ? `آپ یہاں سے گروپ "${currentGroup.name}" کو مکمل مانیٹر کر سکتے ہیں` 
                  : `Monitor members, requests, rules, and edit group "${currentGroup.name}".`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LEFT: Quick Navigation / Tabs */}
            <div className="md:col-span-1 space-y-4">
              {/* Private Group Join Requests */}
              {currentGroup.privacy === 'Private' && (
                <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-xs space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    📥 {isUr ? 'شراکت کی نئی درخواستیں' : 'Join Requests'} ({currentGroup.requests?.length || 0})
                  </h3>
                  {(!currentGroup.requests || currentGroup.requests.length === 0) ? (
                    <p className="text-xs text-slate-400 font-bold">{isUr ? 'کوئی زیر التواء درخواست نہیں ہے۔' : 'No pending join requests.'}</p>
                  ) : (
                    <div className="space-y-3 max-h-56 overflow-y-auto">
                      {currentGroup.requests.map(reqUser => (
                        <div key={reqUser} className="border border-slate-100 p-3 rounded-xl space-y-2 bg-slate-50/50">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[10px] flex items-center justify-center">
                              {reqUser[0]}
                            </div>
                            <span className="text-xs font-bold text-slate-700 truncate">{reqUser}</span>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleRejectRequest(reqUser)}
                              className="py-1 px-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-[10px] font-bold rounded"
                            >
                              {isUr ? 'خارج کریں' : 'Decline'}
                            </button>
                            <button
                              onClick={() => handleApproveRequest(reqUser)}
                              className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded"
                            >
                              {isUr ? 'منظور کریں' : 'Approve'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Members List with Action to Remove */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-xs space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  👥 {isUr ? 'گروپ ممبرز' : 'Manage Members'} ({currentGroup.members.length})
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {currentGroup.members.map(member => {
                    const isSelf = member === currentUser.fullName;
                    const isAd = currentGroup.admins.includes(member);
                    return (
                      <div key={member} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <div 
                            className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-extrabold text-[10px] flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all"
                            data-profile-name={member}
                          >
                            {member[0]}
                          </div>
                          <span 
                            className="text-xs font-bold text-slate-700 truncate cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                            data-profile-name={member}
                          >
                            {member}
                          </span>
                          {isAd && (
                            <span className="text-[8px] bg-blue-50 text-blue-600 border border-blue-100 px-1 py-0.2 rounded font-black">Ad</span>
                          )}
                        </div>
                        
                        {!isSelf && (
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-slate-400 cursor-pointer"
                            title="Remove Member"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: Edit Form */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xs">
                <h3 className="font-extrabold text-slate-900 text-sm mb-4 border-b border-slate-100 pb-2">
                  📝 {isUr ? 'گروپ کی تفصیلات تبدیل کریں' : 'Edit Group Details'}
                </h3>

                <form onSubmit={handleSaveChanges} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Group Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">{isUr ? 'گروپ کا نام' : 'Group Name'}</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">{isUr ? 'گروپ زمرہ' : 'Category'}</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        {CATEGORIES.map(cat => {
                          const label = isUr ? CATEGORIES_UR[cat as keyof typeof CATEGORIES_UR] || cat : cat;
                          return <option key={cat} value={cat}>{label}</option>;
                        })}
                      </select>
                    </div>

                    {/* Area */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">{isUr ? 'علاقہ / لوکیشن' : 'Area / Neighborhood'}</label>
                      <input
                        type="text"
                        required
                        value={editArea}
                        onChange={(e) => setEditArea(e.target.value)}
                        className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* Privacy Settings */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">{isUr ? 'گروپ پرائیویسی' : 'Privacy Settings'}</label>
                      <div className="flex gap-4 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="radio"
                            name="edit-privacy"
                            value="Public"
                            checked={editPrivacy === 'Public'}
                            onChange={() => setEditPrivacy('Public')}
                            className="accent-blue-600"
                          />
                          <span>🔓 {isUr ? 'پبلک' : 'Public'}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="radio"
                            name="edit-privacy"
                            value="Private"
                            checked={editPrivacy === 'Private'}
                            onChange={() => setEditPrivacy('Private')}
                            className="accent-blue-600"
                          />
                          <span>🔒 {isUr ? 'پرائیویٹ' : 'Private'}</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">{isUr ? 'گروپ کے بارے میں' : 'Description'}</label>
                    <textarea
                      required
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none h-24"
                    />
                  </div>

                  {/* Cover Image */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">{isUr ? 'گروپ کور امیج یو آر ایل' : 'Cover Image URL'}</label>
                    <input
                      type="url"
                      value={editCover}
                      onChange={(e) => setEditCover(e.target.value)}
                      className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {/* Rules */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">{isUr ? 'اصول و ضوابط (ہر لائن پر ایک)' : 'Group Rules (One per line)'}</label>
                    <textarea
                      value={editRules}
                      onChange={(e) => setEditRules(e.target.value)}
                      className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none h-24"
                    />
                  </div>

                  {/* Save Block */}
                  <div className="border-t border-slate-100 pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => onNavigate('/groups/detail')}
                      className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      {isUr ? 'منسوخ کریں' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      {isUr ? 'تبدیلیاں محفوظ کریں' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
