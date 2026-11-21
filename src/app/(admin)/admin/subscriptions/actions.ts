"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requirePlatformAdmin } from "@/lib/auth/platform-admin"

export interface PlanUpdateInput {
  name: string
  subtitle: string
  price: number
  badge: string
  features: string[]
}

export interface BusinessSubscriptionAssignInput {
  businessId: string
  planId: "basic" | "full" | "custom"
  customPrice?: number
  notes?: string
  status?: string
}

export async function updatePlanTemplateAction(
  planId: "basic" | "full" | "custom",
  data: PlanUpdateInput
) {
  await requirePlatformAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("platform_subscription_plans")
    .update({
      name: data.name.trim(),
      subtitle: data.subtitle.trim(),
      price: data.price,
      badge: data.badge.trim(),
      features: data.features,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId)

  if (error) {
    return { error: `Error al actualizar parámetros del plan: ${error.message}` }
  }

  revalidatePath("/admin/subscriptions")
  revalidatePath("/dashboard/profile")
  return { success: true }
}

export async function assignBusinessSubscriptionAction(
  data: BusinessSubscriptionAssignInput
) {
  await requirePlatformAdmin()
  const supabase = await createClient()

  // Get plan template price if not custom
  let price = data.customPrice || 0
  if (data.planId !== "custom") {
    const { data: planData } = await supabase
      .from("platform_subscription_plans")
      .select("price")
      .eq("id", data.planId)
      .maybeSingle()

    if (planData && (data.customPrice === undefined || data.customPrice === null)) {
      price = Number(planData.price)
    }
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      subscription_plan: data.planId,
      subscription_price: price,
      subscription_notes: data.notes?.trim() || "",
      subscription_status: data.status || "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.businessId)

  if (error) {
    return { error: `Error al asignar suscripción: ${error.message}` }
  }

  revalidatePath("/admin/subscriptions")
  revalidatePath("/admin/businesses")
  revalidatePath("/dashboard/profile")
  return { success: true }
}
