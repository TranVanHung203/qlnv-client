import { Routes } from '@angular/router';
import { LoginComponent } from './pages/authentication/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { LogoutComponent } from './pages/authentication/logout/logout.component';
import { ForgotPasswordComponent } from './pages/authentication/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/authentication/reset-password/reset-password.component';
import { authGuard } from './guards/auth.guard';
import { EmployeeManagementComponent } from './pages/employee-management/employee-management.component';
import { ConfigNotificationsComponent } from './pages/config-notifications/config-notifications.component';
import { EmailsManagementComponent } from './pages/emails-management/emails-management.component';
import { HolidaysComponent } from './pages/holidays/holidays.component';
import { UsersManagementComponent } from './pages/users/users-management.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { ChangePasswordComponent } from './pages/change-password/change-password.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: EmployeeManagementComponent },
      { path: 'config', component: ConfigNotificationsComponent },
      { path: 'emails', component: EmailsManagementComponent },
      // { path: 'holidays', component: HolidaysComponent },
      { path: 'users', component: UsersManagementComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'change-password', component: ChangePasswordComponent }
    ]
  },
  // { path: 'forgot-password', component: ForgotPasswordComponent },
  // { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'logout', component: LogoutComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
