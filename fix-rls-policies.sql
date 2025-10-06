-- Script pour corriger les politiques RLS qui causent une récursion infinie

-- Supprimer toutes les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "Users can view teams they belong to" ON teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON teams;
DROP POLICY IF EXISTS "Users can view team members of their teams" ON team_members;
DROP POLICY IF EXISTS "Users can view projects of their teams" ON projects;
DROP POLICY IF EXISTS "Users can create projects in their teams" ON projects;
DROP POLICY IF EXISTS "Users can view tasks of their team projects" ON tasks;
DROP POLICY IF EXISTS "Users can view messages in their teams" ON messages;
DROP POLICY IF EXISTS "Users can view their own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can view files of their teams" ON file_uploads;
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

-- Désactiver temporairement RLS pour éviter les problèmes de récursion
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Politiques simplifiées sans récursion

-- Politiques pour les équipes (simplifiées)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON teams FOR ALL USING (auth.role() = 'authenticated');

-- Politiques pour les membres d'équipe (simplifiées)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON team_members FOR ALL USING (auth.role() = 'authenticated');

-- Politiques pour les projets (simplifiées)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON projects FOR ALL USING (auth.role() = 'authenticated');

-- Politiques pour les tâches (simplifiées)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON tasks FOR ALL USING (auth.role() = 'authenticated');

-- Politiques pour les messages (simplifiées)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON messages FOR ALL USING (auth.role() = 'authenticated');

-- Politiques pour les entrées de temps (simplifiées)
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON time_entries FOR ALL USING (auth.role() = 'authenticated');

-- Politiques pour les fichiers (simplifiées)
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON file_uploads FOR ALL USING (auth.role() = 'authenticated');

-- Politiques pour les préférences utilisateur
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own preferences" ON user_preferences FOR ALL USING (
    user_id = auth.uid()::text
);

-- Politiques pour les profils utilisateur
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profile" ON user_profiles FOR ALL USING (
    user_id = auth.uid()::text
);

-- Politiques pour les notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (
    user_id = auth.uid()::text
);