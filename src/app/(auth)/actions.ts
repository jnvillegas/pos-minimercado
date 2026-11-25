"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { loginSchema, registerSchema } from "@/lib/validations/auth"

function formatAuthError(message: string): string {
  if (message.toLowerCase().includes("fetch failed")) {
    return "No se pudo conectar con Supabase. Configurá las credenciales reales de tu proyecto (URL y ANON_KEY) en el archivo .env.local"
  }
  if (message === "Invalid login credentials") {
    return "Correo o contraseña incorrectos"
  }
  if (message.toLowerCase().includes("already registered")) {
    return "Este correo ya se encuentra registrado"
  }
  if (message.toLowerCase().includes("signups not allowed")) {
    return "El registro está deshabilitado en Supabase. Activá 'Allow new users to sign up' en Authentication → Providers / Sign In & Up."
  }
  return message
}

export async function signInAction(formData: FormData) {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const parsed = loginSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Datos inválidos",
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return {
      error: formatAuthError(error.message),
    }
  }

  if (!data.user) {
    return { error: "No se pudo iniciar sesión" }
  }

  // Check if user has an associated business
  const { count } = await supabase
    .from("business_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", data.user.id)

  revalidatePath("/", "layout")

  if (!count || count === 0) {
    redirect("/onboarding")
  }

  redirect("/dashboard")
}

export async function signUpAction(formData: FormData) {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  }

  const parsed = registerSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Datos inválidos",
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return {
      error: formatAuthError(error.message),
    }
  }

  revalidatePath("/", "layout")

  if (data.session) {
    redirect("/onboarding")
  }

  return {
    success: true,
    message: "Cuenta creada. Revisá tu correo para confirmar tu registro.",
  }
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}
