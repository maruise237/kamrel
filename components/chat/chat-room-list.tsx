'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageCircle, 
  Plus, 
  Users, 
  Lock, 
  Globe, 
  Hash,
  Loader2,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createRoomSchema, type CreateRoomFormData } from '@/lib/validations/chat'
import type { ChatRoom, Team } from '@/types/chat'

interface ChatRoomListProps {
  rooms: ChatRoom[]
  teams: Team[]
  selectedRoomId?: string
  workspaceId?: string
  onRoomSelect: (roomId: string) => void
  onCreateRoom: (data: CreateRoomFormData) => Promise<boolean>
  loading?: boolean
  className?: string
}

export function ChatRoomList({
  rooms,
  teams,
  selectedRoomId,
  workspaceId,
  onRoomSelect,
  onCreateRoom,
  loading = false,
  className
}: ChatRoomListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const form = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
      description: '',
      is_private: false,
      team_id: undefined,
    },
  })

  const { handleSubmit, reset, formState: { isSubmitting } } = form

  const onSubmit = async (data: CreateRoomFormData) => {
    try {
      const success = await onCreateRoom(data)
      if (success) {
        reset()
        setIsCreateDialogOpen(false)
      }
    } catch (error) {
      console.error('Erreur lors de la création de la room:', error)
    }
  }

  // Séparer les rooms par type
  const teamRooms = (rooms || []).filter(room => room.team_id)
  const privateRooms = (rooms || []).filter(room => !room.team_id)

  const roomVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  }

  const RoomItem = ({ room }: { room: ChatRoom }) => {
    const isSelected = selectedRoomId === room.id
    const team = room.team_id ? teams.find(t => t.id === room.team_id) : null

    return (
      <motion.div
        variants={roomVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        layout
        className={cn(
          'group relative p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-200',
          'hover:bg-accent/50 border border-transparent',
          isSelected && 'bg-accent border-accent-foreground/20 shadow-sm'
        )}
        onClick={() => onRoomSelect(room.id)}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={cn(
            'flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center',
            room.is_private ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
          )}>
            {room.is_private ? <Lock className="w-3 h-3 sm:w-4 sm:h-4" /> : <Hash className="w-3 h-3 sm:w-4 sm:h-4" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <h4 className="font-medium text-xs sm:text-sm truncate">{room.name}</h4>
              {team && (
                <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                  {team.name}
                </Badge>
              )}
            </div>
            {room.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5 hidden sm:block">
                {room.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span className="hidden sm:inline">{room.member_count || 0}</span>
            <span className="sm:hidden">{room.member_count || 0}</span>
          </div>
        </div>

        {/* Indicateur de sélection */}
        {isSelected && (
          <motion.div
            layoutId="selectedRoom"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r"
          />
        )}
      </motion.div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <h2 className="font-semibold text-sm sm:text-base">Chat Rooms</h2>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="text-xs sm:text-sm">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Nouveau</span>
              <span className="sm:hidden">+</span>
            </Button>
          </DialogTrigger>
          <DialogContent key="chat-room-create-dialog" className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle room</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la room</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Général, Développement..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Décrivez le but de cette room..."
                          className="resize-none"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="team_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Équipe (optionnel)</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          // Si "no-team" est sélectionné, on passe undefined
                          field.onChange(value === "no-team" ? undefined : value)
                        }} 
                        value={field.value || "no-team"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une équipe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no-team">Aucune équipe</SelectItem>
                          {(teams || []).map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_private"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Room privée</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Seuls les membres invités peuvent rejoindre
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Créer
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Room List */}
      <ScrollArea className="flex-1">
        <div className="p-2 sm:p-3 space-y-3 sm:space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {/* Team Rooms */}
              {teamRooms.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1 sm:space-y-2"
                >
                  <div className="flex items-center gap-2 px-2 py-1">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Équipes
                    </h3>
                  </div>
                  {teamRooms.map((room) => (
                    <RoomItem key={room.id} room={room} />
                  ))}
                </motion.div>
              )}

              {/* Private Rooms */}
              {privateRooms.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1 sm:space-y-2"
                >
                  <div className="flex items-center gap-2 px-2 py-1">
                    <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Général
                    </h3>
                  </div>
                  {privateRooms.map((room) => (
                    <RoomItem key={room.id} room={room} />
                  ))}
                </motion.div>
              )}

              {/* Empty State */}
              {(rooms || []).length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <MessageCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium text-muted-foreground mb-2">
                    Aucune room disponible
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Créez votre première room pour commencer à discuter
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Créer une room
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}