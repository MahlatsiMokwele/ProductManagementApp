export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  price: number;
  quantity: number;
  categoryId: string | null;
  createdAt: string; // ISO date string
  updatedAt: string;
  auditUserId: string;
}

// Body - POST /api/products
export interface CreateProductRequest {
  name: string;
  description: string | null;
  sku: string;
  price: number;
  quantity: number;
  categoryId: string | null;
}

// Body - PUT /api/products/{id}. Same fields as create
export type UpdateProductRequest = CreateProductRequest;

// Paged envelope returned by GET /api/products
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
