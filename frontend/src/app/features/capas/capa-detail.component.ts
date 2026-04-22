import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
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
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import {
  CAPAStatus,
  Capa,
  CapaSubtask,
  CapaSubtaskStatus,
  Role,
  UserRecord,
} from '../../core/models';

@Component({
  selector: 'app-subtask-dialog',
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
    <h2 mat-dialog-title>{{ data.subtask ? 'Edit subtask' : 'New subtask' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput rows="3" formControlName="description"></textarea>
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Assignee</mat-label>
            <mat-select formControlName="assigneeId">
              <mat-option [value]="null">— Unassigned —</mat-option>
              <mat-option *ngFor="let u of data.users" [value]="u.id">
                {{ u.firstName }} {{ u.lastName }}
              </mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Due date</mat-label>
            <input matInput type="date" formControlName="dueDate" />
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
        min-width: 520px;
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
export class SubtaskDialogComponent {
  private fb = inject(FormBuilder);
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<SubtaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { subtask?: CapaSubtask; users: UserRecord[] },
  ) {
    const s = data.subtask;
    this.form = this.fb.group({
      title: [s?.title ?? '', [Validators.required]],
      description: [s?.description ?? ''],
      assigneeId: [s?.assigneeId ?? null],
      dueDate: [s?.dueDate ? s.dueDate.substring(0, 10) : ''],
    });
  }

  save() {
    const v = this.form.getRawValue();
    this.dialogRef.close({
      title: v.title,
      description: v.description || undefined,
      assigneeId: v.assigneeId || null,
      dueDate: v.dueDate || null,
    });
  }
}

@Component({
  selector: 'app-capa-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatTableModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  template: `
    <a routerLink="/capas" class="back">
      <mat-icon>arrow_back</mat-icon> All CAPAs
    </a>

    <ng-container *ngIf="capa() as c">
      <div class="title-row">
        <div>
          <div class="code">{{ c.code }}</div>
          <h1>{{ c.title }}</h1>
          <p class="muted">{{ c.description }}</p>
        </div>
        <div class="status-col">
          <span class="chip" [ngClass]="statusChip(c.status)">
            {{ statusLabel(c.status) }}
          </span>
          <div class="actions">
            <button
              mat-stroked-button
              color="primary"
              *ngIf="canSubmitForValidation()"
              [disabled]="!canSubmitForValidationEnabled()"
              [matTooltip]="submitTooltip()"
              (click)="submitForValidation()">
              <mat-icon>send</mat-icon> Submit for validation
            </button>
            <button
              mat-flat-button
              color="primary"
              *ngIf="canValidate()"
              (click)="validate()">
              <mat-icon>verified</mat-icon> Validate & close
            </button>
            <button
              mat-stroked-button
              color="warn"
              *ngIf="canValidate()"
              (click)="reject()">
              <mat-icon>undo</mat-icon> Send back
            </button>
            <button
              mat-stroked-button
              *ngIf="canReopen()"
              (click)="reopen()">
              <mat-icon>refresh</mat-icon> Reopen
            </button>
          </div>
        </div>
      </div>

      <div class="grid">
        <mat-card class="card">
          <h3>5 Whys — Root cause analysis</h3>
          <p class="muted small">
            Ask "why?" up to five times to reach the real root cause. All saved
            automatically when you click Save.
          </p>
          <form [formGroup]="whysForm" class="whys">
            <mat-form-field
              *ngFor="let _ of [0, 1, 2, 3, 4]; let i = index"
              appearance="outline">
              <mat-label>Why {{ i + 1 }}?</mat-label>
              <input
                matInput
                [formControlName]="'w' + i"
                [disabled]="!canEditWorkflow()" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Root cause</mat-label>
              <textarea
                matInput
                rows="2"
                formControlName="rootCause"
                [disabled]="!canEditWorkflow()"></textarea>
            </mat-form-field>
            <div class="right">
              <button
                mat-flat-button
                color="primary"
                *ngIf="canEditWorkflow()"
                (click)="saveWhys()">
                Save root cause
              </button>
            </div>
          </form>
        </mat-card>

        <mat-card class="card">
          <div class="card-head">
            <h3>Subtasks</h3>
            <button
              mat-stroked-button
              color="primary"
              *ngIf="canEditWorkflow()"
              (click)="openAddSubtask()">
              <mat-icon>add</mat-icon> Add subtask
            </button>
          </div>
          <p class="muted small" *ngIf="!subtasks().length">
            No subtasks yet. Break the corrective action into assignable tasks.
          </p>
          <table
            mat-table
            [dataSource]="subtasks()"
            *ngIf="subtasks().length"
            class="full-width">
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Task</th>
              <td mat-cell *matCellDef="let s">
                <div class="sub-title">{{ s.title }}</div>
                <div class="muted small" *ngIf="s.description">{{ s.description }}</div>
              </td>
            </ng-container>
            <ng-container matColumnDef="assignee">
              <th mat-header-cell *matHeaderCellDef>Assignee</th>
              <td mat-cell *matCellDef="let s">
                {{
                  s.assignee
                    ? s.assignee.firstName + ' ' + s.assignee.lastName
                    : '—'
                }}
              </td>
            </ng-container>
            <ng-container matColumnDef="due">
              <th mat-header-cell *matHeaderCellDef>Due</th>
              <td mat-cell *matCellDef="let s">
                {{ s.dueDate ? (s.dueDate | date: 'mediumDate') : '—' }}
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let s">
                <mat-select
                  [value]="s.status"
                  [disabled]="!canChangeSubtaskStatus(s)"
                  (selectionChange)="changeSubtaskStatus(s, $event.value)"
                  class="status-select">
                  <mat-option [value]="'todo'">To do</mat-option>
                  <mat-option [value]="'in_progress'">In progress</mat-option>
                  <mat-option [value]="'done'">Done</mat-option>
                </mat-select>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let s" class="right">
                <button
                  mat-icon-button
                  *ngIf="canEditWorkflow()"
                  (click)="openEditSubtask(s)"
                  aria-label="Edit subtask">
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  mat-icon-button
                  color="warn"
                  *ngIf="canEditWorkflow()"
                  (click)="deleteSubtask(s)"
                  aria-label="Delete subtask">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="subCols"></tr>
            <tr mat-row *matRowDef="let row; columns: subCols"></tr>
          </table>
          <div class="summary muted small" *ngIf="subtasks().length">
            {{ doneCount() }} / {{ subtasks().length }} done
          </div>
        </mat-card>

        <mat-card class="card" *ngIf="c.nonConformities?.length">
          <h3>Linked Non-Conformities</h3>
          <ul>
            <li *ngFor="let nc of c.nonConformities">
              <strong>{{ nc.title }}</strong>
              <span class="muted small"> — {{ nc.status }}</span>
            </li>
          </ul>
        </mat-card>

        <mat-card class="card" *ngIf="c.validatedAt">
          <h3>Validation</h3>
          <p>
            Closed by <strong>{{ c.validatedBy?.firstName }} {{ c.validatedBy?.lastName }}</strong>
            on {{ c.validatedAt | date: 'medium' }}.
          </p>
        </mat-card>
      </div>
    </ng-container>
  `,
  styles: [
    `
      .back {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--notion-text-muted);
        text-decoration: none;
        margin-bottom: 12px;
      }
      .title-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
        margin-bottom: 16px;
      }
      .code {
        font-size: 12px;
        color: var(--notion-text-muted);
        letter-spacing: 0.05em;
      }
      h1 {
        margin: 0 0 4px;
      }
      .muted {
        color: var(--notion-text-muted);
      }
      .small {
        font-size: 12px;
      }
      .status-col {
        text-align: right;
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: flex-end;
      }
      .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .card {
        padding: 18px !important;
      }
      .card-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .card h3 {
        margin: 0 0 8px;
      }
      .whys {
        display: flex;
        flex-direction: column;
      }
      .right {
        text-align: right;
      }
      .sub-title {
        font-weight: 500;
      }
      .status-select {
        min-width: 130px;
      }
      .full-width {
        width: 100%;
      }
      .summary {
        padding-top: 8px;
      }
      ul {
        padding-left: 18px;
      }
      .chip {
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 500;
      }
      .chip-ok {
        background: #dcfce7;
        color: #166534;
      }
      .chip-info {
        background: #e0f2fe;
        color: #075985;
      }
      .chip-warn {
        background: #fef3c7;
        color: #92400e;
      }
      .chip-danger {
        background: #fee2e2;
        color: #991b1b;
      }
      .chip-pending {
        background: #ede9fe;
        color: #5b21b6;
      }
    `,
  ],
})
export class CapaDetailComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  capa = signal<Capa | null>(null);
  subtasks = signal<CapaSubtask[]>([]);
  users = signal<UserRecord[]>([]);

  whysForm: FormGroup = this.fb.group({
    w0: [''],
    w1: [''],
    w2: [''],
    w3: [''],
    w4: [''],
    rootCause: [''],
  });

  subCols = ['title', 'assignee', 'due', 'status', 'actions'];

  doneCount = computed(
    () => this.subtasks().filter((s) => s.status === CapaSubtaskStatus.DONE).length,
  );

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loadAll(id);
    if (this.auth.hasRole(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)) {
      this.api.listUsers().subscribe((u) => this.users.set(u));
    }
  }

  private loadAll(id: string) {
    this.api.getCapa(id).subscribe((c) => {
      this.capa.set(c);
      const w = c.fiveWhys ?? [];
      this.whysForm.patchValue({
        w0: w[0] ?? '',
        w1: w[1] ?? '',
        w2: w[2] ?? '',
        w3: w[3] ?? '',
        w4: w[4] ?? '',
        rootCause: c.rootCause ?? '',
      });
      this.subtasks.set(c.subtasks ?? []);
    });
    this.api.listCapaSubtasks(id).subscribe((s) => this.subtasks.set(s));
  }

  canEditWorkflow(): boolean {
    const c = this.capa();
    if (!c) return false;
    if (!this.auth.hasRole(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)) return false;
    return (
      c.status !== CAPAStatus.CLOSED &&
      c.status !== CAPAStatus.PENDING_VALIDATION
    );
  }

  canSubmitForValidation(): boolean {
    const c = this.capa();
    if (!c) return false;
    if (!this.auth.hasRole(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)) return false;
    return (
      c.status === CAPAStatus.OPEN ||
      c.status === CAPAStatus.IN_PROGRESS ||
      c.status === CAPAStatus.REOPENED
    );
  }

  canSubmitForValidationEnabled(): boolean {
    const c = this.capa();
    if (!c) return false;
    const rootCauseOk = !!(c.rootCause && c.rootCause.trim());
    const subs = this.subtasks();
    const allDone =
      subs.length > 0 && subs.every((s) => s.status === CapaSubtaskStatus.DONE);
    return rootCauseOk && allDone;
  }

  submitTooltip(): string {
    const c = this.capa();
    if (!c) return '';
    const subs = this.subtasks();
    const reasons: string[] = [];
    if (!c.rootCause || !c.rootCause.trim())
      reasons.push('Root cause is required');
    if (subs.length === 0) reasons.push('Add at least one subtask');
    else if (subs.some((s) => s.status !== CapaSubtaskStatus.DONE))
      reasons.push('All subtasks must be done');
    return reasons.join(' • ');
  }

  canValidate(): boolean {
    const c = this.capa();
    return (
      !!c &&
      c.status === CAPAStatus.PENDING_VALIDATION &&
      this.auth.hasRole(Role.QUALITY_MANAGER)
    );
  }

  canReopen(): boolean {
    const c = this.capa();
    return (
      !!c &&
      c.status === CAPAStatus.CLOSED &&
      this.auth.hasRole(Role.QUALITY_MANAGER)
    );
  }

  canChangeSubtaskStatus(s: CapaSubtask): boolean {
    const c = this.capa();
    if (!c) return false;
    if (c.status === CAPAStatus.CLOSED) return false;
    if (c.status === CAPAStatus.PENDING_VALIDATION) return false;
    if (this.auth.hasRole(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)) return true;
    return s.assigneeId === this.auth.user()?.id;
  }

  statusLabel(s: CAPAStatus): string {
    switch (s) {
      case CAPAStatus.OPEN: return 'Open';
      case CAPAStatus.IN_PROGRESS: return 'In progress';
      case CAPAStatus.PENDING_VALIDATION: return 'Pending validation';
      case CAPAStatus.CLOSED: return 'Closed';
      case CAPAStatus.REOPENED: return 'Reopened';
      default: return s;
    }
  }

  statusChip(s: CAPAStatus): string {
    switch (s) {
      case CAPAStatus.CLOSED: return 'chip-ok';
      case CAPAStatus.PENDING_VALIDATION: return 'chip-pending';
      case CAPAStatus.IN_PROGRESS: return 'chip-info';
      case CAPAStatus.REOPENED: return 'chip-warn';
      default: return 'chip-warn';
    }
  }

  saveWhys() {
    const c = this.capa();
    if (!c) return;
    const v = this.whysForm.getRawValue();
    const whys = [v.w0, v.w1, v.w2, v.w3, v.w4].map((x) => (x ?? '').toString());
    this.api
      .updateCapaFiveWhys(c.id, { fiveWhys: whys, rootCause: v.rootCause ?? '' })
      .subscribe({
        next: (updated) => {
          this.capa.set({ ...c, ...updated });
          this.snack.open('Root cause saved', 'OK', { duration: 2500 });
        },
        error: (e) => this.showError(e),
      });
  }

  openAddSubtask() {
    const c = this.capa();
    if (!c) return;
    const ref = this.dialog.open(SubtaskDialogComponent, {
      data: { users: this.users() },
      width: '560px',
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.api.createCapaSubtask(c.id, payload).subscribe({
        next: () => {
          this.snack.open('Subtask added', 'OK', { duration: 2500 });
          this.loadAll(c.id);
        },
        error: (e) => this.showError(e),
      });
    });
  }

  openEditSubtask(s: CapaSubtask) {
    const c = this.capa();
    if (!c) return;
    const ref = this.dialog.open(SubtaskDialogComponent, {
      data: { subtask: s, users: this.users() },
      width: '560px',
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.api.updateCapaSubtask(s.id, payload).subscribe({
        next: () => {
          this.snack.open('Subtask updated', 'OK', { duration: 2500 });
          this.loadAll(c.id);
        },
        error: (e) => this.showError(e),
      });
    });
  }

  changeSubtaskStatus(s: CapaSubtask, value: CapaSubtaskStatus) {
    if (value === s.status) return;
    const c = this.capa();
    if (!c) return;
    this.api.updateCapaSubtask(s.id, { status: value }).subscribe({
      next: () => this.loadAll(c.id),
      error: (e) => this.showError(e),
    });
  }

  deleteSubtask(s: CapaSubtask) {
    if (!confirm(`Delete subtask "${s.title}"?`)) return;
    const c = this.capa();
    if (!c) return;
    this.api.deleteCapaSubtask(s.id).subscribe({
      next: () => this.loadAll(c.id),
      error: (e) => this.showError(e),
    });
  }

  submitForValidation() {
    const c = this.capa();
    if (!c) return;
    this.api.submitCapaForValidation(c.id).subscribe({
      next: () => {
        this.snack.open('Submitted for validation', 'OK', { duration: 2500 });
        this.loadAll(c.id);
      },
      error: (e) => this.showError(e),
    });
  }

  validate() {
    const c = this.capa();
    if (!c) return;
    if (!confirm('Validate and close this CAPA?')) return;
    this.api.validateCapa(c.id).subscribe({
      next: () => {
        this.snack.open('CAPA validated & closed', 'OK', { duration: 2500 });
        this.loadAll(c.id);
      },
      error: (e) => this.showError(e),
    });
  }

  reject() {
    const reason = prompt(
      'Reason for sending back (optional)?',
    ) as string | null;
    if (reason === null) return;
    const c = this.capa();
    if (!c) return;
    this.api.rejectCapaValidation(c.id, reason || undefined).subscribe({
      next: () => {
        this.snack.open('Sent back to in-progress', 'OK', { duration: 2500 });
        this.loadAll(c.id);
      },
      error: (e) => this.showError(e),
    });
  }

  reopen() {
    const reason = prompt('Reason for reopening (optional)?') as string | null;
    if (reason === null) return;
    const c = this.capa();
    if (!c) return;
    this.api.reopenCapa(c.id, reason || undefined).subscribe({
      next: () => {
        this.snack.open('CAPA reopened', 'OK', { duration: 2500 });
        this.loadAll(c.id);
      },
      error: (e) => this.showError(e),
    });
  }

  private showError(e: { error?: { message?: string } }) {
    const msg = e?.error?.message || 'Something went wrong';
    this.snack.open(msg, 'Close', { duration: 4000 });
  }
}
