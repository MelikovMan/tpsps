from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pydantic import BaseModel
from app.core.security import require_permission
from app.services.backup import BackupManager

router = APIRouter(prefix="/backup", tags=["Admin Backup"])

class BackupInfo(BaseModel):
    backup_id: str
    filename: str
    size: int
    last_modified: str

@router.post("/create", response_model=dict)
async def create_backup(_=Depends(require_permission("moderate"))):
    """Создаёт новую резервную копию."""
    try:
        backup_id = await BackupManager.create_backup()
        return {"message": "Backup created successfully", "backup_id": backup_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

@router.get("/list", response_model=List[BackupInfo])
async def list_backups(_=Depends(require_permission("moderate"))):
    """Возвращает список доступных резервных копий."""
    return await BackupManager.list_backups()

@router.post("/restore/{backup_id}")
async def restore_backup(backup_id: str, _=Depends(require_permission("moderate"))):
    """Восстанавливает систему из указанной резервной копии."""
    try:
        # Здесь можно добавить перевод приложения в maintenance mode
        await BackupManager.restore_backup(backup_id)
        # После восстановления можно перезапустить Typesense синхронизацию и очистить кэш
        return {"message": f"Backup {backup_id} restored successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")