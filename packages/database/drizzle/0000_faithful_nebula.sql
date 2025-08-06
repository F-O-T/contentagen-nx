-- Custom SQL migration file, put your code below! --

-- Trigger function to increment total_drafts when draft content is inserted --
CREATE OR REPLACE FUNCTION increment_total_drafts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'draft' THEN
        UPDATE agent SET total_drafts = total_drafts + 1 WHERE id = NEW.agent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_total_drafts
AFTER INSERT ON content
FOR EACH ROW
EXECUTE FUNCTION increment_total_drafts();

-- Trigger function to increment total_published when approved content is inserted --
CREATE OR REPLACE FUNCTION increment_total_published()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' THEN
        UPDATE agent SET total_published = total_published + 1 WHERE id = NEW.agent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_total_published
AFTER INSERT ON content
FOR EACH ROW
EXECUTE FUNCTION increment_total_published();

-- Trigger function to increment total_drafts on status change
CREATE OR REPLACE FUNCTION increment_total_drafts_on_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'draft' AND OLD.status IS DISTINCT FROM 'draft' THEN
        UPDATE agent SET total_drafts = total_drafts + 1 WHERE id = NEW.agent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_total_drafts_on_update
AFTER UPDATE ON content
FOR EACH ROW
EXECUTE FUNCTION increment_total_drafts_on_update();
