// app/articles/[id]/page.tsx
import { notFound } from 'next/navigation';
import { articlesApi } from '@/lib/api/articles';
import { branchesApi } from '@/lib/api/branches';
import ArticleDetail from './ArticleDetail';

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ branch?: string }>;
}) {
  const { id } = await params;
  const { branch = 'main' } = await searchParams;

  try {
    // Основная статья – обязательна
    const article = await articlesApi.getById(id, branch, true);

    // Ветки – не критичны, при ошибке используем пустой массив
    let branches: Awaited<ReturnType<typeof branchesApi.getByArticle>> = [];
    try {
      branches = await branchesApi.getByArticle(id);
    } catch (error) {
      console.error(`Failed to fetch branches for article ${id}:`, error);
    }

    // Коммиты и комментарии пока можно передать пустыми массивами,
    // если внутри `ArticleDetail` они опциональны или подгружаются клиентом.
    // Если нет – см. пункт 2.
    return (
      <ArticleDetail
        article={article}
        branches={branches}
        currentBranch={branch}
        initialCommits={[]}
        initialComments={[]}
      />
    );
  } catch (error) {
    console.error(`Failed to fetch article ${id}:`, error);
    notFound();
  }
}