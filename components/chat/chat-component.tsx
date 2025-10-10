'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@/hooks/use-chat'
import { useChatRooms } from '@/hooks/use-chat-rooms'
import { useAuthSync } from '@/hooks/use-auth-sync'
import { ChatRoomList } from './chat-room-list'
import { ChatMessagesList } from './chat-messages-list'
import { ChatInput } from './chat-input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  MessageCircle, 
  Users, 
  Settings, 
  AlertCircle,
  Loader2,
  Hash,
  Lock,
  Menu,
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CreateRoomFormData } from '@/lib/validations/chat'

interface ChatComponentProps {
  className?: string
}

export function ChatComponent({ className }: ChatComponentProps) {
  const router = useRouter()
  const [selectedRoomId, setSelectedRoomId] = useState<string>()
  const [error, setError] = useState<string>()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Utiliser le hook de synchronisation d'authentification
  const { user, supabaseUser, loading: authLoading, error: authError, isAuthenticated } = useAuthSync()

  // Hooks pour la gestion des rooms et messages
  const {
    rooms,
    teams,
    loading: roomsLoading,
    error: roomsError,
    createRoom,
    deleteRoom,
  } = useChatRooms({ user: supabaseUser })

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    sendMessage,
    deleteMessage,
  } = useChat({ roomId: selectedRoomId, user: supabaseUser })

  // Sélectionner automatiquement la première room disponible
  useEffect(() => {
    if (!selectedRoomId && rooms.length > 0 && !roomsLoading) {
      setSelectedRoomId(rooms[0].id)
    }
  }, [rooms, selectedRoomId, roomsLoading])

  // Gérer les erreurs
  useEffect(() => {
    if (authError || roomsError || messagesError) {
      setError(authError || roomsError || messagesError || 'Une erreur est survenue')
    } else {
      setError(undefined)
    }
  }, [authError, roomsError, messagesError])

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId)
    setIsMobileMenuOpen(false) // Fermer le menu mobile lors de la sélection
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
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-3 p-3 sm:p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Retour au Dashboard</span>
          <span className="sm:hidden">Retour</span>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <h1 className="text-lg sm:text-xl font-semibold">Chat</h1>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar Desktop - Liste des rooms */}
        <div className="hidden lg:block w-80 border-r bg-muted/30">
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
                {/* Bouton menu mobile */}
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="lg:hidden">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0">
                    <ChatRoomList
                      rooms={rooms}
                      teams={teams}
                      selectedRoomId={selectedRoomId}
                      onRoomSelect={handleRoomSelect}
                      onCreateRoom={handleCreateRoom}
                      loading={roomsLoading}
                    />
                  </SheetContent>
                </Sheet>

                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  selectedRoom.is_private ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                )}>
                  {selectedRoom.is_private ? <Lock className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold truncate">{selectedRoom.name}</h1>
                    {selectedTeam && (
                      <Badge variant="secondary" className="hidden sm:inline-flex">{selectedTeam.name}</Badge>
                    )}
                    {selectedRoom.is_private && (
                      <Badge variant="outline" className="hidden sm:inline-flex">Privé</Badge>
                    )}
                  </div>
                  {selectedRoom.description && (
                    <p className="text-sm text-muted-foreground truncate hidden sm:block">
                      {selectedRoom.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{selectedRoom.member_count || 0} membres</span>
                </div>
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
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
            className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center"
          >
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-muted flex items-center justify-center mb-4 sm:mb-6">
              <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground" />
            </div>
            
            <h2 className="text-xl sm:text-2xl font-semibold mb-2">
              Bienvenue dans le Chat
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md px-4">
              {/* Message différent selon la taille d'écran */}
              <span className="hidden sm:inline">
                Sélectionnez une room dans la sidebar pour commencer à discuter avec votre équipe.
              </span>
              <span className="sm:hidden">
                Appuyez sur le menu pour sélectionner une room et commencer à discuter.
              </span>
            </p>

            {/* Bouton pour ouvrir le menu mobile sur petits écrans */}
            <div className="lg:hidden mb-4">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Menu className="w-4 h-4" />
                    Voir les rooms
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <ChatRoomList
                    rooms={rooms}
                    teams={teams}
                    selectedRoomId={selectedRoomId}
                    onRoomSelect={handleRoomSelect}
                    onCreateRoom={handleCreateRoom}
                    loading={roomsLoading}
                  />
                </SheetContent>
              </Sheet>
            </div>

            {(rooms || []).length === 0 && !roomsLoading && (
              <div className="space-y-4">
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground px-4">
                  Aucune room disponible. Créez-en une pour commencer !
                </p>
              </div>
            )}

            {roomsLoading || authLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{authLoading ? 'Authentification...' : 'Chargement des rooms...'}</span>
              </div>
            )}

            {!isAuthenticated && !authLoading && (
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <AlertCircle className="w-8 h-8" />
                <p>Vous devez être connecté pour accéder au chat</p>
                <Button onClick={() => router.push('/sign-in')} variant="outline">
                  Se connecter
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
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