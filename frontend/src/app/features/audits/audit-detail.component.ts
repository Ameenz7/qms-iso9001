import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuditsService } from '../../core/audits.service';
import {
  Audit,
  AuditChecklistItem,
  AuditStatus,
  NcSeverity,
  User,
} from '../../core/models';
import { UsersService } from '../../core/users.service';

@Component({
  selector: 'app-audit-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
  ],
  template: `
    <div class="page" *ngIf="audit() as a">
      <a routerLink="/audits" class="back"><mat-icon>arrow_back</mat-icon> All audits</a>

      <div class="page-header">
        <div>
          <h1>{{ a.title }}</h1>
          <div class="subtitle">
            <span>{{ a.type }}</span> ·
            <span>{{ a.scheduledDate | date: 'mediumDate' }}</span> ·
            <span>Auditor: {{ auditorName(a.auditorId) }}</span> ·
            <span class="chip-{{ a.status.toLowerCase() }}">{{ a.status }}</span>
          </div>
        </div>
        <div class="toolbar-actions">
          <button
            mat-stroked-button
            *ngIf="a.status === 'PLANNED'"
            (click)="setStatus(a, 'IN_PROGRESS')"
          >
            <mat-icon>play_arrow</mat-icon> Start
          </button>
          <button
            mat-raised-button
            color="primary"
            *ngIf="a.status === 'IN_PROGRESS'"
            (click)="setStatus(a, 'COMPLETED')"
          >
            <mat-icon>check_circle</mat-icon> Complete
          </button>
        </div>
      </div>

      <mat-card>
        <mat-card-header><mat-card-title>Scope</mat-card-title></mat-card-header>
        <mat-card-content><p>{{ a.scope }}</p></mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>Checklist</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="a.checklist" class="full-width">
            <ng-container matColumnDef="item">
              <th mat-header-cell *matHeaderCellDef>Item</th>
              <td mat-cell *matCellDef="let c">{{ c.item }}</td>
            </ng-container>
            <ng-container matColumnDef="finding">
              <th mat-header-cell *matHeaderCellDef>Finding</th>
              <td mat-cell *matCellDef="let c">
                <input
                  matInput
                  class="inline-input"
                  [ngModel]="c.finding"
                  (ngModelChange)="updateChecklist(a.id, c.id, { finding: $event })"
                />
              </td>
            </ng-container>
            <ng-container matColumnDef="evidence">
              <th mat-header-cell *matHeaderCellDef>Evidence</th>
              <td mat-cell *matCellDef="let c">
                <input
                  matInput
                  class="inline-input"
                  [ngModel]="c.evidence"
                  (ngModelChange)="updateChecklist(a.id, c.id, { evidence: $event })"
                />
              </td>
            </ng-container>
            <ng-container matColumnDef="conf">
              <th mat-header-cell *matHeaderCellDef>Result</th>
              <td mat-cell *matCellDef="let c">
                <mat-select
                  [ngModel]="c.conformity"
                  (ngModelChange)="updateChecklist(a.id, c.id, { conformity: $event })"
                  class="inline-select"
                >
                  <mat-option [value]="null">—</mat-option>
                  <mat-option value="CONFORM">Conform</mat-option>
                  <mat-option value="NON_CONFORM">Non-conform</mat-option>
                  <mat-option value="NA">N/A</mat-option>
                </mat-select>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['item','finding','evidence','conf']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['item','finding','evidence','conf']"></tr>
          </table>
          <div *ngIf="a.checklist.length === 0" class="dim small">
            No checklist items yet.
          </div>

          <mat-divider style="margin: 16px 0"></mat-divider>

          <div class="form-row">
            <mat-form-field appearance="outline" class="grow">
              <mat-label>New checklist item</mat-label>
              <input matInput [(ngModel)]="newChecklistItem" />
            </mat-form-field>
            <button
              mat-raised-button
              color="primary"
              [disabled]="!newChecklistItem"
              (click)="addChecklistItem(a)"
            >
              Add
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>Findings</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="a.findings" class="full-width">
            <ng-container matColumnDef="desc">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let f">{{ f.description }}</td>
            </ng-container>
            <ng-container matColumnDef="sev">
              <th mat-header-cell *matHeaderCellDef>Severity</th>
              <td mat-cell *matCellDef="let f">
                <span class="chip-{{ f.severity.toLowerCase() }}">{{ f.severity }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="nc">
              <th mat-header-cell *matHeaderCellDef>Linked NC</th>
              <td mat-cell *matCellDef="let f">
                <a *ngIf="f.ncId" [routerLink]="['/nc', f.ncId]">View NC</a>
                <span *ngIf="!f.ncId" class="dim">—</span>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['desc','sev','nc']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['desc','sev','nc']"></tr>
          </table>
          <div *ngIf="a.findings.length === 0" class="dim small">
            No findings recorded.
          </div>

          <mat-divider style="margin: 16px 0"></mat-divider>

          <div class="form-row">
            <mat-form-field appearance="outline" class="grow">
              <mat-label>Finding description</mat-label>
              <input matInput [(ngModel)]="newFinding.description" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Severity</mat-label>
              <mat-select [(ngModel)]="newFinding.severity">
                <mat-option value="CRITICAL">Critical</mat-option>
                <mat-option value="MAJOR">Major</mat-option>
                <mat-option value="MINOR">Minor</mat-option>
              </mat-select>
            </mat-form-field>
            <button
              mat-raised-button
              color="primary"
              [disabled]="!newFinding.description"
              (click)="addFinding(a)"
            >
              Add finding
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .back {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #6b7280;
        text-decoration: none;
        margin-bottom: 8px;
        font-size: 13px;
      }
      .form-row {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .form-row .grow { flex: 1; min-width: 240px; }
      mat-form-field { min-width: 180px; }
      .inline-input {
        width: 100%;
        border: none;
        background: transparent;
        outline: none;
        padding: 4px;
      }
      .inline-input:focus { background: #f9fafb; border-radius: 4px; }
      .inline-select { width: 100%; }
      .dim { color: #6b7280; }
      .small { font-size: 13px; }
    `,
  ],
})
export class AuditDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private auditsService = inject(AuditsService);
  private usersService = inject(UsersService);
  private snack = inject(MatSnackBar);

  audit = signal<Audit | null>(null);
  users = signal<User[]>([]);

  newChecklistItem = '';
  newFinding: { description: string; severity: NcSeverity } = {
    description: '',
    severity: 'MAJOR',
  };

  ngOnInit(): void {
    this.usersService.list().subscribe((u) => this.users.set(u));
    this.refresh();
  }

  refresh(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.auditsService.get(id).subscribe((a) => this.audit.set(a ?? null));
  }

  auditorName(id: string): string {
    const u = this.users().find((x) => x.id === id);
    return u ? `${u.firstName} ${u.lastName}` : '—';
  }

  setStatus(a: Audit, status: AuditStatus): void {
    this.auditsService.setStatus(a.id, status).subscribe(() => {
      this.snack.open(`Audit ${status}`, 'Dismiss', { duration: 2000 });
      this.refresh();
    });
  }

  addChecklistItem(a: Audit): void {
    this.auditsService
      .addChecklistItem(a.id, this.newChecklistItem)
      .subscribe(() => {
        this.newChecklistItem = '';
        this.refresh();
      });
  }

  updateChecklist(
    auditId: string,
    itemId: string,
    patch: Partial<AuditChecklistItem>,
  ): void {
    this.auditsService.updateChecklistItem(auditId, itemId, patch).subscribe();
  }

  addFinding(a: Audit): void {
    this.auditsService.addFinding(a.id, this.newFinding).subscribe(() => {
      this.newFinding = { description: '', severity: 'MAJOR' };
      this.refresh();
    });
  }
}
