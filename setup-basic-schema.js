const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://qyrrwjneeolzcayqdsur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cnJ3am5lZW9semNheXFkc3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDA4NDAsImV4cCI6MjA3NDQxNjg0MH0.fJNzKlTO5agqCHb1AC9QqOxp28qARzsSs3822e9w7GU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupBasicSchema() {
  console.log('🚀 Configuration du schéma de base...\n');
  
  // 1. Créer la table workspaces
  console.log('📄 Création de la table workspaces...');
  const { data: ws, error: wsError } = await supabase
    .from('workspaces')
    .select('count')
    .limit(1);
    
  if (wsError && wsError.message.includes('does not exist')) {
    console.log('⚠️  Table workspaces manquante, création nécessaire via l\'interface Supabase');
    console.log('🔗 Allez sur: https://qyrrwjneeolzcayqdsur.supabase.co/project/default/editor');
    console.log('📝 Exécutez ce SQL dans l\'éditeur SQL:');
    console.log(`
-- Créer la table workspaces
CREATE TABLE public.workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true
);

-- Créer la table workspace_members
CREATE TABLE public.workspace_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'mission_complete')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES auth.users(id),
    UNIQUE(workspace_id, user_id)
);

-- Créer la table invites
CREATE TABLE public.invites (
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

-- Ajouter workspace_id aux tables existantes
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON public.workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_status ON public.workspace_members(status);
CREATE INDEX IF NOT EXISTS idx_invites_workspace_id ON public.invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);

-- Activer RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Politiques RLS de base
CREATE POLICY "Users can view workspaces they belong to" ON public.workspaces
    FOR SELECT USING (
        id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can view workspace members of their workspaces" ON public.workspace_members
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can view invites for their workspaces" ON public.invites
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );
    `);
    
    return false;
  } else {
    console.log('✅ Table workspaces existe déjà');
    return true;
  }
}

async function testWorkspaceCreation() {
  console.log('\n🧪 Test de création d\'un workspace...');
  
  try {
    // Créer un workspace de test
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name: 'Workspace Test',
        slug: 'workspace-test-' + Date.now(),
        owner_id: '00000000-0000-0000-0000-000000000000' // ID fictif pour test
      })
      .select()
      .single();
      
    if (wsError) {
      console.log('❌ Erreur création workspace:', wsError.message);
      return false;
    }
    
    console.log('✅ Workspace créé avec succès:', workspace.name);
    
    // Nettoyer le test
    await supabase.from('workspaces').delete().eq('id', workspace.id);
    console.log('🧹 Workspace de test supprimé');
    
    return true;
    
  } catch (err) {
    console.log('❌ Erreur test:', err.message);
    return false;
  }
}

async function main() {
  const schemaReady = await setupBasicSchema();
  
  if (schemaReady) {
    await testWorkspaceCreation();
    console.log('\n🎉 Configuration terminée!');
  } else {
    console.log('\n⚠️  Veuillez d\'abord créer les tables via l\'interface Supabase');
  }
}

main().catch(console.error);