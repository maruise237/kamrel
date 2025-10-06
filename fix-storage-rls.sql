-- Script pour corriger les politiques RLS du storage et de la table file_uploads

-- 1. Supprimer les anciennes politiques de storage si elles existent
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their files" ON storage.objects;

-- 2. Créer des politiques permissives pour le storage
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
    FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'files');

CREATE POLICY "Allow authenticated users to view files" ON storage.objects
    FOR SELECT 
    TO authenticated 
    USING (bucket_id = 'files');

CREATE POLICY "Allow authenticated users to delete files" ON storage.objects
    FOR DELETE 
    TO authenticated 
    USING (bucket_id = 'files');

-- 3. Corriger les politiques pour la table file_uploads
DROP POLICY IF EXISTS "Users can view files of their teams" ON file_uploads;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON file_uploads;

-- 4. Créer des politiques simplifiées pour file_uploads
CREATE POLICY "Allow authenticated users to manage file uploads" ON file_uploads
    FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

-- 5. S'assurer que RLS est activé
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- 6. Créer le bucket s'il n'existe pas (nécessite des permissions admin)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('files', 'files', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- 7. Accorder les permissions nécessaires
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;