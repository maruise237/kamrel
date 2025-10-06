-- Corriger les politiques RLS pour la table projects

-- 1. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Allow all for authenticated users" ON projects;
DROP POLICY IF EXISTS "Users can view team projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects for their team" ON projects;
DROP POLICY IF EXISTS "Users can update team projects" ON projects;
DROP POLICY IF EXISTS "Users can delete team projects" ON projects;

-- 2. Désactiver temporairement RLS pour tester
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- 3. Réactiver RLS avec des politiques simplifiées
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 4. Créer des politiques permissives pour les utilisateurs authentifiés
CREATE POLICY "Allow all operations for authenticated users" ON projects
    FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

-- 5. Politique pour les utilisateurs anonymes (lecture seule si nécessaire)
CREATE POLICY "Allow read for anon users" ON projects
    FOR SELECT 
    TO anon 
    USING (true);

-- Vérifier les politiques
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'projects';