"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export interface CartItemPayload {
  product_id: string
  product_name: string
  barcode?: string | null
  unit_price: number
  unit_cost: number
  quantity: number
}

export interface ProcessSaleInput {
  businessId: string
  items: CartItemPayload[]
  paymentMethod: "cash" | "transfer" | "debit_card" | "credit_card" | "credit"
  discountAmount?: number
  discountType?: "percentage" | "fixed" | null
  amountTendered?: number | null
  customerId?: string | null
}

export async function processSaleAction(input: ProcessSaleInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  if (!input.items || input.items.length === 0) {
    return { error: "El carrito está vacío" }
  }

  if (input.paymentMethod === "credit" && !input.customerId) {
    return { error: "Debe seleccionar un cliente para registrar una venta a crédito / fiado" }
  }

  const rpcParams: Record<string, unknown> = {
    p_business_id: input.businessId,
    p_items: input.items,
    p_payment_method: input.paymentMethod,
    p_discount_amount: input.discountAmount || 0,
    p_discount_type: input.discountType || null,
    p_amount_tendered: input.amountTendered || null,
  }

  if (input.customerId) {
    rpcParams.p_customer_id = input.customerId
  }

  let { data, error } = await supabase.rpc("create_sale", rpcParams)

  if (error) {
    // If PostgREST fails because create_sale signature with p_customer_id doesn't exist on remote DB yet
    if (
      error.message?.includes("create_sale") &&
      (error.message?.includes("schema cache") || error.code === "PGRST202")
    ) {
      if (input.paymentMethod === "credit") {
        return {
          error:
            "Falta ejecutar la migración en Supabase Cloud. Copiá y ejecutá el script 'REMOTE_DEPLOY_LATEST.sql' en el SQL Editor de tu panel de Supabase para habilitar las ventas a crédito / fiado.",
        }
      }

      // Retry without p_customer_id for non-credit sales
      const fallback = await supabase.rpc("create_sale", {
        p_business_id: input.businessId,
        p_items: input.items,
        p_payment_method: input.paymentMethod,
        p_discount_amount: input.discountAmount || 0,
        p_discount_type: input.discountType || null,
        p_amount_tendered: input.amountTendered || null,
      })
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      return {
        error: error.message || "Error al registrar la venta",
      }
    }
  }

  // Dual-persistence fallback for metadata if customer bought on credit
  if (input.paymentMethod === "credit" && input.customerId && user.user_metadata) {
    try {
      const metaKey = `business_customers_${input.businessId}`
      const metaCustomers = (user.user_metadata[metaKey] as Array<{ id: string; current_debt: number }>) || []
      const totalSale = Number(
        (data as { total_amount?: number })?.total_amount ??
          input.items.reduce((acc, it) => acc + it.quantity * it.unit_price, 0) -
            (input.discountAmount || 0)
      )
      const updatedMeta = metaCustomers.map((c) =>
        c.id === input.customerId
          ? { ...c, current_debt: Number(c.current_debt || 0) + totalSale, updated_at: new Date().toISOString() }
          : c
      )
      await supabase.auth
        .updateUser({
          data: {
            [metaKey]: updatedMeta,
          },
        })
        .catch(() => null)
    } catch {
      // Non-blocking fallback
    }
  }

  revalidatePath("/dashboard/pos")
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/customers")
  return {
    success: true,
    data,
  }
}
