import { Injectable, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { AuthService } from './auth.service';
import { DataStore } from './data.store';
import { DashboardStats, TaskItem } from './models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private store = inject(DataStore);
  private auth = inject(AuthService);

  stats(): Observable<DashboardStats> {
    const orgId = this.auth.user()?.orgId;
    const ncs = this.store
      .nonConformities()
      .filter((n) => !orgId || n.orgId === orgId);
    const docs = this.store
      .documents()
      .filter((d) => !orgId || d.orgId === orgId);
    const audits = this.store
      .audits()
      .filter((a) => !orgId || a.orgId === orgId);
    const allActions = ncs.flatMap((n) => n.actions);
    const today = new Date().toISOString();

    const stats: DashboardStats = {
      ncOpen: ncs.filter((n) => n.status === 'OPEN').length,
      ncInProgress: ncs.filter((n) => n.status === 'IN_PROGRESS').length,
      ncClosed: ncs.filter((n) => n.status === 'CLOSED').length,
      docsDraft: docs.filter((d) => d.status === 'DRAFT').length,
      docsReview: docs.filter((d) => d.status === 'REVIEW').length,
      docsApproved: docs.filter((d) => d.status === 'APPROVED').length,
      auditsPlanned: audits.filter((a) => a.status === 'PLANNED').length,
      auditsCompleted: audits.filter((a) => a.status === 'COMPLETED').length,
      actionsPending: allActions.filter((a) => a.status !== 'DONE').length,
      actionsOverdue: allActions.filter(
        (a) => a.status !== 'DONE' && a.dueDate < today,
      ).length,
    };

    return of(stats).pipe(delay(120));
  }

  myTasks(): Observable<TaskItem[]> {
    const me = this.auth.user();
    if (!me) return of([]).pipe(delay(80));
    const ncs = this.store.nonConformities();
    const tasks: TaskItem[] = [];

    for (const nc of ncs) {
      if (nc.assignedTo === me.id && nc.status !== 'CLOSED') {
        tasks.push({
          id: nc.id,
          kind: 'NC',
          title: `${nc.reference} — ${nc.title}`,
          link: `/nc/${nc.id}`,
          status: nc.status,
        });
      }
      for (const action of nc.actions) {
        if (action.assignedTo === me.id && action.status !== 'DONE') {
          tasks.push({
            id: action.id,
            kind: 'ACTION',
            title: action.description,
            link: `/nc/${nc.id}`,
            dueDate: action.dueDate,
            status: action.status,
          });
        }
      }
    }

    for (const audit of this.store.audits()) {
      if (audit.auditorId === me.id && audit.status !== 'COMPLETED') {
        tasks.push({
          id: audit.id,
          kind: 'AUDIT',
          title: audit.title,
          link: `/audits/${audit.id}`,
          dueDate: audit.scheduledDate,
          status: audit.status,
        });
      }
    }

    return of(tasks).pipe(delay(120));
  }
}
