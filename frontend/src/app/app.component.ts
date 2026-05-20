import { MatToolbarModule } from "@angular/material/toolbar";
import { RouterLink, RouterOutlet } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { AuthService } from "./core/services/auth.service";
import { MatIconModule } from "@angular/material/icon";
import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    @if (auth.isAuthenticated()) {
      <mat-toolbar color="primary" class="!flex !justify-between">
        <div class="flex items-center gap-4">
          <span class="font-medium">Product Catalog</span>
          <a mat-button routerLink="/products">Products</a>
          <a mat-button routerLink="/categories">Categories</a>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm opacity-90">
            {{ auth.currentUser()?.username }} ({{ auth.currentUser()?.role }})
          </span>
          <button mat-icon-button (click)="logout()" title="Sign out">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </mat-toolbar>
    }

    <main class="p-6 max-w-7xl mx-auto">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100%;
      }
    `,
  ],
})
export class AppComponent {
  protected readonly auth = inject(AuthService);

  protected logout(): void {
    this.auth.logout();
  }
}
