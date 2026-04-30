import { articlesApi } from '@/lib/api/articles';
import ArticlesListClient from './ArticleList';

export default async function ArticlesPage() {
  const initialArticles = await articlesApi.getList({ skip: 0, limit: 10 });
  return <ArticlesListClient initialArticles={initialArticles} />;
}