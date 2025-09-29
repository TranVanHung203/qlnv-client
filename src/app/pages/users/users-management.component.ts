import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, UserItem, PagedUsers } from '../../services/users.service';
import { parseValidationErrors } from '../../utils/validation.utils';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss'],
})
export class UsersManagementComponent implements OnInit {
  private usersService = inject(UsersService);
  private toast = inject(ToastService);

  items: UserItem[] = [];
  q = '';
  page = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  // Editor state
  editing: boolean = false;
  editModel: Partial<UserItem & { password?: string }> = {};
  editorErrors: Record<string, string[]> = {};

  loading = false;

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.usersService.getAll({ q: this.q, page: this.page, pageSize: this.pageSize }).subscribe({
      next: (p: PagedUsers) => {
        this.items = p.items || [];
        this.page = p.page || 1;
        this.pageSize = p.pageSize || 10;
        this.totalItems = p.totalItems || 0;
        this.totalPages = p.totalPages || 0;
        this.loading = false;
      },
      error: (err) => {
        if (err && err.status === 403) {
          this.toast.show('Bạn không có quyền xem danh sách users (403).', 'error');
          this.loading = false;
          return;
        }
        console.error('Failed loading users', err);
        this.loading = false;
      },
    });
  }

  onSearch() {
    this.page = 1;
    this.load();
  }

  startCreate() {
    this.editing = true;
    this.editModel = { username: '', email: '', fullName: '', role: '', password: '' };
    this.editorErrors = {};
  }

  startEdit(item: UserItem) {
    this.editing = true;
    this.editModel = { ...item };
    this.editorErrors = {};
  }

  cancelEdit() {
    this.editing = false;
    this.editModel = {};
    this.editorErrors = {};
  }

  save() {
    this.editorErrors = {};
    if (!this.editModel) return;

    // client-side validation
    const clientErrors: Record<string, string[]> = {};
    const emailVal = (this.editModel.email || '').toString();
    const usernameVal = (this.editModel.username || '').toString();
    const passwordVal = (this.editModel.password || '').toString();
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    if (!this.editModel.id) {
      // create validations
      if (!usernameVal || !usernameVal.trim()) clientErrors['username'] = ['Username không được để trống'];
      if (!emailVal || !emailVal.trim()) clientErrors['email'] = ['Email không được để trống'];
      else if (!emailRegex.test(emailVal)) clientErrors['email'] = ['Email không hợp lệ'];
      if (!passwordVal || !passwordVal.trim()) clientErrors['password'] = ['Password không được để trống'];

      if (Object.keys(clientErrors).length) {
        this.editorErrors = clientErrors;
        this.toast.show('Vui lòng sửa các trường bị lỗi', 'warning');
        return;
      }

      const payload: any = {
        username: this.editModel.username,
        email: this.editModel.email,
        password: this.editModel.password,
        fullName: this.editModel.fullName,
        role: this.editModel.role,
      };
      this.usersService.create(payload).subscribe({
        next: () => {
          this.cancelEdit();
          this.load();
        },
        error: (err) => {
          if (err && err.status === 403) {
            this.toast.show('Bạn không có quyền tạo user (403).', 'error');
            return;
          }
          this.handleValidationErrors(err);
        },
      });
    } else {
      // update
      if (emailVal && !emailRegex.test(emailVal)) {
        this.editorErrors = { email: ['Email không hợp lệ'] };
        this.toast.show('Vui lòng sửa các trường bị lỗi', 'warning');
        return;
      }

      const id = this.editModel.id as string;
      const payload: any = {
        id: id,
        email: this.editModel.email,
        fullName: this.editModel.fullName,
        role: this.editModel.role,
      };
      this.usersService.update(id, payload).subscribe({
        next: () => {
          this.cancelEdit();
          this.load();
        },
        error: (err) => {
          if (err && err.status === 403) {
            this.toast.show('Bạn không có quyền cập nhật user này (403).', 'error');
            return;
          }
          this.handleValidationErrors(err);
        },
      });
    }
  }

  deleteItem(id: string) {
    // keep existing direct delete for backward compatibility
    if (!confirm('Xóa user này?')) return;
    this.usersService.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => {
        if (err && err.status === 403) {
          this.toast.show('Bạn không có quyền xóa user này (403).', 'error');
          return;
        }
        console.error('Delete failed', err);
      },
    });
  }

  // New modal-based confirmation state and handlers
  deleteConfirmId: string | null = null;
  showDeleteConfirm = false;

  openDeleteConfirm(id: string) {
    this.deleteConfirmId = id;
    this.showDeleteConfirm = true;
  }

  cancelDeleteConfirm() {
    this.deleteConfirmId = null;
    this.showDeleteConfirm = false;
  }

  performDeleteConfirmed() {
    const id = this.deleteConfirmId;
    if (!id) return;
    this.usersService.delete(id).subscribe({
      next: () => {
        this.cancelDeleteConfirm();
        this.load();
      },
      error: (err) => {
        this.cancelDeleteConfirm();
        if (err && err.status === 403) {
          this.toast.show('Bạn không có quyền xóa user này (403).', 'error');
          return;
        }
        console.error('Delete failed', err);
      },
    });
  }

  private handleValidationErrors(err: any) {
    const parsed = parseValidationErrors(err);
    if (parsed) {
      this.editorErrors = parsed.fields;
      // show short summary toast
      if (parsed.summary.length) this.toast.show(parsed.summary.join('; '), 'error');
      return;
    }
    // fallback: show a friendly alert and log
    console.error('Unexpected error', err);
    alert('Lỗi: ' + (err?.message || JSON.stringify(err)));
  }
}
