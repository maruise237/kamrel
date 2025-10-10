'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserPlus, 
  Mail, 
  Loader2, 
  Trash2, 
  Crown,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  UserX,
  UserCheck,
  Shield,
  Settings
} from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase-client'

interface WorkspaceMember {
  id: string
  user_id: string
  role: 'admin' | 'member'
  status: 'active' | 'inactive' | 'mission_complete'
  joined_at: string
  profiles: {
    email: string
    full_name: string
  }
}

interface Invite {
  id: string
  email: string
  role: 'admin' | 'member'
  status: 'pending' | 'accepted' | 'expired'
  created_at: string
  expires_at: string
}

export default function TeamPage() {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    try {
      setIsLoadingData(true)
      
      // Fetch workspace members
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_members')
        .select(`
          id,
          user_id,
          role,
          status,
          joined_at,
          profiles!inner(email, full_name)
        `)
        .order('joined_at', { ascending: true })

      if (membersError) throw membersError
      setMembers(membersData || [])

      // Fetch pending invites
      const { data: invitesData, error: invitesError } = await supabase
        .from('invites')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (invitesError) throw invitesError
      setInvites(invitesData || [])

    } catch (error: any) {
      setError('Erreur lors du chargement des données de l\'équipe')
      console.error('Error fetching team data:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inviteEmail.trim()) {
      setError('Veuillez saisir une adresse email')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Call the send-invite Edge Function
      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: {
          email: inviteEmail.trim(),
          role: inviteRole
        }
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(`Invitation envoyée à ${inviteEmail}`)
      setInviteEmail('')
      
      // Refresh invites list
      await fetchTeamData()

    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'envoi de l\'invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'équipe ?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      setSuccess('Membre retiré de l\'équipe')
      await fetchTeamData()

    } catch (error: any) {
      setError('Erreur lors de la suppression du membre')
    }
  }

  const handleToggleMemberStatus = async (memberId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      if (newStatus === 'active') {
        const { error } = await supabase.rpc('reactivate_member', { member_id: memberId })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('workspace_members')
          .update({ status: newStatus })
          .eq('id', memberId)
        if (error) throw error
      }

      setSuccess(`Statut du membre ${newStatus === 'active' ? 'activé' : 'désactivé'}`)
      await fetchTeamData()

    } catch (error: any) {
      setError('Erreur lors de la modification du statut')
    }
  }

  const handleMissionComplete = async (memberId: string) => {
    if (!confirm('Marquer cette mission comme terminée ? Le membre sera temporairement désactivé.')) {
      return
    }

    try {
      const { error } = await supabase.rpc('complete_member_mission', { member_id: memberId })
      if (error) throw error

      setSuccess('Mission marquée comme terminée')
      await fetchTeamData()

    } catch (error: any) {
      setError('Erreur lors de la mise à jour de la mission')
    }
  }

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'member') => {
    if (!confirm(`Changer le rôle de ce membre en ${newRole === 'admin' ? 'administrateur' : 'membre'} ?`)) {
      return
    }

    try {
      const { error } = await supabase.rpc('change_member_role', { 
        member_id: memberId, 
        new_role: newRole 
      })
      if (error) throw error

      setSuccess('Rôle modifié avec succès')
      await fetchTeamData()

    } catch (error: any) {
      setError('Erreur lors de la modification du rôle')
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('invites')
        .delete()
        .eq('id', inviteId)

      if (error) throw error

      setSuccess('Invitation annulée')
      await fetchTeamData()

    } catch (error: any) {
      setError('Erreur lors de l\'annulation de l\'invitation')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
            <UserCheck className="w-3 h-3 mr-1" />
            Actif
          </Badge>
        )
      case 'inactive':
        return (
          <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            <UserX className="w-3 h-3 mr-1" />
            Inactif
          </Badge>
        )
      case 'mission_complete':
        return (
          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Mission terminée
          </Badge>
        )
      default:
        return null
    }
  }

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? <Crown className="w-4 h-4" /> : <Users className="w-4 h-4" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const filteredMembers = members.filter(member =>
    member.profiles.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.profiles.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoadingData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#e78a53]" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Gestion d'équipe</h1>
            <p className="text-zinc-400 mt-2">
              Gérez les membres de votre équipe et envoyez des invitations
            </p>
          </div>
        </div>

        {error && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <AlertDescription className="text-green-400">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Invite Form */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Inviter un nouveau membre
            </CardTitle>
            <CardDescription>
              Envoyez une invitation par email pour ajouter un membre à votre équipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="email" className="text-white">
                    Adresse email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nom@exemple.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="role" className="text-white">
                    Rôle
                  </Label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                    className="w-full h-10 px-3 rounded-md bg-zinc-800/50 border border-zinc-700 text-white"
                    disabled={isLoading}
                  >
                    <option value="member">Membre</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#e78a53] hover:bg-[#e78a53]/90 text-white"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer l'invitation
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-zinc-900/50 border-zinc-800 p-6">
            <p className="text-sm font-medium text-zinc-400">Total membres</p>
            <p className="text-2xl font-bold text-white mt-2">{members.length}</p>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800 p-6">
            <p className="text-sm font-medium text-zinc-400">Administrateurs</p>
            <p className="text-2xl font-bold text-white mt-2">
              {members.filter((m) => m.role === "admin").length}
            </p>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800 p-6">
            <p className="text-sm font-medium text-zinc-400">Invitations en attente</p>
            <p className="text-2xl font-bold text-white mt-2">{invites.length}</p>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800 p-6">
            <p className="text-sm font-medium text-zinc-400">Membres actifs</p>
            <p className="text-2xl font-bold text-white mt-2">
              {members.filter((m) => m.status === "active").length}
            </p>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Rechercher un membre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Members */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Membres de l'équipe ({filteredMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#e78a53]/20 rounded-full flex items-center justify-center">
                        <span className="text-[#e78a53] font-medium">
                          {member.profiles.full_name?.charAt(0) || member.profiles.email.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {member.profiles.full_name || member.profiles.email}
                        </p>
                        <p className="text-zinc-400 text-sm">{member.profiles.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={member.role === 'admin' ? 'default' : 'secondary'}
                        className="flex items-center gap-1"
                      >
                        {getRoleIcon(member.role)}
                        {member.role === 'admin' ? 'Admin' : 'Membre'}
                      </Badge>
                      {getStatusBadge(member.status || 'active')}
                      <div className="flex items-center gap-1">
                        {member.role !== 'admin' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleMemberStatus(member.id, member.status || 'active')}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                              title={member.status === 'active' ? 'Désactiver' : 'Activer'}
                            >
                              {member.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMissionComplete(member.id)}
                              className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                              title="Mission terminée"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleChangeRole(member.id, member.role === 'admin' ? 'member' : 'admin')}
                              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                              title="Changer le rôle"
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {filteredMembers.length === 0 && (
                  <p className="text-zinc-400 text-center py-4">
                    {searchQuery ? 'Aucun membre trouvé' : 'Aucun membre dans l\'équipe'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Invites */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Invitations en attente ({invites.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invites.map((invite) => (
                  <motion.div
                    key={invite.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        {getStatusIcon(invite.status)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{invite.email}</p>
                        <p className="text-zinc-400 text-sm">
                          Envoyée le {new Date(invite.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getRoleIcon(invite.role)}
                        {invite.role === 'admin' ? 'Admin' : 'Membre'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvite(invite.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
                {invites.length === 0 && (
                  <p className="text-zinc-400 text-center py-4">
                    Aucune invitation en attente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
