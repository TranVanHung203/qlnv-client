import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { apiUrl } from '../config/api.constants';

export interface UserItem {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export interface PagedUsers {
  items: UserItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private base = apiUrl('/api/User');

  constructor(private http: HttpClient, private auth: AuthService) {}

  getAll(filter: { q?: string; page?: number; pageSize?: number } = {}): Observable<PagedUsers> {
    let params = new HttpParams();
    if (filter.q) params = params.set('q', filter.q);
    params = params.set('page', String(filter.page ?? 1));
    params = params.set('pageSize', String(filter.pageSize ?? 10));

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken() || ''}`,
    });

    return this.http
      .get<PagedUsers>(this.base, { params, headers })
      .pipe(
        catchError((err) => {
          // Treat 404 as empty page
          if (err && err.status === 404) {
            return of({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } as PagedUsers);
          }
          throw err;
        })
      );
  }

  create(payload: { username: string; email: string; password: string; fullName?: string; role?: string }) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken() || ''}`,
    });
    return this.http.post<UserItem>(this.base, payload, { headers });
  }

  update(id: string, payload: { fullName?: string; role?: string }) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken() || ''}`,
    });
    return this.http.put<UserItem>(`${this.base}/${id}`, payload, { headers });
  }

  delete(id: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken() || ''}`,
    });
    return this.http.delete<void>(`${this.base}/${id}`, { headers });
  }
}
