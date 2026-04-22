import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Organization, ROLE_LABELS, Role } from '../../core/models';

export interface InviteDialogData {
  actorRole: Role;
  organizations?: Organization[];
  presetRole?: Role;
  presetOrganizationId?: string;
  title?: string;
  subtitle?: string;
}

@Component({
  selector: 'app-invite-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title || 'Invite User' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <p class="hint">
          {{ data.subtitle
            || "They'll receive an email with a secure link to set their own name and password. The link expires in 7 days and can only be used once." }}
        </p>
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" />
        </mat-form-field>
        <mat-form-field appearance="outline" *ngIf="!data.presetRole">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option *ngFor="let r of availableRoles" [value]="r">
              {{ roleLabel(r) }}
            </mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field
          appearance="outline"
          *ngIf="showOrgPicker && !data.presetOrganizationId">
          <mat-label>Organization</mat-label>
          <mat-select formControlName="organizationId">
            <mat-option *ngFor="let o of data.organizations || []" [value]="o.id">
              {{ o.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid"
        (click)="save()">
        Send invitation
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form {
        display: flex;
        flex-direction: column;
        min-width: 420px;
      }
      .hint {
        margin: 0 0 12px;
        color: #64748b;
        font-size: 13px;
      }
    `,
  ],
})
export class InviteDialogComponent {
  private fb = inject(FormBuilder);
  availableRoles: Role[];
  form;

  get showOrgPicker(): boolean {
    return (
      this.data.actorRole === Role.SUPER_ADMIN &&
      (this.data.organizations?.length ?? 0) > 0
    );
  }

  constructor(
    public dialogRef: MatDialogRef<InviteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InviteDialogData,
  ) {
    this.availableRoles =
      data.actorRole === Role.SUPER_ADMIN
        ? [Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE]
        : [Role.QUALITY_MANAGER, Role.EMPLOYEE];

    const defaultRole =
      data.presetRole ??
      (data.actorRole === Role.SUPER_ADMIN
        ? Role.ADMIN_OWNER
        : Role.EMPLOYEE);

    this.form = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      role: [defaultRole, [Validators.required]],
      organizationId: [data.presetOrganizationId ?? ''],
    });

    if (this.showOrgPicker && !data.presetOrganizationId) {
      this.form.controls.organizationId.addValidators([Validators.required]);
    }
  }

  roleLabel(r: Role): string {
    return ROLE_LABELS[r];
  }

  save() {
    const v = this.form.getRawValue();
    const payload: Record<string, string> = {
      email: v.email,
      role: v.role,
    };
    if (v.organizationId) payload['organizationId'] = v.organizationId;
    this.dialogRef.close(payload);
  }
}

@Component({
  selector: 'app-invite-link-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Invitation sent</h2>
    <mat-dialog-content>
      <p class="hint">
        An email with the invite link was sent to
        <strong>{{ data.email }}</strong>. You can also copy the link and send
        it manually:
      </p>
      <div class="link">
        <input #linkInput [value]="data.url" readonly />
        <button mat-stroked-button type="button" (click)="copy(linkInput)">
          <mat-icon>content_copy</mat-icon> Copy
        </button>
      </div>
      <p class="expires">Expires on {{ expiresLabel }}.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" mat-dialog-close>Done</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .hint {
        margin: 0 0 12px;
        color: #475569;
      }
      .link {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .link input {
        flex: 1;
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-size: 13px;
        padding: 10px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #f8fafc;
        min-width: 420px;
      }
      .expires {
        margin: 16px 0 0;
        color: #94a3b8;
        font-size: 13px;
      }
    `,
  ],
})
export class InviteLinkDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { email: string; url: string; expiresAt: string },
  ) {}

  get expiresLabel(): string {
    return new Date(this.data.expiresAt).toLocaleString();
  }

  copy(input: HTMLInputElement) {
    input.select();
    void navigator.clipboard.writeText(input.value);
  }
}
