import { supabase } from './supabase'
import { LocalStorageManager } from './local-storage'

export class SupabaseManager {
  private localStorageManager: LocalStorageManager

  constructor() {
    this.localStorageManager = new LocalStorageManager()
  }

  // Migrer les données du stockage local vers Supabase
  async migrateFromLocalStorage(userId: string, teamId?: string) {
    try {
      console.log('Début de la migration des données vers Supabase...')
      
      // Récupérer les données du stockage local
      const localData = this.localStorageManager.getData()
      
      if (!localData) {
        console.log('Aucune donnée locale à migrer')
        return
      }

      // Migrer les équipes
      if (localData.teams && localData.teams.length > 0) {
        await this.migrateTeams(localData.teams, userId)
      }

      // Migrer les membres d'équipe
      if (localData.teamMembers && localData.teamMembers.length > 0 && teamId) {
        await this.migrateTeamMembers(localData.teamMembers, teamId)
      }

      // Migrer les projets
      if (localData.projects && localData.projects.length > 0 && teamId) {
        await this.migrateProjects(localData.projects, teamId, userId)
      }

      // Migrer les tâches
      if (localData.tasks && localData.tasks.length > 0) {
        await this.migrateTasks(localData.tasks, userId)
      }

      // Migrer les messages
      if (localData.messages && localData.messages.length > 0 && teamId) {
        await this.migrateMessages(localData.messages, teamId)
      }

      // Migrer les préférences utilisateur
      if (localData.userPreferences) {
        await this.migrateUserPreferences(localData.userPreferences, userId)
      }

      // Migrer le profil utilisateur
      if (localData.userProfile) {
        await this.migrateUserProfile(localData.userProfile, userId)
      }

      // Migrer les notifications
      if (localData.notifications && localData.notifications.length > 0) {
        await this.migrateNotifications(localData.notifications, userId)
      }

      console.log('Migration terminée avec succès!')
      
      // Optionnel: nettoyer le stockage local après migration
      // this.localStorageManager.clearAllData()
      
    } catch (error) {
      console.error('Erreur lors de la migration:', error)
      throw error
    }
  }

  private async migrateTeams(teams: any[], userId: string) {
    for (const team of teams) {
      try {
        const { error } = await supabase
          .from('teams')
          .upsert({
            id: team.id,
            name: team.name,
            description: team.description,
            owner_id: userId,
            created_at: team.created_at || new Date().toISOString(),
            updated_at: team.updated_at || new Date().toISOString()
          })

        if (error) {
          console.error('Erreur lors de la migration de l\'équipe:', team.name, error)
        } else {
          console.log('Équipe migrée:', team.name)
        }
      } catch (error) {
        console.error('Erreur lors de la migration de l\'équipe:', team.name, error)
      }
    }
  }

  private async migrateTeamMembers(members: any[], teamId: string) {
    for (const member of members) {
      try {
        const { error } = await supabase
          .from('team_members')
          .upsert({
            id: member.id,
            team_id: teamId,
            user_id: member.user_id,
            email: member.email,
            name: member.name,
            avatar_url: member.avatar_url,
            role: member.role || 'member',
            status: member.status || 'active',
            joined_at: member.joined_at || new Date().toISOString()
          })

        if (error) {
          console.error('Erreur lors de la migration du membre:', member.name, error)
        } else {
          console.log('Membre migré:', member.name)
        }
      } catch (error) {
        console.error('Erreur lors de la migration du membre:', member.name, error)
      }
    }
  }

  private async migrateProjects(projects: any[], teamId: string, userId: string) {
    for (const project of projects) {
      try {
        const { error } = await supabase
          .from('projects')
          .upsert({
            id: project.id,
            name: project.name,
            description: project.description,
            team_id: teamId,
            created_by: userId,
            status: project.status || 'active',
            priority: project.priority || 'medium',
            start_date: project.start_date,
            end_date: project.end_date,
            created_at: project.created_at || new Date().toISOString(),
            updated_at: project.updated_at || new Date().toISOString()
          })

        if (error) {
          console.error('Erreur lors de la migration du projet:', project.name, error)
        } else {
          console.log('Projet migré:', project.name)
        }
      } catch (error) {
        console.error('Erreur lors de la migration du projet:', project.name, error)
      }
    }
  }

