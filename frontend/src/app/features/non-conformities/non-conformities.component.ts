import { CommonModule } from '@angular/common';
import { Component, Inject, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { exportCsv } from '../../core/export.util';
import {
  Capa,
  NCSeverity,
  NCStatus,
  NonConformity,
  Role,
} from '../../core/models';

@Component({
  selector: 'app-nc-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Submit Non-Conformity</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Area / Process</mat-label>
          <input matInput formControlName="area" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Severity</mat-label>
          <mat-select formControlName="severity">
            <mat-option *ngFor="let s of severities" [value]="s">
              {{ s | titlecase }}
            </mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea
            matInput
            rows="4"
            formControlName="description"
            required></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid"
        (click)="save()">
        Submit
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form {
        display: flex;
        flex-direction: column;
        min-width: 440px;
      }
    `,
  ],
})
export class NcDialogComponent {
  private fb = inject(FormBuilder);
  severities = Object.values(NCSeverity);
  form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    area: [''],
    severity: [NCSeverity.LOW],
    description: ['', [Validators.required]],
  });

  constructor(public dialogRef: MatDialogRef<NcDialogComponent>) {}

  save() {
    this.dialogRef.close(this.form.getRawValue());
  }
}

@Component({
  selector: 'app-nc-link-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Link to CAPA</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full">
        <mat-label>CAPA</mat-label>
        <mat-select [(value)]="selectedCapaId">
          <mat-option *ngFor="let c of data.capas" [value]="c.id">
            {{ c.code }} — {{ c.title }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="!selectedCapaId"
        (click)="dialogRef.close(selectedCapaId)">
        Link
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full {
        width: 100%;
        min-width: 380px;
      }
    `,
  ],
})
export class NcLinkDialogComponent {
  selectedCapaId: string | null = null;
  constructor(
    public dialogRef: MatDialogRef<NcLinkDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { capas: Capa[] },
  ) {}
}

@Component({
  selector: 'app-non-conformities',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
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
        <ng-container matColumnDef="capa">
          <th mat-header-cell *matHeaderCellDef>CAPA</th>
          <td mat-cell *matCellDef="let n">
            {{ n.capa ? n.capa.code : '—' }}
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
            <button
              *ngIf="canLink && !n.capa"
              mat-stroked-button
              color="primary"
              (click)="openLink(n)">
              <mat-icon>link</mat-icon> Link CAPA
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols"></tr>
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
        margin-bottom: 16px;
      }
      .header-actions {
        display: flex;
        gap: 8px;
      }
      h1 {
        margin: 0;
      }
      .right {
        text-align: right;
      }
      .empty {
        padding: 16px;
        color: var(--notion-text-muted);
      }
    `,
  ],
})
export class NonConformitiesComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  ncs = signal<NonConformity[]>([]);
  capas = signal<Capa[]>([]);
  cols = ['title', 'area', 'severity', 'status', 'capa', 'submitter', 'actions'];

  get canLink(): boolean {
    return this.auth.hasRole(Role.QUALITY_MANAGER, Role.ADMIN_OWNER);
  }

  constructor() {
    this.refresh();
    if (this.canLink) {
      this.api.listCapas().subscribe((c) => this.capas.set(c));
    }
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
    if (s === NCStatus.UNDER_REVIEW) return 'chip-warn';
    return 'chip-warn';
  }

  openSubmit() {
    const ref = this.dialog.open(NcDialogComponent, { width: '520px' });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.api.createNc(payload).subscribe({
        next: () => {
          this.snack.open('Non-conformity submitted', 'OK', {
            duration: 2500,
          });
          this.refresh();
        },
        error: (e) =>
          this.snack.open(e?.error?.message || 'Error', 'Close', {
            duration: 4000,
          }),
      });
    });
  }

  exportAllCsv() {
    const rows = this.ncs().map((n) => ({
      title: n.title,
      area: n.area ?? '',
      severity: n.severity,
      status: n.status,
      capa: n.capa?.code ?? '',
      submittedBy: n.submittedBy
        ? `${n.submittedBy.firstName} ${n.submittedBy.lastName}`
        : '',
      createdAt: n.createdAt,
    }));
    exportCsv(rows, 'non-conformities.csv', [
      { key: 'title', label: 'Title' },
      { key: 'area', label: 'Area' },
      { key: 'severity', label: 'Severity' },
      { key: 'status', label: 'Status' },
      { key: 'capa', label: 'CAPA' },
      { key: 'submittedBy', label: 'Submitted By' },
      { key: 'createdAt', label: 'Created' },
    ]);
  }

  openLink(nc: NonConformity) {
    const ref = this.dialog.open(NcLinkDialogComponent, {
      data: { capas: this.capas() },
      width: '460px',
    });
    ref.afterClosed().subscribe((capaId: string | undefined) => {
      if (!capaId) return;
      this.api.linkNcToCapa(nc.id, capaId).subscribe({
        next: () => {
          this.snack.open('Linked to CAPA', 'OK', { duration: 2500 });
          this.refresh();
        },
      });
    });
  }
}
