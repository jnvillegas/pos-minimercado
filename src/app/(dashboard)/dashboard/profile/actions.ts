"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export interface ProfileUpdateInput {
  fullName: string
  phone?: string
  dniCuil?: string
  alias?: string
  avatarUrl?: string
}

export interface BusinessBillingInput {
  businessId: string
  cuit?: string
  billingAlias?: string
}

export async function updateProfileAction(data: ProfileUpdateInput) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "No se pudo autenticar al usuario" }
  }

  const trimmedName = data.fullName.trim()
  if (!trimmedName) {
    return { error: "El nombre completo es obligatorio" }
  }

  // 1. Update auth.users metadata first (100% native in Supabase, works locally and in cloud)
  const { error: userMetaError } = await supabase.auth.updateUser({
    data: {
      full_name: trimmedName,
      phone: data.phone?.trim() || "",
      dni_cuil: data.dniCuil?.trim() || "",
      alias: data.alias?.trim() || "",
      avatar_url: data.avatarUrl?.trim() || "",
    },
  })

  if (userMetaError) {
    return { error: `Error al guardar perfil: ${userMetaError.message}` }
  }

  // 2. Synchronize to public.user_profiles table / RPC as progressive enhancement
  try {
    const { error: rpcError } = await supabase.rpc("update_my_profile", {
      p_full_name: trimmedName,
      p_phone: data.phone?.trim() || "",
      p_dni_cuil: data.dniCuil?.trim() || "",
      p_alias: data.alias?.trim() || "",
      p_avatar_url: data.avatarUrl?.trim() || "",
    })

    if (rpcError) {
      await supabase.from("user_profiles").upsert({
        id: user.id,
        full_name: trimmedName,
        phone: data.phone?.trim() || "",
        dni_cuil: data.dniCuil?.trim() || "",
        alias: data.alias?.trim() || "",
        avatar_url: data.avatarUrl?.trim() || "",
        updated_at: new Date().toISOString(),
      })
    }
  } catch {
    // Non-blocking if table is not yet migrated on remote environment
  }

  revalidatePath("/", "layout")
  revalidatePath("/dashboard/profile")

  return { success: true }
}

export async function updatePasswordAction(newPassword: string) {
  const supabase = await createClient()

  if (!newPassword || newPassword.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" }
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updateBusinessBillingAction(data: BusinessBillingInput) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("businesses")
    .update({
      business_cuit: data.cuit?.trim() || "",
      billing_alias: data.billingAlias?.trim() || "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.businessId)

  if (error) {
    return { error: `Error al guardar datos fiscales: ${error.message}` }
  }

  revalidatePath("/dashboard/profile")
  return { success: true }
}

export async function deleteOwnAccountAction() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  const { error } = await supabase.rpc("delete_own_user_account")

  if (error) {
    return {
      error:
        error.message?.includes("schema cache") || error.code === "PGRST202"
          ? "Falta ejecutar la migración 'REMOTE_DEPLOY_LATEST.sql' en Supabase Cloud para habilitar la baja de cuenta."
          : error.message || "No se pudo dar de baja tu cuenta",
    }
  }

  const cookieStore = await cookies()
  cookieStore.delete("active_business_id")
  cookieStore.delete("support_target_business_id")
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.delete(cookie.name)
    }
  }

  await supabase.auth.signOut().catch(() => null)
  revalidatePath("/", "layout")
  redirect("/login")
}
