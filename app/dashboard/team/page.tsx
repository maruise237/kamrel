"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, Mail, MoreVertical, Crown, Shield, UserIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser } from "@stackframe/stack"
import { useToast } from "@/hooks/use-toast"

const roleConfig = {
  admin: { label: "Administrator", icon: Crown, color: "text-primary" },
  member: { label: "Member", icon: Shield, color: "text-secondary" },
  viewer: { label: "Viewer", icon: UserIcon, color: "text-muted-foreground" },
}

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [isLoading, setIsLoading] = useState(false)

  const user = useUser()
  const { toast } = useToast()
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  useEffect(() => {
    const loadTeamMembers = async () => {
      if (user?.selectedTeam) {
        const members = await user.selectedTeam.listUsers()
        setTeamMembers(members)
      }
    }
    loadTeamMembers()
  }, [user])

  const handleInviteSubmit = async () => {
    if (!inviteEmail || !user?.selectedTeam) return

    setIsLoading(true)
    try {
      await user.selectedTeam.inviteUser({
        email: inviteEmail,
        // @ts-ignore - Stack Auth team invitation
        role: inviteRole,
      })

      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${inviteEmail}`,
      })

      setInviteEmail("")
      setIsInviteDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!user?.selectedTeam) return

    try {
      await user.selectedTeam.removeUser(memberId)
      setTeamMembers(teamMembers.filter((m) => m.id !== memberId))

      toast({
        title: "Member removed",
        description: "The member has been removed from the team",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Team</h1>
            <p className="text-muted-foreground mt-1">Manage your team members</p>
          </div>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Invite member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Invite new member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="example@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger id="invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-2">Role permissions:</p>
                  <ul className="space-y-1 ml-4 list-disc">
                    <li>
                      <strong>Administrator:</strong> Full access, team management
                    </li>
                    <li>
                      <strong>Member:</strong> Create and manage projects and tasks
                    </li>
                    <li>
                      <strong>Viewer:</strong> View only, no modifications
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteSubmit} disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send invitation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Total members</p>
            <p className="text-2xl font-bold text-foreground mt-2">{teamMembers.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Administrators</p>
            <p className="text-2xl font-bold text-foreground mt-2">
              {teamMembers.filter((m) => m.role === "admin").length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Active members</p>
            <p className="text-2xl font-bold text-foreground mt-2">
              {teamMembers.filter((m) => m.status === "active").length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Tasks completed</p>
            <p className="text-2xl font-bold text-foreground mt-2">
              {teamMembers.reduce((acc, m) => acc + (m.tasksCompleted || 0), 0)}
            </p>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Team Members Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => {
            const roleData = roleConfig[member.role as keyof typeof roleConfig] || roleConfig.member
            const RoleIcon = roleData.icon
            return (
              <Card key={member.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Member Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.profileImageUrl} />
                        <AvatarFallback className={`${member.color} text-white font-semibold`}>
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View profile</DropdownMenuItem>
                        <DropdownMenuItem>Change role</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveMember(member.id)}>
                          Remove from team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Role Badge */}
                  <div className="flex items-center gap-2">
                    <RoleIcon className={`h-4 w-4 ${roleData.color}`} />
                    <span className="text-sm font-medium text-foreground">
                      {roleData.label}
                    </span>
                    <Badge variant="outline" className="ml-auto">
                      {member.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-sm text-muted-foreground">Projects</p>
                      <p className="text-xl font-bold text-foreground mt-1">{member.projects}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tasks</p>
                      <p className="text-xl font-bold text-foreground mt-1">{member.tasksCompleted}</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button variant="outline" className="w-full gap-2 bg-transparent">
                    <Mail className="h-4 w-4" />
                    Send message
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
