'use client'

import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChatMessage } from '@/hooks/use-chat'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MoreVertical, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: ChatMessage
  isOwnMessage: boolean
  onDelete?: (messageId: string) => void
  showAvatar?: boolean
}

export function ChatMessageComponent({ 
  message, 
  isOwnMessage, 
  onDelete,
  showAvatar = true 
}: ChatMessageProps) {
  const getUserName = () => {
    if (message.user?.user_metadata?.full_name) {
      return message.user.user_metadata.full_name
    }
    if (message.user?.email) {
      return message.user.email.split('@')[0]
    }
    return 'Utilisateur'
  }

  const getUserInitials = () => {
    const name = getUserName()
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true, 
        locale: fr 
      })
    } catch {
      return 'maintenant'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex gap-3 p-3 hover:bg-muted/50 transition-colors group',
        isOwnMessage && 'flex-row-reverse'
      )}
    >
      {showAvatar && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage 
              src={message.user?.user_metadata?.avatar_url} 
              alt={getUserName()}
            />
            <AvatarFallback className="text-xs">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}

      <div className={cn(
        'flex-1 min-w-0',
        isOwnMessage && 'text-right'
      )}>
        <div className={cn(
          'flex items-center gap-2 mb-1',
          isOwnMessage && 'flex-row-reverse'
        )}>
          <span className="text-sm font-medium text-foreground">
            {isOwnMessage ? 'Vous' : getUserName()}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.created_at)}
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className={cn(
            'inline-block max-w-[70%] p-3 rounded-lg text-sm',
            isOwnMessage
              ? 'bg-primary text-primary-foreground ml-auto'
              : 'bg-muted text-foreground'
          )}
        >
          <p className="whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </motion.div>
      </div>

      {isOwnMessage && onDelete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.2 }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onDelete(message.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      )}
    </motion.div>
  )
}