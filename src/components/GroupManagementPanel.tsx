import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Users, Shield, Trash2, Edit3, Save, X, Search, UserMinus, UserPlus, CheckCircle, Upload } from 'lucide-react';
import { supabase, isSupabaseConfigured, dbUpdateGroup, dbGetGroupMembers, dbDeleteGroup, dbUpdateGroupMemberRole, dbRemoveGroupMember, dbGetGroupRequests, dbUpdateGroupRequestStatus, dbTriggerNotification } from '../utils/supabaseClient';
import ClickableAvatar from './ClickableAvatar';
import { AppButton } from './ui';

interface GroupManagementPanelProps {
  group: any;
  currentUser: any;
  isEn: boolean;
  onBack: () => void;
  initialTab?: 'info' | 'members' | 'requests' | 'danger';
}

export default function GroupManagementPanel({ group, currentUser, isEn, onBack, initialTab }: GroupManagementPanelProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'requests' | 'danger'>(initialTab || 'info');

  return (
    <div className="bg-slate-50 min-h-screen pb-20 md:pb-0 animate-in fade-in duration-300" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className={`w-5 h-5 text-slate-700 ${!isEn && 'rotate-180'}`} />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900">{isEn ? 'Manage Group' : 'گروپ کا انتظام'}</h1>
            <p className="text-xs font-semibold text-slate-500">{group.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'info' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            {isEn ? 'Group Info' : 'گروپ کی معلومات'}
          </button>
          
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'members' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            {isEn ? 'Members' : 'ممبران'}
          </button>

          {group.visibility === 'Private' && (
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'requests' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              {isEn ? 'Join Requests' : 'شامل ہونے کی درخواستیں'}
            </button>
          )}

          <div className="h-px bg-slate-200 my-2" />

          {group.owner_id === currentUser?.user_id && (
            <button
              onClick={() => setActiveTab('danger')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'danger' ? 'bg-red-50 text-red-700' : 'text-red-500 hover:bg-red-50'
              }`}
            >
              <Shield className="w-4 h-4" />
              {isEn ? 'Danger Zone' : 'خطرناک زون'}
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {activeTab === 'info' && <GroupInfoTab group={group} isEn={isEn} onUpdate={() => {}} onBack={onBack} />}
          {activeTab === 'members' && <GroupMembersTab group={group} isEn={isEn} currentUser={currentUser} />}
          {activeTab === 'requests' && <GroupRequestsTab group={group} isEn={isEn} currentUser={currentUser} />}
          {activeTab === 'danger' && group.owner_id === currentUser?.user_id && <GroupDangerTab group={group} isEn={isEn} currentUser={currentUser} onGroupDeleted={onBack} />}
        </div>
      </div>
    </div>
  );
}

function GroupInfoTab({ group, isEn, onUpdate, onBack }: { group: any, isEn: boolean, onUpdate: () => void, onBack: () => void }) {
  const [formData, setFormData] = useState({
    name: group.name || '',
    description: group.description || '',
    category: group.category || '',
    visibility: group.visibility || 'Public',
    cover_url: group.cover_url || '',
    logo_url: group.logo_url || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await dbUpdateGroup(group.id, formData);
    Object.assign(group, formData);
    setSaving(false);
    alert(isEn ? 'Group updated successfully' : 'گروپ کامیابی سے اپ ڈیٹ ہو گیا');
    onUpdate(); // Calling onUpdate which could trigger re-render
    onBack(); // Go back to the group feed
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900 mb-6">{isEn ? 'Edit Group Information' : 'گروپ کی معلومات میں ترمیم کریں'}</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">{isEn ? 'Group Name' : 'گروپ کا نام'}</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">{isEn ? 'Description' : 'تفصیل'}</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">{isEn ? 'Category' : 'زمرہ'}</label>
            <input
              type="text"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">{isEn ? 'Visibility' : 'مرئیت'}</label>
            <select
              value={formData.visibility}
              onChange={e => setFormData({ ...formData, visibility: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Public">{isEn ? 'Public' : 'پبلک'}</option>
              <option value="Private">{isEn ? 'Private' : 'پرائیویٹ'}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">{isEn ? 'Cover Image URL' : 'کور تصویر کا URL'}</label>
          <input
            type="text"
            value={formData.cover_url}
            onChange={e => setFormData({ ...formData, cover_url: e.target.value })}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">{isEn ? 'Avatar Image URL' : 'اوتار تصویر کا URL'}</label>
          <input
            type="text"
            value={formData.logo_url}
            onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <AppButton type="submit" disabled={saving}>
          {saving ? (isEn ? 'Saving...' : 'محفوظ ہو رہا ہے...') : (isEn ? 'Save Changes' : 'تبدیلیاں محفوظ کریں')}
        </AppButton>
      </div>
    </form>
  );
}

function GroupMembersTab({ group, isEn, currentUser }: { group: any, isEn: boolean, currentUser: any }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadMembers = async () => {
    setLoading(true);
    const m = await dbGetGroupMembers(group.id);
    setMembers(m);
    setLoading(false);
  };

  useEffect(() => {
    loadMembers();
  }, [group.id]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    await dbUpdateGroupMemberRole(group.id, userId, newRole);
    loadMembers();
  };

  const handleRemove = async (userId: string) => {
    if (confirm(isEn ? 'Are you sure you want to remove this member?' : 'کیا آپ واقعی اس ممبر کو ہٹانا چاہتے ہیں؟')) {
      await dbRemoveGroupMember(group.id, userId);
      loadMembers();
    }
  };

  const handleTransferOwnership = async (userId: string) => {
    if (confirm(isEn ? 'Are you sure you want to transfer ownership to this user?' : 'کیا آپ واقعی اس صارف کو ملکیت منتقل کرنا چاہتے ہیں؟')) {
      await dbUpdateGroup(group.id, { owner_id: userId });
      await dbUpdateGroupMemberRole(group.id, userId, 'Owner');
      await dbUpdateGroupMemberRole(group.id, currentUser.user_id, 'Admin');
      alert(isEn ? 'Ownership transferred' : 'ملکیت منتقل ہو گئی');
      loadMembers();
    }
  };

  const filteredMembers = members.filter(m => m.profiles?.name?.toLowerCase().includes(search.toLowerCase()));
  const isOwner = group.owner_id === currentUser?.user_id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-900">{isEn ? 'Member Management' : 'ممبر مینجمنٹ'}</h2>
        <div className="relative w-full sm:w-64">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isEn ? 'Search members...' : 'ممبران تلاش کریں...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">{isEn ? 'Loading members...' : 'ممبران لوڈ ہو رہے ہیں...'}</div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
          {filteredMembers.map(member => (
            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <ClickableAvatar userId={member.user_id} name={member.profiles?.full_name || member.profiles?.name} avatar={member.profiles?.profile_photo || member.profiles?.avatar_url} size={40} />
                <div dir="ltr" className="text-left">
                  <p className="font-bold text-slate-900">{member.profiles?.full_name || member.profiles?.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{member.role === 'Owner' && isOwner && member.user_id === group.owner_id ? 'Owner' : member.role}</p>
                </div>
              </div>

              {member.user_id !== currentUser?.user_id && member.user_id !== group.owner_id && (
                <div className="flex items-center gap-2">
                  <select
                    value={member.role}
                    onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                    disabled={!isOwner}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700"
                  >
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                  
                  {isOwner && (
                    <button
                      onClick={() => handleTransferOwnership(member.user_id)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title={isEn ? 'Transfer Ownership' : 'ملکیت منتقل کریں'}
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleRemove(member.user_id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title={isEn ? 'Remove Member' : 'ممبر کو ہٹائیں'}
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {filteredMembers.length === 0 && (
            <div className="p-8 text-center text-slate-500">{isEn ? 'No members found' : 'کوئی ممبر نہیں ملا'}</div>
          )}
        </div>
      )}
    </div>
  );
}

function GroupRequestsTab({ group, isEn, currentUser }: { group: any, isEn: boolean, currentUser: any }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    setLoading(true);
    const reqs = await dbGetGroupRequests(group.id);
    setRequests(reqs);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();

    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel(`group_requests_${group.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${group.id}`
        }, (payload) => {
          // If a new member requests to join or a status changes, reload
          loadRequests();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [group.id]);

  const handleStatus = async (userId: string, status: string) => {
    await dbUpdateGroupRequestStatus(group.id, userId, status);
    
    // Notify requester
    if (currentUser?.id) {
      if (status === 'Approved') {
        await dbTriggerNotification(
          userId,
          currentUser.id,
          'system',
          isEn ? 'Group Request Approved' : 'گروپ کی درخواست منظور ہو گئی',
          isEn 
            ? `Your request to join "${group.name}" was approved.` 
            : `"${group.name}" میں شامل ہونے کی آپ کی درخواست منظور کر لی گئی ہے۔`,
          'social-groups',
          group.id
        );
      } else {
        await dbTriggerNotification(
          userId,
          currentUser.id,
          'system',
          isEn ? 'Group Request Declined' : 'گروپ کی درخواست مسترد کر دی گئی',
          isEn 
            ? `Your request to join "${group.name}" was declined.` 
            : `"${group.name}" میں شامل ہونے کی آپ کی درخواست مسترد کر دی گئی ہے۔`,
          'social-groups',
          group.id
        );
      }
    }
    
    loadRequests();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 mb-6">{isEn ? 'Join Requests' : 'شامل ہونے کی درخواستیں'}</h2>

      {loading ? (
        <div className="text-center py-8 text-slate-500">{isEn ? 'Loading requests...' : 'درخواستیں لوڈ ہو رہی ہیں...'}</div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
          {requests.map(req => (
            <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <ClickableAvatar userId={req.user_id} name={req.profiles?.full_name || req.profiles?.name} avatar={req.profiles?.profile_photo || req.profiles?.avatar_url} size={40} />
                <div dir="ltr" className="text-left">
                  <p className="font-bold text-slate-900">{req.profiles?.full_name || req.profiles?.name}</p>
                  <p className="text-xs text-slate-500">{isEn ? 'Wants to join' : 'شامل ہونا چاہتا ہے'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AppButton variant="primary" onClick={() => handleStatus(req.user_id, 'Approved')} className="text-xs px-3 py-1">
                  {isEn ? 'Approve' : 'منظور کریں'}
                </AppButton>
                <AppButton variant="outline" onClick={() => handleStatus(req.user_id, 'Rejected')} className="text-xs px-3 py-1 text-red-600 border-red-200 hover:bg-red-50">
                  {isEn ? 'Reject' : 'مسترد کریں'}
                </AppButton>
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <div className="p-8 text-center text-slate-500">{isEn ? 'No pending requests' : 'کوئی زیر التوا درخواست نہیں'}</div>
          )}
        </div>
      )}
    </div>
  );
}

function GroupDangerTab({ group, isEn, currentUser, onGroupDeleted }: { group: any, isEn: boolean, currentUser: any, onGroupDeleted: () => void }) {
  const [confirmName, setConfirmName] = useState('');
  
  const handleDelete = async () => {
    if (confirmName !== group.name) return;
    if (confirm(isEn ? 'Are you absolutely sure?' : 'کیا آپ کو پورا یقین ہے؟')) {
      await dbDeleteGroup(group.id);
      alert(isEn ? 'Group deleted' : 'گروپ حذف کر دیا گیا');
      onGroupDeleted();
      // Redirect to home/groups
      window.location.href = '/?tab=groups';
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-xl font-bold text-red-600 mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6" />
        {isEn ? 'Danger Zone' : 'خطرناک زون'}
      </h2>
      
      <div className="p-6 border border-red-200 rounded-xl bg-red-50 space-y-4">
        <h3 className="font-bold text-red-800">{isEn ? 'Delete Group' : 'گروپ حذف کریں'}</h3>
        <p className="text-sm text-red-600">
          {isEn 
            ? 'Once you delete a group, there is no going back. Please be certain.' 
            : 'ایک بار جب آپ کوئی گروپ حذف کر دیتے ہیں، تو واپس نہیں جایا جا سکتا۔ براہ کرم یقین کر لیں۔'}
        </p>
        
        <div className="pt-4 space-y-3">
          <label className="block text-sm font-semibold text-red-800">
            {isEn ? `Type "${group.name}" to confirm:` : `تصدیق کے لیے "${group.name}" ٹائپ کریں:`}
          </label>
          <input
            type="text"
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-slate-900"
          />
          <AppButton 
            variant="primary" 
            className="w-full bg-red-600 hover:bg-red-700 text-white border-none mt-2"
            disabled={confirmName !== group.name}
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isEn ? 'Delete Group' : 'گروپ حذف کریں'}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
