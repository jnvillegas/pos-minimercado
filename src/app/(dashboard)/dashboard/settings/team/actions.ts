"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { inviteSchema } from "@/lib/validations/team"

export async function createInvitationAction(
  businessId: string,
  email: string,
  role: "manager" | "cashier"
) {
  const parsed = inviteSchema.safeParse({ email, role })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Datos de invitación inválidos" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  // Check if owner
  const { data: member } = await supabase
    .from("business_members")
    .select("role")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (member?.role !== "owner") {
    return { error: "Solo el dueño puede invitar miembros al equipo" }
  }

  const { data, error } = await supabase
    .from("business_invitations")
    .insert({
      business_id: businessId,
      email: parsed.data.email,
      role: parsed.data.role,
      invited_by: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe una invitación pendiente para ese correo" }
    }
    return { error: error.message || "Error al generar invitación" }
  }

  revalidatePath("/dashboard/settings/team")
  return { success: true, data }
}

export async function revokeInvitationAction(inviteId: string, businessId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  const { error } = await supabase
    .from("business_invitations")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("business_id", businessId)

  if (error) {
    return { error: error.message || "Error al revocar la invitación" }
  }

  revalidatePath("/dashboard/settings/team")
  return { success: true }
}

export async function removeTeamMemberAction(memberId: string, businessId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  // Check if target is not the owner
  const { data: target } = await supabase
    .from("business_members")
    .select("role, user_id")
    .eq("id", memberId)
    .eq("business_id", businessId)
    .maybeSingle()

  if (!target) {
    return { error: "Miembro no encontrado" }
  }

  if (target.role === "owner" || target.user_id === user.id) {
    return { error: "No podés eliminar al dueño del negocio" }
  }

  const { error } = await supabase
    .from("business_members")
    .delete()
    .eq("id", memberId)
    .eq("business_id", businessId)

  if (error) {
    return { error: error.message || "Error al desvincular al miembro" }
  }

  revalidatePath("/dashboard/settings/team")
  return { success: true }
}
