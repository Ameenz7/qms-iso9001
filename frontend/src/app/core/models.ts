export type Role =
  | 'SUPER_ADMIN'
  | 'ORG_ADMIN'
  | 'QUALITY_MANAGER'
  | 'AUDITOR'
  | 'EMPLOYEE';

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ORG_ADMIN: 'Org Admin',
  QUALITY_MANAGER: 'Quality Manager',
  AUDITOR: 'Auditor',
  EMPLOYEE: 'Employee',
};

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdBy: string;
  createdAt: string;
  logoUrl?: string;
  timezone: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  orgId: string | null;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  orgId: string;
  role: Role;
  token: string;
  expiresAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  invitedBy: string;
  createdAt: string;
}

export type DocumentStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'OBSOLETE';

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  createdBy: string;
}

export interface DocumentMetadata {
  key: string;
  value: string;
}

export interface QmsDocument {
  id: string;
  title: string;
  type: string;
  status: DocumentStatus;
  currentVersionId: string;
  orgId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  metadata: DocumentMetadata[];
  versions: DocumentVersion[];
}

export type NcSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';
export type NcStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export interface RootCause {
  id: string;
  ncId: string;
  hypothesis: string;
  causeType: 'PEOPLE' | 'PROCESS' | 'EQUIPMENT' | 'MATERIAL' | 'ENVIRONMENT' | 'METHOD';
  isConfirmed: boolean;
  createdAt: string;
}

export type ActionStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';

export interface CorrectiveAction {
  id: string;
  ncId: string;
  causeId?: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: ActionStatus;
  completedAt?: string;
  createdAt: string;
}

export interface NonConformity {
  id: string;
  reference: string;
  title: string;
  description: string;
  severity: NcSeverity;
  status: NcStatus;
  assignedTo: string | null;
  reportedBy: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  rootCauses: RootCause[];
  actions: CorrectiveAction[];
}

export type AuditStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
export type AuditType = 'INTERNAL' | 'EXTERNAL' | 'SUPPLIER';

export interface AuditChecklistItem {
  id: string;
  auditId: string;
  item: string;
  finding: string;
  evidence: string;
  conformity: 'CONFORM' | 'NON_CONFORM' | 'NA' | null;
}

export interface AuditFinding {
  id: string;
  auditId: string;
  description: string;
  severity: NcSeverity;
  ncId?: string;
  createdAt: string;
}

export interface Audit {
  id: string;
  title: string;
  type: AuditType;
  scheduledDate: string;
  auditorId: string;
  status: AuditStatus;
  orgId: string;
  scope: string;
  createdAt: string;
  checklist: AuditChecklistItem[];
  findings: AuditFinding[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  ncOpen: number;
  ncInProgress: number;
  ncClosed: number;
  docsDraft: number;
  docsReview: number;
  docsApproved: number;
  auditsPlanned: number;
  auditsCompleted: number;
  actionsPending: number;
  actionsOverdue: number;
}

export interface TaskItem {
  id: string;
  kind: 'NC' | 'ACTION' | 'AUDIT' | 'DOCUMENT';
  title: string;
  link: string;
  dueDate?: string;
  status: string;
}
