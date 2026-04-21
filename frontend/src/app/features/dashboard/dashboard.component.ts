import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ROLE_LABELS, Role } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, RouterLink],
  template: `
    <h1>Welcome, {{ user()?.firstName }}</h1>
    <p class="role">
      Role: <strong>{{ roleLabel }}</strong>
    </p>

    <div class="grid">
      <mat-card class="stat" *ngIf="canSeeOrgs">
        <mat-icon>business</mat-icon>
        <div>
          <div class="num">{{ stats().organizations }}</div>
          <div class="label">Organizations</div>
        </div>
      </mat-card>
      <mat-card class="stat" *ngIf="canSeeUsers">
        <mat-icon>group</mat-icon>
        <div>
          <div class="num">{{ stats().users }}</div>
          <div class="label">Users</div>
        </div>
      </mat-card>
      <mat-card class="stat" *ngIf="canSeeQms">
        <mat-icon>report_problem</mat-icon>
        <div>
          <div class="num">{{ stats().ncs }}</div>
          <div class="label">Non-Conformities</div>
        </div>
      </mat-card>
      <mat-card class="stat" *ngIf="canSeeQms">
        <mat-icon>build_circle</mat-icon>
        <div>
          <div class="num">{{ stats().capas }}</div>
          <div class="label">CAPAs</div>
        </div>
      </mat-card>
      <mat-card class="stat" *ngIf="canSeeQms">
        <mat-icon>description</mat-icon>
        <div>
          <div class="num">{{ stats().documents }}</div>
          <div class="label">Documents</div>
        </div>
      </mat-card>
    </div>

    <mat-card class="actions">
      <h3>Quick Actions</h3>
      <div class="links">
        <a *ngIf="canSeeOrgs" routerLink="/organizations">
          <mat-icon>business</mat-icon> Manage Organizations
        </a>
        <a *ngIf="canSeeUsers" routerLink="/users">
          <mat-icon>group</mat-icon> Manage Users
        </a>
        <a *ngIf="canSeeQms" routerLink="/non-conformities">
          <mat-icon>report_problem</mat-icon> Non-Conformities
        </a>
        <a *ngIf="canSeeQms" routerLink="/capas">
          <mat-icon>build_circle</mat-icon> CAPAs
        </a>
        <a *ngIf="canSeeQms" routerLink="/documents">
          <mat-icon>description</mat-icon> Documents
        </a>
      </div>
    </mat-card>
  `,
  styles: [
    `
      h1 {
        margin: 0 0 4px;
      }
      .role {
        margin: 0 0 24px;
        color: #475569;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
      }
      .stat {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px !important;
      }
      .stat mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #2563eb;
      }
      .stat .num {
        font-size: 26px;
        font-weight: 600;
      }
      .stat .label {
        font-size: 12px;
        color: #64748b;
      }
      .actions {
        margin-top: 24px;
        padding: 18px !important;
      }
      .links {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      .links a {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border: 1px solid #e2e8f0;
        border-radius: 999px;
        text-decoration: none;
        color: #1e293b;
        font-size: 14px;
        background: #f8fafc;
      }
      .links a:hover {
        background: #e0f2fe;
      }
    `,
  ],
})
export class DashboardComponent {
  private auth = inject(AuthService);
  private api = inject(ApiService);

  user = this.auth.user;

  stats = signal({
    organizations: 0,
    users: 0,
    ncs: 0,
    capas: 0,
    documents: 0,
  });

  get roleLabel(): string {
    const r = this.user()?.role;
    return r ? ROLE_LABELS[r] : '';
  }

  get canSeeOrgs(): boolean {
    return this.auth.hasRole(Role.SUPER_ADMIN);
  }
  get canSeeUsers(): boolean {
    return this.auth.hasRole(
      Role.SUPER_ADMIN,
      Role.ADMIN_OWNER,
      Role.QUALITY_MANAGER,
    );
  }
  get canSeeQms(): boolean {
    return this.auth.hasRole(
      Role.ADMIN_OWNER,
      Role.QUALITY_MANAGER,
      Role.EMPLOYEE,
    );
  }

  constructor() {
    forkJoin({
      organizations: this.canSeeOrgs
        ? this.api.listOrganizations().pipe(catchError(() => of([])))
        : of([]),
      users: this.canSeeUsers
        ? this.api.listUsers().pipe(catchError(() => of([])))
        : of([]),
      ncs: this.canSeeQms
        ? this.api.listNcs().pipe(catchError(() => of([])))
        : of([]),
      capas: this.canSeeQms
        ? this.api.listCapas().pipe(catchError(() => of([])))
        : of([]),
      documents: this.canSeeQms
        ? this.api.listDocuments().pipe(catchError(() => of([])))
        : of([]),
    }).subscribe((data) => {
      this.stats.set({
        organizations: data.organizations.length,
        users: data.users.length,
        ncs: data.ncs.length,
        capas: data.capas.length,
        documents: data.documents.length,
      });
    });
  }

  // for template reference
  readonly Role = Role;
  readonly computedUser = computed(() => this.user());
}
