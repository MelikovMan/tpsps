// src/components/Moderation/useModerationDataV2.ts
import { useArticles } from '../../api/articles';
import { useAllCommits, useAllBranches } from '../../api/moderation';
import { type CommitResponse, type BranchResponse} from '../../api/article';

export interface CommitWithDetails extends CommitResponse {
  article_title?: string;
}

export interface BranchWithDetails extends BranchResponse {
  article_title?: string;
}

export const useModerationData = () => {
  const { 
    data: articlesData = [], 
    refetch: refetchArticles,
    isLoading: articlesLoading,
    error: articlesError
  } = useArticles({ 
    limit: 1000,
    status: 'all'
  });

  const {
    data: allCommitsData = [],
    isLoading: commitsLoading,
    error: commitsError
  } = useAllCommits();

  const {
    data: allBranchesData = [],
    isLoading: branchesLoading,
    error: branchesError
  } = useAllBranches();

  // Enhance commits with article titles
  const enhancedCommits: CommitWithDetails[] = allCommitsData.map(commit => {
    const article = articlesData.find(a => a.id === commit.article_id);
    return {
      ...commit,
      article_title: article?.title,
      article_id: commit.article_id
    };
  });

  // Enhance branches with article titles
  const enhancedBranches: BranchWithDetails[] = allBranchesData.map(branch => {
    const article = articlesData.find(a => a.id === branch.article_id);
    return {
      ...branch,
      article_title: article?.title,
      article_id: branch.article_id
    };
  });

  const isLoading = articlesLoading || commitsLoading || branchesLoading;
  const error = articlesError || commitsError || branchesError;

  const refreshData = () => {
    refetchArticles();
    // Note: The React Query hooks will auto-refresh due to refetchInterval
  };

  return {
    articlesData,
    allCommits: enhancedCommits,
    allBranches: enhancedBranches,
    isLoading,
    error: error as Error | null,
    refreshData
  };
};