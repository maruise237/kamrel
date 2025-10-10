"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Bell, Lock, CreditCard, Globe, Upload, Camera } from "lucide-react"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { supabase, UserPreferences, UserProfile } from "@/lib/supabase"
import { NotificationService } from "@/lib/notifications"

export default function SettingsPage() {
  // Supabase Auth state
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    const supabaseClient = createClientComponentClient()
    
    // Get initial user
    supabaseClient.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setUserLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setUserLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])
  
  const [profile, setProfile] = useState({
    name: user?.user_metadata?.full_name || "Jean Dupont",
    email: user?.email || "jean@exemple.com",
    company: "KamTech",
    phone: "+225 07 00 00 00",
    avatar_url: user?.user_metadata?.avatar_url || "",
  })

  const [uploading, setUploading] = useState(false)

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
    projectUpdates: true,
    taskAssignments: true,
    teamInvitations: true,
    deadlineReminders: true
  })

  // Update profile state when user changes
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.user_metadata?.full_name || "Jean Dupont",
        email: user.email || "jean@exemple.com",
        company: "KamTech",
        phone: "+225 07 00 00 00",
        avatar_url: user.user_metadata?.avatar_url || "",
      })
    }
  }, [user])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    // Vérifier le type et la taille du fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier image",
        variant: "destructive"
      })
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast({
        title: "Erreur", 
        description: "L'image ne doit pas dépasser 2MB",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    try {
      // Upload vers Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Mettre à jour le profil utilisateur
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))

      toast({
        title: "Succès",
        description: "Photo de profil mise à jour avec succès"
      })

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la photo de profil",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      // Sauvegarder le profil utilisateur
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          name: profile.name,
          company: profile.company,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      // Créer une notification de confirmation
      await NotificationService.createNotification(
        user.id,
        'Profil mis à jour',
        'Votre profil a été enregistré avec succès.',
        'system'
      )

      toast({
        title: "Succès",
        description: "Profil enregistré avec succès"
      })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast({
        title: "Erreur", 
        description: "Impossible d'enregistrer le profil",
        variant: "destructive"
      })
    }
  }

  const handleSaveNotifications = async () => {
    if (!user?.id) return

    try {
      // Sauvegarder les préférences de notifications dans user_preferences
      const userPreferences: Partial<UserPreferences> = {
        user_id: user.id,
        email_notifications: notifications.email,
        push_notifications: notifications.push,
        weekly_reports: notifications.weekly,
        project_updates: notifications.projectUpdates,
        task_assignments: notifications.taskAssignments,
        team_invitations: notifications.teamInvitations,
        deadline_reminders: notifications.deadlineReminders,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert(userPreferences)

      if (error) throw error

      // Créer une notification de confirmation
      await NotificationService.createNotification(
        user.id,
        'Préférences mises à jour',
        'Vos préférences de notification ont été enregistrées avec succès.',
        'system'
      )

      toast({
        title: "Succès",
        description: "Préférences de notification enregistrées"
      })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les préférences",
        variant: "destructive"
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground mt-1">Gérez vos préférences et votre compte</p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Facturation
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Globe className="h-4 w-4" />
              Préférences
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="p-6">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      {profile.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt="Photo de profil" />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                          {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? "Upload en cours..." : "Changer la photo"}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">JPG, PNG ou GIF. Max 2MB.</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Entreprise</Label>
                    <Input
                      id="company"
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit">Enregistrer les modifications</Button>
              </form>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Notifications par email</p>
                    <p className="text-sm text-muted-foreground">
                      Recevez des emails pour les mises à jour importantes
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Notifications push</p>
                    <p className="text-sm text-muted-foreground">Recevez des notifications dans votre navigateur</p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Rapport hebdomadaire</p>
                    <p className="text-sm text-muted-foreground">Recevez un résumé de vos projets chaque semaine</p>
                  </div>
                  <Switch
                    checked={notifications.weekly}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, weekly: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Mises à jour de projets</p>
                    <p className="text-sm text-muted-foreground">Notifications lors de changements dans vos projets</p>
                  </div>
                  <Switch
                    checked={notifications.projectUpdates}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, projectUpdates: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Assignation de tâches</p>
                    <p className="text-sm text-muted-foreground">Notifications quand une tâche vous est assignée</p>
                  </div>
                  <Switch
                    checked={notifications.taskAssignments}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, taskAssignments: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Invitations d'équipe</p>
                    <p className="text-sm text-muted-foreground">Notifications pour les invitations à rejoindre une équipe</p>
                  </div>
                  <Switch
                    checked={notifications.teamInvitations}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, teamInvitations: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Rappels d'échéances</p>
                    <p className="text-sm text-muted-foreground">Notifications avant les dates limites des tâches</p>
                  </div>
                  <Switch
                    checked={notifications.deadlineReminders}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, deadlineReminders: checked })}
                  />
                </div>

                <Button onClick={handleSaveNotifications}>Enregistrer les préférences</Button>
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Changer le mot de passe</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Mot de passe actuel</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nouveau mot de passe</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                    <Button>Mettre à jour le mot de passe</Button>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Authentification à deux facteurs</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ajoutez une couche de sécurité supplémentaire à votre compte
                  </p>
                  <Button variant="outline">Activer 2FA</Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Plan actuel</h3>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-accent">
                    <div>
                      <p className="font-medium text-foreground">Plan Professionnel</p>
                      <p className="text-sm text-muted-foreground">15 000 FCFA / mois</p>
                    </div>
                    <Button variant="outline">Changer de plan</Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Méthode de paiement</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">•••• •••• •••• 4242</p>
                          <p className="text-sm text-muted-foreground">Expire 12/25</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Modifier
                      </Button>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent">
                      Ajouter une méthode de paiement
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Input id="language" value="Français" readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Input id="timezone" value="Africa/Abidjan (GMT+0)" readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Format de date</Label>
                  <Input id="date-format" value="JJ/MM/AAAA" readOnly />
                </div>

                <Button>Enregistrer les préférences</Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
