import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
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
import { NcService } from '../../core/nc.service';
import { NcSeverity, NonConformity } from '../../core/models';

@Component({
  selector: 'app-nc-create',
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
    <h2 mat-dialog-title>Report a non-conformity</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Title</mat-label>
        <input matInput [(ngModel)]="title" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description</mat-label>
        <textarea matInput rows="4" [(ngModel)]="description"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Severity</mat-label>
        <mat-select [(ngModel)]="severity">
          <mat-option value="CRITICAL">Critical</mat-option>
          <mat-option value="MAJOR">Major</mat-option>
          <mat-option value="MINOR">Minor</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!title || !description"
        (click)="ref.close({ title, description, severity })"
      >
        Report
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class NcCreateDialogComponent {
  ref = inject(MatDialogRef<NcCreateDialogComponent>);
  title = '';
  description = '';
  severity: NcSeverity = 'MAJOR';
}

@Component({
  selector: 'app-nc-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Non-Conformities</h1>
          <div class="subtitle">Quality issues and their corrective workflow</div>
        </div>
        <button mat-raised-button color="primary" (click)="openCreate()">
          <mat-icon>add</mat-icon> Report NC
        </button>
      </div>

      <mat-card>
        <table mat-table [dataSource]="items()" class="full-width">
          <ng-container matColumnDef="ref">
            <th mat-header-cell *matHeaderCellDef>Reference</th>
            <td mat-cell *matCellDef="let n">
              <a [routerLink]="['/nc', n.id]"><strong>{{ n.reference }}</strong></a>
            </td>
          </ng-container>
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Title</th>
            <td mat-cell *matCellDef="let n">{{ n.title }}</td>
          </ng-container>
          <ng-container matColumnDef="severity">
            <th mat-header-cell *matHeaderCellDef>Severity</th>
            <td mat-cell *matCellDef="let n">
              <span class="chip-{{ n.severity.toLowerCase() }}">{{ n.severity }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let n">
              <span class="chip-{{ n.status.toLowerCase() }}">{{ n.status }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="created">
            <th mat-header-cell *matHeaderCellDef>Reported</th>
            <td mat-cell *matCellDef="let n">{{ n.createdAt | date: 'mediumDate' }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: cols"
            [routerLink]="['/nc', row.id]"
            style="cursor: pointer"
          ></tr>
        </table>
        <div *ngIf="items().length === 0" class="empty-state">
          <mat-icon>report_problem</mat-icon>
          <div>No non-conformities reported yet.</div>
        </div>
      </mat-card>
    </div>
  `,
})
export class NcListComponent implements OnInit {
  private nc = inject(NcService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private router = inject(Router);

  items = signal<NonConformity[]>([]);
  cols = ['ref', 'title', 'severity', 'status', 'created'];

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.nc.list().subscribe((items) => this.items.set(items));
  }

  openCreate(): void {
    const ref = this.dialog.open(NcCreateDialogComponent, { width: '520px' });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.nc.create(payload).subscribe((created) => {
        this.snack.open(`Reported ${created.reference}`, 'Dismiss', {
          duration: 2500,
        });
        void this.router.navigate(['/nc', created.id]);
      });
    });
  }
}
