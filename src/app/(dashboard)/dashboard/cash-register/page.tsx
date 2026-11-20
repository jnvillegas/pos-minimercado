import React from "react"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getActiveBusinessContext } from "@/lib/auth/business-context"
import {
  CashRegisterView,
  ShiftRecord,
  ShiftMetrics,
} from "./cash-register-view"

export const instant = false

export default async function CashRegisterPage() {
  await connection()
  const { user, business, role } = await getActiveBusinessContext()

  const supabase = await createClient()

  // 1. Fetch current open shift (if any)
  const { data: rawActiveShift } = await supabase
    .from("cash_shifts")
    .select("*")
    .eq("business_id", business.id)
    .eq("status", "open")
    .limit(1)
    .maybeSingle()

  let activeShift: ShiftRecord | null = null
  let activeMetrics: ShiftMetrics | null = null

  if (rawActiveShift) {
    activeShift = {
      id: rawActiveShift.id,
      business_id: rawActiveShift.business_id,
      opened_by: rawActiveShift.opened_by,
      closed_by: rawActiveShift.closed_by,
      opened_at: rawActiveShift.opened_at,
      closed_at: rawActiveShift.closed_at,
      initial_cash: Number(rawActiveShift.initial_cash),
      expected_cash: rawActiveShift.expected_cash !== null ? Number(rawActiveShift.expected_cash) : null,
      actual_cash: rawActiveShift.actual_cash !== null ? Number(rawActiveShift.actual_cash) : null,
      difference: rawActiveShift.difference !== null ? Number(rawActiveShift.difference) : null,
      notes: rawActiveShift.notes,
      status: rawActiveShift.status as "open" | "closed",
      created_at: rawActiveShift.created_at,
    }

    // Call metrics RPC
    const { data: metricsData } = await supabase.rpc("get_active_shift_metrics", {
      p_shift_id: rawActiveShift.id,
    })

    if (metricsData) {
      const m = metricsData as Record<string, unknown>
      activeMetrics = {
        shift_id: String(m.shift_id),
        status: String(m.status),
        initial_cash: Number(m.initial_cash || 0),
        opened_at: String(m.opened_at),
        cash_sales: Number(m.cash_sales || 0),
        digital_sales: Number(m.digital_sales || 0),
        total_sales: Number(m.total_sales || 0),
        sales_count: Number(m.sales_count || 0),
        expected_cash: Number(m.expected_cash || 0),
      }
    }
  }

  // 2. Fetch shift history (last 30 shifts)
  const { data: rawHistory } = await supabase
    .from("cash_shifts")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(30)

  const historyShifts: ShiftRecord[] = (rawHistory || []).map((s) => ({
    id: s.id,
    business_id: s.business_id,
    opened_by: s.opened_by,
    closed_by: s.closed_by,
    opened_at: s.opened_at,
    closed_at: s.closed_at,
    initial_cash: Number(s.initial_cash),
    expected_cash: s.expected_cash !== null ? Number(s.expected_cash) : null,
    actual_cash: s.actual_cash !== null ? Number(s.actual_cash) : null,
    difference: s.difference !== null ? Number(s.difference) : null,
    notes: s.notes,
    status: s.status as "open" | "closed",
    created_at: s.created_at,
  }))

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#1F1F1F]">
          Caja y Control de Turnos
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Apertura de turno, arqueo ciego, control de diferencias y auditoría de efectivo
        </p>
      </div>

      <CashRegisterView
        activeShift={activeShift}
        activeMetrics={activeMetrics}
        historyShifts={historyShifts}
        businessId={business.id}
        currency={business.currency || "ARS"}
        userEmail={user.email || ""}
      />
    </div>
  )
}
