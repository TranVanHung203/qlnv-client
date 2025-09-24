import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { apiUrl } from '../config/api.constants';

export interface EmailItem {
  id?: number;
  email: string;
}

export interface PagedEmails {
  items: EmailItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class EmailsService {
  private base = apiUrl('/api/EmailThongBao');

  constructor(private http: HttpClient, private auth: AuthService) {}

  private authHeaders(): { headers?: HttpHeaders } {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return { headers };
  }

  getAll(filter?: { email?: string; page?: number; pageSize?: number }): Observable<PagedEmails> {
    let params = new HttpParams();
    if (filter?.email) params = params.set('email', filter.email);
    if (filter?.page) params = params.set('page', String(filter.page));
    if (filter?.pageSize) params = params.set('pageSize', String(filter.pageSize));
    return this.http.get<PagedEmails>(this.base, { ...this.authHeaders(), params }).pipe(
      catchError((err) => {
        // Treat 404 as "no results" (not an error)
        if (err && err.status === 404) {
          const empty: PagedEmails = { items: [], page: filter?.page || 1, pageSize: filter?.pageSize || 8, totalItems: 0, totalPages: 1 };
          return of(empty);
        }
        throw err;
      })
    );
  }

  create(payload: Partial<EmailItem>): Observable<EmailItem> {
    return this.http.post<EmailItem>(this.base, payload, this.authHeaders());
  }

  update(id: number, payload: EmailItem): Observable<EmailItem> {
    return this.http.put<EmailItem>(`${this.base}/${id}`, payload, this.authHeaders());
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, this.authHeaders());
  }
}
