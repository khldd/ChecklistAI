-- The service_role needs explicit schema access too!
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant all privileges on tables to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant usage on sequences to service_role
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant usage on functions to service_role
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Make sure future objects are also granted
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;
