import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export interface ChatRoom {
  id: string
  name: string
  description?: string
  team_id?: string
  is_private: boolean
  created_by: string
  created_at: string
  updated_at: string
  team?: {
    id: string
    name: string
  }
  unread_count?: number
}

export interface UseChatRoomsOptions {
  user: User | null
}

export function useChatRooms({ user }: UseChatRoomsOptions) {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // supabase is already imported from @/lib/supabase

  // Charger les salles de chat disponibles
  const loadRooms = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Récupérer les équipes de l'utilisateur
      const { data: teamMemberships } = await supabase
        .from('team_members')
        .select('team_id, teams(id, name)')
        .eq('user_id', user.id)

      const teamIds = teamMemberships?.map((tm: any) => tm.team_id) || []

      // Récupérer les salles de chat
      const { data: chatRooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          team:team_id (
            id,
            name
          )
        `)
        .or(`team_id.in.(${teamIds.join(',')}),and(is_private.eq.true,created_by.eq.${user.id})`)
        .order('updated_at', { ascending: false })

      if (roomsError) {
        console.error('Erreur lors du chargement des salles:', roomsError)
        setError('Impossible de charger les salles de chat')
        return
      }

      // Ajouter les salles d'équipe par défaut si elles n'existent pas
      const defaultRooms: ChatRoom[] = []
      
      if (teamMemberships) {
        for (const membership of teamMemberships) {
          const teamRoom = chatRooms?.find((room: any) => 
            room.id === `team_${membership.team_id}` && room.team_id === membership.team_id
          )
          
          if (!teamRoom && membership.teams) {
            // Créer la salle d'équipe par défaut
            const { data: newRoom } = await supabase
              .from('chat_rooms')
              .insert({
                id: `team_${membership.team_id}`,
                name: `Équipe ${(membership.teams as any)?.name || 'Sans nom'}`,
                description: `Chat général de l'équipe ${(membership.teams as any)?.name || 'Sans nom'}`,
                team_id: membership.team_id,
                is_private: false,
                created_by: user.id
              })
              .select(`
                *,
                team:team_id (
                  id,
                  name
                )
              `)
              .single()

            if (newRoom) {
              defaultRooms.push(newRoom)
            }
          }
        }
      }

      const allRooms = [...(chatRooms || []), ...defaultRooms]
      setRooms(allRooms)
    } catch (err) {
      console.error('Erreur lors du chargement des salles:', err)
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Créer une nouvelle salle de chat
  const createRoom = useCallback(async (
    name: string, 
    description?: string, 
    teamId?: string, 
    isPrivate: boolean = false
  ) => {
    if (!user) return null

    try {
      const roomId = isPrivate 
        ? `private_${user.id}_${Date.now()}`
        : teamId 
          ? `team_${teamId}_${Date.now()}`
          : `public_${Date.now()}`

      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
          id: roomId,
          name,
          description,
          team_id: teamId,
          is_private: isPrivate,
          created_by: user.id
        })
        .select(`
          *,
          team:team_id (
            id,
            name
          )
        `)
        .single()

      if (createError) {
        console.error('Erreur lors de la création de la salle:', createError)
        setError('Impossible de créer la salle de chat')
        return null
      }

      setRooms(prev => [newRoom, ...prev])
      return newRoom
    } catch (err) {
      console.error('Erreur lors de la création de la salle:', err)
      setError('Une erreur est survenue')
      return null
    }
  }, [user, supabase])

  // Supprimer une salle de chat
  const deleteRoom = useCallback(async (roomId: string) => {
    if (!user) return false

    try {
      const { error: deleteError } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId)
        .eq('created_by', user.id)

      if (deleteError) {
        console.error('Erreur lors de la suppression de la salle:', deleteError)
        setError('Impossible de supprimer la salle de chat')
        return false
      }

      setRooms(prev => prev.filter(room => room.id !== roomId))
      return true
    } catch (err) {
      console.error('Erreur lors de la suppression de la salle:', err)
      setError('Une erreur est survenue')
      return false
    }
  }, [user, supabase])

  // Écouter les changements de salles en temps réel
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('chat_rooms_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_rooms'
        },
        async (payload: any) => {
          const newRoom = payload.new as ChatRoom
          
          // Vérifier si l'utilisateur a accès à cette salle
          const hasAccess = newRoom.is_private 
            ? newRoom.created_by === user.id
            : newRoom.team_id && await checkTeamAccess(newRoom.team_id)

          if (hasAccess) {
            // Récupérer les informations de l'équipe si nécessaire
            let roomWithTeam = newRoom
            if (newRoom.team_id) {
              const { data: teamData } = await supabase
                .from('teams')
                .select('id, name')
                .eq('id', newRoom.team_id)
                .single()
              
              roomWithTeam = { ...newRoom, team: teamData || undefined }
            }

            setRooms(prev => {
              if (prev.some(room => room.id === newRoom.id)) {
                return prev
              }
              return [roomWithTeam, ...prev]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_rooms'
        },
        (payload: any) => {
          const deletedRoom = payload.old as ChatRoom
          setRooms(prev => prev.filter(room => room.id !== deletedRoom.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // Vérifier l'accès à une équipe
  const checkTeamAccess = useCallback(async (teamId: string) => {
    if (!user) return false

    const { data } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('team_id', teamId)
      .single()

    return !!data
  }, [user, supabase])

  // Charger les salles au montage du composant
  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  return {
    rooms,
    loading,
    error,
    createRoom,
    deleteRoom,
    refetch: loadRooms
  }
}