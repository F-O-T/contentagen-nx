CREATE EXTENSION IF NOT EXISTS vector;

CREATE OR REPLACE FUNCTION increment_agent_drafts()
RETURNS trigger AS $$
BEGIN
  UPDATE agent
    SET total_drafts = total_drafts + 1,
        updated_at = NOW()
  WHERE id = NEW.agent_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inc_drafts_trigger
  AFTER INSERT ON content
  FOR EACH ROW
  EXECUTE FUNCTION increment_agent_drafts();

-- 2. Function to move one draft to published on status change
CREATE OR REPLACE FUNCTION move_draft_to_published()
RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'draft' AND NEW.status = 'published' THEN
    UPDATE agent
      SET total_drafts = total_drafts - 1,
          total_published = total_published + 1,
          updated_at = NOW()
    WHERE id = NEW.agent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER upd_status_trigger
  AFTER UPDATE OF status ON content
  FOR EACH ROW
  WHEN (OLD.status = 'draft' AND NEW.status = 'published')
  EXECUTE FUNCTION move_draft_to_published();

