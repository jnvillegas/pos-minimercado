"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { onboardingBusinessSchema } from "@/lib/validations/business"

export async function createBusinessOnboardingAction(formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    industry: formData.get("industry"),
    currency: formData.get("currency"),
  }

  const parsed = onboardingBusinessSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Datos inválidos",
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Call the atomic database RPC
  const { error } = await supabase.rpc("create_business_with_owner", {
    p_name: parsed.data.name,
    p_industry: parsed.data.industry,
    p_currency: parsed.data.currency,
  })

  if (error) {
    return {
      error: error.message || "Error al crear el comercio. Intentá nuevamente.",
    }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}
