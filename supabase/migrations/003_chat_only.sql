-- Migration pour créer uniquement les tables de chat
-- Créer la table messages pour le chat en temps réel
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Créer un index pour optimiser les requêtes par room_id et created_at
CREATE INDEX IF NOT EXISTS chat_messages_room_id_created_at_idx ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON public.chat_messages(user_id);

-- Activer RLS sur la table chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Politique simple pour permettre aux utilisateurs authentifiés de lire tous les messages
CREATE POLICY "Authenticated users can read chat messages" ON public.chat_messages
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Politique pour permettre aux utilisateurs authentifiés d'insérer des messages
CREATE POLICY "Authenticated users can insert chat messages" ON public.chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        user_id = auth.uid()
    );

-- Politique pour permettre aux utilisateurs de mettre à jour leurs propres messages
CREATE POLICY "Users can update their own chat messages" ON public.chat_messages
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs de supprimer leurs propres messages
CREATE POLICY "Users can delete their own chat messages" ON public.chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_chat_messages_updated_at_column();

-- Créer la table pour les rooms de chat
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activer RLS sur la table chat_rooms
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Politique simple pour les chat_rooms
CREATE POLICY "Authenticated users can read chat rooms" ON public.chat_rooms
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create chat rooms" ON public.chat_rooms
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        created_by = auth.uid()
    );

-- Trigger pour chat_rooms
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON public.chat_rooms
    FOR EACH ROW EXECUTE FUNCTION update_chat_messages_updated_at_column();