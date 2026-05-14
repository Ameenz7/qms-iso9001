import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { DataStore } from './data.store';
import {
  CorrectiveAction,
  NcSeverity,
  NcStatus,
  NonConformity,
  RootCause,
} from './models';

@Injectable({ providedIn: 'root' })
export class NcService {
  private store = inject(DataStore);
  private auth = inject(AuthService);

  list(): Observable<NonConformity[]> {
    const orgId = this.auth.user()?.orgId;
    const items = this.store
      .nonConformities()
      .filter((n) => !orgId || n.orgId === orgId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return of(items).pipe(delay(150));
  }

  get(id: string): Observable<NonConformity | undefined> {
    return of(this.store.nonConformities().find((n) => n.id === id)).pipe(
      delay(100),
    );
  }

  create(payload: {
    title: string;
    description: string;
    severity: NcSeverity;
  }): Observable<NonConformity> {
    const user = this.auth.user()!;
    const year = new Date().getFullYear();
    const existing = this.store
      .nonConformities()
      .filter((n) => n.reference.startsWith(`NC-${year}-`)).length;
    const reference = `NC-${year}-${String(existing + 1).padStart(3, '0')}`;
    const nc: NonConformity = {
      id: this.store.uid('nc'),
      reference,
      title: payload.title,
      description: payload.description,
      severity: payload.severity,
      status: 'OPEN',
      assignedTo: null,
      reportedBy: user.id,
      orgId: user.orgId ?? 'org-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rootCauses: [],
      actions: [],
    };
    this.store.nonConformities.update((arr) => [nc, ...arr]);
    this.store.logAction({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'CREATE',
      entity: 'NonConformity',
      entityId: nc.id,
      details: `Reported ${nc.reference}`,
    });
    return of(nc).pipe(delay(200));
  }

  addCause(
    ncId: string,
    payload: { hypothesis: string; causeType: RootCause['causeType'] },
  ): Observable<RootCause> {
    const cause: RootCause = {
      id: this.store.uid('rc'),
      ncId,
      hypothesis: payload.hypothesis,
      causeType: payload.causeType,
      isConfirmed: false,
      createdAt: new Date().toISOString(),
    };
    this.store.nonConformities.update((arr) =>
      arr.map((n) =>
        n.id === ncId
          ? {
              ...n,
              rootCauses: [...n.rootCauses, cause],
              status: n.status === 'OPEN' ? 'IN_PROGRESS' : n.status,
              updatedAt: new Date().toISOString(),
            }
          : n,
      ),
    );
    return of(cause).pipe(delay(150));
  }

  confirmCause(ncId: string, causeId: string): Observable<RootCause> {
    this.store.nonConformities.update((arr) =>
      arr.map((n) =>
        n.id === ncId
          ? {
              ...n,
              rootCauses: n.rootCauses.map((c) =>
                c.id === causeId ? { ...c, isConfirmed: true } : c,
              ),
              updatedAt: new Date().toISOString(),
            }
          : n,
      ),
    );
    const updated = this.store
      .nonConformities()
      .find((n) => n.id === ncId)!
      .rootCauses.find((c) => c.id === causeId)!;
    return of(updated).pipe(delay(100));
  }

  addAction(
    ncId: string,
    payload: {
      description: string;
      assignedTo: string;
      dueDate: string;
      causeId?: string;
    },
  ): Observable<CorrectiveAction> {
    const action: CorrectiveAction = {
      id: this.store.uid('act'),
      ncId,
      causeId: payload.causeId,
      description: payload.description,
      assignedTo: payload.assignedTo,
      dueDate: payload.dueDate,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.store.nonConformities.update((arr) =>
      arr.map((n) =>
        n.id === ncId
          ? {
              ...n,
              actions: [...n.actions, action],
              status: n.status === 'OPEN' ? 'IN_PROGRESS' : n.status,
              updatedAt: new Date().toISOString(),
            }
          : n,
      ),
    );
    return of(action).pipe(delay(150));
  }

  completeAction(
    ncId: string,
    actionId: string,
  ): Observable<CorrectiveAction> {
    this.store.nonConformities.update((arr) =>
      arr.map((n) =>
        n.id === ncId
          ? {
              ...n,
              actions: n.actions.map((a) =>
                a.id === actionId
                  ? {
                      ...a,
                      status: 'DONE' as const,
                      completedAt: new Date().toISOString(),
                    }
                  : a,
              ),
              updatedAt: new Date().toISOString(),
            }
          : n,
      ),
    );
    const updated = this.store
      .nonConformities()
      .find((n) => n.id === ncId)!
      .actions.find((a) => a.id === actionId)!;
    return of(updated).pipe(delay(100));
  }

  close(ncId: string): Observable<NonConformity> {
    const nc = this.store.nonConformities().find((n) => n.id === ncId);
    if (!nc) return throwError(() => new Error('NC not found'));
    const allDone = nc.actions.length > 0 && nc.actions.every((a) => a.status === 'DONE');
    if (!allDone) {
      return throwError(
        () => new Error('All corrective actions must be DONE before closing'),
      );
    }
    const user = this.auth.user()!;
    this.store.nonConformities.update((arr) =>
      arr.map((n) =>
        n.id === ncId
          ? {
              ...n,
              status: 'CLOSED' as NcStatus,
              closedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : n,
      ),
    );
    this.store.logAction({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'UPDATE',
      entity: 'NonConformity',
      entityId: ncId,
      details: `Closed ${nc.reference}`,
    });
    return of(this.store.nonConformities().find((n) => n.id === ncId)!).pipe(
      delay(150),
    );
  }

  assign(ncId: string, userId: string): Observable<NonConformity> {
    this.store.nonConformities.update((arr) =>
      arr.map((n) =>
        n.id === ncId
          ? { ...n, assignedTo: userId, updatedAt: new Date().toISOString() }
          : n,
      ),
    );
    return of(this.store.nonConformities().find((n) => n.id === ncId)!).pipe(
      delay(100),
    );
  }
}
