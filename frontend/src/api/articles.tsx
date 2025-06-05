// src/api/articles.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { type ArticleCreate, type ArticleEditCommit, type ArticleFullResponse, type ArticleResponse, type ArticleUpdate, type BranchCreate, type BranchCreateFromCommit, type BranchResponse, type CommitCreate, type CommitResponse, type CommitResponseDetailed, type DiffResponse, type MergeBranchRequest } from './article';

interface ArticlesQueryParams {
  skip?: number;
  limit?: number;
  status?: string;
  search?: string;
}


export const useArticles = (params: ArticlesQueryParams = {}) => {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: async () => {
      const response = await apiClient.get<ArticleResponse[]>('/articles', {
        params: {
          skip: params.skip || 0,
          limit: params.limit || 10,
          status: params.status,
          search: params.search
        }
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 минут кэширования
  });
};

export const useArticle = (articleId: string, branch: string = 'main') => {
  return useQuery({
    queryKey: ['article', articleId, branch],
    queryFn: async () => {
      const response = await apiClient.get<ArticleFullResponse>(`/articles/${articleId}`, {
        params: { branch }
      });
      return response.data;
    },
    enabled: !!articleId, // Запрос выполняется только при наличии articleId
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 минут кэширования
  });
};

export const useArticleBranches = (articleId: string, includePrivate: boolean = false) => {
  return useQuery({
    queryKey: ['branches', articleId, includePrivate],
    queryFn: async () => {
      const response = await apiClient.get<BranchResponse[]>(`/branches/article/${articleId}`, {
        params: { include_private: includePrivate }
      });
      return response.data;
    },
    enabled: !!articleId,
    staleTime: 2 * 60 * 1000,
  });
};


export const useBranch = (branchId: string) => {
  return useQuery({
    queryKey: ['branch', branchId],
    queryFn: async () => {
      const response = await apiClient.get<BranchResponse>(`/branches/${branchId}`);
      return response.data;
    },
    enabled: !!branchId,
  });
};

export const useBranchByName = (articleId: string, branchName: string) => {
  return useQuery({
    queryKey: ['branch', articleId, branchName],
    queryFn: async () => {
      const response = await apiClient.get<BranchResponse>(`/branches/article/${articleId}/by-name/${branchName}`);
      return response.data;
    },
    enabled: !!articleId && !!branchName,
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (branchData: BranchCreate) => {
      const response = await apiClient.post<BranchResponse>('/branches/', branchData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branches', variables.article_id] });
    },
  });
};

export const useCreateBranchFromCommit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ articleId, branchData }: { articleId: string; branchData: BranchCreateFromCommit }) => {
      const response = await apiClient.post<BranchResponse>(`/branches/article/${articleId}/from-commit`, branchData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branches', variables.articleId] });
    },
  });
};

export const useDeleteBranch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (branchId: string) => {
      await apiClient.delete(`/branches/${branchId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
};

export const useMergeBranch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sourceBranchId, 
      targetBranchId, 
      message 
    }: { 
      sourceBranchId: string; 
      targetBranchId: string; 
      message?: string; 
    }) => {
      const data: MergeBranchRequest = message ? { message } : {};
      await apiClient.post(`/branches/${sourceBranchId}/merge/${targetBranchId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['commits'] });
    },
  });
};

