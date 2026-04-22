import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthUser, LoginResponse, Role } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly user = signal<AuthUser | null>(null);
  readonly ready = signal<boolean>(false);
  readonly isAuthenticated = computed(() => !!this.user());

  /**
   * Bootstraps the auth state on app start. Hits `/auth/me` — if the httpOnly
   * cookie is valid the backend returns the user; otherwise a 401 leaves us
   * anonymous. Also primes the XSRF-TOKEN cookie.
   */
  async bootstrap(): Promise<void> {
    await firstValueFrom(
      this.http.get(`${environment.apiUrl}/auth/csrf-token`).pipe(
        catchError(() => of(null)),
      ),
    );
    const me = await firstValueFrom(
      this.http
        .get<AuthUser>(`${environment.apiUrl}/auth/me`)
        .pipe(catchError(() => of(null as AuthUser | null))),
    );
    this.user.set(me);
    this.ready.set(true);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((res) => {
          this.user.set(res.user);
        }),
      );
  }

  logout(): void {
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {})
      .subscribe({ complete: () => this.afterLogout() });
  }

  private afterLogout(): void {
    this.user.set(null);
    void this.router.navigate(['/login']);
  }

  hasRole(...roles: Role[]): boolean {
    const u = this.user();
    return !!u && roles.includes(u.role);
  }
}
