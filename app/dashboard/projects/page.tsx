"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, MoreVertical, Users, Calendar, CheckCircle2, MessageCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase, Project } from "@/lib/supabase"
import { useUser } from "@stackframe/stack"
import { useToast } from "@/hooks/use-toast"
import { ChatTrigger } from "@/components/chat/chat-component"
import { KamrelLoader, KamrelFullScreenLoader, KamrelCardSkeleton, KamrelSkeleton } from "@/components/ui/kamrel-loader"
import { useGlobalLoading } from "@/components/layout/global-loading-provider"

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isProjectsLoading, setIsProjectsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const user = useUser()
  const { toast } = useToast()
  const { showLoader } = useGlobalLoading()

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    status: "active" as "active" | "completed" | "on_hold" | "cancelled"
  })

  useEffect(() => {
    if (user?.selectedTeam?.id) {
      loadProjects()
    }
  }, [user])

  const loadProjects = async () => {
    if (!user?.selectedTeam?.id) return

    setIsProjectsLoading(true)
    try {
      // Add smooth transition delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('team_id', user.selectedTeam.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive",
      })
    } finally {
      setIsProjectsLoading(false)
      setIsInitialLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.selectedTeam?.id) return

    setIsCreating(true)
    try {
      // Add smooth transition delay
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: newProject.name,
          description: newProject.description,
          start_date: newProject.start_date,
          end_date: newProject.end_date,
          priority: newProject.priority,
          status: newProject.status,
          team_id: user.selectedTeam.id,
          created_by: user.id
        }])
        .select()

      if (error) throw error

      toast({
        title: "Succès",
        description: "Projet créé avec succès",
      })

      // Reset form
      setNewProject({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        priority: "medium",
        status: "active"
      })
      setIsCreateDialogOpen(false)
      
      // Reload projects data
      await loadProjects()
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject) return

    setIsCreating(true)
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: editingProject.name,
          description: editingProject.description,
          start_date: editingProject.start_date,
          end_date: editingProject.end_date,
          priority: editingProject.priority,
          status: editingProject.status
        })
        .eq('id', editingProject.id)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Projet mis à jour avec succès",
      })

      setIsEditDialogOpen(false)
      setEditingProject(null)
      loadProjects()
    } catch (error) {
      console.error('Erreur lors de la mise à jour du projet:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le projet",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Projet supprimé avec succès",
      })

      loadProjects()
    } catch (error) {
      console.error('Erreur lors de la suppression du projet:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet",
        variant: "destructive",
      })
    }
  }

  const handleProjectClick = (id: string) => {
    router.push(`/dashboard/projects/${id}`)
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600'
      case 'completed': return 'text-blue-600'
      case 'on_hold': return 'text-yellow-600'
      case 'cancelled': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  // Show full screen loader during initial loading
  if (isInitialLoading) {
    return <KamrelFullScreenLoader />
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Projets</h1>
            <p className="text-muted-foreground mt-2 text-base">Gérez tous vos projets en un seul endroit</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" size="lg">
                <Plus className="h-5 w-5" />
                Nouveau projet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl">Créer un nouveau projet</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateProject}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name" className="text-base">
                      Nom du projet
                    </Label>
                    <Input
                      id="project-name"
                      placeholder="Ex: Site web e-commerce"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      className="text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-description" className="text-base">
                      Description
                    </Label>
                    <Textarea
                      id="project-description"
                      placeholder="Décrivez votre projet..."
                      rows={3}
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      className="text-base"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date" className="text-base">
                        Date de début
                      </Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={newProject.start_date}
                        onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date" className="text-base">
                        Date de fin
                      </Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={newProject.end_date}
                        onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                        className="text-base"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-base">
                        Priorité
                      </Label>
                      <Select value={newProject.priority} onValueChange={(value) => setNewProject({ ...newProject, priority: value as any })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la priorité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Faible</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Élevée</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-base">
                        Statut
                      </Label>
                      <Select value={newProject.status} onValueChange={(value) => setNewProject({ ...newProject, status: value as any })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="on_hold">En attente</SelectItem>
                          <SelectItem value="completed">Terminé</SelectItem>
                          <SelectItem value="cancelled">Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <KamrelLoader className="mr-2" />
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
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher un projet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-base h-12"
          />
        </div>

        {/* Projects Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isProjectsLoading ? (
            // Show skeleton cards while loading
            Array.from({ length: 6 }).map((_, index) => (
              <KamrelCardSkeleton key={index} />
            ))
          ) : filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">Aucun projet trouvé</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Project Header */}
                  <div className="flex items-start justify-between">
                    <div
                      className={`h-14 w-14 rounded-lg ${project.color} flex items-center justify-center cursor-pointer`}
                      onClick={() => handleProjectClick(project.id)}
                    >
                      <span className="text-white font-bold text-2xl">{project.name.charAt(0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChatTrigger 
                        type="project" 
                        id={project.id} 
                        name={project.name}
                      >
                        <Button variant="ghost" size="icon">
                          <MessageCircle className="h-5 w-5" />
                        </Button>
                      </ChatTrigger>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-base">
                          <DropdownMenuItem onClick={() => handleProjectClick(project.id)}>
                            Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingProject(project)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProject(project.id)}>
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="cursor-pointer" onClick={() => handleProjectClick(project.id)}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-xl text-foreground">{project.name}</h3>
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(project.priority)}`} />
                    </div>
                    <p className="text-base text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-base text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-5 w-5" />
                      <span>{new Date(project.end_date || '').toLocaleDateString("fr-FR")}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${getStatusColor(project.status)}`}>
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="capitalize">{project.status}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    size="lg"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    Voir les tâches
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Modifier le projet</DialogTitle>
            </DialogHeader>
            {editingProject && (
              <form onSubmit={handleEditProject}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-project-name">Nom du projet</Label>
                    <Input
                      id="edit-project-name"
                      value={editingProject.name}
                      onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                      placeholder="Entrez le nom du projet"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-project-description">Description</Label>
                    <Textarea
                      id="edit-project-description"
                      rows={3}
                      value={editingProject.description || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                      placeholder="Décrivez le projet"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-start_date">Date de début</Label>
                      <Input
                        id="edit-start_date"
                        type="date"
                        value={editingProject.start_date || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-end_date">Date de fin</Label>
                      <Input
                        id="edit-end_date"
                        type="date"
                        value={editingProject.end_date || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-priority">Priorité</Label>
                      <Select value={editingProject.priority} onValueChange={(value) => setEditingProject({ ...editingProject, priority: value as any })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la priorité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Faible</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Élevée</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-status">Statut</Label>
                      <Select value={editingProject.status} onValueChange={(value) => setEditingProject({ ...editingProject, status: value as any })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="on_hold">En attente</SelectItem>
                          <SelectItem value="completed">Terminé</SelectItem>
                          <SelectItem value="cancelled">Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Mise à jour..." : "Mettre à jour"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
