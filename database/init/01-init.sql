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

-- Create initial admin user (password: admin123)
-- Note: In production, use a more secure password and change immediately
INSERT INTO admins (username, email, password, first_name, last_name, role, active, created_at, updated_at)
VALUES (
    'admin',
    'admin@cryptowallet.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTUDqIcpU49dZCbdeD2pnUq7BKNT8wXS', -- admin123
    'System',
    'Administrator',
    'SUPER_ADMIN',
    true,
    NOW(),
    NOW()
) ON CONFLICT (username) DO NOTHING;

COMMENT ON DATABASE cryptowallet IS 'Crypto Wallet Application Database';