import React from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { cookies } from "next/headers"
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

  // Check if user is platform admin
  const { data: adminRecord } = await supabase
    .from("platform_admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  const isOwnerEmail =
    user.email === "dueño@minimercado.com" ||
    user.email === "jnvillegas85@gmail.com"

  const isPlatformAdmin = Boolean(adminRecord || isOwnerEmail)

  // Check support impersonation preference in cookie
  const cookieStore = await cookies()
  const supportBusinessId = cookieStore.get("support_target_business_id")?.value

  let business: {
    id: string
    name: string
    industry: string
    currency: string
  } | null = null
  let role = "owner"
  let isSupportMode = false

  if (supportBusinessId && isPlatformAdmin) {
    const { data: targetBusiness } = await supabase
      .from("businesses")
      .select("id, name, industry, currency")
      .eq("id", supportBusinessId)
      .maybeSingle()

    if (targetBusiness) {
      business = targetBusiness
      role = "support"
      isSupportMode = true
    }
  }

  if (!business) {
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
    business = Array.isArray(membership.businesses)
      ? membership.businesses[0]
      : membership.businesses
    role = membership.role
  }

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
      role={role}
      isCashShiftOpen={Boolean(openShift)}
      isPlatformAdmin={isPlatformAdmin}
      isSupportMode={isSupportMode}
    >
      {children}
    </DashboardShell>
  )
}
