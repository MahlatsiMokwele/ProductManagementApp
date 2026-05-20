import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { ReactiveFormsModule, FormControl } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatSelectModule } from "@angular/material/select";
import { CommonModule } from "@angular/common";

import { CategoryService } from "../../../core/services/category.service";

import { Category } from "../../../core/models/category.model";

//  Dropdown of categories
@Component({
  selector: "app-category-filter",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ label }}</mat-label>
      <mat-select [formControl]="control">
        @if (allowAll) {
          <mat-option [value]="null">All categories</mat-option>
        }
        @for (cat of categories(); track cat.id) {
          <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class CategoryFilterComponent implements OnInit {
  @Input() value: string | null = null;
  @Input() label = "Category";
  @Input() allowAll = true;

  @Output() readonly valueChange = new EventEmitter<string | null>();

  protected readonly categories = signal<Category[]>([]);
  protected readonly control = new FormControl<string | null>(null);

  private readonly categoryService = inject(CategoryService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.control.setValue(this.value, { emitEvent: false });
    this.control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.valueChange.emit(v));

    const cached = this.categoryService.cached();
    if (cached) {
      this.categories.set(cached);
    } else {
      this.categoryService
        .list()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((cats) => this.categories.set(cats));
    }
  }
}
