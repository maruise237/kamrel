// Système de stockage local comme alternative à Supabase
export interface LocalStorageData {
  messages: Message[]
  userPreferences: UserPreferences | null
  teams: Team[]
  teamMembers: TeamMember[]
  projects: Project[]
  tasks: Task[]
  notifications: Notification[]
  userProfile: UserProfile | null
}

export interface Message {
  id: string
  content: string
  sender_id: string
  sender_name: string
  receiver_id?: string
  receiver_name?: string
  team_id?: string
  project_id?: string
  message_type: 'direct' | 'team' | 'project' | 'general'
  created_at: string
  updated_at: string
  is_read: boolean
}

export interface UserPreferences {
  id: string
  user_id: string
  language?: string
  timezone?: string
  theme?: string
  email_notifications: boolean
  push_notifications: boolean
  weekly_reports: boolean
  project_updates: boolean
  task_assignments: boolean
  team_invitations: boolean
  deadline_reminders: boolean
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  owner_id: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'admin' | 'member' | 'viewer'
  status: 'active' | 'inactive' | 'pending'
  joined_at: string
  email: string
  name: string
  avatar_url?: string
  initials?: string
  color?: string
  isOnline?: boolean
}

export interface Project {
  id: string
  name: string
  description?: string
  team_id: string
  status: 'active' | 'completed' | 'on_hold' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface Task {
  id: string
  title: string
  description?: string
  project_id: string
  assigned_to?: string
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  created_at: string
  updated_at: string
  created_by: string
  estimated_hours?: number
  actual_hours?: number
}

export interface UserProfile {
  id: string
  user_id: string
  name?: string
  email?: string
  company?: string
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  related_id?: string
  related_type?: string
  is_read: boolean
  created_at: string
  expires_at?: string
}

class LocalStorageManager {
  private storageKey = 'skiper-app-data'

  // Initialiser les données par défaut
  private getDefaultData(): LocalStorageData {
    return {
      messages: [],
      userPreferences: null,
      teams: [],
      teamMembers: [],
      projects: [],
      tasks: [],
      notifications: [],
      userProfile: null
    }
  }

  // Récupérer toutes les données
  getData(): LocalStorageData {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : this.getDefaultData()
    } catch (error) {
      console.error('Erreur lors de la lecture du localStorage:', error)
      return this.getDefaultData()
    }
  }

  // Sauvegarder toutes les données
  saveData(data: LocalStorageData): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde dans localStorage:', error)
    }
  }

  // Messages
  getMessages(): Message[] {
    return this.getData().messages
  }

  addMessage(message: Omit<Message, 'id' | 'created_at' | 'updated_at'>): Message {
    const data = this.getData()
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    data.messages.push(newMessage)
    this.saveData(data)
    return newMessage
  }

  // Préférences utilisateur
  getUserPreferences(userId: string): UserPreferences | null {
    const data = this.getData()
    return data.userPreferences?.user_id === userId ? data.userPreferences : null
  }

  saveUserPreferences(preferences: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>): UserPreferences {
    const data = this.getData()
    const newPreferences: UserPreferences = {
      ...preferences,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    data.userPreferences = newPreferences
    this.saveData(data)
    return newPreferences
  }

  // Équipes
  getTeams(): Team[] {
    return this.getData().teams
  }

  addTeam(team: Omit<Team, 'id' | 'created_at' | 'updated_at'>): Team {
    const data = this.getData()
    const newTeam: Team = {
      ...team,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    data.teams.push(newTeam)
    this.saveData(data)
    return newTeam
  }

  // Membres d'équipe
  getTeamMembers(teamId?: string): TeamMember[] {
    const data = this.getData()
    return teamId 
      ? data.teamMembers.filter(member => member.team_id === teamId)
      : data.teamMembers
  }

  addTeamMember(member: Omit<TeamMember, 'id' | 'joined_at'>): TeamMember {
    const data = this.getData()
    const newMember: TeamMember = {
      ...member,
      id: Date.now().toString(),
      joined_at: new Date().toISOString()
    }
    data.teamMembers.push(newMember)
    this.saveData(data)
    return newMember
  }

  removeTeamMember(memberId: string): void {
    const data = this.getData()
    data.teamMembers = data.teamMembers.filter(member => member.id !== memberId)
    this.saveData(data)
  }

  // Profil utilisateur
  getUserProfile(userId: string): UserProfile | null {
    const data = this.getData()
    return data.userProfile?.user_id === userId ? data.userProfile : null
  }

  saveUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): UserProfile {
    const data = this.getData()
    const newProfile: UserProfile = {
      ...profile,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    data.userProfile = newProfile
    this.saveData(data)
    return newProfile
  }

  // Notifications
  getNotifications(userId: string): Notification[] {
    const data = this.getData()
    return data.notifications.filter(notif => notif.user_id === userId)
  }

  addNotification(notification: Omit<Notification, 'id' | 'created_at'>): Notification {
    const data = this.getData()
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }
    data.notifications.push(newNotification)
    this.saveData(data)
    return newNotification
  }

  markNotificationAsRead(notificationId: string): void {
    const data = this.getData()
    const notification = data.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.is_read = true
      this.saveData(data)
    }
  }

  // Supprimer les utilisateurs fictifs
  removeFakeUsers(): void {
    const data = this.getData()
    // Supprimer les membres fictifs (user-2, user-3, etc.)
    data.teamMembers = data.teamMembers.filter(member => 
      !member.user_id.startsWith('user-') || member.user_id.length < 6
    )
    // Supprimer les messages des utilisateurs fictifs
    data.messages = data.messages.filter(message => 
      !message.sender_id.startsWith('user-') || message.sender_id.length < 6
    )
    this.saveData(data)
  }

  // Effacer toutes les données
  clearAllData(): void {
    localStorage.removeItem(this.storageKey)
  }
}

export { LocalStorageManager }
export const localStorageManager = new LocalStorageManager()