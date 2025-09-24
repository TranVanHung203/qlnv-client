import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { apiUrl } from '../config/api.constants';

export interface NotificationItem {
  id: number;
  nhanVienId?: number;
  emailNhan?: string;
  ngayGui: string; // ISO
  lyDo?: string;
  tenNhanVien?: string;
}

export interface PagedNotifications {
  items: NotificationItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private base = apiUrl('/api/ThongBao');

  constructor(private http: HttpClient, private auth: AuthService) {}

  private authHeaders(): { headers?: HttpHeaders } {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return { headers };
  }

  getAll(filter?: { nhanVienId?: number; emailNhan?: string; from?: string; to?: string; page?: number; pageSize?: number }): Observable<PagedNotifications> {
    let params = new HttpParams();
    if (filter?.nhanVienId != null) params = params.set('nhanVienId', String(filter.nhanVienId));
    if (filter?.emailNhan) params = params.set('emailNhan', filter.emailNhan);
    if (filter?.from) params = params.set('from', filter.from);
    if (filter?.to) params = params.set('to', filter.to);
    params = params.set('page', String(filter?.page ?? 1));
    params = params.set('pageSize', String(filter?.pageSize ?? 20));

    return this.http.get<PagedNotifications>(this.base, { ...this.authHeaders(), params }).pipe(
      catchError((err) => {
        if (err && err.status === 404) {
          const empty: PagedNotifications = { items: [], page: filter?.page || 1, pageSize: filter?.pageSize || 20, totalItems: 0, totalPages: 0 };
          return of(empty);
        }
        throw err;
      }),
    );
  }
}
