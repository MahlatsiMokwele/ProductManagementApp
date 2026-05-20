import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap } from "rxjs";

import { environment } from "../../../environments/environment";

import {
  Category,
  CategoryTreeNode,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "../models/category.model";

import { AppState, STATE_KEYS } from "../state/app-state";

// Talks to /api/categories
@Injectable({ providedIn: "root" })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/categories`;

  list(): Observable<Category[]> {
    return this.http
      .get<Category[]>(this.url)
      .pipe(tap((cats) => AppState.set(STATE_KEYS.CATEGORIES, cats)));
  }

  // Synchronous cache read
  cached(): Category[] | undefined {
    return AppState.get<Category[]>(STATE_KEYS.CATEGORIES);
  }

  tree(): Observable<CategoryTreeNode[]> {
    return this.http.get<CategoryTreeNode[]>(`${this.url}/tree`);
  }

  create(body: CreateCategoryRequest): Observable<Category> {
    return this.http
      .post<Category>(this.url, body)
      .pipe(tap(() => AppState.clear(STATE_KEYS.CATEGORIES)));
  }

  update(id: string, body: UpdateCategoryRequest): Observable<Category> {
    return this.http
      .put<Category>(`${this.url}/${id}`, body)
      .pipe(tap(() => AppState.clear(STATE_KEYS.CATEGORIES)));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.url}/${id}`)
      .pipe(tap(() => AppState.clear(STATE_KEYS.CATEGORIES)));
  }
}
