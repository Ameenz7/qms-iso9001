import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuditLog,
  Capa,
  CreateInviteResponse,
  DocumentAttachment,
  InviteVerifyResponse,
  NonConformity,
  Organization,
  Payment,
  QmsDocument,
  UserInvite,
  UserRecord,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // Organizations
  listOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.base}/organizations`);
  }
  createOrganization(body: unknown): Observable<Organization> {
    return this.http.post<Organization>(`${this.base}/organizations`, body);
  }
  updateOrganization(id: string, body: unknown): Observable<Organization> {
    return this.http.patch<Organization>(
      `${this.base}/organizations/${id}`,
      body,
    );
  }
  deleteOrganization(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/organizations/${id}`);
  }
  suspendOrganization(
    id: string,
    reason?: string,
  ): Observable<Organization> {
    return this.http.post<Organization>(
      `${this.base}/organizations/${id}/suspend`,
      { reason },
    );
  }
  unsuspendOrganization(id: string): Observable<Organization> {
    return this.http.post<Organization>(
      `${this.base}/organizations/${id}/unsuspend`,
      {},
    );
  }
  recordPayment(
    id: string,
    body: { amount: string; monthsCovered: number; note?: string },
  ): Observable<Payment> {
    return this.http.post<Payment>(
      `${this.base}/organizations/${id}/payments`,
      body,
    );
  }
  listPayments(id: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(
      `${this.base}/organizations/${id}/payments`,
    );
  }

  // Users
  listUsers(): Observable<UserRecord[]> {
    return this.http.get<UserRecord[]>(`${this.base}/users`);
  }
  createUser(body: unknown): Observable<UserRecord> {
    return this.http.post<UserRecord>(`${this.base}/users`, body);
  }
  updateUser(id: string, body: unknown): Observable<UserRecord> {
    return this.http.patch<UserRecord>(`${this.base}/users/${id}`, body);
  }
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}`);
  }

  // Invites
  listInvites(): Observable<UserInvite[]> {
    return this.http.get<UserInvite[]>(`${this.base}/invites`);
  }
  createInvite(body: {
    email: string;
    role: string;
    organizationId?: string;
  }): Observable<CreateInviteResponse> {
    return this.http.post<CreateInviteResponse>(`${this.base}/invites`, body);
  }
  revokeInvite(id: string): Observable<UserInvite> {
    return this.http.delete<UserInvite>(`${this.base}/invites/${id}`);
  }
  verifyInvite(token: string): Observable<InviteVerifyResponse> {
    return this.http.get<InviteVerifyResponse>(
      `${this.base}/invites/verify/${encodeURIComponent(token)}`,
    );
  }
  acceptInvite(body: {
    token: string;
    firstName: string;
    lastName: string;
    password: string;
  }): Observable<{ id: string; email: string }> {
    return this.http.post<{ id: string; email: string }>(
      `${this.base}/invites/accept`,
      body,
    );
  }

  // Non-Conformities
  listNcs(): Observable<NonConformity[]> {
    return this.http.get<NonConformity[]>(`${this.base}/non-conformities`);
  }
  getNc(id: string): Observable<NonConformity> {
    return this.http.get<NonConformity>(`${this.base}/non-conformities/${id}`);
  }
  createNc(body: unknown): Observable<NonConformity> {
    return this.http.post<NonConformity>(
      `${this.base}/non-conformities`,
      body,
    );
  }
  updateNc(id: string, body: unknown): Observable<NonConformity> {
    return this.http.patch<NonConformity>(
      `${this.base}/non-conformities/${id}`,
      body,
    );
  }
  linkNcToCapa(id: string, capaId: string): Observable<NonConformity> {
    return this.http.post<NonConformity>(
      `${this.base}/non-conformities/${id}/link-capa`,
      { capaId },
    );
  }
  deleteNc(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/non-conformities/${id}`);
  }

  // CAPAs
  listCapas(): Observable<Capa[]> {
    return this.http.get<Capa[]>(`${this.base}/capas`);
  }
  getCapa(id: string): Observable<Capa> {
    return this.http.get<Capa>(`${this.base}/capas/${id}`);
  }
  createCapa(body: unknown): Observable<Capa> {
    return this.http.post<Capa>(`${this.base}/capas`, body);
  }
  updateCapa(id: string, body: unknown): Observable<Capa> {
    return this.http.patch<Capa>(`${this.base}/capas/${id}`, body);
  }
  deleteCapa(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/capas/${id}`);
  }

  // Documents
  listDocuments(): Observable<QmsDocument[]> {
    return this.http.get<QmsDocument[]>(`${this.base}/documents`);
  }
  getDocument(id: string): Observable<QmsDocument> {
    return this.http.get<QmsDocument>(`${this.base}/documents/${id}`);
  }
  createDocument(body: unknown): Observable<QmsDocument> {
    return this.http.post<QmsDocument>(`${this.base}/documents`, body);
  }
  updateDocument(id: string, body: unknown): Observable<QmsDocument> {
    return this.http.patch<QmsDocument>(`${this.base}/documents/${id}`, body);
  }
  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/documents/${id}`);
  }

  // Document Attachments
  listAttachments(documentId: string): Observable<DocumentAttachment[]> {
    return this.http.get<DocumentAttachment[]>(
      `${this.base}/documents/${documentId}/attachments`,
    );
  }
  uploadAttachment(
    documentId: string,
    file: File,
  ): Observable<DocumentAttachment> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<DocumentAttachment>(
      `${this.base}/documents/${documentId}/attachments`,
      form,
    );
  }
  downloadAttachment(attachmentId: string): Observable<Blob> {
    return this.http.get(
      `${this.base}/documents/attachments/${attachmentId}/download`,
      { responseType: 'blob' },
    );
  }
  deleteAttachment(attachmentId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/documents/attachments/${attachmentId}`,
    );
  }

  // Audit Logs
  listAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.base}/audit-logs`);
  }
}
