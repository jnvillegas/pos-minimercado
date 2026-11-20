import React from "react"
import { connection } from "next/server"
import { requirePlatformAdmin } from "@/lib/auth/platform-admin"
import { createClient } from "@/lib/supabase/server"
import { TeamView } from "./team-view"
import { PlatformAdminUser, PlatformAdminInvitation } from "./actions"

export const instant = false

export default async function AdminTeamPage() {
  await connection()
  const { user } = await requirePlatformAdmin()
  const supabase = await createClient()

  // 1. Fetch active platform admins using security definer RPC
  const { data: adminsData } = await supabase.rpc("list_platform_admins")

  // 2. Fetch pending invitations
  const { data: invitesData } = await supabase
    .from("platform_admin_invitations")
    .select("id, email, role, created_at, expires_at")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })

  const admins: PlatformAdminUser[] = (adminsData || []).map(
    (a: Record<string, unknown>) => ({
      id: String(a.id),
      user_id: String(a.user_id),
      email: String(a.email),
      role: (a.role as "superadmin" | "support") || "superadmin",
      created_at: String(a.created_at),
    })
  )

  const invitations: PlatformAdminInvitation[] = (invitesData || []).map(
    (inv: Record<string, unknown>) => ({
      id: String(inv.id),
      email: String(inv.email),
      role: (inv.role as "superadmin" | "support") || "support",
      created_at: String(inv.created_at),
      expires_at: String(inv.expires_at),
    })
  )

  return (
    <TeamView
      initialAdmins={admins}
      initialInvitations={invitations}
      currentUserId={user.id}
    />
  )
}
