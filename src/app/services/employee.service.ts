import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { apiUrl } from '../config/api.constants';

export interface Employee {
  id?: number;
  ten: string;
  email: string;
  soDienThoai: string;
  diaChi: string;
  ngayVaoLam: string;
}

export interface EmployeeResponse {
  items: Employee[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = apiUrl('/api/NhanVien');

  constructor(private http: HttpClient, private auth: AuthService) {}

  // Lấy danh sách nhân viên (có phân trang + lọc)
  getEmployees(page: number, pageSize: number, ten: string, soDienThoai: string): Observable<EmployeeResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    if (ten) {
      params = params.set('ten', ten);
    }
    if (soDienThoai) {
      params = params.set('soDienThoai', soDienThoai);
    }

    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<EmployeeResponse>(this.apiUrl, { params, headers });
  }

  // Thêm nhân viên mới
  addEmployee(employee: Employee): Observable<Employee> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<Employee>(this.apiUrl, employee, { headers });
  }

  // Cập nhật nhân viên
  updateEmployee(id: number, employee: Employee): Observable<Employee> {
    const url = `${this.apiUrl}/${id}`;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.put<Employee>(url, employee, { headers });
  }

  // Xóa nhân viên
  deleteEmployee(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.delete<void>(url, { headers });
  }
}
