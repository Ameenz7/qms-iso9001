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
    fileName: string;
    fileSize: number;
    mimeType: string;
    metadata: DocumentMetadata[];
  }): Observable<QmsDocument> {
    const user = this.auth.user()!;
    const docId = this.store.uid('doc');
    const versionId = this.store.uid('docv');
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
          filePath: `/mock/${payload.fileName}`,
          fileName: payload.fileName,
          fileSize: payload.fileSize,
          mimeType: payload.mimeType,
          createdAt: new Date().toISOString(),
          createdBy: user.id,
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

  uploadVersion(
    docId: string,
    file: { fileName: string; fileSize: number; mimeType: string },
  ): Observable<QmsDocument> {
    const user = this.auth.user()!;
    const doc = this.store.documents().find((d) => d.id === docId);
    if (!doc) throw new Error('Document not found');

    const latest = doc.versions[doc.versions.length - 1];
    const [major, minor] = latest.versionNumber.split('.').map(Number);
    const newVersionNumber = `${major}.${minor + 1}`;
    const versionId = this.store.uid('docv');
    const newVersion: DocumentVersion = {
      id: versionId,
      documentId: docId,
      versionNumber: newVersionNumber,
      filePath: `/mock/${file.fileName}`,
      fileName: file.fileName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
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
