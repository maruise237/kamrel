'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { messageSchema, type MessageFormData, CHAT_LIMITS } from '@/lib/validations/chat'

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<boolean>
  roomId: string
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function ChatInput({ 
  onSendMessage, 
  roomId,
  disabled = false, 
  placeholder = 'Tapez votre message...', 
  className 
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: '',
      room_id: roomId,
    },
  })

  const { watch, handleSubmit, reset, formState: { isSubmitting, errors } } = form
  const messageContent = watch('content')

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [messageContent])

  // Update room_id when it changes
  useEffect(() => {
    form.setValue('room_id', roomId)
  }, [roomId, form])

  const onSubmit = async (data: MessageFormData) => {
    if (disabled) return

    try {
      const success = await onSendMessage(data.content)
      if (success) {
        reset({ content: '', room_id: roomId })
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(onSubmit)()
    }
  }

  const characterCount = messageContent?.length || 0
  const maxLength = CHAT_LIMITS.MESSAGE_MAX_LENGTH
  const isNearLimit = characterCount > maxLength * 0.8

  return (
    <div className={cn('p-4 border-t bg-background', className)}>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        ref={textareaRef}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled || isSubmitting}
                        className="min-h-[40px] max-h-[120px] resize-none pr-12"
                        maxLength={maxLength}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Character count */}
              {isNearLimit && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-1 rounded"
                >
                  {characterCount}/{maxLength}
                </motion.div>
              )}
            </div>
            
            <Button
              type="submit"
              size="icon"
              disabled={!messageContent?.trim() || isSubmitting || disabled}
              className="h-10 w-10 shrink-0"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="h-4 w-4" />
                </motion.div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Error messages */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Character limit warning */}
          {characterCount > maxLength && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive"
            >
              Le message dépasse la limite de {maxLength} caractères
            </motion.p>
          )}
        </form>
      </Form>
    </div>
  )
}