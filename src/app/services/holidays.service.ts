import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { apiUrl } from '../config/api.constants';

export interface HolidayItem {
  id?: number;
  tenNgayLe: string;
  ngayBatDau: string; // ISO date string
  ngayKetThuc: string; // ISO date string
}

export interface PagedHolidays {
  items: HolidayItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class HolidaysService {
  private base = apiUrl('/api/NgayLe');

  constructor(private http: HttpClient, private auth: AuthService) {}

  private authHeaders(): { headers?: HttpHeaders } {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return { headers };
  }

  getAll(filter?: { ten?: string; page?: number; pageSize?: number }): Observable<PagedHolidays> {
    let params = new HttpParams();
    if (filter?.ten) params = params.set('ten', filter.ten);
    if (filter?.page) params = params.set('page', String(filter.page));
    if (filter?.pageSize) params = params.set('pageSize', String(filter.pageSize));
    return this.http.get<PagedHolidays>(this.base, { ...this.authHeaders(), params }).pipe(
      catchError((err) => {
        if (err && err.status === 404) {
          const empty: PagedHolidays = { items: [], page: filter?.page || 1, pageSize: filter?.pageSize || 8, totalItems: 0, totalPages: 1 };
          return of(empty);
        }
        throw err;
      })
    );
  }

  create(payload: Partial<HolidayItem>): Observable<HolidayItem> {
    return this.http.post<HolidayItem>(this.base, payload, this.authHeaders());
  }

  update(id: number, payload: HolidayItem): Observable<HolidayItem> {
    return this.http.put<HolidayItem>(`${this.base}/${id}`, payload, this.authHeaders());
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, this.authHeaders());
  }
}
