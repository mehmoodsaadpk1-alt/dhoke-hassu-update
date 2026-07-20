import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User } from '../types';

export interface TvsBadgeData {
  id?: string;
  user_id: string;
  badge_type: 'Individual' | 'Business' | 'Government' | 'Healthcare' | 'NGO' | 'Emergency' | 'Leader';
  verification_level: 'Basic' | 'Professional' | 'Premium' | 'Gold Trusted';
  status: 'Approved' | 'Suspended' | 'Expired';
  expires_at?: string;
  created_at?: string;
}

export interface TvsRequest {
  id: string;
  certificate_id?: string;
  user_id: string;
  entity_name: string;
  entity_type: string;
  verification_level: string;
  status: 'Pending' | 'Assigned' | 'Under Review' | 'Need More Documents' | 'Approved' | 'Rejected' | 'Suspended' | 'Expired' | 'Revoked';
  assigned_moderator_id?: string;
  admin_notes?: string;
  risk_score?: number;
  verification_confidence?: number;
  ai_review_result?: string;
  fraud_flags?: string[];
  manual_review_required?: boolean;
  created_at?: string;
  documents?: any[];
}

// SHA-256 Hashing helper
export async function sha256Hash(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message?.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Fetch active badges for a user
export async function tvsGetActiveBadges(userId: string): Promise<TvsBadgeData[]> {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const saved = localStorage.getItem(`tvs_badges_${userId}`) || '[]';
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }

  try {
    const { data, error } = await supabase
      .from('tvs_verification_badges')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'Approved')
      .is('deleted_at', null);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("Failed fetching tvs badges from DB. Falling back to local storage:", err);
    try {
      const saved = localStorage.getItem(`tvs_badges_${userId}`) || '[]';
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
}

// Fetch single certificate by ID
export async function tvsGetCertificate(certificateId: string): Promise<any | null> {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const saved = localStorage.getItem('tvs_local_requests') || '[]';
      const list: any[] = JSON.parse(saved);
      const req = list.find(r => r.certificate_id === certificateId);
      return req || null;
    } catch {
      return null;
    }
  }

  try {
    const { data, error } = await supabase
      .from('tvs_verification_requests')
      .select('*')
      .eq('certificate_id', certificateId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error loading certificate:", err);
    try {
      const saved = localStorage.getItem('tvs_local_requests') || '[]';
      const list: any[] = JSON.parse(saved);
      return list.find(r => r.certificate_id === certificateId) || null;
    } catch {
      return null;
    }
  }
}

// Check CNIC/Tax ID fraud registry
export async function tvsCheckFraudRegistry(type: string, hash: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const saved = localStorage.getItem('tvs_fraud_registry') || '[]';
      const list: any[] = JSON.parse(saved);
      return list.some(r => r.identifier_type === type && r.identifier_hash === hash);
    } catch {
      return false;
    }
  }

  try {
    const { data, error } = await supabase
      .from('tvs_fraud_registry')
      .select('id')
      .eq('identifier_type', type)
      .eq('identifier_hash', hash);

    if (error) throw error;
    return (data || []).length > 0;
  } catch (err) {
    console.error("Fraud registry query failed:", err);
    try {
      const saved = localStorage.getItem('tvs_fraud_registry') || '[]';
      const list: any[] = JSON.parse(saved);
      return list.some(r => r.identifier_type === type && r.identifier_hash === hash);
    } catch {
      return false;
    }
  }
}

