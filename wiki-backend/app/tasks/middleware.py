# app/tasks/middleware.py
import time
from typing import Any
from streaq import TaskContext, TaskDepends, StreaqRetry
from streaq.types import ReturnCoroutine
from app.tasks.worker import worker

@worker.middleware
def log_middleware(task: ReturnCoroutine) -> ReturnCoroutine:
    async def wrapper(*args, ctx: TaskContext = TaskDepends(), **kwargs) -> Any:
        start = time.time()
        print(f"Starting task {ctx.task_id}")
        result = await task(*args, **kwargs)
        print(f"Task {ctx.task_id} finished in {time.time() - start:.2f}s")
        return result
    return wrapper

@worker.middleware
def retry_middleware(task: ReturnCoroutine) -> ReturnCoroutine:
    async def wrapper(*args, ctx: TaskContext = TaskDepends(), **kwargs) -> Any:
        try:
            return await task(*args, **kwargs)
        except Exception as e:
            if ctx.tries < 3:
                raise StreaqRetry(f"Retrying task {ctx.task_id}, attempt {ctx.tries + 1}", delay=5) from e
            raise
    return wrapper