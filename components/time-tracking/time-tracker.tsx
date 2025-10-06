"use client"

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Play, Pause, Square, Clock, Plus, Edit, Trash2 } from 'lucide-react'
import { supabase, TimeEntry, Project, Task } from '@/lib/supabase'
import { useUser } from '@stackframe/stack'
import { useToast } from '@/hooks/use-toast'

interface TimeTrackerProps {
  projectId?: string
  taskId?: string
}

export function TimeTracker({ projectId, taskId }: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const user = useUser()
  const { toast } = useToast()

  const [newEntry, setNewEntry] = useState({
    project_id: projectId || '',
    task_id: taskId || '',
    description: '',
    hours: 0,
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadTimeEntries()
    loadProjects()
    if (projectId) {
      loadTasks(projectId)
    }
  }, [user, projectId])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - startTime.getTime()) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, startTime])

  const loadTimeEntries = async () => {
    if (!user?.id) return

    try {
      let query = supabase
        .from('time_entries')
        .select(`
          *,
          projects(name),
          tasks(title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      if (taskId) {
        query = query.eq('task_id', taskId)
      }

      const { data, error } = await query

      if (error) throw error
      setTimeEntries(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des entrées de temps:', error)
    }
  }

  const loadProjects = async () => {
    if (!user?.selectedTeam?.id) return

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('team_id', user.selectedTeam.id)
        .eq('status', 'active')

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error)
    }
  }

  const loadTasks = async (selectedProjectId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', selectedProjectId)
        .in('status', ['todo', 'in_progress'])

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error)
    }
  }

  const startTimer = () => {
    setIsRunning(true)
    setStartTime(new Date())
    setCurrentTime(0)
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const stopTimer = async () => {
    if (!startTime || !user?.id) return

    const hours = currentTime / 3600
    
    try {
      const { error } = await supabase
        .from('time_entries')
        .insert([{
          user_id: user.id,
          project_id: newEntry.project_id || null,
          task_id: newEntry.task_id || null,
          description: newEntry.description || 'Session de travail',
          hours: hours,
          date: new Date().toISOString().split('T')[0]
        }])

      if (error) throw error

      toast({
        title: "Succès",
        description: `Temps enregistré: ${formatTime(currentTime)}`,
      })

      setIsRunning(false)
      setCurrentTime(0)
      setStartTime(null)
      loadTimeEntries()
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du temps:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le temps",
        variant: "destructive",
      })
    }
  }

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('time_entries')
        .insert([{
          user_id: user.id,
          project_id: newEntry.project_id || null,
          task_id: newEntry.task_id || null,
          description: newEntry.description,
          hours: newEntry.hours,
          date: newEntry.date
        }])

      if (error) throw error

      toast({
        title: "Succès",
        description: "Entrée de temps créée avec succès",
      })

      setNewEntry({
        project_id: projectId || '',
        task_id: taskId || '',
        description: '',
        hours: 0,
        date: new Date().toISOString().split('T')[0]
      })
      setIsDialogOpen(false)
      loadTimeEntries()
    } catch (error) {
      console.error('Erreur lors de la création de l\'entrée:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer l'entrée de temps",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', entryId)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Entrée supprimée avec succès",
      })

      loadTimeEntries()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'entrée",
        variant: "destructive",
      })
    }
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) seconds = 0
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTotalHours = () => {
    const total = timeEntries.reduce((total, entry) => total + (entry.hours || 0), 0)
    return isNaN(total) ? '0.00' : total.toFixed(2)
  }

  return (
    <div className="space-y-6">
      {/* Timer */}
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="text-4xl font-mono font-bold">
            {formatTime(currentTime)}
          </div>
          <div className="flex justify-center gap-2">
            {!isRunning ? (
              <Button onClick={startTimer} className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Démarrer
              </Button>
            ) : (
              <>
                <Button onClick={pauseTimer} variant="outline" className="flex items-center gap-2">
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
                <Button onClick={stopTimer} variant="destructive" className="flex items-center gap-2">
                  <Square className="w-4 h-4" />
                  Arrêter
                </Button>
              </>
            )}
          </div>
          {isRunning && (
            <div className="space-y-2">
              <Input
                placeholder="Description de la tâche..."
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              />
              {!projectId && (
                <Select value={newEntry.project_id} onValueChange={(value) => {
                  setNewEntry({ ...newEntry, project_id: value, task_id: '' })
                  loadTasks(value)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!taskId && tasks.length > 0 && (
                <Select value={newEntry.task_id} onValueChange={(value) => setNewEntry({ ...newEntry, task_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une tâche (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">Total: {getTotalHours()} heures</span>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Ajouter une entrée
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une entrée de temps</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEntry} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                    placeholder="Décrivez le travail effectué"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hours">Heures</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.25"
                      min="0"
                      value={newEntry.hours}
                      onChange={(e) => setNewEntry({ ...newEntry, hours: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                {!projectId && (
                  <div className="space-y-2">
                    <Label htmlFor="project">Projet</Label>
                    <Select value={newEntry.project_id} onValueChange={(value) => {
                      setNewEntry({ ...newEntry, project_id: value, task_id: '' })
                      loadTasks(value)
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un projet" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {!taskId && tasks.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="task">Tâche (optionnel)</Label>
                    <Select value={newEntry.task_id} onValueChange={(value) => setNewEntry({ ...newEntry, task_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une tâche" />
                      </SelectTrigger>
                      <SelectContent>
                        {tasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Création..." : "Créer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Time Entries List */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Historique des temps</h3>
        <div className="space-y-2">
          {timeEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aucune entrée de temps</p>
          ) : (
            timeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{entry.description}</span>
                    {entry.projects && (
                      <span className="text-sm text-muted-foreground">
                        • {entry.projects.name}
                      </span>
                    )}
                    {entry.tasks && (
                      <span className="text-sm text-muted-foreground">
                        • {entry.tasks.title}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString()} • {entry.hours.toFixed(2)}h
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}