// Commits
export const useArticleCommits = (articleId: string, skip: number = 0, limit: number = 50) => {
  return useQuery({
    queryKey: ['commits', 'article', articleId, skip, limit],
    queryFn: async () => {
      const response = await apiClient.get<CommitResponse[]>(`/commits/article/${articleId}`, {
        params: { skip, limit }
      });
      return response.data;
    },
    enabled: !!articleId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useBranchCommits = (branchId: string, skip: number = 0, limit: number = 50) => {
  return useQuery({
    queryKey: ['commits', 'branch', branchId, skip, limit],
    queryFn: async () => {
      const response = await apiClient.get<CommitResponse[]>(`/commits/branch/${branchId}`, {
        params: { skip, limit }
      });
      return response.data;
    },
    enabled: !!branchId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCommit = (commitId: string) => {
  return useQuery({
    queryKey: ['commit', commitId],
    queryFn: async () => {
      const response = await apiClient.get<CommitResponse>(`/commits/${commitId}`);
      return response.data;
    },
    enabled: !!commitId,
  });
};

export const useCommitDetailed = (commitId: string) => {
  return useQuery({
    queryKey: ['commit', 'detailed', commitId],
    queryFn: async () => {
      const response = await apiClient.get<CommitResponseDetailed>(`/commits/${commitId}/detailed`);
      return response.data;
    },
    enabled: !!commitId,
  });
};

export const useCommitDiff = (commitId: string) => {
  return useQuery({
    queryKey: ['commit', 'diff', commitId],
    queryFn: async () => {
      const response = await apiClient.get<DiffResponse>(`/commits/${commitId}/diff`);
      return response.data;
    },
    enabled: !!commitId,
  });
};

export const useCommitContent = (commitId: string) => {
  return useQuery({
    queryKey: ['commit', 'content', commitId],
    queryFn: async () => {
      const response = await apiClient.get<{ commit_id: string; content: string }>(`/commits/${commitId}/content`);
      return response.data;
    },
    enabled: !!commitId,
  });
};

export const useCreateCommit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ articleId, commitData }: { articleId: string; commitData: CommitCreate }) => {
      const response = await apiClient.post<CommitResponse>(`/commits/article/${articleId}`, commitData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commits', 'article', variables.articleId] });
      queryClient.invalidateQueries({ queryKey: ['article', variables.articleId] });
      if (variables.commitData.branch_id) {
        queryClient.invalidateQueries({ queryKey: ['commits', 'branch', variables.commitData.branch_id] });
      }
    },
  });
};

export const useRevertCommit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commitId: string) => {
      const response = await apiClient.post<CommitResponse>(`/commits/${commitId}/revert`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commits'] });
      queryClient.invalidateQueries({ queryKey: ['article'] });
    },
  });
};
export const useCreateArticle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (articleData: ArticleCreate) => {
      const response = await apiClient.post<ArticleResponse>('/articles/', {
        title: articleData.title,
        content: articleData.content,
        status: articleData.status || 'draft',
        article_type: articleData.article_type || 'article',
        message: articleData.message || 'Initial commit'
      });
      return response.data;
    },
    onSuccess: () => {
      // Обновляем кэш списка статей
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error) => {
      console.error('Error creating article:', error);
    }
  });
};

// Обновление статьи
export const useEditArticle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      articleId, 
      editData, 
      branch = 'main' 
    }: { 
      articleId: string; 
      editData: ArticleEditCommit; 
      branch?: string;
    }) => {
      // Сначала получаем информацию о ветке
      const branchResponse = await apiClient.get<BranchResponse>(
        `/branches/article/${articleId}/by-name/${branch}`
      );
      
      // Создаем коммит в указанной ветке
      const commitData: CommitCreate = {
        message: editData.message,
        content: editData.content,
        branch_id: branchResponse.data.id
      };
      
      const response = await apiClient.post<CommitResponse>(
        `/commits/article/${articleId}`, 
        commitData
      );
      
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Инвалидируем все связанные кэши
      queryClient.invalidateQueries({ queryKey: ['article', variables.articleId] });
      queryClient.invalidateQueries({ queryKey: ['commits', 'article', variables.articleId] });
      queryClient.invalidateQueries({ queryKey: ['branches', variables.articleId] });
      
      // Если редактировали не main ветку, инвалидируем и её кэш
      if (variables.branch && variables.branch !== 'main') {
        queryClient.invalidateQueries({ queryKey: ['article', variables.articleId, variables.branch] });
      }
    },
    onError: (error) => {
      console.error('Error editing article:', error);
    }
  });
};

// Альтернативный хук для быстрого редактирования с автоматическим сообщением коммита
export const useQuickEditArticle = () => {
  const editArticle = useEditArticle();
  //const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      articleId, 
      content, 
      branch = 'main',
      customMessage 
    }: { 
      articleId: string; 
      content: string; 
      branch?: string;
      customMessage?: string;
    }) => {
      const message = customMessage || `Update article content (${new Date().toISOString()})`;
      
      return editArticle.mutateAsync({
        articleId,
        branch,
        editData: {
          message,
          content
        }
      });
    },
  });
};


// Удаление статьи
export const useDeleteArticle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (articleId: string) => {
      await apiClient.delete(`/articles/${articleId}`);
    },
    onSuccess: () => {
      // Обновляем кэш списка статей
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error) => {
      console.error('Error deleting article:', error);
    }
  });
};
