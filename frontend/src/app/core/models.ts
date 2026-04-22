export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN_OWNER = 'admin_owner',
  QUALITY_MANAGER = 'quality_manager',
  EMPLOYEE = 'employee',
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Super Admin',
  [Role.ADMIN_OWNER]: 'Admin Owner',
  [Role.QUALITY_MANAGER]: 'Quality Manager',
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

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord extends AuthUser {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  LINKED = 'linked',
  CLOSED = 'closed',
}

export enum CAPAStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  IMPLEMENTED = 'implemented',
  VERIFIED = 'verified',
  CLOSED = 'closed',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  OBSOLETE = 'obsolete',
}

export interface NonConformity {
  id: string;
  title: string;
  description: string;
  area?: string;
  severity: NCSeverity;
  status: NCStatus;
  submittedById: string;
  submittedBy?: AuthUser;
  capaId: string | null;
  capa?: Capa | null;
  createdAt: string;
  updatedAt: string;
}

export interface Capa {
  id: string;
  code: string;
  title: string;
  description: string;
  rootCause: string | null;
  correctiveAction: string | null;
  preventiveAction: string | null;
  verification: string | null;
  status: CAPAStatus;
  dueDate: string | null;
  createdById: string;
  assignedToId: string | null;
  createdBy?: AuthUser;
  assignedTo?: AuthUser | null;
  nonConformities?: NonConformity[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  changeNote: string | null;
  createdById: string;
  createdBy?: AuthUser;
  createdAt: string;
}

export interface QmsDocument {
  id: string;
  code: string;
  title: string;
  content: string;
  version: number;
  status: DocumentStatus;
  createdById: string;
  createdBy?: AuthUser;
  versions?: DocumentVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  organizationId: string | null;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
