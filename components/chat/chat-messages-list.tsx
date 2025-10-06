'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessageComponent } from './chat-message'
import { ChatMessage } from '@/hooks/use-chat'
import { User } from '@supabase/supabase-js'
import { Loader2, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatMessagesListProps {
  messages: ChatMessage[]
  currentUser: User | null
  loading?: boolean
  onDeleteMessage?: (messageId: string) => void
  className?: string
}

export function ChatMessagesList({ 
  messages, 
  currentUser, 
  loading = false,
  onDeleteMessage,
  className 
}: ChatMessagesListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      })
    }
  }, [messages])

  // Grouper les messages par utilisateur et par proximité temporelle
  const groupMessages = (messages: ChatMessage[]) => {
    const groups: ChatMessage[][] = []
    let currentGroup: ChatMessage[] = []
    
    messages.forEach((message, index) => {
      const prevMessage = messages[index - 1]
      const shouldGroup = prevMessage && 
        prevMessage.user_id === message.user_id &&
        new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() < 5 * 60 * 1000 // 5 minutes

      if (shouldGroup) {
        currentGroup.push(message)
      } else {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup])
        }
        currentGroup = [message]
      }
    })

    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }

    return groups
  }

  if (loading) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="h-8 w-8 text-muted-foreground" />
          </motion.div>
          <p className="text-sm text-muted-foreground">
            Chargement des messages...
          </p>
        </motion.div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          </motion.div>
          <h3 className="text-lg font-semibold mb-2">
            Aucun message pour le moment
          </h3>
          <p className="text-sm text-muted-foreground">
            Soyez le premier à envoyer un message dans cette conversation !
          </p>
        </motion.div>
      </div>
    )
  }

  const messageGroups = groupMessages(messages)

  return (
    <ScrollArea 
      ref={scrollAreaRef}
      className={cn('flex-1', className)}
    >
      <div className="p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messageGroups.map((group, groupIndex) => (
            <motion.div
              key={`group-${groupIndex}-${group[0].id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.3,
                delay: groupIndex * 0.05 
              }}
              className="space-y-1"
            >
              {group.map((message, messageIndex) => (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  isOwnMessage={message.user_id === currentUser?.id}
                  onDelete={onDeleteMessage}
                  showAvatar={messageIndex === 0} // Afficher l'avatar seulement pour le premier message du groupe
                />
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Élément invisible pour le scroll automatique */}
        <div ref={messagesEndRef} className="h-1" />
      </div>
    </ScrollArea>
  )
}