import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  text: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  id?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private subject = new Subject<ToastMessage>();
  public messages$ = this.subject.asObservable();

  show(text: string, type: ToastMessage['type'] = 'info') {
    this.subject.next({ text, type, id: Date.now().toString() });
  }
}
