import { Injectable, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { DataStore } from './data.store';
import { AuditLog } from './models';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private store = inject(DataStore);

  list(): Observable<AuditLog[]> {
    return of([...this.store.auditLogs()]).pipe(delay(120));
  }
}
