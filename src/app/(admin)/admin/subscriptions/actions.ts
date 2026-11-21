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
    const { user } = await requirePlatformAdmin()
    const supabase = await createClient()

    // 1. Primary persistence: Always save to Superadmin user_metadata
    // This guarantees immediate persistence across all environments (Vercel, Supabase Cloud, Local)
    // even if remote database migrations haven't been run yet.
    const currentMetaPlans =
      (user.user_metadata?.platform_subscription_plans as Record<string, PlanUpdateInput>) || {}
    const updatedMetaPlans = {
      ...currentMetaPlans,
      [planId]: {
        name: data.name.trim(),
        subtitle: data.subtitle.trim(),
        price: Number(data.price) || 0,
        badge: data.badge.trim(),
        features: data.features,
      },
    }

    await supabase.auth.updateUser({
      data: {
        platform_subscription_plans: updatedMetaPlans,
      },
    })

    // 2. Secondary persistence: Sync to database table & RPC in background
    try {
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

      if (rpcError || !rpcRes?.success) {
        // Fallback direct table update
        await supabase
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
      }
    } catch {
      // Non-blocking: user_metadata already persisted the change
    }

    revalidatePath("/admin/subscriptions")
    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Error al guardar parámetros del plan: ${msg}` }
  }
}

export async function assignBusinessSubscriptionAction(
  data: BusinessSubscriptionAssignInput
) {
  try {
    const { user } = await requirePlatformAdmin()
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
      } else {
        const metaPlans = user.user_metadata?.platform_subscription_plans as Record<
          string,
          { price?: number }
        >
        if (metaPlans?.[data.planId]?.price) {
          targetPrice = Number(metaPlans[data.planId].price)
        }
      }
    }

    // 1. Primary persistence: Save to Superadmin user_metadata
    const currentBizSubs =
      (user.user_metadata?.platform_business_subscriptions as Record<
        string,
        { planId: string; customPrice: number; notes: string; status: string }
      >) || {}

    currentBizSubs[data.businessId] = {
      planId: data.planId,
      customPrice: targetPrice,
      notes: data.notes?.trim() || "",
      status: data.status || "active",
    }

    await supabase.auth.updateUser({
      data: {
        platform_business_subscriptions: currentBizSubs,
      },
    })

    // 2. Secondary persistence: Sync to database businesses table / RPC
    try {
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

      if (rpcError || !rpcRes?.success) {
        let updateRes = await supabase
          .from("businesses")
          .update({
            subscription_plan: data.planId,
            subscription_price: targetPrice,
            subscription_notes: data.notes?.trim() || "",
            subscription_status: data.status || "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.businessId)

        // Retry without subscription_notes if column doesn't exist yet on remote
        if (updateRes.error && updateRes.error.message.includes("subscription_notes")) {
          await supabase
            .from("businesses")
            .update({
              subscription_plan: data.planId,
              subscription_price: targetPrice,
              subscription_status: data.status || "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.businessId)
        }
      }
    } catch {
      // Non-blocking: user_metadata already persisted the assignment
    }

    revalidatePath("/admin/subscriptions")
    revalidatePath("/admin/businesses")
    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Error al asignar suscripción: ${msg}` }
  }
}
