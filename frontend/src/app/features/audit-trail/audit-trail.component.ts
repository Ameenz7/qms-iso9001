import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { AuditLogService } from '../../core/audit-log.service';
import { AuditLog } from '../../core/models';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Audit Trail</h1>
          <div class="subtitle">Immutable log of changes across the system</div>
        </div>
      </div>

      <mat-card>
        <table mat-table [dataSource]="logs()" class="full-width">
          <ng-container matColumnDef="when">
            <th mat-header-cell *matHeaderCellDef>When</th>
            <td mat-cell *matCellDef="let l">{{ l.timestamp | date: 'medium' }}</td>
          </ng-container>
          <ng-container matColumnDef="who">
            <th mat-header-cell *matHeaderCellDef>Who</th>
            <td mat-cell *matCellDef="let l">{{ l.userName }}</td>
          </ng-container>
          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef>Action</th>
            <td mat-cell *matCellDef="let l">
              <span class="action-tag" [class]="'action-' + l.action.toLowerCase()">{{ l.action }}</span>
              {{ l.entity }}
            </td>
          </ng-container>
          <ng-container matColumnDef="detail">
            <th mat-header-cell *matHeaderCellDef>Details</th>
            <td mat-cell *matCellDef="let l">{{ l.details }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
        <div *ngIf="logs().length === 0" class="empty-state">
          <mat-icon>history</mat-icon>
          <div>No activity logged yet.</div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .action-tag {
        font-size: 11px;
        padding: 1px 8px;
        border-radius: 8px;
        margin-right: 6px;
        font-weight: 500;
      }
      .action-create { background: #d1fae5; color: #065f46; }
      .action-update { background: #fef3c7; color: #92400e; }
      .action-delete { background: #fee2e2; color: #991b1b; }
    `,
  ],
})
export class AuditTrailComponent implements OnInit {
  private service = inject(AuditLogService);
  logs = signal<AuditLog[]>([]);
  cols = ['when', 'who', 'action', 'detail'];

  ngOnInit(): void {
    this.service.list().subscribe((l) => this.logs.set(l));
  }
}
