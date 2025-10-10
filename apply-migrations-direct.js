const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const supabaseUrl = 'https://qyrrwjneeolzcayqdsur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cnJ3am5lZW9semNheXFkc3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDA4NDAsImV4cCI6MjA3NDQxNjg0MH0.fJNzKlTO5agqCHb1AC9QqOxp28qARzsSs3822e9w7GU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyMigration(migrationFile) {
  console.log(`\n📄 Application de la migration: ${migrationFile}`);
  
  try {
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', migrationFile);
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Diviser le SQL en commandes individuelles
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`  📝 ${commands.length} commandes SQL à exécuter`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        console.log(`  ⏳ Exécution commande ${i + 1}/${commands.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: command + ';' 
        });
        
        if (error) {
          console.error(`  ❌ Erreur commande ${i + 1}:`, error.message);
          // Continuer avec les autres commandes
        } else {
          console.log(`  ✅ Commande ${i + 1} exécutée avec succès`);
        }
      }
    }
    
    console.log(`✅ Migration ${migrationFile} terminée`);
    return true;
    
  } catch (err) {
    console.error(`❌ Erreur lors de l'application de ${migrationFile}:`, err.message);
    return false;
  }
}

async function applyAllMigrations() {
  console.log('🚀 Début de l\'application des migrations...\n');
  
  const migrations = [
    '004_multi_tenant_setup.sql',
    '005_enhanced_rls_policies.sql', 
    '006_chat_workspace_isolation.sql',
    '007_auto_workspace_creation.sql',
    '008_member_status_management.sql'
  ];
  
  let successCount = 0;
  
  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (success) successCount++;
  }
  
  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`✅ Migrations réussies: ${successCount}/${migrations.length}`);
  console.log(`❌ Migrations échouées: ${migrations.length - successCount}/${migrations.length}`);
  
  if (successCount === migrations.length) {
    console.log('\n🎉 Toutes les migrations ont été appliquées avec succès!');
  } else {
    console.log('\n⚠️  Certaines migrations ont échoué. Vérifiez les logs ci-dessus.');
  }
}

// Créer d'abord la fonction exec_sql si elle n'existe pas
async function createExecSqlFunction() {
  console.log('🔧 Création de la fonction exec_sql...');
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
      RETURN 'SUCCESS';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN 'ERROR: ' || SQLERRM;
    END;
    $$;
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: createFunctionSQL 
    });
    
    if (error) {
      console.log('⚠️  Fonction exec_sql peut déjà exister ou erreur:', error.message);
    } else {
      console.log('✅ Fonction exec_sql créée');
    }
  } catch (err) {
    console.log('⚠️  Tentative de création de exec_sql:', err.message);
  }
}

// Exécution principale
async function main() {
  await createExecSqlFunction();
  await applyAllMigrations();
}

main().catch(console.error);