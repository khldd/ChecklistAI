-- Create enum for fusion status
CREATE TYPE fusion_status AS ENUM ('accepted', 'rejected', 'edited');

-- Create checklists table
CREATE TABLE checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_hash TEXT UNIQUE NOT NULL,
    file_name TEXT NOT NULL,
    parsed_content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on file_hash for fast duplicate detection
CREATE INDEX idx_checklists_file_hash ON checklists(file_hash);

-- Create index on created_at for sorting
CREATE INDEX idx_checklists_created_at ON checklists(created_at DESC);

-- Create fusion_suggestions table
CREATE TABLE fusion_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist1_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    checklist2_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    item1_id TEXT NOT NULL,
    item2_id TEXT NOT NULL,
    suggested_text TEXT NOT NULL,
    similarity_score FLOAT NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX idx_fusion_suggestions_checklist1 ON fusion_suggestions(checklist1_id);
CREATE INDEX idx_fusion_suggestions_checklist2 ON fusion_suggestions(checklist2_id);
CREATE INDEX idx_fusion_suggestions_similarity ON fusion_suggestions(similarity_score DESC);

-- Create accepted_fusions table
CREATE TABLE accepted_fusions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fusion_suggestion_id UUID NOT NULL REFERENCES fusion_suggestions(id) ON DELETE CASCADE,
    custom_text TEXT,
    status fusion_status NOT NULL DEFAULT 'accepted',
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on fusion_suggestion_id for fast lookups
CREATE INDEX idx_accepted_fusions_suggestion_id ON accepted_fusions(fusion_suggestion_id);
CREATE INDEX idx_accepted_fusions_status ON accepted_fusions(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_checklists_updated_at
    BEFORE UPDATE ON checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE fusion_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accepted_fusions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you may want to restrict this based on your auth requirements)
CREATE POLICY "Allow all operations on checklists" ON checklists FOR ALL USING (true);
CREATE POLICY "Allow all operations on fusion_suggestions" ON fusion_suggestions FOR ALL USING (true);
CREATE POLICY "Allow all operations on accepted_fusions" ON accepted_fusions FOR ALL USING (true);
