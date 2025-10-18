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
  ngaySinh: string;
  ngayLamViecChinhThuc: string | null;
  isDeleted?: boolean;
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
  getEmployees(
    page: number,
    pageSize: number,
    ten: string,
    soDienThoai: string,
    isDeleted?: boolean | null
  ): Observable<EmployeeResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    if (ten) {
      params = params.set('ten', ten);
    }
    if (soDienThoai) {
      params = params.set('sdt', soDienThoai);
    }
    // Only send isDeleted if it's explicitly true or false
    if (isDeleted !== undefined && isDeleted !== null) {
      params = params.set('isDeleted', String(isDeleted));
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
    const url = `${this.apiUrl}/detail/${id}`;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.put<Employee>(url, employee, { headers });
  }

  // Thay đổi trạng thái nhân viên (xóa mềm)
  deleteEmployee(id: number): Observable<void> {
    const url = `${this.apiUrl}/detail/${id}`;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.delete<void>(url, { headers });
  }

  // Khôi phục nhân viên
  restoreEmployee(id: number): Observable<void> {
    const url = `${this.apiUrl}/restore/${id}`;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<void>(url, {}, { headers });
  }

  // Tải template Excel
  downloadExcelTemplate(): Observable<Blob> {
    const url = `${this.apiUrl}/excel-template`;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get(url, { headers, responseType: 'blob' });
  }

  // Import Excel
  importExcel(file: File): Observable<any> {
    const url = `${this.apiUrl}/import-excel`;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(url, formData, { headers });
  }
}
