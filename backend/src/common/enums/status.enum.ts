export enum NCStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  UNDER_INVESTIGATION = 'under_investigation',
  LINKED = 'linked',
  CLOSED = 'closed',
}

export enum NCSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
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
