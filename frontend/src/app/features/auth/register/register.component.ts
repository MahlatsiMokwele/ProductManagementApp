import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { Component, inject, signal } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatInputModule } from "@angular/material/input";
import { MatCardModule } from "@angular/material/card";
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";

import { AuthService } from "../../../core/services/auth.service";

import { UserRole } from "../../../core/models/auth.model";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex justify-center mt-12">
      <mat-card class="w-full max-w-md">
        <mat-card-header>
          <mat-card-title>Create an account</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="stack mt-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" />
              @if (form.controls.username.touched) {
                @if (form.controls.username.hasError("required")) {
                  <mat-error>Username is required.</mat-error>
                } @else if (
                  form.controls.username.hasError("minlength") ||
                  form.controls.username.hasError("maxlength")
                ) {
                  <mat-error>Username must be 3-100 characters.</mat-error>
                }
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" />
              @if (form.controls.password.touched) {
                @if (form.controls.password.hasError("required")) {
                  <mat-error>Password is required.</mat-error>
                } @else if (form.controls.password.hasError("minlength")) {
                  <mat-error>Password must be at least 8 characters.</mat-error>
                }
              }
            </mat-form-field>

            <div class="grid grid-cols-2 gap-3">
              <mat-form-field appearance="outline">
                <mat-label>First name</mat-label>
                <input matInput formControlName="name" />
                @if (
                  form.controls.name.touched &&
                  form.controls.name.hasError("required")
                ) {
                  <mat-error>Required.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Surname</mat-label>
                <input matInput formControlName="surname" />
                @if (
                  form.controls.surname.touched &&
                  form.controls.surname.hasError("required")
                ) {
                  <mat-error>Required.</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Role</mat-label>
              <mat-select formControlName="role">
                <mat-option value="employee">Employee (view only)</mat-option>
                <mat-option value="admin">Admin (full access)</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="flex items-center justify-between gap-3">
              <a
                routerLink="/login"
                class="text-sm text-brand-600 hover:underline"
                >Have an account? Sign in</a
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
                  Create account
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    username: [
      "",
      [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    ],
    password: ["", [Validators.required, Validators.minLength(8)]],
    name: ["", Validators.required],
    surname: ["", Validators.required],
    role: ["employee" as UserRole, Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.snack.open("Account created. Welcome!", "Dismiss", {
          duration: 2500,
        });
        this.router.navigateByUrl("/products");
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }
}
