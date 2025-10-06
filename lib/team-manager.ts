"use client"

import { supabase } from "@/lib/supabase"
import { stackApp } from "@/stack/client"

export class TeamManager {
  /**
   * Ensures that a user has a default team created and selected
   * This resolves the issue where user.selectedTeam is undefined
   */
  static async ensureUserHasTeam(user: any) {
    try {
      // If user already has a selected team, nothing to do
      if (user?.selectedTeam?.id) {
        console.log('User already has selected team:', user.selectedTeam.id)
        return user.selectedTeam
      }

      console.log('User has no selected team, creating default team...')

      // Check if user has any teams in Stack Auth
      const existingTeams = await user.listTeams?.() || []
      
      if (existingTeams.length > 0) {
        // User has teams but none selected, select the first one
        console.log('User has existing teams, selecting first one')
        const firstTeam = existingTeams[0]
        
        // Ensure this team exists in Supabase
        await this.syncTeamToSupabase(firstTeam, user.id)
        
        return firstTeam
      }

      // Create a new default team for the user
      const defaultTeamName = `Équipe de ${user.displayName || user.primaryEmail || 'Utilisateur'}`
      
      console.log('Creating new default team:', defaultTeamName)
      
      // Create team in Stack Auth
      const newTeam = await user.createTeam?.({
        displayName: defaultTeamName,
        description: 'Équipe créée automatiquement'
      })

      if (!newTeam) {
        throw new Error('Failed to create team in Stack Auth')
      }

      console.log('Team created in Stack Auth:', newTeam.id)

      // Sync the new team to Supabase
      await this.syncTeamToSupabase(newTeam, user.id)

      // Add user as team member in Supabase
      await this.addUserToTeamInSupabase(newTeam.id, user.id, user.primaryEmail, user.displayName)

      console.log('Default team setup completed')
      return newTeam

    } catch (error) {
      console.error('Error ensuring user has team:', error)
      throw error
    }
  }

  /**
   * Syncs a Stack Auth team to Supabase database
   */
  private static async syncTeamToSupabase(team: any, userId: string) {
    try {
      const { error } = await supabase
        .from('teams')
        .upsert({
          id: team.id,
          name: team.displayName,
          description: team.description || 'Équipe créée automatiquement',
          owner_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error syncing team to Supabase:', error)
        throw error
      }

      console.log('Team synced to Supabase:', team.id)
    } catch (error) {
      console.error('Error in syncTeamToSupabase:', error)
      throw error
    }
  }

  /**
   * Adds a user as a team member in Supabase
   */
  private static async addUserToTeamInSupabase(teamId: string, userId: string, email: string, name: string) {
    try {
      const { error } = await supabase
        .from('team_members')
        .upsert({
          team_id: teamId,
          user_id: userId,
          email: email,
          name: name || 'Utilisateur',
          role: 'admin',
          status: 'active',
          joined_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error adding user to team in Supabase:', error)
        throw error
      }

      console.log('User added to team in Supabase:', teamId)
    } catch (error) {
      console.error('Error in addUserToTeamInSupabase:', error)
      throw error
    }
  }

  /**
   * Initializes team setup for a user on first login
   */
  static async initializeUserTeams(user: any) {
    try {
      if (!user?.id) {
        console.log('No user provided for team initialization')
        return null
      }

      console.log('Initializing teams for user:', user.id)
      
      // Ensure user has a team
      const team = await this.ensureUserHasTeam(user)
      
      // Wait a bit for Stack Auth to update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return team
    } catch (error) {
      console.error('Error initializing user teams:', error)
      return null
    }
  }
}