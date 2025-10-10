import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client component client (for use in client components)
export const createSupabaseClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey)

// For backward compatibility
export const createClientComponentClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server component client (for use in server components)
export const createSupabaseServerClient = () => {
  // Import cookies dynamically to avoid issues with client components
  const { cookies } = require('next/headers')
  const cookieStore = cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

// Admin client (for server-side operations that require service role)
export const createSupabaseAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Types pour la base de données - Multi-tenant
export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
}

export interface Invite {
  id: string
  workspace_id: string
  email: string
  role: 'admin' | 'member'
  token: string
  invited_by: string
  accepted_by: string | null
  accepted_at: string | null
  expires_at: string
  created_at: string
}

// Legacy types - updated with workspace_id
export interface Team {
  id: string
  name: string
  description?: string
  workspace_id: string
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
  workspace_id: string
  team_id?: string
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
  workspace_id: string
  sender_id: string
  receiver_id?: string
  team_id?: string
  project_id?: string
  room_id?: string
  message_type: 'direct' | 'team' | 'project' | 'room'
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

// Utility functions for multi-tenant operations
export const getCurrentWorkspaceId = async () => {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.app_metadata?.workspace_id) {
    return null
  }
  
  return user.app_metadata.workspace_id as string
}

export const getUserWorkspaces = async () => {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  const { data: workspaces } = await supabase
    .from('workspace_members')
    .select(`
      role,
      workspace:workspaces(*)
    `)
    .eq('user_id', user.id)
  
  return workspaces || []
}

export const switchWorkspace = async (workspaceId: string) => {
  const supabase = createSupabaseClient()
  
  // Call Edge Function to update user metadata
  const { data, error } = await supabase.functions.invoke('update-user-metadata', {
    body: { workspace_id: workspaceId }
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  // Refresh the session to get updated JWT
  await supabase.auth.refreshSession()
  
  return data
}

export const createWorkspace = async (name: string, slug: string) => {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')
  
  const { data, error } = await supabase.rpc('create_workspace_with_owner', {
    workspace_name: name,
    workspace_slug: slug,
    owner_id: user.id
  })
  
  if (error) throw error
  
  return data
}