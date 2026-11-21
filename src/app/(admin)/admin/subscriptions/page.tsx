import React from "react"
import { connection } from "next/server"
import { requirePlatformAdmin } from "@/lib/auth/platform-admin"
import { createClient } from "@/lib/supabase/server"
import { fetchPlatformDataAction } from "../actions"
import {
  SubscriptionsView,
  SubscriptionPlanItem,
  BusinessSubscriptionSummary,
} from "./subscriptions-view"

export const instant = false

export default async function AdminSubscriptionsPage() {
  await connection()
  const { user } = await requirePlatformAdmin()

  const supabase = await createClient()

  // 1. Fetch plans catalog from DB (safely returns null on missing remote table)
  let plansData: Record<string, unknown>[] | null = null
  try {
    const res = await supabase
      .from("platform_subscription_plans")
      .select("*")
      .order("created_at", { ascending: true })
    plansData = res.data as Record<string, unknown>[] | null
  } catch {
    plansData = null
  }

  // Superadmin user_metadata fallback (100% resilient across cloud & local)
  const metaPlans =
    (user.user_metadata?.platform_subscription_plans as Record<
      string,
      Partial<SubscriptionPlanItem>
    >) || {}

  const metaBizSubs =
    (user.user_metadata?.platform_business_subscriptions as Record<
      string,
      { planId?: string; customPrice?: number; notes?: string; status?: string }
    >) || {}

  // 2. Fetch businesses with subscription info
  let bizData: Record<string, unknown>[] | null = null
  try {
    const res = await supabase
      .from("businesses")
      .select(
        "id, name, industry, subscription_plan, subscription_price, subscription_status, subscription_notes"
      )
      .order("created_at", { ascending: false })
    bizData = res.data as Record<string, unknown>[] | null
  } catch {
    bizData = null
  }

  // Get owner emails from platform action
  const { businesses: platformBiz } = await fetchPlatformDataAction().catch(() => ({
    businesses: [],
  }))

  const ownerMap = new Map<string, string>()
  platformBiz.forEach((pb) => {
    if (pb.id && pb.owner_email) {
      ownerMap.set(pb.id, pb.owner_email)
    }
  })

  // Format businesses for view (merging DB + metadata fallback)
  const rawBizList: Record<string, unknown>[] =
    bizData && bizData.length > 0 ? bizData : (platformBiz as unknown as Record<string, unknown>[])

  const formattedBusinesses: BusinessSubscriptionSummary[] = rawBizList.map((b) => {
    const bizId = String(b.id)
    const metaSub = metaBizSubs[bizId]

    let rawPlan =
      metaSub?.planId ||
      ("subscription_plan" in b ? String(b.subscription_plan) : "basic") ||
      "basic"
    let plan = rawPlan.toLowerCase() as "basic" | "full" | "custom"
    if (plan === ("pro" as string)) plan = "full"
    if (plan === ("free" as string)) plan = "basic"
    if (plan === ("enterprise" as string)) plan = "custom"
    if (plan !== "basic" && plan !== "full" && plan !== "custom") {
      plan = "basic"
    }

    const price =
      metaSub?.customPrice !== undefined
        ? Number(metaSub.customPrice)
        : "subscription_price" in b && b.subscription_price !== undefined
        ? Number(b.subscription_price)
        : plan === "full"
        ? 25000
        : 12000

    const notes =
      metaSub?.notes !== undefined
        ? metaSub.notes
        : "subscription_notes" in b && b.subscription_notes
        ? String(b.subscription_notes)
        : ""

    const status =
      metaSub?.status ||
      ("subscription_status" in b && b.subscription_status
        ? String(b.subscription_status)
        : "active")

    return {
      id: bizId,
      name: String(b.name || "Comercio"),
      owner_email: ownerMap.get(bizId) || ("owner_email" in b ? String(b.owner_email) : "Sin email"),
      industry: String(b.industry || "Comercio"),
      subscription_plan: plan,
      subscription_price: price,
      subscription_status: status,
      subscription_notes: notes,
    }
  })

  // Default plans baseline
  const defaultPlans: SubscriptionPlanItem[] = [
    {
      id: "basic",
      name: "Plan Básico",
      subtitle: "Para pequeños comercios familiares o de barrio",
      price: 12000,
      period_label: "/ mes por sucursal",
      badge: "Entrada",
      highlight: false,
      features: [
        "Hasta 500 productos en catálogo",
        "1 Caja registradora activa",
        "Punto de venta táctil rápido",
        "Control de stock básico",
        "Ticket digital por WhatsApp",
      ],
      assigned_count: formattedBusinesses.filter((b) => b.subscription_plan === "basic").length,
    },
    {
      id: "full",
      name: "Plan Full",
      subtitle: "El estándar completo para minimercados y autoservicios activos",
      price: 25000,
      period_label: "/ mes por sucursal",
      badge: "Más Popular",
      highlight: true,
      features: [
        "Catálogo y productos ilimitados",
        "Cajeros y encargados ilimitados",
        "Cierre de turnos ciego con arqueo de caja",
        "Reportes financieros y márgenes en tiempo real",
        "Importación / exportación masiva en Excel",
        "Soporte prioritario por WhatsApp",
      ],
      assigned_count: formattedBusinesses.filter((b) => b.subscription_plan === "full").length,
    },
    {
      id: "custom",
      name: "Plan Customizado",
      subtitle: "Tarifa adaptada según volumen, sucursales y desarrollos especiales",
      price: 0,
      period_label: "Precio a convenir",
      badge: "A Medida",
      highlight: false,
      features: [
        "Todo lo incluido en el Plan Full",
        "Desarrollos y funciones exclusivas a medida",
        "Múltiples sucursales y franquicias consolidadas",
        "Integración con balanzas y periféricos dedicados",
        "Auditoría de aperturas de caja personalizada",
        "Gerente de cuenta y soporte directo dedicado",
      ],
      assigned_count: formattedBusinesses.filter((b) => b.subscription_plan === "custom").length,
    },
  ]

  // Merge DB + Superadmin metadata + Fallback
  const formattedPlans: SubscriptionPlanItem[] = (["basic", "full", "custom"] as const).map(
    (planKey) => {
      const dbPlan = plansData?.find((p) => p.id === planKey)
      const meta = metaPlans[planKey]
      const fallback = defaultPlans.find((p) => p.id === planKey)!

      const name = String(meta?.name || dbPlan?.name || fallback.name)
      const subtitle = String(meta?.subtitle || dbPlan?.subtitle || fallback.subtitle)
      const price = Number(meta?.price ?? dbPlan?.price ?? fallback.price)
      const badge = String(meta?.badge || dbPlan?.badge || fallback.badge)
      const features = Array.isArray(meta?.features)
        ? (meta.features as string[])
        : Array.isArray(dbPlan?.features)
        ? (dbPlan.features as string[])
        : fallback.features

      return {
        id: planKey,
        name,
        subtitle,
        price,
        period_label: String(dbPlan?.period_label || fallback.period_label),
        badge,
        highlight: Boolean(dbPlan?.highlight ?? fallback.highlight),
        features,
        assigned_count: formattedBusinesses.filter((b) => b.subscription_plan === planKey).length,
      }
    }
  )

  return (
    <SubscriptionsView
      initialPlans={formattedPlans}
      initialBusinesses={formattedBusinesses}
    />
  )
}
