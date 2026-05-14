import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import {
  AuthUser,
  Organization,
  Role,
  ROLE_LABELS,
  UserRecord,
} from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  template: `
    <h1>Settings</h1>

    <mat-tab-group>
      <mat-tab label="Account">
        <div class="tab-content">
          <mat-card class="settings-card">
            <h3>Profile</h3>
            <div class="form-grid">
              <mat-form-field>
                <mat-label>First Name</mat-label>
                <input matInput [(ngModel)]="profile.firstName" />
              </mat-form-field>
              <mat-form-field>
                <mat-label>Last Name</mat-label>
                <input matInput [(ngModel)]="profile.lastName" />
              </mat-form-field>
              <mat-form-field class="full-width">
                <mat-label>Email</mat-label>
                <input matInput [value]="profile.email" disabled />
              </mat-form-field>
              <mat-form-field class="full-width">
                <mat-label>Role</mat-label>
                <input matInput [value]="roleLabel" disabled />
              </mat-form-field>
            </div>
            <div class="actions">
              <button mat-raised-button color="primary" (click)="saveProfile()">Save</button>
            </div>
          </mat-card>

          <mat-card class="settings-card">
            <h3>Change Password</h3>
            <div class="form-grid">
              <mat-form-field>
                <mat-label>Current Password</mat-label>
                <input matInput type="password" [(ngModel)]="password.current" />
              </mat-form-field>
              <mat-form-field>
                <mat-label>New Password</mat-label>
                <input matInput type="password" [(ngModel)]="password.newPwd" />
              </mat-form-field>
            </div>
            <div class="actions">
              <button mat-raised-button color="primary" (click)="changePassword()">Change Password</button>
            </div>
          </mat-card>
        </div>
      </mat-tab>

      <mat-tab label="Organization" *ngIf="isOA">
        <div class="tab-content">
          <mat-card class="settings-card">
            <h3>Organization Details</h3>
            <div class="form-grid">
              <mat-form-field class="full-width">
                <mat-label>Name</mat-label>
                <input matInput [(ngModel)]="org.name" />
              </mat-form-field>
              <mat-form-field class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput [(ngModel)]="org.description" rows="3"></textarea>
              </mat-form-field>
            </div>
            <div class="actions">
              <button mat-raised-button color="primary" (click)="saveOrg()">Save</button>
            </div>
          </mat-card>
        </div>
      </mat-tab>

      <mat-tab label="Users" *ngIf="isOA || isQM">
        <div class="tab-content">
          <mat-card class="settings-card">
            <h3>Organization Users</h3>
            <table mat-table [dataSource]="orgUsers()" class="full-width">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let u">{{ u.firstName }} {{ u.lastName }}</td>
              </ng-container>
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let u">{{ u.email }}</td>
              </ng-container>
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let u">
                  <mat-select [value]="u.role" (selectionChange)="changeRole(u.id, $event.value)"
                    *ngIf="isOA && u.id !== currentUserId; else roleText" [disabled]="!isOA">
                    <mat-option *ngFor="let r of roles" [value]="r.value">{{ r.label }}</mat-option>
                  </mat-select>
                  <ng-template #roleText>{{ getRoleLabel(u.role) }}</ng-template>
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let u">
                  <span class="chip" [class.active]="u.isActive" [class.inactive]="!u.isActive">
                    {{ u.isActive ? 'Active' : 'Suspended' }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let u">
                  <ng-container *ngIf="isOA && u.id !== currentUserId">
                    <button mat-icon-button *ngIf="u.isActive" (click)="suspendUser(u.id)" title="Suspend">
                      <mat-icon>block</mat-icon>
                    </button>
                    <button mat-icon-button *ngIf="!u.isActive" (click)="reactivateUser(u.id)" title="Reactivate">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                  </ng-container>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="userCols"></tr>
              <tr mat-row *matRowDef="let row; columns: userCols"></tr>
            </table>
          </mat-card>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .tab-content { padding: 16px 0; }
    .settings-card { padding: 16px; margin-bottom: 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .full-width { grid-column: 1 / -1; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
    .chip { padding: 2px 8px; border-radius: 12px; font-size: 12px; }
    .active { background: #bbf7d0; color: #166534; }
    .inactive { background: #fecaca; color: #991b1b; }
    h3 { margin: 0 0 12px; }
    table { width: 100%; }
  `],
})
export class SettingsComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  orgUsers = signal<UserRecord[]>([]);
  profile = { firstName: '', lastName: '', email: '', role: '' as Role };
  password = { current: '', newPwd: '' };
  org = { name: '', description: '' };
  roleLabels = ROLE_LABELS;
  userCols = ['name', 'email', 'role', 'status', 'actions'];
  roles = Object.entries(ROLE_LABELS)
    .filter(([k]) => k !== Role.SUPER_ADMIN)
    .map(([value, label]) => ({ value, label }));

  getRoleLabel(role: Role): string {
    return ROLE_LABELS[role] ?? role;
  }

  get currentUserId() { return this.auth.user()?.id; }
  get isOA() { return this.auth.user()?.role === Role.ADMIN_OWNER; }
  get isQM() { return this.auth.user()?.role === Role.QUALITY_MANAGER; }
  get roleLabel() { return this.profile.role ? ROLE_LABELS[this.profile.role] : ''; }

  constructor() {
    this.loadProfile();
    this.loadOrg();
    this.loadUsers();
  }

  loadProfile() {
    this.api.getAccountSettings().subscribe({
      next: (u) => {
        this.profile.firstName = u.firstName;
        this.profile.lastName = u.lastName;
        this.profile.email = u.email;
        this.profile.role = u.role;
      },
    });
  }

  loadOrg() {
    this.api.getOrgSettings().subscribe({
      next: (o) => {
        this.org.name = o.name;
        this.org.description = o.description ?? '';
      },
      error: () => {},
    });
  }

  loadUsers() {
    this.api.getOrgUsers().subscribe({
      next: (users) => this.orgUsers.set(users),
      error: () => {},
    });
  }

  saveProfile() {
    this.api.updateAccountSettings({
      firstName: this.profile.firstName,
      lastName: this.profile.lastName,
    }).subscribe({
      next: () => this.snackBar.open('Profile updated', 'OK', { duration: 2000 }),
      error: () => this.snackBar.open('Update failed', 'OK', { duration: 3000 }),
    });
  }

  changePassword() {
    this.api.changePassword({
      currentPassword: this.password.current,
      newPassword: this.password.newPwd,
    }).subscribe({
      next: () => {
        this.snackBar.open('Password changed', 'OK', { duration: 2000 });
        this.password = { current: '', newPwd: '' };
      },
      error: () => this.snackBar.open('Failed to change password', 'OK', { duration: 3000 }),
    });
  }

  saveOrg() {
    this.api.updateOrgSettings(this.org).subscribe({
      next: () => this.snackBar.open('Organization updated', 'OK', { duration: 2000 }),
      error: () => this.snackBar.open('Update failed', 'OK', { duration: 3000 }),
    });
  }

  changeRole(userId: string, role: string) {
    this.api.updateUserRole(userId, role).subscribe({
      next: () => { this.loadUsers(); this.snackBar.open('Role updated', 'OK', { duration: 2000 }); },
      error: () => this.snackBar.open('Update failed', 'OK', { duration: 3000 }),
    });
  }

  suspendUser(userId: string) {
    this.api.suspendUser(userId).subscribe({
      next: () => this.loadUsers(),
      error: () => this.snackBar.open('Failed', 'OK', { duration: 3000 }),
    });
  }

  reactivateUser(userId: string) {
    this.api.reactivateUser(userId).subscribe({
      next: () => this.loadUsers(),
      error: () => this.snackBar.open('Failed', 'OK', { duration: 3000 }),
    });
  }
}
