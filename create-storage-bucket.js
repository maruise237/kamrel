const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://qyrrwjneeolzcayqdsur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cnJ3am5lZW9semNheXFkc3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDA4NDAsImV4cCI6MjA3NDQxNjg0MH0.fJNzKlTO5agqCHb1AC9QqOxp28qARzsSs3822e9w7GU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createStorageBucket() {
  console.log('🚀 Configuration du stockage de fichiers...\n');
  
  try {
    // 1. Vérifier les buckets existants
    console.log('📦 Vérification des buckets existants...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erreur lors de la liste des buckets:', listError.message);
      return false;
    }
    
    console.log('📋 Buckets trouvés:', buckets?.map(b => b.name) || []);
    
    // 2. Créer le bucket 'files' s'il n'existe pas
    const filesExists = buckets?.some(bucket => bucket.name === 'files');
    
    if (!filesExists) {
      console.log('📁 Création du bucket "files"...');
      
      const { data: bucket, error: createError } = await supabase.storage.createBucket('files', {
        public: false,
        allowedMimeTypes: [
          'image/*',
          'video/*',
          'audio/*',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/zip',
          'application/x-rar-compressed',
          'text/*'
        ],
        fileSizeLimit: 50 * 1024 * 1024 // 50MB
      });
      
      if (createError) {
        console.error('❌ Erreur lors de la création du bucket:', createError.message);
        console.log('⚠️  Le bucket doit être créé manuellement via l\'interface Supabase');
        console.log('🔗 Allez sur: https://qyrrwjneeolzcayqdsur.supabase.co/project/default/storage/buckets');
        console.log('📝 Créez un bucket nommé "files" avec les paramètres suivants:');
        console.log('   - Public: Non');
        console.log('   - Taille max: 50MB');
        console.log('   - Types MIME autorisés: image/*, video/*, audio/*, application/pdf, text/*');
        return false;
      } else {
        console.log('✅ Bucket "files" créé avec succès');
      }
    } else {
      console.log('✅ Bucket "files" existe déjà');
    }
    
    // 3. Tester l'upload d'un fichier de test
    console.log('\n🧪 Test d\'upload...');
    const testContent = 'Test file content';
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(`test/${testFileName}`, new Blob([testContent], { type: 'text/plain' }));
    
    if (uploadError) {
      console.error('❌ Erreur lors du test d\'upload:', uploadError.message);
      console.log('⚠️  Les politiques RLS doivent être configurées manuellement');
      console.log('📝 Exécutez ce SQL dans l\'éditeur Supabase:');
      console.log(`
-- Politiques pour le storage
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

-- Activer RLS sur storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      `);
      return false;
    } else {
      console.log('✅ Test d\'upload réussi');
      
      // Nettoyer le fichier de test
      await supabase.storage.from('files').remove([`test/${testFileName}`]);
      console.log('🧹 Fichier de test supprimé');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    return false;
  }
}

async function checkFileUploadsTable() {
  console.log('\n📋 Vérification de la table file_uploads...');
  
  try {
    const { data, error } = await supabase
      .from('file_uploads')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur table file_uploads:', error.message);
      console.log('⚠️  La table file_uploads doit être créée ou corrigée');
      return false;
    } else {
      console.log('✅ Table file_uploads accessible');
      return true;
    }
  } catch (err) {
    console.error('❌ Erreur lors de la vérification:', err.message);
    return false;
  }
}

async function main() {
  console.log('🔧 DIAGNOSTIC ET CORRECTION DU SYSTÈME DE FICHIERS\n');
  
  const tableOk = await checkFileUploadsTable();
  const storageOk = await createStorageBucket();
  
  console.log('\n📊 RÉSUMÉ:');
  console.log(`📋 Table file_uploads: ${tableOk ? '✅ OK' : '❌ Problème'}`);
  console.log(`📦 Storage bucket: ${storageOk ? '✅ OK' : '❌ Problème'}`);
  
  if (tableOk && storageOk) {
    console.log('\n🎉 Système de fichiers configuré avec succès!');
    console.log('📁 Vous pouvez maintenant uploader des fichiers');
  } else {
    console.log('\n⚠️  Configuration manuelle requise via l\'interface Supabase');
    console.log('🔗 Dashboard: https://qyrrwjneeolzcayqdsur.supabase.co/project/default');
  }
}

main().catch(console.error);