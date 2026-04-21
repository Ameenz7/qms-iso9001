import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuditLog,
  Capa,
  NonConformity,
  Organization,
  QmsDocument,
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

  // Audit Logs
  listAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.base}/audit-logs`);
  }
}
