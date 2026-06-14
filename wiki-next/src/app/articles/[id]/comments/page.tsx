import { notFound } from 'next/navigation';
import { articlesApi } from '@/lib/api/articles';
import { commentsApi } from '@/lib/api/comments';
import { branchesApi } from '@/lib/api/branches';
import CommentsClient from './CommentsClient';

export default async function CommentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ branch?: string }>;
}) {
  const { id } = await params;
  const { branch = 'main' } = await searchParams;

  try {
    const [article, branches, comments] = await Promise.all([
      articlesApi.getById(id, branch, true),
      branchesApi.getByArticle(id),
      commentsApi.getByArticle(id),
    ]);
    return (
      <CommentsClient
        article={article}
        branches={branches}
        initialComments={comments}
        currentBranch={branch}
      />
    );
  } catch {
    notFound();
  }
}