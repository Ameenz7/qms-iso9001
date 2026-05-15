import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuditChecklistItem,
  AuditFinding,
  AuditLog,
  AuditSchedule,
  AuthUser,
  ChartData,
  CorrectiveAction,
  CreateInviteResponse,
  CreateShareResponse,
  DashboardKpis,
  DashboardTask,
  DocumentAttachment,
  DocumentShare,
  Evidence,
  EvidenceEntityType,
  InviteVerifyResponse,
  NonConformity,
  Organization,
  Payment,
  PublicShareView,
  QmsDocument,
  RootCause,
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

  // NC Root Causes
  addRootCause(ncId: string, body: unknown): Observable<RootCause> {
    return this.http.post<RootCause>(
      `${this.base}/non-conformities/${ncId}/causes`,
      body,
    );
  }
  updateRootCause(
    ncId: string,
    causeId: string,
    body: unknown,
  ): Observable<RootCause> {
    return this.http.patch<RootCause>(
      `${this.base}/non-conformities/${ncId}/causes/${causeId}`,
      body,
    );
  }
  deleteRootCause(ncId: string, causeId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/non-conformities/${ncId}/causes/${causeId}`,
    );
  }

  // NC Corrective Actions
  addCorrectiveAction(
    ncId: string,
    body: unknown,
  ): Observable<CorrectiveAction> {
    return this.http.post<CorrectiveAction>(
      `${this.base}/non-conformities/${ncId}/actions`,
      body,
    );
  }
  updateCorrectiveAction(
    ncId: string,
    actionId: string,
    body: unknown,
  ): Observable<CorrectiveAction> {
    return this.http.patch<CorrectiveAction>(
      `${this.base}/non-conformities/${ncId}/actions/${actionId}`,
      body,
    );
  }
  deleteCorrectiveAction(ncId: string, actionId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/non-conformities/${ncId}/actions/${actionId}`,
    );
  }

  completeAction(
    ncId: string,
    actionId: string,
    body: { notes: string; evidenceStorageKey?: string },
  ): Observable<CorrectiveAction> {
    return this.http.post<CorrectiveAction>(
      `${this.base}/non-conformities/${ncId}/actions/${actionId}/complete`,
      body,
    );
  }

  verifyAction(
    ncId: string,
    actionId: string,
    body: { approved: boolean; rejectionReason?: string },
  ): Observable<CorrectiveAction> {
    return this.http.post<CorrectiveAction>(
      `${this.base}/non-conformities/${ncId}/actions/${actionId}/verify`,
      body,
    );
  }

  // Evidence management
  uploadEvidence(
    entityId: string,
    entityType: EvidenceEntityType,
    file: File,
  ): Observable<Evidence> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<Evidence>(
      `${this.base}/evidences/upload?entityId=${entityId}&entityType=${entityType}`,
      form,
    );
  }

  listEvidences(
    entityId: string,
    entityType: EvidenceEntityType,
  ): Observable<Evidence[]> {
    return this.http.get<Evidence[]>(
      `${this.base}/evidences?entityId=${entityId}&entityType=${entityType}`,
    );
  }

  deleteEvidence(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/evidences/${id}`);
  }

  downloadEvidence(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/evidences/${id}/download`, {
      responseType: 'blob',
    });
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

  submitDocument(id: string): Observable<QmsDocument> {
    return this.http.post<QmsDocument>(`${this.base}/documents/${id}/submit`, {});
  }

  approveDocument(id: string): Observable<QmsDocument> {
    return this.http.post<QmsDocument>(`${this.base}/documents/${id}/approve`, {});
  }

  rejectDocument(id: string): Observable<QmsDocument> {
    return this.http.post<QmsDocument>(`${this.base}/documents/${id}/reject`, {});
  }

  downloadDocumentPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/documents/${id}/pdf`, {
      responseType: 'blob',
    });
  }

  createDocumentWithPdf(
    body: { code: string; title: string },
    pdf: File,
  ): Observable<QmsDocument> {
    const form = new FormData();
    form.append('code', body.code);
    form.append('title', body.title);
    form.append('pdf', pdf, pdf.name);
    return this.http.post<QmsDocument>(`${this.base}/documents`, form);
  }

  updateDocumentWithPdf(
    id: string,
    body: { title?: string; changeNote?: string; status?: string; content?: string | null },
    pdf?: File,
  ): Observable<QmsDocument> {
    const form = new FormData();
    if (body.title) form.append('title', body.title);
    if (body.changeNote) form.append('changeNote', body.changeNote);
    if (body.status) form.append('status', body.status);
    if (body.content !== undefined) form.append('content', body.content || '');
    if (pdf) form.append('pdf', pdf, pdf.name);
    return this.http.patch<QmsDocument>(`${this.base}/documents/${id}`, form);
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

  // Document Shares (auth required)
  listShares(documentId: string): Observable<DocumentShare[]> {
    return this.http.get<DocumentShare[]>(
      `${this.base}/documents/${documentId}/shares`,
    );
  }
  createShare(
    documentId: string,
    body: { expiresInDays?: number; label?: string },
  ): Observable<CreateShareResponse> {
    return this.http.post<CreateShareResponse>(
      `${this.base}/documents/${documentId}/shares`,
      body,
    );
  }
  revokeShare(id: string): Observable<DocumentShare> {
    return this.http.delete<DocumentShare>(
      `${this.base}/documents/shares/${id}`,
    );
  }

  // Public share viewer (no auth)
  getPublicShare(token: string): Observable<PublicShareView> {
    return this.http.get<PublicShareView>(
      `${this.base}/public/shares/${encodeURIComponent(token)}`,
    );
  }
  publicDownloadUrl(token: string, attachmentId: string): string {
    return `${this.base}/public/shares/${encodeURIComponent(token)}/attachments/${attachmentId}/download`;
  }

  // Audit Logs
  listAuditLogs(filters?: {
    entity?: string;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<AuditLog[]> {
    const params: Record<string, string> = {};
    if (filters?.entity) params['entity'] = filters.entity;
    if (filters?.action) params['action'] = filters.action;
    if (filters?.userId) params['userId'] = filters.userId;
    if (filters?.startDate) params['startDate'] = filters.startDate;
    if (filters?.endDate) params['endDate'] = filters.endDate;
    return this.http.get<AuditLog[]>(`${this.base}/audit-logs`, { params });
  }

  // Audit Schedules
  listAuditSchedules(): Observable<AuditSchedule[]> {
    return this.http.get<AuditSchedule[]>(`${this.base}/audit-schedules`);
  }
  getAuditSchedule(id: string): Observable<AuditSchedule> {
    return this.http.get<AuditSchedule>(`${this.base}/audit-schedules/${id}`);
  }
  createAuditSchedule(body: unknown): Observable<AuditSchedule> {
    return this.http.post<AuditSchedule>(`${this.base}/audit-schedules`, body);
  }
  updateAuditSchedule(
    id: string,
    body: unknown,
  ): Observable<AuditSchedule> {
    return this.http.patch<AuditSchedule>(
      `${this.base}/audit-schedules/${id}`,
      body,
    );
  }
  deleteAuditSchedule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/audit-schedules/${id}`);
  }
  updateChecklistItem(
    itemId: string,
    body: unknown,
  ): Observable<AuditChecklistItem> {
    return this.http.patch<AuditChecklistItem>(
      `${this.base}/audit-schedules/checklist-items/${itemId}`,
      body,
    );
  }
  addAuditFinding(
    auditId: string,
    body: unknown,
  ): Observable<AuditFinding> {
    return this.http.post<AuditFinding>(
      `${this.base}/audit-schedules/${auditId}/findings`,
      body,
    );
  }
  closeAuditFinding(findingId: string): Observable<AuditFinding> {
    return this.http.post<AuditFinding>(
      `${this.base}/audit-schedules/findings/${findingId}/close`,
      {},
    );
  }

  // Dashboard
  getDashboardKpis(): Observable<DashboardKpis> {
    return this.http.get<DashboardKpis>(`${this.base}/dashboard/kpis`);
  }
  getDashboardCharts(): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.base}/dashboard/charts`);
  }
  getDashboardTasks(): Observable<DashboardTask[]> {
    return this.http.get<DashboardTask[]>(`${this.base}/dashboard/tasks`);
  }

  // Settings
  getAccountSettings(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.base}/settings/account`);
  }
  updateAccountSettings(body: {
    firstName?: string;
    lastName?: string;
  }): Observable<AuthUser> {
    return this.http.patch<AuthUser>(`${this.base}/settings/account`, body);
  }
  changePassword(body: {
    currentPassword: string;
    newPassword: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/settings/account/change-password`,
      body,
    );
  }
  getOrgSettings(): Observable<Organization> {
    return this.http.get<Organization>(`${this.base}/settings/org`);
  }
  updateOrgSettings(body: {
    name?: string;
    description?: string;
  }): Observable<Organization> {
    return this.http.patch<Organization>(`${this.base}/settings/org`, body);
  }
  getOrgUsers(): Observable<UserRecord[]> {
    return this.http.get<UserRecord[]>(`${this.base}/settings/org/users`);
  }
  updateUserRole(userId: string, role: string): Observable<UserRecord> {
    return this.http.patch<UserRecord>(
      `${this.base}/settings/org/users/${userId}/role`,
      { role },
    );
  }
  suspendUser(userId: string): Observable<UserRecord> {
    return this.http.post<UserRecord>(
      `${this.base}/settings/org/users/${userId}/suspend`,
      {},
    );
  }
  reactivateUser(userId: string): Observable<UserRecord> {
    return this.http.post<UserRecord>(
      `${this.base}/settings/org/users/${userId}/reactivate`,
      {},
    );
  }

  // Exports
  exportCsvUrl(module: string): string {
    return `${this.base}/exports/${module}/csv`;
  }
  exportJson(module: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/exports/${module}/json`);
  }
}
