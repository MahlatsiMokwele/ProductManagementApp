import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { Component, inject, signal } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatInputModule } from "@angular/material/input";
import { CommonModule } from "@angular/common";

import { CategoryService } from "../../../core/services/category.service";

import {
  Category,
  CreateCategoryRequest,
} from "../../../core/models/category.model";

export interface CategoryDialogData {
  categories: Category[];
  category?: Category;
}

@Component({
  selector: "app-category-dialog",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.category ? "Edit category" : "Add category" }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="stack mt-2">
        <br />
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" maxlength="255" />
          @if (
            form.controls.name.touched &&
            form.controls.name.hasError("required")
          ) {
            <mat-error>Name is required.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" maxlength="255" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Parent category</mat-label>
          <mat-select formControlName="parentCategoryId">
            <mat-option [value]="null">No parent (root)</mat-option>
            @for (cat of selectableParents; track cat.id) {
              <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="form.invalid || saving()"
        (click)="save()"
      >
        @if (saving()) {
          <mat-spinner
            diameter="20"
            class="inline-block align-middle"
          ></mat-spinner>
        } @else {
          {{ data.category ? "Save" : "Create" }}
        }
      </button>
    </mat-dialog-actions>
  `,
})
export class CategoryDialogComponent {
  readonly ref =
    inject<MatDialogRef<CategoryDialogComponent, Category | undefined>>(
      MatDialogRef,
    );
  readonly data = inject<CategoryDialogData>(MAT_DIALOG_DATA);

  private readonly fb = inject(FormBuilder);
  private readonly categories = inject(CategoryService);
  private readonly snack = inject(MatSnackBar);

  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: [
      this.data.category?.name ?? "",
      [Validators.required, Validators.maxLength(255)],
    ],
    description: [
      this.data.category?.description ?? "",
      Validators.maxLength(255),
    ],
    parentCategoryId: [
      (this.data.category?.parentCategoryId ?? null) as string | null,
    ],
  });

  protected get selectableParents(): Category[] {
    const selfId = this.data.category?.id;
    return selfId
      ? this.data.categories.filter((c) => c.id !== selfId)
      : this.data.categories;
  }

  protected save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const v = this.form.getRawValue();
    const body: CreateCategoryRequest = {
      name: v.name,
      description: v.description || null,
      parentCategoryId: v.parentCategoryId,
    };

    const obs$ = this.data.category
      ? this.categories.update(this.data.category.id, body)
      : this.categories.create(body);

    obs$.subscribe({
      next: (saved) => {
        this.snack.open(
          this.data.category ? "Category updated." : "Category created.",
          "Dismiss",
          { duration: 2500 },
        );
        this.ref.close(saved);
      },
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false),
    });
  }
}
