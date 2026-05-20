import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { Component, OnInit, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { CommonModule } from "@angular/common";

import {
  Category,
  CategoryTreeNode,
} from "../../../core/models/category.model";

import { CategoryService } from "../../../core/services/category.service";
import { AuthService } from "../../../core/services/auth.service";

import { ConfirmDialogComponent } from "../../../shared/components/confirm-dialog/confirm-dialog.component";
import { CategoryDialogComponent } from "../category-dialog/category-dialog.component";

@Component({
  selector: "app-category-management",
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatDialogModule,
  ],
  template: `
    <section class="space-y-4">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-medium">Categories</h1>
        @if (auth.isAdmin()) {
          <button mat-raised-button color="primary" (click)="openAddDialog()">
            <mat-icon>add</mat-icon> Add category
          </button>
        }
      </header>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      }

      <mat-card>
        <mat-card-content>
          @if (tree().length === 0 && !loading()) {
            <p class="text-gray-500 text-center py-6">No categories yet.</p>
          } @else {
            <ul class="list-none p-0">
              @for (node of tree(); track node.id) {
                <ng-container
                  *ngTemplateOutlet="branch; context: { node, depth: 0 }"
                ></ng-container>
              }
            </ul>
          }
        </mat-card-content>
      </mat-card>
    </section>

    <ng-template #branch let-node="node" let-depth="depth">
      <li class="py-1" [style.padding-left.px]="depth * 24">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <mat-icon class="text-gray-500">
              {{ node.children.length > 0 ? "folder" : "sell" }}
            </mat-icon>
            <div>
              <div class="font-medium">{{ node.name }}</div>
              @if (node.description) {
                <div class="text-sm text-gray-500">{{ node.description }}</div>
              }
            </div>
          </div>
          @if (auth.isAdmin()) {
            <div class="flex items-center">
              <button
                mat-icon-button
                (click)="openEditDialog(node)"
                title="Edit"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                color="warn"
                (click)="confirmDelete(node)"
                title="Delete"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          }
        </div>
        @if (node.children.length > 0) {
          <ul class="list-none p-0">
            @for (child of node.children; track child.id) {
              <ng-container
                *ngTemplateOutlet="
                  branch;
                  context: { node: child, depth: depth + 1 }
                "
              ></ng-container>
            }
          </ul>
        }
      </li>
    </ng-template>
  `,
})
export class CategoryManagementComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly categories = inject(CategoryService);
  private readonly dialog = inject(MatDialog);

  protected readonly loading = signal(false);
  protected readonly tree = signal<CategoryTreeNode[]>([]);
  protected readonly flat = signal<Category[]>([]);

  ngOnInit(): void {
    this.reload();
  }

  protected openAddDialog(): void {
    const ref = this.dialog.open(CategoryDialogComponent, {
      data: { categories: this.flat() },
      width: "500px",
    });
    ref.afterClosed().subscribe((saved) => {
      if (saved) this.reload();
    });
  }

  protected openEditDialog(node: CategoryTreeNode): void {
    const full = this.flat().find((c) => c.id === node.id) ?? {
      id: node.id,
      name: node.name,
      description: node.description,
      parentCategoryId: null,
      auditUserId: "",
      createdAt: "",
    };

    const ref = this.dialog.open(CategoryDialogComponent, {
      data: { categories: this.flat(), category: full },
      width: "500px",
    });
    ref.afterClosed().subscribe((saved) => {
      if (saved) this.reload();
    });
  }

  protected confirmDelete(node: CategoryTreeNode): void {
    const childCount = node.children.length;
    const message =
      childCount > 0
        ? `Delete "${node.name}"? Its ${childCount} sub-categor${childCount === 1 ? "y" : "ies"} will become root categories, and any products in this category will become uncategorised.`
        : `Delete "${node.name}"? Any products in this category will become uncategorised.`;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: "Delete category?",
        message,
        confirmText: "Delete",
        destructive: true,
      },
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.categories.delete(node.id).subscribe({
        next: () => this.reload(),
      });
    });
  }

  private reload(): void {
    this.loading.set(true);
    // Fetch in parallel-ish; we could use forkJoin but two GETs is cheap.
    this.categories.list().subscribe({
      next: (list) => this.flat.set(list),
    });
    this.categories.tree().subscribe({
      next: (tree) => this.tree.set(tree),
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }
}
