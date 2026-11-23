export type ProspectStatus = 'NEW' | 'ANALYZING' | 'QUALIFIED' | 'NOT_QUALIFIED' | 'ERROR';
export type QualificationCategory = 'HIGH' | 'MEDIUM' | 'LOW';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type DraftStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SENT' | 'FAILED';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Prospect {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  website: string | null;
  industry: string | null;
  companyDescription: string;
  source: string;
  status: ProspectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Analysis {
  id: string;
  prospectId: string;
  correlationId: string;
  score: number;
  category: QualificationCategory;
  confidence: ConfidenceLevel;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missingInformation: string[];
  recommendations: string[];
  modelName: string | null;
  promptVersion: string | null;
  createdAt: string;
}

export interface Draft {
  id: string;
  prospectId: string;
  subject: string;
  body: string;
  status: DraftStatus;
  approvedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  prospectId: string | null;
  eventType: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ProspectDetail extends Prospect {
  analyses: Analysis[];
  drafts: Draft[];
  activity: Activity[];
}

export interface DashboardSummary {
  totalProspects: number;
  qualifiedProspects: number;
  analysesCount: number;
  pendingDrafts: number;
  sentDrafts: number;
  failedDrafts: number;
  prospectsByStatus: Record<ProspectStatus, number>;
  analysesByCategory: Record<QualificationCategory, number>;
  recentActivity: Activity[];
  demoMode: boolean;
}

export interface TriggerResponse {
  correlationId: string;
  status: string;
  message: string;
}

export interface SendResponse {
  draftId: string;
  status: string;
  simulated: boolean;
  message: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
}

export interface ApiErrorPayload {
  timestamp?: string;
  status?: number;
  code?: string;
  message?: string;
  path?: string;
  traceId?: string;
}
