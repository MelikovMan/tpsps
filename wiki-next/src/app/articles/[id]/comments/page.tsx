import { notFound } from 'next/navigation';
import { articlesApi } from '@/lib/api/articles';
import { commentsApi } from '@/lib/api/comments';
import { branchesApi } from '@/lib/api/branches';
import CommentsClient from './CommentsClient';
import ArticleTabs from '../components/ArticleTabs';
import { Suspense } from 'react';
import { Skeleton } from '@mantine/core';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ branch?: string }>;
}


async function CommentsLoader({ id, branch }: { id: string; branch: string }) {
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
}

export default async function CommentsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { branch = 'main' } = await searchParams;

  return (
    <Suspense fallback={<Skeleton height={400} animate />}>
      <CommentsLoader id={id} branch={branch} />
    </Suspense>
  );
}