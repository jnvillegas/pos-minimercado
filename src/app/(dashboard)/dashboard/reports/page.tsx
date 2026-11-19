import React from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireOwnerOrManager } from "@/lib/auth/rbac"
import {
  ReportsView,
  FinancialReportData,
} from "./reports-view"

export const instant = false

export default async function ReportsPage() {
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch active business
  const { data: members } = await supabase
    .from("business_members")
    .select(`
      role,
      businesses (
        id,
        name,
        currency
      )
    `)
    .eq("user_id", user.id)
    .limit(1)

  const membership = members?.[0]
  const business = Array.isArray(membership?.businesses)
    ? membership?.businesses[0]
    : membership?.businesses

  if (!business) {
    redirect("/onboarding")
  }

  // RBAC: Only owner or manager
  await requireOwnerOrManager(business.id)

  // Default: Last 30 days
  const now = new Date()
  const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const { data: rawReport } = await supabase.rpc("get_business_financial_report", {
    p_business_id: business.id,
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString(),
  })

  const reportData = (rawReport as unknown as FinancialReportData) || {
    gross_revenue: 0,
    cogs: 0,
    gross_profit: 0,
    margin_pct: 0,
    sales_count: 0,
    aov: 0,
    daily_trend: [],
    hourly_distribution: [],
    payment_methods: [],
    top_products: [],
  }

  return (
    <ReportsView
      initialReport={reportData}
      businessId={business.id}
      currency={business.currency || "ARS"}
    />
  )
}
