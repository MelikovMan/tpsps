import { api } from './client';
import type { TemplateResponse } from './types/templates';

export const templatesApi = {
  // Получить список всех шаблонов
  getList: () =>
    api.get<TemplateResponse[]>('/templates/'),
};