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
  await requirePlatformAdmin()

  const supabase = await createClient()

  // 1. Fetch plans catalog from DB
  const { data: plansData } = await supabase
    .from("platform_subscription_plans")
    .select("*")
    .order("created_at", { ascending: true })

  // 2. Fetch businesses with subscription info
  const { data: bizData } = await supabase
    .from("businesses")
    .select(
      "id, name, industry, subscription_plan, subscription_price, subscription_status, subscription_notes"
    )
    .order("created_at", { ascending: false })

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

  // Format businesses for view
  const formattedBusinesses: BusinessSubscriptionSummary[] = (bizData || []).map((b) => {
    let plan = (b.subscription_plan || "basic").toLowerCase() as "basic" | "full" | "custom"
    if (plan === ("pro" as string)) plan = "full"
    if (plan === ("free" as string)) plan = "basic"
    if (plan === ("enterprise" as string)) plan = "custom"
    if (plan !== "basic" && plan !== "full" && plan !== "custom") {
      plan = "basic"
    }

    return {
      id: String(b.id),
      name: String(b.name || "Comercio"),
      owner_email: ownerMap.get(String(b.id)) || "Sin email registrado",
      industry: String(b.industry || "Comercio"),
      subscription_plan: plan,
      subscription_price: Number(b.subscription_price || 0),
      subscription_status: String(b.subscription_status || "active"),
      subscription_notes: String(b.subscription_notes || ""),
    }
  })

  // Default plans fallback in case DB is not yet populated
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

  let formattedPlans: SubscriptionPlanItem[] = defaultPlans
  if (plansData && plansData.length > 0) {
    formattedPlans = (["basic", "full", "custom"] as const).map((planKey) => {
      const found = plansData.find((p) => p.id === planKey)
      const fallback = defaultPlans.find((p) => p.id === planKey)!
      if (!found) return fallback

      const features = Array.isArray(found.features)
        ? (found.features as string[])
        : fallback.features

      return {
        id: planKey,
        name: String(found.name || fallback.name),
        subtitle: String(found.subtitle || fallback.subtitle),
        price: Number(found.price ?? fallback.price),
        period_label: String(found.period_label || fallback.period_label),
        badge: String(found.badge || fallback.badge),
        highlight: Boolean(found.highlight),
        features,
        assigned_count: formattedBusinesses.filter((b) => b.subscription_plan === planKey).length,
      }
    })
  }

  return (
    <SubscriptionsView
      initialPlans={formattedPlans}
      initialBusinesses={formattedBusinesses}
    />
  )
}
