import { NextRequest, NextResponse } from 'next/server'
import { TeamManager } from '@/lib/team-manager'
import { stackApp } from '@/stack/server'

export async function POST(request: NextRequest) {
  try {
    // Get the current user from Stack Auth
    const user = await stackApp.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { team } = body

    if (!team || !team.id) {
      return NextResponse.json(
        { error: 'Données d\'équipe manquantes' },
        { status: 400 }
      )
    }

    console.log('API: Syncing team for user:', { userId: user.id, teamId: team.id })

    // Sync team to Supabase using server-side admin client
    const syncedTeam = await TeamManager.syncTeamToSupabase(team, user.id)

    // Add user to team as admin
    await TeamManager.addUserToTeamInSupabase(
      team.id,
      user.id,
      user.primaryEmail || user.primaryEmailAddress || 'no-email@example.com',
      user.displayName || user.name || 'Utilisateur'
    )

    return NextResponse.json({
      success: true,
      team: syncedTeam,
      message: 'Équipe synchronisée avec succès'
    })

  } catch (error) {
    console.error('API Error syncing team:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la synchronisation de l\'équipe',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}