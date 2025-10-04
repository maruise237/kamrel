"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useUser } from "@stackframe/stack"
import { 
  Calendar,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from "lucide-react"

interface Task {
  id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  project_id: string
  assigned_to?: string
  progress: number
}

interface Project {
  id: string
  name: string
  color?: string
}

interface GanttChartProps {
  projectId?: string
  height?: number
}

export function GanttChart({ projectId, height = 600 }: GanttChartProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>(projectId || "all")
  const [viewMode, setViewMode] = useState<'days' | 'weeks' | 'months'>('weeks')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "todo" as const,
    priority: "medium" as const,
    progress: 0
  })

  const { toast } = useToast()
  const user = useUser()

  useEffect(() => {
    loadData()
  }, [user, selectedProject])

  const loadData = async () => {
    if (!user?.id) return

    try {
      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('created_by', user.id)

      if (projectsError) throw projectsError

      setProjects(projectsData || [])

      // Load tasks
      let tasksQuery = supabase
        .from('tasks')
        .select('*')
        .eq('created_by', user.id)
        .order('start_date', { ascending: true })

      if (selectedProject && selectedProject !== "all") {
        tasksQuery = tasksQuery.eq('project_id', selectedProject)
      }

      const { data: tasksData, error: tasksError } = await tasksQuery

      if (tasksError) throw tasksError

      setTasks(tasksData || [])
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async () => {
    if (!user?.id || !newTask.title || !newTask.start_date || !newTask.end_date) return

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          ...newTask,
          project_id: selectedProject,
          created_by: user.id,
          assigned_to: user.id
        })

      if (error) throw error

      toast({
        title: "Succès",
        description: "Tâche créée avec succès"
      })

      setNewTask({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        status: "todo",
        priority: "medium",
        progress: 0
      })
      setIsCreateDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche",
        variant: "destructive"
      })
    }
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Tâche mise à jour avec succès"
      })

      loadData()
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche",
        variant: "destructive"
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Tâche supprimée avec succès"
      })

      loadData()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche",
        variant: "destructive"
      })
    }
  }

  // Generate time periods based on view mode
  const timePeriods = useMemo(() => {
    const periods = []
    const start = new Date(currentDate)
    start.setDate(1) // Start of month

    if (viewMode === 'days') {
      for (let i = 0; i < 30; i++) {
        const date = new Date(start)
        date.setDate(start.getDate() + i)
        periods.push({
          date: date,
          label: date.getDate().toString(),
          fullLabel: date.toLocaleDateString()
        })
      }
    } else if (viewMode === 'weeks') {
      for (let i = 0; i < 12; i++) {
        const date = new Date(start)
        date.setDate(start.getDate() + (i * 7))
        periods.push({
          date: date,
          label: `S${Math.ceil(date.getDate() / 7)}`,
          fullLabel: `Semaine du ${date.toLocaleDateString()}`
        })
      }
    } else {
      for (let i = 0; i < 12; i++) {
        const date = new Date(start)
        date.setMonth(start.getMonth() + i)
        periods.push({
          date: date,
          label: date.toLocaleDateString('fr-FR', { month: 'short' }),
          fullLabel: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        })
      }
    }

    return periods
  }, [currentDate, viewMode])

  const getTaskPosition = (task: Task) => {
    const startDate = new Date(task.start_date)
    const endDate = new Date(task.end_date)
    const firstPeriod = timePeriods[0]?.date
    const lastPeriod = timePeriods[timePeriods.length - 1]?.date

    if (!firstPeriod || !lastPeriod) return { left: 0, width: 0 }

    const totalDuration = lastPeriod.getTime() - firstPeriod.getTime()
    const taskStart = Math.max(startDate.getTime() - firstPeriod.getTime(), 0)
    const taskDuration = Math.min(endDate.getTime() - Math.max(startDate.getTime(), firstPeriod.getTime()), totalDuration - taskStart)

    const left = (taskStart / totalDuration) * 100
    const width = (taskDuration / totalDuration) * 100

    return { left: Math.max(left, 0), width: Math.max(width, 1) }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      default: return 'bg-gray-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500'
      case 'medium': return 'border-yellow-500'
      default: return 'border-green-500'
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Chargement du diagramme de Gantt...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Diagramme de Gantt</h2>
          <p className="text-muted-foreground">
            Visualisez et gérez la planification de vos projets
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle tâche</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Titre de la tâche"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Description de la tâche"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Date de début</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newTask.start_date}
                      onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Date de fin</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newTask.end_date}
                      onChange={(e) => setNewTask({ ...newTask, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Statut</Label>
                    <Select value={newTask.status} onValueChange={(value: any) => setNewTask({ ...newTask, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">À faire</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priorité</Label>
                    <Select value={newTask.priority} onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateTask}>Créer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tous les projets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="days">Jours</SelectItem>
            <SelectItem value="weeks">Semaines</SelectItem>
            <SelectItem value="months">Mois</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newDate = new Date(currentDate)
              newDate.setMonth(newDate.getMonth() - 1)
              setCurrentDate(newDate)
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newDate = new Date(currentDate)
              newDate.setMonth(newDate.getMonth() + 1)
              setCurrentDate(newDate)
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Gantt Chart */}
      <Card className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune tâche trouvée</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre première tâche pour commencer à utiliser le diagramme de Gantt
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une tâche
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ height }}>
            {/* Timeline Header */}
            <div className="flex border-b border-border mb-4">
              <div className="w-64 flex-shrink-0 p-2 font-semibold">Tâches</div>
              <div className="flex-1 flex">
                {timePeriods.map((period, index) => (
                  <div
                    key={index}
                    className="flex-1 p-2 text-center text-sm border-l border-border"
                    title={period.fullLabel}
                  >
                    {period.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-2">
              {tasks.map((task) => {
                const position = getTaskPosition(task)
                return (
                  <div key={task.id} className="flex items-center group">
                    {/* Task Info */}
                    <div className="w-64 flex-shrink-0 p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" title={task.title}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {task.progress}%
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setEditingTask(task)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-600"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex-1 relative h-8 border border-border rounded">
                      <div
                        className={`absolute top-0 h-full rounded ${getStatusColor(task.status)} opacity-80`}
                        style={{
                          left: `${position.left}%`,
                          width: `${position.width}%`
                        }}
                        title={`${task.title} (${new Date(task.start_date).toLocaleDateString()} - ${new Date(task.end_date).toLocaleDateString()})`}
                      >
                        <div className="h-full flex items-center justify-center text-white text-xs font-medium px-2">
                          {position.width > 10 && task.title.length < 20 ? task.title : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Edit Task Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Modifier la tâche</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Titre</Label>
                <Input
                  id="edit-title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-progress">Progression (%)</Label>
                <Input
                  id="edit-progress"
                  type="number"
                  min="0"
                  max="100"
                  value={editingTask.progress}
                  onChange={(e) => setEditingTask({ ...editingTask, progress: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Statut</Label>
                <Select
                  value={editingTask.status}
                  onValueChange={(value: any) => setEditingTask({ ...editingTask, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">À faire</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingTask(null)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  handleUpdateTask(editingTask.id, {
                    title: editingTask.title,
                    progress: editingTask.progress,
                    status: editingTask.status
                  })
                  setEditingTask(null)
                }}
              >
                Sauvegarder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}