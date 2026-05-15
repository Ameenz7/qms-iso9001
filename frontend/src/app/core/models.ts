export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN_OWNER = 'admin_owner',
  QUALITY_MANAGER = 'quality_manager',
  AUDITOR = 'auditor',
  EMPLOYEE = 'employee',
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Super Admin',
  [Role.ADMIN_OWNER]: 'Admin Owner',
  [Role.QUALITY_MANAGER]: 'Quality Manager',
  [Role.AUDITOR]: 'Auditor',
  [Role.EMPLOYEE]: 'Employee',
};

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string | null;
}

export interface LoginResponse {
  user: AuthUser;
}

export enum OrganizationStatus {
  ACTIVE = 'active',
  GRACE = 'grace',
  SUSPENDED = 'suspended',
}

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  plan: string;
  monthlyPrice: string;
  paidUntil: string | null;
  status: OrganizationStatus;
  suspendedAt: string | null;
  suspensionReason: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Payment {
  id: string;
  organizationId: string;
  amount: string;
  monthsCovered: number;
  paidAt: string;
  coversUntil: string;
  note: string | null;
  recordedById: string | null;
  createdAt: string;
}

export interface UserRecord extends AuthUser {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserInvite {
  id: string;
  email: string;
  role: Role;
  organizationId: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  invitedById: string | null;
  createdAt: string;
}

export interface CreateInviteResponse {
  invite: UserInvite;
  acceptUrl: string;
}

export interface InviteVerifyResponse {
  email: string;
  role: Role;
  organizationName: string | null;
  expiresAt: string;
}

export enum NCSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum NCStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  UNDER_INVESTIGATION = 'under_investigation',
  LINKED = 'linked',
  CLOSED = 'closed',
}

export enum CAPAStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING_VALIDATION = 'pending_validation',
  CLOSED = 'closed',
  REOPENED = 'reopened',
}

export enum CapaSubtaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  OBSOLETE = 'obsolete',
}

// Root Cause types
export enum CauseType {
  HUMAN = 'human',
  PROCESS = 'process',
  MATERIAL = 'material',
  MACHINE = 'machine',
  ENVIRONMENT = 'environment',
  METHOD = 'method',
}

export enum VerificationStatus {
  TO_VERIFY = 'to_verify',
  CONFIRMED = 'confirmed',
  UNCONFIRMED = 'unconfirmed',
}

export enum Likelihood {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum ActionType {
  CORRECTIVE = 'corrective',
  PREVENTIVE = 'preventive',
}

export enum ActionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  VERIFIED = 'verified',
}

export enum ActionPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// Audit types
export enum AuditType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  SUPPLIER = 'supplier',
}

