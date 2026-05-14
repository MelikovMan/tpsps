# app/tasks/backup_tasks.py
from streaq import WorkerDepends
from app.services.backup import BackupManager
from app.tasks.worker import worker
from app.tasks.context import TaskContext

@worker.task(timeout=3600, max_tries=3)
async def create_backup_task(
    ctx: TaskContext = WorkerDepends()
) -> dict:
    """
    Фоновая задача создания полной резервной копии.
    """
    try:
        backup_id = await BackupManager.create_backup()
        return {
            "success": True,
            "backup_id": backup_id,
            "message": f"Backup {backup_id} created successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Backup creation failed"
        }
    
@worker.task(timeout=7200, max_tries=1)
async def restore_backup_task(
    backup_id: str,
    ctx: TaskContext = WorkerDepends()
) -> dict:
    """
    Основная задача восстановления из резервной копии.
    """
    from app.core.maintenance import set_maintenance_mode
    from fastapi_cache import FastAPICache

    try:
        # 1. Включаем режим обслуживания
        set_maintenance_mode(True)

        # 2. Восстанавливаем БД и MinIO
        await BackupManager.restore_backup(backup_id)

        # 3. Переиндексируем Typesense (используем подзадачу)
        reindex_task = await reindex_typesense_task.enqueue()
        reindex_result = await reindex_task.result(timeout=1800)

        # 4. Очищаем Redis кэш
        await FastAPICache.clear()

        set_maintenance_mode(False)

        return {
            "success": True,
            "backup_id": backup_id,
            "reindex_result": reindex_result,
            "message": "Restore completed successfully"
        }

    except Exception as e:
        set_maintenance_mode(False)
        return {
            "success": False,
            "error": str(e),
            "message": "Restore failed"
        }
    

@worker.task(timeout=1800, max_tries=2)
async def reindex_typesense_task(
    ctx: TaskContext = WorkerDepends()
) -> dict:
    """
    Полная переиндексация Typesense.
    """
    from app.services.typesense_sync_worker import worker_instance

    try:
        if worker_instance:
            await worker_instance.reindex_all()
        return {"success": True, "message": "Typesense reindexed"}
    except Exception as e:
        return {"success": False, "error": str(e)}
    

@worker.task()
async def get_backup_status_task(
    backup_id: str,
    ctx: TaskContext = WorkerDepends()
) -> dict:
    """
    Получение информации о бэкапе.
    """
    backups = await BackupManager.list_backups()
    for b in backups:
        if b["backup_id"] == backup_id:
            return b
    return {"error": "Backup not found"}