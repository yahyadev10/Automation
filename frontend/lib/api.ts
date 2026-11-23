import type {
  Activity,
  AuthUser,
  DashboardSummary,
  Draft,
  DraftStatus,
  PageResponse,
  Prospect,
  ProspectDetail,
  ProspectStatus,
  SendResponse,
  TriggerResponse,
} from '@/lib/types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:18080/api/v1';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(status: number, message: string, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let code: string | null = null;
    try {
      const payload = (await response.json()) as { message?: string; code?: string };
      message = payload.message ?? message;
      code = payload.code ?? null;
    } catch {
      message = response.statusText || message;
    }
    throw new ApiError(response.status, message, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});

export interface ProspectCreatePayload {
  companyName: string;
  contactName?: string;
  email?: string;
  website?: string;
  industry?: string;
  companyDescription: string;
  source: 'MANUAL' | 'FORM' | 'DEMO';
}

export interface DraftUpdatePayload {
  subject: string;
  body: string;
}

export const api = {
  me: () => request<AuthUser>('/auth/me'),
  login: (email: string, password: string) =>
    request<AuthUser>('/auth/login', json('POST', { email, password })),
  logout: () => request<void>('/auth/logout', json('POST')),

  dashboard: () => request<DashboardSummary>('/dashboard/summary'),

  prospects: (params: {
    page?: number;
    size?: number;
    search?: string;
    status?: ProspectStatus | '';
  } = {}) => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    const suffix = query.toString();
    return request<PageResponse<Prospect>>(`/prospects${suffix ? `?${suffix}` : ''}`);
  },
  prospect: (id: string) => request<ProspectDetail>(`/prospects/${id}`),
  createProspect: (payload: ProspectCreatePayload) =>
    request<Prospect>('/prospects', json('POST', payload)),
  qualify: (id: string) =>
    request<TriggerResponse>(`/prospects/${id}/qualify`, json('POST')),
  generateDraft: (id: string) =>
    request<TriggerResponse>(`/prospects/${id}/email-drafts/generate`, json('POST')),

  drafts: (status: DraftStatus | '' = '', page = 0, size = 20) => {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) query.set('status', status);
    return request<PageResponse<Draft>>(`/email-drafts?${query.toString()}`);
  },
  draft: (id: string) => request<Draft>(`/email-drafts/${id}`),
  updateDraft: (id: string, payload: DraftUpdatePayload) =>
    request<Draft>(`/email-drafts/${id}`, json('PUT', payload)),
  approveDraft: (id: string) => request<Draft>(`/email-drafts/${id}/approve`, json('POST')),
  rejectDraft: (id: string) => request<Draft>(`/email-drafts/${id}/reject`, json('POST')),
  sendDraft: (id: string) => request<SendResponse>(`/email-drafts/${id}/send`, json('POST')),

  activity: (page = 0, size = 30) =>
    request<PageResponse<Activity>>(`/activity?page=${page}&size=${size}`),
};
