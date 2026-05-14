import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import {
  ActionPriority,
  ActionStatus,
  ActionType,
  CauseType,
  CorrectiveAction,
  Likelihood,
  NonConformity,
  Role,
  RootCause,
  VerificationStatus,
} from '../../core/models';

@Component({
  selector: 'app-nc-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatSnackBarModule,
  ],
  template: `
    <div *ngIf="nc() as n" class="page">
      <div class="page-header">
        <div>
          <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
          <h1 style="display:inline">{{ n.title }}</h1>
          <span class="chip sev-{{n.severity}}">{{ n.severity | titlecase }}</span>
          <span class="chip status-{{n.status}}">{{ n.status }}</span>
        </div>
      </div>

      <mat-card class="detail-card">
        <p><strong>Description:</strong> {{ n.description }}</p>
        <p *ngIf="n.area"><strong>Area:</strong> {{ n.area }}</p>
        <p *ngIf="n.department"><strong>Department:</strong> {{ n.department }}</p>
        <p *ngIf="n.detectionMethod"><strong>Detection:</strong> {{ n.detectionMethod }}</p>
        <p><strong>Submitted by:</strong> {{ n.submittedBy?.firstName }} {{ n.submittedBy?.lastName }}</p>
        <p><strong>Created:</strong> {{ n.createdAt | date:'medium' }}</p>
      </mat-card>

      <!-- Root Cause Analysis -->
      <mat-card class="section-card">
        <div class="section-header">
          <h3>Root Cause Analysis</h3>
          <button mat-raised-button color="primary" (click)="showAddCause = !showAddCause" *ngIf="canEdit">
            <mat-icon>add</mat-icon> Add Hypothesis
          </button>
        </div>

        <div *ngIf="showAddCause" class="add-form">
          <mat-form-field>
            <mat-label>Hypothesis</mat-label>
            <textarea matInput [(ngModel)]="newCause.hypothesis" rows="2"></textarea>
          </mat-form-field>
          <div class="form-row">
            <mat-form-field>
              <mat-label>Cause Type</mat-label>
              <mat-select [(ngModel)]="newCause.causeType">
                <mat-option *ngFor="let ct of causeTypes" [value]="ct">{{ ct | titlecase }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Likelihood</mat-label>
              <mat-select [(ngModel)]="newCause.likelihood">
                <mat-option *ngFor="let l of likelihoods" [value]="l">{{ l | titlecase }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-button (click)="showAddCause = false">Cancel</button>
            <button mat-raised-button color="primary" (click)="addCause()">Save</button>
          </div>
        </div>

        <div *ngFor="let c of n.rootCauses; let i = index" class="cause-item">
          <div class="cause-header">
            <span class="cause-num">#{{ i + 1 }}</span>
            <span class="chip type-chip">{{ c.causeType | titlecase }}</span>
            <span class="chip" [class]="'vstat-' + c.verificationStatus">{{ c.verificationStatus }}</span>
            <span class="chip" [class]="'likelihood-' + c.likelihood">{{ c.likelihood | titlecase }}</span>
            <span *ngIf="c.isPrimary" class="chip primary">Primary</span>
          </div>
          <p class="hypothesis">{{ c.hypothesis }}</p>
          <div class="cause-actions" *ngIf="canEdit">
            <button mat-button (click)="verifyCause(c, 'confirmed')" *ngIf="c.verificationStatus !== 'confirmed'">
              Confirm
            </button>
            <button mat-button (click)="verifyCause(c, 'unconfirmed')" *ngIf="c.verificationStatus !== 'unconfirmed'">
              Reject
            </button>
            <button mat-button (click)="togglePrimary(c)">
              {{ c.isPrimary ? 'Unmark Primary' : 'Mark Primary' }}
            </button>
            <button mat-icon-button color="warn" (click)="deleteCause(c.id)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
        <p class="empty" *ngIf="!n.rootCauses?.length">No root causes added yet.</p>
      </mat-card>

      <!-- Corrective Actions -->
      <mat-card class="section-card">
        <div class="section-header">
          <h3>Corrective / Preventive Actions</h3>
          <button mat-raised-button color="primary" (click)="showAddAction = !showAddAction" *ngIf="canEdit">
            <mat-icon>add</mat-icon> Add Action
          </button>
        </div>

        <div *ngIf="showAddAction" class="add-form">
          <mat-form-field>
            <mat-label>Description</mat-label>
            <textarea matInput [(ngModel)]="newAction.description" rows="2"></textarea>
          </mat-form-field>
          <div class="form-row">
            <mat-form-field>
              <mat-label>Type</mat-label>
              <mat-select [(ngModel)]="newAction.actionType">
                <mat-option *ngFor="let at of actionTypes" [value]="at">{{ at | titlecase }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Priority</mat-label>
              <mat-select [(ngModel)]="newAction.priority">
                <mat-option *ngFor="let p of priorities" [value]="p">{{ p | titlecase }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Due Date</mat-label>
              <input matInput type="date" [(ngModel)]="newAction.dueDate" />
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-button (click)="showAddAction = false">Cancel</button>
            <button mat-raised-button color="primary" (click)="addAction()">Save</button>
          </div>
        </div>

        <div *ngFor="let a of n.correctiveActions" class="action-item">
          <div class="action-header">
            <span class="chip" [class]="'atype-' + a.actionType">{{ a.actionType | titlecase }}</span>
            <span class="chip" [class]="'astatus-' + a.status">{{ a.status }}</span>
            <span class="chip" [class]="'apriority-' + a.priority">{{ a.priority | titlecase }}</span>
            <span *ngIf="a.dueDate" class="due-date">Due: {{ a.dueDate | date:'mediumDate' }}</span>
          </div>
          <p>{{ a.description }}</p>
          <div class="action-controls" *ngIf="canEdit">
            <mat-select [value]="a.status" (selectionChange)="updateActionStatus(a, $event.value)" style="width:150px">
              <mat-option *ngFor="let s of actionStatuses" [value]="s">{{ s }}</mat-option>
            </mat-select>
            <button mat-icon-button color="warn" (click)="deleteAction(a.id)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
        <p class="empty" *ngIf="!n.correctiveActions?.length">No actions added yet.</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 16px; }
    .page-header h1 { margin: 0 8px; }
    .detail-card, .section-card { padding: 16px; margin-bottom: 16px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .section-header h3 { margin: 0; }
    .add-form { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .form-row { display: flex; gap: 12px; }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .chip { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin: 0 4px; background: #e2e8f0; }
    .sev-critical, .sev-high { background: #fecaca; color: #991b1b; }
    .sev-medium { background: #fed7aa; color: #9a3412; }
    .sev-low { background: #bbf7d0; color: #166534; }
    .status-closed { background: #bbf7d0; }
    .status-submitted { background: #bfdbfe; }
    .vstat-confirmed { background: #bbf7d0; color: #166534; }
    .vstat-unconfirmed { background: #fecaca; color: #991b1b; }
    .vstat-to_verify { background: #fef9c3; color: #854d0e; }
    .likelihood-high { background: #fecaca; }
    .likelihood-medium { background: #fed7aa; }
    .likelihood-low { background: #e2e8f0; }
    .primary { background: #c7d2fe; color: #3730a3; }
    .type-chip { background: #e0e7ff; color: #3730a3; }
    .cause-item, .action-item { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
    .cause-header, .action-header { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    .cause-num { font-weight: 600; margin-right: 8px; }
    .hypothesis { margin: 8px 0 4px; }
    .cause-actions, .action-controls { display: flex; gap: 4px; align-items: center; }
    .atype-corrective { background: #bfdbfe; }
    .atype-preventive { background: #e0e7ff; }
    .astatus-pending { background: #fef9c3; }
    .astatus-in_progress { background: #bfdbfe; }
    .astatus-completed { background: #bbf7d0; }
    .astatus-overdue { background: #fecaca; }
    .astatus-verified { background: #a7f3d0; }
    .apriority-high { background: #fecaca; }
    .apriority-medium { background: #fed7aa; }
    .apriority-low { background: #e2e8f0; }
    .due-date { font-size: 12px; color: #64748b; }
    .empty { color: #94a3b8; text-align: center; }
  `],
})
export class NcDetailComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  nc = signal<NonConformity | null>(null);
  showAddCause = false;
  showAddAction = false;

  causeTypes = Object.values(CauseType);
  likelihoods = Object.values(Likelihood);
  actionTypes = Object.values(ActionType);
  priorities = Object.values(ActionPriority);
  actionStatuses = Object.values(ActionStatus);

  newCause = { hypothesis: '', causeType: CauseType.PROCESS, likelihood: Likelihood.MEDIUM };
  newAction = { description: '', actionType: ActionType.CORRECTIVE, priority: ActionPriority.MEDIUM, dueDate: '' };

  get canEdit() {
    return this.auth.hasRole(Role.ADMIN_OWNER, Role.QUALITY_MANAGER);
  }

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) this.load(id);
    });
  }

  load(id: string) {
    this.api.getNc(id).subscribe((n) => this.nc.set(n));
  }

  goBack() {
    this.router.navigate(['/non-conformities']);
  }

  addCause() {
    const n = this.nc();
    if (!n) return;
    this.api.addRootCause(n.id, this.newCause).subscribe({
      next: () => {
        this.showAddCause = false;
        this.load(n.id);
        this.snackBar.open('Root cause added', 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Failed', 'OK', { duration: 3000 }),
    });
  }

  verifyCause(c: RootCause, status: string) {
    const n = this.nc();
    if (!n) return;
    this.api.updateRootCause(n.id, c.id, { verificationStatus: status }).subscribe({
      next: () => this.load(n.id),
      error: () => this.snackBar.open('Failed', 'OK', { duration: 3000 }),
    });
  }

  togglePrimary(c: RootCause) {
    const n = this.nc();
    if (!n) return;
    this.api.updateRootCause(n.id, c.id, { isPrimary: !c.isPrimary }).subscribe({
      next: () => this.load(n.id),
    });
  }

  deleteCause(causeId: string) {
    const n = this.nc();
    if (!n) return;
    this.api.deleteRootCause(n.id, causeId).subscribe({
      next: () => this.load(n.id),
    });
  }

  addAction() {
    const n = this.nc();
    if (!n) return;
    this.api.addCorrectiveAction(n.id, this.newAction).subscribe({
      next: () => {
        this.showAddAction = false;
        this.load(n.id);
        this.snackBar.open('Action added', 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Failed', 'OK', { duration: 3000 }),
    });
  }

  updateActionStatus(a: CorrectiveAction, status: string) {
    const n = this.nc();
    if (!n) return;
    this.api.updateCorrectiveAction(n.id, a.id, { status }).subscribe({
      next: () => this.load(n.id),
    });
  }

  deleteAction(actionId: string) {
    const n = this.nc();
    if (!n) return;
    this.api.deleteCorrectiveAction(n.id, actionId).subscribe({
      next: () => this.load(n.id),
    });
  }
}
