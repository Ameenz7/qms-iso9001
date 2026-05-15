import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import {
  EvidenceEntityType,
  QmsDocument,
  Role,
} from '../../../core/models';
import { DocumentModalComponent } from '../components/document-modal.component';
import { exportCsv, exportDocx, exportPdf } from '../../../core/export.util';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTooltipModule,
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
          *ngIf="canManage()"
          (click)="openNew()">
          <mat-icon>add</mat-icon> New Document
        </button>
      </div>
    </div>

    <mat-card>
      <table mat-table [dataSource]="docs()" class="w-full">
        <ng-container matColumnDef="code">
          <th mat-header-cell *matHeaderCellDef>Code</th>
          <td mat-cell *matCellDef="let d"><strong>{{ d.code }}</strong></td>
        </ng-container>

        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Title</th>
          <td mat-cell *matCellDef="let d">{{ d.title }}</td>
        </ng-container>

        <ng-container matColumnDef="version">
          <th mat-header-cell *matHeaderCellDef>Version</th>
          <td mat-cell *matCellDef="let d">v{{ d.version }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let d">
            <span class="chip" [ngClass]="statusChip(d.status)">{{ d.status }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="updatedAt">
          <th mat-header-cell *matHeaderCellDef>Updated At</th>
          <td mat-cell *matCellDef="let d">{{ d.updatedAt | date: 'short' }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let d" class="text-right">
            <button mat-icon-button [routerLink]="['/documents', d.id]" matTooltip="View Details">
              <mat-icon>visibility</mat-icon>
            </button>
            <button mat-icon-button [matMenuTriggerFor]="rowMenu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #rowMenu="matMenu">
              <button mat-menu-item (click)="exportOnePdf(d)">
                <mat-icon>picture_as_pdf</mat-icon> Download PDF
              </button>
              <button mat-menu-item (click)="submit(d)" *ngIf="d.status === 'draft' && canManage()">
                <mat-icon color="primary">send</mat-icon> Submit for Approval
              </button>
              <button mat-menu-item (click)="approve(d)" *ngIf="d.status === 'under_review' && isOA()">
                <mat-icon color="primary">check_circle</mat-icon> Approve
              </button>
              <button mat-menu-item (click)="reject(d)" *ngIf="d.status === 'under_review' && isOA()">
                <mat-icon color="warn">cancel</mat-icon> Reject
              </button>
              <button mat-menu-item (click)="openEdit(d)" *ngIf="canManage()">
                <mat-icon>edit</mat-icon> New Version
              </button>
              <button mat-menu-item color="warn" (click)="remove(d)" *ngIf="canManage()">
                <mat-icon color="warn">delete</mat-icon> Delete
              </button>
            </mat-menu>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *mat_row_no_data>
          <td colspan="6" class="p-4 text-center">No documents found.</td>
        </tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </mat-card>
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .header-actions {
      display: flex;
      gap: 12px;
    }
    .w-full { width: 100%; }
    .text-right { text-align: right; }
    .chip {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .chip-ok { background: #e8f5e9; color: #2e7d32; }
    .chip-warn { background: #fff3e0; color: #ef6c00; }
    .chip-danger { background: #ffebee; color: #c62828; }
    .chip-neutral { background: #f5f5f5; color: #616161; }
  `]
})
export class DocumentListComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  docs = signal<QmsDocument[]>([]);
  displayedColumns = ['code', 'title', 'version', 'status', 'updatedAt', 'actions'];

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.api.listDocuments().subscribe((docs) => this.docs.set(docs));
  }

  canManage() {
    const r = this.auth.user()?.role;
    return r === Role.ADMIN_OWNER || r === Role.QUALITY_MANAGER;
  }

  isOA() {
    return this.auth.user()?.role === Role.ADMIN_OWNER;
  }

  statusChip(s: string) {
    if (s === 'approved') return 'chip-ok';
    if (s === 'draft') return 'chip-neutral';
    if (s === 'under_review') return 'chip-warn';
    if (s === 'obsolete') return 'chip-danger';
    return '';
  }

  openNew() {
    this.dialog
      .open(DocumentModalComponent, { data: {} })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) {
          const { pdf, ...rest } = payload;
          this.api.createDocument({ ...rest, content: rest.content || 'Initial version' }).subscribe((doc) => {
            if (pdf) {
              this.api.uploadEvidence(doc.id, EvidenceEntityType.DOCUMENT, pdf).subscribe(() => {
                this.refresh();
                this.snack.open('Document created', 'OK', { duration: 3000 });
              });
            } else {
              this.refresh();
              this.snack.open('Document created', 'OK', { duration: 3000 });
            }
          });
        }
      });
  }

  openEdit(doc: QmsDocument) {
    this.dialog
      .open(DocumentModalComponent, { data: { doc } })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) {
          const { pdf, ...rest } = payload;
          this.api.updateDocumentWithPdf(doc.id, rest, pdf).subscribe(() => {
            if (pdf) {
               this.api.uploadEvidence(doc.id, EvidenceEntityType.DOCUMENT, pdf).subscribe(() => {
                 this.refresh();
                 this.snack.open('New version created', 'OK', { duration: 3000 });
               });
            } else {
              this.refresh();
              this.snack.open('New version created', 'OK', { duration: 3000 });
            }
          });
        }
      });
  }

  remove(doc: QmsDocument) {
    if (confirm(`Delete document ${doc.code}? This cannot be undone.`)) {
      this.api.deleteDocument(doc.id).subscribe(() => {
        this.refresh();
        this.snack.open('Document deleted', 'OK', { duration: 3000 });
      });
    }
  }

  submit(doc: QmsDocument) {
    this.api.submitDocument(doc.id).subscribe(() => {
      this.refresh();
      this.snack.open('Document submitted for approval', 'OK', { duration: 3000 });
    });
  }

  approve(doc: QmsDocument) {
    this.api.approveDocument(doc.id).subscribe(() => {
      this.refresh();
      this.snack.open('Document approved', 'OK', { duration: 3000 });
    });
  }

  reject(doc: QmsDocument) {
    this.api.rejectDocument(doc.id).subscribe(() => {
      this.refresh();
      this.snack.open('Document rejected', 'OK', { duration: 3000 });
    });
  }

  exportAllCsv() {
    exportCsv(
      this.docs().map((d) => ({
        ...d,
        createdBy: d.createdBy ? `${d.createdBy.firstName} ${d.createdBy.lastName}` : '—'
      }) as any),
      'documents.csv',
    );
  }
  exportAllDocx() {
    const sections = this.docs().map((d) => ({
      title: `${d.code}: ${d.title}`,
      html: d.content || (d.isPdf ? 'PDF Document' : ''),
      meta: [
        { label: 'Version', value: `v${d.version}` },
        { label: 'Status', value: d.status },
        { label: 'Updated At', value: d.updatedAt },
      ],
    }));
    exportDocx('documents.docx', sections);
  }
  exportAllPdf() {
    const sections = this.docs().map((d) => ({
      title: `${d.code}: ${d.title}`,
      html: d.content || (d.isPdf ? 'PDF Document' : ''),
      meta: [
        { label: 'Version', value: `v${d.version}` },
        { label: 'Status', value: d.status },
        { label: 'Updated At', value: d.updatedAt },
      ],
    }));
    exportPdf('documents.pdf', sections);
  }

  exportOnePdf(d: QmsDocument) {
    if (d.isPdf) {
      this.api.downloadAttachment(d.id).subscribe((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${d.code}_v${d.version}.pdf`;
        a.click();
      });
    } else {
      exportPdf(`${d.code}.pdf`, [
        {
          title: `${d.code}: ${d.title}`,
          html: d.content || '',
          meta: [
            { label: 'Version', value: `v${d.version}` },
            { label: 'Status', value: d.status },
            { label: 'Updated At', value: d.updatedAt },
          ],
        },
      ]);
    }
  }
}
