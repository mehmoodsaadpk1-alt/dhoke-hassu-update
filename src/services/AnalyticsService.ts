import { supabase } from '../utils/supabaseClient';

export interface AnalyticsEventPayload {
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, any>;
  module?: string;
}

export interface AnalyticsEvent {
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  metadata: Record<string, any>;
}

const ANONYMOUS_EVENTS = new Set([
  'post_view', 'video_view', 'job_view', 'event_view', 'service_view', 
  'provider_profile_view', 'app_open', 'page_view', 
  'user_login', 'user_signup', 'user_logout', 'forgot_password',
  'notification_received', 'notification_click',
  'chat_active_session', 'chat_open'
]);

class AnalyticsService {
  private static instance: AnalyticsService;
  private queue: AnalyticsEvent[] = [];
  private isFlushing: boolean = false;
  private isEnabled: boolean = true;
  private currentUserId: string | null = null;
  
  private readonly BATCH_SIZE = 20;
  private readonly FLUSH_INTERVAL_MS = 10000; // 10 seconds
  private readonly MAX_QUEUE_SIZE = 500;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [2000, 5000, 10000]; // 2s, 5s, 10s

  private flushTimer: NodeJS.Timeout | null = null;
  private isDebug: boolean = import.meta.env.DEV || false;

  // Debug State
  private totalEventsSent: number = 0;
  private totalEventsDropped: number = 0;
  private lastUploadTime: string | null = null;
  private lastUploadResult: 'success' | 'failed' | null = null;
  private lastRetryableError: string | null = null;
  private lastPermanentError: string | null = null;
  private currentAttemptCount: number = 0;
  private recentProcessedEvents: AnalyticsEvent[] = [];
  private debugListeners: Set<() => void> = new Set();

  private constructor() {
    this.startTimer();
  }

  private notifyDebugListeners(): void {
    if (this.isDebug) {
      this.debugListeners.forEach(listener => listener());
    }
  }

  // --- Developer Debug Methods (Only active in DEV) ---
  public subscribeDebug(listener: () => void): () => void {
    if (this.isDebug) {
      this.debugListeners.add(listener);
    }
    return () => {
      this.debugListeners.delete(listener);
    };
  }

  public getDebugSnapshot() {
    if (!this.isDebug) return null;
    return {
      isEnabled: this.isEnabled,
      currentUserId: this.currentUserId,
      queueSize: this.queue.length,
      isFlushing: this.isFlushing,
      currentAttemptCount: this.currentAttemptCount,
      totalEventsSent: this.totalEventsSent,
      totalEventsDropped: this.totalEventsDropped,
      lastUploadTime: this.lastUploadTime,
      lastUploadResult: this.lastUploadResult,
      lastRetryableError: this.lastRetryableError,
      lastPermanentError: this.lastPermanentError,
      recentProcessedEvents: this.recentProcessedEvents,
      queueSnapshot: [...this.queue],
      networkOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    };
  }
  // ---------------------------------------------------

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public enable(): void {
    this.isEnabled = true;
    this.startTimer();
    this.notifyDebugListeners();
  }

  public disable(): void {
    this.isEnabled = false;
    this.stopTimer();
    this.notifyDebugListeners();
  }

  public identify(userId: string): void {
    this.currentUserId = userId;
    this.notifyDebugListeners();
  }

  public reset(): void {
    this.currentUserId = null;
    this.queue = [];
    this.stopTimer();
    this.startTimer();
    this.notifyDebugListeners();
  }

  public track(event_type: string, payload: AnalyticsEventPayload = {}): void {
    if (!this.isEnabled) return;

    console.log('[Analytics] track called', event_type, payload);
    try {
// Validate entity_id; if not a UUID, store original ID in metadata and set entity_id to null
      const rawEntityId = payload.entity_id;
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      const isUuid = typeof rawEntityId === 'string' && uuidRegex.test(rawEntityId);
      const meta: Record<string, any> = {
        ...(payload.metadata || {}),
        module: payload.module,
        device: this.getDevice(),
        platform: this.getPlatform(),
        app_version: '1.0.0', // Standardized version tracking
        timestamp: new Date().toISOString()
      };
      if (rawEntityId != null && !isUuid) {
        meta.original_entity_id = rawEntityId;
      }
      const event: AnalyticsEvent = {
        event_type,
        entity_type: payload.entity_type || null,
        entity_id: isUuid ? rawEntityId : null,
        user_id: this.currentUserId || null,
        metadata: meta
      };
        console.log('[Analytics] Event constructed', event);

      if (this.queue.length >= this.MAX_QUEUE_SIZE) {
        // Drop oldest event if queue is full
        this.queue.shift();
      }

      this.queue.push(event);
      console.log('[Analytics] Queue size after push', this.queue.length);

      if (this.isDebug) {
        console.log(`[Analytics Track] ${event_type}`, event);
      }

      if (this.queue.length >= this.BATCH_SIZE) { // Trigger flush when batch size reached
        this.flush(); // Fire and forget
      } else {
        this.notifyDebugListeners();
      }
    } catch (e) {
      // Analytics failures must be completely silent
    }
  }

