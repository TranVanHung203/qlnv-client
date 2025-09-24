import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/api.constants';

export interface LoginResponse {
  token?: string;
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  expiration?: string;
  expiresIn?: number;
  expires_in?: number;
  expiresAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';
  private refreshKey = 'auth_refresh';
  private expirationKey = 'auth_token_exp';

  // Use absolute backend URL provided by user. You may switch to relative '/api' if using proxy.
  private loginUrl = apiUrl('/api/Auth/login');
  private refreshUrl = apiUrl('/api/Auth/refresh');

  constructor(private http: HttpClient) {
    // start monitoring token expiration to proactively refresh
    this.startRefreshMonitorIfNeeded();
  }

  // Timer id for scheduled refresh
  private refreshTimer: any = null;

  // Start monitoring stored token expiration on service creation
  // We use a small async tick to avoid running during SSR.
  private startRefreshMonitorIfNeeded() {
    if (!this.isBrowser()) return;
    // schedule in next tick so constructor finishes
    setTimeout(() => this.scheduleRefreshFromStorage(), 0);
  }

  private scheduleRefreshFromStorage() {
    this.clearScheduledRefresh();
    const exp = this.getTokenExpiration();
    if (!exp) return;
    const msUntilExp = exp.getTime() - Date.now();
    // refresh this many ms before actual expiry (buffer)
    const buffer = 30 * 1000; // 30 seconds
    const when = msUntilExp - buffer;
    if (when <= 0) {
      // token already expired or within buffer -> refresh immediately
      this.tryRefresh().catch(() => {
        // failure handled in tryRefresh
      });
      return;
    }
    // setTimeout accepts up to 2^31-1, for very long durations we cap and reschedule
    const maxDelay = 0x7fffffff; // ~24.8 days
    const delay = when > maxDelay ? maxDelay : when;
    this.refreshTimer = setTimeout(() => {
      this.tryRefresh().catch(() => {});
    }, delay);
    console.debug && console.debug('[AuthService] scheduleRefreshFromStorage: refresh scheduled in ms', delay);
  }

  private clearScheduledRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private async tryRefresh() {
    const refresh = this.getRefreshToken();
    if (!refresh) {
      console.debug && console.debug('[AuthService] tryRefresh: no refresh token');
      this.logout();
      return;
    }
    try {
      console.debug && console.debug('[AuthService] tryRefresh: attempting refresh');
      const res = await this.refreshToken();
      // refreshToken already calls setSession which will reschedule
      console.debug && console.debug('[AuthService] tryRefresh: refresh succeeded');
      return res;
    } catch (err) {
      console.debug && console.debug('[AuthService] tryRefresh: refresh failed', (err as any)?.message || err);
      this.logout();
      throw err;
    }
  }

  // Debug helper: call `authDebugDump()` in browser console to inspect stored auth values
  public authDebugDump() {
    if (!this.isBrowser()) return null;
    try {
      return {
        token: localStorage.getItem(this.tokenKey),
        refresh: localStorage.getItem(this.refreshKey),
        expiration: localStorage.getItem(this.expirationKey),
      };
    } catch (e) {
      return { error: (e as any)?.message || e };
    }
  }

  private isBrowser(): boolean {
    try {
      return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
      return false;
    }
  }

  // Return expiration as Date if available, otherwise null
  getTokenExpiration(): Date | null {
    if (!this.isBrowser()) return null;
    const exp = (() => { try { return localStorage.getItem(this.expirationKey); } catch { return null; } })();
    if (!exp) return null;
    const d = new Date(exp);
    if (!isNaN(d.getTime())) return d;
    // try numeric seconds or ms
    const n = Number(exp);
    if (!isNaN(n)) {
      // if seconds (<= 1e10) multiply
      if (n < 1e10) return new Date(n * 1000);
      return new Date(n);
    }
    return null;
  }

