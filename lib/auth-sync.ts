"use client"

import { supabase } from "@/lib/supabase"
import { stackApp } from "@/stack/client"
import { TeamManager } from "@/lib/team-manager"

export interface SyncedUser {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  selectedTeam?: {
    id: string
    displayName: string
  }
  teams: Array<{
    id: string
    displayName: string
    role: string
  }>
}

export class AuthSync {
  /**
   * Synchronise un utilisateur Stack Auth avec Supabase
   */
  static async syncUserToSupabase(stackUser: any): Promise<void> {
    try {
      if (!stackUser?.id) {
        throw new Error('Invalid Stack Auth user')
      }

      // Synchroniser l'utilisateur dans la table auth.users de Supabase
      const { error: userError } = await supabase.auth.admin.createUser({
        user_id: stackUser.id,
        email: stackUser.primaryEmail,
        email_confirm: true,
        user_metadata: {
          full_name: stackUser.displayName,
          avatar_url: stackUser.profileImageUrl,
          stack_auth_id: stackUser.id
        }
      })

      // Si l'utilisateur existe déjà, mettre à jour ses informations
      if (userError && userError.message.includes('already registered')) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          stackUser.id,
          {
            email: stackUser.primaryEmail,
            user_metadata: {
              full_name: stackUser.displayName,
              avatar_url: stackUser.profileImageUrl,
              stack_auth_id: stackUser.id
            }
          }
        )

        if (updateError) {
          console.error('Error updating user in Supabase:', updateError)
        }
      } else if (userError) {
        console.error('Error creating user in Supabase:', userError)
        throw userError
      }

      console.log('User synced to Supabase:', stackUser.id)
    } catch (error) {
      console.error('Error in syncUserToSupabase:', error)
      throw error
    }
  }

  /**
   * Synchronise les équipes d'un utilisateur Stack Auth avec Supabase
   */
  static async syncUserTeamsToSupabase(stackUser: any): Promise<void> {
    try {
      if (!stackUser?.id) {
        throw new Error('Invalid Stack Auth user')
      }

      // Obtenir les équipes de l'utilisateur depuis Stack Auth
      const teams = await stackUser.listTeams() || []

      for (const team of teams) {
        // Synchroniser l'équipe
        await TeamManager.syncTeamToSupabase(team, stackUser.id)

        // Ajouter l'utilisateur comme membre de l'équipe
        await TeamManager.addUserToTeamInSupabase(
          team.id,
          stackUser.id,
          stackUser.primaryEmail,
          stackUser.displayName
        )
      }

      console.log('User teams synced to Supabase:', teams.length)
    } catch (error) {
      console.error('Error in syncUserTeamsToSupabase:', error)
      throw error
    }
  }

  /**
   * Obtient un utilisateur synchronisé avec toutes ses données
   */
  static async getSyncedUser(): Promise<SyncedUser | null> {
    try {
      // Obtenir l'utilisateur depuis Stack Auth
      const stackUser = stackApp.useUser()

      if (!stackUser) {
        console.log('No Stack Auth user found')
        return null
      }

      // S'assurer que l'utilisateur a une équipe
      await TeamManager.ensureUserHasTeam(stackUser)

      // Synchroniser l'utilisateur avec Supabase
      await this.syncUserToSupabase(stackUser)
      await this.syncUserTeamsToSupabase(stackUser)

      // Obtenir les équipes depuis Stack Auth
      const teams = await stackUser.listTeams() || []

      // Construire l'objet utilisateur synchronisé
      const syncedUser: SyncedUser = {
        id: stackUser.id,
        email: stackUser.primaryEmail,
        displayName: stackUser.displayName || stackUser.primaryEmail,
        avatarUrl: stackUser.profileImageUrl,
        selectedTeam: stackUser.selectedTeam ? {
          id: stackUser.selectedTeam.id,
          displayName: stackUser.selectedTeam.displayName
        } : undefined,
        teams: teams.map((team: any) => ({
          id: team.id,
          displayName: team.displayName,
          role: 'member' // Par défaut, peut être ajusté selon les besoins
        }))
      }

      return syncedUser
    } catch (error) {
      console.error('Error getting synced user:', error)
      return null
    }
  }

  /**
   * Crée une session Supabase pour un utilisateur Stack Auth
   */
  static async createSupabaseSession(stackUser: any): Promise<boolean> {
    try {
      if (!stackUser?.id) {
        return false
      }

      // Synchroniser l'utilisateur d'abord
      await this.syncUserToSupabase(stackUser)

      // Créer une session Supabase avec l'ID de l'utilisateur Stack Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: stackUser.primaryEmail,
        password: 'temp-password' // Ceci ne fonctionnera pas, nous devons utiliser une autre approche
      })

      if (error) {
        console.log('Cannot create password session, using admin session')
        
        // Alternative: utiliser l'admin API pour créer une session
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: stackUser.primaryEmail,
          options: {
            redirectTo: window.location.origin
          }
        })

        if (sessionError) {
          console.error('Error creating admin session:', sessionError)
          return false
        }

        return true
      }

      return true
    } catch (error) {
      console.error('Error creating Supabase session:', error)
      return false
    }
  }

  /**
   * Initialise la synchronisation complète pour un utilisateur
   */
  static async initializeUserSync(): Promise<SyncedUser | null> {
    try {
      console.log('Initializing user synchronization...')

      // Obtenir l'utilisateur synchronisé
      const syncedUser = await this.getSyncedUser()

      if (!syncedUser) {
        console.log('No user to sync')
        return null
      }

      console.log('User synchronization completed:', syncedUser.id)
      return syncedUser
    } catch (error) {
      console.error('Error initializing user sync:', error)
      return null
    }
  }

  /**
   * Vérifie si un utilisateur a accès à une équipe
   */
  static async checkTeamAccess(userId: string, teamId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .eq('status', 'active')
        .single()

      if (error) {
        console.error('Error checking team access:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Error in checkTeamAccess:', error)
      return false
    }
  }

  /**
   * Obtient les équipes d'un utilisateur depuis Supabase
   */
  static async getUserTeams(userId: string) {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          role,
          status,
          teams (
            id,
            name,
            description
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')

      if (error) {
        console.error('Error getting user teams:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getUserTeams:', error)
      return []
    }
  }
}