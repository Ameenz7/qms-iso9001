import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { PublicShareView } from '../../core/models';

@Component({
  selector: 'app-shared-document',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="page">
      <header class="top">
        <div class="brand">QMS — Shared document</div>
        <div class="muted">Read-only public view</div>
      </header>

      <div *ngIf="loading()" class="state">Loading…</div>
      <div *ngIf="error() as err" class="state error">
        <h2>This link can't be opened</h2>
        <p>{{ err }}</p>
      </div>

      <article *ngIf="data() as v" class="card">
        <div class="meta-row">
          <span class="chip">{{ v.document.status }}</span>
          <span class="muted"
            >From {{ v.organization.name }} • v{{ v.document.version }}</span
          >
          <span class="muted"
            >Expires {{ v.share.expiresAt | date: 'medium' }}</span
          >
        </div>
        <h1>
          <span class="code">{{ v.document.code }}</span>
          {{ v.document.title }}
        </h1>

        <section class="content" [innerHTML]="v.document.content"></section>

        <section class="attachments">
          <h3>Attachments ({{ v.attachments.length }})</h3>
          <p *ngIf="!v.attachments.length" class="muted">None.</p>
          <ul>
            <li *ngFor="let a of v.attachments">
              <div class="att-info">
                <div class="filename">{{ a.filename }}</div>
                <div class="sub muted">
                  {{ formatSize(a.size) }} · v{{ a.documentVersion }} · SHA-256
                  {{ a.sha256.slice(0, 12) }}…
                </div>
              </div>
              <a
                mat-stroked-button
                [href]="downloadUrl(a.id)"
                target="_blank"
                rel="noopener">
                <mat-icon>download</mat-icon> Download
              </a>
            </li>
          </ul>
        </section>

        <footer class="foot muted">
          Anyone with this link can view this document. If you received it in
          error, please notify the sender.
        </footer>
      </article>
    </div>
  `,
  styles: [
    `
      .page {
        max-width: 820px;
        margin: 0 auto;
        padding: 24px 20px 48px;
      }
      .top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      .brand {
        font-weight: 600;
      }
      .muted {
        color: var(--notion-text-muted, #6b7280);
        font-size: 13px;
      }
      .state {
        padding: 48px 0;
        text-align: center;
        color: var(--notion-text-muted, #6b7280);
      }
      .state.error {
        color: #b91c1c;
      }
      .card {
        background: #fff;
        border: 1px solid var(--notion-border, #e5e7eb);
        border-radius: 8px;
        padding: 28px 32px;
      }
      .meta-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }
      .chip {
        padding: 2px 10px;
        border-radius: 999px;
        font-size: 12px;
        text-transform: uppercase;
        background: #eef2ff;
        color: #3730a3;
      }
      h1 {
        margin: 0 0 20px;
        font-size: 24px;
      }
      h1 .code {
        color: var(--notion-text-muted, #6b7280);
        margin-right: 8px;
        font-weight: 500;
      }
      .content {
        line-height: 1.6;
        font-size: 15px;
      }
      .content :first-child {
        margin-top: 0;
      }
      .attachments {
        margin-top: 28px;
        padding-top: 20px;
        border-top: 1px solid var(--notion-border, #e5e7eb);
      }
      .attachments h3 {
        margin: 0 0 10px;
      }
      .attachments ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .attachments li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid var(--notion-border, #e5e7eb);
      }
      .filename {
        font-weight: 500;
      }
      .sub {
        font-family: ui-monospace, monospace;
      }
      .foot {
        margin-top: 28px;
        padding-top: 16px;
        border-top: 1px solid var(--notion-border, #e5e7eb);
        font-size: 12px;
      }
    `,
  ],
})
export class SharedDocumentComponent {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  loading = signal(true);
  error = signal<string | null>(null);
  data = signal<PublicShareView | null>(null);
  token = computed(() => this.route.snapshot.paramMap.get('token') ?? '');

  constructor() {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.error.set('Missing share token.');
      return;
    }
    this.api.getPublicShare(token).subscribe({
      next: (v) => {
        this.data.set(v);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(
          e?.error?.message ||
            'This share link is invalid, revoked, or expired.',
        );
        this.loading.set(false);
      },
    });
  }

  downloadUrl(attachmentId: string): string {
    return this.api.publicDownloadUrl(this.token(), attachmentId);
  }

  formatSize(size: string): string {
    const n = Number(size);
    if (!Number.isFinite(n)) return size;
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }
}
