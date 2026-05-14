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
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../core/auth.service';
import { InvitationsService } from '../../core/invitations.service';
import { ROLE_LABELS, Role, User } from '../../core/models';
import { UsersService } from '../../core/users.service';

@Component({
  selector: 'app-invite-user',
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
    <h2 mat-dialog-title>Invite user</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Email</mat-label>
        <input matInput type="email" [(ngModel)]="email" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Role</mat-label>
        <mat-select [(ngModel)]="role">
          <mat-option value="ORG_ADMIN">Org Admin</mat-option>
          <mat-option value="QUALITY_MANAGER">Quality Manager</mat-option>
          <mat-option value="AUDITOR">Auditor</mat-option>
          <mat-option value="EMPLOYEE">Employee</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!email"
        (click)="ref.close({ email, role })"
      >
        Send invite
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class InviteUserDialogComponent {
  ref = inject(MatDialogRef<InviteUserDialogComponent>);
  email = '';
  role: Role = 'EMPLOYEE';
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatDialogModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Settings</h1>
          <div class="subtitle">Organization, users and your profile</div>
        </div>
      </div>

      <mat-tab-group>
        <mat-tab label="Profile">
          <mat-card style="margin-top: 16px;">
            <mat-card-content *ngIf="user() as me">
              <h3>My account</h3>
              <div class="row">
                <mat-form-field appearance="outline">
                  <mat-label>First name</mat-label>
                  <input matInput [(ngModel)]="profile.firstName" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Last name</mat-label>
                  <input matInput [(ngModel)]="profile.lastName" />
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput [value]="me.email" disabled />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Role (system-managed)</mat-label>
                <input matInput [value]="roleLabels[me.role]" disabled />
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="saveProfile()">
                Save profile
              </button>

              <h3 style="margin-top: 24px">Change password</h3>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>New password</mat-label>
                <input matInput type="password" [(ngModel)]="newPassword" />
              </mat-form-field>
              <button
                mat-stroked-button
                [disabled]="!newPassword || newPassword.length < 6"
                (click)="changePassword()"
              >
                Update password
              </button>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <mat-tab label="Organization" *ngIf="canManageOrg()">
          <mat-card style="margin-top: 16px;">
            <mat-card-content>
              <h3>Organization details</h3>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Name</mat-label>
                <input matInput [(ngModel)]="orgName" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Timezone</mat-label>
                <mat-select [(ngModel)]="timezone">
                  <mat-option value="Europe/Paris">Europe/Paris</mat-option>
                  <mat-option value="Europe/London">Europe/London</mat-option>
                  <mat-option value="UTC">UTC</mat-option>
                  <mat-option value="America/New_York">America/New_York</mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="saveOrg()">
                Save (mock)
              </button>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <mat-tab label="Users" *ngIf="canManageUsers()">
          <mat-card style="margin-top: 16px;">
            <mat-card-content>
              <div class="users-header">
                <h3>Team members</h3>
                <button mat-raised-button color="primary" (click)="openInvite()">
                  <mat-icon>person_add</mat-icon> Invite user
                </button>
              </div>
              <table mat-table [dataSource]="users()" class="full-width">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let u">
                    {{ $any(u).firstName }} {{ $any(u).lastName }}
                  </td>
                </ng-container>
                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef>Email</th>
                  <td mat-cell *matCellDef="let u">{{ $any(u).email }}</td>
                </ng-container>
                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef>Role</th>
                  <td mat-cell *matCellDef="let u">{{ roleLabel($any(u).role) }}</td>
                </ng-container>
                <ng-container matColumnDef="active">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let u">
                    <span [class]="$any(u).isActive ? 'chip-closed' : 'chip-obsolete'">
                      {{ $any(u).isActive ? 'Active' : 'Disabled' }}
                    </span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let u">
                    <button mat-icon-button [matMenuTriggerFor]="menu">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item *ngFor="let r of assignableRoles()" (click)="changeRole($any(u), r)">
                        <mat-icon>swap_horiz</mat-icon>
                        Set role: {{ roleLabels[r] }}
                      </button>
                      <button mat-menu-item (click)="toggleActive($any(u))">
                        <mat-icon>{{ $any(u).isActive ? 'block' : 'check_circle' }}</mat-icon>
                        {{ $any(u).isActive ? 'Disable' : 'Enable' }}
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="['name','email','role','active','actions']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['name','email','role','active','actions']"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <mat-tab label="Roles">
          <mat-card style="margin-top: 16px;">
            <mat-card-content>
              <h3>System roles (read-only)</h3>
              <table class="role-table">
                <tr>
                  <th>Role</th>
                  <th>Permissions</th>
                </tr>
                <tr><td>Super Admin</td><td>Manage all orgs, invite Org Admins, see everything.</td></tr>
                <tr><td>Org Admin</td><td>Invite users in their org, manage user roles, full access.</td></tr>
                <tr><td>Quality Manager</td><td>Documents (CRUD + approve), NC/CAPA, audits.</td></tr>
                <tr><td>Auditor</td><td>Audits (CRUD), read documents and NCs.</td></tr>
                <tr><td>Employee</td><td>Read documents, report NCs, see their tasks.</td></tr>
              </table>
            </mat-card-content>
          </mat-card>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .full-width { width: 100%; }
      .row { display: flex; gap: 16px; }
      .row mat-form-field { flex: 1; }
      .users-header {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 12px;
      }
      h3 { font-size: 16px; margin: 4px 0 12px; }
      .role-table {
        width: 100%;
        border-collapse: collapse;
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 500; }
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  private auth = inject(AuthService);
  private usersService = inject(UsersService);
  private invitationsService = inject(InvitationsService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  user = this.auth.user;
  users = signal<User[]>([]);

  profile = { firstName: '', lastName: '' };
  newPassword = '';
  orgName = 'Demo Corp';
  timezone = 'Europe/Paris';

  readonly roleLabels = ROLE_LABELS;

  ngOnInit(): void {
    const me = this.auth.user();
    if (me) {
      this.profile.firstName = me.firstName;
      this.profile.lastName = me.lastName;
    }
    this.refreshUsers();
  }

  refreshUsers(): void {
    this.usersService.list().subscribe((u) => this.users.set(u));
  }

  canManageOrg(): boolean {
    return this.auth.hasRole('SUPER_ADMIN', 'ORG_ADMIN');
  }

  canManageUsers(): boolean {
    return this.auth.hasRole('SUPER_ADMIN', 'ORG_ADMIN');
  }

  roleLabel(role: string): string {
    return ROLE_LABELS[role as Role] ?? role;
  }

  assignableRoles(): Role[] {
    if (this.auth.hasRole('SUPER_ADMIN')) {
      return ['ORG_ADMIN', 'QUALITY_MANAGER', 'AUDITOR', 'EMPLOYEE'];
    }
    return ['QUALITY_MANAGER', 'AUDITOR', 'EMPLOYEE'];
  }

  saveProfile(): void {
    const me = this.auth.user();
    if (!me) return;
    this.usersService.updateProfile(me.id, this.profile).subscribe(() => {
      this.snack.open('Profile updated', 'Dismiss', { duration: 2000 });
    });
  }

  changePassword(): void {
    this.snack.open(
      'Password change is mocked — would call the backend later.',
      'Dismiss',
      { duration: 3000 },
    );
    this.newPassword = '';
  }

  saveOrg(): void {
    this.snack.open('Organization details saved (mock)', 'Dismiss', {
      duration: 2000,
    });
  }

  changeRole(u: User, role: Role): void {
    this.usersService.changeRole(u.id, role).subscribe(() => {
      this.snack.open(`${u.firstName}'s role updated to ${role}`, 'Dismiss', {
        duration: 2500,
      });
      this.refreshUsers();
    });
  }

  toggleActive(u: User): void {
    this.usersService.toggleActive(u.id).subscribe(() => this.refreshUsers());
  }

  openInvite(): void {
    const ref = this.dialog.open(InviteUserDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.invitationsService.inviteUser(payload).subscribe((inv) => {
        this.snack.open(
          `Invited ${payload.email} — link: /register/${inv.token}`,
          'Dismiss',
          { duration: 6000 },
        );
      });
    });
  }
}
