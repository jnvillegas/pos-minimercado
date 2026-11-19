import React from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  MovementsManager,
  UnifiedActivityItem,
} from "./movements-manager"

export const instant = false

export default async function MovementsPage() {
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

  // Check if there is an active open shift
  const { data: openShift } = await supabase
    .from("cash_shifts")
    .select("id")
    .eq("business_id", business.id)
    .eq("status", "open")
    .limit(1)
    .maybeSingle()

  // Fetch POS Sales with line items
  const { data: rawSales } = await supabase
    .from("sales")
    .select(`
      id,
      total_amount,
      payment_method,
      discount_amount,
      created_at,
      shift_id,
      sale_items (
        product_name,
        quantity,
        unit_price,
        total_price
      )
    `)
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(100)

  // Fetch manual cash movements
  const { data: rawMovements } = await supabase
    .from("cash_movements")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(100)

  // Build unified items
  const saleItems: UnifiedActivityItem[] = (rawSales || []).map((s) => ({
    id: s.id,
    source: "sale",
    type: "income",
    category: "Venta POS",
    concept: `Venta #${s.id.substring(0, 8)}`,
    amount: Number(s.total_amount),
    payment_method: s.payment_method,
    created_at: s.created_at,
    shift_id: s.shift_id,
    items: (s.sale_items || []).map(
      (item: {
        product_name: string
        quantity: number | string
        unit_price: number | string
        total_price: number | string
      }) => ({
        product_name: item.product_name,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
      })
    ),
  }))

  const movementItems: UnifiedActivityItem[] = (rawMovements || []).map((m) => ({
    id: m.id,
    source: "movement",
    type: m.type as "income" | "expense",
    category: m.category,
    concept: m.concept,
    amount: Number(m.amount),
    payment_method: m.payment_method,
    created_at: m.created_at,
    notes: m.notes,
    shift_id: m.shift_id,
  }))

  // Merge and sort descending
  const unifiedItems = [...saleItems, ...movementItems].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <MovementsManager
      initialItems={unifiedItems}
      businessId={business.id}
      currency={business.currency || "ARS"}
      isCashShiftOpen={Boolean(openShift)}
    />
  )
}
