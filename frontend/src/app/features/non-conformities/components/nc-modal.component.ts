import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { NCSeverity } from '../../../core/models';

@Component({
  selector: 'app-nc-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Submit Non-Conformity</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Area / Process</mat-label>
          <input matInput formControlName="area" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Severity</mat-label>
          <mat-select formControlName="severity">
            <mat-option *ngFor="let s of severities" [value]="s">
              {{ s | titlecase }}
            </mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea
            matInput
            rows="4"
            formControlName="description"
            required></textarea>
        </mat-form-field>

        <div class="evidence-upload">
          <label class="upload-label">Evidence / Photo (Optional)</label>
          <button type="button" mat-stroked-button (click)="fileInput.click()">
            <mat-icon>attach_file</mat-icon>
            {{ selectedFile ? selectedFile.name : 'Choose File' }}
          </button>
          <input
            type="file"
            #fileInput
            hidden
            (change)="onFileSelected($event)" />
          <p class="file-hint" *ngIf="selectedFile">
            Selected: {{ selectedFile.name }} ({{
              selectedFile.size / 1024 | number: '1.0-0'
            }} KB)
          </p>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid"
        (click)="save()">
        Submit
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
        margin-top: 8px;
      }
      .upload-label {
        font-size: 13px;
        font-weight: 500;
        color: #64748b;
      }
      .file-hint {
        font-size: 12px;
        color: #64748b;
        margin: 0;
      }
    `,
  ],
})
export class NcModalComponent {
  private fb = inject(FormBuilder);
  severities = Object.values(NCSeverity);
  form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    area: [''],
    severity: [NCSeverity.LOW],
    description: ['', [Validators.required]],
  });

  selectedFile: File | null = null;

  constructor(public dialogRef: MatDialogRef<NcModalComponent>) {}

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
