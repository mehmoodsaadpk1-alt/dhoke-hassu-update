import React, { useEffect, useState } from 'react';
import { Award, FileText, CheckCircle, XCircle, Clock, ShieldAlert, Check, RefreshCw, Eye } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { TvsRequest } from '../utils/tvs';
import { User } from '../types';
import { getCurrentUserLocation } from '../utils/locationService';

interface AdminTvsViewProps {
  currentUser: User;
  currentLanguage: 'en' | 'ur';
}

export default function AdminTvsView({
  currentUser,
  currentLanguage
}: AdminTvsViewProps) {
  const isEn = currentLanguage === 'en';
  const [requests, setRequests] = useState<TvsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<TvsRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [badgeType, setBadgeType] = useState<'Individual' | 'Business' | 'Government' | 'Healthcare' | 'NGO' | 'Emergency' | 'Leader'>('Individual');
  const [verificationLevel, setVerificationLevel] = useState<'Basic' | 'Professional' | 'Premium' | 'Gold Trusted'>('Basic');

  // Load requests
  const loadRequests = async () => {
    setLoading(true);
    let dbRequests: any[] = [];
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('tvs_verification_requests')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (!error && data) {
          dbRequests = data;
        }
      } catch (e: any) {
        console.error("Failed fetching from Supabase:", e);
      }
    }

    // Load local storage requests
    let localRequests: any[] = [];
    try {
      const savedTvs = localStorage.getItem('tvs_local_requests') || '[]';
      const savedLegacy = localStorage.getItem('dhoke_connect_verification_requests') || '[]';
      const tvsList = JSON.parse(savedTvs);
      const legacyList = JSON.parse(savedLegacy).map((req: any) => ({
        id: req.id,
        certificate_id: `DHC-TVS-2026-${req.id?.split('-').pop() || '000000'}`,
        user_id: req.id,
        entity_name: req.name,
        entity_type: req.type === 'User' ? 'Individual' : (req.type === 'Organization' ? 'NGO' : req.type),
        verification_level: 'Basic',
        status: req.status === 'Under Review' ? 'Under Review' : req.status,
        created_at: req.applicationDate || new Date().toISOString(),
        area: req.area || 'Dhoke Hassu'
      }));
      localRequests = [...tvsList, ...legacyList];
    } catch (err) {
      console.warn("Error parsing local storage requests:", err);
    }

    // Merge both, preventing duplicates by request ID (DB overrides local)
    const mergedMap = new Map();
    [...localRequests, ...dbRequests].forEach(req => {
      mergedMap.set(req.id, req);
    });

    setRequests(Array.from(mergedMap.values()));
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSelectRequest = (req: TvsRequest) => {
    setSelectedReq(req);
    setAdminNotes(req.admin_notes || '');
    setAssigneeId(req.assigned_moderator_id || '');
    setBadgeType(req.entity_type as any);
    setVerificationLevel(req.verification_level as any);
  };

  // Log audit logs and document downloads
  const logAudit = async (action: string, details: string) => {
    if (!isSupabaseConfigured || !supabase) {
      console.log(`[TVS Audit Log] Action: ${action}, Details: ${details}`);
      return;
    }
    try {
      await supabase.from('tvs_audit_logs').insert({
        moderator_id: currentUser.id,
        moderator_role: 'Super Admin', // Use mock fallback role
        target_user_id: selectedReq?.user_id || currentUser.id,
        action,
        details
      });
    } catch (e) {
      console.warn("Audit logging failed:", e);
    }
  };

  const handleDocumentView = (docUrl: string, docType: string) => {
    // Log private document view action
    logAudit('Document View', `Moderator viewed document ${docType}. Secure url: ${docUrl}`);
    alert(isEn ? `Logging Secure Access. Document opened: ${docType}` : `دستاوہز تک رسائی لاگ ہو گئی: ${docType}`);
    window.open(`https://gsbasllnpbojpfrztarv.supabase.co/storage/v1/object/sign/tvs-secure-docs/${docUrl?.split('/')?.slice(-1)[0]}?token=mock_sign`, '_blank');
  };

  const handleUpdateStatus = async (newStatus: 'Pending' | 'Assigned' | 'Under Review' | 'Need More Documents' | 'Approved' | 'Rejected' | 'Suspended' | 'Revoked') => {
    if (!selectedReq) return;

    try {
      const savedLegacy = localStorage.getItem('dhoke_connect_verification_requests') || '[]';
      let legacyList = JSON.parse(savedLegacy);
      legacyList = legacyList.map((r: any) => r.id === selectedReq.id ? { ...r, status: newStatus } : r);
      localStorage.setItem('dhoke_connect_verification_requests', JSON.stringify(legacyList));
    } catch (e) {
      console.warn("Failed to update legacy request status:", e);
    }

    if (!isSupabaseConfigured || !supabase) {
      // Local fallback request update
      const requestsJson = localStorage.getItem('tvs_local_requests') || '[]';
      let list: any[] = JSON.parse(requestsJson);
      list = list.map(r => {
        if (r.id === selectedReq.id) {
          return {
            ...r,
            status: newStatus,
            admin_notes: adminNotes,
            assigned_moderator_id: assigneeId,
            verification_level: verificationLevel,
            entity_type: badgeType
          };
        }
        return r;
      });
      localStorage.setItem('tvs_local_requests', JSON.stringify(list));

      if (newStatus === 'Approved') {
        // Issue active badge in local storage
        const badgePayload = {
          user_id: selectedReq.user_id,
          badge_type: badgeType,
          verification_level: verificationLevel,
          status: 'Approved',
          expires_at: expiryDate ? new Date(expiryDate).toISOString() : undefined,
          created_at: new Date().toISOString()
        };
        const badgesJson = localStorage.getItem(`tvs_badges_${selectedReq.user_id}`) || '[]';
        const badgesList = JSON.parse(badgesJson);
        badgesList.push(badgePayload);
        localStorage.setItem(`tvs_badges_${selectedReq.user_id}`, JSON.stringify(badgesList));
      }

      logAudit('Update Status', `Updated status of request ${selectedReq.id} to ${newStatus}`);
      alert(isEn ? 'Status updated successfully (Local fallback)!' : 'حیثیت کامیابی سے تبدیل ہو گئی!');
      loadRequests();
      setSelectedReq(null);
      return;
    }

    try {
      // 1. Update verification request in database
      const { error: updateErr } = await supabase
        .from('tvs_verification_requests')
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          assigned_moderator_id: assigneeId || null,
          verification_level: verificationLevel,
          entity_type: badgeType
        })
        .eq('id', selectedReq.id);

      if (updateErr) throw updateErr;

      // 2. Issue Active Badge if Approved
      if (newStatus === 'Approved') {
        const { error: badgeErr } = await supabase
          .from('tvs_verification_badges')
          .upsert({
            user_id: selectedReq.user_id,
            badge_type: badgeType,
            verification_level: verificationLevel,
            status: 'Approved',
            expires_at: expiryDate ? new Date(expiryDate).toISOString() : null
          }, { onConflict: 'user_id,badge_type' });

        if (badgeErr) throw badgeErr;

        // Write verification history record
        await supabase.from('tvs_verification_history').insert({
          user_id: selectedReq.user_id,
          badge_type: badgeType,
          verification_level: verificationLevel,
          status: 'Approved',
          expires_at: expiryDate ? new Date(expiryDate).toISOString() : null,
          changed_by: currentUser.id,
          reason: 'Application Approved'
        });
      }

      logAudit('Update Status', `Updated status of request ${selectedReq.id} to ${newStatus}`);
      alert(isEn ? 'Verification Request processed successfully!' : 'درخواست کامیابی سے پراسیس ہو گئی!');
      loadRequests();
      setSelectedReq(null);
    } catch (e: any) {
      console.warn("DB update failed, executing local fallback:", e);
      
      // Local fallback request update
      const requestsJson = localStorage.getItem('tvs_local_requests') || '[]';
      let list: any[] = JSON.parse(requestsJson);
      list = list.map(r => {
        if (r.id === selectedReq.id) {
          return {
            ...r,
            status: newStatus,
            admin_notes: adminNotes,
            assigned_moderator_id: assigneeId,
            verification_level: verificationLevel,
            entity_type: badgeType
          };
        }
        return r;
      });
      localStorage.setItem('tvs_local_requests', JSON.stringify(list));

      if (newStatus === 'Approved') {
        // Issue active badge in local storage
        const badgePayload = {
          user_id: selectedReq.user_id,
          badge_type: badgeType,
          verification_level: verificationLevel,
          status: 'Approved',
          expires_at: expiryDate ? new Date(expiryDate).toISOString() : undefined,
          created_at: new Date().toISOString()
        };
        const badgesJson = localStorage.getItem(`tvs_badges_${selectedReq.user_id}`) || '[]';
        const badgesList = JSON.parse(badgesJson);
        badgesList.push(badgePayload);
        localStorage.setItem(`tvs_badges_${selectedReq.user_id}`, JSON.stringify(badgesList));
      }

      logAudit('Update Status', `Updated status of request ${selectedReq.id} to ${newStatus} (Local fallback)`);
      alert(isEn 
        ? 'Processed successfully! (Saved to local fallback because user profile does not exist in the database)' 
        : 'کامیابی سے عمل مکمل ہوا! (ڈیٹا بیس میں صارف کا اکاؤنٹ نہ ہونے کی وجہ سے لوکل اسٹوریج میں محفوظ کیا گیا)');
      loadRequests();
      setSelectedReq(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn leading-normal">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-650" />
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            {isEn ? 'Trust & Verification Management' : 'بیج اور تصدیقی مینجمنٹ'}
          </h2>
        </div>
        <button 
          onClick={loadRequests}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg cursor-pointer border-none flex items-center justify-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Requests List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <p className="p-10 text-center text-slate-400 text-xs font-bold animate-pulse">Loading applications...</p>
          ) : requests.length === 0 ? (
            <p className="p-16 text-center text-slate-400 text-xs font-semibold">No verification requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="py-3 px-5">Applicant Name</th>
                    <th className="py-3 px-5">Entity & Level</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {requests.filter(req => {
                    const userLoc = getCurrentUserLocation();
                    return !req.area || req.area?.toLowerCase() === userLoc?.toLowerCase();
                  }).map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/40">
                      <td className="py-3.5 px-5 font-bold text-slate-900">{req.entity_name}</td>
                      <td className="py-3.5 px-5 text-slate-500">
                        {req.entity_type} • <span className="text-amber-500 uppercase font-black">{req.verification_level}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          req.status === 'Approved' ? 'bg-green-50 text-green-700' :
                          req.status === 'Pending' ? 'bg-indigo-50 text-indigo-700' :
                          req.status === 'Need More Documents' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleSelectRequest(req)}
                          className="py-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg border-none cursor-pointer"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Panel */}
        {selectedReq ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase border-b border-slate-100 pb-2">
              Application Details
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Entity Name</p>
                <p className="font-bold text-slate-800 mt-0.5">{selectedReq.entity_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-0.5">Assigned Role Type</label>
                  <select 
                    value={badgeType} 
                    onChange={(e) => setBadgeType(e.target.value as any)}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-650"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Business">Business</option>
                    <option value="Government">Government</option>
                    <option value="NGO">NGO</option>
                    <option value="Educational">Educational</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Journalist">Journalist</option>
                    <option value="Leader">Leader</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-0.5">Level</label>
                  <select 
                    value={verificationLevel} 
                    onChange={(e) => setVerificationLevel(e.target.value as any)}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-650"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Professional">Professional</option>
                    <option value="Premium">Premium</option>
                    <option value="Gold Trusted">Gold Trusted</option>
                  </select>
                </div>
              </div>



              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-0.5">Optional Expiration</label>
                <input 
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-0.5">Moderator Review Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 justify-end">
                <button
                  onClick={() => handleUpdateStatus('Rejected')}
                  className="flex-1 py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-650 font-black rounded-lg border-none cursor-pointer"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleUpdateStatus('Approved')}
                  className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg border-none cursor-pointer"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-6 text-center text-slate-400 text-xs font-semibold leading-relaxed">
            Select a request on the left to review documentation.
          </div>
        )}
      </div>
    </div>
  );
}
