import { CommonModule } from '@angular/common';
import { Component, Inject, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { QuillEditorComponent } from 'ngx-quill';
import { DocumentStatus, QmsDocument } from '../../../core/models';

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
  selector: 'app-document-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    QuillEditorComponent,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.doc ? 'New Version' : 'New Document' }}
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

        <div class="pdf-upload">
          <label class="upload-label">{{ data.doc ? 'Update PDF File (Optional)' : 'Document PDF File' }}</label>
          <button type="button" mat-stroked-button (click)="pdfInput.click()">
            <mat-icon>upload_file</mat-icon>
            {{ selectedPdf() ? selectedPdf()?.name : 'Choose PDF File' }}
          </button>
          <input
            type="file"
            #pdfInput
            hidden
            accept="application/pdf"
            (change)="onPdfSelected($event)" />
          <p class="pdf-hint" *ngIf="selectedPdf()">
            Selected: {{ selectedPdf()?.name }} ({{
              (selectedPdf()?.size || 0) / 1024 / 1024 | number: '1.1-1'
            }}
            MB)
          </p>
          <p class="error-text" *ngIf="!selectedPdf() && !data.doc">
            A PDF file is required to create a document.
          </p>
        </div>

        <ng-container *ngIf="data.doc">
          <label class="editor-label">Change Summary (Details of changes)</label>
          <quill-editor
            formControlName="content"
            [modules]="quillModules"
            placeholder="Describe what changed in this version..."></quill-editor>

          <mat-form-field appearance="outline">
            <mat-label>Change Note (Short version)</mat-label>
            <input matInput formControlName="changeNote" placeholder="e.g. Updated Section 4.2" />
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
        [disabled]="form.invalid || (!selectedPdf() && !data.doc)"
        (click)="save()">
        {{ data.doc ? 'Create New Version' : 'Create Document' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form {
        display: flex;
        flex-direction: column;
        min-width: 640px;
        padding-top: 8px;
      }
      .row {
        display: flex;
        gap: 12px;
      }
      .row mat-form-field {
        flex: 1;
      }
      .pdf-upload {
        border: 2px dashed #e0e0e0;
        padding: 24px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        margin: 8px 0 16px;
        background: #fafafa;
      }
      .upload-label {
        font-size: 13px;
        font-weight: 500;
        color: #666;
        margin-bottom: 4px;
      }
      .pdf-hint {
        font-size: 12px;
        color: #666;
        margin: 0;
      }
      .error-text {
        font-size: 12px;
        color: #f44336;
        margin: 0;
      }
      .editor-label {
        font-size: 12px;
        color: #666;
        margin: 12px 0 6px;
        font-weight: 500;
      }
      quill-editor {
        display: block;
        margin-bottom: 16px;
      }
    `,
  ],
})
export class DocumentModalComponent {
  private fb = inject(FormBuilder);
  statuses = Object.values(DocumentStatus);
  quillModules = QUILL_MODULES;
  form;

  selectedPdf = signal<File | null>(null);

  constructor(
    public dialogRef: MatDialogRef<DocumentModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { doc?: QmsDocument },
  ) {
    const d = data.doc;
    this.form = this.fb.nonNullable.group({
      code: [{ value: d?.code ?? '', disabled: !!d }, [Validators.required]],
      title: [d?.title ?? '', [Validators.required]],
      content: [d?.content ?? ''],
      changeNote: [''],
      status: [d?.status ?? DocumentStatus.DRAFT],
    });
  }

  onPdfSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedPdf.set(input.files[0]);
    }
  }

  save() {
    const v = this.form.getRawValue();
    const payload: Record<string, any> = {
      title: v.title,
      content: v.content || null,
      pdf: this.selectedPdf(),
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
