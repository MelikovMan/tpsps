from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Row, select, and_, or_
from typing import List, Optional, Tuple
from uuid import UUID
from datetime import datetime

from app.models.article import Branch, Commit, CommitParent, Article
from app.models.user import User
from app.schemas.article import BranchCreate, BranchCreateFromCommit, BranchUpdate


class BranchService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_article_branches(
        self, 
        article_id: UUID, 
        user_id: Optional[UUID] = None,
        include_private: bool = False
    ) -> List[Branch]:
        """Get all branches for a specific article with access control"""
        query = select(Branch).where(Branch.article_id == article_id)
        
        # Apply privacy filter if user is provided
        if user_id and not include_private:
            query = query.where(
                or_(
                    Branch.is_private == False,
                    Branch.created_by == user_id
                )
            )
        elif not include_private:
            query = query.where(Branch.is_private == False)
        
        query = query.order_by(Branch.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_branch(self, branch_data: BranchCreate, created_by: UUID) -> Branch:
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
        
        # Проверяем права доступа к коммиту
        if commit.article_id != branch_data.article_id:
            raise ValueError("Head commit doesn't belong to this article")
        
        branch = Branch(
            article_id=branch_data.article_id,
            name=branch_data.name,
            description=branch_data.description or "New branch",
            head_commit_id=branch_data.head_commit_id,
            is_protected=branch_data.is_protected or False,
            is_private=branch_data.is_private or False,
            created_by=created_by
        )
        
        self.db.add(branch)
        await self.db.commit()
        await self.db.refresh(branch)
        return branch

    async def create_branch_from_commit(
        self, 
        article_id: UUID, 
        branch_data: BranchCreateFromCommit,
        created_by: UUID
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
            head_commit_id=branch_data.source_commit_id,
            is_protected=branch_data.is_protected,
            is_private=branch_data.is_private
        )
        
        return await self.create_branch(branch_create, created_by)

    async def get_branch(self, branch_id: UUID, user_id: Optional[UUID] = None) -> Optional[Branch]:
        """Get a specific branch by ID with access control"""
        query = select(Branch).where(Branch.id == branch_id)
        result = await self.db.execute(query)
        branch = result.scalar_one_or_none()
        
        if not branch:
            return None
        
        # Check access for private branches
        if branch.is_private and user_id and branch.created_by != user_id:
            return None
        
        return branch

    async def get_branch_by_name(
        self, 
        article_id: UUID, 
        branch_name: str, 
        user_id: Optional[UUID] = None
    ) -> Optional[Branch]:
        """Get a branch by name within an article with access control"""
        query = select(Branch).where(
            and_(
                Branch.article_id == article_id,
                Branch.name == branch_name
            )
        )
        result = await self.db.execute(query)
        branch = result.scalar_one_or_none()
        
        if not branch:
            return None
        
        # Check access for private branches
        if branch.is_private and user_id and branch.created_by != user_id:
            return None
        
        return branch

    async def update_branch(
        self, 
        branch_id: UUID, 
        branch_data: BranchUpdate, 
        user_id: UUID
    ) -> Optional[Branch]:
        """Update a branch (only creator or admin can update)"""
        branch = await self.get_branch(branch_id, user_id)
        
        if not branch:
            return None
        
        # Only creator can update the branch
        if branch.created_by != user_id:
            raise ValueError("Only branch creator can update the branch")
        
        # Cannot rename main branch
        if branch.name == "main" and branch_data.name and branch_data.name != "main":
            raise ValueError("Cannot rename main branch")
        
        # Check for name uniqueness if name is being changed
        if branch_data.name and branch_data.name != branch.name:
            existing_query = select(Branch).where(
                and_(
                    Branch.article_id == branch.article_id,
                    Branch.name == branch_data.name
                )
            )
            existing_result = await self.db.execute(existing_query)
            if existing_result.scalar_one_or_none():
                raise ValueError(f"Branch '{branch_data.name}' already exists")
        
        # Update fields
        update_data = branch_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(branch, field, value)
        
        await self.db.commit()
        await self.db.refresh(branch)
        return branch

    async def delete_branch(self, branch_id: UUID, user_id: UUID) -> bool:
        """Delete a branch (only creator can delete, except main branch)"""
        branch = await self.get_branch(branch_id, user_id)
        
        if not branch:
            return False
        
        # Cannot delete main branch
        if branch.name == "main":
            raise ValueError("Cannot delete main branch")
        
        # Cannot delete protected branch
        if branch.is_protected:
            raise ValueError("Cannot delete protected branch")
        
        # Only creator can delete the branch
        if branch.created_by != user_id:
            raise ValueError("Only branch creator can delete the branch")
        
        await self.db.delete(branch)
        await self.db.commit()
        return True
    
    async def get_branch_by_head_commit(
        self, 
        article_id: UUID, 
        commit_id: UUID,
        user_id: Optional[UUID] = None
    ) -> Optional[Branch]:
        """Get branch where the given commit is the head commit"""
        query = select(Branch).where(
            and_(
                Branch.article_id == article_id,
                Branch.head_commit_id == commit_id
            )
        )
        result = await self.db.execute(query)
        branch = result.scalar_one_or_none()
        
        if not branch:
            return None
        
        # Check access for private branches
        if branch.is_private and user_id and branch.created_by != user_id:
            return None
        
        return branch

    async def merge_branch(
        self, 
        source_branch_id: UUID, 
        target_branch_id: UUID, 
        user_id: UUID,
        message: Optional[str] = None
    ) -> bool:
        """Merge a branch into another branch"""
        # Get both branches with access control
        source_branch = await self.get_branch(source_branch_id, user_id)
        target_branch = await self.get_branch(target_branch_id, user_id)
        
        if not source_branch or not target_branch:
            return False
        
        # Cannot merge into itself
        if source_branch_id == target_branch_id:
            raise ValueError("Cannot merge branch into itself")
        
        # Cannot merge main branch
        if source_branch.name == "main":
            raise ValueError("Cannot merge main branch")
        
        # Cannot merge into protected branch without permissions
        if target_branch.is_protected and target_branch.created_by != user_id:
            raise ValueError("Cannot merge into protected branch")
        
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

    async def get_branches_with_commit_count(
        self, 
        article_id: UUID, 
        user_id: Optional[UUID] = None
    ) -> List[Tuple[Branch, int]]:
        """Get all branches for an article with commit counts"""
        branches = await self.get_article_branches(article_id, user_id)
        result = []
        
        for branch in branches:
            count = await self.get_branch_commits_count(branch.id)
            result.append((branch, count))
        
        return result

    async def get_user_branches(
        self, 
        user_id: UUID, 
        article_id: Optional[UUID] = None
    ) -> List[Branch]:
        """Get all branches created by a user"""
        query = select(Branch).where(Branch.created_by == user_id)
        
        if article_id:
            query = query.where(Branch.article_id == article_id)
        
        query = query.order_by(Branch.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def can_access_branch(self, branch_id: UUID, user_id: UUID) -> bool:
        """Check if user can access a branch"""
        branch = await self.get_branch(branch_id)
        
        if not branch:
            return False
        
        # Public branches are accessible to everyone
        if not branch.is_private:
            return True
        
        # Private branches are only accessible to creator
        return branch.created_by == user_id