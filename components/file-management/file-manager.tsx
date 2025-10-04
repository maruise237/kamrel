"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useUser } from "@stackframe/stack"
import { 
  Upload, 
  Download, 
  File, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  Trash2,
  Search,
  Filter,
  Eye,
  Share2
} from "lucide-react"

interface FileUpload {
  id: string
  filename: string
  original_name: string
  file_size: number
  file_type: string
  upload_date: string
  uploaded_by: string
  project_id?: string
  team_id?: string
  is_public: boolean
  download_count: number
}

interface FileManagerProps {
  projectId?: string
  teamId?: string
  showProjectFiles?: boolean
}

export function FileManager({ projectId, teamId, showProjectFiles = false }: FileManagerProps) {
  const [files, setFiles] = useState<FileUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [projects, setProjects] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { toast } = useToast()
  const user = useUser()

  useEffect(() => {
    loadFiles()
    if (showProjectFiles) {
      loadProjects()
    }
  }, [projectId, teamId, user])

  const loadFiles = async () => {
    if (!user?.id) return

    try {
      let query = supabase
        .from('file_uploads')
        .select('*')
        .eq('uploaded_by', user.id)
        .order('upload_date', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }
      if (teamId) {
        query = query.eq('team_id', teamId)
      }

      const { data, error } = await query

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les fichiers",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('created_by', user.id)

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    setUploading(true)

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `uploads/${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('file_uploads')
        .insert({
          filename: fileName,
          original_name: file.name,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id,
          project_id: selectedProject === "all" ? (projectId || null) : selectedProject,
          team_id: teamId,
          is_public: false,
          download_count: 0
        })

      if (dbError) throw dbError

      toast({
        title: "Succès",
        description: "Fichier uploadé avec succès"
      })

      loadFiles()
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'uploader le fichier",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDownload = async (file: FileUpload) => {
    try {
      const filePath = `uploads/${file.uploaded_by}/${file.filename}`
      
      const { data, error } = await supabase.storage
        .from('files')
        .download(filePath)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.original_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Update download count
      await supabase
        .from('file_uploads')
        .update({ download_count: file.download_count + 1 })
        .eq('id', file.id)

      loadFiles()
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', fileId)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Fichier supprimé avec succès"
      })

      loadFiles()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fichier",
        variant: "destructive"
      })
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5" />
    if (fileType.startsWith('video/')) return <Video className="w-5 h-5" />
    if (fileType.startsWith('audio/')) return <Music className="w-5 h-5" />
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-5 h-5" />
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.original_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || file.file_type.startsWith(filterType)
    return matchesSearch && matchesType
  })

  if (loading) {
    return <div className="flex justify-center p-8">Chargement des fichiers...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestion des fichiers</h2>
          <p className="text-muted-foreground">
            Uploadez, téléchargez et gérez vos fichiers
          </p>
        </div>
        
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            multiple={false}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Upload en cours..." : "Uploader un fichier"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher des fichiers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Type de fichier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Vidéos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="application">Documents</SelectItem>
          </SelectContent>
        </Select>

        {showProjectFiles && (
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sélectionner un projet" />
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
        )}
      </div>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <Card className="p-8 text-center">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun fichier trouvé</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterType !== "all" 
              ? "Aucun fichier ne correspond à vos critères de recherche"
              : "Commencez par uploader votre premier fichier"
            }
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getFileIcon(file.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={file.original_name}>
                      {file.original_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.file_size)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                <span>{new Date(file.upload_date).toLocaleDateString()}</span>
                <Badge variant="secondary">
                  {file.download_count} téléchargements
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(file)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Télécharger
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(file.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}