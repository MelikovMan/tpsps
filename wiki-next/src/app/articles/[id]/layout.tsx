// app/articles/[id]/layout.tsx
import { notFound } from 'next/navigation';
import { getArticle, getArticleBranches } from '../lib/data';
import ArticleHeaderAndTabs from './components/ArticleHeaderandTabs';
import { BranchResponse } from '@/lib/api/types/article';

// ISR – перегенерация раз в час
export const revalidate = 3600;

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ArticleLayout({ children, params }: LayoutProps) {
  const { id } = await params;

  try {
    // Публичный доступ для layout – достаточно для отображения заголовка и вкладок
    const article = await getArticle(id, 'main', false, true);
    let branches: BranchResponse[] = [];
    try {
      branches = await getArticleBranches(id, true);
    } catch (error) {
      console.warn(`Failed to load branches for ${id}:`, error);
    }
    return (
      <ArticleHeaderAndTabs article={article} branches={branches} articleId={id}>
        {children}
      </ArticleHeaderAndTabs>
    );
  } catch (error) {
    console.error(`Failed to load article ${id}:`, error);
    notFound();
  }
}