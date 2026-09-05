import {
  AccountSchema,
  ClusterSchema,
  ClusterDetailSchema,
  AuditLogEntrySchema,
  MetricsSchema,
  CostCurveSchema,
  CostCurvePoint,
  SHAPGlobalFeature,
} from './types';

export const BACKEND_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8080";

export class BackendOfflineError extends Error {
  constructor(endpoint: string) {
    super(`Cannot reach CoFraud API at ${BACKEND_URL}${endpoint}. Is the backend running?`);
    this.name = "BackendOfflineError";
  }
}

const CACHE_TTL_MS = 15000;
interface CacheEntry {
  timestamp: number;
  data: any;
}
const cache = new Map<string, CacheEntry>();

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();

  if (method !== 'GET') {
    cache.clear();
  } else {
    const cached = cache.get(endpoint);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
  } catch (err) {
    throw new BackendOfflineError(endpoint);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status} on ${endpoint}: ${body}`);
  }
  const data = await response.json();
  if (method === 'GET') {
    cache.set(endpoint, { timestamp: Date.now(), data });
  }
  return data;
}


export const api = {
  getAccounts: async (
    riskTier?: 'LOW' | 'REVIEW' | 'HOLD',
    status?: AccountSchema['status'],
    limit: number = 100
  ): Promise<AccountSchema[]> => {
    const params = new URLSearchParams();
    if (riskTier) params.set('risk_tier', riskTier);
    if (status) params.set('status', status);
    params.set('limit', String(limit));
    return apiCall(`/accounts?${params.toString()}`);
  },

  getAccountDetail: async (userId: string): Promise<AccountSchema> => {
    return apiCall(`/accounts/${encodeURIComponent(userId)}`);
  },

  getClusters: async (minSize: number = 1): Promise<ClusterSchema[]> => {
    return apiCall(`/clusters?min_size=${minSize}`);
  },

  getClusterDetail: async (clusterId: number): Promise<ClusterDetailSchema> => {
    return apiCall(`/clusters/${clusterId}`);
  },

  getReviewQueue: async (limit: number = 100): Promise<AccountSchema[]> => {
    return apiCall(`/review-queue?limit=${limit}`);
  },

  submitReviewAction: async (
    userId: string,
    action: 'approve' | 'escalate' | 'dismiss',
    reviewer: string = "Demo User"
  ): Promise<{ user_id: string; new_status: string }> => {
    return apiCall(`/review-queue/${encodeURIComponent(userId)}/action`, {
      method: "POST",
      body: JSON.stringify({ action, reviewer }),
    });
  },

  getModelInsights: async (): Promise<MetricsSchema> => {
    return apiCall("/metrics");
  },

  getShapGlobal: async (): Promise<{ global_importance: SHAPGlobalFeature[]; threshold_used: number }> => {
    return apiCall("/shap-global");
  },

  getShapLocal: async (userId: string) => {
    return apiCall(`/shap/${encodeURIComponent(userId)}`);
  },

  getCostCurve: async (): Promise<CostCurveSchema> => {
    return apiCall("/cost-curve");
  },

  getCostAtThreshold: async (t: number): Promise<CostCurvePoint> => {
    return apiCall(`/cost-at-threshold?t=${t}`);
  },

  getAuditLog: async (
    limit: number = 200,
    action?: 'approve' | 'escalate' | 'dismiss',
    search?: string
  ): Promise<AuditLogEntrySchema[]> => {
    const rows: AuditLogEntrySchema[] = await apiCall(`/audit-log?limit=${limit}`);
    let filtered = rows;
    if (action) filtered = filtered.filter(r => r.action === action);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r => r.user_id.toLowerCase().includes(q));
    }
    return filtered;
  },

  getExportUrl: (): string => {
    return `${BACKEND_URL}/audit-log/export`;
  },

  checkHealth: async (): Promise<boolean> => {
    try {
      await apiCall("/health");
      return true;
    } catch {
      return false;
    }
  },
};
