const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
    console.log('🔍 Vérification du stockage Supabase...');
    
    try {
        // Vérifier les buckets existants
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
            console.error('❌ Erreur lors de la récupération des buckets:', bucketsError);
            return;
        }
        
        console.log('📦 Buckets disponibles:');
        buckets.forEach(bucket => {
            console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'privé'})`);
        });
        
        // Vérifier si le bucket "files" existe
        const filesBucket = buckets.find(b => b.name === 'files');
        
        if (filesBucket) {
            console.log('✅ Bucket "files" trouvé!');
            
            // Lister les fichiers dans le bucket
            const { data: files, error: filesError } = await supabase.storage.from('files').list();
            
            if (filesError) {
                console.error('❌ Erreur lors du listing des fichiers:', filesError);
            } else {
                console.log(`📄 Fichiers dans le bucket: ${files.length}`);
                files.forEach(file => {
                    console.log(`   - ${file.name} (${file.size} bytes)`);
                });
            }
        } else {
            console.log('❌ Bucket "files" non trouvé!');
            console.log('💡 Pour créer le bucket, allez dans Supabase > Storage > New Bucket');
            console.log('   - Nom: files');
            console.log('   - Public: false (privé)');
        }
        
    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

checkStorage();