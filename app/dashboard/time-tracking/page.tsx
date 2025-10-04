"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { TimeTracker } from "@/components/time-tracking/time-tracker"
import { Card } from "@/components/ui/card"
import { Clock, TrendingUp, Calendar, Target } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@stackframe/stack"
import { KamrelFullScreenLoader, KamrelSkeleton } from "@/components/ui/kamrel-loader"
import { useGlobalLoading } from "@/components/layout/global-loading-provider"

export default function TimeTrackingPage() {
  const [todayHours, setTodayHours] = useState(0)
  const [weekHours, setWeekHours] = useState(0)
  const [monthHours, setMonthHours] = useState(0)
  const [totalHours, setTotalHours] = useState(0)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(false)

  const user = useUser()
  const { showLoader } = useGlobalLoading()

  useEffect(() => {
    if (user?.id) {
      loadTimeStats()
    }
  }, [user])

  const loadTimeStats = async () => {
    if (!user?.id) return

    setIsStatsLoading(true)
    try {
      // Add smooth transition delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      // Today's hours
      const { data: todayData } = await supabase
        .from('time_entries')
        .select('duration')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString().split('T')[0])

      // Week's hours
      const { data: weekData } = await supabase
        .from('time_entries')
        .select('duration')
        .eq('user_id', user.id)
        .gte('created_at', startOfWeek.toISOString())

      // Month's hours
      const { data: monthData } = await supabase
        .from('time_entries')
        .select('duration')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())

      // Total hours
      const { data: totalData } = await supabase
        .from('time_entries')
        .select('duration')
        .eq('user_id', user.id)

      setTodayHours(todayData?.reduce((acc, entry) => acc + entry.duration, 0) || 0)
      setWeekHours(weekData?.reduce((acc, entry) => acc + entry.duration, 0) || 0)
      setMonthHours(monthData?.reduce((acc, entry) => acc + entry.duration, 0) || 0)
      setTotalHours(totalData?.reduce((acc, entry) => acc + entry.duration, 0) || 0)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    } finally {
      setIsStatsLoading(false)
      setIsInitialLoading(false)
    }
  }

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  // Show full screen loader during initial loading
  if (isInitialLoading) {
    return <KamrelFullScreenLoader />
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">Suivi du temps</h1>
          <p className="text-muted-foreground mt-2 text-base">Suivez le temps passé sur vos tâches</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {isStatsLoading ? (
            // Show skeleton cards while loading stats
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <KamrelSkeleton className="h-4 w-20 mb-2" />
                    <KamrelSkeleton className="h-8 w-16" />
                  </div>
                  <KamrelSkeleton className="h-12 w-12 rounded-full" />
                </div>
              </Card>
            ))
          ) : (
            <>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium text-muted-foreground">Aujourd'hui</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{formatHours(todayHours)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium text-muted-foreground">Cette semaine</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{formatHours(weekHours)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-secondary" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium text-muted-foreground">Ce mois</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{formatHours(monthHours)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium text-muted-foreground">Total</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{formatHours(totalHours)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Target className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>

        {/* Time Tracker Component */}
        <TimeTracker onTimeUpdate={loadTimeStats} />

        {/* Time Entries Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Entrées de temps récentes</h2>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle entrée
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Projet</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tâche</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Durée</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Statut</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isEntriesLoading ? (
                  // Show skeleton rows while loading entries
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <KamrelSkeleton className="h-8 w-8 rounded-full" />
                          <KamrelSkeleton className="h-4 w-24" />
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <KamrelSkeleton className="h-4 w-32" />
                      </td>
                      <td className="py-4 px-4">
                        <KamrelSkeleton className="h-4 w-20" />
                      </td>
                      <td className="py-4 px-4">
                        <KamrelSkeleton className="h-4 w-16" />
                      </td>
                      <td className="py-4 px-4">
                        <KamrelSkeleton className="h-6 w-20 rounded-full" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <KamrelSkeleton className="h-8 w-8 rounded" />
                          <KamrelSkeleton className="h-8 w-8 rounded" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  timeEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{entry.project}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{entry.task}</td>
                      <td className="py-4 px-4 text-muted-foreground">{entry.date}</td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-foreground">{entry.duration}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          entry.status === 'Terminé' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
