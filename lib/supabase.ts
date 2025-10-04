import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types pour la base de données
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

export interface Message {
  id: string
  content: string
  sender_id: string
  receiver_id?: string
  team_id?: string
  project_id?: string
  message_type: 'direct' | 'team' | 'project'
  created_at: string
  updated_at: string
  is_read: boolean
}

export interface TimeEntry {
  id: string
  user_id: string
  project_id?: string
  task_id?: string
  description?: string
  start_time: string
  end_time?: string
  duration_minutes?: number
  created_at: string
  updated_at: string
}

export interface FileUpload {
  id: string
  name: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_by: string
  project_id?: string
  task_id?: string
  team_id?: string
  created_at: string
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