const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement manuellement
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExistingTables() {
  console.log('🔍 Vérification des tables existantes...\n');
  
  const tablesToCheck = [
    'teams',
    'team_members', 
    'projects',
    'tasks',
    'messages',
    'time_entries',
    'file_uploads',
    'user_preferences',
    'user_profiles',
    'notifications'
  ];
  
  const existingTables = [];
  const missingTables = [];
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST204' || error.message.includes('does not exist')) {
          console.log(`❌ Table "${table}" n'existe pas`);
          missingTables.push(table);
        } else {
          console.log(`⚠️  Table "${table}" - Erreur: ${error.message}`);
          missingTables.push(table);
        }
      } else {
        console.log(`✅ Table "${table}" existe`);
        existingTables.push(table);
      }
    } catch (err) {
      console.log(`❌ Table "${table}" n'existe pas (erreur: ${err.message})`);
      missingTables.push(table);
    }
  }
  
  console.log('\n📊 RÉSUMÉ:');
  console.log(`Tables existantes (${existingTables.length}):`, existingTables);
  console.log(`Tables manquantes (${missingTables.length}):`, missingTables);
  
  return { existingTables, missingTables };
}

checkExistingTables()
  .then(result => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  });