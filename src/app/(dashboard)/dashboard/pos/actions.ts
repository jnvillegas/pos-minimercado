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
  paymentMethod: "cash" | "transfer" | "debit_card" | "credit_card"
  discountAmount?: number
  discountType?: "percentage" | "fixed" | null
  amountTendered?: number | null
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

  const { data, error } = await supabase.rpc("create_sale", {
    p_business_id: input.businessId,
    p_items: input.items,
    p_payment_method: input.paymentMethod,
    p_discount_amount: input.discountAmount || 0,
    p_discount_type: input.discountType || null,
    p_amount_tendered: input.amountTendered || null,
  })

  if (error) {
    return {
      error: error.message || "Error al registrar la venta",
    }
  }

  revalidatePath("/dashboard/pos")
  revalidatePath("/dashboard")
  return {
    success: true,
    data,
  }
}
