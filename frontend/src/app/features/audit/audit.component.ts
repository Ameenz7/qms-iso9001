import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { AuditLog } from '../../core/models';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule],
  template: `
    <h1>Audit Logs</h1>
    <mat-card>
      <table mat-table [dataSource]="logs()" class="full-width">
        <ng-container matColumnDef="when">
          <th mat-header-cell *matHeaderCellDef>When</th>
          <td mat-cell *matCellDef="let l">{{ l.createdAt | date: 'medium' }}</td>
        </ng-container>
        <ng-container matColumnDef="action">
          <th mat-header-cell *matHeaderCellDef>Action</th>
          <td mat-cell *matCellDef="let l">{{ l.action }}</td>
        </ng-container>
        <ng-container matColumnDef="entity">
          <th mat-header-cell *matHeaderCellDef>Entity</th>
          <td mat-cell *matCellDef="let l">
            {{ l.entity }} <small>({{ l.entityId | slice: 0 : 8 }})</small>
          </td>
        </ng-container>
        <ng-container matColumnDef="meta">
          <th mat-header-cell *matHeaderCellDef>Details</th>
          <td mat-cell *matCellDef="let l">
            <code *ngIf="l.metadata">{{ l.metadata | json }}</code>
            <span *ngIf="!l.metadata">—</span>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols"></tr>
      </table>
      <p class="empty" *ngIf="!logs().length">No audit entries yet.</p>
    </mat-card>
  `,
  styles: [
    `
      h1 {
        margin: 0 0 16px;
      }
      .empty {
        padding: 16px;
        color: #64748b;
      }
      code {
        font-size: 12px;
      }
    `,
  ],
})
export class AuditComponent {
  private api = inject(ApiService);
  logs = signal<AuditLog[]>([]);
  cols = ['when', 'action', 'entity', 'meta'];

  constructor() {
    this.api.listAuditLogs().subscribe((l) => this.logs.set(l));
  }
}
