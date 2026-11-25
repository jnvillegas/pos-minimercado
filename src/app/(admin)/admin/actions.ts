"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requirePlatformAdmin } from "@/lib/auth/platform-admin"

export interface PlatformMetrics {
  total_businesses: number
  active_today: number
  total_gmv: number
  total_sales_count: number
  total_products: number
}

export interface PlatformBusiness {
  id: string
  name: string
  industry: string
  currency: string
  created_at: string
  owner_email: string
  total_sales: number
  sales_count: number
  last_sale_at: string | null
  is_active: boolean
}

export async function fetchPlatformDataAction(): Promise<{
  metrics: PlatformMetrics
  businesses: PlatformBusiness[]
}> {
  await requirePlatformAdmin()
  const supabase = await createClient()

  // 1. Fetch metrics
  const { data: metricsData, error: metricsErr } = await supabase.rpc(
    "get_platform_metrics"
  )

  // 2. Fetch businesses
  const { data: businessesData, error: bizErr } = await supabase.rpc(
    "list_platform_businesses"
  )

  const metrics: PlatformMetrics = metricsData || {
    total_businesses: 0,
    active_today: 0,
    total_gmv: 0,
    total_sales_count: 0,
    total_products: 0,
  }

  const businesses: PlatformBusiness[] = (businessesData || []).map(
    (b: Record<string, unknown>) => ({
      id: String(b.id),
      name: String(b.name),
      industry: String(b.industry || ""),
      currency: String(b.currency || "ARS"),
      created_at: String(b.created_at),
      owner_email: String(b.owner_email || "Sin email"),
      total_sales: Number(b.total_sales || 0),
      sales_count: Number(b.sales_count || 0),
      last_sale_at: b.last_sale_at ? String(b.last_sale_at) : null,
      is_active: Boolean(b.is_active),
    })
  )

  return { metrics, businesses }
}

export async function enterSupportModeAction(businessId: string) {
  await requirePlatformAdmin()
  // Store support impersonation preference in cookie
  const cookieStore = await cookies()
  cookieStore.set("support_target_business_id", businessId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 3600, // 1 hour support session
  })

  revalidatePath("/dashboard")
  redirect("/dashboard")
}

export async function exitSupportModeAction() {
  const cookieStore = await cookies()
  cookieStore.delete("support_target_business_id")
  revalidatePath("/dashboard")
  redirect("/admin")
}

export async function deleteBusinessAsAdminAction(businessId: string) {
  await requirePlatformAdmin()
  const supabase = await createClient()

  const { error } = await supabase.rpc("delete_business_account", {
    p_business_id: businessId,
  })

  if (error) {
    return {
      error: error.message?.includes("schema cache") || error.code === "PGRST202"
        ? "Falta ejecutar la migración 'REMOTE_DEPLOY_LATEST.sql' en Supabase Cloud para habilitar el borrado de comercios."
        : error.message || "No se pudo eliminar el comercio",
    }
  }

  const cookieStore = await cookies()
  if (cookieStore.get("support_target_business_id")?.value === businessId) {
    cookieStore.delete("support_target_business_id")
  }
  if (cookieStore.get("active_business_id")?.value === businessId) {
    cookieStore.delete("active_business_id")
  }

  revalidatePath("/admin")
  revalidatePath("/admin/businesses")
  revalidatePath("/dashboard")
  return { success: true }
}
