import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/api.service';
import {
  Evidence,
  EvidenceEntityType,
  QmsDocument,
} from '../../../core/models';
import { DocumentPreviewComponent } from '../components/document-preview.component';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatDividerModule,
    MatSnackBarModule,
    DocumentPreviewComponent,
  ],
  template: `
    <div class="header" *ngIf="doc() as d">
      <div class="title-row">
        <button mat-icon-button routerLink="/documents">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ d.code }}: {{ d.title }}</h1>
      </div>
    </div>

    <mat-tab-group *ngIf="doc() as d">
      <mat-tab label="Preview">
        <app-document-preview
          [doc]="d"
          (download)="onDownload($event)"></app-document-preview>
      </mat-tab>

      <mat-tab label="Version History">
        <mat-card class="m-4">
          <table mat-table [dataSource]="d.versions || []" class="w-full">
            <ng-container matColumnDef="version">
              <th mat-header-cell *matHeaderCellDef>Version</th>
              <td mat-cell *matCellDef="let v">v{{ v.version }}</td>
            </ng-container>
            <ng-container matColumnDef="note">
              <th mat-header-cell *matHeaderCellDef>Change Note</th>
              <td mat-cell *matCellDef="let v">{{ v.changeNote || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let v">
                {{ v.createdAt | date: 'medium' }}
              </td>
            </ng-container>
            <ng-container matColumnDef="createdBy">
              <th mat-header-cell *matHeaderCellDef>By</th>
              <td mat-cell *matCellDef="let v">
                {{ v.createdBy?.firstName }} {{ v.createdBy?.lastName }}
              </td>
            </ng-container>

            <tr
              mat-header-row
              *matHeaderRowDef="['version', 'note', 'createdAt', 'createdBy']"></tr>
            <tr
              mat-row
              *matRowDef="
                let row;
                columns: ['version', 'note', 'createdAt', 'createdBy']
              "></tr>
          </table>
        </mat-card>
      </mat-tab>

      <mat-tab label="Attachments">
        <mat-card class="m-4">
          <div class="p-4 flex justify-between items-center">
            <h3>Files & Attachments</h3>
          </div>

          <table mat-table [dataSource]="attachments()" class="w-full">
            <ng-container matColumnDef="filename">
              <th mat-header-cell *matHeaderCellDef>Filename</th>
              <td mat-cell *matCellDef="let a">{{ a.fileName }}</td>
            </ng-container>
            <ng-container matColumnDef="size">
              <th mat-header-cell *matHeaderCellDef>Size</th>
              <td mat-cell *matCellDef="let a">{{ formatSize(a.fileSize) }}</td>
            </ng-container>
            <ng-container matColumnDef="version">
              <th mat-header-cell *matHeaderCellDef>Uploaded</th>
              <td mat-cell *matCellDef="let a">{{ a.createdAt | date:'short' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let a" class="text-right">
                <button mat-icon-button (click)="downloadEvidence(a.id)">
                  <mat-icon>download</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr
              mat-header-row
              *matHeaderRowDef="['filename', 'size', 'version', 'actions']"></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: ['filename', 'size', 'version', 'actions']"></tr>
          </table>
        </mat-card>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [
    `
      .header {
        padding: 16px 24px;
      }
      .title-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .m-4 {
        margin: 16px;
      }
      .p-4 {
        padding: 16px;
      }
      .w-full {
        width: 100%;
      }
      .flex {
        display: flex;
      }
      .justify-between {
        justify-content: space-between;
      }
      .items-center {
        align-items: center;
      }
      .text-right {
        text-align: right;
      }
    `,
  ],
})
export class DocumentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);

  doc = signal<QmsDocument | null>(null);
  attachments = signal<Evidence[]>([]);

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadDocument(id);
    }
  }

  loadDocument(id: string) {
    this.api.listDocuments().subscribe((docs) => {
      const found = docs.find((d) => d.id === id);
      if (found) {
        this.doc.set(found);
        this.loadAttachments(id);
      }
    });
  }

  loadAttachments(id: string) {
    this.api
      .listEvidences(id, EvidenceEntityType.DOCUMENT)
      .subscribe((atts: Evidence[]) => this.attachments.set(atts));
  }

  onDownload(d: QmsDocument) {
    this.downloadEvidence(d.id, 'document');
  }

  downloadEvidence(id: string, entityType: string = 'document') {
    this.api.listEvidences(id, entityType as any).subscribe((list) => {
      if (list.length) {
        const file = list[0];
        this.api.downloadEvidence(file.id).subscribe((blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.fileName;
          link.click();
        });
      } else {
        this.snack.open('No file found', 'OK', { duration: 2000 });
      }
    });
  }

  formatSize(bytes: string | number) {
    const b = Number(bytes);
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
