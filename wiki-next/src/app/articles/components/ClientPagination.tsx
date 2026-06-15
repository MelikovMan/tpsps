'use client';
import {Pagination as MantinePagination} from '@mantine/core';
import { useRouter } from 'next/navigation';

export default function ClientPagination({ currentPage, totalPages, baseUrl, searchParams }: any) {
  const router = useRouter();
  
  const setPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`${baseUrl}?${params.toString()}`);
  };
  
  return <MantinePagination value={currentPage} onChange={setPage} total={totalPages} />;
}