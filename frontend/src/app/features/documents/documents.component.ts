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
    <h2 mat-dialog-title>{{ data.doc.title }}</h2>
    <mat-dialog-content>
      <div class="meta-row">
        <span class="chip-{{ data.doc.status.toLowerCase() }}">{{ data.doc.status }}</span>
        <span class="dim">Type: {{ data.doc.type }}</span>
        <span class="dim">
          Previewing: v{{ previewVersion().versionNumber }} ·
          {{ previewVersion().fileName }}
        </span>
      </div>

      <div class="preview-frame" [ngSwitch]="previewKind()">
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
          <button mat-stroked-button class="ml-auto" (click)="download(previewVersion())">
            <mat-icon>download</mat-icon> Download to inspect
          </button>
        </div>
      </div>

      <h3>Metadata</h3>
      <table class="meta">
        <tr *ngFor="let m of data.doc.metadata">
          <td>{{ m.key }}</td>
          <td>{{ m.value }}</td>
        </tr>
        <tr *ngIf="data.doc.metadata.length === 0">
          <td colspan="2" class="dim">No metadata</td>
        </tr>
      </table>

      <h3>Versions</h3>
      <table mat-table [dataSource]="data.doc.versions" class="full-width">
        <ng-container matColumnDef="ver">
          <th mat-header-cell *matHeaderCellDef>Version</th>
          <td mat-cell *matCellDef="let v">
            v{{ v.versionNumber }}
            <span *ngIf="v.id === data.doc.currentVersionId" class="badge current">current</span>
            <span
              *ngIf="v.id !== data.doc.currentVersionId"
              class="badge obsolete"
            >obsolete</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="file">
          <th mat-header-cell *matHeaderCellDef>File</th>
          <td mat-cell *matCellDef="let v">{{ v.fileName }}</td>
        </ng-container>
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Uploaded</th>
          <td mat-cell *matCellDef="let v">{{ v.createdAt | date: 'mediumDate' }}</td>
        </ng-container>
        <ng-container matColumnDef="size">
          <th mat-header-cell *matHeaderCellDef>Size</th>
          <td mat-cell *matCellDef="let v">{{ (v.fileSize / 1024) | number: '1.0-1' }} KB</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef class="actions-col">Actions</th>
          <td mat-cell *matCellDef="let v" class="actions-col">
            <button
              mat-icon-button
              matTooltip="Preview this version"
              (click)="preview(v)"
            >
              <mat-icon>visibility</mat-icon>
            </button>
            <button
              mat-icon-button
              matTooltip="Download this version"
              (click)="download(v)"
            >
              <mat-icon>download</mat-icon>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="['ver','file','date','size','actions']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['ver','file','date','size','actions']"></tr>
      </table>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="download(previewVersion())">
        <mat-icon>download</mat-icon> Download current
      </button>
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .meta-row {
        display: flex;
        gap: 12px;
        align-items: center;
        margin-bottom: 16px;
      }
      .dim { color: #6b7280; font-size: 13px; }
      .preview-frame {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: #f9fafb;
        margin-bottom: 16px;
        height: 360px;
        display: flex;
        align-items: stretch;
        justify-content: center;
      }
      .preview-frame iframe {
        border: 0;
        width: 100%;
        height: 100%;
      }
      .preview-frame img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        margin: auto;
      }
      .preview-frame pre {
        margin: 0;
        padding: 16px;
        overflow: auto;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 12px;
        white-space: pre-wrap;
        background: #ffffff;
        width: 100%;
      }
      .no-preview {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        width: 100%;
        mat-icon { color: #6366f1; font-size: 36px; height: 36px; width: 36px; }
      }
      .ml-auto { margin-left: auto; }
      table.meta {
        width: 100%;
        margin-bottom: 16px;
        td { padding: 4px 8px; }
        td:first-child { color: #6b7280; width: 40%; }
      }
      h3 { font-size: 14px; margin: 16px 0 8px; }
      .badge {
        display: inline-block;
        margin-left: 8px;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .badge.current {
        background: #dbeafe;
        color: #1d4ed8;
      }
      .badge.obsolete {
        background: #f3f4f6;
        color: #6b7280;
      }
      .actions-col { width: 120px; text-align: right; }
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
      width: '720px',
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
