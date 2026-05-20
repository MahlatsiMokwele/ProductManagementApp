import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { debounceTime, distinctUntilChanged } from "rxjs";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import { DestroyRef } from "@angular/core";

@Component({
  selector: "app-search-bar",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ label }}</mat-label>
      <input matInput [formControl]="control" [placeholder]="placeholder" />
      <mat-icon matPrefix>search</mat-icon>
    </mat-form-field>
  `,
})
export class SearchBarComponent implements OnInit {
  @Input() initialValue = "";
  @Input() label = "Search";
  @Input() placeholder = "Type to search...";
  @Input() debounceMs = 300;

  @Output() readonly search = new EventEmitter<string>();

  protected readonly control = new FormControl<string>("", {
    nonNullable: true,
  });
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (this.initialValue)
      this.control.setValue(this.initialValue, { emitEvent: false });

    this.control.valueChanges
      .pipe(
        debounceTime(this.debounceMs),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => this.search.emit(value));
  }
}
