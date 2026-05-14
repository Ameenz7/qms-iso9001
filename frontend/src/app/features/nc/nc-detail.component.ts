import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { NcService } from '../../core/nc.service';
import { UsersService } from '../../core/users.service';
import {
  NonConformity,
  RootCause,
  User,
} from '../../core/models';

@Component({
  selector: 'app-nc-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatDividerModule,
  ],
  template: `
    <div class="page" *ngIf="nc() as n">
      <a routerLink="/nc" class="back"><mat-icon>arrow_back</mat-icon> All NCs</a>

      <div class="page-header">
        <div>
          <h1>{{ n.reference }} — {{ n.title }}</h1>
          <div class="subtitle">
            <span class="chip-{{ n.severity.toLowerCase() }}">{{ n.severity }}</span>
            <span class="chip-{{ n.status.toLowerCase() }}" style="margin-left:8px">{{ n.status }}</span>
            <span class="dim" style="margin-left:8px">
              Reported {{ n.createdAt | date: 'mediumDate' }} by {{ reporterName(n) }}
            </span>
          </div>
        </div>
        <div class="toolbar-actions">
          <button
            mat-raised-button
            color="primary"
            *ngIf="n.status !== 'CLOSED' && canClose()"
            [disabled]="!canCloseNow(n)"
            (click)="closeNc(n)"
          >
            <mat-icon>check_circle</mat-icon> Close NC
          </button>
        </div>
      </div>

      <mat-card>
        <mat-card-header><mat-card-title>Description</mat-card-title></mat-card-header>
        <mat-card-content>
          <p>{{ n.description }}</p>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>Assignment</mat-card-title></mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline">
            <mat-label>Assigned to</mat-label>
            <mat-select [ngModel]="n.assignedTo" (ngModelChange)="assign(n.id, $event)">
              <mat-option [value]="null">Unassigned</mat-option>
              <mat-option *ngFor="let u of users()" [value]="u.id">
                {{ u.firstName }} {{ u.lastName }} ({{ u.role }})
              </mat-option>
            </mat-select>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>Root Cause Analysis</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="n.rootCauses" class="full-width">
            <ng-container matColumnDef="hyp">
              <th mat-header-cell *matHeaderCellDef>Hypothesis</th>
              <td mat-cell *matCellDef="let c">{{ c.hypothesis }}</td>
            </ng-container>
            <ng-container matColumnDef="cat">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let c">{{ c.causeType }}</td>
            </ng-container>
            <ng-container matColumnDef="conf">
              <th mat-header-cell *matHeaderCellDef>Confirmed</th>
              <td mat-cell *matCellDef="let c">
                <span *ngIf="c.isConfirmed" class="chip-closed">Confirmed</span>
                <span *ngIf="!c.isConfirmed" class="chip-pending">Hypothesis</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="act">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let c">
                <button
                  mat-button
                  *ngIf="!c.isConfirmed"
                  (click)="confirmCause(n, c)"
                >
                  <mat-icon>verified</mat-icon> Confirm
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['hyp','cat','conf','act']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['hyp','cat','conf','act']"></tr>
          </table>
          <div *ngIf="n.rootCauses.length === 0" class="dim small">
            No root causes recorded yet.
          </div>

          <mat-divider style="margin: 16px 0"></mat-divider>

          <div class="form-row">
            <mat-form-field appearance="outline" class="grow">
              <mat-label>New hypothesis</mat-label>
              <input matInput [(ngModel)]="newHypothesis" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select [(ngModel)]="newType">
                <mat-option value="PEOPLE">People</mat-option>
                <mat-option value="PROCESS">Process</mat-option>
                <mat-option value="EQUIPMENT">Equipment</mat-option>
                <mat-option value="MATERIAL">Material</mat-option>
                <mat-option value="ENVIRONMENT">Environment</mat-option>
                <mat-option value="METHOD">Method</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-raised-button color="primary" [disabled]="!newHypothesis" (click)="addCause(n)">
              Add cause
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>Corrective Actions</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="n.actions" class="full-width">
            <ng-container matColumnDef="desc">
              <th mat-header-cell *matHeaderCellDef>Action</th>
              <td mat-cell *matCellDef="let a">{{ a.description }}</td>
            </ng-container>
            <ng-container matColumnDef="assignee">
              <th mat-header-cell *matHeaderCellDef>Assigned</th>
              <td mat-cell *matCellDef="let a">{{ userName(a.assignedTo) }}</td>
            </ng-container>
            <ng-container matColumnDef="due">
              <th mat-header-cell *matHeaderCellDef>Due</th>
              <td mat-cell *matCellDef="let a">{{ a.dueDate | date: 'mediumDate' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let a">
                <span class="chip-{{ a.status.toLowerCase() }}">{{ a.status }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="act">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let a">
                <button
                  mat-button
                  *ngIf="a.status !== 'DONE'"
                  (click)="completeAction(n, a.id)"
                >
                  <mat-icon>check</mat-icon> Mark done
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['desc','assignee','due','status','act']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['desc','assignee','due','status','act']"></tr>
          </table>
          <div *ngIf="n.actions.length === 0" class="dim small">
            No corrective actions yet.
          </div>

          <mat-divider style="margin: 16px 0"></mat-divider>

          <div class="form-row">
            <mat-form-field appearance="outline" class="grow">
              <mat-label>Action description</mat-label>
              <input matInput [(ngModel)]="newAction.description" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Assign to</mat-label>
              <mat-select [(ngModel)]="newAction.assignedTo">
                <mat-option *ngFor="let u of users()" [value]="u.id">
                  {{ u.firstName }} {{ u.lastName }}
                </mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Due date</mat-label>
              <input matInput type="date" [(ngModel)]="newAction.dueDate" />
            </mat-form-field>
            <button
              mat-raised-button
              color="primary"
              [disabled]="!newAction.description || !newAction.assignedTo || !newAction.dueDate"
              (click)="addAction(n)"
            >
              Add action
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
      .dim { color: #6b7280; }
      .small { font-size: 13px; }
      mat-form-field { min-width: 200px; }
    `,
  ],
})
export class NcDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ncService = inject(NcService);
  private usersService = inject(UsersService);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);

  nc = signal<NonConformity | null>(null);
  users = signal<User[]>([]);

  newHypothesis = '';
  newType: RootCause['causeType'] = 'PROCESS';
  newAction = { description: '', assignedTo: '', dueDate: '' };

  ngOnInit(): void {
    this.usersService.list().subscribe((u) => this.users.set(u));
    this.refresh();
  }

  refresh(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.ncService.get(id).subscribe((n) => this.nc.set(n ?? null));
  }

  reporterName(n: NonConformity): string {
    return this.userName(n.reportedBy);
  }

  userName(id: string | null): string {
    if (!id) return '—';
    const u = this.users().find((x) => x.id === id);
    return u ? `${u.firstName} ${u.lastName}` : '—';
  }

  canClose(): boolean {
    return this.auth.hasRole('QUALITY_MANAGER', 'ORG_ADMIN', 'SUPER_ADMIN');
  }

  canCloseNow(n: NonConformity): boolean {
    return n.actions.length > 0 && n.actions.every((a) => a.status === 'DONE');
  }

  assign(ncId: string, userId: string | null): void {
    this.ncService.assign(ncId, userId ?? '').subscribe(() => this.refresh());
  }

  addCause(n: NonConformity): void {
    this.ncService
      .addCause(n.id, { hypothesis: this.newHypothesis, causeType: this.newType })
      .subscribe(() => {
        this.newHypothesis = '';
        this.refresh();
      });
  }

  confirmCause(n: NonConformity, c: RootCause): void {
    this.ncService.confirmCause(n.id, c.id).subscribe(() => this.refresh());
  }

  addAction(n: NonConformity): void {
    this.ncService
      .addAction(n.id, {
        description: this.newAction.description,
        assignedTo: this.newAction.assignedTo,
        dueDate: new Date(this.newAction.dueDate).toISOString(),
      })
      .subscribe(() => {
        this.newAction = { description: '', assignedTo: '', dueDate: '' };
        this.refresh();
      });
  }

  completeAction(n: NonConformity, actionId: string): void {
    this.ncService.completeAction(n.id, actionId).subscribe(() => this.refresh());
  }

  closeNc(n: NonConformity): void {
    this.ncService.close(n.id).subscribe({
      next: () => {
        this.snack.open(`${n.reference} closed`, 'Dismiss', { duration: 2500 });
        this.refresh();
      },
      error: (err: Error) => {
        this.snack.open(err.message, 'Dismiss', { duration: 4000 });
      },
    });
  }
}
