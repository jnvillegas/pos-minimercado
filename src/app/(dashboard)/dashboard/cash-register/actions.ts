"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  openShiftSchema,
  closeShiftSchema,
  CloseShiftInput,
} from "@/lib/validations/cash-shift"

export async function openCashShiftAction(businessId: string, initialCash: number) {
  const parsed = openShiftSchema.safeParse({ initialCash })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Monto inválido" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  const { data, error } = await supabase.rpc("open_cash_shift", {
    p_business_id: businessId,
    p_initial_cash: parsed.data.initialCash,
  })

  if (error) {
    return { error: error.message || "Error al abrir la caja" }
  }

  revalidatePath("/dashboard/cash-register")
  revalidatePath("/dashboard/pos")
  revalidatePath("/dashboard")
  return { success: true, data }
}

export async function closeCashShiftAction(input: CloseShiftInput) {
  const parsed = closeShiftSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Datos de cierre inválidos" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  const { data, error } = await supabase.rpc("close_cash_shift", {
    p_shift_id: parsed.data.shiftId,
    p_actual_cash: parsed.data.actualCash,
    p_notes: parsed.data.notes || null,
  })

  if (error) {
    return { error: error.message || "Error al cerrar la caja" }
  }

  revalidatePath("/dashboard/cash-register")
  revalidatePath("/dashboard/pos")
  revalidatePath("/dashboard")
  return { success: true, data }
}

export async function getActiveShiftMetricsAction(shiftId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  const { data, error } = await supabase.rpc("get_active_shift_metrics", {
    p_shift_id: shiftId,
  })

  if (error) {
    return { error: error.message || "Error al obtener métricas del turno" }
  }

  return { success: true, data }
}
