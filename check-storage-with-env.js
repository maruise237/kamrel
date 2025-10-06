require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Chargement des variables d\'environnement...');
console.log('URL Supabase:', supabaseUrl ? '✓ Défini' : '❌ Manquant');
console.log('Clé Supabase:', supabaseKey ? '✓ Défini' : '❌ Manquant');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    console.log('💡 Assurez-vous que votre fichier .env.local contient:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
    console.log('\n🔍 Vérification du stockage Supabase...');
    
    try {
        // Vérifier les buckets existants
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
            console.error('❌ Erreur lors de la récupération des buckets:', bucketsError);
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
                console.error('❌ Erreur lors du listing des fichiers:', filesError);
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
        console.error('❌ Erreur générale:', error);
    }
}

checkStorage();