import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';

function landingFor(role: Role | undefined): string {
  return role === Role.SUPER_ADMIN ? '/organizations' : '/dashboard';
}

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  void router.navigate(['/login']);
  return false;
};

export const roleGuard = (...roles: Role[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) {
      void router.navigate(['/login']);
      return false;
    }
    if (!auth.hasRole(...roles)) {
      void router.navigate([landingFor(auth.user()?.role)]);
      return false;
    }
    return true;
  };
};
