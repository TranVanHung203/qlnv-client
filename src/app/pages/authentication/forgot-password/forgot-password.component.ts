import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  form: any;
  loading = false;
  message: string | null = null;

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  }

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.message = null;
    try {
  const email = (this.form.value && this.form.value.email) ? String(this.form.value.email) : '';
  const res = await this.auth.forgotPassword(email);
      this.message = res?.message || 'Yêu cầu đã gửi nếu email tồn tại.';
    } catch (err: any) {
      this.message = err?.message || 'Có lỗi xảy ra.';
    } finally {
      this.loading = false;
    }
  }
}
