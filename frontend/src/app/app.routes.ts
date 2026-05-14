import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'register/:token',
    loadComponent: () =>
      import('./features/auth/register.component').then(
        (m) => m.RegisterComponent,
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
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'organizations',
        canActivate: [roleGuard('SUPER_ADMIN')],
        loadComponent: () =>
          import('./features/invitations/organizations.component').then(
            (m) => m.OrganizationsComponent,
          ),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/documents/documents.component').then(
            (m) => m.DocumentsComponent,
          ),
      },
      {
        path: 'nc',
        loadComponent: () =>
          import('./features/nc/nc-list.component').then(
            (m) => m.NcListComponent,
          ),
      },
      {
        path: 'nc/:id',
        loadComponent: () =>
          import('./features/nc/nc-detail.component').then(
            (m) => m.NcDetailComponent,
          ),
      },
      {
        path: 'audits',
        canActivate: [
          roleGuard('SUPER_ADMIN', 'ORG_ADMIN', 'QUALITY_MANAGER', 'AUDITOR'),
        ],
        loadComponent: () =>
          import('./features/audits/audits-list.component').then(
            (m) => m.AuditsListComponent,
          ),
      },
      {
        path: 'audits/:id',
        canActivate: [
          roleGuard('SUPER_ADMIN', 'ORG_ADMIN', 'QUALITY_MANAGER', 'AUDITOR'),
        ],
        loadComponent: () =>
          import('./features/audits/audit-detail.component').then(
            (m) => m.AuditDetailComponent,
          ),
      },
      {
        path: 'audit-trail',
        canActivate: [roleGuard('SUPER_ADMIN', 'ORG_ADMIN')],
        loadComponent: () =>
          import('./features/audit-trail/audit-trail.component').then(
            (m) => m.AuditTrailComponent,
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
