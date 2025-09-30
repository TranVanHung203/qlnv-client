import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VnDatePipe } from '../../pipes/vn-date.pipe';
import { NotificationsService, NotificationItem, PagedNotifications } from '../../services/notifications.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-notifications-history',
  standalone: true,
  imports: [CommonModule, FormsModule, VnDatePipe],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  private svc = inject(NotificationsService);
  private toast = inject(ToastService);

  items: NotificationItem[] = [];
  emailNhan = '';
  from?: string;
  to?: string;

  page = 1;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;

  loading = false;

  ngOnInit(): void {
    this.load();
  }

  load(page = this.page) {
    this.loading = true;
  this.svc.getAll({ emailNhan: this.emailNhan, from: this.from, to: this.to, page, pageSize: this.pageSize }).subscribe({
      next: (p: PagedNotifications) => {
        this.items = p.items || [];
        this.page = p.page || 1;
        this.pageSize = p.pageSize || 10;
        this.totalPages = p.totalPages || 0;
        this.totalItems = p.totalItems || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed loading notifications', err);
        if (err && err.status === 403) this.toast.show('Bạn không có quyền xem lịch sử thông báo (403)', 'error');
        else this.toast.show('Lấy lịch sử thông báo thất bại', 'error');
        this.loading = false;
      },
    });
  }

  onSearch() {
    this.page = 1;
    this.load(1);
  }

  clearFilters() {
    this.emailNhan = '';
    this.from = undefined;
    this.to = undefined;
    this.onSearch();
  }
}

export class NotificationsPlaceholderComponent {}
