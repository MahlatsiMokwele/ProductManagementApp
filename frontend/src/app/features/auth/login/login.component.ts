import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { Router, RouterLink, ActivatedRoute } from "@angular/router";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { Component, inject, signal } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatInputModule } from "@angular/material/input";
import { MatCardModule } from "@angular/material/card";
import { CommonModule } from "@angular/common";

import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex justify-center mt-12">
      <mat-card class="w-full max-w-md">
        <mat-card-header>
          <mat-card-title>Sign in</mat-card-title>
          <mat-card-subtitle>Product Catalog</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="stack mt-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Username</mat-label>
              <input
                matInput
                formControlName="username"
                autocomplete="username"
              />
              @if (
                form.controls.username.touched &&
                form.controls.username.hasError("required")
              ) {
                <mat-error>Username is required.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Password</mat-label>
              <input
                matInput
                type="password"
                formControlName="password"
                autocomplete="current-password"
              />
              @if (
                form.controls.password.touched &&
                form.controls.password.hasError("required")
              ) {
                <mat-error>Password is required.</mat-error>
              }
            </mat-form-field>

            <div class="flex items-center justify-between gap-3">
              <a
                routerLink="/register"
                class="text-sm text-brand-600 hover:underline"
                >Create an account</a
              >
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="form.invalid || loading()"
              >
                @if (loading()) {
                  <mat-spinner
                    diameter="20"
                    class="inline-block align-middle"
                  ></mat-spinner>
                } @else {
                  Sign in
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snack = inject(MatSnackBar);

  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    username: ["", Validators.required],
    password: ["", Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.snack.open("Welcome back!", "Dismiss", { duration: 2500 });
        const returnUrl =
          this.route.snapshot.queryParamMap.get("returnUrl") || "/products";
        this.router.navigateByUrl(returnUrl);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }
}
