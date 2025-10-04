-- Création des tables pour l'application de gestion de projet

-- Table des équipes
CREATE TABLE teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    owner_id VARCHAR(255) NOT NULL -- ID de l'utilisateur Stack Auth
);

-- Table des membres d'équipe
CREATE TABLE team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL, -- ID de l'utilisateur Stack Auth
    role VARCHAR(20) CHECK (role IN ('admin', 'member', 'viewer')) DEFAULT 'member',
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'pending',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    UNIQUE(team_id, user_id)
);

-- Table des projets
CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')) DEFAULT 'active',
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL -- ID de l'utilisateur Stack Auth
);

-- Table des tâches
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to VARCHAR(255), -- ID de l'utilisateur Stack Auth
    status VARCHAR(20) CHECK (status IN ('todo', 'in_progress', 'review', 'done')) DEFAULT 'todo',
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL, -- ID de l'utilisateur Stack Auth
    estimated_hours INTEGER,
    actual_hours INTEGER
);

-- Table des messages
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    sender_id VARCHAR(255) NOT NULL, -- ID de l'utilisateur Stack Auth
    receiver_id VARCHAR(255), -- ID de l'utilisateur Stack Auth (pour messages directs)
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE, -- Pour messages d'équipe
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- Pour messages de projet
    message_type VARCHAR(20) CHECK (message_type IN ('direct', 'team', 'project')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- Table des entrées de temps
CREATE TABLE time_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- ID de l'utilisateur Stack Auth
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des fichiers uploadés
CREATE TABLE file_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    uploaded_by VARCHAR(255) NOT NULL, -- ID de l'utilisateur Stack Auth
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des profils utilisateur
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE, -- ID de l'utilisateur Stack Auth
    name VARCHAR(255),
    email VARCHAR(255),
    company VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des préférences utilisateur
CREATE TABLE user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE, -- ID de l'utilisateur Stack Auth
    language VARCHAR(10) DEFAULT 'fr',
    timezone VARCHAR(50) DEFAULT 'Europe/Paris',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    theme VARCHAR(20) DEFAULT 'light',
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    weekly_reports BOOLEAN DEFAULT TRUE,
    project_updates BOOLEAN DEFAULT TRUE,
    task_assignments BOOLEAN DEFAULT TRUE,
    team_invitations BOOLEAN DEFAULT TRUE,
    deadline_reminders BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- ID de l'utilisateur Stack Auth
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'project_update', 'task_assignment', 'team_invitation', 'deadline_reminder', etc.
    related_id UUID, -- ID de l'élément lié (projet, tâche, etc.)
    related_type VARCHAR(50), -- 'project', 'task', 'team', etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Création des index pour améliorer les performances
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_projects_team_id ON projects(team_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_team_id ON messages(team_id);
CREATE INDEX idx_messages_project_id ON messages(project_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_file_uploads_project_id ON file_uploads(project_id);
CREATE INDEX idx_file_uploads_task_id ON file_uploads(task_id);
CREATE INDEX idx_file_uploads_team_id ON file_uploads(team_id);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS (Row Level Security) pour sécuriser les données
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Politiques pour les équipes (les utilisateurs ne peuvent voir que leurs équipes)
CREATE POLICY "Users can view teams they belong to" ON teams FOR SELECT USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()::text)
);

CREATE POLICY "Team owners can update their teams" ON teams FOR UPDATE USING (
    owner_id = auth.uid()::text
);

CREATE POLICY "Users can create teams" ON teams FOR INSERT WITH CHECK (
    owner_id = auth.uid()::text
);

-- Politiques pour les membres d'équipe
CREATE POLICY "Users can view team members of their teams" ON team_members FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()::text)
);

-- Politiques pour les projets
CREATE POLICY "Users can view projects of their teams" ON projects FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()::text)
);

-- Politiques pour les tâches
CREATE POLICY "Users can view tasks of their team projects" ON tasks FOR SELECT USING (
    project_id IN (
        SELECT p.id FROM projects p 
        JOIN team_members tm ON p.team_id = tm.team_id 
        WHERE tm.user_id = auth.uid()::text
    )
);

-- Politiques pour les messages
CREATE POLICY "Users can view their messages" ON messages FOR SELECT USING (
    sender_id = auth.uid()::text OR 
    receiver_id = auth.uid()::text OR
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()::text)
);

-- Politiques pour les entrées de temps
CREATE POLICY "Users can view their own time entries" ON time_entries FOR SELECT USING (
    user_id = auth.uid()::text
);

-- Politiques pour les fichiers
CREATE POLICY "Users can view files of their teams" ON file_uploads FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()::text) OR
    project_id IN (
        SELECT p.id FROM projects p 
        JOIN team_members tm ON p.team_id = tm.team_id 
        WHERE tm.user_id = auth.uid()::text
    )
);

-- Politiques pour les préférences utilisateur
CREATE POLICY "Users can view their own preferences" ON user_preferences FOR SELECT USING (
    user_id = auth.uid()::text
);

CREATE POLICY "Users can update their own preferences" ON user_preferences FOR UPDATE USING (
    user_id = auth.uid()::text
);

CREATE POLICY "Users can insert their own preferences" ON user_preferences FOR INSERT WITH CHECK (
    user_id = auth.uid()::text
);

-- Politiques pour les notifications
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (
    user_id = auth.uid()::text
);

CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (
    user_id = auth.uid()::text
);

-- Politiques pour les profils utilisateur
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (
    user_id = auth.uid()::text
);

CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (
    user_id = auth.uid()::text
);

CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (
    user_id = auth.uid()::text
);