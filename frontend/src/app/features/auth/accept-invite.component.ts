import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { InviteVerifyResponse, ROLE_LABELS } from '../../core/models';

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    RouterLink,
  ],
  template: `
    <div class="wrap">
      <mat-card class="card">
        <div class="spin" *ngIf="loading()">
          <mat-spinner diameter="32"></mat-spinner>
        </div>

        <ng-container *ngIf="!loading() && error()">
          <mat-icon color="warn">error_outline</mat-icon>
          <h1>Can't use this invitation</h1>
          <p class="msg">{{ error() }}</p>
          <a mat-stroked-button routerLink="/login">Go to login</a>
        </ng-container>

        <ng-container *ngIf="!loading() && invite() && !accepted()">
          <h1>Welcome to {{ invite()!.organizationName || 'the QMS' }}</h1>
          <p class="msg">
            You've been invited to join as
            <strong>{{ roleLabel(invite()!.role) }}</strong> with email
            <strong>{{ invite()!.email }}</strong>. Set your name and password
            to activate your account.
          </p>
          <form [formGroup]="form" (ngSubmit)="submit()" class="form">
            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" />
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input
                matInput
                formControlName="password"
                type="password" />
              <mat-error *ngIf="form.controls.password.hasError('minlength')">
                Minimum 6 characters
              </mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Confirm Password</mat-label>
              <input
                matInput
                formControlName="confirm"
                type="password" />
              <mat-error *ngIf="form.hasError('mismatch')">
                Passwords don't match
              </mat-error>
            </mat-form-field>
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="form.invalid || submitting()">
              Activate account
            </button>
          </form>
        </ng-container>

        <ng-container *ngIf="accepted()">
          <mat-icon color="primary">check_circle</mat-icon>
          <h1>Account activated</h1>
          <p class="msg">You can now sign in with your new password.</p>
          <a mat-flat-button color="primary" routerLink="/login">
            Go to login
          </a>
        </ng-container>
      </mat-card>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #f8fafc;
      }
      .wrap {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 64px 16px;
      }
      .card {
        max-width: 520px;
        width: 100%;
        padding: 32px;
      }
      .spin {
        display: flex;
        justify-content: center;
        padding: 24px;
      }
      h1 {
        margin: 12px 0 8px;
        font-size: 22px;
      }
      .msg {
        color: #475569;
        margin: 0 0 24px;
      }
      .form {
        display: flex;
        flex-direction: column;
      }
      .row {
        display: flex;
        gap: 12px;
      }
      .row mat-form-field {
        flex: 1;
      }
      mat-icon {
        font-size: 40px;
        height: 40px;
        width: 40px;
      }
    `,
  ],
})
export class AcceptInviteComponent {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);
  invite = signal<InviteVerifyResponse | null>(null);
  submitting = signal(false);
  accepted = signal(false);

  token = '';
  form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', [Validators.required]],
    },
    {
      validators: (group) => {
        const pw = group.get('password')?.value;
        const cf = group.get('confirm')?.value;
        return pw && cf && pw !== cf ? { mismatch: true } : null;
      },
    },
  );

  roleLabel = (r: string) =>
    ROLE_LABELS[r as keyof typeof ROLE_LABELS] ?? r;

  constructor() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.error.set('Missing invitation token.');
      this.loading.set(false);
      return;
    }
    this.api.verifyInvite(this.token).subscribe({
      next: (res) => {
        this.invite.set(res);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(
          e?.error?.message || 'This invitation is invalid or expired.',
        );
        this.loading.set(false);
      },
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.submitting.set(true);
    const v = this.form.getRawValue();
    this.api
      .acceptInvite({
        token: this.token,
        firstName: v.firstName,
        lastName: v.lastName,
        password: v.password,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.accepted.set(true);
        },
        error: (e) => {
          this.submitting.set(false);
          this.error.set(
            e?.error?.message?.[0] ||
              e?.error?.message ||
              'Could not activate account.',
          );
        },
      });
    void this.router;
  }
}
