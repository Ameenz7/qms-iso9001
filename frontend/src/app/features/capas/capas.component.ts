import { CommonModule } from '@angular/common';
import { Component, Inject, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { exportCsv } from '../../core/export.util';
import { CAPAStatus, Capa, Role, UserRecord } from '../../core/models';

@Component({
  selector: 'app-capa-dialog',
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
    <h2 mat-dialog-title>{{ data.capa ? 'Edit CAPA' : 'New CAPA' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Code</mat-label>
            <input matInput formControlName="code" required />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Title</mat-label>
            <input matInput formControlName="title" required />
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput rows="2" formControlName="description"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Root Cause</mat-label>
          <textarea matInput rows="2" formControlName="rootCause"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Corrective Action</mat-label>
          <textarea matInput rows="2" formControlName="correctiveAction"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Preventive Action</mat-label>
          <textarea matInput rows="2" formControlName="preventiveAction"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Verification / Effectiveness Check</mat-label>
          <textarea matInput rows="2" formControlName="verification"></textarea>
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline" *ngIf="data.capa">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option *ngFor="let s of statuses" [value]="s">
                {{ s }}
              </mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Due Date</mat-label>
            <input matInput type="date" formControlName="dueDate" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Assigned To</mat-label>
            <mat-select formControlName="assignedToId">
              <mat-option [value]="null">—</mat-option>
              <mat-option *ngFor="let u of data.users" [value]="u.id">
                {{ u.firstName }} {{ u.lastName }} ({{ u.email }})
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid"
        (click)="save()">
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form {
        display: flex;
        flex-direction: column;
        min-width: 560px;
      }
      .row {
        display: flex;
        gap: 12px;
      }
      .row mat-form-field {
        flex: 1;
      }
    `,
  ],
})
export class CapaDialogComponent {
  private fb = inject(FormBuilder);
  statuses = Object.values(CAPAStatus);
  form;

  constructor(
    public dialogRef: MatDialogRef<CapaDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { capa?: Capa; users: UserRecord[] },
  ) {
    const c = data.capa;
    this.form = this.fb.nonNullable.group({
      code: [{ value: c?.code ?? '', disabled: !!c }, [Validators.required]],
      title: [c?.title ?? '', [Validators.required]],
      description: [c?.description ?? ''],
      rootCause: [c?.rootCause ?? ''],
      correctiveAction: [c?.correctiveAction ?? ''],
      preventiveAction: [c?.preventiveAction ?? ''],
      verification: [c?.verification ?? ''],
      status: [c?.status ?? CAPAStatus.OPEN],
      dueDate: [c?.dueDate ? c.dueDate.substring(0, 10) : ''],
      assignedToId: [c?.assignedToId ?? null as string | null],
    });
  }

  save() {
    const v = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      title: v.title,
      description: v.description,
      rootCause: v.rootCause || null,
      correctiveAction: v.correctiveAction || null,
      preventiveAction: v.preventiveAction || null,
      verification: v.verification || null,
      dueDate: v.dueDate || null,
      assignedToId: v.assignedToId || null,
    };
    if (!this.data.capa) {
      payload['code'] = v.code;
    } else {
      payload['status'] = v.status;
    }
    this.dialogRef.close(payload);
  }
}

@Component({
  selector: 'app-capas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    RouterLink,
  ],
  template: `
    <div class="header">
      <h1>Corrective & Preventive Actions</h1>
      <div class="header-actions">
        <button mat-stroked-button (click)="exportAllCsv()">
          <mat-icon>download</mat-icon> Export CSV
        </button>
        <button
          mat-flat-button
          color="primary"
          *ngIf="canManage"
          (click)="openNew()">
          <mat-icon>add</mat-icon> New CAPA
        </button>
      </div>
    </div>

    <mat-card>
      <table mat-table [dataSource]="capas()" class="full-width">
        <ng-container matColumnDef="code">
          <th mat-header-cell *matHeaderCellDef>Code</th>
          <td mat-cell *matCellDef="let c">{{ c.code }}</td>
        </ng-container>
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Title</th>
          <td mat-cell *matCellDef="let c">
            <a [routerLink]="['/capas', c.id]" class="link">{{ c.title }}</a>
          </td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let c">
            <span class="chip" [ngClass]="statusChip(c.status)">{{
              c.status
            }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="due">
          <th mat-header-cell *matHeaderCellDef>Due Date</th>
          <td mat-cell *matCellDef="let c">
            {{ c.dueDate ? (c.dueDate | date: 'mediumDate') : '—' }}
          </td>
        </ng-container>
        <ng-container matColumnDef="assigned">
          <th mat-header-cell *matHeaderCellDef>Assigned</th>
          <td mat-cell *matCellDef="let c">
            {{ c.assignedTo ? c.assignedTo.firstName + ' ' + c.assignedTo.lastName : '—' }}
          </td>
        </ng-container>
        <ng-container matColumnDef="ncCount">
          <th mat-header-cell *matHeaderCellDef>Linked NCs</th>
          <td mat-cell *matCellDef="let c">
            {{ c.nonConformities?.length || 0 }}
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let c" class="right">
            <a
              mat-icon-button
              [routerLink]="['/capas', c.id]"
              matTooltip="Open">
              <mat-icon>open_in_new</mat-icon>
            </a>
            <button
              *ngIf="canManage"
              mat-icon-button
              (click)="openEdit(c)">
              <mat-icon>edit</mat-icon>
            </button>
            <button
              *ngIf="canManage"
              mat-icon-button
              color="warn"
              (click)="remove(c)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols"></tr>
      </table>
      <p class="empty" *ngIf="!capas().length">No CAPAs yet.</p>
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
      .link {
        color: var(--notion-accent, #2563eb);
        text-decoration: none;
        font-weight: 500;
      }
      .link:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class CapasComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  capas = signal<Capa[]>([]);
  users = signal<UserRecord[]>([]);
  cols = ['code', 'title', 'status', 'due', 'assigned', 'ncCount', 'actions'];

  get canManage(): boolean {
    return this.auth.hasRole(Role.QUALITY_MANAGER, Role.ADMIN_OWNER);
  }

  constructor() {
    this.refresh();
    if (this.canManage) {
      this.api.listUsers().subscribe((u) => this.users.set(u));
    }
  }

  refresh() {
    this.api.listCapas().subscribe((c) => this.capas.set(c));
  }

  exportAllCsv() {
    const rows = this.capas().map((c) => ({
      code: c.code,
      title: c.title,
      status: c.status,
      dueDate: c.dueDate ?? '',
      assignedTo: c.assignedTo
        ? `${c.assignedTo.firstName} ${c.assignedTo.lastName}`
        : '',
      linkedNCs: c.nonConformities?.length ?? 0,
    }));
    exportCsv(rows, 'capas.csv', [
      { key: 'code', label: 'Code' },
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'assignedTo', label: 'Assigned To' },
      { key: 'linkedNCs', label: 'Linked NCs' },
    ]);
  }

  statusChip(s: CAPAStatus): string {
    if (s === CAPAStatus.CLOSED) return 'chip-ok';
    if (s === CAPAStatus.PENDING_VALIDATION) return 'chip-info';
    if (s === CAPAStatus.REOPENED) return 'chip-warn';
    if (s === CAPAStatus.OPEN) return 'chip-warn';
    return 'chip-info';
  }

  openNew() {
    const ref = this.dialog.open(CapaDialogComponent, {
      data: { users: this.users() },
      width: '640px',
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.api.createCapa(payload).subscribe({
        next: () => {
          this.snack.open('CAPA created', 'OK', { duration: 2500 });
          this.refresh();
        },
        error: (e) =>
          this.snack.open(e?.error?.message || 'Error', 'Close', {
            duration: 4000,
          }),
      });
    });
  }

  openEdit(capa: Capa) {
    const ref = this.dialog.open(CapaDialogComponent, {
      data: { capa, users: this.users() },
      width: '640px',
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.api.updateCapa(capa.id, payload).subscribe({
        next: () => {
          this.snack.open('CAPA updated', 'OK', { duration: 2500 });
          this.refresh();
        },
      });
    });
  }

  remove(capa: Capa) {
    if (!confirm(`Delete CAPA "${capa.code}"?`)) return;
    this.api.deleteCapa(capa.id).subscribe(() => {
      this.snack.open('CAPA deleted', 'OK', { duration: 2500 });
      this.refresh();
    });
  }
}
