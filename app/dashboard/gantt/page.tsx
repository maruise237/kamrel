"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GanttChart } from "@/components/gantt/gantt-chart"

export default function GanttPage() {
  return (
    <DashboardLayout>
      <GanttChart />
    </DashboardLayout>
  )
}
