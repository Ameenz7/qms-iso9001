import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Component as NgComponent, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { ApiService } from '../../core/api.service';
import { Organization } from '../../core/models';

@NgComponent({
  selector: 'app-org-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.org ? 'Edit Organization' : 'New Organization' }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>
        <ng-container *ngIf="!data.org">
          <h4>Admin Owner</h4>
          <mat-form-field appearance="outline">
            <mat-label>Owner Email</mat-label>
            <input matInput formControlName="ownerEmail" type="email" required />
          </mat-form-field>
          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="ownerFirstName" required />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="ownerLastName" required />
            </mat-form-field>
          </div>
          <mat-form-field appearance="outline">
            <mat-label>Owner Password</mat-label>
            <input
              matInput
              formControlName="ownerPassword"
              type="password"
              required />
          </mat-form-field>
        </ng-container>
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
        min-width: 440px;
      }
      .row {
        display: flex;
        gap: 12px;
      }
      .row mat-form-field {
        flex: 1;
      }
      h4 {
        margin: 8px 0;
      }
    `,
  ],
})
export class OrgDialogComponent {
  private fb = inject(FormBuilder);
  form;

  constructor(
    public dialogRef: MatDialogRef<OrgDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { org?: Organization },
  ) {
    const editing = !!data.org;
    this.form = this.fb.nonNullable.group({
      name: [data.org?.name ?? '', [Validators.required]],
      description: [data.org?.description ?? ''],
      ownerEmail: [
        '',
        editing ? [] : [Validators.required, Validators.email],
      ],
      ownerFirstName: ['', editing ? [] : [Validators.required]],
      ownerLastName: ['', editing ? [] : [Validators.required]],
      ownerPassword: ['', editing ? [] : [Validators.minLength(6)]],
    });
  }

  save() {
    const v = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      name: v.name,
      description: v.description || undefined,
    };
    if (!this.data.org) {
      payload['ownerEmail'] = v.ownerEmail;
      payload['ownerFirstName'] = v.ownerFirstName;
      payload['ownerLastName'] = v.ownerLastName;
      payload['ownerPassword'] = v.ownerPassword;
    }
    this.dialogRef.close(payload);
  }
}

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="header">
      <h1>Organizations</h1>
      <button mat-flat-button color="primary" (click)="openNew()">
        <mat-icon>add</mat-icon> New Organization
      </button>
    </div>

    <mat-card>
      <table mat-table [dataSource]="orgs()" class="full-width">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let o">{{ o.name }}</td>
        </ng-container>
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Description</th>
          <td mat-cell *matCellDef="let o">{{ o.description || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>Created</th>
          <td mat-cell *matCellDef="let o">
            {{ o.createdAt | date: 'mediumDate' }}
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let o" class="right">
            <button mat-icon-button (click)="openEdit(o)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="remove(o)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols"></tr>
      </table>
      <p class="empty" *ngIf="!orgs().length">No organizations yet.</p>
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
      h1 {
        margin: 0;
      }
      .right {
        text-align: right;
      }
      .empty {
        padding: 16px;
        color: #64748b;
      }
    `,
  ],
})
export class OrganizationsComponent {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  orgs = signal<Organization[]>([]);
  cols = ['name', 'description', 'createdAt', 'actions'];

  constructor() {
    this.refresh();
  }

  refresh() {
    this.api.listOrganizations().subscribe((orgs) => this.orgs.set(orgs));
  }

  openNew() {
    const ref = this.dialog.open(OrgDialogComponent, {
      data: {},
      width: '520px',
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.api.createOrganization(payload).subscribe({
        next: () => {
          this.snack.open('Organization created', 'OK', { duration: 2500 });
          this.refresh();
        },
        error: (e) =>
          this.snack.open(e?.error?.message || 'Error', 'Close', {
            duration: 4000,
          }),
      });
    });
  }

  openEdit(org: Organization) {
    const ref = this.dialog.open(OrgDialogComponent, {
      data: { org },
      width: '520px',
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.api
        .updateOrganization(org.id, {
          name: payload['name'],
          description: payload['description'],
        })
        .subscribe({
          next: () => {
            this.snack.open('Organization updated', 'OK', { duration: 2500 });
            this.refresh();
          },
        });
    });
  }

  remove(org: Organization) {
    if (!confirm(`Delete organization "${org.name}"? This cannot be undone.`))
      return;
    this.api.deleteOrganization(org.id).subscribe(() => {
      this.snack.open('Organization deleted', 'OK', { duration: 2500 });
      this.refresh();
    });
  }
}
