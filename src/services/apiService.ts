import { Complaint, PriorityLevel } from '../types';

export const RENDER_BACKEND_URL =
  (import.meta as any).env?.VITE_BACKEND_URL || 'https://potholeiq-email-backend-qmbd.onrender.com';

export interface BackendHealthResponse {
  status: string;
  service?: string;
  timestamp?: string;
  uptimeSeconds?: number;
  environment?: string;
  corsEnabled?: boolean;
  features?: {
    healthCheck?: boolean;
    complaintsApi?: boolean;
    emailDispatch?: boolean;
  };
}

export interface EmailConfigStatusResponse {
  configured: boolean;
  hasApiKey: boolean;
  hasMunicipalEmail: boolean;
}

export interface BackendStatusState {
  isChecking: boolean;
  isConnected: boolean;
  url: string;
  healthData: BackendHealthResponse | null;
  error: string | null;
  mode: 'render_direct' | 'integrated_fallback' | 'offline';
  lastPing: string | null;
}

type StatusListener = (state: BackendStatusState) => void;

class ApiService {
  private baseUrl: string = RENDER_BACKEND_URL;
  private statusListeners: StatusListener[] = [];
  private state: BackendStatusState = {
    isChecking: false,
    isConnected: false,
    url: this.baseUrl,
    healthData: null,
    error: null,
    mode: 'render_direct',
    lastPing: null,
  };

  constructor() {
    // Initial health check in background (client browser only)
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.checkHealth().catch(() => {});
      }, 500);
    }
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getState(): BackendStatusState {
    return { ...this.state };
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.push(listener);
    listener(this.getState());
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private notifyStatus() {
    const currentState = this.getState();
    this.statusListeners.forEach((fn) => fn(currentState));
  }

  /**
   * Helper that executes a request. Attempts the Render backend directly first.
   * If a network or CORS exception occurs (e.g. before Render is redeployed with CORS headers),
   * transparently falls back to the integrated same-origin API.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; source: 'render' | 'fallback' }> {
    const targetEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const primaryUrl = `${this.baseUrl}${targetEndpoint}`;
    const fallbackUrl = targetEndpoint;

    // 1. Try deployed Render backend
    try {
      const response = await fetch(primaryUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      });

      // Verify the response is JSON, not an HTML fallback page from a SPA wildcard route
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        this.state = {
          ...this.state,
          isConnected: true,
          mode: 'render_direct',
          error: null,
          lastPing: new Date().toISOString(),
        };
        this.notifyStatus();
        return { data: data as T, source: 'render' };
      }
    } catch (err: any) {
      console.warn(`[PotholeIQ API] Render backend call to ${primaryUrl} failed (${err.message}). Trying fallback endpoint...`);
    }

    // 2. Try integrated backend fallback
    try {
      const response = await fetch(fallbackUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        this.state = {
          ...this.state,
          isConnected: true,
          mode: 'integrated_fallback',
          error: null,
          lastPing: new Date().toISOString(),
        };
        this.notifyStatus();
        return { data: data as T, source: 'fallback' };
      }

      throw new Error(`Endpoint returned non-JSON response (${response.status})`);
    } catch (fallbackErr: any) {
      this.state = {
        ...this.state,
        isConnected: false,
        mode: 'offline',
        error: fallbackErr.message || 'Backend connection failed',
        lastPing: new Date().toISOString(),
      };
      this.notifyStatus();
      throw fallbackErr;
    }
  }

  /**
   * Health endpoint: /api/health
   */
  async checkHealth(): Promise<BackendHealthResponse> {
    this.state.isChecking = true;
    this.notifyStatus();

    try {
      const result = await this.request<BackendHealthResponse>('/api/health');
      this.state = {
        ...this.state,
        isChecking: false,
        isConnected: true,
        healthData: result.data,
        mode: result.source === 'render' ? 'render_direct' : 'integrated_fallback',
        error: null,
        lastPing: new Date().toISOString(),
      };
      this.notifyStatus();
      return result.data;
    } catch (err: any) {
      this.state = {
        ...this.state,
        isChecking: false,
        isConnected: false,
        error: err.message || 'Health check failed',
        lastPing: new Date().toISOString(),
      };
      this.notifyStatus();
      throw err;
    }
  }

  /**
   * Email config status: /api/email-config-status
   */
  async getEmailConfigStatus(): Promise<EmailConfigStatusResponse> {
    const res = await this.request<EmailConfigStatusResponse>('/api/email-config-status');
    return res.data;
  }

  /**
   * Complaints retrieval: /api/complaints
   */
  async getComplaints(): Promise<Complaint[]> {
    const res = await this.request<{ success: boolean; complaints: Complaint[] }>('/api/complaints');
    if (res.data && Array.isArray(res.data.complaints)) {
      return res.data.complaints;
    }
    return [];
  }

  /**
   * Complaint submission: POST /api/complaints
   */
  async createComplaint(payload: Partial<Complaint>): Promise<Complaint> {
    const res = await this.request<{ success: boolean; complaint: Complaint; emailDispatched?: boolean }>(
      '/api/complaints',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    if (res.data?.complaint) {
      return res.data.complaint;
    }
    throw new Error('Failed to create complaint on backend');
  }

  /**
   * Update complaint status/assignment/repair: PATCH /api/complaints/:id/status
   */
  async updateComplaintStatus(
    id: string,
    updates: {
      status?: string;
      assignedEngineerId?: string;
      assignedEngineerName?: string;
      assignedEngineerEmail?: string;
      repairDeadline?: string;
      priority?: PriorityLevel;
      officerNotes?: string;
      afterPhotoUrl?: string;
      repairNotes?: string;
      repairMaterialsUsed?: string;
      rejectionReason?: string;
      completedAt?: string;
      repairStartedAt?: string;
    }
  ): Promise<Complaint> {
    const res = await this.request<{ success: boolean; complaint: Complaint }>(
      `/api/complaints/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );

    if (res.data?.complaint) {
      return res.data.complaint;
    }
    throw new Error(`Failed to update complaint #${id} on backend`);
  }

  /**
   * Send complaint alert email: POST /api/send-complaint-email
   */
  async sendComplaintEmail(payload: {
    complaintId: string;
    reporterName: string;
    severity: string;
    aiConfidence: number;
    latitude: number;
    longitude: number;
    photoUrl: string;
    address?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const res = await this.request<{ success: boolean; messageId?: string; error?: string }>(
      '/api/send-complaint-email',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  }
}

export const apiService = new ApiService();
