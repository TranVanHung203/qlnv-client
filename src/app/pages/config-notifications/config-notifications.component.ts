import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigNotificationsService, ConfigNotification } from '../../services/config-notifications.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-config-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="page config-notifications">
    <div class="header">
      <div class="title">
        <h3>Cấu hình thông báo</h3>
        <div class="subtitle">Quản lý cấu hình gửi thông báo, lịch sử và kích hoạt</div>
      </div>
      <div class="header-actions">
        <button class="btn" (click)="openList()">Xem lịch sử</button>
        <button class="btn success" (click)="startEdit()">Tạo cấu hình mới</button>
      </div>
    </div>

    <div class="cards">
      <div class="card active-card" *ngIf="active">
        <div class="card-head">
          <div>
            <h4>Đang sử dụng</h4>
          </div>
          <div class="badge">Active</div>
        </div>
        <div class="card-body">
          <div class="row"><span class="label">Khoảng thời gian thông báo - đối với thử việc (ngày):</span> <span class="value">{{ active.soNgayThongBao }}</span></div>
          <div class="row"><span class="label">Khoảng thời gian thông báo (năm):</span> <span class="value">{{ active.danhSachNamThongBao }}</span></div>
        </div>
        <div class="card-actions">
          <button class="btn" (click)="openList()">Lịch sử</button>
          <button class="btn" (click)="startEdit(active)">Sửa</button>
        </div>
      </div>

      <div *ngIf="active === null" class="card empty-card">
        <div class="empty">
          <div class="empty-title">Chưa có cấu hình</div>
          <div class="empty-sub">Hiện chưa có cấu hình thông báo đang được sử dụng.</div>
          <div class="empty-actions">
            <button class="btn success" (click)="startEdit()">Tạo cấu hình mới</button>
            <button class="btn" (click)="openList()">Chọn từ lịch sử</button>
          </div>
        </div>
      </div>
    </div>

    <div class="editor card" *ngIf="editing">
      <h4 class="editor-title">{{ editing.id ? ('Sửa cấu hình #' + editing.id) : 'Tạo cấu hình mới' }}</h4>
      <div class="editor-grid">
        <div class="field">
          <label>Số ngày thông báo</label>
          <input class="input" type="number" [(ngModel)]="editing.soNgayThongBao" />
          <div *ngIf="editorErrors['soNgayThongBao']" class="field-error">{{ editorErrors['soNgayThongBao'] }}</div>
        </div>
        <div class="field">
          <label>Danh sách năm</label>
          <input class="input" [(ngModel)]="editing.danhSachNamThongBao" placeholder="ví dụ: 1,2 tức thông báo sau 1 năm và 2 năm" />
          <div *ngIf="editorErrors['danhSachNamThongBao']" class="field-error">{{ editorErrors['danhSachNamThongBao'] }}</div>
        </div>
      </div>
      <div class="editor-actions">
        <button class="btn success" (click)="save()">Lưu</button>
        <button class="btn" (click)="cancelEdit()">Hủy</button>
        <button *ngIf="editing.id" class="btn danger" (click)="requestDelete(editing.id!)">Xóa</button>
      </div>
    </div>

    <!-- list modal -->
    <div class="modal-backdrop" *ngIf="listOpen">
      <div class="modal card">
        <div class="modal-head"><h4>Danh sách cấu hình</h4><button class="close" (click)="listOpen = false">×</button></div>
        <table class="small">
          <thead>
            <tr><th>Id</th><th>Số ngày đối với thử việc</th><th>Số năm</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of all">
              <td class="sr-only">{{ c.id }}</td>
              <td>{{ c.soNgayThongBao }}</td>
              <td>{{ c.danhSachNamThongBao }}</td>
              <td><span class="status" [class.active]="c.isActive">{{ c.isActive ? 'Đang dùng' : '—' }}</span></td>
              <td class="nowrap">
                <button class="btn" (click)="startEdit(c)">Sửa</button>
                <button class="btn" (click)="activate(c.id!)">Kích hoạt</button>
                <button class="btn danger" (click)="requestDelete(c.id!)">Xóa</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="modal-actions">
          <button class="btn" (click)="listOpen = false">Đóng</button>
        </div>
      </div>
    </div>
  </div>
  <!-- delete confirmation modal -->
  <div class="modal-backdrop" *ngIf="confirmDeleteId">
    <div class="modal card">
      <h4>Xác nhận xóa cấu hình</h4>
      <p>Bạn có chắc muốn xóa cấu hình #{{ confirmDeleteId }} ? Hành động không thể hoàn tác.</p>
      <div class="modal-actions">
        <button class="btn" (click)="cancelDelete()">Hủy</button>
        <button class="btn danger" (click)="confirmDelete()">Xóa</button>
      </div>
    </div>
  </div>
  `,
  styles: [
    `:host{display:block;font-family:Segoe UI, Roboto, Arial, sans-serif;color:#0b2545}
    .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}
    .title h3{margin:0}
    .subtitle{color:#6b7280;font-size:0.9rem}
    .header-actions{display:flex;gap:8px}
    .cards{display:flex;gap:16px;flex-wrap:wrap}
    .card{background:#fff;border-radius:10px;box-shadow:0 6px 20px rgba(11,37,69,0.06);padding:16px;min-width:280px}
    .active-card{flex:1 1 420px}
    .card-head{display:flex;justify-content:space-between;align-items:center}
    .badge{background:#e6f4ea;color:#147a3b;padding:6px 10px;border-radius:16px;font-weight:600}
    .muted{color:#6b7280;font-size:0.85rem}
    .card-body{margin-top:12px}
    .row{margin:6px 0}
    .label{color:#374151;font-weight:600;margin-right:8px}
    .value{color:#0b2545}
    .card-actions{display:flex;gap:8px;margin-top:12px}
    .empty-card{display:flex;align-items:center;justify-content:center;min-height:120px}
    .empty-title{font-weight:600;margin-bottom:6px}
    .empty-sub{color:#6b7280;margin-bottom:12px}
    .editor{margin-top:12px}
    .editor-title{margin:0 0 8px 0}
    .editor-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .field{display:flex;flex-direction:column}
    .input{padding:8px;border:1px solid #e6e9ee;border-radius:6px}
    .field-error{color:#b91c1c;font-size:0.85rem;margin-top:6px}
    .editor-actions{display:flex;gap:8px;margin-top:12px}
    .btn{padding:8px 12px;border-radius:6px;border:1px solid transparent;background:#f3f4f6;color:#0b2545;cursor:pointer}
    .btn:hover{opacity:0.95}
    .btn.success{background:#0ea5a4;color:#fff;border-color:#0ea5a4}
    .btn.danger{background:#ef4444;color:#fff;border-color:#ef4444}
    .small{width:100%;border-collapse:collapse;margin-top:12px}
    .small th,.small td{border-bottom:1px solid #f3f4f6;padding:10px 8px;text-align:left}
  .sr-only{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden}
  .small td .btn{margin-left:6px}
    .modal-backdrop{position:fixed;inset:0;background:rgba(2,6,23,0.45);display:flex;align-items:center;justify-content:center;z-index:30}
    .modal{width:760px;max-width:95%;background:#fff;padding:16px;border-radius:8px;position:relative}
    .modal-head{display:flex;justify-content:space-between;align-items:center}
    .modal .close{background:transparent;border:none;font-size:20px;line-height:1;cursor:pointer}
    .modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
    .status{padding:4px 8px;border-radius:8px;background:#f3f4f6}
    .status.active{background:#e6f4ea;color:#147a3b}
    .nowrap{white-space:nowrap}
    @media (max-width:720px){.editor-grid{grid-template-columns:1fr}}
  `]
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
          // No active configuration found
          this.toast.show('Chưa có cấu hình thông báo đang sử dụng', 'info');
        }
      },
      error: (err) => this.toast.show('Không thể tải cấu hình đang sử dụng: ' + (err?.message || err), 'error')
    });
  }

  openList() {
    this.listOpen = true;
    this.svc.getAll().subscribe({ next: (v) => (this.all = v), error: (e) => this.toast.show('Lấy danh sách thất bại', 'error') });
  }

  select(c: ConfigNotification) {
    this.listOpen = false;
    this.active = c;
    this.toast.show('Đã chọn cấu hình #' + c.id, 'info');
  }

  startEdit(c?: ConfigNotification) {
    if (!c) {
      this.editing = { soNgayThongBao: 1, danhSachNamThongBao: '' };
      return;
    }
    // clone
    this.editing = { id: c.id, soNgayThongBao: c.soNgayThongBao, danhSachNamThongBao: c.danhSachNamThongBao, isActive: c.isActive };
  }

  cancelEdit() {
    this.editing = null;
  }

  validateEditing(): boolean {
    this.editorErrors = {};
    if (!this.editing) return false;
    if (!Number.isInteger(this.editing.soNgayThongBao) || this.editing.soNgayThongBao < 0) {
      this.editorErrors['soNgayThongBao'] = 'Số ngày phải là số nguyên không âm';
    }
    if (!this.editing.danhSachNamThongBao || !this.editing.danhSachNamThongBao.trim()) {
      this.editorErrors['danhSachNamThongBao'] = 'Danh sách năm không được bỏ trống';
    } else {
      // validate CSV are integers
      const parts = this.editing.danhSachNamThongBao.split(',').map(s => s.trim()).filter(s => s.length);
      const bad = parts.find(p => !/^-?\d+$/.test(p));
      if (bad) this.editorErrors['danhSachNamThongBao'] = 'Danh sách năm phải là các số nguyên, ngăn cách bằng dấu phẩy';
    }
    return Object.keys(this.editorErrors).length === 0;
  }

  save() {
    if (!this.editing) return;
    if (!this.validateEditing()) return;

    if (this.editing.id) {
      this.svc.update(this.editing).subscribe({ next: (v) => { this.toast.show('Cập nhật thành công', 'success'); this.editing = null; this.loadActive(); }, error: (e) => this.toast.show('Lỗi khi cập nhật', 'error') });
    } else {
      this.svc.create(this.editing).subscribe({ next: (v) => { this.toast.show('Tạo cấu hình mới thành công', 'success'); this.editing = null; this.loadActive(); }, error: (e) => this.toast.show('Lỗi khi tạo mới', 'error') });
    }
  }

  activate(id?: number) {
    if (!id) return;
    this.svc.activate(id).subscribe({ next: () => { this.toast.show('Đã kích hoạt cấu hình #' + id, 'success'); this.loadActive(); this.openList(); }, error: () => this.toast.show('Kích hoạt thất bại', 'error') });
  }

  requestDelete(id: number) {
    this.confirmDeleteId = id;
  }

  cancelDelete() {
    this.confirmDeleteId = null;
  }

  confirmDelete() {
    if (!this.confirmDeleteId) return;
    const id = this.confirmDeleteId;
    this.svc.delete(id).subscribe({ next: () => { this.toast.show('Xóa thành công', 'success'); this.loadActive(); this.openList(); this.confirmDeleteId = null; }, error: () => this.toast.show('Xóa thất bại', 'error') });
  }
}

