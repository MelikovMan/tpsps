import { notFound } from 'next/navigation';
import { articlesApi } from '@/lib/api/articles';
import { commentsApi } from '@/lib/api/comments';
import { branchesApi } from '@/lib/api/branches';
import CommentsClient from './CommentsClient';

export default async function CommentsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { branch?: string };
}) {
  const branch = searchParams.branch || 'main';

  try {
    const [article, branches, comments] = await Promise.all([
      articlesApi.getById(params.id, branch, true),
      branchesApi.getByArticle(params.id),
      commentsApi.getByArticle(params.id),
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