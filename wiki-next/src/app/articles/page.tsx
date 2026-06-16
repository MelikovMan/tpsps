// app/articles/page.tsx
import { getArticles } from './lib/data';
import ArticlesList from './components/ArticleList';
import { TransitionProvider } from './components/SearchTransitionContext';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    q?: string;
    lang?: string;
    fields?: string;
    hybrid?: string;
  }>;
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const limit = 10;
  const skip = (page - 1) * limit;

  // Загружаем данные на сервере
  const { items, total, isSearch } = await getArticles({
    skip,
    limit,
    status: params.status,
    search: params.q,
    language: params.lang,
    fields: params.fields,
    hybrid: params.hybrid === 'true',
  });

  return (
    <div>
      <h1>Список статей</h1>
      <TransitionProvider>
        <ArticlesList
          searchParams={params}
          items={items}
          total={total}
          isSearch={isSearch}
        />
      </TransitionProvider>
    </div>
  );
}