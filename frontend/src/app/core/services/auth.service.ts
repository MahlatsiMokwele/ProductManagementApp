import { Injectable, computed, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Observable, tap } from "rxjs";

import { environment } from "../../../environments/environment";
import { AppState, STATE_KEYS } from "../state/app-state";
import {
  AuthResponse,
  AuthenticatedUser,
  LoginRequest,
  RegisterRequest,
} from "../models/auth.model";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<AuthenticatedUser | null>(null);
  // Readonly signal of the current user; null when signed out or expired.
  readonly currentUser = this._currentUser.asReadonly();

  // True if there's a non-expired token in memory.
  readonly isAuthenticated = computed(() => {
    const u = this._currentUser();
    if (!u) return false;
    return new Date(u.expiresAt).getTime() > Date.now();
  });

  // Convenience for role-gated UI.
  readonly isAdmin = computed(() => this._currentUser()?.role === "admin");

  constructor() {
    // Tell AppState this key should round-trip through localStorage so a
    // browser refresh keeps the user signed in.
    AppState.enablePersistence(STATE_KEYS.AUTH_USER);
    const restored = AppState.get<AuthenticatedUser>(STATE_KEYS.AUTH_USER);
    if (restored) {
      this._currentUser.set(restored);
      // If we restored an already-expired token, treat it as a clean logout.
      if (!this.isAuthenticated()) this.logout(false);
    }
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, req)
      .pipe(tap((res) => this.persist(res)));
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/register`, req)
      .pipe(tap((res) => this.persist(res)));
  }

  // Clears auth state and (by default) navigates back to /login.
  logout(redirect = true): void {
    this._currentUser.set(null);
    AppState.clear(STATE_KEYS.AUTH_USER);
    if (redirect) this.router.navigateByUrl("/login");
  }

  // Used by the JWT interceptor.
  getToken(): string | null {
    return this._currentUser()?.token ?? null;
  }

  private persist(res: AuthResponse): void {
    const user: AuthenticatedUser = {
      username: res.username,
      role: res.role,
      token: res.token,
      expiresAt: res.expiresAt,
    };
    this._currentUser.set(user);
    AppState.set(STATE_KEYS.AUTH_USER, user);
  }
}
