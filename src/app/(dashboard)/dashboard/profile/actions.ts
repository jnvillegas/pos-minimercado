"use server"

import { revalidatePath } from "next/cache"
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

  // 1. Update public.user_profiles table
  const { error: profileError } = await supabase
    .from("user_profiles")
    .upsert({
      id: user.id,
      full_name: trimmedName,
      phone: data.phone?.trim() || "",
      dni_cuil: data.dniCuil?.trim() || "",
      alias: data.alias?.trim() || "",
      avatar_url: data.avatarUrl?.trim() || "",
      updated_at: new Date().toISOString(),
    })

  if (profileError) {
    return { error: `Error al guardar perfil: ${profileError.message}` }
  }

  // 2. Sync to auth.users metadata for instant access in server components
  await supabase.auth.updateUser({
    data: {
      full_name: trimmedName,
      phone: data.phone?.trim() || "",
      dni_cuil: data.dniCuil?.trim() || "",
      alias: data.alias?.trim() || "",
      avatar_url: data.avatarUrl?.trim() || "",
    },
  })

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
