-- Migration: Enhanced RLS policies for complete workspace isolation
-- Created: 2024-01-XX

-- Add workspace_id to remaining tables that need multi-tenant isolation
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.file_uploads ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_workspace_id ON public.time_entries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_workspace_id ON public.file_uploads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notifications_workspace_id ON public.notifications(workspace_id);

-- Enable RLS on all tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.time_entries;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.file_uploads;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.notifications;

-- RLS Policies for tasks (workspace-isolated)
CREATE POLICY "Users can access tasks in their workspaces" ON public.tasks
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for time_entries (workspace-isolated)
CREATE POLICY "Users can access time entries in their workspaces" ON public.time_entries
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for file_uploads (workspace-isolated)
CREATE POLICY "Users can access files in their workspaces" ON public.file_uploads
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for notifications (workspace-isolated + user-specific)
CREATE POLICY "Users can access their notifications in their workspaces" ON public.notifications
    FOR ALL USING (
        user_id = auth.uid()::text AND
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for user_preferences (user-specific, no workspace isolation needed)
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
    FOR ALL USING (user_id = auth.uid()::text);

-- RLS Policies for user_profiles (user-specific, no workspace isolation needed)
CREATE POLICY "Users can manage their own profile" ON public.user_profiles
    FOR ALL USING (user_id = auth.uid()::text);

-- Enhanced workspace policies with better granularity
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace owners can update their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;

CREATE POLICY "Users can view workspaces they belong to" ON public.workspaces
    FOR SELECT USING (
        id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace owners and admins can update workspaces" ON public.workspaces
    FOR UPDATE USING (
        id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Authenticated users can create workspaces" ON public.workspaces
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "Workspace owners can delete workspaces" ON public.workspaces
    FOR DELETE USING (owner_id = auth.uid());

-- Enhanced workspace_members policies
DROP POLICY IF EXISTS "Users can view workspace members of their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace admins can manage members" ON public.workspace_members;

CREATE POLICY "Users can view workspace members of their workspaces" ON public.workspace_members
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace admins can add members" ON public.workspace_members
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Workspace admins can update member roles" ON public.workspace_members
    FOR UPDATE USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Workspace admins can remove members" ON public.workspace_members
    FOR DELETE USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Triggers to auto-assign workspace_id for new tables
CREATE OR REPLACE FUNCTION public.set_workspace_id_on_tasks()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.workspace_id IS NULL THEN
        NEW.workspace_id := public.get_current_workspace_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_workspace_id_tasks
    BEFORE INSERT ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_on_tasks();

CREATE OR REPLACE FUNCTION public.set_workspace_id_on_time_entries()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.workspace_id IS NULL THEN
        NEW.workspace_id := public.get_current_workspace_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_workspace_id_time_entries
    BEFORE INSERT ON public.time_entries
    FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_on_time_entries();

CREATE OR REPLACE FUNCTION public.set_workspace_id_on_file_uploads()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.workspace_id IS NULL THEN
        NEW.workspace_id := public.get_current_workspace_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_workspace_id_file_uploads
    BEFORE INSERT ON public.file_uploads
    FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_on_file_uploads();

CREATE OR REPLACE FUNCTION public.set_workspace_id_on_notifications()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.workspace_id IS NULL THEN
        NEW.workspace_id := public.get_current_workspace_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_workspace_id_notifications
    BEFORE INSERT ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_on_notifications();

-- Function to get user's workspaces
CREATE OR REPLACE FUNCTION public.get_user_workspaces(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(workspace_id UUID, workspace_name TEXT, workspace_slug TEXT, user_role TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.name,
        w.slug,
        wm.role
    FROM public.workspaces w
    JOIN public.workspace_members wm ON w.id = wm.workspace_id
    WHERE wm.user_id = user_uuid
    ORDER BY w.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has admin access to workspace
CREATE OR REPLACE FUNCTION public.user_has_workspace_admin_access(workspace_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = workspace_uuid 
        AND user_id = user_uuid 
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's workspace context
CREATE OR REPLACE FUNCTION public.get_current_user_workspace_context()
RETURNS TABLE(
    workspace_id UUID, 
    workspace_name TEXT, 
    workspace_slug TEXT, 
    user_role TEXT,
    is_admin BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.name,
        w.slug,
        wm.role,
        wm.role IN ('owner', 'admin') as is_admin
    FROM public.workspaces w
    JOIN public.workspace_members wm ON w.id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
    ORDER BY wm.joined_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_workspaces(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_workspace_admin_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_workspace_context() TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';