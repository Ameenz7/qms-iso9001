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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ROLE_LABELS, Role, UserRecord } from '../../core/models';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.user ? 'Edit User' : 'New User' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input
            matInput
            formControlName="email"
            type="email"
            [readonly]="!!data.user" />
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" />
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option *ngFor="let r of availableRoles" [value]="r">
              {{ roleLabel(r) }}
            </mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ data.user ? 'New Password (optional)' : 'Password' }}</mat-label>
          <input matInput formControlName="password" type="password" />
        </mat-form-field>
        <mat-slide-toggle
          *ngIf="data.user"
          formControlName="isActive">
          Active
        </mat-slide-toggle>
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
    `,
  ],
})
export class UserDialogComponent {
  private fb = inject(FormBuilder);
  form;
  availableRoles: Role[];

  constructor(
    public dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { user?: UserRecord; actorRole: Role },
  ) {
    const editing = !!data.user;
    if (data.actorRole === Role.SUPER_ADMIN) {
      this.availableRoles = [
        Role.SUPER_ADMIN,
        Role.ADMIN_OWNER,
        Role.QUALITY_MANAGER,
        Role.EMPLOYEE,
      ];
    } else {
      this.availableRoles = [Role.QUALITY_MANAGER, Role.EMPLOYEE];
    }
    this.form = this.fb.nonNullable.group({
      email: [
        { value: data.user?.email ?? '', disabled: editing },
        [Validators.required, Validators.email],
      ],
      firstName: [data.user?.firstName ?? '', [Validators.required]],
      lastName: [data.user?.lastName ?? '', [Validators.required]],
      role: [data.user?.role ?? Role.EMPLOYEE, [Validators.required]],
      password: [
        '',
        editing ? [Validators.minLength(6)] : [Validators.minLength(6), Validators.required],
      ],
      isActive: [data.user?.isActive ?? true],
    });
  }

  roleLabel(r: Role): string {
    return ROLE_LABELS[r];
  }

  save() {
    const v = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      firstName: v.firstName,
      lastName: v.lastName,
      role: v.role,
    };
    if (!this.data.user) {
      payload['email'] = v.email;
      payload['password'] = v.password;
    } else {
      payload['isActive'] = v.isActive;
      if (v.password) payload['password'] = v.password;
    }
    this.dialogRef.close(payload);
  }
}

@Component({
  selector: 'app-users',
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
      <h1>Users</h1>
      <button
        mat-flat-button
        color="primary"
        *ngIf="canManage"
        (click)="openNew()">
        <mat-icon>add</mat-icon> New User
      </button>
    </div>

    <mat-card>
      <table mat-table [dataSource]="users()" class="full-width">
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let u">{{ u.email }}</td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let u">
            {{ u.firstName }} {{ u.lastName }}
          </td>
        </ng-container>
        <ng-container matColumnDef="role">
          <th mat-header-cell *matHeaderCellDef>Role</th>
          <td mat-cell *matCellDef="let u">{{ roleLabel(u.role) }}</td>
        </ng-container>
        <ng-container matColumnDef="active">
          <th mat-header-cell *matHeaderCellDef>Active</th>
          <td mat-cell *matCellDef="let u">
            {{ u.isActive ? 'Yes' : 'No' }}
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let u" class="right">
            <button
              *ngIf="canManage"
              mat-icon-button
              (click)="openEdit(u)">
              <mat-icon>edit</mat-icon>
            </button>
            <button
              *ngIf="canManage && u.id !== currentUserId"
              mat-icon-button
              color="warn"
              (click)="remove(u)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols"></tr>
      </table>
      <p class="empty" *ngIf="!users().length">No users yet.</p>
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
export class UsersComponent {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private auth = inject(AuthService);

  users = signal<UserRecord[]>([]);
  cols = ['email', 'name', 'role', 'active', 'actions'];

  get canManage(): boolean {
    return this.auth.hasRole(Role.SUPER_ADMIN, Role.ADMIN_OWNER);
  }

  get currentUserId(): string | undefined {
    return this.auth.user()?.id;
  }

  roleLabel(role: Role): string {
    return ROLE_LABELS[role];
  }

  constructor() {
    this.refresh();
  }

  refresh() {
    this.api.listUsers().subscribe((u) => this.users.set(u));
  }

  openNew() {
    const ref = this.dialog.open(UserDialogComponent, {
      data: { actorRole: this.auth.user()?.role },
      width: '520px',
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.api.createUser(payload).subscribe({
        next: () => {
          this.snack.open('User created', 'OK', { duration: 2500 });
          this.refresh();
        },
        error: (e) =>
          this.snack.open(e?.error?.message || 'Error', 'Close', {
            duration: 4000,
          }),
      });
    });
  }

  openEdit(user: UserRecord) {
    const ref = this.dialog.open(UserDialogComponent, {
      data: { user, actorRole: this.auth.user()?.role },
      width: '520px',
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.api.updateUser(user.id, payload).subscribe({
        next: () => {
          this.snack.open('User updated', 'OK', { duration: 2500 });
          this.refresh();
        },
        error: (e) =>
          this.snack.open(
            e?.error?.message?.[0] || e?.error?.message || 'Error',
            'Close',
            { duration: 4000 },
          ),
      });
    });
  }

  remove(user: UserRecord) {
    if (!confirm(`Delete user "${user.email}"?`)) return;
    this.api.deleteUser(user.id).subscribe({
      next: () => {
        this.snack.open('User deleted', 'OK', { duration: 2500 });
        this.refresh();
      },
      error: (e) =>
        this.snack.open(
          e?.error?.message?.[0] || e?.error?.message || 'Error',
          'Close',
          { duration: 4000 },
        ),
    });
  }
}
