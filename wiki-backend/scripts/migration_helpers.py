import subprocess
import sys
import os
from typing import Optional

def create_migration(message: str, autogenerate: bool = True) -> bool:
    """Создает новую миграцию"""
    cmd = [sys.executable, "-m", "alembic", "revision"]
    
    if autogenerate:
        cmd.append("--autogenerate")
    
    cmd.extend(["-m", message])
    
    try:
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            cwd=os.path.dirname(os.path.dirname(__file__))
        )
        
        if result.returncode == 0:
            print(f" Миграция '{message}' создана успешно!")
            print(result.stdout)
            return True
        else:
            print(f"Ошибка при создании миграции '{message}':")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"Ошибка: {e}")
        return False

def apply_migrations(revision: Optional[str] = None) -> bool:
    """Применяет миграции"""
    cmd = [sys.executable, "-m", "alembic", "upgrade"]
    cmd.append(revision or "head")
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(__file__))
        )
        
        if result.returncode == 0:
            print("✅ Миграции применены успешно!")
            print(result.stdout)
            return True
        else:
            print("❌ Ошибка при применении миграций:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def downgrade_migrations(revision: str = "-1") -> bool:
    """Откатывает миграции"""
    cmd = [sys.executable, "-m", "alembic", "downgrade", revision]
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(__file__))
        )
        
        if result.returncode == 0:
            print("✅ Миграции откачены успешно!")
            print(result.stdout)
            return True
        else:
            print("❌ Ошибка при откате миграций:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def show_migration_history() -> bool:
    """Показывает историю миграций"""
    cmd = [sys.executable, "-m", "alembic", "history", "--verbose"]
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(__file__))
        )
        
        if result.returncode == 0:
            print("📜 История миграций:")
            print(result.stdout)
            return True
        else:
            print("❌ Ошибка при получении истории миграций:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def current_revision() -> Optional[str]:
    """Возвращает текущую ревизию"""
    cmd = [sys.executable, "-m", "alembic", "current"]
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(__file__))
        )
        
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            print("❌ Ошибка при получении текущей ревизии:")
            print(result.stderr)
            return None
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return None

