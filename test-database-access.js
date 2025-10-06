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
        console.error('❌ Variables d\'environnement Supabase manquantes');
        process.exit(1);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    async function testDatabaseAccess() {
        console.log('\n🔍 Test d\'accès à la base de données...');
        
        try {
            // Test simple: compter le nombre de tables
            const { data: tables, error: tablesError } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public');
            
            if (tablesError) {
                console.error('❌ Erreur d\'accès aux tables:', tablesError.message);
                
                // Essayer une requête plus simple
                console.log('\n🔧 Tentative de requête simple...');
                const { data: simpleData, error: simpleError } = await supabase
                    .from('teams')
                    .select('count')
                    .limit(1);
                
                if (simpleError) {
                    console.error('❌ Erreur sur requête simple:', simpleError.message);
                    console.log('💡 Le problème peut être:');
                    console.log('   - Les tables n\'existent pas');
                    console.log('   - Les politiques RLS bloquent l\'accès');
                    console.log('   - La clé API n\'a pas les permissions');
                } else {
                    console.log('✅ Requête simple réussie!');
                }
                
                return;
            }
            
            console.log(`✅ ${tables.length} tables trouvées dans le schéma public`);
            
            // Lister les tables importantes attendues
            const expectedTables = ['teams', 'projects', 'tasks', 'file_uploads', 'team_members'];
            const foundTables = tables.map(t => t.table_name);
            
            console.log('\n📊 Tables trouvées:');
            expectedTables.forEach(table => {
                if (foundTables.includes(table)) {
                    console.log(`   ✅ ${table}`);
                } else {
                    console.log(`   ❌ ${table} (manquante)`);
                }
            });
            
            // Tester l'accès à une table spécifique
            console.log('\n🔧 Test d\'accès à la table teams...');
            const { data: teams, error: teamsError } = await supabase
                .from('teams')
                .select('*')
                .limit(1);
            
            if (teamsError) {
                console.error('❌ Erreur d\'accès à teams:', teamsError.message);
            } else {
                console.log(`✅ Accès à teams réussi: ${teams.length} équipe(s) trouvée(s)`);
            }
            
        } catch (error) {
            console.error('❌ Erreur générale:', error.message);
        }
    }
    
    testDatabaseAccess();
    
} catch (error) {
    console.error('❌ Erreur lors de la lecture de .env.local:', error.message);
}