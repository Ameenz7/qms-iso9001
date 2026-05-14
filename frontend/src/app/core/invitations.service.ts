import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { DataStore } from './data.store';
import { Invitation, Organization, Role, User } from './models';

@Injectable({ providedIn: 'root' })
export class InvitationsService {
  private store = inject(DataStore);
  private auth = inject(AuthService);

  listOrgs(): Observable<Organization[]> {
    return of([...this.store.organizations()]).pipe(delay(100));
  }

  listInvitations(): Observable<Invitation[]> {
    const actor = this.auth.user();
    const all = this.store.invitations();
    if (actor?.role === 'SUPER_ADMIN') return of(all).pipe(delay(120));
    if (actor?.orgId) {
      return of(all.filter((i) => i.orgId === actor.orgId)).pipe(delay(120));
    }
    return of([]).pipe(delay(120));
  }

  /** Super Admin creates a new org + invites the first Org Admin. */
  createOrg(payload: {
    name: string;
    slug: string;
    adminEmail: string;
  }): Observable<{ organization: Organization; invitation: Invitation }> {
    const actor = this.auth.user()!;
    const org: Organization = {
      id: this.store.uid('org'),
      name: payload.name,
      slug: payload.slug,
      createdBy: actor.id,
      createdAt: new Date().toISOString(),
      timezone: 'Europe/Paris',
    };
    const invitation: Invitation = {
      id: this.store.uid('inv'),
      email: payload.adminEmail,
      orgId: org.id,
      role: 'ORG_ADMIN',
      token: `tk-${Math.random().toString(36).slice(2, 12)}`,
      expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      status: 'PENDING',
      invitedBy: actor.id,
      createdAt: new Date().toISOString(),
    };
    this.store.organizations.update((arr) => [...arr, org]);
    this.store.invitations.update((arr) => [...arr, invitation]);
    this.store.logAction({
      userId: actor.id,
      userName: `${actor.firstName} ${actor.lastName}`,
      action: 'CREATE',
      entity: 'Organization',
      entityId: org.id,
      details: `Created org "${org.name}" and invited admin ${payload.adminEmail}`,
    });
    // eslint-disable-next-line no-console
    console.info(
      `[mock email] Invitation link: /accept-invite/${invitation.token}`,
    );
    return of({ organization: org, invitation }).pipe(delay(250));
  }

  /** Org Admin invites a user to their org. */
  inviteUser(payload: { email: string; role: Role }): Observable<Invitation> {
    const actor = this.auth.user()!;
    if (!actor.orgId) {
      return throwError(() => new Error('No organization context'));
    }
    const invitation: Invitation = {
      id: this.store.uid('inv'),
      email: payload.email,
      orgId: actor.orgId,
      role: payload.role,
      token: `tk-${Math.random().toString(36).slice(2, 12)}`,
      expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      status: 'PENDING',
      invitedBy: actor.id,
      createdAt: new Date().toISOString(),
    };
    this.store.invitations.update((arr) => [...arr, invitation]);
    this.store.logAction({
      userId: actor.id,
      userName: `${actor.firstName} ${actor.lastName}`,
      action: 'CREATE',
      entity: 'Invitation',
      entityId: invitation.id,
      details: `Invited ${payload.email} as ${payload.role}`,
    });
    // eslint-disable-next-line no-console
    console.info(
      `[mock email] Invitation link: /accept-invite/${invitation.token}`,
    );
    return of(invitation).pipe(delay(200));
  }

  /** Look up an invitation by token (used by the register-via-token page). */
  byToken(token: string): Observable<Invitation | undefined> {
    return of(
      this.store.invitations().find((i) => i.token === token),
    ).pipe(delay(120));
  }

  accept(
    token: string,
    payload: { firstName: string; lastName: string; password: string },
  ): Observable<User> {
    const invite = this.store.invitations().find((i) => i.token === token);
    if (!invite) return throwError(() => new Error('Invitation not found'));
    if (invite.status !== 'PENDING') {
      return throwError(() => new Error('Invitation already used or expired'));
    }
    const user: User = {
      id: this.store.uid('user'),
      email: invite.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: invite.role,
      orgId: invite.orgId,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.store.users.update((arr) => [...arr, user]);
    this.store.invitations.update((arr) =>
      arr.map((i) => (i.id === invite.id ? { ...i, status: 'ACCEPTED' } : i)),
    );
    this.store.logAction({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      details: `Accepted invitation and joined org`,
    });
    return of(user).pipe(delay(250));
  }

  revoke(invitationId: string): Observable<void> {
    this.store.invitations.update((arr) =>
      arr.map((i) =>
        i.id === invitationId ? { ...i, status: 'EXPIRED' } : i,
      ),
    );
    return of(undefined).pipe(delay(100));
  }
}
