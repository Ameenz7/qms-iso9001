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
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import {
  DocumentStatus,
  QmsDocument,
  Role,
} from '../../core/models';

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
        <mat-form-field appearance="outline">
          <mat-label>Content</mat-label>
          <textarea
            matInput
            rows="10"
            formControlName="content"
            required></textarea>
        </mat-form-field>
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
        min-width: 600px;
      }
      .row {
        display: flex;
        gap: 12px;
      }
      .row mat-form-field {
        flex: 1;
      }
    `,
  ],
})
export class DocumentDialogComponent {
  private fb = inject(FormBuilder);
  statuses = Object.values(DocumentStatus);
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
  ],
  template: `
    <div class="header">
      <h1>Controlled Documents</h1>
      <button
        mat-flat-button
        color="primary"
        *ngIf="canManage"
        (click)="openNew()">
        <mat-icon>add</mat-icon> New Document
      </button>
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

          <div class="doc-actions" *ngIf="canManage">
            <button mat-stroked-button (click)="openEdit(d)">
              <mat-icon>edit</mat-icon> New Version
            </button>
            <button
              mat-stroked-button
              color="warn"
              (click)="remove(d)">
              <mat-icon>delete</mat-icon> Delete
            </button>
            <button mat-stroked-button (click)="loadVersions(d)">
              <mat-icon>history</mat-icon> Version History
            </button>
          </div>

          <pre class="content">{{ d.content }}</pre>

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
      h1 {
        margin: 0;
      }
      .empty {
        padding: 16px;
        color: #64748b;
      }
      .doc-actions {
        display: flex;
        gap: 8px;
        margin: 8px 0 12px;
      }
      .content {
        white-space: pre-wrap;
        background: #f8fafc;
        padding: 12px;
        border-radius: 6px;
        font-family: inherit;
        font-size: 14px;
      }
      .chip {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 500;
      }
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
      width: '720px',
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
      width: '720px',
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
}
