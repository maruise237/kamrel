const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const SUPABASE_URL = 'https://qyrrwjneeolzcayqdsur.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cnJ3am5lZW9semNheXFkc3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDA4NDAsImV4cCI6MjA3NDQxNjg0MH0.fJNzKlTO5agqCHb1AC9QqOxp28qARzsSs3822e9w7GU';

console.log('🚀 Test des fonctions Edge et des tables après déploiement...\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testEdgeFunctions() {
  console.log('🔍 Test des fonctions Edge pour les invitations...\n')

  try {
    // Test 1: Vérifier si les fonctions Edge existent
    console.log('1. Test de la fonction send-invite...')
    
    const { data: sendInviteData, error: sendInviteError } = await supabase.functions.invoke('send-invite', {
      body: {
        email: 'test@example.com',
        role: 'member'
      }
    })

    if (sendInviteError) {
      console.log('❌ Erreur send-invite:', sendInviteError.message)
    } else {
      console.log('✅ Fonction send-invite accessible')
      console.log('   Réponse:', sendInviteData)
    }

    console.log('\n2. Test de la fonction accept-invite...')
    
    const { data: acceptInviteData, error: acceptInviteError } = await supabase.functions.invoke('accept-invite', {
      body: {
        token: 'test-token'
      }
    })

    if (acceptInviteError) {
      console.log('❌ Erreur accept-invite:', acceptInviteError.message)
    } else {
      console.log('✅ Fonction accept-invite accessible')
      console.log('   Réponse:', acceptInviteData)
    }

    console.log('\n3. Test de la fonction create-default-workspace...')
    
    const { data: createWorkspaceData, error: createWorkspaceError } = await supabase.functions.invoke('create-default-workspace', {
      body: {
        invite_token: null
      }
    })

    if (createWorkspaceError) {
      console.log('❌ Erreur create-default-workspace:', createWorkspaceError.message)
    } else {
      console.log('✅ Fonction create-default-workspace accessible')
      console.log('   Réponse:', createWorkspaceData)
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message)
  }

  // Test 2: Vérifier les tables nécessaires
  console.log('\n4. Vérification des tables nécessaires...')
  
  try {
    const { data: workspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select('*')
      .limit(1)

    if (workspacesError) {
      console.log('❌ Table workspaces:', workspacesError.message)
    } else {
      console.log('✅ Table workspaces accessible')
    }

    const { data: invites, error: invitesError } = await supabase
      .from('invites')
      .select('*')
      .limit(1)

    if (invitesError) {
      console.log('❌ Table invites:', invitesError.message)
    } else {
      console.log('✅ Table invites accessible')
    }

    const { data: members, error: membersError } = await supabase
      .from('workspace_members')
      .select('*')
      .limit(1)

    if (membersError) {
      console.log('❌ Table workspace_members:', membersError.message)
    } else {
      console.log('✅ Table workspace_members accessible')
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des tables:', error.message)
  }

  console.log('\n📋 Résumé du diagnostic:')
  console.log('- Les fonctions Edge peuvent ne pas être déployées sur Supabase')
  console.log('- Vérifiez le déploiement des fonctions dans le dashboard Supabase')
  console.log('- Les tables semblent accessibles mais peuvent manquer de données de test')
}

testEdgeFunctions()