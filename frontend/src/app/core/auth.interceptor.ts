import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'X-XSRF-TOKEN';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

/**
 * - Sends the session cookie (httpOnly JWT) with every request via
 *   `withCredentials`.
 * - On state-changing requests, echoes the `XSRF-TOKEN` cookie value back in
 *   the `X-XSRF-TOKEN` header (double-submit CSRF defense).
 * - On 401, clears local auth state and bounces to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const headers: Record<string, string> = {};
  if (UNSAFE_METHODS.has(req.method.toUpperCase())) {
    const csrf = readCookie(CSRF_COOKIE);
    if (csrf) headers[CSRF_HEADER] = csrf;
  }

  const request = req.clone({
    withCredentials: true,
    setHeaders: headers,
  });

  return next(request).pipe(
    catchError((err) => {
      if (err?.status === 401 && !req.url.endsWith('/auth/me')) {
        auth.user.set(null);
        void router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
