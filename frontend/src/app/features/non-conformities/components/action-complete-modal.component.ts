import { CommonModule } from '@angular/common';
import { Component, Inject, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CorrectiveAction } from '../../../core/models';

@Component({
  selector: 'app-action-complete-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Complete Action</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Completion Notes</mat-label>
          <textarea
            matInput
            rows="3"
            formControlName="notes"
            required
            placeholder="Describe what was done..."></textarea>
        </mat-form-field>

        <div class="evidence-upload">
          <label class="upload-label">Evidence of Completion (Required)</label>
          <button type="button" mat-stroked-button (click)="fileInput.click()">
            <mat-icon>upload_file</mat-icon>
            {{ selectedFile ? selectedFile.name : 'Upload Evidence' }}
          </button>
          <input
            type="file"
            #fileInput
            hidden
            (change)="onFileSelected($event)" />
          <p class="file-hint" *ngIf="selectedFile">
            Selected: {{ selectedFile.name }}
          </p>
          <p class="error-text" *ngIf="!selectedFile">
            A proof of completion is mandatory.
          </p>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid || !selectedFile"
        (click)="save()">
        Submit for Approval
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form {
        display: flex;
        flex-direction: column;
        min-width: 440px;
        padding-top: 8px;
      }
      .evidence-upload {
        border: 2px dashed #e2e8f0;
        padding: 16px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        background: #f8fafc;
      }
      .upload-label {
        font-size: 13px;
        font-weight: 500;
        color: #64748b;
      }
      .file-hint {
        font-size: 12px;
        color: #15803d;
        margin: 0;
      }
      .error-text {
        font-size: 11px;
        color: #b91c1c;
        margin: 0;
      }
    `,
  ],
})
export class ActionCompleteModalComponent {
  private fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    notes: ['', [Validators.required]],
  });

  selectedFile: File | null = null;

  constructor(
    public dialogRef: MatDialogRef<ActionCompleteModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { action: CorrectiveAction },
  ) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

  save() {
    this.dialogRef.close({
      ...this.form.getRawValue(),
      evidence: this.selectedFile,
    });
  }
}
