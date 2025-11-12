-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on checklists" ON checklists;
DROP POLICY IF EXISTS "Allow all operations on fusion_suggestions" ON fusion_suggestions;
DROP POLICY IF EXISTS "Allow all operations on accepted_fusions" ON accepted_fusions;

-- Grant usage on schema to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant all privileges on tables
GRANT ALL ON checklists TO anon, authenticated;
GRANT ALL ON fusion_suggestions TO anon, authenticated;
GRANT ALL ON accepted_fusions TO anon, authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create more permissive RLS policies
CREATE POLICY "Enable all for anon users" ON checklists
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON checklists
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all for anon users" ON fusion_suggestions
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON fusion_suggestions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all for anon users" ON accepted_fusions
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON accepted_fusions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
