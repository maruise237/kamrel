import { supabase, Notification } from './supabase'

export interface CreateNotificationData {
  user_id: string
  title: string
  message: string
  type: 'project_update' | 'task_assignment' | 'team_invitation' | 'deadline_reminder' | 'system'
  related_id?: string
  related_type?: 'project' | 'task' | 'team'
  expires_at?: string
}

export class NotificationService {
  static async createNotification(data: CreateNotificationData): Promise<Notification | null> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert([data])
        .select()
        .single()

      if (error) throw error
      return notification
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error)
      return null
    }
  }

  static async createBulkNotifications(notifications: CreateNotificationData[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur lors de la création des notifications en lot:', error)
      return false
    }
  }

  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error)
      return false
    }
  }

  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error)
      return false
    }
  }

  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      return false
    }
  }

  static async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
      return []
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Erreur lors du comptage des notifications non lues:', error)
      return 0
    }
  }

  // Fonctions utilitaires pour créer des notifications spécifiques
  static async notifyTaskAssignment(assignedUserId: string, taskTitle: string, taskId: string, assignedBy: string) {
    return this.createNotification({
      user_id: assignedUserId,
      title: 'Nouvelle tâche assignée',
      message: `Vous avez été assigné(e) à la tâche "${taskTitle}" par ${assignedBy}`,
      type: 'task_assignment',
      related_id: taskId,
      related_type: 'task'
    })
  }

  static async notifyProjectUpdate(userIds: string[], projectName: string, projectId: string, updateMessage: string) {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title: 'Mise à jour du projet',
      message: `Le projet "${projectName}" a été mis à jour: ${updateMessage}`,
      type: 'project_update' as const,
      related_id: projectId,
      related_type: 'project' as const
    }))

    return this.createBulkNotifications(notifications)
  }

  static async notifyTeamInvitation(userId: string, teamName: string, teamId: string, invitedBy: string) {
    return this.createNotification({
      user_id: userId,
      title: 'Invitation à rejoindre une équipe',
      message: `${invitedBy} vous a invité(e) à rejoindre l'équipe "${teamName}"`,
      type: 'team_invitation',
      related_id: teamId,
      related_type: 'team'
    })
  }

  static async notifyDeadlineReminder(userId: string, taskTitle: string, taskId: string, dueDate: string) {
    return this.createNotification({
      user_id: userId,
      title: 'Rappel d\'échéance',
      message: `La tâche "${taskTitle}" arrive à échéance le ${new Date(dueDate).toLocaleDateString('fr-FR')}`,
      type: 'deadline_reminder',
      related_id: taskId,
      related_type: 'task',
      expires_at: dueDate
    })
  }
}