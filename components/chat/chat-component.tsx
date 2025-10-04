"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Users, MessageCircle, X } from "lucide-react"
import { supabase, Message } from "@/lib/supabase"
import { useUser } from "@stackframe/stack"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ChatComponentProps {
  teamId?: string
  projectId?: string
  receiverId?: string
  chatType: 'team' | 'project' | 'direct'
  isOpen: boolean
  onClose: () => void
}

export function ChatComponent({ 
  teamId, 
  projectId, 
  receiverId, 
  chatType, 
  isOpen, 
  onClose 
}: ChatComponentProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const user = useUser()
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen) {
      loadMessages()
      scrollToBottom()
    }
  }, [isOpen, teamId, projectId, receiverId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    if (!user?.id) return

    try {
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })

      if (chatType === 'team' && teamId) {
        query = query.eq('team_id', teamId).eq('message_type', 'team')
      } else if (chatType === 'project' && projectId) {
        query = query.eq('project_id', projectId).eq('message_type', 'project')
      } else if (chatType === 'direct' && receiverId) {
        query = query
          .eq('message_type', 'direct')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
      }

      const { data, error } = await query

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive",
      })
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return

    setIsLoading(true)
    try {
      const messageData = {
        content: newMessage.trim(),
        sender_id: user.id,
        message_type: chatType,
        team_id: chatType === 'team' ? teamId : null,
        project_id: chatType === 'project' ? projectId : null,
        receiver_id: chatType === 'direct' ? receiverId : null,
        is_read: false
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()

      if (error) throw error

      if (data) {
        setMessages(prev => [...prev, data[0]])
        setNewMessage("")
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getChatTitle = () => {
    switch (chatType) {
      case 'team':
        return 'Chat d\'équipe'
      case 'project':
        return 'Chat du projet'
      case 'direct':
        return 'Message direct'
      default:
        return 'Chat'
    }
  }

  const getChatIcon = () => {
    switch (chatType) {
      case 'team':
        return <Users className="h-4 w-4" />
      case 'project':
        return <MessageCircle className="h-4 w-4" />
      case 'direct':
        return <MessageCircle className="h-4 w-4" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  if (!isOpen) return null

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-96 flex flex-col shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {getChatIcon()}
          <h3 className="font-semibold text-sm">{getChatTitle()}</h3>
          <Badge variant="outline" className="text-xs">
            {messages.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.sender_id !== user?.id && (
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {message.sender_id.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">
                      {message.sender_id}
                    </span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Tapez votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={isLoading || !newMessage.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Composant pour ouvrir le chat
export function ChatTrigger({ 
  teamId, 
  projectId, 
  receiverId, 
  chatType 
}: Omit<ChatComponentProps, 'isOpen' | 'onClose'>) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        Chat
      </Button>
      
      <ChatComponent
        teamId={teamId}
        projectId={projectId}
        receiverId={receiverId}
        chatType={chatType}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}