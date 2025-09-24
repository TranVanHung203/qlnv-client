import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  text: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  isConfirm?: boolean;
  id?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private subject = new Subject<ToastMessage>();
  public messages$ = this.subject.asObservable();
  private confirmResolvers: Record<string, (v: boolean) => void> = {};

  show(text: string, type: ToastMessage['type'] = 'info') {
    this.subject.next({ text, type, id: Date.now().toString() });
  }

  confirm(text: string): Promise<boolean> {
    const id = Date.now().toString() + Math.random().toString(36).slice(2,6);
    this.subject.next({ text, type: 'info', id, isConfirm: true });
    return new Promise<boolean>((resolve) => {
      this.confirmResolvers[id] = resolve;
    });
  }

  // Called by UI to resolve a confirm toast
  confirmResponse(id: string, value: boolean) {
    const r = this.confirmResolvers[id];
    if (r) {
      r(value);
      delete this.confirmResolvers[id];
    }
  }
}
