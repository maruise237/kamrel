-- =====================================================
-- SCRIPT DE CRÉATION MANUELLE DES TABLES MANQUANTES
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- 1. Créer la table workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true
);

-- 2. Créer la table workspace_members
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'mission_complete')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES auth.users(id),
    UNIQUE(workspace_id, user_id)
);

-- 3. Créer la table invites
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    token VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, email)
);

-- 4. Ajouter workspace_id aux tables existantes (si pas déjà fait)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.file_uploads ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 5. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON public.workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_is_active ON public.workspaces(is_active);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_status ON public.workspace_members(status);
CREATE INDEX IF NOT EXISTS idx_workspace_members_role ON public.workspace_members(role);

CREATE INDEX IF NOT EXISTS idx_invites_workspace_id ON public.invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_status ON public.invites(status);
CREATE INDEX IF NOT EXISTS idx_invites_expires_at ON public.invites(expires_at);

-- Index pour les tables existantes avec workspace_id
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_messages_workspace_id ON public.messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_teams_workspace_id ON public.teams(workspace_id);
CREATE INDEX IF NOT EXISTS idx_team_members_workspace_id ON public.team_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_workspace_id ON public.time_entries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_workspace_id ON public.file_uploads(workspace_id);

-- 6. Activer Row Level Security (RLS)
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- 7. Créer les politiques RLS de base

-- Politiques pour workspaces
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON public.workspaces;
CREATE POLICY "Users can view workspaces they belong to" ON public.workspaces
    FOR SELECT USING (
        id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
CREATE POLICY "Users can create workspaces" ON public.workspaces
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Workspace owners can update their workspaces" ON public.workspaces;
CREATE POLICY "Workspace owners can update their workspaces" ON public.workspaces
    FOR UPDATE USING (
        owner_id = auth.uid() OR
        id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
        )
    );

-- Politiques pour workspace_members
DROP POLICY IF EXISTS "Users can view workspace members of their workspaces" ON public.workspace_members;
CREATE POLICY "Users can view workspace members of their workspaces" ON public.workspace_members
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

DROP POLICY IF EXISTS "Admins can manage workspace members" ON public.workspace_members;
CREATE POLICY "Admins can manage workspace members" ON public.workspace_members
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
        )
    );

-- Politiques pour invites
DROP POLICY IF EXISTS "Users can view invites for their workspaces" ON public.invites;
CREATE POLICY "Users can view invites for their workspaces" ON public.invites
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

DROP POLICY IF EXISTS "Admins can manage invites" ON public.invites;
CREATE POLICY "Admins can manage invites" ON public.invites
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
        )
    );

-- 8. Créer les fonctions utilitaires

-- Fonction pour vérifier si un utilisateur est admin actif
CREATE OR REPLACE FUNCTION is_active_admin(workspace_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = workspace_uuid
        AND user_id = user_uuid
        AND role IN ('owner', 'admin')
        AND status = 'active'
    );
END;
$$;

-- Fonction pour créer un workspace automatiquement
CREATE OR REPLACE FUNCTION create_user_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    workspace_id UUID;
    workspace_slug TEXT;
BEGIN
    -- Générer un slug unique basé sur l'email
    workspace_slug := LOWER(REGEXP_REPLACE(
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        '[^a-zA-Z0-9]', '-', 'g'
    )) || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
    
    -- Créer le workspace
    INSERT INTO public.workspaces (name, slug, owner_id)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Mon Workspace') || '''s Workspace',
        workspace_slug,
        NEW.id
    )
    RETURNING id INTO workspace_id;
    
    -- Ajouter l'utilisateur comme propriétaire
    INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
    VALUES (workspace_id, NEW.id, 'owner', 'active');
    
    RETURN NEW;
END;
$$;

-- Fonction pour marquer une mission comme terminée
CREATE OR REPLACE FUNCTION complete_member_mission(workspace_uuid UUID, member_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Vérifier que l'utilisateur actuel est admin
    IF NOT is_active_admin(workspace_uuid) THEN
        RAISE EXCEPTION 'Accès refusé: seuls les administrateurs peuvent marquer les missions comme terminées';
    END IF;
    
    -- Mettre à jour le statut du membre
    UPDATE public.workspace_members
    SET status = 'mission_complete'
    WHERE workspace_id = workspace_uuid
    AND user_id = member_user_id;
    
    RETURN FOUND;
END;
$$;

-- Fonction pour réactiver un membre
CREATE OR REPLACE FUNCTION reactivate_member(workspace_uuid UUID, member_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Vérifier que l'utilisateur actuel est admin
    IF NOT is_active_admin(workspace_uuid) THEN
        RAISE EXCEPTION 'Accès refusé: seuls les administrateurs peuvent réactiver les membres';
    END IF;
    
    -- Mettre à jour le statut du membre
    UPDATE public.workspace_members
    SET status = CASE 
        WHEN status = 'mission_complete' THEN 'active'
        WHEN status = 'inactive' THEN 'active'
        ELSE status
    END
    WHERE workspace_id = workspace_uuid
    AND user_id = member_user_id;
    
    RETURN FOUND;
END;
$$;

-- Fonction pour changer le rôle d'un membre
CREATE OR REPLACE FUNCTION change_member_role(workspace_uuid UUID, member_user_id UUID, new_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Vérifier que l'utilisateur actuel est admin
    IF NOT is_active_admin(workspace_uuid) THEN
        RAISE EXCEPTION 'Accès refusé: seuls les administrateurs peuvent changer les rôles';
    END IF;
    
    -- Vérifier que le nouveau rôle est valide
    IF new_role NOT IN ('admin', 'member') THEN
        RAISE EXCEPTION 'Rôle invalide: doit être admin ou member';
    END IF;
    
    -- Mettre à jour le rôle du membre
    UPDATE public.workspace_members
    SET role = new_role
    WHERE workspace_id = workspace_uuid
    AND user_id = member_user_id
    AND role != 'owner'; -- Ne pas permettre de changer le rôle du propriétaire
    
    RETURN FOUND;
END;
$$;

-- 9. Créer le trigger pour la création automatique de workspace
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_workspace();

-- 10. Accorder les permissions
GRANT EXECUTE ON FUNCTION is_active_admin TO authenticated;
GRANT EXECUTE ON FUNCTION complete_member_mission TO authenticated;
GRANT EXECUTE ON FUNCTION reactivate_member TO authenticated;
GRANT EXECUTE ON FUNCTION change_member_role TO authenticated;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- Pour vérifier que tout fonctionne, exécutez cette requête :
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('workspaces', 'workspace_members', 'invites');