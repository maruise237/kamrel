"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, Filter, Calendar, User, MoreVertical, ArrowLeft, MessageSquare, Paperclip } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const initialTasks = [
  {
    id: 1,
    title: "Créer la maquette de la page d'accueil",
    status: "done",
    priority: "high",
    assignee: "Marie Kouassi",
    dueDate: "2025-01-15",
    comments: 3,
    attachments: 2,
  },
  {
    id: 2,
    title: "Développer l'API de paiement",
    status: "in-progress",
    priority: "high",
    assignee: "Jean Dupont",
    dueDate: "2025-01-20",
    comments: 5,
    attachments: 1,
  },
  {
    id: 3,
    title: "Rédiger la documentation technique",
    status: "todo",
    priority: "medium",
    assignee: "Fatou Diallo",
    dueDate: "2025-01-25",
    comments: 1,
    attachments: 0,
  },
  {
    id: 4,
    title: "Tests d'intégration",
    status: "todo",
    priority: "low",
    assignee: "Kofi Mensah",
    dueDate: "2025-02-01",
    comments: 0,
    attachments: 0,
  },
]

const statusConfig = {
  todo: { label: "À faire", color: "bg-muted text-muted-foreground" },
  "in-progress": { label: "En cours", color: "bg-secondary text-secondary-foreground" },
  done: { label: "Terminé", color: "bg-green-500 text-white" },
}

const priorityConfig = {
  low: { label: "Basse", color: "text-muted-foreground" },
  medium: { label: "Moyenne", color: "text-secondary" },
  high: { label: "Haute", color: "text-destructive" },
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [step, setStep] = useState(1)
  const [taskData, setTaskData] = useState({
    title: "",
    assignee: "",
    dueDate: "",
  })

  const handleNextStep = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleCreateTask = async () => {
    console.log("[v0] Creating task:", taskData)

    const newTask = {
      id: tasks.length + 1,
      title: taskData.title,
      status: "todo",
      priority: "medium",
      assignee:
        taskData.assignee === "marie"
          ? "Marie Kouassi"
          : taskData.assignee === "jean"
            ? "Jean Dupont"
            : taskData.assignee === "fatou"
              ? "Fatou Diallo"
              : "Kofi Mensah",
      dueDate: taskData.dueDate,
      comments: 0,
      attachments: 0,
    }

    setTasks([...tasks, newTask])
    setIsCreateDialogOpen(false)
    setStep(1)
    setTaskData({ title: "", assignee: "", dueDate: "" })
  }

  const handleToggleTask = (id: number) => {
    console.log("[v0] Toggling task:", id)
    setTasks(
      tasks.map((task) => (task.id === id ? { ...task, status: task.status === "done" ? "todo" : "done" } : task)),
    )
  }

  const handleDeleteTask = (id: number) => {
    console.log("[v0] Deleting task:", id)
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const handleDuplicateTask = (task: any) => {
    console.log("[v0] Duplicating task:", task)
    const newTask = {
      ...task,
      id: tasks.length + 1,
      title: `${task.title} (copie)`,
      status: "todo",
    }
    setTasks([...tasks, newTask])
  }

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Editing task:", editingTask)
    setTasks(tasks.map((t) => (t.id === editingTask.id ? editingTask : t)))
    setIsEditDialogOpen(false)
    setEditingTask(null)
  }

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/projects")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Site web e-commerce</h1>
            <p className="text-muted-foreground mt-1">{tasks.length} tâches • 5 membres • 75% complété</p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open)
              if (!open) {
                setStep(1)
                setTaskData({ title: "", assignee: "", dueDate: "" })
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Créer une tâche - Règle des 3 clics</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-2 w-16 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
                    />
                  ))}
                </div>

                {/* Step 1: Task title */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground">Étape 1/3</h3>
                      <p className="text-sm text-muted-foreground">Quel est le nom de la tâche ?</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-title">Titre de la tâche</Label>
                      <Input
                        id="task-title"
                        placeholder="Ex: Créer la page de connexion"
                        value={taskData.title}
                        onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Assignee */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground">Étape 2/3</h3>
                      <p className="text-sm text-muted-foreground">Qui va réaliser cette tâche ?</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-assignee">Assigner à</Label>
                      <Select
                        value={taskData.assignee}
                        onValueChange={(v) => setTaskData({ ...taskData, assignee: v })}
                      >
                        <SelectTrigger id="task-assignee">
                          <SelectValue placeholder="Sélectionner un membre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="marie">Marie Kouassi</SelectItem>
                          <SelectItem value="jean">Jean Dupont</SelectItem>
                          <SelectItem value="fatou">Fatou Diallo</SelectItem>
                          <SelectItem value="kofi">Kofi Mensah</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Step 3: Due date */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground">Étape 3/3</h3>
                      <p className="text-sm text-muted-foreground">Quelle est la date limite ?</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-duedate">Date limite</Label>
                      <Input
                        id="task-duedate"
                        type="date"
                        value={taskData.dueDate}
                        onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-between gap-3">
                {step > 1 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    Précédent
                  </Button>
                )}
                <div className="flex-1" />
                {step < 3 ? (
                  <Button onClick={handleNextStep} disabled={!taskData.title && step === 1}>
                    Suivant
                  </Button>
                ) : (
                  <Button onClick={handleCreateTask} disabled={!taskData.dueDate}>
                    Créer la tâche
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une tâche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filtrer
          </Button>
        </div>

        {/* Tasks List */}
        <Card className="p-6">
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <Checkbox checked={task.status === "done"} onCheckedChange={() => handleToggleTask(task.id)} />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3
                      className={`font-medium ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}
                    >
                      {task.title}
                    </h3>
                    <Badge className={statusConfig[task.status as keyof typeof statusConfig].color}>
                      {statusConfig[task.status as keyof typeof statusConfig].label}
                    </Badge>
                    <span
                      className={`text-xs font-medium ${priorityConfig[task.priority as keyof typeof priorityConfig].color}`}
                    >
                      {priorityConfig[task.priority as keyof typeof priorityConfig].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{task.assignee}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(task.dueDate).toLocaleDateString("fr-FR")}</span>
                    </div>
                    {task.comments > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{task.comments}</span>
                      </div>
                    )}
                    {task.attachments > 0 && (
                      <div className="flex items-center gap-1">
                        <Paperclip className="h-4 w-4" />
                        <span>{task.attachments}</span>
                      </div>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingTask(task)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateTask(task)}>Dupliquer</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTask(task.id)}>
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Modifier la tâche</DialogTitle>
            </DialogHeader>
            {editingTask && (
              <form onSubmit={handleEditTask}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-task-title">Titre</Label>
                    <Input
                      id="edit-task-title"
                      value={editingTask.title}
                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-task-status">Statut</Label>
                    <Select
                      value={editingTask.status}
                      onValueChange={(v) => setEditingTask({ ...editingTask, status: v })}
                    >
                      <SelectTrigger id="edit-task-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">À faire</SelectItem>
                        <SelectItem value="in-progress">En cours</SelectItem>
                        <SelectItem value="done">Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-task-priority">Priorité</Label>
                    <Select
                      value={editingTask.priority}
                      onValueChange={(v) => setEditingTask({ ...editingTask, priority: v })}
                    >
                      <SelectTrigger id="edit-task-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-task-duedate">Date limite</Label>
                    <Input
                      id="edit-task-duedate"
                      type="date"
                      value={editingTask.dueDate}
                      onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Enregistrer</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
