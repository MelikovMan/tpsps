// app/api/articles/[id]/route.ts
import { getArticle } from '@/app/articles/lib/data';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // <-- разворачиваем Promise
  const searchParams = request.nextUrl.searchParams;
  const branch = searchParams.get('branch') || 'main';
  const withContent = searchParams.get('with_content') === 'true';

  try {
    const article = await getArticle(id, branch, withContent, true);
    return Response.json(article);
  } catch (error) {
    return Response.json({ error: 'Article not found' }, { status: 404 });
  }
}