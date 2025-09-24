import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VnDatePipe } from '../../pipes/vn-date.pipe';
import { HolidaysService, HolidayItem, PagedHolidays } from '../../services/holidays.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-holidays',
  standalone: true,
  imports: [CommonModule, FormsModule, VnDatePipe],
  templateUrl: './holidays-management.component.html',
  styleUrls: ['./holidays-management.component.scss']
})
export class HolidaysComponent implements OnInit {
  items: HolidayItem[] = [];
  page = 1;
  pageSize = 8;
  totalPages = 1;
  totalItems = 0;
  filterName = '';

  editing: HolidayItem | null = null;
  editorErrors: Record<string, string> = {};
  confirmDeleteId: number | null = null;

  constructor(private svc: HolidaysService, private toast: ToastService) {}

  ngOnInit(): void { this.load(1); }

  load(page: number) {
    this.page = page;
    this.svc.getAll({ ten: this.filterName, page: this.page, pageSize: this.pageSize }).subscribe({
      next: (v: PagedHolidays) => {
        this.items = v.items || [];
        this.page = v.page || 1;
        this.pageSize = v.pageSize || this.pageSize;
        this.totalItems = v.totalItems || 0;
        this.totalPages = v.totalPages || 1;
      },
      error: () => this.toast.show('Lấy danh sách ngày lễ thất bại', 'error')
    });
  }

  startEdit(h?: HolidayItem) {
    this.editorErrors = {};
    if (!h) { this.editing = { tenNgayLe: '', ngayBatDau: '', ngayKetThuc: '' }; return; }
    this.editing = { id: h.id, tenNgayLe: h.tenNgayLe, ngayBatDau: h.ngayBatDau, ngayKetThuc: h.ngayKetThuc };
  }

  cancelEdit() { this.editing = null; this.editorErrors = {}; }

  save() {
    if (!this.editing) return;
    this.editorErrors = {};
    if (this.editing.id) {
      this.svc.update(this.editing.id!, this.editing).subscribe({ next: () => { this.toast.show('Cập nhật thành công', 'success'); this.editing = null; this.load(this.page); }, error: (err) => {
        if (err && err.status === 400 && err.error && err.error.errors) { const errors = err.error.errors; Object.keys(errors).forEach(k=> this.editorErrors[k]= (errors[k].join?errors[k].join(', '): String(errors[k]))); return; }
        if (err && err.status === 404) { this.toast.show('Không tìm thấy', 'info'); this.load(this.page); this.editing = null; return; }
        this.toast.show('Cập nhật thất bại', 'error');
      } });
    } else {
      this.svc.create(this.editing).subscribe({ next: () => { this.toast.show('Thêm thành công', 'success'); this.editing = null; this.load(1); }, error: (err) => {
        if (err && err.status === 400 && err.error && err.error.errors) { const errors = err.error.errors; Object.keys(errors).forEach(k=> this.editorErrors[k]= (errors[k].join?errors[k].join(', '): String(errors[k]))); return; }
        this.toast.show('Thêm thất bại', 'error');
      } });
    }
  }

  requestDelete(id: number) { this.confirmDeleteId = id; }
  cancelDelete() { this.confirmDeleteId = null; }
  confirmDelete() { if (!this.confirmDeleteId) return; const id = this.confirmDeleteId; this.svc.delete(id).subscribe({ next: () => { this.toast.show('Xóa thành công', 'success'); this.confirmDeleteId = null; this.load(this.page); }, error: (err) => { if (err && err.status === 404) { this.toast.show('Không tìm thấy', 'info'); this.confirmDeleteId = null; this.load(this.page); return; } this.toast.show('Xóa thất bại', 'error'); } }); }
}
