.PHONY: install dev test clean docker-up docker-down migrate db-init db-reset
name = DB
install:
	pip install -r requirements.txt

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest tests/ -v

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

docker-up:
	docker-compose -f docker-compose.dev.yml up -d

docker-down:
	docker-compose -f docker-compose.dev.yml down

migrate:
	alembic upgrade head

migrate-down:
	alembic downgrade -1

migrate-history:
	alembic history --verbose

migrate-current:
	alembic current

create-migration:
	@if [ -z "$(name)" ]; then \
		echo "Укажите название миграции: make create-migration name=\"Your migration name\""; \
		exit 1; \
	fi
	alembic revision --autogenerate -m "$(name)"

format:
	black app/ tests/
	isort app/ tests/

lint:
	flake8 app/ tests/
	mypy app/

clean_containers:
	docker-compose -f docker-compose.dev.yml down -v 
	docker-compose -f docker-compose.dev.yml up -d
db-init: docker-up
	@echo "Db init..."
	timeout 5
	python scripts/create_initial_migration.py

db-reset: docker-down
	@echo "Очистка базы данных..."
	docker-compose -f docker-compose.dev.yml down -v
	@echo "Перезапуск с чистой базой..."
	$(MAKE) db-init

setup: install docker-up db-init
	@echo "Проект настроен и готов к работе!"
	@echo "Запустите сервер: make dev"
	@echo "API документация: http://localhost:8000/docs"

status:
	@echo "Статус системы:"
	@echo "Docker containers:"
	@docker-compose -f docker-compose.dev.yml ps
	@echo ""
	@echo "Текущая миграция:"
	@alembic current 2>/dev/null || echo "База данных не инициализирована"