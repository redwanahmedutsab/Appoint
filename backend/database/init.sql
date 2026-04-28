-- Appointly PostgreSQL init script
-- The database and user are created automatically via POSTGRES_* environment variables.
-- Laravel migrations handle all schema creation via "php artisan migrate".
-- This file is intentionally minimal.

-- Ensure the uuid-ossp extension is available (used by some Laravel packages)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
