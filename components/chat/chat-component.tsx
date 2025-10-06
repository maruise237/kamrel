'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@/hooks/use-chat'
import { useChatRooms } from '@/hooks/use-chat-rooms'
import { ChatRoomList } from './chat-room-list'
import { ChatMessagesList } from './chat-messages-list'
import { ChatInput } from './chat-input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MessageCircle, 
  Users, 
  Settings, 
  AlertCircle,
  Loader2,
  Hash,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CreateRoomFormData } from '@/lib/validations/chat'

interface ChatComponentProps {
  className?: string
}

export function ChatComponent({ className }: ChatComponentProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>()
  const [error, setError] = useState<string>()

  // Hooks pour la gestion des rooms et messages
  const {
    rooms,
    teams,
    loading: roomsLoading,
    error: roomsError,
    createRoom,
    deleteRoom,
  } = useChatRooms()

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    sendMessage,
    deleteMessage,
  } = useChat(selectedRoomId)

  // Sélectionner automatiquement la première room disponible
  useEffect(() => {
    if (!selectedRoomId && rooms.length > 0 && !roomsLoading) {
      setSelectedRoomId(rooms[0].id)
    }
  }, [rooms, selectedRoomId, roomsLoading])

  // Gérer les erreurs
  useEffect(() => {
    if (roomsError || messagesError) {
      setError(roomsError || messagesError || 'Une erreur est survenue')
    } else {
      setError(undefined)
    }
  }, [roomsError, messagesError])

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId)
    setError(undefined)
  }

  const handleCreateRoom = async (data: CreateRoomFormData): Promise<boolean> => {
    try {
      setError(undefined)
      const success = await createRoom(data)
      if (!success) {
        setError('Impossible de créer la room. Veuillez réessayer.')
      }
      return success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la room'
      setError(errorMessage)
      return false
    }
  }

  const handleSendMessage = async (content: string): Promise<boolean> => {
    if (!selectedRoomId) {
      setError('Aucune room sélectionnée')
      return false
    }

    try {
      setError(undefined)
      const success = await sendMessage(content)
      if (!success) {
        setError('Impossible d\'envoyer le message. Veuillez réessayer.')
      }
      return success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'envoi du message'
      setError(errorMessage)
      return false
    }
  }

  const handleDeleteMessage = async (messageId: string): Promise<boolean> => {
    try {
      setError(undefined)
      const success = await deleteMessage(messageId)
      if (!success) {
        setError('Impossible de supprimer le message. Veuillez réessayer.')
      }
      return success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du message'
      setError(errorMessage)
      return false
    }
  }

  const selectedRoom = selectedRoomId ? rooms.find(r => r.id === selectedRoomId) : undefined
  const selectedTeam = selectedRoom?.team_id ? teams.find(t => t.id === selectedRoom.team_id) : undefined

  return (
    <div className={cn('flex h-full bg-background', className)}>
      {/* Sidebar - Liste des rooms */}
      <div className="w-80 border-r bg-muted/30">
        <ChatRoomList
          rooms={rooms}
          teams={teams}
          selectedRoomId={selectedRoomId}
          onRoomSelect={handleRoomSelect}
          onCreateRoom={handleCreateRoom}
          loading={roomsLoading}
        />
      </div>

      {/* Zone de chat principale */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Header de la room */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 border-b bg-background"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  selectedRoom.is_private ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                )}>
                  {selectedRoom.is_private ? <Lock className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold">{selectedRoom.name}</h1>
                    {selectedTeam && (
                      <Badge variant="secondary">{selectedTeam.name}</Badge>
                    )}
                    {selectedRoom.is_private && (
                      <Badge variant="outline">Privé</Badge>
                    )}
                  </div>
                  {selectedRoom.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedRoom.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{selectedRoom.member_count || 0} membres</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <ChatMessagesList
                messages={messages}
                loading={messagesLoading}
                onDeleteMessage={handleDeleteMessage}
              />
            </div>

            {/* Input de message */}
            <ChatInput
              roomId={selectedRoomId}
              onSendMessage={handleSendMessage}
              disabled={messagesLoading}
            />
          </>
        ) : (
          /* État vide - Aucune room sélectionnée */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <MessageCircle className="w-12 h-12 text-muted-foreground" />
            </div>
            
            <h2 className="text-2xl font-semibold mb-2">
              Bienvenue dans le Chat
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Sélectionnez une room dans la sidebar pour commencer à discuter avec votre équipe.
            </p>

            {rooms.length === 0 && !roomsLoading && (
              <div className="space-y-4">
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">
                  Aucune room disponible. Créez-en une pour commencer !
                </p>
              </div>
            )}

            {roomsLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Chargement des rooms...</span>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Affichage des erreurs */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(undefined)}
                  className="ml-2 h-auto p-1"
                >
                  ×
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}