"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@stackframe/stack"
import { supabase } from "@/lib/supabase"
import { supabaseManager } from "@/lib/supabase-manager"
import { KamrelLoader, KamrelFullScreenLoader, KamrelCardSkeleton, KamrelSkeleton } from "@/components/ui/kamrel-loader"

export default function DashboardPage() {
  const router = useRouter()
  const user = useUser({ or: "redirect" })
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [stats, setStats] = useState({
    activeProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [isMigrated, setIsMigrated] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else {
      initializeDashboard()
    }
  }, [user, router])

  const initializeDashboard = async () => {
    try {
      setIsLoading(true)
      
      // Vérifier la connexion à la base de données
      const isConnected = await supabaseManager.checkDatabaseConnection()
      if (!isConnected) {
        console.error('Impossible de se connecter à la base de données')
        return
      }

      // Migrer les données du stockage local vers Supabase (une seule fois)
      if (!isMigrated && user?.selectedTeam?.id) {
        console.log('Migration des données vers Supabase...')
        await supabaseManager.migrateFromLocalStorage(user.id, user.selectedTeam.id)
        await supabaseManager.cleanupTestData(user.id)
        setIsMigrated(true)
        console.log('Migration terminée')
      }

      // Charger les données depuis Supabase
      await loadDashboardData()
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du tableau de bord:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDashboardData = async () => {
    if (!user?.selectedTeam?.id) {
      setIsLoading(false)
      return
    }

    try {
      setIsDataLoading(true)
      
      // Charger les projets récents avec animation
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('team_id', user.selectedTeam.id)
        .order('updated_at', { ascending: false })
        .limit(3)

      if (projectsError) throw projectsError

      // Charger les statistiques
      const { data: allProjects } = await supabase
        .from('projects')
        .select('id, status')
        .eq('team_id', user.selectedTeam.id)

      const { data: allTasks } = await supabase
        .from('tasks')
        .select('id, status, due_date')
        .in('project_id', allProjects?.map(p => p.id) || [])

      const activeProjects = allProjects?.filter(p => p.status === 'active').length || 0
      const activeTasks = allTasks?.filter(t => t.status === 'in_progress' || t.status === 'todo').length || 0
      const completedTasks = allTasks?.filter(t => t.status === 'completed').length || 0
      const overdueTasks = allTasks?.filter(t => 
        t.status !== 'completed' && 
        t.due_date && 
        new Date(t.due_date) < new Date()
      ).length || 0

      // Ajouter un délai pour une transition fluide
      await new Promise(resolve => setTimeout(resolve, 300))

      setRecentProjects(projects || [])
      setStats({
        activeProjects,
        activeTasks,
        completedTasks,
        overdueTasks
      })
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setIsDataLoading(false)
      setIsLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !user?.selectedTeam?.id) return

    try {
      setIsCreating(true)
      
      // Ensure team exists in Supabase before creating project
      console.log('Verifying team exists in Supabase...')
      const { data: teamExists, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('id', user.selectedTeam.id)
        .single()

      if (teamError || !teamExists) {
        console.log('Team not found in Supabase, syncing team first...')
        
        // Import TeamManager dynamically to avoid circular dependencies
        const { TeamManager } = await import('@/lib/team-manager')
        await TeamManager.ensureUserHasTeam(user)
        
        // Wait a bit for the team to be synced
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      // Créer le projet dans Supabase
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          name: newProjectName,
          description: newProjectDescription,
          team_id: user.selectedTeam.id,
          created_by: user.id,
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de la création du projet:', error)
        return
      }

      // Recharger les données du tableau de bord
      await loadDashboardData()
      
      // Réinitialiser le formulaire
      setNewProjectName("")
      setNewProjectDescription("")
      setIsCreateDialogOpen(false)
      console.log('Projet créé avec succès:', project)
      
      // Recharger les données
      await loadDashboardData()
      
      // Réinitialiser le formulaire
      setNewProjectName('')
      setNewProjectDescription('')
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`)
  }

  const getProjectColor = (index: number) => {
    const colors = ['bg-primary', 'bg-secondary', 'bg-green-500', 'bg-blue-500', 'bg-purple-500']
    return colors[index % colors.length]
  }

  if (!user) {
    return null
  }

  return (
    <>
      <KamrelFullScreenLoader 
        isLoading={isLoading} 
        text="Initialisation de KAMREL"
        subText="Configuration de votre espace de travail..."
      />
      
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in-50 duration-500">
          {/* Header */}
          <div className="flex items-center justify-between animate-in slide-in-from-top-4 duration-700">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Tableau de bord</h1>
              <p className="text-muted-foreground mt-2 text-base">Bienvenue sur KAMREL</p>
            </div>
            <Button 
              className="gap-2 transition-all duration-200 hover:scale-105" 
              size="lg" 
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={isDataLoading}
            >
              {isDataLoading ? (
                <KamrelLoader size="sm" showText={false} />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              Nouveau projet
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in slide-in-from-bottom-4 duration-700 delay-200">
            <Card className="p-6 transition-all duration-200 hover:shadow-lg hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-muted-foreground">Projets actifs</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {isDataLoading ? <KamrelSkeleton className="h-8 w-12" /> : stats.activeProjects}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6 transition-all duration-200 hover:shadow-lg hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-muted-foreground">Tâches en cours</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {isDataLoading ? <KamrelSkeleton className="h-8 w-12" /> : stats.activeTasks}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </Card>

            <Card className="p-6 transition-all duration-200 hover:shadow-lg hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-muted-foreground">Tâches terminées</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {isDataLoading ? <KamrelSkeleton className="h-8 w-12" /> : stats.completedTasks}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </Card>

            <Card className="p-6 transition-all duration-200 hover:shadow-lg hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-muted-foreground">En retard</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {isDataLoading ? <KamrelSkeleton className="h-8 w-12" /> : stats.overdueTasks}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Projects */}
          <Card className="p-6 animate-in slide-in-from-bottom-4 duration-700 delay-400">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Projets récents</h2>
            {isDataLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <KamrelCardSkeleton key={i} />
                ))}
              </div>
            ) : recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project, index) => (
                  <div
                    key={project.id}
                    onClick={() => handleProjectClick(project.id)}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div
                    className={`h-12 w-12 rounded-lg ${getProjectColor(index)} flex items-center justify-center text-white font-bold text-xl`}
                  >
                    {project.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground text-lg">{project.name}</h3>
                    <p className="text-base text-muted-foreground">{project.description || 'Aucune description'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {project.status === 'active' ? 'Actif' : project.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucun projet récent</p>
              <Button 
                className="mt-4" 
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Créer votre premier projet
              </Button>
            </div>
          )}
        </Card>
      </div>
      </DashboardLayout>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="animate-in fade-in-50 zoom-in-95 duration-300">
          <DialogHeader>
            <DialogTitle className="text-xl">Créer un nouveau projet</DialogTitle>
            <DialogDescription className="text-base">
              Ajoutez un nouveau projet à votre espace de travail KAMREL
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateProject(); }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">
                  Nom du projet
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Site web e-commerce"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="text-base transition-all duration-200 focus:scale-105"
                  required
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre projet..."
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="text-base transition-all duration-200 focus:scale-105"
                  rows={3}
                  disabled={isCreating}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating || !newProjectName.trim()}
                className="gap-2 transition-all duration-200"
              >
                {isCreating ? (
                  <>
                    <KamrelLoader size="sm" showText={false} />
                    Création...
                  </>
                ) : (
                  "Créer le projet"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
