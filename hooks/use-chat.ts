import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'

export interface ChatMessage {
  id: string
  user_id: string
  room_id: string
  content: string
  created_at: string
  updated_at: string
  workspace_id?: string
  user?: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export interface UseChatOptions {
  roomId?: string
  user: User | null
  workspaceId?: string
}

export function useChat(options?: UseChatOptions) {
  const roomId = options?.roomId
  const user = options?.user || null
  const workspaceId = options?.workspaceId
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // supabase is already imported from @/lib/supabase

  // Charger les messages existants avec isolation workspace
  const loadMessages = useCallback(async () => {
    if (!roomId || !user) return

    try {
      setLoading(true)
      setError(null)

      // Use the new workspace-aware function if workspaceId is provided
      if (workspaceId) {
        const { data, error: fetchError } = await supabase.rpc('get_workspace_chat_messages', {
          room_uuid: roomId,
          workspace_uuid: workspaceId,
          message_limit: 100
        })

        if (fetchError) {
          console.error('Erreur lors du chargement des messages:', fetchError)
          setError('Impossible de charger les messages')
          return
        }

        // Transform the data to match ChatMessage interface
        const transformedMessages: ChatMessage[] = (data || []).map((msg: any) => ({
          id: msg.message_id,
          user_id: msg.user_id,
          room_id: msg.room_id,
          content: msg.content,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          workspace_id: workspaceId,
          user: {
            id: msg.user_id,
            email: msg.user_email,
            user_metadata: {
              full_name: msg.user_full_name
            }
          }
        }))

        setMessages(transformedMessages)
      } else {
        // Fallback to direct query for backward compatibility
        const { data, error: fetchError } = await supabase
          .from('chat_messages')
          .select(`
            *,
            user:user_id (
              id,
              email,
              user_metadata
            )
          `)
          .eq('room_id', roomId)
          .order('created_at', { ascending: true })
          .limit(100)

        if (fetchError) {
          console.error('Erreur lors du chargement des messages:', fetchError)
          setError('Impossible de charger les messages')
          return
        }

        setMessages(data || [])
      }
    } catch (err) {
      console.error('Erreur lors du chargement des messages:', err)
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }, [roomId, user, workspaceId])

  // Envoyer un message avec workspace isolation
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !user || !roomId || sending) return

    try {
      setSending(true)
      setError(null)

      const messageData: any = {
        user_id: user.id,
        room_id: roomId,
        content: content.trim()
      }

      // Add workspace_id if provided
      if (workspaceId) {
        messageData.workspace_id = workspaceId
      }

      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert(messageData)

      if (insertError) {
        console.error('Erreur lors de l\'envoi du message:', insertError)
        setError('Impossible d\'envoyer le message')
        return false
      }

      return true
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err)
      setError('Une erreur est survenue')
      return false
    } finally {
      setSending(false)
    }
  }, [user, roomId, sending, workspaceId])

  // Supprimer un message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) return

    try {
      const { error: deleteError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Erreur lors de la suppression du message:', deleteError)
        setError('Impossible de supprimer le message')
        return false
      }

      return true
    } catch (err) {
      console.error('Erreur lors de la suppression du message:', err)
      setError('Une erreur est survenue')
      return false
    }
  }, [user, supabase])

  // Configuration des subscriptions temps réel avec workspace isolation
  useEffect(() => {
    if (!roomId || !user) return

    let subscription: any

    const setupRealtimeSubscription = () => {
      // Create a channel for this specific room and workspace
      const channelName = workspaceId 
        ? `chat_messages:room_id=eq.${roomId}:workspace_id=eq.${workspaceId}`
        : `chat_messages:room_id=eq.${roomId}`

      subscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: workspaceId 
              ? `room_id=eq.${roomId} AND workspace_id=eq.${workspaceId}`
              : `room_id=eq.${roomId}`
          },
          async (payload) => {
            console.log('Nouveau message reçu:', payload)
            
            // Fetch user data for the new message
            const { data: userData } = await supabase.auth.getUser()
            if (userData.user) {
              const newMessage: ChatMessage = {
                ...payload.new as any,
                workspace_id: workspaceId,
                user: {
                  id: payload.new.user_id,
                  email: userData.user.email,
                  user_metadata: userData.user.user_metadata
                }
              }
              
              setMessages(prev => [...prev, newMessage])
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'chat_messages',
            filter: workspaceId 
              ? `room_id=eq.${roomId} AND workspace_id=eq.${workspaceId}`
              : `room_id=eq.${roomId}`
          },
          (payload) => {
            console.log('Message supprimé:', payload)
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
          }
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [roomId, user, workspaceId])

  // Charger les messages au montage du composant
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    deleteMessage,
    refetch: loadMessages
  }
}