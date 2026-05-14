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
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-forgot-password',
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
          <mat-card-title>Forgot password</mat-card-title>
          <mat-card-subtitle>
            Enter your email and we'll send a reset link
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
            </mat-form-field>
            <p *ngIf="message()" class="success">{{ message() }}</p>
            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width"
              [disabled]="loading()"
            >
              {{ loading() ? 'Sending…' : 'Send reset link' }}
            </button>
          </form>
          <div class="links">
            <a routerLink="/login">Back to sign in</a>
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
      .full-width { width: 100%; }
      .success { color: #065f46; margin: 4px 0 12px; }
      .links { margin-top: 16px; text-align: center; }
      .links a { color: #4f46e5; text-decoration: none; }
    `,
  ],
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  loading = signal(false);
  message = signal<string | null>(null);

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.forgotPassword(this.form.value.email!).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.message.set(res.message);
      },
    });
  }
}
