import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from "@angular/material/paginator";
import {
  Component,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from "@angular/core";
import { MatTableModule, MatTableDataSource } from "@angular/material/table";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";

import { ProductService } from "../../../core/services/product.service";
import { AuthService } from "../../../core/services/auth.service";

import { Product } from "../../../core/models/product.model";

import { AppState, STATE_KEYS } from "../../../core/state/app-state";

import { CategoryFilterComponent } from "../../../shared/components/category-filter/category-filter.component";
import { ConfirmDialogComponent } from "../../../shared/components/confirm-dialog/confirm-dialog.component";
import { ProductDetailsDialogComponent } from "../product-details-dialog/product-details-dialog.component";
import { SearchBarComponent } from "../../../shared/components/search-bar/search-bar.component";

interface ProductFilter {
  search: string;
  categoryId: string | null;
}

@Component({
  selector: "app-product-list",
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressBarModule,
    SearchBarComponent,
    CategoryFilterComponent,
  ],
  template: `
    <section class="space-y-4">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-medium">Products</h1>
        @if (auth.isAdmin()) {
          <button
            mat-raised-button
            color="primary"
            (click)="openCreateDialog()"
          >
            <mat-icon>add</mat-icon> Add product
          </button>
        }
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <app-search-bar
          [initialValue]="filter().search"
          (search)="onSearch($event)"
        >
        </app-search-bar>
        <app-category-filter
          [value]="filter().categoryId"
          (valueChange)="onCategoryChange($event)"
        >
        </app-category-filter>
        <div class="flex items-center text-sm text-gray-600 md:justify-end">
          {{ totalCount() }} item{{ totalCount() === 1 ? "" : "s" }}
        </div>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      }

      <div class="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table mat-table [dataSource]="dataSource" class="w-full">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let p">{{ p.name }}</td>
          </ng-container>

          <ng-container matColumnDef="sku">
            <th mat-header-cell *matHeaderCellDef>SKU</th>
            <td mat-cell *matCellDef="let p">{{ p.sku }}</td>
          </ng-container>

          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Price</th>
            <td mat-cell *matCellDef="let p">{{ p.price | currency }}</td>
          </ng-container>

          <ng-container matColumnDef="quantity">
            <th mat-header-cell *matHeaderCellDef>Stock</th>
            <td mat-cell *matCellDef="let p">
              @if (p.quantity <= 0) {
                <span
                  class="inline-block px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700"
                  >Out of stock</span
                >
              } @else if (p.quantity <= 5) {
                <span
                  class="inline-block px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700"
                  >Low: {{ p.quantity }}</span
                >
              } @else {
                <span>{{ p.quantity }}</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="text-right">
              Actions
            </th>
            <td mat-cell *matCellDef="let p" class="text-right">
              @if (auth.isAdmin()) {
                <button
                  mat-icon-button
                  (click)="openEditDialog(p)"
                  title="Edit"
                >
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  mat-icon-button
                  color="warn"
                  (click)="confirmDelete(p)"
                  title="Delete"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td
              class="mat-cell p-6 text-center text-gray-500"
              [attr.colspan]="displayedColumns.length"
            >
              No products match your search.
            </td>
          </tr>
        </table>

        <mat-paginator
          [length]="totalCount()"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPage($event)"
        >
        </mat-paginator>
      </div>
    </section>
  `,
})
export class ProductListComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly products = inject(ProductService);
  private readonly dialog = inject(MatDialog);

  protected readonly displayedColumns = [
    "name",
    "sku",
    "price",
    "quantity",
    "actions",
  ];

  protected readonly dataSource = new MatTableDataSource<Product>([]);
  protected readonly loading = signal(false);
  protected readonly totalCount = signal(0);
  protected readonly filter = signal<ProductFilter>(
    AppState.get<ProductFilter>(STATE_KEYS.PRODUCT_FILTER) ?? {
      search: "",
      categoryId: null,
    },
  );

  protected pageIndex = 0;
  protected pageSize = 20;

  @ViewChild(MatPaginator) paginator?: MatPaginator;

  ngOnInit(): void {
    AppState.enablePersistence(STATE_KEYS.PRODUCT_FILTER);
    this.reload();
  }

  protected onSearch(value: string): void {
    this.updateFilter({ search: value });
  }

  protected onCategoryChange(categoryId: string | null): void {
    this.updateFilter({ categoryId });
  }

  protected onPage(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.reload();
  }

  protected openCreateDialog(): void {
    const ref = this.dialog.open(ProductDetailsDialogComponent, {
      data: {},
      width: "600px",
    });
    ref.afterClosed().subscribe((saved) => {
      if (saved) this.reload();
    });
  }

  protected openEditDialog(product: Product): void {
    const ref = this.dialog.open(ProductDetailsDialogComponent, {
      data: { product },
      width: "600px",
    });
    ref.afterClosed().subscribe((saved) => {
      if (saved) this.reload();
    });
  }

  protected confirmDelete(product: Product): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: "Delete product?",
        message: `Are you sure you want to delete "${product.name}"? This can't be undone.`,
        confirmText: "Delete",
        destructive: true,
      },
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.products.delete(product.id).subscribe({
        next: () => this.reload(),
      });
    });
  }

  private updateFilter(patch: Partial<ProductFilter>): void {
    const next = { ...this.filter(), ...patch };
    this.filter.set(next);
    AppState.set(STATE_KEYS.PRODUCT_FILTER, next);
    this.pageIndex = 0;
    this.paginator?.firstPage();
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    const f = this.filter();
    this.products
      .list({
        page: this.pageIndex + 1,
        pageSize: this.pageSize,
        categoryId: f.categoryId,
        search: f.search,
      })
      .subscribe({
        next: (result) => {
          this.dataSource.data = result.items;
          this.totalCount.set(result.totalCount);
        },
        // Clear stale rows on error so the user sees empty table rather
        // than results from a previous successful load.
        error: () => {
          this.dataSource.data = [];
          this.totalCount.set(0);
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
  }
}
