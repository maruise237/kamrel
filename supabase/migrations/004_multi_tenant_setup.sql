-- Migration: Multi-tenant setup with workspaces and invitations
-- Created: 2024-01-XX

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create workspaces table (tenants)
CREATE TABLE public.workspaces (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true
);

-- Create workspace_members table (user-workspace relationships)
CREATE TABLE public.workspace_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES auth.users(id),
    UNIQUE(workspace_id, user_id)
);

-- Create invites table
CREATE TABLE public.invites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    token VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, email)
);

-- Add workspace_id to existing tables
ALTER TABLE public.projects ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_workspaces_owner_id ON public.workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON public.workspaces(slug);
CREATE INDEX idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX idx_invites_workspace_id ON public.invites(workspace_id);
CREATE INDEX idx_invites_token ON public.invites(token);
CREATE INDEX idx_invites_email ON public.invites(email);
CREATE INDEX idx_projects_workspace_id ON public.projects(workspace_id);
CREATE INDEX idx_messages_workspace_id ON public.messages(workspace_id);

-- Enable RLS on all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspaces
CREATE POLICY "Users can view workspaces they belong to" ON public.workspaces
    FOR SELECT USING (
        id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace owners can update their workspaces" ON public.workspaces
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create workspaces" ON public.workspaces
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- RLS Policies for workspace_members
CREATE POLICY "Users can view workspace members of their workspaces" ON public.workspace_members
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace admins can manage members" ON public.workspace_members
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- RLS Policies for invites
CREATE POLICY "Workspace admins can manage invites" ON public.invites
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can view invites sent to them" ON public.invites
    FOR SELECT USING (email = auth.email());

-- RLS Policies for projects
CREATE POLICY "Users can access projects in their workspaces" ON public.projects
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for messages
CREATE POLICY "Users can access messages in their workspaces" ON public.messages
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Function to automatically add workspace_id to new records
CREATE OR REPLACE FUNCTION public.get_current_workspace_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        (auth.jwt() -> 'app_metadata' ->> 'workspace_id')::UUID,
        (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() LIMIT 1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-assign workspace_id on projects insert
CREATE OR REPLACE FUNCTION public.set_workspace_id_on_projects()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.workspace_id IS NULL THEN
        NEW.workspace_id := public.get_current_workspace_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_workspace_id_projects
    BEFORE INSERT ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_on_projects();

-- Trigger to auto-assign workspace_id on messages insert
CREATE OR REPLACE FUNCTION public.set_workspace_id_on_messages()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.workspace_id IS NULL THEN
        NEW.workspace_id := public.get_current_workspace_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_workspace_id_messages
    BEFORE INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_on_messages();

-- Function to create workspace and add owner as member
CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
    workspace_name TEXT,
    workspace_slug TEXT
)
RETURNS UUID AS $$
DECLARE
    new_workspace_id UUID;
BEGIN
    -- Insert workspace
    INSERT INTO public.workspaces (name, slug, owner_id)
    VALUES (workspace_name, workspace_slug, auth.uid())
    RETURNING id INTO new_workspace_id;
    
    -- Add owner as workspace member
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (new_workspace_id, auth.uid(), 'owner');
    
    RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept invite
CREATE OR REPLACE FUNCTION public.accept_invite(invite_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- Get invite details
    SELECT * INTO invite_record
    FROM public.invites
    WHERE token = invite_token
    AND expires_at > NOW()
    AND accepted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Add user to workspace
    INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
    VALUES (invite_record.workspace_id, auth.uid(), invite_record.role, invite_record.invited_by)
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
    
    -- Mark invite as accepted
    UPDATE public.invites
    SET accepted_at = NOW()
    WHERE id = invite_record.id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;