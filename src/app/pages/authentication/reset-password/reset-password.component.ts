import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  form = null as any;
  loading = false;
  message: string | null = null;

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      token: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });

    const q = this.route.snapshot.queryParams;
    if (q['email']) this.form.patchValue({ email: q['email'] });
    if (q['token']) this.form.patchValue({ token: q['token'] });
  }

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;
    try {
      const payload = this.form.value;
      const res = await this.auth.resetPassword(payload);
      this.message = res?.message || 'Đổi mật khẩu thành công';
      // navigate to login after a short delay
      setTimeout(() => this.router.navigate(['/login']), 1500);
    } catch (err: any) {
      this.message = err?.message || 'Có lỗi xảy ra.';
    } finally {
      this.loading = false;
    }
  }
}
