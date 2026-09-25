import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

export interface QRLoginRequest {
  id: string;
  status: 'pending' | 'approved' | 'expired' | 'cancelled' | 'consumed';
  expiresAt: string;
}

export class QRAuthService {
  /**
   * Generates a random cryptographically secure string of a given byte length.
   */
  static generateRandomString(byteLength: number = 32): string {
    const array = new Uint8Array(byteLength);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hashes a string using SHA-256.
   */
  static async hashChallenge(challenge: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(challenge);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generates a new login request with an id and a raw challenge.
   * Calls the secure RPC to store the id and the challenge_hash in the database.
   * Returns { id, rawChallenge } to be embedded in the QR code.
   */
  static async createLoginRequest(): Promise<{ id: string; rawChallenge: string; expiresAt: Date } | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      const id = crypto.randomUUID();
      const rawChallenge = this.generateRandomString(32);
      const challengeHash = await this.hashChallenge(rawChallenge);
      const deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase.rpc('create_pc_login_request', {
        p_id: id,
        p_challenge_hash: challengeHash,
        p_device_info: deviceInfo
      });

      if (error) {
        console.error('Failed to create PC login request:', error);
        return null;
      }

      // Expires in 2 minutes
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
      
      return { id, rawChallenge, expiresAt };
    } catch (err) {
      console.error('Exception creating PC login request:', err);
      return null;
    }
  }

  /**
   * Polls the status of the login request using the secure RPC.
   */
  static async checkStatus(id: string, challengeHash: string): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.rpc('check_pc_login_status', {
        p_id: id,
        p_challenge_hash: challengeHash
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error checking PC login status:', err);
      return null;
    }
  }

  /**
   * Exchanges an approved request for a magic link token_hash via Edge Function.
   */
  static async exchangePcLogin(requestId: string, rawChallenge: string): Promise<{ success: boolean; token_hash?: string; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Supabase not configured' };

    try {
      const { data, error } = await supabase.functions.invoke('exchange-pc-login', {
        body: { requestId, rawChallenge },
      });

      if (error) {
        console.error('Error invoking exchange-pc-login:', error);
        return { success: false, error: 'network_error' };
      }

      if (data && data.error) {
        return { success: false, error: data.error };
      }

      if (data && data.success && data.token_hash) {
        return { success: true, token_hash: data.token_hash };
      }

      return { success: false, error: 'unknown_error' };
    } catch (err) {
      console.error('Exception during exchangePcLogin:', err);
      return { success: false, error: 'exception' };
    }
  }
}
