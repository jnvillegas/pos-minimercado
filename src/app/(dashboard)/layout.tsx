import React from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export const instant = false

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await connection()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch active business membership and business record
  const { data: members, error } = await supabase
    .from("business_members")
    .select(`
      role,
      businesses (
        id,
        name,
        industry,
        currency
      )
    `)
    .eq("user_id", user.id)
    .limit(1)

  if (error || !members || members.length === 0 || !members[0].businesses) {
    redirect("/onboarding")
  }

  const membership = members[0]
  // Extract business (Supabase returns joined relation)
  const business = Array.isArray(membership.businesses)
    ? membership.businesses[0]
    : membership.businesses

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
      role={membership.role}
      isCashShiftOpen={Boolean(openShift)}
    >
      {children}
    </DashboardShell>
  )
}
