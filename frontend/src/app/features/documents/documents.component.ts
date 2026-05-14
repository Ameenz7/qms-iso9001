import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
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
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../core/auth.service';
import { DocumentsService } from '../../core/documents.service';
import { DocumentStatus, DocumentVersion, QmsDocument } from '../../core/models';

@Component({
  selector: 'app-doc-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Upload document</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Title</mat-label>
        <input matInput [(ngModel)]="title" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Type</mat-label>
        <mat-select [(ngModel)]="type">
          <mat-option value="POLICY">Policy</mat-option>
          <mat-option value="MANUAL">Manual</mat-option>
          <mat-option value="PROCEDURE">Procedure</mat-option>
          <mat-option value="WORK_INSTRUCTION">Work instruction</mat-option>
          <mat-option value="RECORD">Record</mat-option>
        </mat-select>
      </mat-form-field>
      <div class="dropzone" (click)="fileInput.click()">
        <mat-icon>cloud_upload</mat-icon>
        <div *ngIf="!file">Click to select a file</div>
        <div *ngIf="file"><strong>{{ file.name }}</strong> ({{ (file.size / 1024) | number: '1.0-1' }} KB)</div>
        <input #fileInput hidden type="file" (change)="onFile($event)" />
      </div>
      <p class="hint">
        In mock mode the file is held in memory via a blob URL — preview &amp;
        download work for the rest of this session.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!title || !file" (click)="submit()">
        Upload
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width { width: 100%; }
      .dropzone {
        border: 2px dashed #d1d5db;
        padding: 24px;
        border-radius: 8px;
        text-align: center;
        cursor: pointer;
        color: #4b5563;
        margin-top: 8px;

        mat-icon { font-size: 36px; height: 36px; width: 36px; color: #6366f1; }
      }
      .dropzone:hover { background: #f9fafb; }
      .hint { color: #6b7280; font-size: 12px; margin-top: 8px; }
    `,
  ],
})
export class DocUploadDialogComponent {
  ref = inject(MatDialogRef<DocUploadDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as { doc?: QmsDocument } | null;

  title = this.data?.doc?.title ?? '';
  type = this.data?.doc?.type ?? 'PROCEDURE';
  file: File | null = null;

  onFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.file = input.files?.[0] ?? null;
  }

  submit(): void {
    if (!this.file) return;
    this.ref.close({
      title: this.title,
      type: this.type,
      file: this.file,
    });
  }
}

@Component({
  selector: 'app-doc-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <div class="viewer-shell">
      <header class="viewer-topbar">
        <button
          mat-icon-button
          mat-dialog-close
          matTooltip="Close"
          aria-label="Close"
        >
          <mat-icon>close</mat-icon>
        </button>
        <div class="title-block">
          <div class="doc-title">{{ data.doc.title }}</div>
          <div class="doc-sub">
            {{ data.doc.type }} · v{{ previewVersion().versionNumber }} ·
            {{ previewVersion().fileName }}
          </div>
        </div>
        <span class="chip-{{ data.doc.status.toLowerCase() }} status-chip">
          {{ data.doc.status }}
        </span>
        <span class="spacer"></span>
        <button
          mat-stroked-button
          color="primary"
          (click)="download(previewVersion())"
        >
          <mat-icon>download</mat-icon> Download
        </button>
      </header>

      <div class="viewer-body">
        <aside class="viewer-sidebar left">
          <div class="sidebar-title">Versions</div>
          <div class="version-list">
            <button
              type="button"
              *ngFor="let v of orderedVersions()"
              class="version-card"
              [class.active]="v.id === previewVersion().id"
              (click)="preview(v)"
            >
              <div class="version-row">
                <span class="v-number">v{{ v.versionNumber }}</span>
                <span
                  class="badge"
                  [class.current]="v.id === data.doc.currentVersionId"
                  [class.obsolete]="v.id !== data.doc.currentVersionId"
                >
                  {{ v.id === data.doc.currentVersionId ? 'current' : 'obsolete' }}
                </span>
              </div>
              <div class="v-file" [title]="v.fileName">{{ v.fileName }}</div>
              <div class="v-meta">
                {{ v.createdAt | date: 'mediumDate' }} ·
                {{ (v.fileSize / 1024) | number: '1.0-1' }} KB
              </div>
              <div class="v-actions" (click)="$event.stopPropagation()">
                <button
                  mat-icon-button
                  matTooltip="Download this version"
                  (click)="download(v)"
                >
                  <mat-icon>download</mat-icon>
                </button>
              </div>
            </button>
          </div>
        </aside>

        <section class="viewer-stage" [ngSwitch]="previewKind()">
          <iframe
            *ngSwitchCase="'pdf'"
            [src]="previewSafeUrl()"
            title="Document preview"
          ></iframe>
          <img
            *ngSwitchCase="'image'"
            [src]="previewUrl()"
            alt="Document preview"
          />
          <pre *ngSwitchCase="'text'">{{ textPreview() }}</pre>
          <div *ngSwitchDefault class="no-preview">
            <mat-icon>insert_drive_file</mat-icon>
            <div>
              <strong>No inline preview available</strong>
              <div class="dim">
                {{ previewVersion().mimeType || 'unknown type' }} ·
                {{ (previewVersion().fileSize / 1024) | number: '1.0-1' }} KB
              </div>
            </div>
            <button
              mat-stroked-button
              color="primary"
              (click)="download(previewVersion())"
            >
              <mat-icon>download</mat-icon> Download to inspect
            </button>
          </div>
        </section>

        <aside class="viewer-sidebar right">
          <div class="sidebar-title">Details</div>
          <dl class="meta-grid">
            <dt>Type</dt><dd>{{ data.doc.type }}</dd>
            <dt>Status</dt>
            <dd>
              <span class="chip-{{ data.doc.status.toLowerCase() }}">
                {{ data.doc.status }}
              </span>
            </dd>
            <dt>Current version</dt>
            <dd>v{{ currentVersion().versionNumber }}</dd>
            <dt>Updated</dt>
            <dd>{{ data.doc.updatedAt | date: 'medium' }}</dd>
            <dt>Created</dt>
            <dd>{{ data.doc.createdAt | date: 'medium' }}</dd>
          </dl>

          <div class="sidebar-title">Viewing version</div>
          <dl class="meta-grid">
            <dt>Version</dt><dd>v{{ previewVersion().versionNumber }}</dd>
            <dt>File</dt>
            <dd class="break-all">{{ previewVersion().fileName }}</dd>
            <dt>Size</dt>
            <dd>{{ (previewVersion().fileSize / 1024) | number: '1.0-1' }} KB</dd>
            <dt>Type</dt>
            <dd>{{ previewVersion().mimeType || 'unknown' }}</dd>
            <dt>Uploaded</dt>
            <dd>{{ previewVersion().createdAt | date: 'medium' }}</dd>
          </dl>

          <div class="sidebar-title">Metadata</div>
          <dl class="meta-grid" *ngIf="data.doc.metadata.length">
            <ng-container *ngFor="let m of data.doc.metadata">
              <dt>{{ m.key }}</dt>
              <dd>{{ m.value }}</dd>
            </ng-container>
          </dl>
          <div class="empty-meta" *ngIf="!data.doc.metadata.length">
            No metadata captured for this document.
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      .viewer-shell {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #f9fafb;
      }
      .viewer-topbar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 20px;
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
      }
      .viewer-topbar .title-block { line-height: 1.2; }
      .viewer-topbar .doc-title {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
      }
      .viewer-topbar .doc-sub {
        font-size: 12px;
        color: #6b7280;
      }
      .viewer-topbar .spacer { flex: 1; }
      .viewer-topbar .status-chip { margin-left: 8px; }
      .viewer-body {
        flex: 1;
        display: grid;
        grid-template-columns: 260px 1fr 300px;
        min-height: 0;
      }
      .viewer-sidebar {
        background: #ffffff;
        overflow-y: auto;
        padding: 16px;
      }
      .viewer-sidebar.left { border-right: 1px solid #e5e7eb; }
      .viewer-sidebar.right { border-left: 1px solid #e5e7eb; }
      .sidebar-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #6b7280;
        margin: 4px 0 10px;
      }
      .version-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 8px;
      }
      .version-card {
        all: unset;
        cursor: pointer;
        display: block;
        position: relative;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 10px 12px;
        transition:
          border-color 0.15s ease,
          background 0.15s ease;
      }
      .version-card:hover { background: #f3f4f6; }
      .version-card.active {
        border-color: #6366f1;
        background: #eef2ff;
        box-shadow: 0 0 0 1px #6366f1 inset;
      }
      .version-card .version-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
      }
      .version-card .v-number {
        font-weight: 600;
        color: #111827;
      }
      .version-card .v-file {
        font-size: 12px;
        color: #374151;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
      }
      .version-card .v-meta {
        font-size: 11px;
        color: #6b7280;
        margin-top: 2px;
      }
      .version-card .v-actions {
        position: absolute;
        top: 4px;
        right: 4px;
      }
      .viewer-stage {
        display: flex;
        align-items: stretch;
        justify-content: stretch;
        min-height: 0;
        background: #1f2937;
      }
      .viewer-stage iframe {
        border: 0;
        width: 100%;
        height: 100%;
        background: #ffffff;
      }
      .viewer-stage img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        margin: auto;
      }
      .viewer-stage pre {
        margin: 0;
        padding: 24px 32px;
        width: 100%;
        background: #ffffff;
        color: #111827;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
        overflow: auto;
      }
      .no-preview {
        margin: auto;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px 32px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
        max-width: 520px;
        color: #111827;
      }
      .no-preview mat-icon {
        color: #6366f1;
        font-size: 40px;
        height: 40px;
        width: 40px;
      }
      .dim { color: #6b7280; font-size: 13px; }
      .meta-grid {
        display: grid;
        grid-template-columns: 110px 1fr;
        gap: 6px 12px;
        margin: 0 0 16px;
        font-size: 13px;
      }
      .meta-grid dt {
        color: #6b7280;
        font-size: 12px;
      }
      .meta-grid dd {
        margin: 0;
        color: #111827;
        word-break: break-word;
      }
      .break-all { word-break: break-all; }
      .empty-meta {
        font-size: 12px;
        color: #9ca3af;
        font-style: italic;
      }
      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .badge.current { background: #dbeafe; color: #1d4ed8; }
      .badge.obsolete { background: #f3f4f6; color: #6b7280; }

      @media (max-width: 1024px) {
        .viewer-body {
          grid-template-columns: 220px 1fr;
        }
        .viewer-sidebar.right { display: none; }
      }
      @media (max-width: 720px) {
        .viewer-body {
          grid-template-columns: 1fr;
        }
        .viewer-sidebar.left { display: none; }
      }
    `,
  ],
})
export class DocDetailDialogComponent {
  data = inject(MAT_DIALOG_DATA) as { doc: QmsDocument };
  private docs = inject(DocumentsService);
  private sanitizer = inject(DomSanitizer);

  previewVersion = signal<DocumentVersion>(this.initialVersion());
  previewUrl = signal<string>('');
  previewSafeUrl = signal<SafeResourceUrl | null>(null);
  previewKind = signal<'pdf' | 'image' | 'text' | 'other'>('other');
  textPreview = signal<string>('');

  constructor() {
    this.preview(this.initialVersion());
  }

  /** Newest version first so the current one is visually at the top. */
  orderedVersions(): DocumentVersion[] {
    return [...this.data.doc.versions].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  currentVersion(): DocumentVersion {
    return this.initialVersion();
  }

  private initialVersion(): DocumentVersion {
    return (
      this.data.doc.versions.find(
        (v) => v.id === this.data.doc.currentVersionId,
      ) ?? this.data.doc.versions[this.data.doc.versions.length - 1]
    );
  }

  preview(v: DocumentVersion): void {
    const url = this.docs.resolveFileUrl(v);
    this.previewVersion.set(v);
    this.previewUrl.set(url);
    this.previewSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    const mime = (v.mimeType || '').toLowerCase();
    if (mime === 'application/pdf') {
      this.previewKind.set('pdf');
      this.textPreview.set('');
    } else if (mime.startsWith('image/')) {
      this.previewKind.set('image');
      this.textPreview.set('');
    } else if (
      mime.startsWith('text/') ||
      mime === 'application/json' ||
      mime === 'application/xml' ||
      !v.fileUrl // synthesised placeholder is plain text
    ) {
      this.previewKind.set('text');
      fetch(url)
        .then((r) => r.text())
        .then((t) =>
          this.textPreview.set(t.length > 4000 ? t.slice(0, 4000) + '\n\n… (truncated)' : t),
        )
        .catch(() => this.textPreview.set('Unable to read file.'));
    } else {
      this.previewKind.set('other');
      this.textPreview.set('');
    }
  }

  download(v: DocumentVersion): void {
    this.docs.download(v);
  }
}

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Documents</h1>
          <div class="subtitle">Controlled documents with version history</div>
        </div>
        <div class="toolbar-actions">
          <button
            *ngIf="canManage()"
            mat-raised-button
            color="primary"
            (click)="openUpload()"
          >
            <mat-icon>cloud_upload</mat-icon> Upload
          </button>
        </div>
      </div>

      <mat-card>
        <table mat-table [dataSource]="docs()" class="full-width">
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Title</th>
            <td mat-cell *matCellDef="let d">
              <a href="#" (click)="openDetail(d); $event.preventDefault()">
                <strong>{{ d.title }}</strong>
              </a>
            </td>
          </ng-container>
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let d">{{ d.type }}</td>
          </ng-container>
          <ng-container matColumnDef="version">
            <th mat-header-cell *matHeaderCellDef>Version</th>
            <td mat-cell *matCellDef="let d">v{{ currentVersion(d).versionNumber }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let d">
              <span class="chip-{{ d.status.toLowerCase() }}">{{ d.status }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="updated">
            <th mat-header-cell *matHeaderCellDef>Last updated</th>
            <td mat-cell *matCellDef="let d">{{ d.updatedAt | date: 'mediumDate' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let d">
              <button mat-icon-button [matMenuTriggerFor]="m">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #m="matMenu">
                <button mat-menu-item (click)="openDetail(d)">
                  <mat-icon>visibility</mat-icon> View
                </button>
                <button
                  mat-menu-item
                  *ngIf="canManage()"
                  (click)="openUpload(d)"
                >
                  <mat-icon>cloud_upload</mat-icon> Upload new version
                </button>
                <button
                  mat-menu-item
                  *ngIf="canManage() && d.status === 'DRAFT'"
                  (click)="changeStatus(d, 'REVIEW')"
                >
                  <mat-icon>rate_review</mat-icon> Submit for review
                </button>
                <button
                  mat-menu-item
                  *ngIf="canManage() && d.status === 'REVIEW'"
                  (click)="changeStatus(d, 'APPROVED')"
                >
                  <mat-icon>check_circle</mat-icon> Approve
                </button>
                <button
                  mat-menu-item
                  *ngIf="canManage() && d.status !== 'OBSOLETE'"
                  (click)="changeStatus(d, 'OBSOLETE')"
                >
                  <mat-icon>archive</mat-icon> Mark obsolete
                </button>
              </mat-menu>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
        <div *ngIf="docs().length === 0" class="empty-state">
          <mat-icon>description</mat-icon>
          <div>No documents yet.</div>
        </div>
      </mat-card>
    </div>
  `,
})
export class DocumentsComponent implements OnInit {
  private docsService = inject(DocumentsService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  docs = signal<QmsDocument[]>([]);
  cols = ['title', 'type', 'version', 'status', 'updated', 'actions'];

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.docsService.list().subscribe((d) => this.docs.set(d));
  }

  currentVersion(d: QmsDocument) {
    return d.versions.find((v) => v.id === d.currentVersionId) ?? d.versions[0];
  }

  canManage(): boolean {
    return this.auth.hasRole(
      'SUPER_ADMIN',
      'ORG_ADMIN',
      'QUALITY_MANAGER',
      'EMPLOYEE',
    );
  }

  openUpload(doc?: QmsDocument): void {
    const ref = this.dialog.open(DocUploadDialogComponent, {
      width: '500px',
      data: { doc },
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      if (doc) {
        this.docsService.uploadVersion(doc.id, payload.file).subscribe(() => {
          this.snack.open(
            `New version uploaded for "${doc.title}"`,
            'Dismiss',
            { duration: 3000 },
          );
          this.refresh();
        });
      } else {
        this.docsService
          .create({
            title: payload.title,
            type: payload.type,
            file: payload.file,
            metadata: [],
          })
          .subscribe(() => {
            this.snack.open('Document created (v1.0)', 'Dismiss', {
              duration: 3000,
            });
            this.refresh();
          });
      }
    });
  }

  openDetail(doc: QmsDocument): void {
    this.dialog.open(DocDetailDialogComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      width: '100vw',
      height: '100vh',
      panelClass: 'doc-viewer-dialog',
      data: { doc },
    });
  }

  changeStatus(doc: QmsDocument, status: DocumentStatus): void {
    this.docsService.changeStatus(doc.id, status).subscribe(() => {
      this.snack.open(`Status set to ${status}`, 'Dismiss', { duration: 2000 });
      this.refresh();
    });
  }
}
