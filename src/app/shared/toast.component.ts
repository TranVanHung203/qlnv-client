import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="toasts">
    <div *ngFor="let t of messages" class="toast" [ngClass]="t.type">
      <div class="toast-body">
        <div class="toast-text">{{ t.text }}</div>
        <div class="toast-actions">
          <button *ngIf="t.isConfirm" class="btn confirm" (click)="confirm(t.id)">OK</button>
          <button *ngIf="t.isConfirm" class="btn cancel" (click)="cancel(t.id)">Hủy</button>
          <button *ngIf="!t.isConfirm" class="close" (click)="close(t.id)">×</button>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [
    `
    .toasts { position: fixed; right: 1rem; bottom: 1rem; z-index: 10000; }
    .toast { background: rgba(0,0,0,0.85); color: white; padding: 0.6rem; margin-top: 0.5rem; border-radius:8px; min-width:240px; box-shadow:0 8px 20px rgba(2,6,23,0.12); }
    .toast .toast-body{ display:flex; gap:8px; align-items:flex-start }
    .toast .toast-text{ flex:1; font-size:0.95rem; }
    .toast .close{ background:transparent; border:none; color:inherit; font-size:1.2rem; cursor:pointer }
    .toast.success { background: linear-gradient(90deg,#16a34a,#10b981); }
    .toast.error { background: linear-gradient(90deg,#ef4444,#dc2626); }
    .toast.warning { background: linear-gradient(90deg,#f59e0b,#f97316); color:#111 }
    .toast.info { background: linear-gradient(90deg,#0ea5e9,#0284c7); }
    `
  ]
})
export class ToastComponent {
  messages: ToastMessage[] = [];
  constructor(private toast: ToastService) {
    this.toast.messages$.subscribe((m) => {
      this.messages = [...this.messages, m];
      // auto remove after 4.5s
      setTimeout(() => {
        this.messages = this.messages.filter(x => x.id !== m.id);
      }, 4500);
    });
  }

  close(id?: string) {
    if (!id) return;
    this.messages = this.messages.filter(x => x.id !== id);
  }

  confirm(id?: string) {
    if (!id) return;
    this.toast.confirmResponse(id, true);
    this.messages = this.messages.filter(x => x.id !== id);
  }

  cancel(id?: string) {
    if (!id) return;
    this.toast.confirmResponse(id, false);
    this.messages = this.messages.filter(x => x.id !== id);
  }
}
