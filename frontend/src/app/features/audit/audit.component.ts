import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { exportCsv } from '../../core/export.util';
import { AuditLog } from '../../core/models';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="header">
      <h1>Audit Trail</h1>
      <div class="header-actions">
        <button mat-stroked-button (click)="exportAllCsv()">
          <mat-icon>download</mat-icon> Export CSV
        </button>
        <button mat-stroked-button (click)="exportServerCsv()">
          <mat-icon>cloud_download</mat-icon> Server Export
        </button>
      </div>
    </div>

    <mat-card class="filters-card">
      <div class="filters">
        <mat-form-field>
          <mat-label>Entity</mat-label>
          <mat-select [(ngModel)]="filters.entity" (selectionChange)="loadLogs()">
            <mat-option value="">All</mat-option>
            <mat-option *ngFor="let e of entityOptions" [value]="e">{{ e }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Action</mat-label>
          <input matInput [(ngModel)]="filters.action" (change)="loadLogs()" placeholder="e.g. create" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Start Date</mat-label>
          <input matInput type="date" [(ngModel)]="filters.startDate" (change)="loadLogs()" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>End Date</mat-label>
          <input matInput type="date" [(ngModel)]="filters.endDate" (change)="loadLogs()" />
        </mat-form-field>
      </div>
    </mat-card>

    <mat-card>
      <table mat-table [dataSource]="logs()" class="full-width">
        <ng-container matColumnDef="when">
          <th mat-header-cell *matHeaderCellDef>When</th>
          <td mat-cell *matCellDef="let l">{{ l.createdAt | date: 'medium' }}</td>
        </ng-container>
        <ng-container matColumnDef="user">
          <th mat-header-cell *matHeaderCellDef>User</th>
          <td mat-cell *matCellDef="let l">
            <span *ngIf="l.user">{{ l.user.firstName }} {{ l.user.lastName }}</span>
            <span *ngIf="!l.user" class="muted">System</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="action">
          <th mat-header-cell *matHeaderCellDef>Action</th>
          <td mat-cell *matCellDef="let l">{{ l.action }}</td>
        </ng-container>
        <ng-container matColumnDef="entity">
          <th mat-header-cell *matHeaderCellDef>Entity</th>
          <td mat-cell *matCellDef="let l">
            {{ l.entity }} <small class="muted">({{ l.entityId | slice: 0 : 8 }})</small>
          </td>
        </ng-container>
        <ng-container matColumnDef="meta">
          <th mat-header-cell *matHeaderCellDef>Details</th>
          <td mat-cell *matCellDef="let l">
            <code *ngIf="l.metadata" class="details">{{ l.metadata | json }}</code>
            <span *ngIf="!l.metadata" class="muted">—</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="hash">
          <th mat-header-cell *matHeaderCellDef>Hash</th>
          <td mat-cell *matCellDef="let l">
            <code *ngIf="l.hashChain" class="hash" [title]="l.hashChain">{{ l.hashChain | slice: 0 : 12 }}…</code>
            <span *ngIf="!l.hashChain" class="muted">—</span>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols"></tr>
      </table>
      <p class="empty" *ngIf="!logs().length">No audit entries yet.</p>
    </mat-card>
  `,
  styles: [`
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .header-actions { display: flex; gap: 8px; }
    h1 { margin: 0; }
    .filters-card { padding: 12px 16px; margin-bottom: 16px; }
    .filters { display: flex; gap: 12px; flex-wrap: wrap; }
    .filters mat-form-field { flex: 1; min-width: 150px; }
    .empty { padding: 16px; color: #94a3b8; }
    .muted { color: #94a3b8; }
    code.details { font-size: 11px; max-width: 200px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    code.hash { font-size: 11px; color: #64748b; }
    table { width: 100%; }
  `],
})
export class AuditComponent {
  private api = inject(ApiService);
  logs = signal<AuditLog[]>([]);
  cols = ['when', 'user', 'action', 'entity', 'meta', 'hash'];
  filters = { entity: '', action: '', startDate: '', endDate: '' };
  entityOptions = [
    'NonConformity', 'Capa', 'CapaSubtask', 'Document',
    'User', 'Organization', 'AuditSchedule', 'AuditFinding',
    'RootCause', 'CorrectiveAction',
  ];

  constructor() {
    this.loadLogs();
  }

  loadLogs() {
    const f: Record<string, string> = {};
    if (this.filters.entity) f['entity'] = this.filters.entity;
    if (this.filters.action) f['action'] = this.filters.action;
    if (this.filters.startDate) f['startDate'] = this.filters.startDate;
    if (this.filters.endDate) f['endDate'] = this.filters.endDate;
    this.api.listAuditLogs(f).subscribe((l) => this.logs.set(l));
  }

  exportAllCsv() {
    const rows = this.logs().map((l) => ({
      createdAt: l.createdAt,
      user: l.user ? `${l.user.firstName} ${l.user.lastName}` : '',
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      metadata: l.metadata ? JSON.stringify(l.metadata) : '',
      hashChain: l.hashChain ?? '',
    }));
    exportCsv(rows, 'audit-logs.csv', [
      { key: 'createdAt', label: 'When' },
      { key: 'user', label: 'User' },
      { key: 'action', label: 'Action' },
      { key: 'entity', label: 'Entity' },
      { key: 'entityId', label: 'Entity ID' },
      { key: 'metadata', label: 'Details' },
      { key: 'hashChain', label: 'Hash' },
    ]);
  }

  exportServerCsv() {
    window.open(this.api.exportCsvUrl('audit-logs'), '_blank');
  }
}
