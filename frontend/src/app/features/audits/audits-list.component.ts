import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { AuditsService } from '../../core/audits.service';
import { Audit, AuditType, User } from '../../core/models';
import { UsersService } from '../../core/users.service';

@Component({
  selector: 'app-audit-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Plan audit</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Title</mat-label>
        <input matInput [(ngModel)]="title" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Type</mat-label>
        <mat-select [(ngModel)]="type">
          <mat-option value="INTERNAL">Internal</mat-option>
          <mat-option value="EXTERNAL">External</mat-option>
          <mat-option value="SUPPLIER">Supplier</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Scheduled date</mat-label>
        <input matInput type="date" [(ngModel)]="scheduledDate" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Auditor</mat-label>
        <mat-select [(ngModel)]="auditorId">
          <mat-option *ngFor="let u of data.auditors" [value]="u.id">
            {{ u.firstName }} {{ u.lastName }}
          </mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Scope</mat-label>
        <textarea matInput rows="3" [(ngModel)]="scope"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!title || !scheduledDate || !auditorId"
        (click)="submit()"
      >
        Plan
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class AuditCreateDialogComponent {
  ref = inject(MatDialogRef<AuditCreateDialogComponent>);
  data = inject<{ auditors: User[] }>(MAT_DIALOG_DATA);

  title = '';
  type: AuditType = 'INTERNAL';
  scheduledDate = '';
  auditorId = '';
  scope = '';

  submit(): void {
    this.ref.close({
      title: this.title,
      type: this.type,
      scheduledDate: new Date(this.scheduledDate).toISOString(),
      auditorId: this.auditorId,
      scope: this.scope,
    });
  }
}

@Component({
  selector: 'app-audits-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Audits</h1>
          <div class="subtitle">Internal, external and supplier audits</div>
        </div>
        <button mat-raised-button color="primary" (click)="openCreate()">
          <mat-icon>event</mat-icon> Plan audit
        </button>
      </div>

      <mat-card>
        <table mat-table [dataSource]="items()" class="full-width">
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Title</th>
            <td mat-cell *matCellDef="let a">
              <a [routerLink]="['/audits', a.id]"><strong>{{ a.title }}</strong></a>
            </td>
          </ng-container>
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let a">{{ a.type }}</td>
          </ng-container>
          <ng-container matColumnDef="auditor">
            <th mat-header-cell *matHeaderCellDef>Auditor</th>
            <td mat-cell *matCellDef="let a">{{ auditorName(a.auditorId) }}</td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let a">{{ a.scheduledDate | date: 'mediumDate' }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let a">
              <span class="chip-{{ a.status.toLowerCase() }}">{{ a.status }}</span>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: cols"
            [routerLink]="['/audits', row.id]"
            style="cursor: pointer"
          ></tr>
        </table>
        <div *ngIf="items().length === 0" class="empty-state">
          <mat-icon>fact_check</mat-icon>
          <div>No audits scheduled.</div>
        </div>
      </mat-card>
    </div>
  `,
})
export class AuditsListComponent implements OnInit {
  private audits = inject(AuditsService);
  private usersService = inject(UsersService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private router = inject(Router);

  items = signal<Audit[]>([]);
  users = signal<User[]>([]);
  cols = ['title', 'type', 'auditor', 'date', 'status'];

  ngOnInit(): void {
    this.usersService.list().subscribe((u) => this.users.set(u));
    this.refresh();
  }

  refresh(): void {
    this.audits.list().subscribe((a) => this.items.set(a));
  }

  auditorName(id: string): string {
    const u = this.users().find((x) => x.id === id);
    return u ? `${u.firstName} ${u.lastName}` : '—';
  }

  openCreate(): void {
    const auditors = this.users().filter(
      (u) => u.role === 'AUDITOR' || u.role === 'QUALITY_MANAGER',
    );
    const ref = this.dialog.open(AuditCreateDialogComponent, {
      width: '520px',
      data: { auditors },
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.audits.create(payload).subscribe((created) => {
        this.snack.open('Audit planned', 'Dismiss', { duration: 2000 });
        void this.router.navigate(['/audits', created.id]);
      });
    });
  }
}