  // Simple check: has token and not expired (if expiration present)
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const exp = this.getTokenExpiration();
    if (!exp) return true; // no expiration stored, assume valid
    return exp.getTime() > Date.now();
  }

  async login(username: string, password: string) {
    const res = await this.http.post<LoginResponse>(this.loginUrl, { username, password }).toPromise();
    if (!res) throw new Error('Invalid login response');
    this.setSession(res);
    return res;
  }

  private setSession(res: LoginResponse | any) {
    if (!this.isBrowser()) return;
    try {
      // If backend wraps the payload (e.g. { data: { token: ... } }) unwrap common containers
      const payload = this.normalizeAuthResponse(res);
      console.debug && console.debug('[AuthService] setSession: normalized payload', payload);
      // Normalize token names
      const token = payload?.token || payload?.accessToken || payload?.access_token || null;
      const refresh = payload?.refreshToken || payload?.refresh_token || null;

      // Normalize expiration
      let expiration: string | null = null;
      if (res?.expiration) {
        expiration = res.expiration;
      } else if (res?.expiresAt) {
        expiration = res.expiresAt;
      } else if (typeof res?.expires_in === 'number') {
        // expires_in is seconds
        expiration = new Date(Date.now() + res.expires_in * 1000).toISOString();
      } else if (typeof res?.expiresIn === 'number') {
        expiration = new Date(Date.now() + res.expiresIn * 1000).toISOString();
      }

      if (token) {
        localStorage.setItem(this.tokenKey, token);
        console.debug && console.debug('[AuthService] setSession: stored token');
      }
      if (refresh) {
        localStorage.setItem(this.refreshKey, refresh);
        console.debug && console.debug('[AuthService] setSession: stored refresh token');
      }
      if (expiration) {
        localStorage.setItem(this.expirationKey, expiration);
        console.debug && console.debug('[AuthService] setSession: stored expiration', expiration);
      }
      // schedule refresh based on the newly stored expiration
      try { this.scheduleRefreshFromStorage(); } catch {}
    } catch (e) {
      console.debug && console.debug('[AuthService] setSession: storage failed', (e as any)?.message || e);
    }
  }

  // Unwrap common containers that some backends use: { data: {...} }, { result: {...} }, { value: {...} }
  private normalizeAuthResponse(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const keys = ['data', 'result', 'value', 'payload'];
    for (const k of keys) {
      if (obj[k] && typeof obj[k] === 'object') {
        // unwrap one level and then normalize recursively
        return this.normalizeAuthResponse(obj[k]);
      }
    }
    return obj;
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;
    try {
      const t = localStorage.getItem(this.tokenKey);
      try { console.debug && console.debug('[AuthService] getToken ->', !!t); } catch {}
      return t;
    } catch {
      return null;
    }
  }

  getRefreshToken(): string | null {
    if (!this.isBrowser()) return null;
    try {
      return localStorage.getItem(this.refreshKey);
    } catch {
      return null;
    }
  }

  clear() {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.refreshKey);
      localStorage.removeItem(this.expirationKey);
      this.clearScheduledRefresh();
    } catch {
      // ignore
    }
  }

  async refreshToken() {
    const refresh = this.getRefreshToken();
    if (!refresh) throw new Error('No refresh token');
    try {
      console.debug && console.debug('[AuthService] refreshToken: sending refresh request');
      const res = await this.http.post<any>(this.refreshUrl, { refreshToken: refresh }).toPromise();
      if (!res) {
        console.debug && console.debug('[AuthService] refreshToken: empty response');
        throw new Error('Invalid refresh response');
      }
      console.debug && console.debug('[AuthService] refreshToken: success, setting session (raw response):', res);
      // normalize and persist session values
      this.setSession(res);
      return res;
    } catch (err) {
      const msg = (err as any)?.message || err;
      console.debug && console.debug('[AuthService] refreshToken: failed', msg);
      throw err;
    }
  }

  logout() {
    this.clear();
    this.clearScheduledRefresh();
  }

  // Forgot password: request server to send reset email
  async forgotPassword(email: string) {
  const url = apiUrl('/api/Auth/forgot-password');
    const res = await this.http.post<any>(url, { email }).toPromise();
    return res;
  }

  // Reset password using token
  async resetPassword(payload: { email: string; token: string; newPassword: string }) {
  const url = apiUrl('/api/Auth/reset-password');
    const res = await this.http.post<any>(url, payload).toPromise();
    return res;
  }
}
