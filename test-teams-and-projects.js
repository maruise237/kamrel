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

console.log('=== TEST ÉQUIPES ET PROJETS ===')
console.log('URL:', supabaseUrl)
console.log('Key présente:', !!supabaseKey)

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testTeamsAndProjects() {
  try {
    console.log('\n1. Vérification des équipes existantes...')
    
    const { data: existingTeams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .limit(5)
    
    if (teamsError) {
      console.error('Erreur lecture équipes:', teamsError)
      return
    }
    
    console.log('Équipes existantes:', existingTeams)
    
    let teamId = null
    
    if (existingTeams && existingTeams.length > 0) {
      teamId = existingTeams[0].id
      console.log('✅ Utilisation de l\'équipe existante:', teamId)
    } else {
      console.log('\n2. Création d\'une nouvelle équipe...')
      
      const testTeam = {
        name: 'Équipe Test ' + Date.now(),
        description: 'Équipe de test créée automatiquement',
        created_by: '00000000-0000-0000-0000-000000000000'
      }
      
      const { data: newTeam, error: createTeamError } = await supabase
        .from('teams')
        .insert([testTeam])
        .select()
      
      if (createTeamError) {
        console.error('❌ Erreur création équipe:', createTeamError)
        return
      }
      
      teamId = newTeam[0].id
      console.log('✅ Équipe créée:', newTeam[0])
    }
    
    console.log('\n3. Création d\'un projet avec l\'équipe valide...')
    
    const testProject = {
      name: 'Test Project ' + Date.now(),
      description: 'Projet de test créé automatiquement',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      priority: 'medium',
      status: 'active',
      team_id: teamId,
      created_by: '00000000-0000-0000-0000-000000000000'
    }
    
    console.log('Données projet à insérer:', testProject)
    
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert([testProject])
      .select()
    
    if (projectError) {
      console.error('❌ Erreur création projet:', projectError)
    } else {
      console.log('✅ Projet créé avec succès:', newProject[0])
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

testTeamsAndProjects()