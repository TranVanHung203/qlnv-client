import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmailsService, EmailItem, PagedEmails } from '../../services/emails.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-emails-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './emails-management.component.html',
  styleUrls: ['./emails-management.component.scss']
})
export class EmailsManagementComponent implements OnInit {
  items: EmailItem[] = [];
  page = 1;
  pageSize = 8;
  totalPages = 1;
  totalItems = 0;
  filterEmail = '';

  editing: EmailItem | null = null;
  confirmDeleteId: number | null = null;
  editorErrors: Record<string, string> = {};

  constructor(private svc: EmailsService, private toast: ToastService) {}

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number) {
    this.page = page;
    this.svc.getAll({ email: this.filterEmail, page: this.page, pageSize: this.pageSize }).subscribe({
      next: (v: PagedEmails) => {
        this.items = v.items || [];
        this.page = v.page || 1;
        this.pageSize = v.pageSize || this.pageSize;
        this.totalItems = v.totalItems || 0;
        this.totalPages = v.totalPages || 1;
      },
      error: (e) => {
        // The service maps 404 -> empty; but if an unexpected error occurs, show error toast
        this.toast.show('Lấy danh sách email thất bại', 'error');
      }
    });
  }

  startEdit(e?: EmailItem) {
    if (!e) { this.editing = { email: '' }; return; }
    this.editing = { id: e.id, email: e.email };
  }

  cancelEdit() { this.editing = null; }

  save() {
    if (!this.editing) return;
    this.editorErrors = {};
    if (this.editing.id) {
      this.svc.update(this.editing.id!, this.editing).subscribe({ next: () => { this.toast.show('Cập nhật thành công', 'success'); this.editing = null; this.load(this.page); }, error: (err) => {
        if (err && err.status === 400 && err.error && err.error.errors) {
          // map backend validation errors to editorErrors
          const errors = err.error.errors;
          Object.keys(errors).forEach(k => { this.editorErrors[k] = (errors[k] && errors[k].join ? errors[k].join(', ') : String(errors[k])); });
          return;
        }
        if (err && err.status === 404) {
          this.toast.show('Không tìm thấy email (có thể đã bị xóa)', 'info');
          this.load(this.page);
          this.editing = null;
          return;
        }
        this.toast.show('Cập nhật thất bại', 'error');
      } });
    } else {
      this.svc.create(this.editing).subscribe({ next: () => { this.toast.show('Thêm thành công', 'success'); this.editing = null; this.load(1); }, error: (err) => {
        if (err && err.status === 400 && err.error && err.error.errors) {
          const errors = err.error.errors;
          Object.keys(errors).forEach(k => { this.editorErrors[k] = (errors[k] && errors[k].join ? errors[k].join(', ') : String(errors[k])); });
          return;
        }
        if (err && err.status === 404) {
          this.toast.show('Không thể thêm email (endpoint không tìm thấy)', 'info');
          return;
        }
        this.toast.show('Thêm thất bại', 'error');
      } });
    }
  }

  requestDelete(id: number) { this.confirmDeleteId = id; }
  cancelDelete() { this.confirmDeleteId = null; }
  confirmDelete() {
    if (!this.confirmDeleteId) return;
    const id = this.confirmDeleteId;
    this.svc.delete(id).subscribe({ next: () => { this.toast.show('Xóa thành công', 'success'); this.confirmDeleteId = null; this.load(this.page); }, error: (err) => {
      if (err && err.status === 404) { this.toast.show('Không tìm thấy email, có thể đã bị xóa', 'info'); this.confirmDeleteId = null; this.load(this.page); return; }
      this.toast.show('Xóa thất bại', 'error');
    } });
  }
}

