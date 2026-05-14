import { Injectable, signal } from '@angular/core';
import {
  Audit,
  AuditLog,
  Invitation,
  NonConformity,
  Organization,
  QmsDocument,
  User,
} from './models';
import {
  seedAuditLogs,
  seedAudits,
  seedDocuments,
  seedInvitations,
  seedNonConformities,
  seedOrganizations,
  seedUsers,
} from './mock-data';

/**
 * Central in-memory store. All mock services read/write here so changes are
 * reflected across modules during a single session.
 */
@Injectable({ providedIn: 'root' })
export class DataStore {
  readonly organizations = signal<Organization[]>([...seedOrganizations]);
  readonly users = signal<User[]>([...seedUsers]);
  readonly invitations = signal<Invitation[]>([...seedInvitations]);
  readonly documents = signal<QmsDocument[]>(
    JSON.parse(JSON.stringify(seedDocuments)) as QmsDocument[],
  );
  readonly nonConformities = signal<NonConformity[]>(
    JSON.parse(JSON.stringify(seedNonConformities)) as NonConformity[],
  );
  readonly audits = signal<Audit[]>(
    JSON.parse(JSON.stringify(seedAudits)) as Audit[],
  );
  readonly auditLogs = signal<AuditLog[]>([...seedAuditLogs]);

  logAction(
    entry: Omit<AuditLog, 'id' | 'timestamp'>,
  ): void {
    const log: AuditLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.update((logs) => [log, ...logs]);
  }

  uid(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
}
