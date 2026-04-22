import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-wrapper">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>verified</mat-icon>
            QMS ISO 9001
          </mat-card-title>
          <mat-card-subtitle>Sign in to continue</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" required />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Password</mat-label>
              <input
                matInput
                formControlName="password"
                type="password"
                required />
            </mat-form-field>
            <div class="error" *ngIf="error()">{{ error() }}</div>
            <button
              mat-flat-button
              color="primary"
              class="full"
              type="submit"
              [disabled]="form.invalid || loading()">
              <mat-progress-spinner
                *ngIf="loading()"
                diameter="18"
                mode="indeterminate" />
              <span *ngIf="!loading()">Sign in</span>
            </button>
          </form>
          <p class="hint">
            Default super admin: <code>admin&#64;qms.local</code> /
            <code>admin123</code>
          </p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .login-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
        padding: 16px;
      }
      .login-card {
        width: 100%;
        max-width: 420px;
        padding: 8px;
      }
      mat-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .full {
        width: 100%;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
      }
      .error {
        color: #b91c1c;
        margin: 4px 0 8px;
        font-size: 13px;
      }
      .hint {
        margin-top: 16px;
        font-size: 12px;
        color: #64748b;
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (res) => {
        this.loading.set(false);
        const landing =
          res.user.role === 'super_admin' ? '/organizations' : '/dashboard';
        void this.router.navigate([landing]);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err?.error?.message || 'Invalid credentials. Please try again.',
        );
      },
    });
  }
}
