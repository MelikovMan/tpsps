# app/services/branch_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Row, select, and_
from typing import List, Optional, Tuple
from uuid import UUID
from datetime import datetime

from app.models.article import Branch, Commit, CommitParent, Article
from app.schemas.article import BranchCreate, BranchCreateFromCommit


class BranchService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_article_branches(self, article_id: UUID) -> List[Branch]:
        """Get all branches for a specific article"""
        query = select(Branch).where(Branch.article_id == article_id).order_by(Branch.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_branch(self, branch_data: BranchCreate) -> Branch:
        """Create a new branch for an article"""
        # Проверяем существование статьи
        article_query = select(Article).where(Article.id == branch_data.article_id)
        article_result = await self.db.execute(article_query)
        article = article_result.scalar_one_or_none()
        
        if not article:
            raise ValueError("Article not found")
        
        # Проверяем уникальность имени ветки
        existing_branch_query = select(Branch).where(
            and_(
                Branch.article_id == branch_data.article_id,
                Branch.name == branch_data.name
            )
        )
        existing_result = await self.db.execute(existing_branch_query)
        existing_branch = existing_result.scalar_one_or_none()
        
        if existing_branch:
            raise ValueError(f"Branch '{branch_data.name}' already exists")
        
        # Проверяем существование коммита
        commit_query = select(Commit).where(Commit.id == branch_data.head_commit_id)
        commit_result = await self.db.execute(commit_query)
        commit = commit_result.scalar_one_or_none()
        
        if not commit:
            raise ValueError("Head commit not found")
        
        branch = Branch(
            article_id=branch_data.article_id,
            name=branch_data.name,
            description=branch_data.description,
            head_commit_id=branch_data.head_commit_id
        )
        
        self.db.add(branch)
        await self.db.commit()
        await self.db.refresh(branch)
        return branch

    async def create_branch_from_commit(
        self, 
        article_id: UUID, 
        branch_data: BranchCreateFromCommit
    ) -> Branch:
        """Create a new branch starting from a specific commit"""
        # Проверяем существование коммита и что он принадлежит статье
        commit_query = select(Commit).where(
            and_(
                Commit.id == branch_data.source_commit_id,
                Commit.article_id == article_id
            )
        )
        commit_result = await self.db.execute(commit_query)
        commit = commit_result.scalar_one_or_none()
        
        if not commit:
            raise ValueError("Source commit not found or doesn't belong to this article")
        
        # Создаем ветку
        branch_create = BranchCreate(
            article_id=article_id,
            name=branch_data.name,
            description=branch_data.description,
            head_commit_id=branch_data.source_commit_id
        )
        
        return await self.create_branch(branch_create)

    async def get_branch(self, branch_id: UUID) -> Optional[Branch]:
        """Get a specific branch by ID"""
        query = select(Branch).where(Branch.id == branch_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_branch_by_name(self, article_id: UUID, branch_name: str) -> Optional[Branch]:
        """Get a branch by name within an article"""
        query = select(Branch).where(
            and_(
                Branch.article_id == article_id,
                Branch.name == branch_name
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def delete_branch(self, branch_id: UUID) -> bool:
        """Delete a branch"""
        branch = await self.get_branch(branch_id)
        
        if not branch:
            return False
        
        # Cannot delete main branch
        if branch.name == "main":
            raise ValueError("Cannot delete main branch")
        
        await self.db.delete(branch)
        await self.db.commit()
        return True
    
    async def get_branch_by_head_commit(
        self, 
        article_id: UUID, 
        commit_id: UUID
    ) -> Optional[Branch]:
        """Get branch where the given commit is the head commit"""
        query = select(Branch).where(
            and_(
                Branch.article_id == article_id,
                Branch.head_commit_id == commit_id
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def merge_branch(
        self, 
        source_branch_id: UUID, 
        target_branch_id: UUID, 
        user_id: UUID,
        message: Optional[str] = None
    ) -> bool:
        """Merge a branch into another branch"""
        # Get both branches
        source_branch = await self.get_branch(source_branch_id)
        target_branch = await self.get_branch(target_branch_id)
        
        if not source_branch or not target_branch:
            return False
        
        # Cannot merge into itself
        if source_branch_id == target_branch_id:
            raise ValueError("Cannot merge branch into itself")
        
        # Cannot merge main branch
        if source_branch.name == "main":
            raise ValueError("Cannot merge main branch")
        
        # Get head commits
        source_head = await self._get_commit(source_branch.head_commit_id)
        target_head = await self._get_commit(target_branch.head_commit_id)
        
        if not source_head or not target_head:
            return False
        
        # Check if branches have diverged (simple check)
        if await self._is_ancestor(target_head.id, source_head.id):
            # Fast-forward merge possible
            target_branch.head_commit_id = source_head.id
        else:
            # Create merge commit
            merge_message = message or f"Merge branch '{source_branch.name}' into '{target_branch.name}'"
            
            # Rebuild content at source head
            from app.services.commit_service import CommitService
            commit_service = CommitService(self.db)
            merged_content = await commit_service.rebuild_content_at_commit(source_head.id)
            
            if merged_content is None:
                return False
            
            # Create merge commit
            merge_commit = Commit(
                article_id=target_branch.article_id,
                author_id=user_id,
                message=merge_message,
                content_diff=merged_content,
                is_merge=True
            )
            
            self.db.add(merge_commit)
            await self.db.flush()
            
            # Add parent relationships (merge commit has two parents)
            target_parent = CommitParent(
                commit_id=merge_commit.id,
                parent_id=target_head.id
            )
            source_parent = CommitParent(
                commit_id=merge_commit.id,
                parent_id=source_head.id
            )
            
            self.db.add(target_parent)
            self.db.add(source_parent)
            
            # Update target branch head
            target_branch.head_commit_id = merge_commit.id
        
        await self.db.commit()
        return True

    async def _get_commit(self, commit_id: UUID) -> Optional[Commit]:
        """Helper method to get commit"""
        query = select(Commit).where(Commit.id == commit_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def _is_ancestor(self, ancestor_id: UUID, descendant_id: UUID) -> bool:
        """Check if ancestor_id is an ancestor of descendant_id"""
        if ancestor_id == descendant_id:
            return True
        
        # Traverse up from descendant to see if we reach ancestor
        current_id = descendant_id
        visited = set()
        
        while current_id and current_id not in visited:
            visited.add(current_id)
            
            if current_id == ancestor_id:
                return True
            
            # Get parent commit
            parent_query = select(CommitParent.parent_id).where(
                CommitParent.commit_id == current_id
            ).limit(1)  # Get first parent for simplicity
            
            parent_result = await self.db.execute(parent_query)
            current_id = parent_result.scalar_one_or_none()
        
        return False

    async def get_branch_commits_count(self, branch_id: UUID) -> int:
        """Get the number of commits in a branch"""
        branch = await self.get_branch(branch_id)
        if not branch:
            return 0
        
        count = 0
        current_commit_id = branch.head_commit_id
        visited = set()
        
        while current_commit_id and current_commit_id not in visited:
            visited.add(current_commit_id)
            count += 1
            
            # Get parent commit
            parent_query = select(CommitParent.parent_id).where(
                CommitParent.commit_id == current_commit_id
            ).limit(1)
            
            parent_result = await self.db.execute(parent_query)
            current_commit_id = parent_result.scalar_one_or_none()
        
        return count

    async def get_branches_with_commit_count(self, article_id: UUID) -> List[Tuple[Branch, int]]:
        """Get all branches for an article with commit counts"""
        branches = await self.get_article_branches(article_id)
        result = []
        
        for branch in branches:
            count = await self.get_branch_commits_count(branch.id)
            result.append((branch, count))
        
        return result