import React from "react"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireOwner } from "@/lib/auth/rbac"
import { getActiveBusinessContext } from "@/lib/auth/business-context"
import {
  TeamManager,
  MemberRecord,
  InvitationRecord,
} from "./team-manager"

export const instant = false

export default async function TeamSettingsPage() {
  await connection()
  const { user, business } = await getActiveBusinessContext()

  const supabase = await createClient()

  // RBAC: strictly owner only
  await requireOwner(business.id)

  // Fetch all members of this business
  const { data: rawMembers } = await supabase
    .from("business_members")
    .select("id, user_id, role, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: true })

  // Fetch all pending invitations
  const { data: rawInvitations } = await supabase
    .from("business_invitations")
    .select("id, email, role, token, status, created_at, expires_at")
    .eq("business_id", business.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  const teamMembers: MemberRecord[] = (rawMembers || []).map((m) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role,
    created_at: m.created_at,
    email: m.user_id === user.id ? user.email : undefined,
  }))

  const teamInvitations: InvitationRecord[] = (rawInvitations || []).map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    token: inv.token,
    status: inv.status,
    created_at: inv.created_at,
    expires_at: inv.expires_at,
  }))

  return (
    <TeamManager
      initialMembers={teamMembers}
      initialInvitations={teamInvitations}
      businessId={business.id}
      currentUserId={user.id}
    />
  )
}
