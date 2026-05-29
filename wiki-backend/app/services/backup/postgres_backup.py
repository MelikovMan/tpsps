import subprocess
import os
from app.core.config import settings

class PostgresBackup:
    @staticmethod
    async def create_dump(output_path: str) -> str:
        """Создаёт дамп базы данных в файл."""
        # Парсим database_url_sync: postgresql://user:pass@host:port/db
        url = settings.database_url_sync
        # Формируем команду pg_dump
        cmd = [
            "pg_dump",
            "--dbname", url,
            "--format", "custom",
            "--file", output_path,
            "--verbose"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"pg_dump failed: {result.stderr}")
        return output_path

    @staticmethod
    async def restore_dump(dump_path: str):
        """Восстанавливает базу данных из дампа."""
        # Сначала завершаем активные соединения
        db_name = settings.database_url_sync.split('/')[-1]
        terminate_cmd = [
            "psql", settings.database_url_sync,
            "-c", f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{db_name}' AND pid <> pg_backend_pid();"
        ]
        subprocess.run(terminate_cmd, capture_output=True)
        
        # Восстанавливаем
        cmd = ["pg_restore", "--clean", "--if-exists", "--dbname", settings.database_url_sync, dump_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"pg_restore failed: {result.stderr}")