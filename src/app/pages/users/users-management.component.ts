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
    this.usersService
      .getAll({ q: this.q, page: this.page, pageSize: this.pageSize })
      .subscribe({
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

    if (!this.editModel.id) {
      // create
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
      const id = this.editModel.id as string;
      const payload: any = {
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
