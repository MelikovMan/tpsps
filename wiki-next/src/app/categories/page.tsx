import { categoriesApi } from '@/lib/api/categories';
import CategoryListClient from './CategoryListClient';

export default async function CategoriesPage() {
  // Загружаем только корневые категории на сервере
  const initialCategories = await categoriesApi.getList();
  return <CategoryListClient initialCategories={initialCategories} />;
}