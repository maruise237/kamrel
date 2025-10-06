import { z } from 'zod'

// Schéma de validation pour les messages
export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'Le message ne peut pas être vide')
    .max(2000, 'Le message ne peut pas dépasser 2000 caractères')
    .trim(),
  room_id: z
    .string()
    .uuid('ID de salle invalide'),
})

export type MessageFormData = z.infer<typeof messageSchema>

// Schéma de validation pour la création de salles
export const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom de la salle est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .trim()
    .optional(),
  is_private: z
    .boolean()
    .default(false),
  team_id: z
    .string()
    .uuid('ID d\'équipe invalide')
    .optional(),
})

export type CreateRoomFormData = z.infer<typeof createRoomSchema>

// Schéma de validation pour la mise à jour de salles
export const updateRoomSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom de la salle est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .trim()
    .optional(),
  is_private: z
    .boolean()
    .optional(),
})

export type UpdateRoomFormData = z.infer<typeof updateRoomSchema>

// Schéma de validation pour les paramètres de chat
export const chatSettingsSchema = z.object({
  notifications_enabled: z
    .boolean()
    .default(true),
  sound_enabled: z
    .boolean()
    .default(true),
  auto_scroll: z
    .boolean()
    .default(true),
  theme: z
    .enum(['light', 'dark', 'system'])
    .default('system'),
})

export type ChatSettingsFormData = z.infer<typeof chatSettingsSchema>

// Schéma de validation pour la recherche de messages
export const searchMessagesSchema = z.object({
  query: z
    .string()
    .min(1, 'La requête de recherche ne peut pas être vide')
    .max(100, 'La requête ne peut pas dépasser 100 caractères')
    .trim(),
  room_id: z
    .string()
    .uuid('ID de salle invalide')
    .optional(),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(50),
  offset: z
    .number()
    .min(0)
    .default(0),
})

export type SearchMessagesFormData = z.infer<typeof searchMessagesSchema>

// Schéma de validation pour l'invitation d'utilisateurs à une salle
export const inviteUserSchema = z.object({
  room_id: z
    .string()
    .uuid('ID de salle invalide'),
  user_email: z
    .string()
    .email('Adresse email invalide'),
  role: z
    .enum(['member', 'admin'])
    .default('member'),
})

export type InviteUserFormData = z.infer<typeof inviteUserSchema>

// Utilitaires de validation
export const validateMessage = (data: unknown): MessageFormData => {
  return messageSchema.parse(data)
}

export const validateCreateRoom = (data: unknown): CreateRoomFormData => {
  return createRoomSchema.parse(data)
}

export const validateUpdateRoom = (data: unknown): UpdateRoomFormData => {
  return updateRoomSchema.parse(data)
}

export const validateChatSettings = (data: unknown): ChatSettingsFormData => {
  return chatSettingsSchema.parse(data)
}

export const validateSearchMessages = (data: unknown): SearchMessagesFormData => {
  return searchMessagesSchema.parse(data)
}

export const validateInviteUser = (data: unknown): InviteUserFormData => {
  return inviteUserSchema.parse(data)
}

// Constantes pour les limites
export const CHAT_LIMITS = {
  MESSAGE_MAX_LENGTH: 2000,
  ROOM_NAME_MAX_LENGTH: 100,
  ROOM_DESCRIPTION_MAX_LENGTH: 500,
  SEARCH_QUERY_MAX_LENGTH: 100,
  MAX_SEARCH_RESULTS: 100,
} as const