import { Injectable, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { AuthService } from './auth.service';
import { DataStore } from './data.store';
import {
  DocumentMetadata,
  DocumentStatus,
  DocumentVersion,
  QmsDocument,
} from './models';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private store = inject(DataStore);
  private auth = inject(AuthService);

  list(): Observable<QmsDocument[]> {
    const orgId = this.auth.user()?.orgId;
    const docs = this.store
      .documents()
      .filter((d) => !orgId || d.orgId === orgId);
    return of(docs).pipe(delay(150));
  }

  get(id: string): Observable<QmsDocument | undefined> {
    return of(this.store.documents().find((d) => d.id === id)).pipe(delay(100));
  }

  create(payload: {
    title: string;
    type: string;
    file: File;
    metadata: DocumentMetadata[];
  }): Observable<QmsDocument> {
    const user = this.auth.user()!;
    const docId = this.store.uid('doc');
    const versionId = this.store.uid('docv');
    const fileUrl = URL.createObjectURL(payload.file);
    const newDoc: QmsDocument = {
      id: docId,
      title: payload.title,
      type: payload.type,
      status: 'DRAFT',
      currentVersionId: versionId,
      orgId: user.orgId ?? 'org-1',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: payload.metadata,
      versions: [
        {
          id: versionId,
          documentId: docId,
          versionNumber: '1.0',
          filePath: `/mock/${payload.file.name}`,
          fileName: payload.file.name,
          fileSize: payload.file.size,
          mimeType: payload.file.type || 'application/octet-stream',
          createdAt: new Date().toISOString(),
          createdBy: user.id,
          fileUrl,
        },
      ],
    };
    this.store.documents.update((docs) => [newDoc, ...docs]);
    this.store.logAction({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'CREATE',
      entity: 'Document',
      entityId: docId,
      details: `Created document "${payload.title}" v1.0`,
    });
    return of(newDoc).pipe(delay(200));
  }

  uploadVersion(docId: string, file: File): Observable<QmsDocument> {
    const user = this.auth.user()!;
    const doc = this.store.documents().find((d) => d.id === docId);
    if (!doc) throw new Error('Document not found');

    const latest = doc.versions[doc.versions.length - 1];
    const [major, minor] = latest.versionNumber.split('.').map(Number);
    const newVersionNumber = `${major}.${minor + 1}`;
    const versionId = this.store.uid('docv');
    const fileUrl = URL.createObjectURL(file);
    const newVersion: DocumentVersion = {
      id: versionId,
      documentId: docId,
      versionNumber: newVersionNumber,
      filePath: `/mock/${file.name}`,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      fileUrl,
    };
    this.store.documents.update((docs) =>
      docs.map((d) =>
        d.id === docId
          ? {
              ...d,
              versions: [...d.versions, newVersion],
              currentVersionId: versionId,
              updatedAt: new Date().toISOString(),
            }
          : d,
      ),
    );
    this.store.logAction({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'UPDATE',
      entity: 'Document',
      entityId: docId,
      details: `Uploaded new version ${newVersionNumber}`,
    });
    return of(this.store.documents().find((d) => d.id === docId)!).pipe(
      delay(200),
    );
  }

  /**
   * Resolve a previewable/downloadable URL for a version. Real uploads have
   * `fileUrl` set via `URL.createObjectURL`; seed versions get a one-time
   * placeholder blob synthesised on demand and memoised on the version.
   */
  resolveFileUrl(version: DocumentVersion): string {
    if (version.fileUrl) return version.fileUrl;
    const placeholder = `QMS mock document\n\nDocument: ${version.fileName}\nVersion: v${version.versionNumber}\nUploaded: ${version.createdAt}\n\nThis is a placeholder blob. The seeded document has no real binary content; replace by uploading a new version to attach a real file.\n`;
    const blob = new Blob([placeholder], {
      type: version.mimeType?.startsWith('application/pdf')
        ? 'text/plain'
        : version.mimeType || 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    this.store.documents.update((docs) =>
      docs.map((d) =>
        d.id === version.documentId
          ? {
              ...d,
              versions: d.versions.map((v) =>
                v.id === version.id ? { ...v, fileUrl: url } : v,
              ),
            }
          : d,
      ),
    );
    return url;
  }

  /** Trigger a download of the version's blob via an anchor click. */
  download(version: DocumentVersion): void {
    const url = this.resolveFileUrl(version);
    const a = document.createElement('a');
    a.href = url;
    a.download = version.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  changeStatus(docId: string, status: DocumentStatus): Observable<QmsDocument> {
    const user = this.auth.user()!;
    this.store.documents.update((docs) =>
      docs.map((d) =>
        d.id === docId
          ? { ...d, status, updatedAt: new Date().toISOString() }
          : d,
      ),
    );
    this.store.logAction({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'UPDATE',
      entity: 'Document',
      entityId: docId,
      details: `Changed status to ${status}`,
    });
    return of(this.store.documents().find((d) => d.id === docId)!).pipe(
      delay(150),
    );
  }
}
