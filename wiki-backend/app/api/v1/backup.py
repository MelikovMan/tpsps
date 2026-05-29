from fastapi import APIRouter, Depends, HTTPException
from app.services.backup.backup_manager import get_worker
from app.core.security import require_permission
from app.tasks.backup_tasks import create_backup_task, restore_backup_task, get_backup_status_task
from streaq import Worker

router = APIRouter(prefix="/admin/backup", tags=["Admin Backup"])

@router.post("/create")
async def create_backup(
    worker: Worker = Depends(get_worker),
    _ = Depends(require_permission("moderate"))
):
    """Запуск создания резервной копии в фоне."""
    task = await create_backup_task.enqueue()
    return {
        "task_id": task.task_id,
        "status": "queued",
        "message": "Backup task has been enqueued"
    }

@router.post("/restore/{backup_id}")
async def restore_backup(
    backup_id: str,
    worker: Worker = Depends(get_worker),
    _ = Depends(require_permission("moderate"))
):
    """Запуск восстановления из бэкапа."""
    task = await restore_backup_task.enqueue(backup_id)
    return {
        "task_id": task.task_id,
        "backup_id": backup_id,
        "status": "queued"
    }

@router.get("/status/{task_id}")
async def get_task_status(
    task_id: str,
    worker: Worker = Depends(get_worker)
):
    """Получение статуса выполнения задачи."""
    # streaq предоставляет возможность получить информацию о задаче
    from streaq.task import RegisteredTask
    # В текущей версии streaq нет прямого метода для получения статуса по task_id,
    # поэтому можно использовать отдельную задачу для мониторинга
    task_info = await get_backup_status_task.enqueue(task_id)
    result = await task_info.result(timeout=5)
    return result

@router.get("/list")
async def list_backups(
    _ = Depends(require_permission("moderate"))
):
    """Список доступных бэкапов (синхронно)."""
    backups = await BackupManager.list_backups()
    return backups