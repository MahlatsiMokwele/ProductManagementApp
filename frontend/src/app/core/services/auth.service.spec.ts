import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter, Router } from "@angular/router";
import { TestBed } from "@angular/core/testing";

import { environment } from "../../../environments/environment";
import { AuthResponse } from "../models/auth.model";
import { AppState } from "../state/app-state";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    AppState.clear();
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  function fakeLoginResponse(
    overrides: Partial<AuthResponse> = {},
  ): AuthResponse {
    return {
      token: "tkn",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      username: "admin",
      role: "admin",
      ...overrides,
    };
  }

  it("starts unauthenticated when no token is in storage", () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it("login() POSTs credentials and updates state on success", () => {
    let resolved = false;
    service.login({ username: "admin", password: "Admin#123" }).subscribe({
      next: () => {
        resolved = true;
      },
    });

    const req = http.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({
      username: "admin",
      password: "Admin#123",
    });

    req.flush(fakeLoginResponse());

    expect(resolved).toBeTrue();
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.isAdmin()).toBeTrue();
    expect(service.getToken()).toBe("tkn");
  });

  it("logout() clears the user and removes the persisted token", () => {
    service.login({ username: "admin", password: "x" }).subscribe();
    http
      .expectOne(`${environment.apiBaseUrl}/auth/login`)
      .flush(fakeLoginResponse());

    expect(localStorage.getItem("appstate:auth.user")).not.toBeNull();

    const router = TestBed.inject(Router);
    spyOn(router, "navigateByUrl");

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem("appstate:auth.user")).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith("/login");
  });

  it("isAdmin is false for employee role", () => {
    service.login({ username: "eve", password: "x" }).subscribe();
    http
      .expectOne(`${environment.apiBaseUrl}/auth/login`)
      .flush(fakeLoginResponse({ role: "employee", username: "eve" }));

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.isAdmin()).toBeFalse();
  });

  it("treats a restored-but-expired token as logged out", () => {
    // Seed an expired token into localStorage before bootstrapping a new service
    const expired = {
      token: "old",
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
      username: "admin",
      role: "admin",
    };
    localStorage.setItem("appstate:auth.user", JSON.stringify(expired));

    // Re-create the service so the constructor runs against the seeded storage
    AppState.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    const fresh = TestBed.inject(AuthService);

    expect(fresh.isAuthenticated()).toBeFalse();
  });
});
