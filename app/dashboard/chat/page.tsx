'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@stackframe/stack'
import { localStorageManager, Message, TeamMember, Team } from '@/lib/local-storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Send, Users, MessageCircle, Circle, Search } from 'lucide-react'
import { toast } from 'sonner'
import { KamrelLoader, KamrelFullScreenLoader, KamrelListSkeleton, KamrelSkeleton } from '@/components/ui/kamrel-loader'

import { supabaseManager } from '@/lib/supabase-manager'

export default function ChatPage() {
  const user = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [activeTab, setActiveTab] = useState('general')
  const [isLoading, setIsLoading] = useState(true)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isMigrated, setIsMigrated] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (user) {
      initializeChat()
    }
  }, [user])

  const initializeChat = async () => {
    try {
      setIsLoading(true)
      
      // Migrer les données de chat si nécessaire
      if (!isMigrated && user?.selectedTeam?.id) {
        console.log('Migration des données de chat vers Supabase...')
        await supabaseManager.migrateFromLocalStorage(user.id, user.selectedTeam.id)
        setIsMigrated(true)
        console.log('Migration du chat terminée')
      }

      // Supprimer les utilisateurs fictifs au chargement
      localStorageManager.removeFakeUsers()
      
      // Charger les équipes et membres depuis Stack Auth
      await loadTeamAndMembers()
      
      // Charger les messages depuis Supabase
      await loadMessages()
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du chat:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTeamAndMembers = async () => {
    if (!user) return

    // Charger ou créer une équipe par défaut
    let teams = localStorageManager.getTeams()
    let team = teams.find(t => t.owner_id === user.id)
    
    if (!team) {
      team = localStorageManager.addTeam({
        name: 'Mon Équipe',
        description: 'Équipe par défaut',
        owner_id: user.id
      })
    }
    
    setCurrentTeam(team)

    // Charger les vrais membres de l'équipe depuis Stack Auth
    if (user.selectedTeam) {
      try {
        const stackMembers = await user.selectedTeam.listUsers()
        
        // Convertir les membres Stack Auth vers notre format local
        const convertedMembers = stackMembers.map((stackMember: any) => ({
          id: stackMember.id,
          team_id: team.id,
          user_id: stackMember.id,
          role: stackMember.role || 'member',
          status: 'active',
          email: stackMember.primaryEmail || '',
          name: stackMember.displayName || 'Utilisateur',
          avatar_url: stackMember.profileImageUrl,
          initials: (stackMember.displayName || 'U').substring(0, 2).toUpperCase(),
          color: '#3B82F6',
          isOnline: true,
          joined_at: new Date().toISOString()
        }))

        // Synchroniser avec le stockage local
        const existingMembers = localStorageManager.getTeamMembers(team.id)
        
        // Supprimer les anciens membres qui ne sont plus dans l'équipe Stack
        existingMembers.forEach(existingMember => {
          const stillInTeam = convertedMembers.find(cm => cm.user_id === existingMember.user_id)
          if (!stillInTeam) {
            // Supprimer du stockage local (nous ajouterons cette méthode)
            localStorageManager.removeTeamMember(existingMember.id)
          }
        })

        // Ajouter ou mettre à jour les membres actuels
        convertedMembers.forEach(convertedMember => {
          const existingMember = existingMembers.find(em => em.user_id === convertedMember.user_id)
          if (!existingMember) {
            localStorageManager.addTeamMember(convertedMember)
          }
        })

        setTeamMembers(convertedMembers)
      } catch (error) {
        console.error('Erreur lors du chargement des membres de l\'équipe:', error)
        // Fallback: utiliser seulement l'utilisateur actuel
        const fallbackMembers = [{
          id: user.id,
          team_id: team.id,
          user_id: user.id,
          role: 'admin',
          status: 'active',
          email: user.primaryEmail || '',
          name: user.displayName || 'Utilisateur',
          avatar_url: user.profileImageUrl,
          initials: (user.displayName || 'U').substring(0, 2).toUpperCase(),
          color: '#3B82F6',
          isOnline: true,
          joined_at: new Date().toISOString()
        }]
        setTeamMembers(fallbackMembers)
      }
    } else {
      // Pas d'équipe sélectionnée, utiliser seulement l'utilisateur actuel
      const soloMember = [{
        id: user.id,
        team_id: team.id,
        user_id: user.id,
        role: 'admin',
        status: 'active',
        email: user.primaryEmail || '',
        name: user.displayName || 'Utilisateur',
        avatar_url: user.profileImageUrl,
        initials: (user.displayName || 'U').substring(0, 2).toUpperCase(),
        color: '#3B82F6',
        isOnline: true,
        joined_at: new Date().toISOString()
      }]
      setTeamMembers(soloMember)
    }
  }

  const loadMessages = () => {
    setIsMessagesLoading(true)
    try {
      const allMessages = localStorageManager.getMessages()
      // Ajouter un délai pour une transition fluide
      setTimeout(() => {
        setMessages(allMessages)
        setIsMessagesLoading(false)
      }, 300)
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
      setIsMessagesLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !currentTeam || isSending) return

    try {
      setIsSending(true)
      
      const messageData = {
        content: newMessage,
        sender_id: user.id,
        sender_name: user.displayName || 'Utilisateur',
        team_id: currentTeam.id,
        message_type: activeTab === 'general' ? 'general' as const : 'direct' as const,
        receiver_id: selectedMember?.user_id,
        receiver_name: selectedMember?.name,
        is_read: false
      }

      const savedMessage = localStorageManager.addMessage(messageData)
      
      // Mettre à jour l'état local avec animation
      setMessages(prev => [...prev, savedMessage])
      setNewMessage('')
      
      toast.success('Message envoyé avec succès!')
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      toast.error('Erreur lors de l\'envoi du message')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getFilteredMessages = () => {
    if (activeTab === 'general') {
      return messages.filter(msg => 
        msg.message_type === 'general' || 
        (msg.message_type === 'team' && msg.team_id === currentTeam?.id)
      )
    } else {
      return messages.filter(msg => 
        msg.message_type === 'direct' && 
        ((msg.sender_id === user?.id && msg.receiver_id === selectedMember?.user_id) ||
         (msg.sender_id === selectedMember?.user_id && msg.receiver_id === user?.id))
      )
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
          <p className="text-muted-foreground">Veuillez vous connecter pour accéder au chat.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <KamrelFullScreenLoader />
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar avec les membres */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            {currentTeam?.name || 'Mon Équipe'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Membres de l'équipe</h3>
            {teamMembers.length === 0 ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <KamrelSkeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              teamMembers.map((member) => (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedMember?.id === member.id 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => {
                  setSelectedMember(member)
                  setActiveTab('private')
                }}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar_url} />
                    <AvatarFallback style={{ backgroundColor: member.color }}>
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <Circle 
                    className={`absolute -bottom-1 -right-1 h-4 w-4 ${
                      member.isOnline ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{member.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                </div>
                <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                  {member.role}
                </Badge>
              </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Zone de chat principale */}
      <div className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b p-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat Général
              </TabsTrigger>
              <TabsTrigger value="private" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Messages Privés
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="flex-1 flex flex-col m-0">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Chat Général - {currentTeam?.name}</h3>
              <p className="text-sm text-muted-foreground">
                Visible par tous les membres de l'équipe
              </p>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {isMessagesLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <KamrelListSkeleton key={i} />
                    ))}
                  </div>
                ) : getFilteredMessages().length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Aucun message</h3>
                    <p className="text-sm text-muted-foreground">
                      Soyez le premier à envoyer un message dans ce chat
                    </p>
                  </div>
                ) : (
                  getFilteredMessages().map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {(message.sender_name || 'U').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.sender_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="private" className="flex-1 flex flex-col m-0">
            <div className="p-4 border-b">
              {selectedMember ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedMember.avatar_url} />
                    <AvatarFallback style={{ backgroundColor: selectedMember.color }}>
                      {selectedMember.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">Conversation avec {selectedMember.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.isOnline ? 'En ligne' : 'Hors ligne'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Sélectionnez un membre</h3>
                  <p className="text-sm text-muted-foreground">
                    Choisissez un membre de l'équipe pour commencer une conversation privée
                  </p>
                </div>
              )}
            </div>
            
            {selectedMember && (
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {isMessagesLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <KamrelListSkeleton key={i} />
                      ))}
                    </div>
                  ) : getFilteredMessages().length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Aucun message privé</h3>
                      <p className="text-sm text-muted-foreground">
                        Commencez une conversation avec {selectedMember.name}
                      </p>
                    </div>
                  ) : (
                    getFilteredMessages().map((message) => (
                      <div key={message.id} className={`flex gap-3 ${
                        message.sender_id === user.id ? 'flex-row-reverse' : ''
                      }`}>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {(message.sender_name || 'U').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 max-w-xs ${
                          message.sender_id === user.id ? 'text-right' : ''
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{message.sender_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className={`p-3 rounded-lg ${
                            message.sender_id === user.id 
                              ? 'bg-primary text-primary-foreground ml-auto' 
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {/* Zone de saisie */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                activeTab === 'general' 
                  ? 'Tapez votre message...' 
                  : selectedMember 
                    ? `Message à ${selectedMember.name}...`
                    : 'Sélectionnez un membre pour envoyer un message privé'
              }
              disabled={activeTab === 'private' && !selectedMember}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || (activeTab === 'private' && !selectedMember) || isSending}
              size="icon"
            >
              {isSending ? (
                <KamrelLoader size="sm" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}