// src/api/moderation.ts
import apiClient from './client';
import { type CommitResponse, type BranchResponse, type ArticleResponse } from './article';

export interface ModerationStats {
  totalArticles: number;
  totalCommits: number;
  totalBranches: number;
  recentActivity: number;
}

export const moderationApi = {
  // Get all commits across all articles (for moderation purposes)
  getAllCommits: async (): Promise<CommitResponse[]> => {
    // Since we don't have a direct endpoint for all commits,
    // we'll need to fetch articles first, then their commits
    const articlesResponse = await apiClient.get<ArticleResponse[]>('/articles', {
      params: { limit: 1000, status: 'all' }
    });
    
    const commitsPromises = articlesResponse.data.map(article =>
      apiClient.get<CommitResponse[]>(`/commits/article/${article.id}`, {
        params: { limit: 100 }
      })
    );
    
    const commitsResults = await Promise.all(commitsPromises);
    return commitsResults.flatMap(response => response.data);
  },

  // Get all branches across all articles (for moderation purposes)
  getAllBranches: async (): Promise<BranchResponse[]> => {
    const articlesResponse = await apiClient.get<ArticleResponse[]>('/articles', {
      params: { limit: 1000, status: 'all' }
    });
    
    const branchesPromises = articlesResponse.data.map(article =>
      apiClient.get<BranchResponse[]>(`/branches/article/${article.id}`, {
        params: { include_private: true }
      })
    );
    
    const branchesResults = await Promise.all(branchesPromises);
    return branchesResults.flatMap(response => response.data);
  },

  // Get moderation statistics
  getStats: async (): Promise<ModerationStats> => {
    const articlesResponse = await apiClient.get<ArticleResponse[]>('/articles', {
      params: { limit: 1000, status: 'all' }
    });
    
    const articles = articlesResponse.data;
    
    // Get commits count for all articles
    const commitsCountPromises = articles.map(article =>
      apiClient.get<CommitResponse[]>(`/commits/article/${article.id}`, {
        params: { limit: 1 } // We just need the count
      }).then(response => response.data.length)
      .catch(() => 0)
    );
    
    // Get branches count for all articles
    const branchesCountPromises = articles.map(article =>
      apiClient.get<BranchResponse[]>(`/branches/article/${article.id}`)
        .then(response => response.data.length)
        .catch(() => 0)
    );
    
    const [commitsCounts, branchesCounts] = await Promise.all([
      Promise.all(commitsCountPromises),
      Promise.all(branchesCountPromises)
    ]);
    
    const totalCommits = commitsCounts.reduce((sum, count) => sum + count, 0);
    const totalBranches = branchesCounts.reduce((sum, count) => sum + count, 0);
    
    // Calculate recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCommitsPromises = articles.map(article =>
      apiClient.get<CommitResponse[]>(`/commits/article/${article.id}`, {
        params: { 
          limit: 100,
          // This would need backend support for time filtering
          // For now, we'll calculate client-side
        }
      })
    );
    
    const recentCommitsResults = await Promise.all(recentCommitsPromises);
    const allCommits = recentCommitsResults.flatMap(response => response.data);
    const recentActivity = allCommits.filter(commit => 
      new Date(commit.created_at) > oneDayAgo
    ).length;
    
    return {
      totalArticles: articles.length,
      totalCommits,
      totalBranches,
      recentActivity
    };
  }
};

// src/api/moderation.ts (additional hooks)
import { useQuery } from '@tanstack/react-query';

export const useModerationStats = () => {
  return useQuery({
    queryKey: ['moderation', 'stats'],
    queryFn: () => moderationApi.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  });
};

export const useAllCommits = () => {
  return useQuery({
    queryKey: ['moderation', 'commits'],
    queryFn: () => moderationApi.getAllCommits(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  });
};

export const useAllBranches = () => {
  return useQuery({
    queryKey: ['moderation', 'branches'],
    queryFn: () => moderationApi.getAllBranches(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  });
};