export interface Category {
  id: string;
  name: string;
  description: string | null;
  parentCategoryId: string | null;
  auditUserId: string;
  createdAt: string;
}

// Tree node returned by GET /api/categories/tree
export interface CategoryTreeNode {
  id: string;
  name: string;
  description: string | null;
  children: CategoryTreeNode[];
}

// Body - POST /api/categories
export interface CreateCategoryRequest {
  name: string;
  description: string | null;
  parentCategoryId: string | null;
}

// Body - PUT /api/categories/{id}. Same shape as create
export type UpdateCategoryRequest = CreateCategoryRequest;
