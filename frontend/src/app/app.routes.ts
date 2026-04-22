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
          roleGuard(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE),
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
        loadComponent: () =>
          import(
            './features/non-conformities/non-conformities.component'
          ).then((m) => m.NonConformitiesComponent),
      },
      {
        path: 'capas',
        canActivate: [
          roleGuard(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE),
        ],
        loadComponent: () =>
          import('./features/capas/capas.component').then(
            (m) => m.CapasComponent,
          ),
      },
      {
        path: 'capas/:id',
        canActivate: [
          roleGuard(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE),
        ],
        loadComponent: () =>
          import('./features/capas/capa-detail.component').then(
            (m) => m.CapaDetailComponent,
          ),
      },
      {
        path: 'documents',
        canActivate: [
          roleGuard(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE),
        ],
        loadComponent: () =>
          import('./features/documents/documents.component').then(
            (m) => m.DocumentsComponent,
          ),
      },
      {
        path: 'audit-logs',
        canActivate: [roleGuard(Role.ADMIN_OWNER, Role.QUALITY_MANAGER)],
        loadComponent: () =>
          import('./features/audit/audit.component').then(
            (m) => m.AuditComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
