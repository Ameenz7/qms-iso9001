import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { InvitationsService } from '../../core/invitations.service';
import { Invitation, Organization } from '../../core/models';

@Component({
  selector: 'app-org-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Create organization</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="name" (ngModelChange)="autoSlug()" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Slug</mat-label>
        <input matInput [(ngModel)]="slug" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Org admin email</mat-label>
        <input matInput type="email" [(ngModel)]="adminEmail" />
        <mat-hint>An invitation will be sent (link logged to console in mock mode).</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!name || !slug || !adminEmail"
        (click)="ref.close({ name, slug, adminEmail })"
      >
        Create & invite
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class OrgCreateDialogComponent {
  ref = inject(MatDialogRef<OrgCreateDialogComponent>);
  name = '';
  slug = '';
  adminEmail = '';

  autoSlug(): void {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Organizations</h1>
          <div class="subtitle">Manage tenants and their owning admins</div>
        </div>
        <button mat-raised-button color="primary" (click)="openCreate()">
          <mat-icon>add</mat-icon> New organization
        </button>
      </div>

      <mat-card>
        <mat-card-header><mat-card-title>Organizations</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="orgs()" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let o"><strong>{{ o.name }}</strong></td>
            </ng-container>
            <ng-container matColumnDef="slug">
              <th mat-header-cell *matHeaderCellDef>Slug</th>
              <td mat-cell *matCellDef="let o">{{ o.slug }}</td>
            </ng-container>
            <ng-container matColumnDef="created">
              <th mat-header-cell *matHeaderCellDef>Created</th>
              <td mat-cell *matCellDef="let o">{{ o.createdAt | date: 'mediumDate' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['name','slug','created']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['name','slug','created']"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>Invitations</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="invitations()" class="full-width">
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let i">{{ i.email }}</td>
            </ng-container>
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Role</th>
              <td mat-cell *matCellDef="let i">{{ i.role }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let i">
                <span class="chip-{{ chipFor(i.status) }}">{{ i.status }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="link">
              <th mat-header-cell *matHeaderCellDef>Token</th>
              <td mat-cell *matCellDef="let i">
                <a *ngIf="i.status === 'PENDING'" [href]="'/register/' + i.token">
                  /register/{{ i.token }}
                </a>
                <span *ngIf="i.status !== 'PENDING'" class="dim">—</span>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['email','role','status','link']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['email','role','status','link']"></tr>
          </table>
          <div *ngIf="invitations().length === 0" class="empty-state">
            <mat-icon>mail</mat-icon>
            <div>No invitations sent.</div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.dim { color: #6b7280; }`],
})
export class OrganizationsComponent implements OnInit {
  private invitations_ = inject(InvitationsService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  orgs = signal<Organization[]>([]);
  invitations = signal<Invitation[]>([]);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.invitations_.listOrgs().subscribe((o) => this.orgs.set(o));
    this.invitations_.listInvitations().subscribe((i) => this.invitations.set(i));
  }

  openCreate(): void {
    const ref = this.dialog.open(OrgCreateDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.invitations_.createOrg(payload).subscribe((res) => {
        this.snack.open(
          `Created "${res.organization.name}" — invite link: /register/${res.invitation.token}`,
          'Dismiss',
          { duration: 6000 },
        );
        this.refresh();
      });
    });
  }

  chipFor(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'pending';
      case 'ACCEPTED':
        return 'approved';
      default:
        return 'obsolete';
    }
  }
}
