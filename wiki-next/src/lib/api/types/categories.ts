export interface CategoryResponse {
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  children?: string[];
}