# app/core/maintenance.py
maintenance_mode = False

def set_maintenance_mode(enabled: bool) -> None:
    """Устанавливает глобальный флаг режима обслуживания."""
    global maintenance_mode
    maintenance_mode = enabled

def is_maintenance_mode() -> bool:
    """Возвращает состояние режима обслуживания."""
    return maintenance_mode