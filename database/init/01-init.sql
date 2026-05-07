-- Database initialization script for Crypto Wallet
-- This script sets up the database with proper configurations

-- Create user if it doesn't exist.
-- Password is supplied at container start via the CRYPTOUSER_DB_PASSWORD env var
-- (rendered into the SQL by the docker-entrypoint-initdb.d shell context). Never
-- bake a literal password into a tracked SQL file. See architecture/SECURITY.md.
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'cryptouser') THEN
      EXECUTE format(
        'CREATE ROLE cryptouser LOGIN PASSWORD %L',
        coalesce(current_setting('cryptowallet.cryptouser_password', true), 'CHANGE_ME')
      );
   END IF;
END
$do$;

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE cryptowallet TO cryptouser;
GRANT ALL ON SCHEMA public TO cryptouser;
GRANT CREATE ON SCHEMA public TO cryptouser;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Initial admin bootstrap is handled by AdminService on first boot using a
-- bcrypt of the password supplied via ADMIN_BOOTSTRAP_PASSWORD. The previous
-- approach of seeding a known bcrypt-hash literal (admin123) here was removed —
-- a publicly-known bcrypt is functionally equivalent to a plaintext password.
-- See architecture/SECURITY.md for the bootstrap procedure.

COMMENT ON DATABASE cryptowallet IS 'Crypto Wallet Application Database';