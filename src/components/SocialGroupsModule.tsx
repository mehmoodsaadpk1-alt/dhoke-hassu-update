/**
 * Dhoke Hassu Connect - Social Groups Module
 * Implements a Facebook-style Groups system natively within the platform.
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Search, PlusCircle, ArrowLeft, Image as ImageIcon,
  CheckCircle, Share2, Shield, AlertTriangle, Lock, EyeOff, Globe
} from 'lucide-react';
import { Group, GroupPost, User } from '../types';
import { dbGetGroupsAdvanced, dbCreateGroupAdvanced, dbGetGroupPostsAdvanced, dbCreateGroupPostAdvanced } from '../utils/supabaseClient';
import AdBannerCard from './AdBannerCard';
import { useAdRotator } from '../hooks/useAdRotator';
import { useAdStore } from '../store/adStore';
import { isUserAdminOrModerator } from './AlertsModule';
import SocialGroupCreateForm from './SocialGroupCreateForm';
import SocialGroupDetailView from './SocialGroupDetailView';

interface SocialGroupsModuleProps {
  currentUser: User;
  currentLanguage: 'en' | 'ur';
}

export default function SocialGroupsModule({ currentUser, currentLanguage, posts = [], renderPostComposer, renderPost }: SocialGroupsModuleProps) {
  const isEn = currentLanguage === 'en';
  const isAdmin = isUserAdminOrModerator(currentUser);

  // Ad Engine
  const feedAdInterval = useAdStore(s => s.feedAdIntervals?.['Groups'] || 3);
  const topBannerMap = useAdRotator('Groups', 1, 1, 'Banner');
  const bottomBannerMap = useAdRotator('Groups', 1, 1, 'Banner');
  const inlineAdsMap = useAdRotator('Groups', 200, feedAdInterval, 'Feed');

  // State
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // View states: 'list' | 'create' | 'detail'
  const [activeView, setActiveView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  // Detail State
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>([]);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    const data = await dbGetGroupsAdvanced();
    setGroups(data);
    setLoading(false);
  };

  const loadGroupPosts = async (groupId: string) => {
    const posts = await dbGetGroupPostsAdvanced(groupId);
    setGroupPosts(posts);
  };

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    setActiveView('detail');
    loadGroupPosts(group.id);
  };

  // ---------------- RENDER ----------------
  
  const filteredGroups = groups.filter(g => 
    g.name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
    g.category?.toLowerCase().includes(searchQuery?.toLowerCase())
  );

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 bg-slate-50 min-h-screen text-slate-800">
      {/* Header & Ads go here */}
      {activeView === 'list' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-600" />
                {isEn ? 'Social Groups' : 'سوشل گروپس'}
              </h2>
              <p className="text-xs text-slate-500 font-bold mt-1">
                {isEn ? 'Connect with people who share your interests' : 'اپنے مشاغل شیئر کرنے والے لوگوں سے جڑیں'}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute start-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={isEn ? "Search groups..." : "گروپس تلاش کریں..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-9 pe-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button 
                onClick={() => setActiveView('create')}
                className="bg-[#2563eb] hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 shrink-0 border-none cursor-pointer shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                {isEn ? 'Create' : 'بنائیں'}
              </button>
            </div>
          </div>

          {/* Top Banner Ad */}
          {topBannerMap[0] && (
            <div className="mb-6">
              <AdBannerCard ad={topBannerMap[0]} />
            </div>
          )}

          {/* Listing Grid */}
          {loading ? (
             <div className="text-center py-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : filteredGroups.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-bold">{isEn ? 'No groups found' : 'کوئی گروپ نہیں ملا'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(() => {
                const elements = [];
                for (let i = 0; i < filteredGroups.length; i++) {
                  const group = filteredGroups[i];
                  const ad = inlineAdsMap[i];

                  elements.push(
                    <div 
                      key={group.id}
                      onClick={() => handleSelectGroup(group)}
                      className="bg-white rounded-3xl border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer flex flex-col relative"
                    >
                      <div className="h-32 w-full bg-slate-200 relative overflow-hidden">
                        {group.cover_url ? (
                          <img src={group.cover_url} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100" />
                        )}
                        <div className="absolute top-3 end-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1.5">
                           {group.visibility === 'Private' ? <Lock className="w-3 h-3" /> : group.visibility === 'Hidden' ? <EyeOff className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                           {group.visibility}
                        </div>
                      </div>
                      <div className="px-5 py-5 relative flex-1 flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-slate-900 text-lg leading-tight line-clamp-1">{group.name}</h3>
                        </div>
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2 font-semibold leading-relaxed flex-1">
                          {group.description || (isEn ? 'No description provided.' : 'کوئی تفصیل فراہم نہیں کی گئی۔')}
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black text-slate-500">
                           <span className="bg-slate-100 px-2 py-1 rounded-md">{group.category}</span>
                           <span>{group.members_count} {isEn ? 'Members' : 'ممبران'}</span>
                        </div>
                      </div>
                    </div>
                  );

                  if (ad) {
                    elements.push(
                      <div key={`ad-${i}`} className="md:col-span-2">
                        <AdBannerCard ad={ad} />
                      </div>
                    );
                  }
                }
                return elements;
              })()}
            </div>
          )}

          {/* Bottom Banner Ad */}
          {bottomBannerMap[0] && filteredGroups.length > 0 && (
            <div className="mt-6">
              <AdBannerCard ad={bottomBannerMap[0]} />
            </div>
          )}
        </div>
      )}

      {/* DETAIL VIEW */}
      {activeView === 'detail' && selectedGroup && (
        <SocialGroupDetailView
          group={selectedGroup}
          currentUser={currentUser}
          currentLanguage={currentLanguage}
          posts={groupPosts}
          onBack={() => setActiveView('list')}
        />
      )}

      {/* CREATE VIEW */}
      {activeView === 'create' && (
        <SocialGroupCreateForm
          currentUser={currentUser}
          currentLanguage={currentLanguage}
          onCancel={() => setActiveView('list')}
          onSuccess={(newGroup) => {
            setGroups(prev => [newGroup, ...prev]);
            handleSelectGroup(newGroup);
          }}
        />
      )}
    </div>
  );
}



