import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { environment } from "../../../environments/environment";

import { ProductService } from "./product.service";

// Sanity tests for ProductService - verifying the URL/query construction.

describe("ProductService", () => {
  let service: ProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("list() builds the right URL with all params", () => {
    service
      .list({ page: 2, pageSize: 25, categoryId: "cat-1", search: "lap" })
      .subscribe();

    const req = http.expectOne(
      (r) =>
        r.url === `${environment.apiBaseUrl}/products` &&
        r.params.get("page") === "2" &&
        r.params.get("pageSize") === "25" &&
        r.params.get("categoryId") === "cat-1" &&
        r.params.get("search") === "lap",
    );
    expect(req.request.method).toBe("GET");
    req.flush({
      items: [],
      page: 2,
      pageSize: 25,
      totalCount: 0,
      totalPages: 0,
    });
  });

  it("list() omits empty categoryId and search", () => {
    service.list({ page: 1, pageSize: 20 }).subscribe();

    const req = http.expectOne(
      (r) =>
        r.url === `${environment.apiBaseUrl}/products` &&
        r.params.has("page") &&
        r.params.has("pageSize") &&
        !r.params.has("categoryId") &&
        !r.params.has("search"),
    );
    req.flush({
      items: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
    });
  });

  it("delete() sends DELETE to /api/products/:id", () => {
    service.delete("p-1").subscribe();
    const req = http.expectOne(`${environment.apiBaseUrl}/products/p-1`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });
});