// Submit Verification Request
export async function tvsSubmitRequest(
  userId: string,
  entityName: string,
  entityType: string,
  level: string,
  cnicPlain: string,
  documents: { type: string; url: string; expiryDate?: string }[],
  userProfile: any
): Promise<{ success: boolean; error: string | null; certId?: string }> {
  const cnicClean = cnicPlain.replace(/\D/g, '');
  if (cnicClean.length < 5) {
    return { success: false, error: 'Invalid identification number' };
  }

  const hash = await sha256Hash(cnicClean);
  const last4 = cnicClean?.slice(-4);

  // Check Fraud Registry
  const isDuplicate = await tvsCheckFraudRegistry('CNIC', hash);
  if (isDuplicate) {
    return { success: false, error: 'This National Identity Number is already registered to another account.' };
  }

  const generatedCertId = `DHC-TVS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  if (!isSupabaseConfigured || !supabase) {
    try {
      const requestsJson = localStorage.getItem('tvs_local_requests') || '[]';
      const list: any[] = JSON.parse(requestsJson);
      const newReq: TvsRequest = {
        id: `tvs_req_${Date.now()}`,
        certificate_id: generatedCertId,
        user_id: userId,
        entity_name: entityName,
        entity_type: entityType,
        verification_level: level,
        status: 'Pending',
        risk_score: 5,
        verification_confidence: 95,
        created_at: new Date().toISOString()
      };
      list.push(newReq);
      localStorage.setItem('tvs_local_requests', JSON.stringify(list));

      const fraudJson = localStorage.getItem('tvs_fraud_registry') || '[]';
      const fraudList = JSON.parse(fraudJson);
      fraudList.push({
        identifier_type: 'CNIC',
        identifier_hash: hash,
        identifier_last4: last4,
        associated_user_id: userId
      });
      localStorage.setItem('tvs_fraud_registry', JSON.stringify(fraudList));

      return { success: true, error: null, certId: generatedCertId };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Local submission failed' };
    }
  }

  try {
    // 1. Insert Request
    const { data: reqData, error: reqErr } = await supabase
      .from('tvs_verification_requests')
      .insert({
        user_id: userId,
        entity_name: entityName,
        entity_type: entityType,
        verification_level: level,
        status: 'Pending',
        risk_score: 10,
        verification_confidence: 90,
        manual_review_required: true
      })
      .select()
      .single();

    if (reqErr || !reqData) throw reqErr || new Error('Request insertion failed');

    // 2. Insert Documents and Fraud Record
    const documentPromises = documents.map(doc => 
      supabase.from('tvs_verification_documents').insert({
        request_id: reqData.id,
        document_type: doc.type,
        file_url: doc.url,
        expiry_date: doc.expiryDate || null,
        metadata: { client_os: navigator.userAgent }
      })
    );

    const fraudPromise = supabase.from('tvs_fraud_registry').insert({
      identifier_type: 'CNIC',
      identifier_hash: hash,
      identifier_last4: last4,
      associated_user_id: userId
    });

    await Promise.all([...documentPromises, fraudPromise]);

    try {
      const requestsJson = localStorage.getItem('tvs_local_requests') || '[]';
      const list: any[] = JSON.parse(requestsJson);
      const newReq: TvsRequest = {
        id: reqData.id || `tvs_req_${Date.now()}`,
        certificate_id: reqData.certificate_id || generatedCertId,
        user_id: userId,
        entity_name: entityName,
        entity_type: entityType,
        verification_level: level,
        status: 'Pending',
        risk_score: 10,
        verification_confidence: 90,
        created_at: new Date().toISOString()
      };
      list.push(newReq);
      localStorage.setItem('tvs_local_requests', JSON.stringify(list));
    } catch (e) {
      console.warn("Failed writing local storage copy of Supabase request:", e);
    }

    return { success: true, error: null, certId: reqData.certificate_id || generatedCertId };
  } catch (err: any) {
    console.warn("Supabase request insertion failed, falling back to local storage:", err);
    try {
      const requestsJson = localStorage.getItem('tvs_local_requests') || '[]';
      const list: any[] = JSON.parse(requestsJson);
      const newReq: TvsRequest = {
        id: `tvs_req_${Date.now()}`,
        certificate_id: generatedCertId,
        user_id: userId,
        entity_name: entityName,
        entity_type: entityType,
        verification_level: level,
        status: 'Pending',
        risk_score: 5,
        verification_confidence: 95,
        created_at: new Date().toISOString()
      };
      list.push(newReq);
      localStorage.setItem('tvs_local_requests', JSON.stringify(list));

      const fraudJson = localStorage.getItem('tvs_fraud_registry') || '[]';
      const fraudList = JSON.parse(fraudJson);
      fraudList.push({
        identifier_type: 'CNIC',
        identifier_hash: hash,
        identifier_last4: last4,
        associated_user_id: userId
      });
      localStorage.setItem('tvs_fraud_registry', JSON.stringify(fraudList));

      return { success: true, error: null, certId: generatedCertId };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Database and local fallback failed' };
    }
  }
}
