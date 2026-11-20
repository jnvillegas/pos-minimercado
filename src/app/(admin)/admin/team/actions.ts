"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requirePlatformAdmin } from "@/lib/auth/platform-admin"

export interface PlatformAdminUser {
  id: string
  user_id: string
  email: string
  role: "superadmin" | "support"
  created_at: string
}

export interface PlatformAdminInvitation {
  id: string
  email: string
  role: "superadmin" | "support"
  created_at: string
  expires_at: string
}

export async function addPlatformAdminAction(
  email: string,
  role: "superadmin" | "support"
) {
  await requirePlatformAdmin()

  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { error: "Por favor ingresa un correo electrónico válido" }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("add_platform_admin", {
    p_email: cleanEmail,
    p_role: role,
  })

  if (error) {
    return { error: error.message || "Error al agregar administrador" }
  }

  revalidatePath("/admin/team")
  return { success: true, result: data }
}

export async function removePlatformAdminAction(adminId: string) {
  await requirePlatformAdmin()

  const supabase = await createClient()
  const { error } = await supabase.rpc("remove_platform_admin", {
    p_admin_id: adminId,
  })

  if (error) {
    return { error: error.message || "Error al remover administrador" }
  }

  revalidatePath("/admin/team")
  return { success: true }
}
