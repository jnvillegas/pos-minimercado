import React from "react"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { getActiveBusinessContext } from "@/lib/auth/business-context"

export const instant = false

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await connection()
  const { user, business, role, isPlatformAdmin, isSupportMode } =
    await getActiveBusinessContext()

  const supabase = await createClient()
  // Check if there is an active open cash shift for this business
  const { data: openShift } = await supabase
    .from("cash_shifts")
    .select("id")
    .eq("business_id", business.id)
    .eq("status", "open")
    .limit(1)
    .maybeSingle()

  return (
    <DashboardShell
      business={business}
      userEmail={user.email || ""}
      userName={user.user_metadata?.full_name || ""}
      role={role}
      isCashShiftOpen={Boolean(openShift)}
      isPlatformAdmin={isPlatformAdmin}
      isSupportMode={isSupportMode}
    >
      {children}
    </DashboardShell>
  )
}
