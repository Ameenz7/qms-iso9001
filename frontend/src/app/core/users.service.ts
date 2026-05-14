import { Injectable, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { AuthService } from './auth.service';
import { DataStore } from './data.store';
import { Organization, Role, User } from './models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private store = inject(DataStore);
  private auth = inject(AuthService);

  list(): Observable<User[]> {
    const currentUser = this.auth.user();
    if (!currentUser) return of([]).pipe(delay(80));
    if (currentUser.role === 'SUPER_ADMIN') {
      return of([...this.store.users()]).pipe(delay(100));
    }
    return of(
      this.store
        .users()
        .filter((u) => u.orgId === currentUser.orgId),
    ).pipe(delay(100));
  }

  byId(id: string): User | undefined {
    return this.store.users().find((u) => u.id === id);
  }

  byIds(ids: string[]): User[] {
    return this.store.users().filter((u) => ids.includes(u.id));
  }

  changeRole(userId: string, role: Role): Observable<User> {
    const actor = this.auth.user()!;
    this.store.users.update((arr) =>
      arr.map((u) => (u.id === userId ? { ...u, role } : u)),
    );
    this.store.logAction({
      userId: actor.id,
      userName: `${actor.firstName} ${actor.lastName}`,
      action: 'UPDATE',
      entity: 'User',
      entityId: userId,
      details: `Changed role to ${role}`,
    });
    return of(this.store.users().find((u) => u.id === userId)!).pipe(delay(100));
  }

  toggleActive(userId: string): Observable<User> {
    this.store.users.update((arr) =>
      arr.map((u) =>
        u.id === userId ? { ...u, isActive: !u.isActive } : u,
      ),
    );
    return of(this.store.users().find((u) => u.id === userId)!).pipe(delay(80));
  }

  updateProfile(
    userId: string,
    patch: Partial<Pick<User, 'firstName' | 'lastName' | 'avatarUrl'>>,
  ): Observable<User> {
    this.store.users.update((arr) =>
      arr.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
    );
    const updated = this.store.users().find((u) => u.id === userId)!;
    if (this.auth.user()?.id === userId) {
      this.auth.user.set(updated);
    }
    return of(updated).pipe(delay(120));
  }

  organizations(): Observable<Organization[]> {
    return of([...this.store.organizations()]).pipe(delay(100));
  }
}
