export interface TemplateResponse {
  id: string;
  name: string;
  content: string;
  variables?: Record<string, any>; // например { params: ['title','image'], defaults: { title:'' } }
  created_at: string;
}