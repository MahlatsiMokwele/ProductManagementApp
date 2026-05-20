import { authGuard } from "./core/guards/auth.guard";
import { Routes } from "@angular/router";

export const appRoutes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "products",
  },
  {
    path: "login",
    loadComponent: () =>
      import("./features/auth/login/login.component").then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: "register",
    loadComponent: () =>
      import("./features/auth/register/register.component").then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: "products",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/products/product-list/product-list.component").then(
        (m) => m.ProductListComponent,
      ),
  },
  {
    path: "categories",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/categories/category-management/category-management.component").then(
        (m) => m.CategoryManagementComponent,
      ),
  },
  {
    path: "**",
    redirectTo: "products",
  },
];
