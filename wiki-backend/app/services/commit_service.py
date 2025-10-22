# app/services/commit_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional, Tuple
from uuid import UUID
from datetime import datetime
import difflib
import re
from typing import List, Tuple, Optional
from app.models.article import ArticleFull, Commit, Branch, CommitParent, Article
from app.models.user import User
from app.schemas.article import CommitResponse, CommitCreateInternal, CommitResponseDetailed, DiffResponse
import whatthepatch


class CommitService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_article_commits(self, article_id: UUID, skip: int = 0, limit: int = 50) -> List[Commit]:
        """Get all commits for a specific article"""
        query = select(Commit).where(
            Commit.article_id == article_id
        ).order_by(Commit.created_at.desc()).offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_branch_commits(self, branch_id: UUID, skip: int = 0, limit: int = 50) -> List[Commit]:
        """Get commits for a specific branch using recursive traversal"""
        # Get branch head commit
        branch_query = select(Branch).where(Branch.id == branch_id)
        branch_result = await self.db.execute(branch_query)
        branch = branch_result.scalar_one_or_none()
        
        if not branch:
            return []
        
        # Recursive CTE to get all branch commits
        cte_initial = select(
            Commit.id,
            Commit.article_id,
            Commit.author_id,
            Commit.message,
            Commit.content_diff,
            Commit.created_at,
            Commit.is_merge
        ).where(Commit.id == branch.head_commit_id).cte(name="commit_hierarchy", recursive=True)
        
        cte_recursive = cte_initial.union_all(
        select(
            Commit.id,
            Commit.article_id,
            Commit.author_id,
            Commit.message,
            Commit.content_diff,
            Commit.created_at,
            Commit.is_merge
        ).select_from(
            cte_initial.join(CommitParent, cte_initial.c.id == CommitParent.commit_id)
                       .join(Commit, CommitParent.parent_id == Commit.id)
        )
    )
        
        final_query = select(Commit).select_from(
            cte_recursive.join(Commit, Commit.id == cte_recursive.c.id)
        ).order_by(Commit.created_at.desc()).offset(skip).limit(limit)
        
        result = await self.db.execute(final_query)
        return list(result.scalars().all())

    async def get_commit(self, commit_id: UUID) -> Optional[Commit]:
        """Get a specific commit by ID"""
        query = select(Commit).where(Commit.id == commit_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_commit_with_details(self, commit_id: UUID) -> Optional[Tuple[Commit, str, str]]:
        """Get commit with author name and branch info"""
        query = select(Commit, User.username).join(
            User, Commit.author_id == User.id
        ).where(Commit.id == commit_id)
        
        result = await self.db.execute(query)
        commit_data = result.first()
        
        if not commit_data:
            return None
            
        commit, author_name = commit_data
        
        # Find branch for this commit
        branch_query = select(Branch.name).where(Branch.head_commit_id == commit_id)
        branch_result = await self.db.execute(branch_query)
        branch_name = branch_result.scalar_one_or_none() or "unknown"
        
        return commit, author_name, branch_name

    async def create_commit(
        self, 
        article_id: UUID, 
        author_id: UUID, 
        message: str, 
        content: str,
        branch_id: Optional[UUID] = None
    ) -> Commit:
        """Create a new commit in specified branch or main branch"""
        
        # If branch not specified, use main
        if not branch_id:
            branch_query = select(Branch).where(
                and_(Branch.article_id == article_id, Branch.name == "main")
            )
            branch_result = await self.db.execute(branch_query)
            branch = branch_result.scalar_one_or_none()
            
            if not branch:
                raise ValueError("Main branch not found for article")
        else:
            branch_query = select(Branch).where(Branch.id == branch_id)
            branch_result = await self.db.execute(branch_query)
            branch = branch_result.scalar_one_or_none()
            
            if not branch:
                raise ValueError("Branch not found")
        
        # Get previous commit to create diff
        previous_commit = None
        previous_full_content = ""
        if branch.head_commit_id:
            previous_commit = await self.get_commit(branch.head_commit_id)
            # Get full content of parent commit
            if previous_commit:
                previous_full_query = select(ArticleFull.text).where(
                    and_(
                        ArticleFull.article_id == article_id,
                        ArticleFull.commit_id == previous_commit.id
                    )
                )
                previous_full_result = await self.db.execute(previous_full_query)
                previous_full_content = previous_full_result.scalar_one_or_none() or ""
        
        # Create diff
        if previous_commit and previous_full_content:
            content_diff = self._create_diff(previous_full_content, content)
        else:
            content_diff = content  # First commit
        
        # Create new commit
        new_commit = Commit(
            article_id=article_id,
            author_id=author_id,
            message=message,
            content_diff=content_diff,
            is_merge=False
        )
        
        self.db.add(new_commit)
        await self.db.flush()
        
        # Create parent relationship
        if previous_commit:
            parent_relation = CommitParent(
                commit_id=new_commit.id,
                parent_id=previous_commit.id
            )
            self.db.add(parent_relation)
        
        # Update branch head
        branch.head_commit_id = new_commit.id
        
        # Build full content for this commit
        if previous_commit and previous_full_content:
            # Use parent's full content and apply diff
            full_text = self._apply_diff_whatthepatch(previous_full_content, content_diff)
        else:
            # First commit - content_diff is the full content
            full_text = content_diff

        if not full_text:
            raise ValueError("Couldn't build full text")
        
        # Store full content
        full_content = ArticleFull(
            article_id=article_id,
            commit_id=new_commit.id,
            text=full_text
        )
        self.db.add(full_content)

        await self.db.commit()
        await self.db.refresh(new_commit)
        
        return new_commit

    def _create_diff(self, old_content: str, new_content: str) -> str:
        """Create diff between old and new content using unified diff format"""
        old_lines = old_content.splitlines(keepends=True)
        new_lines = new_content.splitlines(keepends=True)
        
        # Ensure proper line endings
        if old_lines and not old_lines[-1].endswith('\n'):
            old_lines[-1] += '\n\\ No newline at end of file\n'
        if new_lines and not new_lines[-1].endswith('\n'):
            new_lines[-1] += '\n\\ No newline at end of file\n'
        
        diff = difflib.unified_diff(
            old_lines,
            new_lines,
            fromfile="previous",
            tofile="current",
            lineterm="",
            n=3  # Context lines
        )
        
        return "".join(diff)

    async def get_commit_diff(self, commit_id: UUID) -> Optional[DiffResponse]:
        """Get the diff for a specific commit"""
        commit = await self.get_commit(commit_id)
        if not commit:
            return None
        
        # Get parent commit
        parent_query = select(CommitParent.parent_id).where(CommitParent.commit_id == commit_id)
        parent_result = await self.db.execute(parent_query)
        parent_id = parent_result.scalar_one_or_none()
        
        if not parent_id:
            # First commit
            lines = commit.content_diff.splitlines()
            return DiffResponse(
                commit_id=commit_id,
                parent_commit_id=None,
                diff=f"+ {commit.content_diff}",
                added_lines=len(lines),
                removed_lines=0
            )
        
        parent_commit = await self.get_commit(parent_id)
        if not parent_commit:
            return None
        
        # Count changes using whatthepatch
        diff_text = commit.content_diff
        added_lines = 0
        removed_lines = 0
        
        try:
            patches = list(whatthepatch.parse_patch(diff_text))
            for patch in patches:
                if patch.changes:
                    for change in patch.changes:
                        if change.old is None and change.new is not None:
                            added_lines += 1
                        elif change.old is not None and change.new is None:
                            removed_lines += 1
        except Exception:
            # Fallback to simple line counting if whatthepatch fails
            diff_lines = diff_text.splitlines()
            added_lines = len([line for line in diff_lines if line.startswith('+') and not line.startswith('+++')])
            removed_lines = len([line for line in diff_lines if line.startswith('-') and not line.startswith('---')])
        
        return DiffResponse(
            commit_id=commit_id,
            parent_commit_id=parent_id,
            diff=diff_text,
            added_lines=added_lines,
            removed_lines=removed_lines
        )
    
    async def rebuild_content_at_commit(self, commit_id: UUID) -> Optional[str]:
        """Rebuild full content at specific commit using parent's full text and applying diff"""
        # First try to get from ArticleFull table (most efficient)
        full_text_query = select(ArticleFull.text).where(ArticleFull.commit_id == commit_id)
        full_text_result = await self.db.execute(full_text_query)
        existing_full_text = full_text_result.scalar_one_or_none()
        
        if existing_full_text is not None:
            return existing_full_text
        
        commit = await self.get_commit(commit_id)
        if not commit:
            return None
        
        # Get parent commit
        parent_query = select(CommitParent.parent_id).where(
            CommitParent.commit_id == commit_id
        )
        parent_result = await self.db.execute(parent_query)
        parent_id = parent_result.scalar_one_or_none()
        
        if not parent_id:
            # First commit - content_diff is the full content
            return commit.content_diff
        
        # Get parent's full content
        parent_full_query = select(ArticleFull.text).where(ArticleFull.commit_id == parent_id)
        parent_full_result = await self.db.execute(parent_full_query)
        parent_full_text = parent_full_result.scalar_one_or_none()
        
        if parent_full_text is None:
            # Parent full text not found, recursively build it
            parent_full_text = await self.rebuild_content_at_commit(parent_id)
            if parent_full_text is None:
                return None
        
        # Apply current commit's diff to parent's full content
        return self._apply_diff_whatthepatch(parent_full_text, commit.content_diff)
    
    def _apply_diff_whatthepatch(self, base_content: str, diff_content: str) -> str:
        """
        Apply unified diff to base content using whatthepatch library
        
        Args:
            base_content: Original content to apply diff to
            diff_content: Unified diff string to apply
        
        Returns:
            str: Content after applying the diff
        
        Raises:
            ValueError: If diff format is invalid or cannot be applied
        """
        if not diff_content.strip():
            return base_content
        
        # Check if this is a unified diff or full content (first commit)
        if not self._is_unified_diff(diff_content):
            return diff_content
        
        try:
            # Parse the diff using whatthepatch
            patches = list(whatthepatch.parse_patch(diff_content))
            
            if not patches:
                return base_content
            
            # Convert base content to lines
            base_lines = base_content.splitlines(keepends=True)
            
            # Apply all patches
            result_lines = base_lines
            for patch in patches:
                if patch.changes:
                    # Apply patch using whatthepatch's logic
                    result_lines = self._apply_patch_to_lines(result_lines, patch)
            
            return ''.join(result_lines)
            
        except Exception as e:
            # Fallback to manual application if whatthepatch fails
            print(f"whatthepatch failed, using fallback: {e}")
            return self._apply_diff_fallback(base_content, diff_content)
    
    def _apply_patch_to_lines(self, lines: List[str], patch) -> List[str]:
        """Apply a single patch to lines"""
        result = lines.copy()
        
        # Group changes by their old line numbers
        changes_by_old_line = {}
        for change in patch.changes:
            if change.old is not None:
                changes_by_old_line[change.old] = change
        
        # Apply changes in reverse order to maintain line numbers
        sorted_old_lines = sorted(changes_by_old_line.keys(), reverse=True)
        
        for old_line_num in sorted_old_lines:
            change = changes_by_old_line[old_line_num]
            idx = old_line_num - 1  # Convert to 0-based index
            
            if change.old is not None and change.new is None:
                # Delete line
                if 0 <= idx < len(result):
                    del result[idx]
            elif change.old is not None and change.new is not None:
                # Modify line
                if 0 <= idx < len(result):
                    result[idx] = change.line + ('\n' if not change.line.endswith('\n') else '')
            elif change.old is None and change.new is not None:
                # Add line
                new_line = change.line + ('\n' if not change.line.endswith('\n') else '')
                if idx >= len(result):
                    result.append(new_line)
                else:
                    result.insert(idx, new_line)
        
        return result
    
    def _apply_diff_fallback(self, base_content: str, diff_content: str) -> str:
        """Fallback method for applying diff when whatthepatch fails"""
        try:
            # Simple implementation for basic diff application
            base_lines = base_content.splitlines(keepends=True)
            diff_lines = diff_content.splitlines(keepends=True)
            
            result = []
            i = 0
            j = 0
            
            while i < len(diff_lines):
                line = diff_lines[i]
                
                if line.startswith('---') or line.startswith('+++') or line.startswith('@@'):
                    i += 1
                    continue
                elif line.startswith(' '):
                    # Context line - keep as is
                    if j < len(base_lines):
                        result.append(base_lines[j])
                    j += 1
                    i += 1
                elif line.startswith('+'):
                    # Added line
                    result.append(line[1:])
                    i += 1
                elif line.startswith('-'):
                    # Removed line - skip
                    j += 1
                    i += 1
                else:
                    i += 1
            
            # Add any remaining base lines
            while j < len(base_lines):
                result.append(base_lines[j])
                j += 1
            
            return ''.join(result)
            
        except Exception as e:
            print(f"Fallback diff application also failed: {e}")
            return base_content
    
    def _is_unified_diff(self, content: str) -> bool:
        """Check if content is a unified diff format"""
        lines = content.splitlines()
    
        # Check for unified diff headers
        has_diff_header = False
        has_hunk_header = False
    
        for line in lines:
            if line.startswith('--- ') or line.startswith('+++ '):
                has_diff_header = True
            elif line.startswith('@@') and line.endswith('@@'):
                has_hunk_header = True
                break
    
        return has_diff_header and has_hunk_header

    async def revert_commit(self, commit_id: UUID, user_id: UUID) -> Optional[Commit]:
        """Revert a specific commit"""
        commit_to_revert = await self.get_commit(commit_id)
        if not commit_to_revert:
            return None
        
        # Get parent commit
        parent_query = select(CommitParent.parent_id).where(CommitParent.commit_id == commit_id)
        parent_result = await self.db.execute(parent_query)
        parent_id = parent_result.scalar_one_or_none()
        
        if not parent_id:
            # Cannot revert the first commit
            return None
        
        # Get parent's full content directly from ArticleFull
        parent_full_query = select(ArticleFull.text).where(ArticleFull.commit_id == parent_id)
        parent_full_result = await self.db.execute(parent_full_query)
        parent_content = parent_full_result.scalar_one_or_none()
        
        if parent_content is None:
            # Fallback to rebuilding if not found in ArticleFull
            parent_content = await self.rebuild_content_at_commit(parent_id)
        
        if parent_content is None:
            return None
        
        # Find branch containing the commit
        branch_query = select(Branch).join(
            CommitParent, Branch.head_commit_id == CommitParent.commit_id
        ).where(CommitParent.parent_id == commit_id)
        
        branch_result = await self.db.execute(branch_query)
        branch = branch_result.scalar_one_or_none()
        
        if not branch:
            return None
        
        # Create revert commit
        revert_commit = await self.create_commit(
            article_id=commit_to_revert.article_id,
            author_id=user_id,
            message=f"Revert '{commit_to_revert.message}'",
            content=parent_content,
            branch_id=branch.id
        )
        
        return revert_commit