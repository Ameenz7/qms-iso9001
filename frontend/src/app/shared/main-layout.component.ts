import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ROLE_LABELS, Role } from '../core/models';

interface NavItem {
  label: string;
  icon: string;
  link: string;
  roles: Role[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <mat-sidenav-container class="container">
      <mat-sidenav mode="side" opened class="sidenav">
        <div class="brand">
          <mat-icon>verified</mat-icon>
          <span>QMS ISO 9001</span>
        </div>
        <mat-nav-list>
          <a
            *ngFor="let item of visibleNav()"
            mat-list-item
            [routerLink]="item.link"
            routerLinkActive="active-link">
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <span>Quality Management</span>
          <span class="spacer"></span>
          <span class="user-info" *ngIf="user() as u">
            {{ u.firstName }} {{ u.lastName }}
            <small>({{ roleLabel(u.role) }})</small>
          </span>
          <button mat-icon-button (click)="logout()" title="Logout">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>
        <div class="page-container">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .container {
        height: 100vh;
      }
      .sidenav {
        width: 240px;
        background: #0f172a;
        color: #e2e8f0;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 18px 18px;
        font-size: 18px;
        font-weight: 600;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .brand mat-icon {
        color: #38bdf8;
      }
      ::ng-deep .sidenav .mdc-list-item {
        color: #e2e8f0 !important;
      }
      ::ng-deep .sidenav .active-link {
        background: rgba(56, 189, 248, 0.15) !important;
        color: #38bdf8 !important;
      }
      ::ng-deep .sidenav .active-link .mdc-list-item__primary-text,
      ::ng-deep .sidenav .active-link mat-icon {
        color: #38bdf8 !important;
      }
      .user-info {
        margin-right: 12px;
        font-size: 14px;
      }
      .user-info small {
        opacity: 0.8;
        margin-left: 4px;
      }
    `,
  ],
})
export class MainLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  user = this.auth.user;

  private nav: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      link: '/dashboard',
      roles: [
        Role.SUPER_ADMIN,
        Role.ADMIN_OWNER,
        Role.QUALITY_MANAGER,
        Role.EMPLOYEE,
      ],
    },
    {
      label: 'Organizations',
      icon: 'business',
      link: '/organizations',
      roles: [Role.SUPER_ADMIN],
    },
    {
      label: 'Users',
      icon: 'group',
      link: '/users',
      roles: [Role.SUPER_ADMIN, Role.ADMIN_OWNER, Role.QUALITY_MANAGER],
    },
    {
      label: 'Non-Conformities',
      icon: 'report_problem',
      link: '/non-conformities',
      roles: [Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE],
    },
    {
      label: 'CAPAs',
      icon: 'build_circle',
      link: '/capas',
      roles: [Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE],
    },
    {
      label: 'Documents',
      icon: 'description',
      link: '/documents',
      roles: [Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE],
    },
    {
      label: 'Audit Logs',
      icon: 'history',
      link: '/audit-logs',
      roles: [Role.SUPER_ADMIN, Role.ADMIN_OWNER, Role.QUALITY_MANAGER],
    },
  ];

  visibleNav = computed(() => {
    const u = this.user();
    if (!u) return [];
    return this.nav.filter((n) => n.roles.includes(u.role));
  });

  roleLabel(role: Role): string {
    return ROLE_LABELS[role];
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