export enum AuditFrequency {
  ONCE = 'once',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

export enum AuditStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum FindingType {
  CONFORM = 'conform',
  MINOR_NC = 'minor_nc',
  MAJOR_NC = 'major_nc',
  OBSERVATION = 'observation',
}

export enum FindingSeverity {
  MINOR = 'minor',
  MAJOR = 'major',
  CRITICAL = 'critical',
}

export enum FindingStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

export interface RootCause {
  id: string;
  organizationId: string;
  ncId: string;
  hypothesis: string;
  causeType: CauseType;
  verificationMethod: string | null;
  verificationStatus: VerificationStatus;
  verifiedById: string | null;
  verifiedBy?: AuthUser | null;
  verifiedAt: string | null;
  likelihood: Likelihood;
  isPrimary: boolean;
  actions?: CorrectiveAction[];
  createdAt: string;
  updatedAt: string;
}

export enum EvidenceEntityType {
  NC = 'nc',
  ACTION = 'action',
  AUDIT = 'audit',
  AUDIT_FINDING = 'audit_finding',
  DOCUMENT = 'document',
}

export interface Evidence {
  id: string;
  organizationId: string;
  entityId: string;
  entityType: EvidenceEntityType;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
  uploadedBy?: AuthUser;
  createdAt: string;
}

export interface CorrectiveAction {
  id: string;
  organizationId: string;
  rootCauseId: string | null;
  rootCause?: RootCause | null;
  ncId: string;
  description: string;
  actionType: ActionType;
  assignedToId: string | null;
  assignedTo?: AuthUser | null;
  priority: ActionPriority;
  dueDate: string | null;
  status: ActionStatus;
  completionDate: string | null;
  completionNotes: string | null;
  effectivenessCheckRequired: boolean;
  effectivenessVerified: boolean;
  createdById: string;
  createdBy?: AuthUser;
  createdAt: string;
  updatedAt: string;
}

export interface NonConformity {
  id: string;
  reference: string | null;
  title: string;
  description: string;
  area?: string;
  department?: string | null;
  detectionMethod?: string | null;
  severity: NCSeverity;
  status: NCStatus;
  submittedById: string;
  submittedBy?: AuthUser;
  assignedToId?: string | null;
  assignedTo?: AuthUser | null;
  closureDate?: string | null;
  rootCauses?: RootCause[];
  correctiveActions?: CorrectiveAction[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string | null;
  isPdf?: boolean;
  pdfStorageKey?: string | null;
  changeNote: string | null;
  createdById: string;
  createdBy?: AuthUser;
  createdAt: string;
}

export interface QmsDocument {
  id: string;
  code: string;
  title: string;
  content: string | null;
  isPdf: boolean;
  pdfStorageKey: string | null;
  version: number;
  status: DocumentStatus;
  createdById: string;
  createdBy?: AuthUser;
  versions?: DocumentVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAttachment {
  id: string;
  documentId: string;
  organizationId: string;
  documentVersion: number;
  filename: string;
  mimeType: string;
  size: string;
  sha256: string;
  storageKey: string;
  uploadedById: string | null;
  uploadedBy?: AuthUser | null;
  createdAt: string;
}

export interface DocumentShare {
  id: string;
  documentId: string;
  organizationId: string;
  expiresAt: string;
  revokedAt: string | null;
  label: string | null;
  createdById: string | null;
  createdAt: string;
}

export interface CreateShareResponse {
  share: DocumentShare;
  shareUrl: string;
}

export interface PublicShareView {
  share: {
    id: string;
    label: string | null;
    expiresAt: string;
    createdAt: string;
  };
  organization: { name: string };
  document: {
    id: string;
    code: string;
    title: string;
    content: string;
    version: number;
    status: string;
    updatedAt: string;
  };
  attachments: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: string;
    sha256: string;
    documentVersion: number;
    createdAt: string;
  }>;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  user?: AuthUser | null;
  organizationId: string | null;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  hashChain: string | null;
  createdAt: string;
}

// Audit Schedule types
export interface AuditChecklistItem {
  id: string;
  organizationId: string;
  auditId: string;
  itemNumber: number;
  requirement: string;
  evidenceRequired: boolean;
  findingType: FindingType | null;
  findingDescription: string | null;
  correctiveActionRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditFinding {
  id: string;
  organizationId: string;
  auditId: string;
  description: string;
  severity: FindingSeverity;
  category: string | null;
  referenceNcId: string | null;
  status: FindingStatus;
  closedById: string | null;
  closedBy?: AuthUser | null;
  closedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditSchedule {
  id: string;
  organizationId: string;
  type: AuditType;
  title: string;
  frequency: AuditFrequency;
  plannedDate: string;
  scope: string | null;
  auditorId: string | null;
  auditor?: AuthUser | null;
  auditeeId: string | null;
  auditee?: AuthUser | null;
  status: AuditStatus;
  completionDate: string | null;
  createdById: string;
  createdBy?: AuthUser;
  checklistItems?: AuditChecklistItem[];
  findings?: AuditFinding[];
  createdAt: string;
  updatedAt: string;
}

// Dashboard types
export interface DashboardKpis {
  nc: { total: number; open: number; closedThisMonth: number; critical: number };
  documents: { total: number; draft: number; approved: number };
  audits: { scheduled: number; completed: number };
  actions: { total: number; pending: number; overdue: number };
}

export interface DashboardTask {
  id: string;
  type: 'subtask' | 'action';
  title: string;
  status: string;
  dueDate: string | null;
  reference: string | null;
  link: string | null;
}

export interface ChartData {
  ncTrend: Array<{ month: string; count: number }>;
  ncByDepartment: Array<{ department: string; count: number }>;
  actionsByStatus: Array<{ status: string; count: number }>;
  docsByStatus: Array<{ status: string; count: number }>;
}
