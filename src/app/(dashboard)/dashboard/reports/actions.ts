"use server"

import { createClient } from "@/lib/supabase/server"

export async function fetchFinancialReportAction(
  businessId: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  const { data, error } = await supabase.rpc("get_business_financial_report", {
    p_business_id: businessId,
    p_start_date: startDate,
    p_end_date: endDate,
  })

  if (error) {
    return { error: error.message || "Error al calcular el reporte financiero" }
  }

  return { success: true, data }
}
