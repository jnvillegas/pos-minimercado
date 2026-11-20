import React from "react"
import { connection } from "next/server"
import { requirePlatformAdmin } from "@/lib/auth/platform-admin"
import { createClient } from "@/lib/supabase/server"
import { AdminShell } from "@/components/admin/admin-shell"

export const instant = false

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await connection()
  const { user } = await requirePlatformAdmin()

  const supabase = await createClient()
  const { data: metrics } = await supabase.rpc("get_platform_metrics")

  return (
    <AdminShell
      userEmail={user.email || ""}
      totalBusinesses={metrics?.total_businesses || 0}
    >
      {children}
    </AdminShell>
  )
}
