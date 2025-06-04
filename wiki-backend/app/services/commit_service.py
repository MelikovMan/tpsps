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
from app.models.article import Commit, Branch, CommitParent, Article
from app.models.user import User
from app.schemas.article import CommitResponse, CommitCreateInternal, CommitResponseDetailed, DiffResponse


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
        # Получаем head commit ветки
        branch_query = select(Branch).where(Branch.id == branch_id)
        branch_result = await self.db.execute(branch_query)
        branch = branch_result.scalar_one_or_none()
        
        if not branch:
            return []
        
        # Рекурсивный CTE для получения всех коммитов ветки
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
        
        # Найти ветку для этого коммита
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
        
        # Если ветка не указана, используем main
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
        
        # Получаем предыдущий коммит для создания diff
        previous_commit = None
        if branch.head_commit_id:
            previous_commit = await self.get_commit(branch.head_commit_id)
        
        # Создаем diff
        if previous_commit:
            content_diff = self._create_diff(previous_commit.content_diff, content)
        else:
            content_diff = content  # Первый коммит
        
        # Создаем новый коммит
        new_commit = Commit(
            article_id=article_id,
            author_id=author_id,
            message=message,
            content_diff=content_diff,
            is_merge=False
        )
        
        self.db.add(new_commit)
        await self.db.flush()
        
        # Создаем связь с родительским коммитом
        if previous_commit:
            parent_relation = CommitParent(
                commit_id=new_commit.id,
                parent_id=previous_commit.id
            )
            self.db.add(parent_relation)
        
        # Обновляем head ветки
        branch.head_commit_id = new_commit.id
        
        await self.db.commit()
        await self.db.refresh(new_commit)
        
        return new_commit

    def _create_diff(self, old_content: str, new_content: str) -> str:
        """Create diff between old and new content"""
        old_lines = old_content.splitlines(keepends=True)
        new_lines = new_content.splitlines(keepends=True)
        if old_lines and not old_lines[-1].endswith('\n'):
            old_lines[-1] += '\n'
        if new_lines and not new_lines[-1].endswith('\n'):
            new_lines[-1] += '\n'
        
        diff = difflib.unified_diff(
            old_lines,
            new_lines,
            fromfile="previous",
            tofile="current",
            lineterm=""
        )
        
        return "".join(diff)

    async def get_commit_diff(self, commit_id: UUID) -> Optional[DiffResponse]:
        """Get the diff for a specific commit"""
        commit = await self.get_commit(commit_id)
        if not commit:
            return None
        
        # Получаем родительский коммит
        parent_query = select(CommitParent.parent_id).where(CommitParent.commit_id == commit_id)
        parent_result = await self.db.execute(parent_query)
        parent_id = parent_result.scalar_one_or_none()
        
        if not parent_id:
            # Первый коммит
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
        
        # Подсчитываем изменения
        diff_lines = commit.content_diff.splitlines()
        added_lines = len([line for line in diff_lines if line.startswith('+')])
        removed_lines = len([line for line in diff_lines if line.startswith('-')])
        
        return DiffResponse(
            commit_id=commit_id,
            parent_commit_id=parent_id,
            diff=commit.content_diff,
            added_lines=added_lines,
            removed_lines=removed_lines
        )
    
    

    async def rebuild_content_at_commit(self, commit_id: UUID) -> Optional[str]:
        """Rebuild full content at specific commit by traversing commit history"""
        commit = await self.get_commit(commit_id)
        if not commit:
            return None
        
        # Получаем всю цепочку коммитов до корня
        commits_chain = []
        current_commit = commit
        
        while current_commit:
            commits_chain.append(current_commit)
            
            # Получаем родительский коммит
            parent_query = select(CommitParent.parent_id).where(
                CommitParent.commit_id == current_commit.id
            )
            parent_result = await self.db.execute(parent_query)
            parent_id = parent_result.scalar_one_or_none()
            
            if parent_id:
                current_commit = await self.get_commit(parent_id)
            else:
                current_commit = None
        
        # Строим содержимое от первого коммита к целевому
        commits_chain.reverse()
        
        if not commits_chain:
            return ""
        
        # Первый коммит содержит полное содержимое
        content = commits_chain[0].content_diff
        
        # Применяем остальные коммиты
        for commit in commits_chain[1:]:
            content = self._apply_diff(content, commit.content_diff)
        
        return content
    def _apply_diff(self, base_content: str, diff_content: str) -> str:
        """
        Apply unified diff to base content
    
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
    
        # Если diff_content не является unified diff, возвращаем его как есть
        # (это может быть случай первого коммита)
        if not self._is_unified_diff(diff_content):
            return diff_content
    
        try:
            # Разбираем unified diff
            hunks = self._parse_unified_diff(diff_content)
        
            # Применяем каждый hunk к базовому контенту
            base_lines = base_content.splitlines(keepends=True)
            result_lines = base_lines.copy()
        
        # Применяем hunks в обратном порядке (с конца файла к началу)
        # чтобы номера строк оставались корректными
            for hunk in reversed(hunks):
                result_lines = self._apply_hunk(result_lines, hunk)
        
            return ''.join(result_lines)
        
        except Exception as e:
            # В случае ошибки применения diff, логируем и возвращаем базовый контент
            # В реальном приложении здесь должно быть логирование
            print(f"Error applying diff: {e}")
            return base_content
        
    def _is_unified_diff(self, content: str) -> bool:
        """Check if content is a unified diff format"""
        lines = content.splitlines()
    
        # Проверяем наличие заголовков unified diff
        has_diff_header = False
        has_hunk_header = False
    
        for line in lines:
            if line.startswith('--- ') or line.startswith('+++ '):
                has_diff_header = True
            elif line.startswith('@@') and line.endswith('@@'):
                has_hunk_header = True
                break
    
        return has_diff_header and has_hunk_header
    def _parse_unified_diff(self, diff_content: str) -> List[dict]:
        """
        Parse unified diff into structured hunks
    
        Returns:
            List of hunk dictionaries with structure:
            {
                'old_start': int,
                'old_count': int, 
                'new_start': int,
                'new_count': int,
                'lines': List[Tuple[str, str]]  # (operation, content)
            }
        """
        lines = diff_content.splitlines()
        hunks = []
        current_hunk = None
    
        for line in lines:
            # Пропускаем заголовки файлов
            if line.startswith('--- ') or line.startswith('+++ '):
                continue
            
            # Начало нового hunk
            if line.startswith('@@'):
                if current_hunk:
                    hunks.append(current_hunk)
            
                # Парсим заголовок hunk: @@ -old_start,old_count +new_start,new_count @@
                hunk_match = re.match(r'@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@', line)
                if not hunk_match:
                    raise ValueError(f"Invalid hunk header: {line}")
            
                old_start = int(hunk_match.group(1))
                old_count = int(hunk_match.group(2)) if hunk_match.group(2) else 1
                new_start = int(hunk_match.group(3))
                new_count = int(hunk_match.group(4)) if hunk_match.group(4) else 1
            
                current_hunk = {
                    'old_start': old_start,
                    'old_count': old_count,
                    'new_start': new_start,
                    'new_count': new_count,
                    'lines': []
                }
            
            elif current_hunk is not None:
                # Строки изменений
                if line.startswith('-'):
                    current_hunk['lines'].append(('delete', line[1:]))
                elif line.startswith('+'):
                    current_hunk['lines'].append(('add', line[1:]))
                elif line.startswith(' '):
                    current_hunk['lines'].append(('context', line[1:]))
                elif line.strip() == '':
                    # Пустая строка может быть частью контекста
                    current_hunk['lines'].append(('context', ''))
    
    # Добавляем последний hunk
        if current_hunk:
            hunks.append(current_hunk)
    
        return hunks
    
    def _apply_hunk(self, lines: List[str], hunk: dict) -> List[str]:
        """
        Apply a single hunk to the lines
    
        Args:
            lines: List of content lines
            hunk: Hunk dictionary from _parse_unified_diff
        
        Returns:
            List[str]: Modified lines
        """
        # Конвертируем в 0-based индексацию
        start_line = hunk['old_start'] - 1
    
        # Собираем результат
        result = []
    
        # Добавляем строки до hunk
        result.extend(lines[:start_line])
    
        # Применяем изменения hunk
        old_line_idx = start_line
    
        for operation, content in hunk['lines']:
            if operation == 'context':
                # Контекстная строка - проверяем соответствие и добавляем
                if old_line_idx < len(lines):
                    expected = lines[old_line_idx].rstrip('\n\r')
                    actual = content.rstrip('\n\r')
                    if expected != actual:
                        # В реальном приложении здесь может быть более мягкая обработка
                        print(f"Warning: Context mismatch at line {old_line_idx + 1}")
                        print(f"Expected: {repr(expected)}")
                        print(f"Actual: {repr(actual)}")
            
                result.append(content + '\n' if not content.endswith('\n') and content else content)
                old_line_idx += 1
            
            elif operation == 'delete':
                # Удаляемая строка - пропускаем в результате, но сдвигаем индекс
                old_line_idx += 1
            
            elif operation == 'add':
                # Добавляемая строка - добавляем в результат
                result.append(content + '\n' if not content.endswith('\n') and content else content)
    
        # Добавляем оставшиеся строки после hunk
        remaining_start = old_line_idx
        result.extend(lines[remaining_start:])
    
        return result

    async def revert_commit(self, commit_id: UUID, user_id: UUID) -> Optional[Commit]:
        """Revert a specific commit"""
        commit_to_revert = await self.get_commit(commit_id)
        if not commit_to_revert:
            return None
        
        # Получаем родительский коммит
        parent_query = select(CommitParent.parent_id).where(CommitParent.commit_id == commit_id)
        parent_result = await self.db.execute(parent_query)
        parent_id = parent_result.scalar_one_or_none()
        
        if not parent_id:
            # Cannot revert the first commit
            return None
        
        parent_commit = await self.get_commit(parent_id)
        if not parent_commit:
            return None
        
        # Находим ветку, в которой находится коммит
        branch_query = select(Branch).join(
            CommitParent, Branch.head_commit_id == CommitParent.commit_id
        ).where(CommitParent.parent_id == commit_id)
        
        branch_result = await self.db.execute(branch_query)
        branch = branch_result.scalar_one_or_none()
        
        if not branch:
            return None
        
        # Восстанавливаем содержимое родительского коммита
        parent_content = await self.rebuild_content_at_commit(parent_id)
        if parent_content is None:
            return None
        
        # Создаем revert коммит
        revert_commit = await self.create_commit(
            article_id=commit_to_revert.article_id,
            author_id=user_id,
            message=f"Revert '{commit_to_revert.message}'",
            content=parent_content,
            branch_id=branch.id
        )
        
        return revert_commit