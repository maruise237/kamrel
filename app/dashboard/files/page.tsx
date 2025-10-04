"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { FileManager } from "@/components/file-management/file-manager"

export default function FilesPage() {
  return (
    <DashboardLayout>
      <FileManager showProjectFiles={true} />
    </DashboardLayout>
  )
}
