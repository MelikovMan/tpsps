import { notFound } from 'next/navigation';
import { articlesApi } from '@/lib/api/articles';
import { branchesApi } from '@/lib/api/branches';
import { commitsApi } from '@/lib/api/commits';
import { commentsApi } from '@/lib/api/comments';
import ArticleDetail from './ArticleDetail';

export default async function ArticlePage({ params }: { params: { id: string; branch?: string[] } }) {
  const branch = params.branch?.[0] || 'main';

  try {
    const [article, branches, initialCommits, initialComments] = await Promise.all([
      articlesApi.getById(params.id, branch, true),
      branchesApi.getByArticle(params.id),
      commitsApi.getByArticle(params.id, 0, 5),      // первые 5 коммитов
      commentsApi.getByArticle(params.id),            // все комментарии (можно лимитировать)
    ]);

    return (
      <ArticleDetail
        article={article}
        branches={branches}
        initialCommits={initialCommits}
        initialComments={initialComments}
        currentBranch={branch}
      />
    );
  } catch (error) {
    notFound();
  }
}