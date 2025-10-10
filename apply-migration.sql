-- Script pour appliquer les migrations directement
-- Exécuter ce script dans l'interface Supabase SQL Editor

-- 1. Créer la table workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Créer la table workspace_members
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'mission_complete')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 3. Créer la table invites
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(workspace_id, email)
);

-- 4. Ajouter workspace_id aux tables existantes si pas déjà fait
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.file_uploads 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 5. Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_invites_workspace_id ON public.invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_messages_workspace_id ON public.messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_teams_workspace_id ON public.teams(workspace_id);
CREATE INDEX IF NOT EXISTS idx_team_members_workspace_id ON public.team_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_workspace_id ON public.time_entries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_workspace_id ON public.file_uploads(workspace_id);

-- 6. Activer RLS (Row Level Security)
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- 7. Créer les politiques RLS pour workspaces
CREATE POLICY "Users can view workspaces they are members of" ON public.workspaces
    FOR SELECT USING (
        id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can create workspaces" ON public.workspaces
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Workspace owners can update their workspaces" ON public.workspaces
    FOR UPDATE USING (owner_id = auth.uid());

-- 8. Créer les politiques RLS pour workspace_members
CREATE POLICY "Users can view workspace members of their workspaces" ON public.workspace_members
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Workspace admins can manage members" ON public.workspace_members
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
        )
    );

-- 9. Créer les politiques RLS pour invites
CREATE POLICY "Users can view invites for their workspaces" ON public.invites
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Workspace admins can manage invites" ON public.invites
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
        )
    );

-- 10. Créer des fonctions utilitaires
CREATE OR REPLACE FUNCTION public.is_active_admin(workspace_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_id = workspace_uuid 
        AND user_id = auth.uid() 
        AND role = 'admin' 
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_user_workspace(workspace_name TEXT)
RETURNS UUID AS $$
DECLARE
    new_workspace_id UUID;
BEGIN
    -- Créer le workspace
    INSERT INTO public.workspaces (name, owner_id)
    VALUES (workspace_name, auth.uid())
    RETURNING id INTO new_workspace_id;
    
    -- Ajouter l'utilisateur comme admin
    INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
    VALUES (new_workspace_id, auth.uid(), 'admin', 'active');
    
    RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Créer un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspaces_updated_at 
    BEFORE UPDATE ON public.workspaces 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_members_updated_at 
    BEFORE UPDATE ON public.workspace_members 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Insérer un workspace par défaut pour les tests
INSERT INTO public.workspaces (id, name, description, owner_id)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Workspace par défaut',
    'Workspace créé automatiquement pour les tests',
    (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- 13. Créer le bucket de stockage files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'files',
    'files',
    false,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- 14. Créer les politiques RLS pour le bucket files
CREATE POLICY "Authenticated users can view files" ON storage.objects
    FOR SELECT USING (bucket_id = 'files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Fin du script