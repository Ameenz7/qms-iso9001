import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import {
  ActionPriority,
  ActionStatus,
  ActionType,
  CauseType,
  CorrectiveAction,
  EvidenceEntityType,
  Likelihood,
  NonConformity,
  Role,
  RootCause,
} from '../../../core/models';

import { environment } from '../../../../environments/environment';
import { ActionCompleteModalComponent } from '../components/action-complete-modal.component';

@Component({
  selector: 'app-nc-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  template: `
    <div *ngIf="nc() as n" class="page">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button routerLink="/non-conformities">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>{{ n.title }}</h1>
          <span class="chip sev-{{ n.severity }}">{{
            n.severity | titlecase
          }}</span>
          <span class="chip status-{{ n.status }}">{{ n.status }}</span>
        </div>
      </div>

      <mat-card class="detail-card">
        <div class="grid">
          <div class="info-block full-width">
            <label>Description</label>
            <p>{{ n.description }}</p>
          </div>
          <div class="info-block" *ngIf="n.area">
            <label>Area</label>
            <p>{{ n.area }}</p>
          </div>
          <div class="info-block" *ngIf="n.department">
            <label>Department</label>
            <p>{{ n.department }}</p>
          </div>
          <div class="info-block" *ngIf="n.detectionMethod">
            <label>Detection Method</label>
            <p>{{ n.detectionMethod }}</p>
          </div>
          <div class="info-block">
            <label>Submitted By</label>
            <p>{{ n.submittedBy?.firstName }} {{ n.submittedBy?.lastName }}</p>
          </div>
          <div class="info-block">
            <label>Created At</label>
            <p>{{ n.createdAt | date: 'medium' }}</p>
          </div>
          <div class="info-block">
            <label>Initial Evidence</label>
            <button mat-stroked-button (click)="downloadEvidence(n.id, 'nc')">
              <mat-icon>download</mat-icon> Download
            </button>
          </div>
        </div>
      </mat-card>

      <!-- Root Cause Analysis -->
      <div class="section-header-row">
        <h2>Root Cause Analysis</h2>
        <button
          mat-flat-button
          color="primary"
          (click)="showAddCause = !showAddCause"
          *ngIf="canEdit()">
          <mat-icon>add</mat-icon> Add Hypothesis
        </button>
      </div>

      <div *ngIf="showAddCause" class="add-form-card">
        <mat-card>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Hypothesis</mat-label>
            <textarea
              matInput
              [(ngModel)]="newCause.hypothesis"
              rows="2"></textarea>
          </mat-form-field>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Cause Type</mat-label>
              <mat-select [(ngModel)]="newCause.causeType">
                <mat-option *ngFor="let ct of causeTypes" [value]="ct">{{
                  ct | titlecase
                }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Likelihood</mat-label>
              <mat-select [(ngModel)]="newCause.likelihood">
                <mat-option *ngFor="let l of likelihoods" [value]="l">{{
                  l | titlecase
                }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-button (click)="showAddCause = false">Cancel</button>
            <button mat-flat-button color="primary" (click)="addCause()">
              Save Hypothesis
            </button>
          </div>
        </mat-card>
      </div>

      <div *ngFor="let c of n.rootCauses; let i = index" class="hypothesis-section">
        <mat-card class="hypothesis-card">
          <div class="hypothesis-header">
            <div class="hyp-title">
              <span class="hyp-num">#{{ i + 1 }}</span>
              <h3>{{ c.hypothesis }}</h3>
            </div>
            <div class="hyp-meta">
              <span class="chip type-chip">{{ c.causeType | titlecase }}</span>
              <span class="chip" [class]="'vstat-' + c.verificationStatus">{{
                c.verificationStatus
              }}</span>
              <span class="chip" [class]="'likelihood-' + c.likelihood">{{
                c.likelihood | titlecase
              }}</span>
              <button mat-icon-button color="warn" *ngIf="canEdit()" (click)="deleteCause(c.id)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>

          <div class="hypothesis-actions" *ngIf="canEdit()">
            <button mat-stroked-button (click)="verifyCause(c, 'confirmed')" *ngIf="c.verificationStatus !== 'confirmed'">Confirm</button>
            <button mat-stroked-button (click)="verifyCause(c, 'unconfirmed')" *ngIf="c.verificationStatus !== 'unconfirmed'">Reject</button>
            <button mat-flat-button color="primary" (click)="openAddAction(c)" *ngIf="c.verificationStatus === 'confirmed'">
              <mat-icon>add</mat-icon> Add Action
            </button>
          </div>

          <div class="actions-list" *ngIf="getActionsForHypothesis(c.id).length">
            <h4>Corrective Actions for this Hypothesis</h4>
            <div *ngFor="let a of getActionsForHypothesis(c.id)" class="action-item-box">
              <div class="action-main">
                <div class="action-desc">
                  <strong>{{ a.description }}</strong>
                  <div class="small-muted">
                    Assigned to: {{ a.assignedTo?.firstName }} {{ a.assignedTo?.lastName }} | 
                    Priority: {{ a.priority }} | 
                    Due: {{ a.dueDate | date:'shortDate' }}
                  </div>
                </div>
                <div class="action-status-chip">
                  <span class="chip" [class]="'astatus-' + a.status">{{ a.status }}</span>
                </div>
              </div>

              <div class="action-execution" *ngIf="a.status === 'completed' || a.status === 'verified'">
                <div class="exec-info">
                  <div class="exec-label">Completion Notes:</div>
                  <p>{{ a.completionNotes }}</p>
                </div>
                <button mat-stroked-button size="small" (click)="downloadEvidence(a.id)">
                  <mat-icon>download</mat-icon> View Proof
                </button>
              </div>

              <div class="action-footer">
                <!-- Employee Actions -->
                <button mat-flat-button color="primary" 
                        *ngIf="canComplete(a)"
                        (click)="openCompleteAction(a)">
                  Mark as Done
                </button>

                <!-- QM Actions -->
                <div class="qm-verify-actions" *ngIf="canVerify(a)">
                  <button mat-flat-button color="primary" (click)="verifyAction(a, true)">
                    <mat-icon>check</mat-icon> Approve Action
                  </button>
                  <button mat-stroked-button color="warn" (click)="verifyAction(a, false)">
                    <mat-icon>close</mat-icon> Reject
                  </button>
                </div>

                <button mat-icon-button color="warn" *ngIf="canEdit()" (click)="deleteAction(a.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .page { padding: 24px; max-width: 1200px; margin: 0 auto; }
      .page-header { margin-bottom: 24px; }
      .header-left { display: flex; align-items: center; gap: 12px; }
      .header-left h1 { margin: 0; font-size: 24px; }
      
      .detail-card { padding: 24px; margin-bottom: 32px; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
      .info-block label { display: block; font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
      .info-block p { margin: 0; font-size: 15px; }
      .full-width { grid-column: 1 / -1; }

      .section-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; }
      .section-header-row h2 { margin: 0; font-size: 20px; }

      .hypothesis-section { margin-bottom: 24px; }
      .hypothesis-card { padding: 24px !important; }
      .hypothesis-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
      .hyp-title { display: flex; gap: 12px; align-items: flex-start; }
      .hyp-num { background: #1e293b; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-top: 4px; }
      .hyp-title h3 { margin: 0; font-size: 18px; line-height: 1.4; }
      .hyp-meta { display: flex; gap: 8px; align-items: center; }

      .hypothesis-actions { display: flex; gap: 12px; margin-bottom: 24px; padding: 12px; background: #f8fafc; border-radius: 8px; }

      .actions-list { border-top: 1px solid #f1f5f9; padding-top: 16px; }
      .actions-list h4 { margin: 0 0 16px; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; }

      .action-item-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: #fff; }
      .action-main { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
      .action-desc strong { display: block; font-size: 15px; margin-bottom: 4px; }
      .small-muted { font-size: 12px; color: #64748b; }

      .action-execution { background: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
      .exec-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
      .exec-info p { margin: 0; font-size: 14px; }

      .action-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 12px; }
      .qm-verify-actions { display: flex; gap: 8px; }

      .chip { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
      .sev-critical, .sev-high { background: #fee2e2; color: #b91c1c; }
      .sev-medium { background: #ffedd5; color: #c2410c; }
      .sev-low { background: #dcfce7; color: #15803d; }
      .status-closed { background: #dcfce7; }
      .status-submitted { background: #e0f2fe; }
      .vstat-confirmed { background: #dcfce7; color: #15803d; }
      .vstat-unconfirmed { background: #fee2e2; color: #b91c1c; }
      .vstat-to_verify { background: #fef9c3; color: #854d0e; }
      .likelihood-high { background: #fee2e2; }
      .likelihood-medium { background: #ffedd5; }
      .likelihood-low { background: #f1f5f9; }
      .type-chip { background: #f1f5f9; color: #475569; }
      .astatus-pending { background: #fef3c7; color: #92400e; }
      .astatus-completed { background: #e0f2fe; color: #0369a1; }
      .astatus-verified { background: #dcfce7; color: #15803d; }
    `,
  ],
})
export class NcDetailComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  nc = signal<NonConformity | null>(null);
  showAddCause = false;
  causeTypes = Object.values(CauseType);
  likelihoods = Object.values(Likelihood);
  actionTypes = Object.values(ActionType);
  priorities = Object.values(ActionPriority);
  actionStatuses = Object.values(ActionStatus);

  newCause = {
    hypothesis: '',
    causeType: CauseType.PROCESS,
    likelihood: Likelihood.MEDIUM,
  };

  rootCauseDirty = signal(false);
  whysForm = this.fb.group({
    w0: [''], w1: [''], w2: [''], w3: [''], w4: [''],
    rootCause: [''],
  });

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) this.load(id);
    });
  }

  load(id: string) {
    this.api.getNc(id).subscribe((n) => this.nc.set(n));
  }

  canEdit() {
    return this.auth.hasRole(Role.ADMIN_OWNER, Role.QUALITY_MANAGER);
  }

  canComplete(a: CorrectiveAction) {
    if (a.status !== ActionStatus.PENDING) return false;
    if (this.auth.hasRole(Role.ADMIN_OWNER, Role.QUALITY_MANAGER)) return true;
    return a.assignedToId === this.auth.user()?.id;
  }

  canVerify(a: CorrectiveAction) {
    return a.status === ActionStatus.COMPLETED && this.auth.hasRole(Role.ADMIN_OWNER, Role.QUALITY_MANAGER);
  }

  getActionsForHypothesis(causeId: string) {
    return (this.nc()?.correctiveActions || []).filter(a => a.rootCauseId === causeId);
  }

  addCause() {
    const n = this.nc();
    if (!n) return;
    this.api.addRootCause(n.id, this.newCause).subscribe({
      next: () => {
        this.showAddCause = false;
        this.load(n.id);
        this.snackBar.open('Hypothesis added', 'OK', { duration: 2000 });
      },
    });
  }

  verifyCause(c: RootCause, status: string) {
    this.api.updateRootCause(this.nc()!.id, c.id, { verificationStatus: status as any }).subscribe(() => this.load(this.nc()!.id));
  }

  deleteCause(id: string) {
    if (confirm('Delete this hypothesis?')) {
      this.api.deleteRootCause(this.nc()!.id, id).subscribe(() => this.load(this.nc()!.id));
    }
  }

  openAddAction(c: RootCause) {
    // We reuse the existing ActionModal logic but pass the rootCauseId
    // For simplicity here, I'll prompt, but ideally use a modal
    const desc = prompt('Action description:');
    if (!desc) return;
    this.api.addCorrectiveAction(this.nc()!.id, {
      description: desc,
      actionType: ActionType.CORRECTIVE,
      priority: ActionPriority.MEDIUM,
      rootCauseId: c.id
    } as any).subscribe(() => this.load(this.nc()!.id));
  }

  openCompleteAction(a: CorrectiveAction) {
    this.dialog.open(ActionCompleteModalComponent, { data: { action: a } })
      .afterClosed().subscribe(res => {
        if (res) {
          const { evidence, notes } = res;
          this.api.uploadEvidence(a.id, EvidenceEntityType.ACTION, evidence).subscribe(() => {
            this.api.completeAction(this.nc()!.id, a.id, { notes }).subscribe(() => {
              this.load(this.nc()!.id);
              this.snackBar.open('Action completed and sent for approval', 'OK', { duration: 3000 });
            });
          });
        }
      });
  }

  verifyAction(a: CorrectiveAction, approved: boolean) {
    let reason = '';
    if (!approved) {
      reason = prompt('Reason for rejection:') || '';
      if (!reason) return;
    }
    this.api.verifyAction(this.nc()!.id, a.id, { approved, rejectionReason: reason }).subscribe(() => this.load(this.nc()!.id));
  }

  deleteAction(id: string) {
    if (confirm('Delete action?')) {
      this.api.deleteCorrectiveAction(this.nc()!.id, id).subscribe(() => this.load(this.nc()!.id));
    }
  }

  downloadEvidence(entityId: string, entityType: string = 'action') {
    this.api.listEvidences(entityId, entityType as any).subscribe((list) => {
      if (list.length) {
        const evidence = list[0];
        this.api.downloadEvidence(evidence.id).subscribe((blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = evidence.fileName;
          link.click();
        });
      } else {
        this.snackBar.open('No evidence found', 'OK', { duration: 2000 });
      }
    });
  }

  saveWhys() {}
  resetRootCauseToLastWhy() {}
}
