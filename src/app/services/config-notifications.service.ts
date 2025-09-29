import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { apiUrl } from '../config/api.constants';

export interface ConfigNotification {
  id?: number;
  soNgayThongBao: number;
  danhSachNamThongBao: string;
  isActive?: boolean;
  excludeSaturday: boolean;
  excludeSunday: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfigNotificationsService {
  private base = apiUrl('/api/CauHinhThongBao');

  constructor(private http: HttpClient, private auth: AuthService) {}

  getActive(): Observable<ConfigNotification | null> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<ConfigNotification>(`${this.base}/active`, { headers }).pipe(
      catchError((err) => {
        if (err && err.status === 404) {
          return of(null);
        }
        throw err;
      })
    );
  }

  getAll(): Observable<ConfigNotification[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<ConfigNotification[]>(`${this.base}/all`, { headers });
  }

  activate(id: number): Observable<void> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<void>(`${this.base}/${id}/activate`, {}, { headers });
  }

  create(payload: Partial<ConfigNotification>): Observable<ConfigNotification> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<ConfigNotification>(this.base, payload, { headers });
  }

  update(payload: ConfigNotification): Observable<ConfigNotification> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.put<ConfigNotification>(this.base, payload, { headers });
  }

  delete(id: number): Observable<void> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.delete<void>(`${this.base}/${id}`, { headers });
  }
}