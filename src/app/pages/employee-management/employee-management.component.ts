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
  loading = false;   // 👈 thêm biến loading

  newEmployee: Employee = {
    ten: '',
    email: '',
    soDienThoai: '',
    diaChi: '',
    ngayVaoLam: ''
  };

  // client-side form errors
  addFormErrors: { [k: string]: string } = {};
  editFormErrors: { [k: string]: string } = {};

  // Edit state
  editingId: number | null = null;
  editModel: Employee | null = null;
  // Delete confirmation
  confirmDeleteId: number | null = null;

  constructor(private employeeService: EmployeeService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading = true; // 👈 bật loading
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
          this.loading = false; // 👈 tắt loading
        }
      });
  }


  onSearch(): void {
    this.page = 1;
    this.loadEmployees();
  }

  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
      this.loadEmployees();
    }
  }

  onPrevPage(): void {
    this.onPageChange(this.page - 1);
  }

  onNextPage(): void {
    this.onPageChange(this.page + 1);
  }

  addEmployee(): void {
    this.addFormErrors = {};
    const ve = this.validateEmployee(this.newEmployee);
    if (Object.keys(ve).length) {
      this.addFormErrors = ve;
      this.toast.show('Vui lòng sửa các trường bị lỗi', 'warning');
      return;
    }

    this.employeeService.addEmployee(this.newEmployee).subscribe(() => {
      this.toast.show('Thêm nhân viên thành công!', 'success');
      this.newEmployee = { ten: '', email: '', soDienThoai: '', diaChi: '', ngayVaoLam: '' };
      this.loadEmployees();
    }, (err) => {
      const msg = parseApiError(err);
      // map field errors to inline errors if available
      if (err?.error?.errors) {
        for (const k of Object.keys(err.error.errors)) {
          this.addFormErrors[k] = err.error.errors[k].join('; ');
        }
      }
      this.toast.show(msg, 'error');
    });
  }

  startEdit(emp: Employee) {
    this.editingId = emp.id ?? null;
    // make a shallow copy
    this.editModel = { ...emp };
  }

  cancelEdit() {
    this.editingId = null;
    this.editModel = null;
  }

  saveEdit() {
    if (!this.editingId || !this.editModel) return;
    // client-side validate
    this.editFormErrors = {};
    const ve = this.validateEmployee(this.editModel);
    if (Object.keys(ve).length) {
      this.editFormErrors = ve;
      this.toast.show('Vui lòng sửa các trường bị lỗi', 'warning');
      return;
    }
    this.employeeService.updateEmployee(this.editingId, this.editModel).subscribe(() => {
      this.editingId = null;
      this.editModel = null;
      this.toast.show('Cập nhật thành công', 'success');
      this.loadEmployees();
    }, (err) => { console.error(err); 
      // map server-side date/required errors to inline
      const msg = parseApiError(err);
      if (err?.error?.errors) {
        for (const k of Object.keys(err.error.errors)) {
          this.editFormErrors[k] = err.error.errors[k].join('; ');
        }
      } else if (typeof msg === 'string' && msg.includes('Ngày vào làm')) {
        this.editFormErrors['ngayVaoLam'] = msg;
      }
      this.toast.show(msg, 'error');
    });
  }

  validateEmployee(emp: Employee): { [k: string]: string } {
    const errors: { [k: string]: string } = {};
    if (!emp.ten || !emp.ten.trim()) errors['ten'] = 'Tên không được để trống';
    if (!emp.email || !emp.email.trim()) errors['email'] = 'Email không được để trống';
    // basic email regex
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (emp.email && !emailRegex.test(emp.email)) errors['email'] = 'Email không hợp lệ';
    // phone: required and 10 digits
    if (!emp.soDienThoai || !emp.soDienThoai.trim()) {
      errors['soDienThoai'] = 'Số điện thoại không được để trống';
    } else if (!/^\d{10}$/.test(emp.soDienThoai)) {
      errors['soDienThoai'] = 'Số điện thoại phải là 10 chữ số';
    }
    // address required
    if (!emp.diaChi || !emp.diaChi.trim()) errors['diaChi'] = 'Địa chỉ không được để trống';
    // validate date: required and must be valid
    if (!emp.ngayVaoLam) {
      errors['ngayVaoLam'] = 'Ngày vào làm không được để trống';
    } else {
      const d = new Date(emp.ngayVaoLam);
      if (isNaN(d.getTime())) errors['ngayVaoLam'] = 'Ngày vào làm không hợp lệ';
    }
    return errors;
  }

  // open confirmation modal
  openConfirmDelete(id?: number) {
    if (!id) return;
    this.confirmDeleteId = id;
  }

  cancelConfirm() {
    this.confirmDeleteId = null;
  }

  confirmDelete() {
    const id = this.confirmDeleteId;
    if (!id) return;
    this.employeeService.deleteEmployee(id).subscribe(() => {
      this.toast.show('Xóa nhân viên thành công', 'success');
      this.confirmDeleteId = null;
      this.loadEmployees();
    }, (err) => { console.error(err); this.toast.show(parseApiError(err), 'error'); this.confirmDeleteId = null; });
  }
}
