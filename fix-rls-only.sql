-- Script pour corriger uniquement les politiques RLS et le cache de schéma
-- SANS recréer les tables existantes

-- 1. Rafraîchir le cache de schéma PostgREST
NOTIFY pgrst, 'reload schema';

-- 2. Supprimer les anciennes politiques RLS restrictives pour les équipes
DROP POLICY IF EXISTS "Users can view teams they belong to" ON teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;

-- 3. Créer des politiques permissives pour les équipes
CREATE POLICY "Allow authenticated users to view teams" ON teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to create teams" ON teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow team owners to update teams" ON teams FOR UPDATE TO authenticated USING (owner_id = auth.uid()::text);
CREATE POLICY "Allow team owners to delete teams" ON teams FOR DELETE TO authenticated USING (owner_id = auth.uid()::text);

-- 4. Supprimer les anciennes politiques pour team_members
DROP POLICY IF EXISTS "Users can view team members of their teams" ON team_members;
DROP POLICY IF EXISTS "Users can insert team members" ON team_members;

-- 5. Créer des politiques permissives pour team_members
CREATE POLICY "Allow authenticated users to view team members" ON team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert team members" ON team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow team admins to update members" ON team_members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow team admins to delete members" ON team_members FOR DELETE TO authenticated USING (true);

-- 6. Supprimer les anciennes politiques pour projects
DROP POLICY IF EXISTS "Users can view projects of their teams" ON projects;
DROP POLICY IF EXISTS "Users can create projects in their teams" ON projects;

-- 7. Créer des politiques permissives pour projects
CREATE POLICY "Allow authenticated users to view projects" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to create projects" ON projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow project creators to update projects" ON projects FOR UPDATE TO authenticated USING (created_by = auth.uid()::text);
CREATE POLICY "Allow project creators to delete projects" ON projects FOR DELETE TO authenticated USING (created_by = auth.uid()::text);

-- 8. Vérifier que RLS est activé (sans erreur si déjà activé)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 9. Accorder les permissions nécessaires
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 10. Rafraîchir à nouveau le cache PostgREST
NOTIFY pgrst, 'reload schema';