  private async migrateTasks(tasks: any[], userId: string) {
    for (const task of tasks) {
      try {
        const { error } = await supabase
          .from('tasks')
          .upsert({
            id: task.id,
            title: task.title,
            description: task.description,
            project_id: task.project_id,
            assigned_to: task.assigned_to,
            created_by: userId,
            status: task.status || 'todo',
            priority: task.priority || 'medium',
            due_date: task.due_date,
            start_date: task.start_date,
            end_date: task.end_date,
            estimated_hours: task.estimated_hours,
            actual_hours: task.actual_hours,
            created_at: task.created_at || new Date().toISOString(),
            updated_at: task.updated_at || new Date().toISOString()
          })

        if (error) {
          console.error('Erreur lors de la migration de la tâche:', task.title, error)
        } else {
          console.log('Tâche migrée:', task.title)
        }
      } catch (error) {
        console.error('Erreur lors de la migration de la tâche:', task.title, error)
      }
    }
  }

  private async migrateMessages(messages: any[], teamId: string) {
    for (const message of messages) {
      try {
        const { error } = await supabase
          .from('messages')
          .upsert({
            id: message.id,
            content: message.content,
            sender_id: message.sender_id,
            receiver_id: message.receiver_id,
            team_id: message.type === 'general' ? teamId : null,
            project_id: message.project_id,
            message_type: message.type === 'general' ? 'team' : message.type,
            is_read: message.is_read || false,
            created_at: message.timestamp || new Date().toISOString(),
            updated_at: message.timestamp || new Date().toISOString()
          })

        if (error) {
          console.error('Erreur lors de la migration du message:', error)
        } else {
          console.log('Message migré')
        }
      } catch (error) {
        console.error('Erreur lors de la migration du message:', error)
      }
    }
  }

  private async migrateUserPreferences(preferences: any, userId: string) {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          language: preferences.language || 'fr',
          timezone: preferences.timezone || 'Europe/Paris',
          theme: preferences.theme || 'light',
          email_notifications: preferences.email_notifications ?? true,
          push_notifications: preferences.push_notifications ?? true,
          weekly_reports: preferences.weekly_reports ?? true,
          project_updates: preferences.project_updates ?? true,
          task_assignments: preferences.task_assignments ?? true,
          team_invitations: preferences.team_invitations ?? true,
          deadline_reminders: preferences.deadline_reminders ?? true
        })

      if (error) {
        console.error('Erreur lors de la migration des préférences:', error)
      } else {
        console.log('Préférences migrées')
      }
    } catch (error) {
      console.error('Erreur lors de la migration des préférences:', error)
    }
  }

  private async migrateUserProfile(profile: any, userId: string) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          name: profile.name,
          email: profile.email,
          company: profile.company,
          phone: profile.phone,
          avatar_url: profile.avatar_url
        })

      if (error) {
        console.error('Erreur lors de la migration du profil:', error)
      } else {
        console.log('Profil migré')
      }
    } catch (error) {
      console.error('Erreur lors de la migration du profil:', error)
    }
  }

  private async migrateNotifications(notifications: any[], userId: string) {
    for (const notification of notifications) {
      try {
        const { error } = await supabase
          .from('notifications')
          .upsert({
            id: notification.id,
            user_id: userId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            related_id: notification.related_id,
            related_type: notification.related_type,
            is_read: notification.is_read || false,
            expires_at: notification.expires_at,
            created_at: notification.created_at || new Date().toISOString()
          })

        if (error) {
          console.error('Erreur lors de la migration de la notification:', error)
        } else {
          console.log('Notification migrée')
        }
      } catch (error) {
        console.error('Erreur lors de la migration de la notification:', error)
      }
    }
  }

  // Vérifier si les tables existent et sont accessibles
  async checkDatabaseConnection() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('count')
        .limit(1)

      if (error) {
        console.error('Erreur de connexion à la base de données:', error)
        return false
      }

      console.log('Connexion à la base de données réussie')
      return true
    } catch (error) {
      console.error('Erreur de connexion à la base de données:', error)
      return false
    }
  }

  // Nettoyer les données de test/développement
  async cleanupTestData(userId: string) {
    try {
      console.log('Nettoyage des données de test...')
      
      // Supprimer les données de test basées sur des patterns
      await supabase
        .from('team_members')
        .delete()
        .like('user_id', 'user_%')

      await supabase
        .from('messages')
        .delete()
        .like('sender_id', 'user_%')

      console.log('Nettoyage terminé')
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error)
    }
  }
}

export const supabaseManager = new SupabaseManager()