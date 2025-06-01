import subprocess
import sys
import os

def create_initial_migration():
    """Создает начальную миграцию с существующими моделями"""
    try:
        # Создаем начальную миграцию
        result = subprocess.run([
            sys.executable, "-m", "alembic", "revision", 
            "--autogenerate", "-m", "Initial migration with all models"
        ], capture_output=True, text=True, cwd=os.path.dirname(os.path.dirname(__file__)))
        
        if result.returncode == 0:
            print("Начальная миграция создана успешно!")
            print(result.stdout)
        else:
            print(" Ошибка при создании миграции:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False
    
    return True

def apply_migrations():
    """Применяет миграции к базе данных"""
    try:
        result = subprocess.run([
            sys.executable, "-m", "alembic", "upgrade", "head"
        ], capture_output=True, text=True, cwd=os.path.dirname(os.path.dirname(__file__)))
        
        if result.returncode == 0:
            print(" Миграции применены успешно!")
            print(result.stdout)
        else:
            print("Ошибка при применении миграций:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Создание начальной миграции...")
    if create_initial_migration():
        print("Применение миграций...")
        apply_migrations()
    
    print("\n✨ Готово! Проверьте базу данных.")
