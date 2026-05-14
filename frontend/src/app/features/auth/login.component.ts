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
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="auth-bg">
      <mat-card class="auth-card">
        <mat-card-header>
          <div class="brand">
            <mat-icon>verified</mat-icon>
            <span>QMS ISO 9001</span>
          </div>
          <mat-card-title>Sign in</mat-card-title>
          <mat-card-subtitle>Welcome back to your quality workspace</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="current-password" />
              <mat-hint>Demo password: <code>password</code></mat-hint>
            </mat-form-field>
            <p *ngIf="error()" class="error">{{ error() }}</p>
            <button mat-raised-button color="primary" type="submit" class="full-width" [disabled]="loading()">
              {{ loading() ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>
          <div class="links">
            <a routerLink="/forgot-password">Forgot password?</a>
          </div>
          <div class="demo">
            <strong>Try a role:</strong>
            <button mat-stroked-button *ngFor="let d of demoAccounts" (click)="fill(d.email)">
              {{ d.label }}
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .auth-bg {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        padding: 16px;
      }
      .auth-card { width: 100%; max-width: 420px; padding: 8px 12px; }
      .brand {
        display: flex;
        gap: 8px;
        align-items: center;
        font-weight: 600;
        color: #4f46e5;
        margin-bottom: 4px;
      }
      .full-width { width: 100%; }
      .error { color: #b91c1c; margin: 4px 0 12px; }
      .links { margin-top: 12px; text-align: center; }
      .links a { color: #4f46e5; text-decoration: none; }
      .demo {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 13px;

        button { margin-top: 4px; }
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['super@qms.com', [Validators.required, Validators.email]],
    password: ['password', [Validators.required]],
  });

  loading = signal(false);
  error = signal<string | null>(null);

  demoAccounts = [
    { label: 'Super Admin', email: 'super@qms.com' },
    { label: 'Org Admin', email: 'admin@demo.com' },
    { label: 'Quality Manager', email: 'qm@demo.com' },
    { label: 'Auditor', email: 'auditor@demo.com' },
    { label: 'Employee', email: 'employee@demo.com' },
  ];

  fill(email: string): void {
    this.form.patchValue({ email });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/dashboard']);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message);
      },
    });
  }
}
