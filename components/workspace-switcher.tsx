'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Building2, Crown, Shield, User, Check } from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase-client'
import { switchWorkspace, getCurrentWorkspaceId } from '@/lib/supabase'

interface Workspace {
  id: string
  name: string
  slug: string
  role: 'owner' | 'admin' | 'member'
}

export function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    try {
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Get current workspace ID
      const currentId = await getCurrentWorkspaceId()
      setCurrentWorkspaceId(currentId)

      // Get all workspaces user belongs to
      const { data: workspaceMembers } = await supabase
        .from('workspace_members')
        .select(`
          role,
          workspace:workspaces(id, name, slug)
        `)
        .eq('user_id', user.id)

      if (workspaceMembers) {
        const workspaceList = workspaceMembers.map(member => ({
          id: member.workspace.id,
          name: member.workspace.name,
          slug: member.workspace.slug,
          role: member.role
        }))
        setWorkspaces(workspaceList)
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    try {
      setIsLoading(true)
      await switchWorkspace(workspaceId)
      setCurrentWorkspaceId(workspaceId)
      
      // Refresh the page to update all workspace-dependent data
      router.refresh()
    } catch (error) {
      console.error('Error switching workspace:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />
      case 'admin':
        return <Shield className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId)

  if (isLoading || workspaces.length === 0) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Building2 className="h-4 w-4 mr-2" />
        Chargement...
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between">
          <div className="flex items-center">
            <Building2 className="h-4 w-4 mr-2" />
            <span className="truncate max-w-[150px]">
              {currentWorkspace?.name || 'Sélectionner un workspace'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel>Mes Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => handleWorkspaceSwitch(workspace.id)}
            className="flex items-center justify-between p-3 cursor-pointer"
          >
            <div className="flex items-center space-x-2 flex-1">
              <Building2 className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium text-sm">{workspace.name}</span>
                <span className="text-xs text-muted-foreground">@{workspace.slug}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={getRoleBadgeVariant(workspace.role)} 
                className="text-xs flex items-center space-x-1"
              >
                {getRoleIcon(workspace.role)}
                <span>{workspace.role}</span>
              </Badge>
              {workspace.id === currentWorkspaceId && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}