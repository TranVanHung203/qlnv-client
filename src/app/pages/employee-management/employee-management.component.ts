import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VnDatePipe } from '../../pipes/vn-date.pipe';
import { EmployeeService, Employee, ContractHistory } from '../../services/employee.service';
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
  searchStatus: 'all' | 'active' | 'inactive' = 'active'; // lọc trạng thái
  loading = false;

  newEmployee: Employee = {
    ten: '',
    email: '',
    soDienThoai: '',
    diaChi: '',
    ngayVaoLam: null,
    ngaySinh: '',
    ngayLamViecChinhThuc: null,
    ngayKetThucThuViec: null,
    ngayKetThucHopDong: null,
    loaiHopDong: 'vothoihan',
    soThangHopDong: 0,
    isDeleted: false
  };

  addFormErrors: { [k: string]: string } = {};
  editFormErrors: { [k: string]: string } = {};

  popupType: 'add' | 'edit' | 'toggle-status' | 'import-excel' | 'contract-history' | '' = '';
  popupTitle: string = '';
  editingId: number | null = null;
  editModel: Employee | null = null;
  toggleStatusId: number | null = null;
  toggleStatusEmployee: Employee | null = null;

  // Contract history state
  contractHistory: ContractHistory[] = [];
  contractHistoryEmployee: Employee | null = null;
  contractHistoryLoading = false;

  // Excel import state
  importFile: File | null = null;
  importLoading = false;
  importResult: {
    totalRows: number;
    successCount: number;
    failedCount: number;
    errors: Array<{
      row: number;
      error: string;
      data: string;
    }>;
  } | null = null;

  constructor(private employeeService: EmployeeService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadEmployees();
  }

  // Getter for stats
  get activeEmployees(): number { return this.employees.filter(emp => !emp.isDeleted).length; }
  get inactiveEmployees(): number { return this.employees.filter(emp => emp.isDeleted).length; }

  // Global stats (không phụ thuộc vào trang hiện tại / filter)
  totalAllEmployees = 0;
  totalActiveEmployees = 0;
  totalInactiveEmployees = 0;

  loadStats(): void {
    // Dùng pageSize=1 để lấy tổng số nhanh mà không tải nhiều dữ liệu
    this.employeeService.getEmployees(1, 1, '', '', undefined).subscribe({
      next: res => this.totalAllEmployees = res.totalItems
    });
    this.employeeService.getEmployees(1, 1, '', '', false).subscribe({
      next: res => this.totalActiveEmployees = res.totalItems
    });
    this.employeeService.getEmployees(1, 1, '', '', true).subscribe({
      next: res => this.totalInactiveEmployees = res.totalItems
    });
  }

  clearSearch(): void {
    this.searchTen = '';
    this.searchSoDienThoai = '';
    this.searchStatus = 'active';
    this.onSearch();
  }

  loadEmployees(): void {
    this.loading = true;
    let isDeletedParam: boolean | undefined = undefined;
    if (this.searchStatus === 'active') isDeletedParam = false;
    else if (this.searchStatus === 'inactive') isDeletedParam = true;
    this.employeeService.getEmployees(this.page, this.pageSize, this.searchTen, this.searchSoDienThoai, isDeletedParam)
      .subscribe({
        next: (res) => {
          this.employees = res.items;
          this.page = res.page;
          this.pageSize = res.pageSize;
          this.totalPages = res.totalPages;
          this.totalItems = res.totalItems; // số lượng theo filter hiện tại
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
    this.newEmployee = { 
      ten: '', 
      email: '', 
      soDienThoai: '', 
      diaChi: '', 
      ngayVaoLam: null, 
      ngaySinh: '', 
      ngayLamViecChinhThuc: null,
      ngayKetThucThuViec: null,
      ngayKetThucHopDong: null,
      loaiHopDong: 'vothoihan',
      soThangHopDong: 0,
      isDeleted: false 
    };
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
    this.editModel = { 
      ...emp,
      ngayVaoLam: this.formatDateForInput(emp.ngayVaoLam),
      ngaySinh: this.formatDateForInput(emp.ngaySinh),
      ngayLamViecChinhThuc: this.formatDateForInput(emp.ngayLamViecChinhThuc)
    };
    this.editFormErrors = {};
  }

  openToggleStatusPopup(emp: Employee): void {
    if (!emp.id) {
      this.toast.show('Không tìm thấy ID nhân viên', 'error');
      return;
    }
    this.popupType = 'toggle-status';
    this.toggleStatusEmployee = emp;
    this.toggleStatusId = emp.id;
    if (emp.isDeleted) {
      this.popupTitle = 'Khôi phục nhân viên';
    } else {
      this.popupTitle = 'Chuyển nhân viên nghỉ việc';
    }
  }

  closePopup(): void {
    this.popupType = '';
    this.popupTitle = '';
    this.editingId = null;
    this.editModel = null;
    this.toggleStatusId = null;
    this.toggleStatusEmployee = null;
    this.addFormErrors = {};
    this.editFormErrors = {};
    this.importFile = null;
    this.importLoading = false;
    this.importResult = null;
    this.contractHistory = [];
    this.contractHistoryEmployee = null;
    this.contractHistoryLoading = false;
  }

  openContractHistory(emp: Employee): void {
    if (!emp.id) {
      this.toast.show('Không tìm thấy ID nhân viên', 'error');
      return;
    }
    this.popupType = 'contract-history';
    this.popupTitle = `Lịch sử hợp đồng - ${emp.ten}`;
    this.contractHistoryEmployee = emp;
    this.contractHistoryLoading = true;
    this.contractHistory = [];

    this.employeeService.getContractHistory(emp.id).subscribe({
      next: (data) => {
        this.contractHistory = data;
        this.contractHistoryLoading = false;
      },
      error: (err) => {
        this.toast.show('Không thể tải lịch sử hợp đồng: ' + parseApiError(err), 'error');
        this.contractHistoryLoading = false;
      }
    });
  }

  formatContractType(type: string): string {
    switch (type) {
      case 'vothoihan': return 'Vô thời hạn';
      case '1nam': return '1 năm';
      case 'khac': return 'Khác';
      default: return type;
    }
  }

  formatContractNote(note: string): string {
    if (!note) return '';
    // Parse: "Thay đổi từ 1nam (12 tháng) sang khac (1 tháng)"
    const match = note.match(/Thay đổi từ (\w+) \((\d+) tháng\) sang (\w+) \((\d+) tháng\)/);
    if (match) {
      const [, oldType, oldMonths, newType, newMonths] = match;
      const oldTypeFormatted = this.formatContractType(oldType);
      const newTypeFormatted = this.formatContractType(newType);
      
      // Nếu là vô thời hạn (999 tháng) thì không hiển thị phần trong ngoặc
      const oldDisplay = oldMonths === '999' ? oldTypeFormatted : `${oldTypeFormatted} (${oldMonths} tháng)`;
      const newDisplay = newMonths === '999' ? newTypeFormatted : `${newTypeFormatted} (${newMonths} tháng)`;
      
      return `${oldDisplay} → ${newDisplay}`;
    }
    return note;
  }

  addEmployee(): void {
    this.addFormErrors = {};
    const ve = this.validateEmployee(this.newEmployee);
    if (Object.keys(ve).length) {
      this.addFormErrors = ve;
      this.toast.show('Vui lòng sửa các trường bị lỗi', 'warning');
      return;
    }

    const employeeData = this.prepareEmployeeData(this.newEmployee);
    this.employeeService.addEmployee(employeeData).subscribe({
      next: () => {
        this.toast.show('Thêm nhân viên thành công!', 'success');
        this.closePopup();
        this.loadStats();
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
    const employeeData = this.prepareEmployeeData(this.editModel);
    this.employeeService.updateEmployee(this.editingId, employeeData).subscribe({
      next: () => {
        this.closePopup();
        this.toast.show('Cập nhật thành công', 'success');
        this.loadStats();
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

  toggleEmployeeStatus(): void {
    if (!this.toggleStatusId || !this.toggleStatusEmployee) {
      this.toast.show('Không tìm thấy thông tin nhân viên', 'error');
      return;
    }

    const isCurrentlyDeleted = this.toggleStatusEmployee.isDeleted;
    const serviceCall = isCurrentlyDeleted 
      ? this.employeeService.restoreEmployee(this.toggleStatusId)
      : this.employeeService.deleteEmployee(this.toggleStatusId);

    const successMessage = isCurrentlyDeleted 
      ? 'Khôi phục nhân viên thành công' 
      : 'Đã chuyển nhân viên sang trạng thái nghỉ việc';

    serviceCall.subscribe({
      next: () => {
        this.toast.show(successMessage, 'success');
        this.closePopup();
        this.loadStats();
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
    // Email không bắt buộc, nhưng nếu có thì phải hợp lệ
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (emp.email && emp.email.trim() && !emailRegex.test(emp.email)) {
      errors['email'] = 'Email không hợp lệ';
    }
    // Số điện thoại không bắt buộc, nhưng nếu có thì phải đúng 10 số
    if (emp.soDienThoai && emp.soDienThoai.trim() && !/^\d{10}$/.test(emp.soDienThoai)) {
      errors['soDienThoai'] = 'Số điện thoại phải là 10 chữ số';
    }
    // Địa chỉ không bắt buộc
    // Ngày vào làm có thể để trống
    if (emp.ngayVaoLam && emp.ngayVaoLam !== '') {
      const d = new Date(emp.ngayVaoLam);
      if (isNaN(d.getTime())) errors['ngayVaoLam'] = 'Ngày vào làm không hợp lệ';
    }
    if (!emp.ngaySinh) {
      errors['ngaySinh'] = 'Ngày sinh không được để trống';
    } else {
      const d = new Date(emp.ngaySinh);
      if (isNaN(d.getTime())) errors['ngaySinh'] = 'Ngày sinh không hợp lệ';
    }
    // Ngày làm việc chính thức có thể để trống
    if (emp.ngayLamViecChinhThuc && emp.ngayLamViecChinhThuc !== '') {
      const d = new Date(emp.ngayLamViecChinhThuc);
      if (isNaN(d.getTime())) errors['ngayLamViecChinhThuc'] = 'Ngày làm việc chính thức không hợp lệ';
    }
    // Ngày kết thúc thử việc có thể để trống
    if (emp.ngayKetThucThuViec && emp.ngayKetThucThuViec !== '') {
      const d = new Date(emp.ngayKetThucThuViec);
      if (isNaN(d.getTime())) errors['ngayKetThucThuViec'] = 'Ngày kết thúc thử việc không hợp lệ';
    }
    // Ngày kết thúc hợp đồng có thể để trống
    if (emp.ngayKetThucHopDong && emp.ngayKetThucHopDong !== '') {
      const d = new Date(emp.ngayKetThucHopDong);
      if (isNaN(d.getTime())) errors['ngayKetThucHopDong'] = 'Ngày kết thúc hợp đồng không hợp lệ';
    }
    // Loại hợp đồng
    if (!emp.loaiHopDong) {
      errors['loaiHopDong'] = 'Vui lòng chọn loại hợp đồng';
    }
    // Số tháng hợp đồng khi chọn "khác"
    if (emp.loaiHopDong === 'khac') {
      if (!emp.soThangHopDong || emp.soThangHopDong <= 0) {
        errors['soThangHopDong'] = 'Số tháng hợp đồng phải lớn hơn 0';
      }
    }
    return errors;
  }

  prepareEmployeeData(emp: Employee): Employee {
    return {
      ...emp,
      ngayVaoLam: emp.ngayVaoLam === '' ? null : emp.ngayVaoLam,
      ngayLamViecChinhThuc: emp.ngayLamViecChinhThuc === '' ? null : emp.ngayLamViecChinhThuc,
      ngayKetThucThuViec: emp.ngayKetThucThuViec === '' ? null : emp.ngayKetThucThuViec,
      ngayKetThucHopDong: emp.ngayKetThucHopDong === '' ? null : emp.ngayKetThucHopDong,
      soThangHopDong: emp.loaiHopDong === 'khac' ? emp.soThangHopDong : 0
    };
  }

  formatDateForInput(dateStr: string | null): string {
    if (!dateStr || dateStr === '-') return '';
    
    // Nếu đã là định dạng yyyy-mm-dd thì return luôn
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Nếu là định dạng dd/mm/yyyy thì chuyển đổi
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const parts = dateStr.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    // Thử parse date và format lại
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return '';
  }

  // ===== Excel Template & Import =====
  downloadTemplate(): void {
    this.employeeService.downloadExcelTemplate().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'NhanVien_Template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.show('Tải template thành công', 'success');
      },
      error: (err) => {
        this.toast.show('Lỗi tải template: ' + parseApiError(err), 'error');
      }
    });
  }

  openImportExcel(): void {
    this.popupType = 'import-excel';
    this.popupTitle = 'Import nhân viên từ Excel';
    this.importFile = null;
    this.importResult = null;
  }

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (file.type && !allowed.includes(file.type)) {
      this.toast.show('Chỉ chấp nhận file Excel (.xlsx, .xls)', 'error');
      input.value = '';
      return;
    }
    this.importFile = file;
  }

  importExcel(): void {
    if (!this.importFile) {
      this.toast.show('Vui lòng chọn file Excel', 'warning');
      return;
    }
    this.importLoading = true;
    this.importResult = null;
    this.employeeService.importExcel(this.importFile).subscribe({
      next: (response) => {
        // Check if response has data property with import details
        if (response?.data) {
          this.importResult = {
            totalRows: response.data.totalRows || 0,
            successCount: response.data.successCount || 0,
            failedCount: response.data.failedCount || 0,
            errors: response.data.errors || []
          };

          if (this.importResult.successCount > 0 && this.importResult.failedCount === 0) {
            this.toast.show(`Import thành công ${this.importResult.successCount} nhân viên`, 'success');
            this.loadEmployees();
            setTimeout(() => this.closePopup(), 2000);
          } else if (this.importResult.successCount > 0 && this.importResult.failedCount > 0) {
            this.toast.show(
              `Import hoàn tất: ${this.importResult.successCount} thành công, ${this.importResult.failedCount} thất bại`,
              'warning'
            );
            this.loadEmployees();
          } else {
            this.toast.show(
              `Import thất bại: ${this.importResult.failedCount} lỗi. Xem chi tiết bên dưới.`,
              'error'
            );
          }
        } else {
          // Fallback for simple success response
          this.toast.show('Import thành công', 'success');
          this.loadEmployees();
          this.closePopup();
        }
      },
      error: (err) => {
        // Check if error response has structured import result
        if (err?.error?.data) {
          this.importResult = {
            totalRows: err.error.data.totalRows || 0,
            successCount: err.error.data.successCount || 0,
            failedCount: err.error.data.failedCount || 0,
            errors: err.error.data.errors || []
          };
          this.toast.show(err.error.message || 'Có lỗi trong quá trình import', 'error');
        } else {
          this.toast.show('Lỗi import: ' + parseApiError(err), 'error');
        }
      },
      complete: () => {
        this.importLoading = false;
      }
    });
  }
}