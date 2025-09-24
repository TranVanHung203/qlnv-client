import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take, finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../shared/toast.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private refreshInProgress = false;
  private refreshSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private auth: AuthService, private toast: ToastService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // don't attach Authorization header for auth endpoints (login/refresh/forgot/reset)
    const url = req.url || '';
    const isAuthEndpoint = url.includes('/api/Auth/refresh') || url.includes('/api/Auth/login') || url.includes('/api/Auth/forgot-password') || url.includes('/api/Auth/reset-password');
    const token = this.auth.getToken();
    try { console.debug && console.debug('[AuthInterceptor] token:', token); } catch {}
    let authReq = req;
    if (token && !isAuthEndpoint) {
      try { console.debug && console.debug('[AuthInterceptor] cloning request with Authorization header'); } catch {}
      authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    } else {
      try { console.debug && console.debug('[AuthInterceptor] skipping auth header for auth endpoint or no token'); } catch {}
    }

    try { console.debug && console.debug('[AuthInterceptor] outgoing request', { url: authReq.url, headers: authReq.headers?.keys?.() }); } catch {}

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        try { console.debug && console.debug('[AuthInterceptor] response error', { status: err.status, url: err.url, message: err.message }); } catch {}
  if (err.status === 401) {
          try { console.debug && console.debug('[AuthInterceptor] received 401 for', req.url); } catch {}
          // if no refresh token available, force logout
          const refresh = this.auth.getRefreshToken();
          if (!refresh) {
            this.auth.logout();
            return throwError(() => err);
          }

          // If a refresh is already in progress, queue this request until it's done
          if (this.refreshInProgress) {
            return this.refreshSubject.pipe(
              filter((token) => token != null),
              take(1),
              switchMap((token) => {
                const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
                return next.handle(retryReq);
              }),
            );
          }

          // start refresh
          console.debug && console.debug('[AuthInterceptor] starting token refresh');
          this.refreshInProgress = true;
          // reset subject so subscribers wait for a value
          this.refreshSubject.next(null);

          return from(this.auth.refreshToken()).pipe(
            switchMap(() => {
              const newToken = this.auth.getToken();
              console.debug && console.debug('[AuthInterceptor] refresh succeeded, new token:', !!newToken);
              // publish new token for queued requests
              this.refreshSubject.next(newToken);
              const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next.handle(retryReq);
            }),
            catchError((refreshErr) => {
              // refresh failed -> logout and surface error
              console.debug && console.debug('[AuthInterceptor] refresh failed:', refreshErr?.message || refreshErr);
              try { this.refreshSubject.error(refreshErr); } catch {}
              this.auth.logout();
              return throwError(() => refreshErr);
            }),
            finalize(() => {
              this.refreshInProgress = false;
            }),
          );
        }

        // Global handling: show friendly toast for Forbidden (403)
        if (err.status === 403) {
          try {
            this.toast.show('Bạn không có quyền thực hiện thao tác này (403).', 'error');
          } catch (e) {
            console.error('Failed to show toast for 403', e);
          }
          return throwError(() => err);
        }

        return throwError(() => err);
      }),
    );
  }
}
