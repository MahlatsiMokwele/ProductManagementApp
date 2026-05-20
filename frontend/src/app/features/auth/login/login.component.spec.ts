import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter, Router } from "@angular/router";

import { environment } from "../../../../environments/environment";
import { AppState } from "../../../core/state/app-state";

import { LoginComponent } from "./login.component";

describe("LoginComponent", () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    AppState.clear();
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it("creates with an invalid empty form", () => {
    expect(component).toBeTruthy();
    const form = (
      component as unknown as { form: { invalid: boolean; valid: boolean } }
    ).form;
    expect(form.invalid).toBeTrue();
  });

  it("becomes valid when both fields are filled", () => {
    const c = component as unknown as {
      form: {
        controls: {
          username: { setValue: (v: string) => void };
          password: { setValue: (v: string) => void };
        };
        valid: boolean;
      };
    };
    c.form.controls.username.setValue("admin");
    c.form.controls.password.setValue("Admin#123");
    expect(c.form.valid).toBeTrue();
  });

  it("submit() POSTs and navigates on success", () => {
    spyOn(router, "navigateByUrl");

    const c = component as unknown as {
      form: {
        controls: {
          username: { setValue: (v: string) => void };
          password: { setValue: (v: string) => void };
        };
      };
      submit: () => void;
    };
    c.form.controls.username.setValue("admin");
    c.form.controls.password.setValue("Admin#123");
    c.submit();

    const req = http.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(req.request.method).toBe("POST");
    req.flush({
      token: "jwt",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      username: "admin",
      role: "admin",
    });

    expect(router.navigateByUrl).toHaveBeenCalledWith("/products");
  });

  it("submit() does nothing when the form is invalid", () => {
    const c = component as unknown as { submit: () => void };
    c.submit();
    http.expectNone(`${environment.apiBaseUrl}/auth/login`);
  });
});
