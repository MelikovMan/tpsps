import { notFound } from 'next/navigation';
import { articlesApi } from '@/lib/api/articles';
import { branchesApi } from '@/lib/api/branches';
import { commentsApi } from '@/lib/api/comments';
import CommentsClient from './CommentsClient';

interface Props {
  params: { id: string; branch?: string[] };
}

export default async function CommentsPage({ params }: Props) {
  const branch = params.branch?.[0] || 'main';

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
  } catch (error) {
    notFound();
  }
}