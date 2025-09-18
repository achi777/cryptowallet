-- Database initialization script for Crypto Wallet
-- This script sets up the database with proper configurations

-- Create user if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'cryptouser') THEN
      CREATE ROLE cryptouser LOGIN PASSWORD 'crypto123';
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

COMMENT ON DATABASE cryptowallet IS 'Crypto Wallet Application Database';