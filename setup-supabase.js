const { createClient } = require('@supabase/supabase-js');

// Configuration depuis votre .env.local
const supabaseUrl = 'https://xnwjvajlttmgwqnvpyqg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhud2p2YWpsdHRtZ3dxbnZweXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMzkwODIsImV4cCI6MjA2NzgxNTA4Mn0.h8969GZd7BKQe7CVdmL4MqIZB0_E1HyiTuTC0i03m-c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupSupabase() {
  console.log('🚀 Démarrage de la configuration Supabase...\n');
  
  try {
    // 1. Test de connexion basique
    console.log('1. Test de connexion à Supabase...');
    const { data, error } = await supabase.from('teams').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erreur de connexion:', error.message);
      
      if (error.code === 'PGRST301' || error.message.includes('relation')) {
        console.log('ℹ️  Les tables n\'existent pas encore. Création nécessaire.');
        return await createDatabaseSchema();
      } else if (error.message.includes('JWT')) {
        console.error('❌ Problème d\'authentification - clés API probablement invalides');
        console.log('ℹ️  Vérifiez vos clés Supabase dans le dashboard');
        return false;
      }
      return false;
    }
    
    console.log('✅ Connexion réussie!');
    
    // 2. Vérifier le bucket de stockage
    console.log('\n2. Vérification du bucket de stockage...');
    await checkStorageBucket();
    
    // 3. Vérifier les tables
    console.log('\n3. Vérification des tables...');
    await checkTables();
    
    return true;
    
  } catch (err) {
    console.error('❌ Erreur inattendue:', err);
    return false;
  }
}

async function createDatabaseSchema() {
  console.log('\n📋 Création du schéma de base de données...');
  
  // Note: Dans un environnement réel, vous exécuteriez le fichier SQL de migration
  // Pour l'instant, on va juste vérifier l'état
  console.log('ℹ️  Exécutez le script SQL de migration dans le dashboard Supabase');
  console.log('ℹ️  Fichier: supabase/migrations/001_initial_schema.sql');
  
  return false;
}

async function checkStorageBucket() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Erreur lors de la liste des buckets:', error.message);
      return;
    }
    
    const filesBucket = buckets.find(b => b.name === 'files');
    
    if (filesBucket) {
      console.log('✅ Bucket "files" existe');
    } else {
      console.log('❌ Bucket "files" manquant');
      console.log('ℹ️  Créez le bucket "files" dans le dashboard Supabase Storage');
    }
    
  } catch (err) {
    console.error('❌ Erreur lors de la vérification du storage:', err);
  }
}

async function checkTables() {
  const tables = [
    'teams', 'team_members', 'projects', 'tasks', 
    'messages', 'time_entries', 'file_uploads',
    'user_preferences', 'user_profiles', 'notifications'
  ];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      
      if (error && error.code === 'PGRST301') {
        console.log(`❌ Table "${table}" manquante`);
      } else if (error) {
        console.log(`⚠️  Table "${table}": ${error.message}`);
      } else {
        console.log(`✅ Table "${table}" existe`);
      }
      
    } catch (err) {
      console.log(`⚠️  Table "${table}": erreur de vérification`);
    }
  }
}

// Exécuter le setup
setupSupabase().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ Configuration Supabase terminée avec succès!');
  } else {
    console.log('❌ Configuration Supabase nécessite une intervention manuelle');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Allez sur https://app.supabase.com');
    console.log('2. Trouvez votre projet (xnwjvajlttmgwqnvpyqg)');
    console.log('3. Exécutez le script SQL dans SQL Editor:');
    console.log('   - Fichier: supabase/migrations/001_initial_schema.sql');
    console.log('4. Créez le bucket "files" dans Storage');
    console.log('5. Vérifiez vos clés API dans Settings > API');
  }
  console.log('='.repeat(50));
});