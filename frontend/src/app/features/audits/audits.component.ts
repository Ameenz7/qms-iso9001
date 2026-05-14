import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import {
  AuditSchedule,
  AuditStatus,
  AuditType,
  AuditFrequency,
  FindingSeverity,
  FindingStatus,
  FindingType,
  Role,
} from '../../core/models';

@Component({
  selector: 'app-audits',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>Audit Management</h1>
      <button mat-raised-button color="primary" (click)="showCreateForm = !showCreateForm"
        *ngIf="canManage">
        <mat-icon>add</mat-icon> Schedule Audit
      </button>
    </div>

    <mat-card *ngIf="showCreateForm" class="form-card">
      <h3>Schedule New Audit</h3>
      <div class="form-grid">
        <mat-form-field>
          <mat-label>Title</mat-label>
          <input matInput [(ngModel)]="newAudit.title" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Type</mat-label>
          <mat-select [(ngModel)]="newAudit.type">
            <mat-option *ngFor="let t of auditTypes" [value]="t">{{ t | titlecase }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Frequency</mat-label>
          <mat-select [(ngModel)]="newAudit.frequency">
            <mat-option *ngFor="let f of frequencies" [value]="f">{{ f | titlecase }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Planned Date</mat-label>
          <input matInput type="date" [(ngModel)]="newAudit.plannedDate" />
        </mat-form-field>
        <mat-form-field class="full-width">
          <mat-label>Scope</mat-label>
          <textarea matInput [(ngModel)]="newAudit.scope" rows="2"></textarea>
        </mat-form-field>
      </div>
      <div class="actions">
        <button mat-button (click)="showCreateForm = false">Cancel</button>
        <button mat-raised-button color="primary" (click)="createAudit()">Create</button>
      </div>
    </mat-card>

    <mat-tab-group>
      <mat-tab label="All Audits">
        <div class="tab-content">
          <mat-card *ngFor="let audit of audits()" class="audit-card">
            <div class="audit-header">
              <div>
                <h3>{{ audit.title }}</h3>
                <span class="chip" [class]="'status-' + audit.status">{{ audit.status | titlecase }}</span>
                <span class="chip type">{{ audit.type | titlecase }}</span>
              </div>
              <div class="audit-meta">
                <span>📅 {{ audit.plannedDate | date:'mediumDate' }}</span>
                <span *ngIf="audit.auditor">👤 {{ audit.auditor!.firstName }} {{ audit.auditor!.lastName }}</span>
              </div>
            </div>
            <p *ngIf="audit.scope" class="scope">{{ audit.scope }}</p>

            <div *ngIf="audit.checklistItems?.length" class="checklist-section">
              <h4>Checklist Items ({{ audit.checklistItems!.length }})</h4>
              <table mat-table [dataSource]="audit.checklistItems!" class="full-width">
                <ng-container matColumnDef="itemNumber">
                  <th mat-header-cell *matHeaderCellDef>#</th>
                  <td mat-cell *matCellDef="let item">{{ item.itemNumber }}</td>
                </ng-container>
                <ng-container matColumnDef="requirement">
                  <th mat-header-cell *matHeaderCellDef>Requirement</th>
                  <td mat-cell *matCellDef="let item">{{ item.requirement }}</td>
                </ng-container>
                <ng-container matColumnDef="findingType">
                  <th mat-header-cell *matHeaderCellDef>Finding</th>
                  <td mat-cell *matCellDef="let item">
                    <mat-select [value]="item.findingType" (selectionChange)="updateChecklist(item.id, $event.value)"
                      *ngIf="canManage; else readOnly" placeholder="Select">
                      <mat-option *ngFor="let ft of findingTypes" [value]="ft">{{ ft.replace('_', ' ') | titlecase }}</mat-option>
                    </mat-select>
                    <ng-template #readOnly>{{ item.findingType || '-' }}</ng-template>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="checklistCols"></tr>
                <tr mat-row *matRowDef="let row; columns: checklistCols"></tr>
              </table>
            </div>

            <div *ngIf="audit.findings?.length" class="findings-section">
              <h4>Findings ({{ audit.findings!.length }})</h4>
              <div *ngFor="let f of audit.findings" class="finding-item">
                <span class="chip" [class]="'sev-' + f.severity">{{ f.severity | titlecase }}</span>
                <span>{{ f.description }}</span>
                <span class="chip" [class]="'fstatus-' + f.status">{{ f.status | titlecase }}</span>
                <button mat-icon-button *ngIf="f.status === 'open' && canManage"
                  (click)="closeFinding(f.id)" title="Close">
                  <mat-icon>check_circle</mat-icon>
                </button>
              </div>
            </div>

            <div class="audit-actions" *ngIf="canManage">
              <button mat-button *ngIf="audit.status === 'scheduled'"
                (click)="updateStatus(audit.id, 'in_progress')">Start</button>
              <button mat-button *ngIf="audit.status === 'in_progress'"
                (click)="updateStatus(audit.id, 'completed')">Complete</button>
              <button mat-button color="warn" (click)="deleteAudit(audit.id)">Delete</button>
              <button mat-button (click)="addFindingFor = audit.id">Add Finding</button>
            </div>

            <div *ngIf="addFindingFor === audit.id" class="add-finding">
              <mat-form-field>
                <mat-label>Description</mat-label>
                <input matInput [(ngModel)]="newFinding.description" />
              </mat-form-field>
              <mat-form-field>
                <mat-label>Severity</mat-label>
                <mat-select [(ngModel)]="newFinding.severity">
                  <mat-option *ngFor="let s of findingSeverities" [value]="s">{{ s | titlecase }}</mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-raised-button color="primary"
                (click)="addFinding(audit.id)">Save</button>
              <button mat-button (click)="addFindingFor = null">Cancel</button>
            </div>
          </mat-card>
          <p *ngIf="!audits().length" class="empty">No audits scheduled yet.</p>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .form-card { padding: 16px; margin-bottom: 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .full-width { grid-column: 1 / -1; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; }
    .tab-content { padding: 16px 0; }
    .audit-card { margin-bottom: 16px; padding: 16px; }
    .audit-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .audit-header h3 { margin: 0 8px 0 0; display: inline; }
    .audit-meta { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #64748b; text-align: right; }
    .scope { color: #64748b; margin: 8px 0; }
    .chip { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin: 0 4px; background: #e2e8f0; }
    .status-scheduled { background: #bfdbfe; color: #1e40af; }
    .status-in_progress { background: #fef08a; color: #854d0e; }
    .status-completed { background: #bbf7d0; color: #166534; }
    .status-cancelled { background: #fecaca; color: #991b1b; }
    .type { background: #e0e7ff; color: #3730a3; }
    .sev-minor { background: #fef9c3; }
    .sev-major { background: #fed7aa; }
    .sev-critical { background: #fecaca; }
    .fstatus-open { background: #fecaca; }
    .fstatus-closed { background: #bbf7d0; }
    .checklist-section, .findings-section { margin-top: 12px; }
    .findings-section h4, .checklist-section h4 { margin: 0 0 8px; }
    .finding-item { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
    .audit-actions { display: flex; gap: 8px; margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    .add-finding { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
    .empty { color: #94a3b8; text-align: center; padding: 32px; }
  `],
})
export class AuditsComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  audits = signal<AuditSchedule[]>([]);
  showCreateForm = false;
  addFindingFor: string | null = null;

  auditTypes = Object.values(AuditType);
  frequencies = Object.values(AuditFrequency);
  findingTypes = Object.values(FindingType);
  findingSeverities = Object.values(FindingSeverity);
  checklistCols = ['itemNumber', 'requirement', 'findingType'];

  newAudit = { title: '', type: AuditType.INTERNAL, frequency: AuditFrequency.ONCE, plannedDate: '', scope: '' };
  newFinding = { description: '', severity: FindingSeverity.MINOR };

  get canManage() {
    const r = this.auth.user()?.role;
    return r === Role.ADMIN_OWNER || r === Role.QUALITY_MANAGER || r === Role.AUDITOR;
  }

  constructor() { this.load(); }

  load() {
    this.api.listAuditSchedules().subscribe({
      next: (data) => this.audits.set(data),
      error: () => this.snackBar.open('Failed to load audits', 'OK', { duration: 3000 }),
    });
  }

  createAudit() {
    this.api.createAuditSchedule(this.newAudit).subscribe({
      next: () => { this.showCreateForm = false; this.load(); this.snackBar.open('Audit scheduled', 'OK', { duration: 2000 }); },
      error: () => this.snackBar.open('Failed to create', 'OK', { duration: 3000 }),
    });
  }

  updateStatus(id: string, status: string) {
    this.api.updateAuditSchedule(id, { status }).subscribe({
      next: () => this.load(),
      error: () => this.snackBar.open('Update failed', 'OK', { duration: 3000 }),
    });
  }

  deleteAudit(id: string) {
    this.api.deleteAuditSchedule(id).subscribe({
      next: () => this.load(),
      error: () => this.snackBar.open('Delete failed', 'OK', { duration: 3000 }),
    });
  }

  updateChecklist(itemId: string, findingType: string) {
    this.api.updateChecklistItem(itemId, { findingType }).subscribe({
      next: () => this.load(),
      error: () => this.snackBar.open('Update failed', 'OK', { duration: 3000 }),
    });
  }

  addFinding(auditId: string) {
    this.api.addAuditFinding(auditId, this.newFinding).subscribe({
      next: () => { this.addFindingFor = null; this.load(); },
      error: () => this.snackBar.open('Failed to add finding', 'OK', { duration: 3000 }),
    });
  }

  closeFinding(id: string) {
    this.api.closeAuditFinding(id).subscribe({
      next: () => this.load(),
      error: () => this.snackBar.open('Failed to close', 'OK', { duration: 3000 }),
    });
  }
}
