import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { exportCsv } from '../../../core/export.util';
import {
  EvidenceEntityType,
  NCSeverity,
  NCStatus,
  NonConformity,
  Role,
} from '../../../core/models';
import { NcModalComponent } from '../components/nc-modal.component';

@Component({
  selector: 'app-nc-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="header">
      <h1>Non-Conformities</h1>
      <div class="header-actions">
        <button mat-stroked-button (click)="exportAllCsv()">
          <mat-icon>download</mat-icon> Export CSV
        </button>
        <button mat-flat-button color="primary" (click)="openSubmit()">
          <mat-icon>add</mat-icon> Submit NC
        </button>
      </div>
    </div>

    <mat-card>
      <table mat-table [dataSource]="ncs()" class="full-width">
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Title</th>
          <td mat-cell *matCellDef="let n">{{ n.title }}</td>
        </ng-container>
        <ng-container matColumnDef="area">
          <th mat-header-cell *matHeaderCellDef>Area</th>
          <td mat-cell *matCellDef="let n">{{ n.area || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="severity">
          <th mat-header-cell *matHeaderCellDef>Severity</th>
          <td mat-cell *matCellDef="let n">
            <span class="chip" [ngClass]="severityChip(n.severity)">{{
              n.severity | titlecase
            }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let n">
            <span class="chip" [ngClass]="statusChip(n.status)">{{
              n.status
            }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="submitter">
          <th mat-header-cell *matHeaderCellDef>Submitted By</th>
          <td mat-cell *matCellDef="let n">
            {{ n.submittedBy?.firstName }} {{ n.submittedBy?.lastName }}
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let n" class="right">
            <button mat-icon-button color="primary" [routerLink]="['/non-conformities', n.id]" matTooltip="View Details">
              <mat-icon>visibility</mat-icon>
            </button>
            <button
              *ngIf="canManage()"
              mat-icon-button
              color="warn"
              (click)="remove(n); $event.stopPropagation()"
              matTooltip="Delete">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols" class="clickable" [routerLink]="['/non-conformities', row.id]"></tr>
      </table>
      <p class="empty" *ngIf="!ncs().length">No non-conformities yet.</p>
    </mat-card>
  `,
  styles: [
    `
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
      }
      .header-actions {
        display: flex;
        gap: 12px;
      }
      .full-width {
        width: 100%;
      }
      .right {
        text-align: right;
      }
      .empty {
        padding: 32px;
        text-align: center;
        color: #666;
      }
      .clickable {
        cursor: pointer;
      }
      .clickable:hover {
        background: #f8fafc;
      }
      .chip {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
      .chip-danger { background: #fee2e2; color: #b91c1c; }
      .chip-warn { background: #ffedd5; color: #c2410c; }
      .chip-info { background: #e0f2fe; color: #0369a1; }
      .chip-ok { background: #dcfce7; color: #15803d; }
    `,
  ],
})
export class NcListComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private router = inject(Router);

  ncs = signal<NonConformity[]>([]);
  cols = ['title', 'area', 'severity', 'status', 'submitter', 'actions'];

  canManage() {
    return this.auth.hasRole(Role.QUALITY_MANAGER, Role.ADMIN_OWNER);
  }

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.api.listNcs().subscribe((n) => this.ncs.set(n));
  }

  severityChip(s: NCSeverity): string {
    switch (s) {
      case NCSeverity.CRITICAL:
      case NCSeverity.HIGH:
        return 'chip-danger';
      case NCSeverity.MEDIUM:
        return 'chip-warn';
      default:
        return 'chip-info';
    }
  }

  statusChip(s: NCStatus): string {
    if (s === NCStatus.CLOSED) return 'chip-ok';
    if (s === NCStatus.LINKED) return 'chip-info';
    return 'chip-warn';
  }

  openSubmit() {
    this.dialog
      .open(NcModalComponent, { width: '520px' })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) {
          const { evidence, ...data } = payload;
          this.api.createNc(data).subscribe((nc) => {
            if (evidence) {
              this.api.uploadEvidence(nc.id, EvidenceEntityType.NC, evidence).subscribe(() => {
                this.refresh();
                this.snack.open('Non-conformity submitted with evidence', 'OK', {
                  duration: 3000,
                });
              });
            } else {
              this.refresh();
              this.snack.open('Non-conformity submitted', 'OK', {
                duration: 2500,
              });
            }
          });
        }
      });
  }

  remove(nc: NonConformity) {
    if (confirm(`Delete non-conformity "${nc.title}"?`)) {
      this.api.deleteNc(nc.id).subscribe(() => {
        this.snack.open('Non-conformity deleted', 'OK', { duration: 2500 });
        this.refresh();
      });
    }
  }

  exportAllCsv() {
    const rows = this.ncs().map((n) => ({
      title: n.title,
      area: n.area ?? '',
      severity: n.severity,
      status: n.status,
      submittedBy: n.submittedBy ? `${n.submittedBy.firstName} ${n.submittedBy.lastName}` : '',
      createdAt: n.createdAt,
    }));
    exportCsv(rows, 'non-conformities.csv', [
      { key: 'title', label: 'Title' },
      { key: 'area', label: 'Area' },
      { key: 'severity', label: 'Severity' },
      { key: 'status', label: 'Status' },
      { key: 'submittedBy', label: 'Submitted By' },
      { key: 'createdAt', label: 'Created' },
    ]);
  }

  openLink(nc: NonConformity) {
    // Legacy - can be removed later
  }

  promote(event: Event, nc: NonConformity) {
    // Legacy - can be removed later
  }
}
