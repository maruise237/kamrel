const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Lire manuellement le fichier .env.local
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        process.env[key.trim()] = value.trim()
      }
    })
  } catch (error) {
    console.error('Erreur lecture .env.local:', error.message)
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('=== TEST CRÉATION PROJET ===')
console.log('URL:', supabaseUrl)
console.log('Key présente:', !!supabaseKey)

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testProjectCreation() {
  try {
    console.log('\n1. Test de connexion à Supabase...')
    
    // Test simple de connexion
    const { data: testData, error: testError } = await supabase
      .from('projects')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('Erreur de connexion:', testError)
      return
    }
    
    console.log('✅ Connexion réussie')
    
    console.log('\n2. Test d\'insertion d\'un projet...')
    
    // Données de test
    const testProject = {
      name: 'Test Project ' + Date.now(),
      description: 'Projet de test créé automatiquement',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      priority: 'medium',
      status: 'active',
      team_id: '00000000-0000-0000-0000-000000000000', // UUID fictif
      created_by: '00000000-0000-0000-0000-000000000000' // UUID fictif
    }
    
    console.log('Données à insérer:', testProject)
    
    const { data, error } = await supabase
      .from('projects')
      .insert([testProject])
      .select()
    
    if (error) {
      console.error('❌ Erreur d\'insertion:', error)
      console.error('Code:', error.code)
      console.error('Message:', error.message)
      console.error('Détails:', error.details)
      console.error('Hint:', error.hint)
    } else {
      console.log('✅ Projet créé avec succès:', data)
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

testProjectCreation()