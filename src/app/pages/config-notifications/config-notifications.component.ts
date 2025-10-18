import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigNotificationsService, ConfigNotification } from '../../services/config-notifications.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-config-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-notifications.component.html',
  styleUrls: ['./config-notifications.component.scss']
})
export class ConfigNotificationsComponent implements OnInit {
  active: ConfigNotification | null = null;
  all: ConfigNotification[] = [];
  listOpen = false;
  editing: ConfigNotification | null = null;
  editorErrors: Record<string, string> = {};
  confirmDeleteId: number | null = null;

  constructor(private svc: ConfigNotificationsService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadActive();
  }

  loadActive() {
    this.svc.getActive().subscribe({
      next: (v) => {
        this.active = v;
        if (v === null) {
          this.toast.show('Chưa có cấu hình thông báo đang sử dụng', 'info');
        }
      },
      error: (err) => this.toast.show('Không thể tải cấu hình đang sử dụng: ' + (err?.message || err), 'error')
    });
  }

  openList() {
    this.listOpen = true;
    this.svc.getAll().subscribe({
      next: (v) => (this.all = v),
      error: (e) => {
        this.toast.show('Lấy danh sách thất bại', 'error');
        this.listOpen = false;
      }
    });
  }

  startEdit(c?: ConfigNotification) {
    if (!c) {
      this.editing = { 
        soNgayThongBao: 1, 
        danhSachNamThongBao: '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20', 
        soNgayThongBaoTruoc: 365 
      };
      return;
    }
    this.editing = { 
      id: c.id, 
      soNgayThongBao: c.soNgayThongBao, 
      danhSachNamThongBao: '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20', 
      isActive: c.isActive,
      soNgayThongBaoTruoc: c.soNgayThongBaoTruoc 
    };
    this.listOpen = false;
  }

  cancelEdit() {
    this.editing = null;
    this.editorErrors = {};
  }

  validateEditing(): boolean {
    this.editorErrors = {};
    if (!this.editing) return false;
    if (!Number.isInteger(this.editing.soNgayThongBao) || this.editing.soNgayThongBao < 0) {
      this.editorErrors['soNgayThongBao'] = 'Số ngày phải là số nguyên không âm';
    }
    // Tự động set danh sách năm mặc định nếu không có
    if (!this.editing.danhSachNamThongBao || !this.editing.danhSachNamThongBao.trim()) {
      this.editing.danhSachNamThongBao = '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20';
    }
    if (!Number.isInteger(this.editing.soNgayThongBaoTruoc) || this.editing.soNgayThongBaoTruoc < 0) {
      this.editorErrors['soNgayThongBaoTruoc'] = 'Số ngày thông báo trước phải là số nguyên không âm';
    }
    return Object.keys(this.editorErrors).length === 0;
  }

  save() {
    if (!this.editing) return;
    if (!this.validateEditing()) return;

    if (this.editing.id) {
      this.svc.update(this.editing).subscribe({
        next: () => {
          this.toast.show('Cập nhật thành công', 'success');
          this.editing = null;
          this.loadActive();
        },
        error: (e) => this.toast.show('Lỗi khi cập nhật', 'error')
      });
    } else {
      this.svc.create(this.editing).subscribe({
        next: () => {
          this.toast.show('Tạo cấu hình mới thành công', 'success');
          this.editing = null;
          this.loadActive();
        },
        error: (e) => this.toast.show('Lỗi khi tạo mới', 'error')
      });
    }
  }

  activate(id: number | undefined) {
    if (!id) return;
    this.svc.activate(id).subscribe({
      next: () => {
        this.toast.show('Đã kích hoạt cấu hình #' + id, 'success');
        this.loadActive();
        this.listOpen = false;
      },
      error: () => this.toast.show('Kích hoạt thất bại', 'error')
    });
  }

  requestDelete(id: number | undefined) {
    if (!id) return;
    this.confirmDeleteId = id;
    this.listOpen = false;
  }

  cancelDelete() {
    this.confirmDeleteId = null;
  }

  confirmDelete() {
    if (!this.confirmDeleteId) return;
    const id = this.confirmDeleteId;
    this.svc.delete(id).subscribe({
      next: () => {
        this.toast.show('Xóa thành công', 'success');
        this.confirmDeleteId = null;
        this.loadActive();
        this.openList();
      },
      error: () => this.toast.show('Xóa thất bại', 'error')
    });
  }
}