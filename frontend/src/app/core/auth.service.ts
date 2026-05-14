import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Role, User } from './models';
import { seedUsers } from './mock-data';

const STORAGE_KEY = 'qms.auth.user';

/**
 * Mock auth — no real backend. Login matches a seeded user by email.
 * Password is "password" for everyone, or you can use the role-switcher in the topbar.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  private users: User[] = [...seedUsers];

  readonly user = signal<User | null>(this.loadFromStorage());
  readonly isAuthenticated = computed(() => !!this.user());

  private loadFromStorage(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private saveToStorage(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  login(email: string, password: string): Observable<User> {
    return new Observable<User>((observer) => {
      setTimeout(() => {
        const found = this.users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.isActive,
        );
        if (!found) {
          observer.error(new Error('Invalid credentials'));
          return;
        }
        if (password !== 'password') {
          observer.error(new Error('Invalid credentials'));
          return;
        }
        this.user.set(found);
        this.saveToStorage(found);
        observer.next(found);
        observer.complete();
      }, 300);
    });
  }

  register(
    token: string,
    payload: {
      firstName: string;
      lastName: string;
      password: string;
    },
  ): Observable<User> {
    return of({
      id: `user-${Date.now()}`,
      email: `${payload.firstName.toLowerCase()}@demo.com`,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: 'EMPLOYEE' as Role,
      orgId: 'org-1',
      isActive: true,
      createdAt: new Date().toISOString(),
    }).pipe(delay(400));
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return of({
      message: `If an account exists for ${email}, we sent a reset link.`,
    }).pipe(delay(400));
  }

  logout(): void {
    this.user.set(null);
    this.saveToStorage(null);
    void this.router.navigate(['/login']);
  }

  /** Demo helper: switch the active user role without re-logging in. */
  switchRole(role: Role): void {
    const candidate = this.users.find((u) => u.role === role && u.isActive);
    if (candidate) {
      this.user.set(candidate);
      this.saveToStorage(candidate);
    }
  }

  hasRole(...roles: Role[]): boolean {
    const u = this.user();
    return !!u && roles.includes(u.role);
  }
}
