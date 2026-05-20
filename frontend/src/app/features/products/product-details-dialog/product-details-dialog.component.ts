import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { Component, inject, signal } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatInputModule } from "@angular/material/input";
import { CommonModule } from "@angular/common";

import {
  Product,
  CreateProductRequest,
} from "../../../core/models/product.model";

import { ProductService } from "../../../core/services/product.service";

import { CategoryFilterComponent } from "../../../shared/components/category-filter/category-filter.component";

export interface ProductDetailsDialogData {
  product?: Product;
}

@Component({
  selector: "app-product-details-dialog",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    CategoryFilterComponent,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.product ? "Edit product" : "Add product" }}
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
          <textarea
            matInput
            formControlName="description"
            rows="2"
            maxlength="255"
          ></textarea>
        </mat-form-field>

        <div class="grid grid-cols-2 gap-3">
          <mat-form-field appearance="outline">
            <mat-label>SKU</mat-label>
            <input matInput formControlName="sku" maxlength="50" />
            @if (
              form.controls.sku.touched &&
              form.controls.sku.hasError("required")
            ) {
              <mat-error>SKU is required.</mat-error>
            }
          </mat-form-field>

          <app-category-filter
            [value]="form.controls.categoryId.value"
            [allowAll]="false"
            label="Category"
            (valueChange)="form.controls.categoryId.setValue($event)"
          >
          </app-category-filter>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <mat-form-field appearance="outline">
            <mat-label>Price</mat-label>
            <input
              matInput
              type="number"
              min="0"
              step="0.01"
              formControlName="price"
            />
            @if (
              form.controls.price.touched &&
              form.controls.price.hasError("required")
            ) {
              <mat-error>Required.</mat-error>
            } @else if (
              form.controls.price.touched && form.controls.price.hasError("min")
            ) {
              <mat-error>Cannot be negative.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Quantity</mat-label>
            <input
              matInput
              type="number"
              min="0"
              step="1"
              formControlName="quantity"
            />
            @if (
              form.controls.quantity.touched &&
              form.controls.quantity.hasError("required")
            ) {
              <mat-error>Required.</mat-error>
            } @else if (
              form.controls.quantity.touched &&
              form.controls.quantity.hasError("min")
            ) {
              <mat-error>Cannot be negative.</mat-error>
            }
          </mat-form-field>
        </div>
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
          {{ data.product ? "Save" : "Create" }}
        }
      </button>
    </mat-dialog-actions>
  `,
})
export class ProductDetailsDialogComponent {
  readonly ref =
    inject<MatDialogRef<ProductDetailsDialogComponent, Product | undefined>>(
      MatDialogRef,
    );
  readonly data = inject<ProductDetailsDialogData>(MAT_DIALOG_DATA);

  private readonly fb = inject(FormBuilder);
  private readonly products = inject(ProductService);
  private readonly snack = inject(MatSnackBar);

  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: [
      this.data.product?.name ?? "",
      [Validators.required, Validators.maxLength(255)],
    ],
    description: [
      this.data.product?.description ?? "",
      [Validators.maxLength(255)],
    ],
    sku: [
      this.data.product?.sku ?? "",
      [Validators.required, Validators.maxLength(50)],
    ],
    price: [
      this.data.product?.price ?? 0,
      [Validators.required, Validators.min(0)],
    ],
    quantity: [
      this.data.product?.quantity ?? 0,
      [Validators.required, Validators.min(0)],
    ],
    categoryId: [(this.data.product?.categoryId ?? null) as string | null],
  });

  protected save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const v = this.form.getRawValue();
    const body: CreateProductRequest = {
      name: v.name,
      description: v.description || null,
      sku: v.sku,
      price: Number(v.price),
      quantity: Number(v.quantity),
      categoryId: v.categoryId,
    };

    const obs$ = this.data.product
      ? this.products.update(this.data.product.id, body)
      : this.products.create(body);

    obs$.subscribe({
      next: (saved) => {
        this.snack.open(
          this.data.product ? "Product updated." : "Product created.",
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
