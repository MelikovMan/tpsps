CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";

-- Создание индексов для полнотекстового поиска
CREATE EXTENSION IF NOT EXISTS "pg_trgm";