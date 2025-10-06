const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables from .env.local manually
let envVars = {};
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.log('No .env.local file found, using process.env');
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runStorageFix() {
  console.log('🔧 Exécution des corrections de stockage...');

  try {
    // 1. Create storage bucket if it doesn't exist
    console.log('📁 Création du bucket "files"...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Erreur lors de la liste des buckets:', listError);
    } else {
      const filesExists = buckets.some(bucket => bucket.name === 'files');
      
      if (!filesExists) {
        const { data, error } = await supabase.storage.createBucket('files', {
          public: false,
          allowedMimeTypes: null,
          fileSizeLimit: null
        });
        
        if (error) {
          console.error('Erreur lors de la création du bucket:', error);
        } else {
          console.log('✅ Bucket "files" créé avec succès');
        }
      } else {
        console.log('✅ Bucket "files" existe déjà');
      }
    }

    // 2. Execute RLS policies using raw SQL
    console.log('🔐 Configuration des politiques RLS...');
    
    const policies = [
      // Drop existing policies
      `DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can view files" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can delete files" ON storage.objects;`,
      
      // Create new policies for storage.objects
      `CREATE POLICY "Users can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'files' AND auth.role() = 'authenticated');`,
      `CREATE POLICY "Users can view files" ON storage.objects FOR SELECT USING (bucket_id = 'files' AND auth.role() = 'authenticated');`,
      `CREATE POLICY "Users can delete files" ON storage.objects FOR DELETE USING (bucket_id = 'files' AND auth.role() = 'authenticated');`,
      
      // Enable RLS on storage.objects
      `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`,
      
      // Drop and recreate file_uploads policies
      `DROP POLICY IF EXISTS "Users can insert file uploads" ON file_uploads;`,
      `DROP POLICY IF EXISTS "Users can view file uploads" ON file_uploads;`,
      `DROP POLICY IF EXISTS "Users can delete file uploads" ON file_uploads;`,
      
      `CREATE POLICY "Users can insert file uploads" ON file_uploads FOR INSERT WITH CHECK (auth.uid() = uploaded_by::uuid);`,
      `CREATE POLICY "Users can view file uploads" ON file_uploads FOR SELECT USING (auth.uid() = uploaded_by::uuid OR is_public = true);`,
      `CREATE POLICY "Users can delete file uploads" ON file_uploads FOR DELETE USING (auth.uid() = uploaded_by::uuid);`
    ];

    for (const policy of policies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy });
        if (error) {
          console.warn(`⚠️ Avertissement pour la politique: ${error.message}`);
        }
      } catch (err) {
        console.warn(`⚠️ Erreur lors de l'exécution de la politique: ${err.message}`);
      }
    }

    console.log('✅ Configuration des politiques RLS terminée');
    console.log('🎉 Correction du stockage terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la correction du stockage:', error);
    process.exit(1);
  }
}

runStorageFix();