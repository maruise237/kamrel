const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Test avec clé de service Supabase...');
console.log('💡 Cette clé a généralement plus de permissions que la clé anonyme');

// Demander à l'utilisateur d'entrer sa clé de service
console.log('\n📝 Pour ce test, vous aurez besoin de votre clé de service Supabase:');
console.log('1. Allez sur https://app.supabase.com');
console.log('2. Sélectionnez votre projet');
console.log('3. Allez dans Settings > API');
console.log('4. Copiez la "service_role" key (attention: cette clé est sensible!)');
console.log('5. Collez-la ci-dessous quand vous y êtes invité');

// Fonction pour lire l'entrée utilisateur (simplifiée)
function askForServiceKey() {
    return new Promise((resolve) => {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        readline.question('\n🔑 Entrez votre clé de service Supabase: ', (key) => {
            readline.close();
            resolve(key.trim());
        });
    });
}

async function testWithServiceKey() {
    try {
        const serviceKey = await askForServiceKey();
        
        if (!serviceKey) {
            console.log('❌ Aucune clé fournie. Test annulé.');
            return;
        }
        
        // Lire l'URL depuis .env.local
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const envVars = {};
        
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=#]+)=([^#]*)/);
            if (match) {
                envVars[match[1].trim()] = match[2].trim();
            }
        });
        
        const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
        
        if (!supabaseUrl) {
            console.error('❌ URL Supabase non trouvée dans .env.local');
            return;
        }
        
        console.log('\n🔗 Connexion avec clé de service...');
        const supabase = createClient(supabaseUrl, serviceKey);
        
        // Test simple
        console.log('🔧 Test d\'accès à la base de données...');
        const { data, error } = await supabase
            .from('teams')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Erreur avec clé de service:', error.message);
            console.log('💡 Cela suggère que:');
            console.log('   - Les tables n\'existent pas du tout');
            console.log('   - La migration SQL n\'a pas été exécutée');
            console.log('   - Il y a un problème de configuration Supabase');
        } else {
            console.log('✅ Succès avec clé de service!');
            console.log('💡 Les tables existent mais les politiques RLS bloquent l\'accès anonyme');
        }
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

// Méthode alternative sans readline (pour PowerShell)
console.log('\n📋 Alternative: Ajoutez cette ligne à votre .env.local:');
console.log('SUPABASE_SERVICE_KEY=votre_clé_de_service_ici');
console.log('Puis relancez le test');

testWithServiceKey();