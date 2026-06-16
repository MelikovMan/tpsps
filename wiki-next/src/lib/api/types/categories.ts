export interface CategoryResponse {
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  children?: string[];
}

export interface CategoryCreate {
  name: string;
  parent_id?: string;
}

export interface CategoryUpdate {
  name?: string;
  parent_id?: string;
}