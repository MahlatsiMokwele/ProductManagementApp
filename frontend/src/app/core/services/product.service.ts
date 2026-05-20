import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

import { environment } from "../../../environments/environment";

import {
  CreateProductRequest,
  PagedResult,
  Product,
  UpdateProductRequest,
} from "../models/product.model";

//  * Talks to /api/products
@Injectable({ providedIn: "root" })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/products`;

  list(opts: {
    page: number;
    pageSize: number;
    categoryId?: string | null;
    search?: string | null;
  }): Observable<PagedResult<Product>> {
    let params = new HttpParams()
      .set("page", String(opts.page))
      .set("pageSize", String(opts.pageSize));
    if (opts.categoryId) params = params.set("categoryId", opts.categoryId);
    if (opts.search?.trim()) params = params.set("search", opts.search.trim());

    return this.http.get<PagedResult<Product>>(this.url, { params });
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.url}/${id}`);
  }

  lowStock(threshold = 5): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.url}/low-stock`, {
      params: new HttpParams().set("threshold", String(threshold)),
    });
  }

  create(body: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(this.url, body);
  }

  update(id: string, body: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.url}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
