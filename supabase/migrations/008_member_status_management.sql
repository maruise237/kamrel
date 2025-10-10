-- Migration: Add member status management
-- Description: Add status field to workspace_members and improve member management

-- Add status column to workspace_members table
ALTER TABLE workspace_members 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'mission_complete'));

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_workspace_members_status ON workspace_members(status);

-- Update RLS policies to consider member status
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
CREATE POLICY "Users can view workspace members" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Policy for admins to manage members (including status changes)
DROP POLICY IF EXISTS "Admins can manage workspace members" ON workspace_members;
CREATE POLICY "Admins can manage workspace members" ON workspace_members
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Function to check if user is active admin
CREATE OR REPLACE FUNCTION is_active_admin(workspace_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = workspace_uuid 
    AND user_id = auth.uid() 
    AND role = 'admin' 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deactivate member (mission complete)
CREATE OR REPLACE FUNCTION complete_member_mission(member_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  target_workspace UUID;
BEGIN
  -- Get the workspace of the target member
  SELECT workspace_id INTO target_workspace
  FROM workspace_members
  WHERE id = member_id;

  -- Check if current user is active admin of the workspace
  IF NOT is_active_admin(target_workspace) THEN
    RAISE EXCEPTION 'Only active admins can complete member missions';
  END IF;

  -- Update member status to mission_complete
  UPDATE workspace_members
  SET status = 'mission_complete'
  WHERE id = member_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reactivate member
CREATE OR REPLACE FUNCTION reactivate_member(member_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  target_workspace UUID;
BEGIN
  -- Get the workspace of the target member
  SELECT workspace_id INTO target_workspace
  FROM workspace_members
  WHERE id = member_id;

  -- Check if current user is active admin of the workspace
  IF NOT is_active_admin(target_workspace) THEN
    RAISE EXCEPTION 'Only active admins can reactivate members';
  END IF;

  -- Update member status to active
  UPDATE workspace_members
  SET status = 'active'
  WHERE id = member_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to change member role
CREATE OR REPLACE FUNCTION change_member_role(member_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  target_workspace UUID;
BEGIN
  -- Validate role
  IF new_role NOT IN ('admin', 'member') THEN
    RAISE EXCEPTION 'Invalid role. Must be admin or member';
  END IF;

  -- Get the workspace of the target member
  SELECT workspace_id INTO target_workspace
  FROM workspace_members
  WHERE id = member_id;

  -- Check if current user is active admin of the workspace
  IF NOT is_active_admin(target_workspace) THEN
    RAISE EXCEPTION 'Only active admins can change member roles';
  END IF;

  -- Update member role
  UPDATE workspace_members
  SET role = new_role
  WHERE id = member_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_active_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_member_mission(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reactivate_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION change_member_role(UUID, TEXT) TO authenticated;

-- Update existing members to have active status
UPDATE workspace_members SET status = 'active' WHERE status IS NULL;