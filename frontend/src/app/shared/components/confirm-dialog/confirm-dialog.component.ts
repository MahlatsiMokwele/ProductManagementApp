import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { Component, Inject } from "@angular/core";
import { CommonModule } from "@angular/common";

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

@Component({
  selector: "app-confirm-dialog",
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>
        {{ data.cancelText ?? "Cancel" }}
      </button>
      <button
        mat-raised-button
        [color]="data.destructive ? 'warn' : 'primary'"
        (click)="ref.close(true)"
      >
        {{ data.confirmText ?? "Confirm" }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    public readonly ref: MatDialogRef<ConfirmDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public readonly data: ConfirmDialogData,
  ) {}
}