  public async flush(): Promise<void> {
    if (!this.isEnabled || this.isFlushing || this.queue.length === 0) return;

    this.isFlushing = true;
    this.currentAttemptCount = 0;
    this.notifyDebugListeners();

    // Snapshot the batch to upload
    let batch = this.queue.splice(0, this.BATCH_SIZE);

    // VALIDATION: Drop events that will definitely fail RLS or database constraints
    batch = batch.filter(event => {
      // entity_type is always required.
      if (event.entity_type == null) {
        if (this.isDebug) console.warn('[Analytics] Dropping event missing entity_type:', event);
        return false;
      }
      
      // user_id validation: drop if null UNLESS the event is explicitly permitted to be anonymous
      if (event.user_id == null && !ANONYMOUS_EVENTS.has(event.event_type)) {
        if (this.isDebug) console.warn('[Analytics] Dropping event missing required user_id:', event);
        return false;
      }

      return true;
    });

    if (batch.length === 0) {
      this.isFlushing = false;
      return;
    }
    
    if (this.isDebug) {
      console.log(`[Analytics Flush] Uploading ${batch.length} events...`);
    }

    let attempt = 0;
    let success = false;

    while (attempt <= this.MAX_RETRIES && !success) {
      try {
        // Log the payload about to be inserted
        const { error } = await supabase
          .from('analytics_events')
          .insert(batch);

        if (error) {
          console.error('[Analytics] Insert error details', {
            message: error.message,
            code: (error as any).code,
            details: (error as any).details,
            hint: (error as any).hint,
            status: (error as any).status
          });
          throw error;
        }
        
        success = true;
        this.totalEventsSent += batch.length;
        this.lastUploadTime = new Date().toISOString();
        this.lastUploadResult = 'success';
        this.recentProcessedEvents = [...batch.reverse(), ...this.recentProcessedEvents].slice(0, 20);
        
        if (this.isDebug) {
          console.log(`[Analytics Flush] Uploaded successfully.`);
        }
      } catch (e: any) {
        console.error('[Analytics] Flush error', e);
        this.lastUploadResult = 'failed';
        this.lastUploadTime = new Date().toISOString();

        if (!this.isRetryable(e)) {
          this.totalEventsDropped += batch.length;
          this.lastPermanentError = String(e.message || e.code || 'Unknown permanent error');
          this.recentProcessedEvents = [...batch.map(ev => ({...ev, _dropped: true}) as any).reverse(), ...this.recentProcessedEvents].slice(0, 20);
          
          if (this.isDebug) {
            console.error(`[Analytics Flush] Permanent error encountered. Dropping ${batch.length} events.`, e);
          }
          // Do not retry. Do not requeue. Break out of the retry loop.
          break;
        }

        attempt++;
        this.currentAttemptCount = attempt;
        this.lastRetryableError = String(e.message || e.code || 'Unknown retryable error');
        this.notifyDebugListeners();

        if (attempt <= this.MAX_RETRIES) {
          const delay = this.RETRY_DELAYS[attempt - 1];
          if (this.isDebug) {
            console.log(`[Analytics Flush] Upload failed. Retrying in ${delay}ms... (Attempt ${attempt})`, e);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // If network is completely offline or fails repeatedly, push events back to the front of the queue
          // to try again later when connectivity returns, provided we haven't exceeded MAX_QUEUE_SIZE.
          if (this.isDebug) {
             console.log(`[Analytics Flush] Exhausted retries. Retaining ${batch.length} events in queue.`);
          }
          
          // Re-insert un-uploaded batch to the front of the queue
          this.queue.unshift(...batch);
          
          // Trim queue if it exceeded max size from unshifting
          if (this.queue.length > this.MAX_QUEUE_SIZE) {
             const dropped = this.queue.splice(this.MAX_QUEUE_SIZE);
             this.totalEventsDropped += dropped.length;
          }
        }
      }
    }

    this.isFlushing = false;
    this.currentAttemptCount = 0;
    this.notifyDebugListeners();

    // If there are more events waiting that meet batch size, flush again
    if (this.queue.length >= this.BATCH_SIZE) {
      this.flush(); 
    }
  }

  private startTimer(): void {
    // Only valid in browser context
    if (typeof window !== 'undefined' && !this.flushTimer) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.FLUSH_INTERVAL_MS);
    }
  }

  private stopTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private getDevice(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    return /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(navigator.userAgent) ? 'mobile' : 'desktop';
  }

  private getPlatform(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    return navigator.platform || 'unknown';
  }

  private isRetryable(error: any): boolean {
    if (!error) return true;

    const status = String(error.status || '');
    const code = String(error.code || '');

    // Check HTTP status codes for permanent rejection
    if (status === '400' || status === '401' || status === '403' || status === '404') {
      return false;
    }

    // Check Postgres/Supabase specific error codes
    // 42501: Insufficient Privilege (RLS)
    // 22P02: Invalid Text Representation (Bad UUID)
    // 23503: Foreign Key Violation
    // 23505: Unique Violation
    const permanentPgCodes = ['42501', '22P02', '23503', '23505'];
    if (permanentPgCodes.includes(code)) {
      return false;
    }

    // Default to retryable for network errors, 5xx, timeouts, 429 Rate Limit
    return true;
  }
}

export const analytics = AnalyticsService.getInstance();
