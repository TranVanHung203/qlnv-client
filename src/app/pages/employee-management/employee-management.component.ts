import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VnDatePipe } from '../../pipes/vn-date.pipe';
import { EmployeeService, Employee } from '../../services/employee.service';
import { ToastService } from '../../shared/toast.service';
import { parseApiError } from '../../utils/error-parser';

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [CommonModule, FormsModule, VnDatePipe],
  templateUrl: './employee-management.component.html',
  styleUrls: ['./employee-management.component.scss']
})
export class EmployeeManagementComponent implements OnInit {
  employees: Employee[] = [];
  page = 1;
  pageSize = 5;
  totalPages = 1;
  totalItems = 0;
  searchTen = '';
  searchSoDienThoai = '';
  loading = false;

  newEmployee: Employee = {
    ten: '',
    email: '',
    soDienThoai: '',
    diaChi: '',
    ngayVaoLam: ''
  };

  addFormErrors: { [k: string]: string } = {};
  editFormErrors: { [k: string]: string } = {};

  popupType: 'add' | 'edit' | 'delete' | '' = '';
  popupTitle: string = '';
  editingId: number | null = null;
  editModel: Employee | null = null;
  confirmDeleteId: number | null = null;

  constructor(private employeeService: EmployeeService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading = true;
    this.employeeService.getEmployees(this.page, this.pageSize, this.searchTen, this.searchSoDienThoai)
      .subscribe({
        next: (res) => {
          this.employees = res.items;
          this.page = res.page;
          this.pageSize = res.pageSize;
          this.totalPages = res.totalPages;
          this.totalItems = res.totalItems;
        },
        error: (err) => {
          console.error(err);
          const msg = parseApiError(err);
          this.toast.show(msg, 'error');
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  onSearch(): void {
    this.page = 1;
    this.loadEmployees();
  }

  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage
      this.loadEmployees();
    }
  }

  onPrevPage(): void {
    this.onPageChange(this.page - 1);
  }

  onNextPage(): void {
    this.onPageChange(this.page + 1);
  }

  openAddPopup(): void {
    this.popupType = 'add';
    this.popupTitle = 'Thêm nhân viên mới';
    this.newEmployee = { ten: '', email: '', soDienThoai: '', diaChi: '', ngayVaoLam: '' };
    this.addFormErrors = {};
  }

  openEditPopup(emp: Employee): void {
    if (!emp.id) {
      this.toast.show('Không tìm thấy ID nhân viên', 'error');
      return;
    }
    this.popupType = 'edit';
    this.popupTitle = 'Sửa thông tin nhân viên';
    this.editingId = emp.id;
    this.editModel = { ...emp };
    this.editFormErrors = {};
  }

  openDeletePopup(id?: number): void {
    if (!id) {
      this.toast.show('Không tìm thấy ID nhân viên', 'error');
      return;
    }
    this.popupType = 'delete';
    this.popupTitle = 'Xác nhận xóa';
    this.confirmDeleteId = id;
  }

  closePopup(): void {
    this.popupType = '';
    this.popupTitle = '';
    this.editingId = null;
    this.editModel = null;
    this.confirmDeleteId = null;
    this.addFormErrors = {};
    this.editFormErrors = {};
  }

  addEmployee(): void {
    this.addFormErrors = {};
    const ve = this.validateEmployee(this.newEmployee);
    if (Object.keys(ve).length) {
      this.addFormErrors = ve;
      this.toast.show('Vui lòng sửa các trường bị lỗi', 'warning');
      return;
    }

    this.employeeService.addEmployee(this.newEmployee).subscribe({
      next: () => {
        this.toast.show('Thêm nhân viên thành công!', 'success');
        this.closePopup();
        this.loadEmployees();
      },
      error: (err) => {
        const msg = parseApiError(err);
        if (err?.error?.errors) {
          for (const k of Object.keys(err.error.errors)) {
            this.addFormErrors[k] = err.error.errors[k].join('; ');
          }
        }
        this.toast.show(msg, 'error');
      }
    });
  }

  saveEdit(): void {
    if (!this.editingId || !this.editModel) {
      this.toast.show('Dữ liệu sửa không hợp lệ', 'error');
      return;
    }
    this.editFormErrors = {};
    const ve = this.validateEmployee(this.editModel);
    if (Object.keys(ve).length) {
      this.editFormErrors = ve;
      this.toast.show('Vui lòng sửa các trường bị lỗi', 'warning');
      return;
    }
    this.employeeService.updateEmployee(this.editingId, this.editModel).subscribe({
      next: () => {
        this.closePopup();
        this.toast.show('Cập nhật thành công', 'success');
        this.loadEmployees();
      },
      error: (err) => {
        const msg = parseApiError(err);
        if (err?.error?.errors) {
          for (const k of Object.keys(err.error.errors)) {
            this.editFormErrors[k] = err.error.errors[k].join('; ');
          }
        } else if (typeof msg === 'string' && msg.includes('Ngày vào làm')) {
          this.editFormErrors['ngayVaoLam'] = msg;
        }
        this.toast.show(msg, 'error');
      }
    });
  }

  confirmDelete(): void {
    if (!this.confirmDeleteId) {
      this.toast.show('Không tìm thấy ID nhân viên', 'error');
      return;
    }
    this.employeeService.deleteEmployee(this.confirmDeleteId).subscribe({
      next: () => {
        this.toast.show('Xóa nhân viên thành công', 'success');
        this.closePopup();
        this.loadEmployees();
      },
      error: (err) => {
        this.toast.show(parseApiError(err), 'error');
        this.closePopup();
      }
    });
  }

  validateEmployee(emp: Employee): { [k: string]: string } {
    const errors: { [k: string]: string } = {};
    if (!emp.ten || !emp.ten.trim()) errors['ten'] = 'Tên không được để trống';
    if (!emp.email || !emp.email.trim()) errors['email'] = 'Email không được để trống';
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (emp.email && !emailRegex.test(emp.email)) errors['email'] = 'Email không hợp lệ';
    if (!emp.soDienThoai || !emp.soDienThoai.trim()) {
      errors['soDienThoai'] = 'Số điện thoại không được để trống';
    } else if (!/^\d{10}$/.test(emp.soDienThoai)) {
      errors['soDienThoai'] = 'Số điện thoại phải là 10 chữ số';
    }
    if (!emp.diaChi || !emp.diaChi.trim()) errors['diaChi'] = 'Địa chỉ không được để trống';
    if (!emp.ngayVaoLam) {
      errors['ngayVaoLam'] = 'Ngày vào làm không được để trống';
    } else {
      const d = new Date(emp.ngayVaoLam);
      if (isNaN(d.getTime())) errors['ngayVaoLam'] = 'Ngày vào làm không hợp lệ';
    }
    return errors;
  }
}