import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ROLE_LABELS, Role } from '../core/models';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  roles?: Role[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  template: `
    <mat-sidenav-container class="layout">
      <mat-sidenav mode="side" opened class="sidenav">
        <div class="brand">
          <mat-icon>verified</mat-icon>
          <span>QMS ISO 9001</span>
        </div>
        <mat-nav-list>
          <ng-container *ngFor="let item of nav">
            <a
              *ngIf="canSee(item)"
              mat-list-item
              [routerLink]="item.path"
              routerLinkActive="active"
            >
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          </ng-container>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="topbar">
          <span class="page-title">{{ pageTitle() }}</span>
          <span class="spacer"></span>

          <mat-form-field appearance="outline" class="role-switcher" subscriptSizing="dynamic">
            <mat-label>Demo role</mat-label>
            <mat-select [ngModel]="user()?.role" (ngModelChange)="onRoleChange($event)">
              <mat-option *ngFor="let r of roles" [value]="r">
                {{ roleLabels[r] }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-icon-button [matMenuTriggerFor]="userMenu" matTooltip="Account">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <div mat-menu-item disabled class="user-summary">
              <strong>{{ user()?.firstName }} {{ user()?.lastName }}</strong>
              <small>{{ user()?.email }}</small>
              <small class="role-tag">{{ roleLabels[user()!.role] }}</small>
            </div>
            <mat-divider />
            <a mat-menu-item routerLink="/settings">
              <mat-icon>settings</mat-icon>
              <span>Settings</span>
            </a>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .layout { height: 100vh; }
      .sidenav {
        width: 240px;
        background: #1f2937;
        color: #e5e7eb;
        border-right: none;

        .brand {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 20px 20px 16px;
          font-weight: 500;
          font-size: 18px;

          mat-icon { color: #818cf8; }
        }

        ::ng-deep .mat-mdc-list-item {
          color: #cbd5e1 !important;
        }
        ::ng-deep .mat-mdc-list-item .mdc-list-item__primary-text {
          color: #cbd5e1 !important;
        }
        ::ng-deep .mat-mdc-list-item-icon {
          color: #94a3b8 !important;
        }
        ::ng-deep .mat-mdc-list-item.active,
        ::ng-deep .mat-mdc-list-item.active .mdc-list-item__primary-text {
          background: rgba(99, 102, 241, 0.2);
          color: #fff !important;
        }
        ::ng-deep .mat-mdc-list-item.active mat-icon {
          color: #fff !important;
        }
      }

      .topbar {
        position: sticky;
        top: 0;
        z-index: 10;
        gap: 12px;
      }

      .page-title { font-size: 18px; font-weight: 500; }
      .spacer { flex: 1 1 auto; }

      .role-switcher {
        width: 180px;
        ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
        ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__leading,
        ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__notch,
        ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__trailing {
          border-color: rgba(255,255,255,0.4) !important;
        }
        ::ng-deep .mdc-floating-label,
        ::ng-deep .mat-mdc-select-value,
        ::ng-deep .mat-mdc-select-arrow {
          color: #fff !important;
        }
      }

      .content {
        background: #f5f6fa;
        min-height: calc(100vh - 64px);
      }

      .user-summary {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        opacity: 1 !important;
        padding: 8px 16px;
        small { color: #6b7280; font-size: 12px; }
        .role-tag {
          margin-top: 4px;
          background: #ede9fe;
          color: #5b21b6;
          padding: 2px 8px;
          border-radius: 8px;
        }
      }
    `,
  ],
})
export class MainLayoutComponent {
  private auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly roleLabels = ROLE_LABELS;
  readonly roles: Role[] = [
    'SUPER_ADMIN',
    'ORG_ADMIN',
    'QUALITY_MANAGER',
    'AUDITOR',
    'EMPLOYEE',
  ];

  nav: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    {
      label: 'Organizations',
      icon: 'business',
      path: '/organizations',
      roles: ['SUPER_ADMIN'],
    },
    { label: 'Documents', icon: 'description', path: '/documents' },
    { label: 'Non-Conformities', icon: 'report_problem', path: '/nc' },
    {
      label: 'Audits',
      icon: 'fact_check',
      path: '/audits',
      roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'QUALITY_MANAGER', 'AUDITOR'],
    },
    {
      label: 'Audit Trail',
      icon: 'history',
      path: '/audit-trail',
      roles: ['SUPER_ADMIN', 'ORG_ADMIN'],
    },
    { label: 'Settings', icon: 'settings', path: '/settings' },
  ];

  canSee(item: NavItem): boolean {
    if (!item.roles) return true;
    return this.auth.hasRole(...item.roles);
  }

  pageTitle(): string {
    const path = window.location.pathname.split('/')[1];
    const map: Record<string, string> = {
      dashboard: 'Dashboard',
      documents: 'Documents',
      nc: 'Non-Conformities',
      audits: 'Audits',
      'audit-trail': 'Audit Trail',
      organizations: 'Organizations',
      settings: 'Settings',
    };
    return map[path] ?? '';
  }

  onRoleChange(role: Role): void {
    this.auth.switchRole(role);
  }

  logout(): void {
    this.auth.logout();
  }
}
