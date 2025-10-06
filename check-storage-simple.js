const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Lire manuellement le fichier .env.local
console.log('🔧 Lecture du fichier .env.local...');

try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=#]+)=([^#]*)/);
        if (match) {
            envVars[match[1].trim()] = match[2].trim();
        }
    });
    
    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('URL Supabase:', supabaseUrl ? '✓ Défini' : '❌ Manquant');
    console.log('Clé Supabase:', supabaseKey ? '✓ Défini' : '❌ Manquant');
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Variables d\'environnement Supabase manquantes dans .env.local');
        process.exit(1);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    async function checkStorage() {
        console.log('\n🔍 Vérification du stockage Supabase...');
        
        try {
            // Vérifier les buckets existants
            const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
            
            if (bucketsError) {
                console.error('❌ Erreur lors de la récupération des buckets:', bucketsError.message);
                return;
            }
            
            console.log('📦 Buckets disponibles:');
            if (buckets.length === 0) {
                console.log('   Aucun bucket trouvé');
            } else {
                buckets.forEach(bucket => {
                    console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'privé'})`);
                });
            }
            
            // Vérifier si le bucket "files" existe
            const filesBucket = buckets.find(b => b.name === 'files');
            
            if (filesBucket) {
                console.log('✅ Bucket "files" trouvé!');
                
                // Lister les fichiers dans le bucket
                const { data: files, error: filesError } = await supabase.storage.from('files').list();
                
                if (filesError) {
                    console.error('❌ Erreur lors du listing des fichiers:', filesError.message);
                } else {
                    console.log(`📄 Fichiers dans le bucket: ${files.length}`);
                    if (files.length === 0) {
                        console.log('   Aucun fichier pour le moment');
                    } else {
                        files.forEach(file => {
                            console.log(`   - ${file.name} (${file.size} bytes)`);
                        });
                    }
                }
            } else {
                console.log('❌ Bucket "files" non trouvé!');
                console.log('💡 Pour créer le bucket:');
                console.log('   1. Allez sur https://app.supabase.com');
                console.log('   2. Sélectionnez votre projet');
                console.log('   3. Allez dans Storage > New Bucket');
                console.log('   4. Nom: files');
                console.log('   5. Public: false (privé)');
            }
            
        } catch (error) {
            console.error('❌ Erreur générale:', error.message);
        }
    }
    
    checkStorage();
    
} catch (error) {
    console.error('❌ Erreur lors de la lecture de .env.local:', error.message);
    console.log('💡 Assurez-vous que le fichier .env.local existe et contient les variables Supabase');
}