import { CommonModule } from '@angular/common';
import { Component, Inject, Component as NgComponent, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/api.service';
import { Organization, OrganizationStatus, Payment, Role } from '../../core/models';
import {
  InviteDialogComponent,
  InviteLinkDialogComponent,
} from '../users/invite-dialog.component';

@NgComponent({
  selector: 'app-org-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.org ? 'Edit Organization' : 'New Organization' }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Plan</mat-label>
            <input matInput formControlName="plan" placeholder="Starter" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Monthly Price</mat-label>
            <input
              matInput
              formControlName="monthlyPrice"
              type="number"
              min="0"
              step="0.01" />
          </mat-form-field>
        </div>
        <ng-container *ngIf="!data.org">
          <h4>Admin Owner</h4>
          <mat-form-field appearance="outline">
            <mat-label>Owner Email</mat-label>
            <input matInput formControlName="ownerEmail" type="email" required />
          </mat-form-field>
          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="ownerFirstName" required />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="ownerLastName" required />
            </mat-form-field>
          </div>
          <mat-form-field appearance="outline">
            <mat-label>Owner Password</mat-label>
            <input
              matInput
              formControlName="ownerPassword"
              type="password"
              required />
          </mat-form-field>
        </ng-container>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid"
        (click)="save()">
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form {
        display: flex;
        flex-direction: column;
        min-width: 460px;
      }
      .row {
        display: flex;
        gap: 12px;
      }
      .row mat-form-field {
        flex: 1;
      }
      h4 {
        margin: 8px 0;
      }
    `,
  ],
})
export class OrgDialogComponent {
  private fb = inject(FormBuilder);
  form;

  constructor(
    public dialogRef: MatDialogRef<OrgDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { org?: Organization },
  ) {
    const editing = !!data.org;
    this.form = this.fb.nonNullable.group({
      name: [data.org?.name ?? '', [Validators.required]],
      description: [data.org?.description ?? ''],
      plan: [data.org?.plan ?? 'Starter'],
      monthlyPrice: [data.org?.monthlyPrice ?? '0'],
      ownerEmail: [
        '',
        editing ? [] : [Validators.required, Validators.email],
      ],
      ownerFirstName: ['', editing ? [] : [Validators.required]],
      ownerLastName: ['', editing ? [] : [Validators.required]],
      ownerPassword: ['', editing ? [] : [Validators.minLength(6)]],
    });
  }

  save() {
    const v = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      name: v.name,
      description: v.description || undefined,
      plan: v.plan || undefined,
      monthlyPrice: String(v.monthlyPrice ?? '0'),
    };
    if (!this.data.org) {
      payload['ownerEmail'] = v.ownerEmail;
      payload['ownerFirstName'] = v.ownerFirstName;
      payload['ownerLastName'] = v.ownerLastName;
      payload['ownerPassword'] = v.ownerPassword;
    }
    this.dialogRef.close(payload);
  }
}

@NgComponent({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
  ],
  template: `
    <h2 mat-dialog-title>Record cash payment — {{ data.org.name }}</h2>
    <mat-dialog-content>
      <div class="meta">
        <div><strong>Plan:</strong> {{ data.org.plan }}</div>
        <div>
          <strong>Monthly price:</strong>
          {{ data.org.monthlyPrice | number: '1.2-2' }}
        </div>
        <div>
          <strong>Paid until:</strong>
          {{ data.org.paidUntil ? (data.org.paidUntil | date: 'mediumDate') : '—' }}
        </div>
      </div>
      <form [formGroup]="form" class="form">
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Amount received</mat-label>
            <input
              matInput
              formControlName="amount"
              type="number"
              min="0"
              step="0.01"
              required />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Months covered</mat-label>
            <input
              matInput
              formControlName="monthsCovered"
              type="number"
              min="1"
              max="60"
              required />
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Note (optional)</mat-label>
          <input matInput formControlName="note" />
        </mat-form-field>
      </form>

      <h4>Payment history</h4>
      <table mat-table [dataSource]="data.payments" class="full-width" *ngIf="data.payments.length">
        <ng-container matColumnDef="paidAt">
          <th mat-header-cell *matHeaderCellDef>Paid at</th>
          <td mat-cell *matCellDef="let p">{{ p.paidAt | date: 'medium' }}</td>
        </ng-container>
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef>Amount</th>
          <td mat-cell *matCellDef="let p">{{ p.amount | number: '1.2-2' }}</td>
        </ng-container>
        <ng-container matColumnDef="monthsCovered">
          <th mat-header-cell *matHeaderCellDef>Months</th>
          <td mat-cell *matCellDef="let p">{{ p.monthsCovered }}</td>
        </ng-container>
        <ng-container matColumnDef="coversUntil">
          <th mat-header-cell *matHeaderCellDef>Covers until</th>
          <td mat-cell *matCellDef="let p">
            {{ p.coversUntil | date: 'mediumDate' }}
          </td>
        </ng-container>
        <ng-container matColumnDef="note">
          <th mat-header-cell *matHeaderCellDef>Note</th>
          <td mat-cell *matCellDef="let p">{{ p.note || '—' }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols"></tr>
      </table>
      <p class="empty" *ngIf="!data.payments.length">No payments recorded.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid"
        (click)="save()">
        Record payment
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form {
        display: flex;
        flex-direction: column;
        min-width: 520px;
        margin-top: 12px;
      }
      .row {
        display: flex;
        gap: 12px;
      }
      .row mat-form-field {
        flex: 1;
      }
      .meta {
        display: flex;
        gap: 24px;
        margin-bottom: 8px;
        color: var(--notion-text-muted, #64748b);
        font-size: 13px;
      }
      h4 {
        margin: 16px 0 8px;
      }
      .empty {
        color: #64748b;
      }
      .full-width {
        width: 100%;
      }
    `,
  ],
})
export class PaymentDialogComponent {
  private fb = inject(FormBuilder);
  cols = ['paidAt', 'amount', 'monthsCovered', 'coversUntil', 'note'];

  form = this.fb.nonNullable.group({
    amount: ['', [Validators.required]],
    monthsCovered: [1, [Validators.required, Validators.min(1)]],
    note: [''],
  });

  constructor(
    public dialogRef: MatDialogRef<PaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { org: Organization; payments: Payment[] },
  ) {
    this.form.patchValue({
      amount: data.org.monthlyPrice ?? '0',
    });
  }

  save() {
    const v = this.form.getRawValue();
    this.dialogRef.close({
      amount: String(v.amount),
      monthsCovered: Number(v.monthsCovered),
      note: v.note || undefined,
    });
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
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  template: `
    <div class="header">
      <h1>Organizations</h1>
      <button mat-flat-button color="primary" (click)="openNew()">
        <mat-icon>add</mat-icon> New Organization
      </button>
    </div>

    <mat-card>
      <table mat-table [dataSource]="orgs()" class="full-width">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let o">
            <div class="name">{{ o.name }}</div>
            <div class="desc" *ngIf="o.description">{{ o.description }}</div>
          </td>
        </ng-container>
        <ng-container matColumnDef="plan">
          <th mat-header-cell *matHeaderCellDef>Plan</th>
          <td mat-cell *matCellDef="let o">
            <div>{{ o.plan }}</div>
            <div class="desc">{{ o.monthlyPrice | number: '1.2-2' }}/mo</div>
          </td>
        </ng-container>
        <ng-container matColumnDef="paidUntil">
          <th mat-header-cell *matHeaderCellDef>Paid until</th>
          <td mat-cell *matCellDef="let o">
            {{ o.paidUntil ? (o.paidUntil | date: 'mediumDate') : '—' }}
          </td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let o">
            <span
              class="status-chip"
              [class.active]="o.status === 'active'"
              [class.grace]="o.status === 'grace'"
              [class.suspended]="o.status === 'suspended'"
              [matTooltip]="o.suspensionReason || ''">
              {{ statusLabel(o.status) }}
            </span>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let o" class="right">
            <button
              mat-stroked-button
              color="primary"
              (click)="openPayment(o)">
              <mat-icon>payments</mat-icon> Record payment
            </button>
            <button mat-icon-button [matMenuTriggerFor]="menu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="openEdit(o)">
                <mat-icon>edit</mat-icon>
                <span>Edit</span>
              </button>
              <button mat-menu-item (click)="inviteOwner(o)">
                <mat-icon>mail</mat-icon>
                <span>Invite admin owner</span>
              </button>
              <button
                mat-menu-item
                *ngIf="o.status !== 'suspended'"
                (click)="suspend(o)">
                <mat-icon>block</mat-icon>
                <span>Suspend</span>
              </button>
              <button
                mat-menu-item
                *ngIf="o.status === 'suspended'"
                (click)="unsuspend(o)">
                <mat-icon>lock_open</mat-icon>
                <span>Unsuspend</span>
              </button>
              <button mat-menu-item (click)="remove(o)">
                <mat-icon color="warn">delete</mat-icon>
                <span>Delete</span>
              </button>
            </mat-menu>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols"></tr>
      </table>
      <p class="empty" *ngIf="!orgs().length">No organizations yet.</p>
    </mat-card>
  `,
  styles: [
    `
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      h1 {
        margin: 0;
      }
      .right {
        text-align: right;
        white-space: nowrap;
      }
      .empty {
        padding: 16px;
        color: #64748b;
      }
      .name {
        font-weight: 500;
      }
      .desc {
        font-size: 12px;
        color: #64748b;
      }
      .status-chip {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 500;
        background: #eef2ff;
        color: #3730a3;
      }
      .status-chip.active {
        background: #dcfce7;
        color: #166534;
      }
      .status-chip.grace {
        background: #fef3c7;
        color: #92400e;
      }
      .status-chip.suspended {
        background: #fee2e2;
        color: #991b1b;
      }
      .full-width {
        width: 100%;
      }
    `,
  ],
})
export class OrganizationsComponent {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  orgs = signal<Organization[]>([]);
  cols = ['name', 'plan', 'paidUntil', 'status', 'actions'];

  constructor() {
    this.refresh();
  }

  statusLabel(s: OrganizationStatus | string): string {
    switch (s) {
      case OrganizationStatus.ACTIVE:
        return 'Active';
      case OrganizationStatus.GRACE:
        return 'Grace';
      case OrganizationStatus.SUSPENDED:
        return 'Suspended';
      default:
        return s;
    }
  }

  refresh() {
    this.api.listOrganizations().subscribe((orgs) => this.orgs.set(orgs));
  }

  openNew() {
    const ref = this.dialog.open(OrgDialogComponent, {
      data: {},
      width: '540px',
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.api.createOrganization(payload).subscribe({
        next: () => {
          this.snack.open('Organization created', 'OK', { duration: 2500 });
          this.refresh();
        },
        error: (e) =>
          this.snack.open(e?.error?.message || 'Error', 'Close', {
            duration: 4000,
          }),
      });
    });
  }

  openEdit(org: Organization) {
    const ref = this.dialog.open(OrgDialogComponent, {
      data: { org },
      width: '540px',
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.api
        .updateOrganization(org.id, {
          name: payload['name'],
          description: payload['description'],
          plan: payload['plan'],
          monthlyPrice: payload['monthlyPrice'],
        })
        .subscribe({
          next: () => {
            this.snack.open('Organization updated', 'OK', { duration: 2500 });
            this.refresh();
          },
        });
    });
  }

  openPayment(org: Organization) {
    this.api.listPayments(org.id).subscribe((payments) => {
      const ref = this.dialog.open(PaymentDialogComponent, {
        data: { org, payments },
        width: '640px',
      });
      ref.afterClosed().subscribe((payload) => {
        if (!payload) return;
        this.api.recordPayment(org.id, payload).subscribe({
          next: () => {
            this.snack.open('Payment recorded', 'OK', { duration: 2500 });
            this.refresh();
          },
          error: (e) =>
            this.snack.open(e?.error?.message || 'Error', 'Close', {
              duration: 4000,
            }),
        });
      });
    });
  }

  suspend(org: Organization) {
    const reason = prompt(`Suspend "${org.name}" — reason?`);
    if (reason === null) return;
    this.api.suspendOrganization(org.id, reason || undefined).subscribe(() => {
      this.snack.open('Organization suspended', 'OK', { duration: 2500 });
      this.refresh();
    });
  }

  unsuspend(org: Organization) {
    if (!confirm(`Unsuspend "${org.name}"?`)) return;
    this.api.unsuspendOrganization(org.id).subscribe(() => {
      this.snack.open('Organization unsuspended', 'OK', { duration: 2500 });
      this.refresh();
    });
  }

  inviteOwner(org: Organization) {
    const ref = this.dialog.open(InviteDialogComponent, {
      data: {
        actorRole: Role.SUPER_ADMIN,
        presetRole: Role.ADMIN_OWNER,
        presetOrganizationId: org.id,
        title: `Invite admin owner — ${org.name}`,
        subtitle:
          "They'll receive an email with a secure link to set their name and password. The link expires in 7 days and can only be used once.",
      },
      width: '520px',
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.api.createInvite(payload).subscribe({
        next: (res) => {
          this.snack.open('Invitation sent', 'OK', { duration: 2500 });
          this.dialog.open(InviteLinkDialogComponent, {
            data: {
              email: res.invite.email,
              url: res.acceptUrl,
              expiresAt: res.invite.expiresAt,
            },
            width: '560px',
          });
        },
        error: (e) =>
          this.snack.open(
            e?.error?.message?.[0] || e?.error?.message || 'Error',
            'Close',
            { duration: 4000 },
          ),
      });
    });
  }

  remove(org: Organization) {
    if (
      !confirm(
        `Delete organization "${org.name}"? (Soft delete — data is kept but hidden.)`,
      )
    )
      return;
    this.api.deleteOrganization(org.id).subscribe(() => {
      this.snack.open('Organization deleted', 'OK', { duration: 2500 });
      this.refresh();
    });
  }
}
