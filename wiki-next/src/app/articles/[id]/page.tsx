import { notFound } from 'next/navigation';
import { articlesApi } from '@/lib/api/articles';
import { branchesApi } from '@/lib/api/branches';
import ArticleDetail from './ArticleDetail';

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { branch?: string };
}) {
  const branch = searchParams.branch || 'main';

  try {
    const [article, branches] = await Promise.all([
      articlesApi.getById(params.id, branch, true),
      branchesApi.getByArticle(params.id),
    ]);
    return <ArticleDetail article={article} branches={branches} currentBranch={branch} />;
  } catch {
    notFound();
  }
}