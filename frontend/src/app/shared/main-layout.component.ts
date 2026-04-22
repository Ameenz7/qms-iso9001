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
        <mat-toolbar>
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
        width: 248px;
        background: var(--notion-sidebar);
        color: var(--notion-text);
        border-right: 1px solid var(--notion-border) !important;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 14px 14px 10px;
        font-size: 14px;
        font-weight: 600;
        color: var(--notion-text);
      }
      .brand mat-icon {
        color: var(--notion-text);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      :host ::ng-deep .sidenav .mat-mdc-list-item {
        color: var(--notion-text-muted) !important;
        border-radius: 4px !important;
        margin: 1px 6px !important;
        width: calc(100% - 12px) !important;
        height: 32px !important;
        font-size: 14px !important;
      }
      :host ::ng-deep .sidenav .mat-mdc-list-item .mdc-list-item__primary-text {
        color: var(--notion-text-muted) !important;
        font-size: 14px !important;
      }
      :host ::ng-deep .sidenav .mat-mdc-list-item mat-icon {
        color: var(--notion-text-muted) !important;
        font-size: 18px !important;
        width: 18px !important;
        height: 18px !important;
      }
      :host ::ng-deep .sidenav .mat-mdc-list-item:hover {
        background: var(--notion-hover) !important;
      }
      :host ::ng-deep .sidenav .active-link {
        background: var(--notion-hover) !important;
      }
      :host ::ng-deep .sidenav .active-link .mdc-list-item__primary-text,
      :host ::ng-deep .sidenav .active-link mat-icon {
        color: var(--notion-text) !important;
        font-weight: 500 !important;
      }
      .user-info {
        margin-right: 12px;
        font-size: 13px;
        color: var(--notion-text-muted);
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
      roles: [Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE],
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
      roles: [Role.ADMIN_OWNER, Role.QUALITY_MANAGER],
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
      roles: [Role.ADMIN_OWNER, Role.QUALITY_MANAGER],
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
