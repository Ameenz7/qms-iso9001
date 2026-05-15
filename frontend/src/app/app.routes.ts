import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards';
import { Role } from './core/models';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'accept-invite',
    loadComponent: () =>
      import('./features/auth/accept-invite.component').then(
        (m) => m.AcceptInviteComponent,
      ),
  },
  {
    path: 'shared/:token',
    loadComponent: () =>
      import('./features/shared-document/shared-document.component').then(
        (m) => m.SharedDocumentComponent,
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        canActivate: [
          roleGuard(
            Role.ADMIN_OWNER,
            Role.QUALITY_MANAGER,
            Role.AUDITOR,
            Role.EMPLOYEE,
          ),
        ],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'organizations',
        canActivate: [roleGuard(Role.SUPER_ADMIN)],
        loadComponent: () =>
          import('./features/organizations/organizations.component').then(
            (m) => m.OrganizationsComponent,
          ),
      },
      {
        path: 'users',
        canActivate: [roleGuard(Role.ADMIN_OWNER, Role.QUALITY_MANAGER)],
        loadComponent: () =>
          import('./features/users/users.component').then(
            (m) => m.UsersComponent,
          ),
      },
      {
        path: 'non-conformities',
        canActivate: [
          roleGuard(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE),
        ],
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './features/non-conformities/pages/nc-list.component'
              ).then((m) => m.NcListComponent),
          },
          {
            path: ':id',
            loadComponent: () =>
              import(
                './features/non-conformities/pages/nc-detail.component'
              ).then((m) => m.NcDetailComponent),
          },
        ],
      },
      {
        path: 'documents',
        canActivate: [
          roleGuard(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE),
        ],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/documents/pages/document-list.component').then(
                (m) => m.DocumentListComponent,
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import(
                './features/documents/pages/document-detail.component'
              ).then((m) => m.DocumentDetailComponent),
          },
        ],
      },
      {
        path: 'audit-logs',
        canActivate: [roleGuard(Role.ADMIN_OWNER, Role.QUALITY_MANAGER)],
        loadComponent: () =>
          import('./features/audit/audit.component').then(
            (m) => m.AuditComponent,
          ),
      },
      {
        path: 'audits',
        canActivate: [
          roleGuard(
            Role.ADMIN_OWNER,
            Role.QUALITY_MANAGER,
            Role.AUDITOR,
          ),
        ],
        loadComponent: () =>
          import('./features/audits/audits.component').then(
            (m) => m.AuditsComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(
            (m) => m.SettingsComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
