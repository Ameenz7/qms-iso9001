import { Injectable, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { AuthService } from './auth.service';
import { DataStore } from './data.store';
import {
  Audit,
  AuditChecklistItem,
  AuditFinding,
  AuditStatus,
  AuditType,
  NcSeverity,
} from './models';

@Injectable({ providedIn: 'root' })
export class AuditsService {
  private store = inject(DataStore);
  private auth = inject(AuthService);

  list(): Observable<Audit[]> {
    const orgId = this.auth.user()?.orgId;
    const items = this.store
      .audits()
      .filter((a) => !orgId || a.orgId === orgId)
      .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
    return of(items).pipe(delay(150));
  }

  get(id: string): Observable<Audit | undefined> {
    return of(this.store.audits().find((a) => a.id === id)).pipe(delay(100));
  }

  create(payload: {
    title: string;
    type: AuditType;
    scheduledDate: string;
    auditorId: string;
    scope: string;
  }): Observable<Audit> {
    const user = this.auth.user()!;
    const audit: Audit = {
      id: this.store.uid('aud'),
      title: payload.title,
      type: payload.type,
      scheduledDate: payload.scheduledDate,
      auditorId: payload.auditorId,
      status: 'PLANNED',
      orgId: user.orgId ?? 'org-1',
      scope: payload.scope,
      createdAt: new Date().toISOString(),
      checklist: [],
      findings: [],
    };
    this.store.audits.update((arr) => [audit, ...arr]);
    this.store.logAction({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'CREATE',
      entity: 'Audit',
      entityId: audit.id,
      details: `Planned audit "${audit.title}"`,
    });
    return of(audit).pipe(delay(200));
  }

  addChecklistItem(auditId: string, item: string): Observable<AuditChecklistItem> {
    const entry: AuditChecklistItem = {
      id: this.store.uid('chk'),
      auditId,
      item,
      finding: '',
      evidence: '',
      conformity: null,
    };
    this.store.audits.update((arr) =>
      arr.map((a) =>
        a.id === auditId ? { ...a, checklist: [...a.checklist, entry] } : a,
      ),
    );
    return of(entry).pipe(delay(100));
  }

  updateChecklistItem(
    auditId: string,
    itemId: string,
    patch: Partial<AuditChecklistItem>,
  ): Observable<AuditChecklistItem> {
    this.store.audits.update((arr) =>
      arr.map((a) =>
        a.id === auditId
          ? {
              ...a,
              checklist: a.checklist.map((c) =>
                c.id === itemId ? { ...c, ...patch } : c,
              ),
            }
          : a,
      ),
    );
    return of(
      this.store
        .audits()
        .find((a) => a.id === auditId)!
        .checklist.find((c) => c.id === itemId)!,
    ).pipe(delay(80));
  }

  addFinding(
    auditId: string,
    payload: { description: string; severity: NcSeverity },
  ): Observable<AuditFinding> {
    const finding: AuditFinding = {
      id: this.store.uid('find'),
      auditId,
      description: payload.description,
      severity: payload.severity,
      createdAt: new Date().toISOString(),
    };
    this.store.audits.update((arr) =>
      arr.map((a) =>
        a.id === auditId ? { ...a, findings: [...a.findings, finding] } : a,
      ),
    );
    return of(finding).pipe(delay(100));
  }

  setStatus(auditId: string, status: AuditStatus): Observable<Audit> {
    const user = this.auth.user()!;
    this.store.audits.update((arr) =>
      arr.map((a) => (a.id === auditId ? { ...a, status } : a)),
    );
    this.store.logAction({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'UPDATE',
      entity: 'Audit',
      entityId: auditId,
      details: `Status -> ${status}`,
    });
    return of(this.store.audits().find((a) => a.id === auditId)!).pipe(
      delay(120),
    );
  }
}
