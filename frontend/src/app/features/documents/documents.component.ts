import { CommonModule } from '@angular/common';
import { Component, Inject, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { QuillEditorComponent } from 'ngx-quill';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import {
  exportCsv,
  exportDocx,
  exportPdf,
} from '../../core/export.util';
import {
  DocumentStatus,
  QmsDocument,
  Role,
} from '../../core/models';

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['blockquote', 'code-block'],
    ['link'],
    [{ align: [] }],
    ['clean'],
  ],
};

@Component({
  selector: 'app-document-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    QuillEditorComponent,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.doc ? 'Edit Document' : 'New Document' }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Code</mat-label>
            <input matInput formControlName="code" required />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Title</mat-label>
            <input matInput formControlName="title" required />
          </mat-form-field>
        </div>
        <label class="editor-label">Content</label>
        <quill-editor
          formControlName="content"
          [modules]="quillModules"
          placeholder="Start writing the procedure…"></quill-editor>
        <ng-container *ngIf="data.doc">
          <mat-form-field appearance="outline">
            <mat-label>Change Note</mat-label>
            <input matInput formControlName="changeNote" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option *ngFor="let s of statuses" [value]="s">
                {{ s }}
              </mat-option>
            </mat-select>
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
        min-width: 640px;
      }
      .row {
        display: flex;
        gap: 12px;
      }
      .row mat-form-field {
        flex: 1;
      }
      .editor-label {
        font-size: 12px;
        color: var(--notion-text-muted);
        margin: 4px 0 6px;
        font-weight: 500;
      }
      quill-editor {
        display: block;
        margin-bottom: 16px;
      }
    `,
  ],
})
export class DocumentDialogComponent {
  private fb = inject(FormBuilder);
  statuses = Object.values(DocumentStatus);
  quillModules = QUILL_MODULES;
  form;

  constructor(
    public dialogRef: MatDialogRef<DocumentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { doc?: QmsDocument },
  ) {
    const d = data.doc;
    this.form = this.fb.nonNullable.group({
      code: [{ value: d?.code ?? '', disabled: !!d }, [Validators.required]],
      title: [d?.title ?? '', [Validators.required]],
      content: [d?.content ?? '', [Validators.required]],
      changeNote: [''],
      status: [d?.status ?? DocumentStatus.DRAFT],
    });
  }

  save() {
    const v = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      title: v.title,
      content: v.content,
    };
    if (!this.data.doc) {
      payload['code'] = v.code;
    } else {
      payload['changeNote'] = v.changeNote || undefined;
      payload['status'] = v.status;
    }
    this.dialogRef.close(payload);
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
    MatDialogModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatMenuModule,
  ],
  template: `
    <div class="header">
      <h1>Controlled Documents</h1>
      <div class="header-actions">
        <button mat-stroked-button [matMenuTriggerFor]="exportAll">
          <mat-icon>download</mat-icon> Export all
        </button>
        <mat-menu #exportAll="matMenu">
          <button mat-menu-item (click)="exportAllCsv()">
            <mat-icon>table_chart</mat-icon> CSV
          </button>
          <button mat-menu-item (click)="exportAllDocx()">
            <mat-icon>description</mat-icon> DOCX
          </button>
          <button mat-menu-item (click)="exportAllPdf()">
            <mat-icon>picture_as_pdf</mat-icon> PDF
          </button>
        </mat-menu>
        <button
          mat-flat-button
          color="primary"
          *ngIf="canManage"
          (click)="openNew()">
          <mat-icon>add</mat-icon> New Document
        </button>
      </div>
    </div>

    <mat-card>
      <mat-accordion multi>
        <mat-expansion-panel *ngFor="let d of docs()">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <strong>{{ d.code }}</strong> &nbsp; — &nbsp; {{ d.title }}
            </mat-panel-title>
            <mat-panel-description>
              <span class="chip" [ngClass]="statusChip(d.status)">{{
                d.status
              }}</span>
              &nbsp; v{{ d.version }}
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="doc-actions">
            <button
              *ngIf="canManage"
              mat-stroked-button
              (click)="openEdit(d)">
              <mat-icon>edit</mat-icon> New Version
            </button>
            <button mat-stroked-button [matMenuTriggerFor]="rowMenu">
              <mat-icon>download</mat-icon> Export
            </button>
            <mat-menu #rowMenu="matMenu">
              <button mat-menu-item (click)="exportOneDocx(d)">
                <mat-icon>description</mat-icon> DOCX
              </button>
              <button mat-menu-item (click)="exportOnePdf(d)">
                <mat-icon>picture_as_pdf</mat-icon> PDF
              </button>
            </mat-menu>
            <button mat-stroked-button (click)="loadVersions(d)">
              <mat-icon>history</mat-icon> Version History
            </button>
            <button
              *ngIf="canManage"
              mat-stroked-button
              color="warn"
              (click)="remove(d)">
              <mat-icon>delete</mat-icon> Delete
            </button>
          </div>

          <div class="content" [innerHTML]="d.content"></div>

          <div *ngIf="expanded()[d.id] as detail">
            <h4>Version History</h4>
            <ul>
              <li *ngFor="let v of detail.versions">
                v{{ v.version }} — {{ v.createdAt | date: 'medium' }}
                <em *ngIf="v.changeNote">— {{ v.changeNote }}</em>
              </li>
            </ul>
          </div>
        </mat-expansion-panel>
      </mat-accordion>
      <p class="empty" *ngIf="!docs().length">No documents yet.</p>
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
      .header-actions {
        display: flex;
        gap: 8px;
      }
      h1 {
        margin: 0;
      }
      .empty {
        padding: 16px;
        color: var(--notion-text-muted);
      }
      .doc-actions {
        display: flex;
        gap: 8px;
        margin: 8px 0 12px;
        flex-wrap: wrap;
      }
      .content {
        background: var(--notion-sidebar);
        padding: 14px 16px;
        border-radius: 6px;
        border: 1px solid var(--notion-border);
        font-size: 14px;
        line-height: 1.6;
      }
      .content :first-child { margin-top: 0; }
      .content :last-child { margin-bottom: 0; }
    `,
  ],
})
export class DocumentsComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  docs = signal<QmsDocument[]>([]);
  expanded = signal<Record<string, QmsDocument>>({});

  get canManage(): boolean {
    return this.auth.hasRole(Role.QUALITY_MANAGER, Role.ADMIN_OWNER);
  }

  constructor() {
    this.refresh();
  }

  refresh() {
    this.api.listDocuments().subscribe((d) => this.docs.set(d));
  }

  statusChip(s: DocumentStatus): string {
    if (s === DocumentStatus.APPROVED) return 'chip-ok';
    if (s === DocumentStatus.DRAFT) return 'chip-warn';
    if (s === DocumentStatus.OBSOLETE) return 'chip-danger';
    return 'chip-info';
  }

  loadVersions(doc: QmsDocument) {
    this.api.getDocument(doc.id).subscribe((full) => {
      this.expanded.update((state) => ({ ...state, [doc.id]: full }));
    });
  }

  openNew() {
    const ref = this.dialog.open(DocumentDialogComponent, {
      data: {},
      width: '760px',
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.api.createDocument(payload).subscribe({
        next: () => {
          this.snack.open('Document created', 'OK', { duration: 2500 });
          this.refresh();
        },
        error: (e) =>
          this.snack.open(e?.error?.message || 'Error', 'Close', {
            duration: 4000,
          }),
      });
    });
  }

  openEdit(doc: QmsDocument) {
    const ref = this.dialog.open(DocumentDialogComponent, {
      data: { doc },
      width: '760px',
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.api.updateDocument(doc.id, payload).subscribe({
        next: () => {
          this.snack.open('Document updated', 'OK', { duration: 2500 });
          this.refresh();
        },
      });
    });
  }

  remove(doc: QmsDocument) {
    if (!confirm(`Delete document "${doc.code}"?`)) return;
    this.api.deleteDocument(doc.id).subscribe(() => {
      this.snack.open('Document deleted', 'OK', { duration: 2500 });
      this.refresh();
    });
  }

  // ---- Export ----
  exportAllCsv() {
    const rows = this.docs().map((d) => ({
      code: d.code,
      title: d.title,
      version: d.version,
      status: d.status,
      updatedAt: d.updatedAt,
    }));
    exportCsv(rows, 'documents.csv', [
      { key: 'code', label: 'Code' },
      { key: 'title', label: 'Title' },
      { key: 'version', label: 'Version' },
      { key: 'status', label: 'Status' },
      { key: 'updatedAt', label: 'Updated' },
    ]);
  }

  exportAllDocx() {
    void exportDocx(
      'documents.docx',
      this.docs().map((d) => ({
        title: `${d.code} — ${d.title}`,
        html: d.content,
        meta: [
          { label: 'Version', value: `v${d.version}` },
          { label: 'Status', value: d.status },
        ],
      })),
    );
  }

  exportAllPdf() {
    exportPdf(
      'documents.pdf',
      this.docs().map((d) => ({
        title: `${d.code} — ${d.title}`,
        html: d.content,
        meta: [
          { label: 'Version', value: `v${d.version}` },
          { label: 'Status', value: d.status },
        ],
      })),
    );
  }

  exportOneDocx(d: QmsDocument) {
    void exportDocx(`${d.code}-v${d.version}.docx`, [
      {
        title: `${d.code} — ${d.title}`,
        html: d.content,
        meta: [
          { label: 'Version', value: `v${d.version}` },
          { label: 'Status', value: d.status },
        ],
      },
    ]);
  }

  exportOnePdf(d: QmsDocument) {
    exportPdf(`${d.code}-v${d.version}.pdf`, [
      {
        title: `${d.code} — ${d.title}`,
        html: d.content,
        meta: [
          { label: 'Version', value: `v${d.version}` },
          { label: 'Status', value: d.status },
        ],
      },
    ]);
  }
}
