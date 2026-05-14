import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { InvitationsService } from '../../core/invitations.service';
import { Invitation, ROLE_LABELS } from '../../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <div class="auth-bg">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Create your account</mat-card-title>
          <mat-card-subtitle *ngIf="invite() as inv">
            Invited as <strong>{{ roleLabels[inv.role] }}</strong>
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content *ngIf="invite() as inv; else missing">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput [value]="inv.email" disabled />
            </mat-form-field>
            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>First name</mat-label>
                <input matInput formControlName="firstName" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Last name</mat-label>
                <input matInput formControlName="lastName" />
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" />
            </mat-form-field>
            <p *ngIf="error()" class="error">{{ error() }}</p>
            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width"
              [disabled]="loading()"
            >
              {{ loading() ? 'Creating account…' : 'Create account' }}
            </button>
          </form>
        </mat-card-content>
        <ng-template #missing>
          <mat-card-content>
            <p class="error">This invitation is invalid or has already been used.</p>
            <a mat-button routerLink="/login">Back to sign in</a>
          </mat-card-content>
        </ng-template>
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
      .auth-card { width: 100%; max-width: 480px; padding: 8px 12px; }
      .full-width { width: 100%; }
      .row { display: flex; gap: 12px; mat-form-field { flex: 1; } }
      .error { color: #b91c1c; margin: 4px 0 12px; }
    `,
  ],
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invitations = inject(InvitationsService);
  private auth = inject(AuthService);

  invite = signal<Invitation | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  readonly roleLabels = ROLE_LABELS;

  form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) return;
    this.invitations.byToken(token).subscribe((inv) => {
      this.invite.set(inv ?? null);
    });
  }

  onSubmit(): void {
    const inv = this.invite();
    if (this.form.invalid || !inv) return;
    this.loading.set(true);
    this.error.set(null);
    this.invitations
      .accept(inv.token, this.form.getRawValue())
      .subscribe({
        next: (user) => {
          this.auth.user.set(user);
          localStorage.setItem('qms.auth.user', JSON.stringify(user));
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
