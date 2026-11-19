"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { movementSchema, MovementInput } from "@/lib/validations/movement"

export async function createCashMovementAction(
  input: MovementInput,
  businessId: string
) {
  const parsed = movementSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Datos del movimiento inválidos" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  let shiftId: string | null = null

  // If affect_shift is true and payment method is cash, associate with active open shift
  if (parsed.data.affect_shift && parsed.data.payment_method === "cash") {
    const { data: openShift } = await supabase
      .from("cash_shifts")
      .select("id")
      .eq("business_id", businessId)
      .eq("status", "open")
      .limit(1)
      .maybeSingle()

    if (openShift) {
      shiftId = openShift.id
    }
  }

  const { data, error } = await supabase
    .from("cash_movements")
    .insert({
      business_id: businessId,
      shift_id: shiftId,
      user_id: user.id,
      type: parsed.data.type,
      category: parsed.data.category,
      concept: parsed.data.concept,
      amount: parsed.data.amount,
      payment_method: parsed.data.payment_method,
      notes: parsed.data.notes || null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message || "Error al registrar el movimiento" }
  }

  revalidatePath("/dashboard/movements")
  revalidatePath("/dashboard/cash-register")
  revalidatePath("/dashboard")
  return { success: true, data }
}

export async function deleteCashMovementAction(
  movementId: string,
  businessId: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  const { error } = await supabase
    .from("cash_movements")
    .delete()
    .eq("id", movementId)
    .eq("business_id", businessId)

  if (error) {
    return { error: error.message || "Error al eliminar el movimiento" }
  }

  revalidatePath("/dashboard/movements")
  revalidatePath("/dashboard/cash-register")
  revalidatePath("/dashboard")
  return { success: true }
}
