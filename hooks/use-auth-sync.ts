"use client"

import { useState, useEffect, useCallback } from 'react'
import { stackApp } from '@/stack/client'
import { AuthSync, type SyncedUser } from '@/lib/auth-sync'
import { supabase } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'

export interface UseAuthSyncReturn {
  user: SyncedUser | null
  supabaseUser: User | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  isAuthenticated: boolean
}

export function useAuthSync(): UseAuthSyncReturn {
  const [user, setUser] = useState<SyncedUser | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Obtenir l'utilisateur Stack Auth
  const stackUser = stackApp.useUser()

  // Fonction pour synchroniser l'utilisateur
  const syncUser = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!stackUser) {
        setUser(null)
        setSupabaseUser(null)
        return
      }

      console.log('Syncing user:', stackUser.id)

      // Initialiser la synchronisation
      const syncedUser = await AuthSync.initializeUserSync()
      
      if (!syncedUser) {
        throw new Error('Failed to sync user')
      }

      setUser(syncedUser)

      // Obtenir l'utilisateur Supabase correspondant
      const { data: { user: supabaseUserData }, error: supabaseError } = await supabase.auth.getUser()
      
      if (supabaseError) {
        console.error('Error getting Supabase user:', supabaseError)
        // Essayer de créer une session Supabase
        await AuthSync.createSupabaseSession(stackUser)
        
        // Réessayer d'obtenir l'utilisateur
        const { data: { user: retryUser } } = await supabase.auth.getUser()
        setSupabaseUser(retryUser)
      } else {
        setSupabaseUser(supabaseUserData)
      }

      console.log('User sync completed')
    } catch (err) {
      console.error('Error syncing user:', err)
      setError(err instanceof Error ? err.message : 'Failed to sync user')
    } finally {
      setLoading(false)
    }
  }, [stackUser])

  // Synchroniser l'utilisateur au montage et quand stackUser change
  useEffect(() => {
    syncUser()
  }, [syncUser])

  // Écouter les changements d'authentification Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Supabase auth state changed:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          setSupabaseUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          setSupabaseUser(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Fonction de refetch
  const refetch = useCallback(async () => {
    await syncUser()
  }, [syncUser])

  return {
    user,
    supabaseUser,
    loading,
    error,
    refetch,
    isAuthenticated: !!user && !!stackUser
  }
}