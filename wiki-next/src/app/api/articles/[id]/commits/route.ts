// app/api/articles/[id]/commits/route.ts
import { getArticleBranches, getArticleCommits } from '@/app/articles/lib/data';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const branch = searchParams.get('branch') || 'main';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const skip = (page - 1) * limit;

  try {
    // Публичный доступ (true) – игнорируем куки
    const branches = await getArticleBranches(id, true);
    const currentBranch = branches.find(b => b.name === branch);
    const { items: commits, total } = await getArticleCommits(
      id,
      currentBranch?.id,
      skip,
      limit,
      true,
      true // publicAccess
    );
    return Response.json({ commits, total, currentPage: page });
  } catch (error) {
    console.error('API /commits error:', error);
    return Response.json({ error: 'Failed to load commits' }, { status: 500 });
  }
}