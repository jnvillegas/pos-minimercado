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
  try {
    await requirePlatformAdmin()
    const supabase = await createClient()

    // 1. Try atomic security-definer RPC first
    const { data: rpcRes, error: rpcError } = await supabase.rpc(
      "update_platform_plan",
      {
        p_plan_id: planId,
        p_name: data.name.trim(),
        p_subtitle: data.subtitle.trim(),
        p_price: Number(data.price) || 0,
        p_badge: data.badge.trim(),
        p_features: data.features,
      }
    )

    if (!rpcError && rpcRes?.success) {
      revalidatePath("/admin/subscriptions")
      revalidatePath("/dashboard/profile")
      return { success: true }
    }

    // 2. Direct table update fallback (if RPC is not yet in PostgREST schema cache)
    const { data: updatedRows, error: tableError } = await supabase
      .from("platform_subscription_plans")
      .update({
        name: data.name.trim(),
        subtitle: data.subtitle.trim(),
        price: Number(data.price) || 0,
        badge: data.badge.trim(),
        features: data.features,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .select("id")

    if (tableError) {
      return {
        error: `Error al actualizar parámetros del plan: ${tableError.message || rpcError?.message}`,
      }
    }

    if (!updatedRows || updatedRows.length === 0) {
      return {
        error:
          "No se pudo guardar la modificación del plan en la base de datos. Verificá permisos de superadministrador.",
      }
    }

    revalidatePath("/admin/subscriptions")
    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Error inesperado al guardar plan: ${msg}` }
  }
}

export async function assignBusinessSubscriptionAction(
  data: BusinessSubscriptionAssignInput
) {
  try {
    await requirePlatformAdmin()
    const supabase = await createClient()

    // Determine target price
    let targetPrice = data.customPrice ?? 0
    if (data.planId !== "custom" && (data.customPrice === undefined || data.customPrice === null)) {
      const { data: planData } = await supabase
        .from("platform_subscription_plans")
        .select("price")
        .eq("id", data.planId)
        .maybeSingle()

      if (planData) {
        targetPrice = Number(planData.price)
      }
    }

    // 1. Try atomic security-definer RPC first
    const { data: rpcRes, error: rpcError } = await supabase.rpc(
      "assign_business_subscription",
      {
        p_business_id: data.businessId,
        p_plan_id: data.planId,
        p_price: targetPrice,
        p_notes: data.notes?.trim() || "",
        p_status: data.status || "active",
      }
    )

    if (!rpcError && rpcRes?.success) {
      revalidatePath("/admin/subscriptions")
      revalidatePath("/admin/businesses")
      revalidatePath("/dashboard/profile")
      return { success: true }
    }

    // 2. Direct table update fallback
    const { data: updatedRows, error: tableError } = await supabase
      .from("businesses")
      .update({
        subscription_plan: data.planId,
        subscription_price: targetPrice,
        subscription_notes: data.notes?.trim() || "",
        subscription_status: data.status || "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.businessId)
      .select("id")

    if (tableError) {
      return {
        error: `Error al asignar suscripción: ${tableError.message || rpcError?.message}`,
      }
    }

    if (!updatedRows || updatedRows.length === 0) {
      return {
        error:
          "No se pudo guardar la suscripción del comercio en la base de datos. Verificá permisos de superadministrador.",
      }
    }

    revalidatePath("/admin/subscriptions")
    revalidatePath("/admin/businesses")
    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Error inesperado al guardar suscripción: ${msg}` }
  }
}
