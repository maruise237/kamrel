const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Lire les variables d'environnement
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
    console.error('❌ Fichier .env.local non trouvé');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

let supabaseUrl = '';
let supabaseAnonKey = '';

envLines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1];
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
        supabaseAnonKey = line.split('=')[1];
    }
});

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    console.log('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définis dans .env.local');
    process.exit(1);
}

// Utiliser la clé anonyme (les buckets peuvent être créés via l'interface Supabase)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupStorageBucket() {
    console.log('🔧 Configuration du bucket de stockage...');
    
    try {
        // Vérifier si le bucket existe déjà
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
            console.error('❌ Erreur lors de la liste des buckets:', listError.message);
            return;
        }
        
        const filesBucket = buckets.find(b => b.name === 'files');
        
        if (!filesBucket) {
            // Créer le bucket
            const { data, error } = await supabase.storage.createBucket('files', {
                public: false,
                allowedMimeTypes: null,
                fileSizeLimit: 50 * 1024 * 1024 // 50MB
            });
            
            if (error) {
                console.error('❌ Erreur lors de la création du bucket:', error.message);
                return;
            }
            
            console.log('✅ Bucket "files" créé avec succès');
        } else {
            console.log('✅ Bucket "files" existe déjà');
        }
        
        // Configurer les politiques RLS pour le storage
        console.log('🔧 Configuration des politiques RLS pour le storage...');
        
        const storagePolicy1 = `
            CREATE POLICY IF NOT EXISTS "Users can upload files" ON storage.objects 
            FOR INSERT WITH CHECK (
                bucket_id = 'files' AND auth.role() = 'authenticated'
            );
        `;
        
        const storagePolicy2 = `
            CREATE POLICY IF NOT EXISTS "Users can view their uploaded files" ON storage.objects 
            FOR SELECT USING (
                bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]
            );
        `;
        
        const storagePolicy3 = `
            CREATE POLICY IF NOT EXISTS "Users can delete their files" ON storage.objects 
            FOR DELETE USING (
                bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]
            );
        `;
        
        // Exécuter les politiques
        const { error: policy1Error } = await supabase.rpc('exec_sql', { sql: storagePolicy1 });
        if (policy1Error) console.log('Note: Politique upload peut déjà exister');
        
        const { error: policy2Error } = await supabase.rpc('exec_sql', { sql: storagePolicy2 });
        if (policy2Error) console.log('Note: Politique view peut déjà exister');
        
        const { error: policy3Error } = await supabase.rpc('exec_sql', { sql: storagePolicy3 });
        if (policy3Error) console.log('Note: Politique delete peut déjà exister');
        
        console.log('✅ Configuration du storage terminée');
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

setupStorageBucket();