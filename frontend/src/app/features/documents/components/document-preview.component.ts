import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { EvidenceEntityType, QmsDocument } from '../../../core/models';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-document-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
  template: `
    <div class="preview-container">
      <div class="metadata-sidebar">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Document Metadata</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="meta-item">
              <label>Code:</label>
              <span>{{ doc.code }}</span>
            </div>
            <div class="meta-item">
              <label>Version:</label>
              <span>v{{ doc.version }}</span>
            </div>
            <div class="meta-item">
              <label>Status:</label>
              <span class="chip" [ngClass]="statusClass()">{{ doc.status }}</span>
            </div>
            <div class="meta-item">
              <label>Created By:</label>
              <span>{{ doc.createdBy?.firstName }} {{ doc.createdBy?.lastName }}</span>
            </div>
            <div class="meta-item">
              <label>Updated At:</label>
              <span>{{ doc.updatedAt | date: 'medium' }}</span>
            </div>
            
            <mat-divider></mat-divider>
            
            <div class="actions">
              <button mat-flat-button color="primary" (click)="download.emit(doc)">
                <mat-icon>download</mat-icon> Download
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
      
      <div class="content-preview">
        <mat-card class="full-height-card">
          <mat-card-header>
            <mat-card-title>{{ doc.title }}</mat-card-title>
          </mat-card-header>
          <mat-card-content class="preview-content">
            <div *ngIf="!doc.isPdf" class="html-content" [innerHTML]="doc.content"></div>
            
            <div *ngIf="doc.isPdf" class="pdf-viewer-container">
              <iframe *ngIf="pdfUrl()" [src]="pdfUrl()" width="100%" height="100%" frameborder="0"></iframe>
              <div *ngIf="!pdfUrl()" class="loading-pdf">
                <mat-icon>sync</mat-icon>
                <p>Loading PDF preview...</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .preview-container {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 24px;
      padding: 16px;
      height: calc(100vh - 200px);
    }
    .metadata-sidebar {
      height: 100%;
    }
    .content-preview {
      height: 100%;
    }
    .full-height-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .preview-content {
      flex: 1;
      padding: 0 !important;
      overflow: hidden;
    }
    .pdf-viewer-container {
      width: 100%;
      height: 100%;
    }
    .loading-pdf {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #666;
    }
    .loading-pdf mat-icon {
      animation: spin 2s linear infinite;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .meta-item {
      display: flex;
      flex-direction: column;
      margin-bottom: 12px;
    }
    .meta-item label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }
    .meta-item span {
      font-size: 14px;
    }
    mat-divider {
      margin: 16px 0;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .html-content {
      padding: 24px;
      height: 100%;
      overflow-y: auto;
    }
    .chip {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      width: fit-content;
    }
    .chip-approved { background: #e8f5e9; color: #2e7d32; }
    .chip-draft { background: #f5f5f5; color: #616161; }
    .chip-review { background: #fff3e0; color: #ef6c00; }
    .chip-obsolete { background: #ffebee; color: #c62828; }
  `]
})
export class DocumentPreviewComponent implements OnChanges {
  @Input({ required: true }) doc!: QmsDocument;
  @Output() download = new EventEmitter<QmsDocument>();

  private sanitizer = inject(DomSanitizer);
  private api = inject(ApiService);
  
  pdfUrl = signal<SafeResourceUrl | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['doc'] && this.doc.isPdf) {
      this.loadPdfPreview();
    }
  }

  loadPdfPreview() {
    this.pdfUrl.set(null);
    this.api.listEvidences(this.doc.id, EvidenceEntityType.DOCUMENT).subscribe({
      next: (list) => {
        if (list.length > 0) {
          // On prend le dernier fichier uploadé (le plus récent)
          const latestFile = list[0];
          this.api.downloadEvidence(latestFile.id).subscribe({
            next: (blob) => {
              const url = URL.createObjectURL(blob);
              this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
            }
          });
        }
      },
      error: (err) => {
        console.error('Failed to load document preview', err);
      }
    });
  }

  statusClass() {
    return {
      'chip-approved': this.doc.status === 'approved',
      'chip-draft': this.doc.status === 'draft',
      'chip-review': this.doc.status === 'under_review',
      'chip-obsolete': this.doc.status === 'obsolete',
    };
  }
}
