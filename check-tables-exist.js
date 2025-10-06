const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement depuis .env.local
const envPath = path.join(__dirname, '.env.local');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.log('❌ Fichier .env.local non trouvé');
  process.exit(1);
}

// Extraire les variables d'environnement
const supabaseUrlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

if (!supabaseUrlMatch || !supabaseKeyMatch) {
  console.log('❌ Variables Supabase non trouvées dans .env.local');
  process.exit(1);
}

const supabaseUrl = supabaseUrlMatch[1].trim();
const supabaseKey = supabaseKeyMatch[1].trim();

console.log('🔧 Connexion à Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('\n🔍 Vérification de l\'existence des tables...');
  
  // Liste des tables attendues
  const expectedTables = [
    'teams', 'team_members', 'projects', 'tasks', 'messages',
    'time_entries', 'file_uploads', 'user_preferences', 
    'user_profiles', 'notifications'
  ];

  try {
    // Essayer une requête simple sur information_schema pour vérifier les tables
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      console.log('❌ Erreur lors de la vérification des tables:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Tables existantes dans la base de données:');
      const existingTables = data.map(item => item.table_name);
      
      existingTables.forEach(table => {
        console.log(`   - ${table}`);
      });

      // Vérifier quelles tables attendues sont manquantes
      const missingTables = expectedTables.filter(table => !existingTables.includes(table));
      
      if (missingTables.length > 0) {
        console.log('\n❌ Tables manquantes:');
        missingTables.forEach(table => {
          console.log(`   - ${table}`);
        });
      } else {
        console.log('\n✅ Toutes les tables attendues sont présentes!');
      }
    } else {
      console.log('❌ Aucune table trouvée dans le schéma public');
      console.log('💡 La migration SQL n\'a probablement pas été exécutée');
    }

  } catch (error) {
    console.log('❌ Erreur générale:', error.message);
  }
}

checkTables();