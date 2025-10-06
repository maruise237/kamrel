import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export interface ChatMessage {
  id: string
  user_id: string
  room_id: string
  content: string
  created_at: string
  updated_at: string
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
  roomId: string
  user: User | null
}

export function useChat({ roomId, user }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // supabase is already imported from @/lib/supabase

  // Charger les messages existants
  const loadMessages = useCallback(async () => {
    if (!roomId || !user) return

    try {
      setLoading(true)
      setError(null)

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
    } catch (err) {
      console.error('Erreur lors du chargement des messages:', err)
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }, [roomId, user, supabase])

  // Envoyer un message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !user || !roomId || sending) return

    try {
      setSending(true)
      setError(null)

      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          room_id: roomId,
          content: content.trim()
        })

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
  }, [user, roomId, sending, supabase])

  // Supprimer un message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) return

    try {
      const { error: deleteError } = await supabase
        .from('messages')
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

  // Écouter les nouveaux messages en temps réel
  useEffect(() => {
    if (!roomId || !user) return

    const channel = supabase
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload: any) => {
          const newMessage = payload.new as ChatMessage

          // Récupérer les informations utilisateur pour le nouveau message
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, user_metadata')
            .eq('id', newMessage.user_id)
            .single()

          const messageWithUser: ChatMessage = {
            ...newMessage,
            user: userData || undefined
          }

          setMessages(prev => {
            // Éviter les doublons
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev
            }
            return [...prev, messageWithUser]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload: any) => {
          const deletedMessage = payload.old as ChatMessage
          setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload: any) => {
          const updatedMessage = payload.new as ChatMessage

          // Récupérer les informations utilisateur pour le message mis à jour
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, user_metadata')
            .eq('id', updatedMessage.user_id)
            .single()

          const messageWithUser: ChatMessage = {
            ...updatedMessage,
            user: userData || undefined
          }

          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? messageWithUser : msg
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, user, supabase])

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