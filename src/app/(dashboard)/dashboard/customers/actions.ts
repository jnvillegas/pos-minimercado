"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  customerSchema,
  customerPaymentSchema,
  CustomerInput,
  CustomerPaymentInput,
} from "@/lib/validations/customer"

export interface CustomerRecord {
  id: string
  business_id: string
  name: string
  phone: string
  email: string
  dni_cuil: string
  address: string
  current_debt: number
  credit_limit: number
  notes: string
  is_active: boolean
  created_at?: string
  last_movement_at?: string
}

export interface CustomerMovementRecord {
  id: string
  customer_id: string
  type: "charge" | "payment" | "adjustment"
  amount: number
  balance_after: number
  payment_method?: string | null
  notes: string
  created_at: string
}

export async function createCustomerAction(input: CustomerInput, businessId: string) {
  const parsed = customerSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Datos inválidos" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  const customerData = {
    business_id: businessId,
    name: parsed.data.name.trim(),
    phone: parsed.data.phone?.trim() || "",
    email: parsed.data.email?.trim() || "",
    dni_cuil: parsed.data.dni_cuil?.trim() || "",
    address: parsed.data.address?.trim() || "",
    current_debt: 0.0,
    credit_limit: Number(parsed.data.credit_limit) || 0.0,
    notes: parsed.data.notes?.trim() || "",
    is_active: parsed.data.is_active ?? true,
  }

  let insertedCustomer: CustomerRecord | null = null
  const { data, error } = await supabase
    .from("customers")
    .insert(customerData)
    .select()
    .single()

  if (!error && data) {
    insertedCustomer = data as CustomerRecord
  } else {
    // Metadata fallback for unmigrated cloud instances
    const newId = crypto.randomUUID()
    insertedCustomer = {
      id: newId,
      ...customerData,
      created_at: new Date().toISOString(),
    }

    const currentMeta =
      (user.user_metadata?.[`business_customers_${businessId}`] as CustomerRecord[]) || []
    await supabase.auth
      .updateUser({
        data: {
          [`business_customers_${businessId}`]: [...currentMeta, insertedCustomer],
        },
      })
      .catch(() => null)
  }

  revalidatePath("/dashboard/customers")
  revalidatePath("/dashboard/pos")
  return { success: true, data: insertedCustomer }
}

export async function updateCustomerAction(
  customerId: string,
  input: CustomerInput,
  businessId: string
) {
  const parsed = customerSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Datos inválidos" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  const updateData = {
    name: parsed.data.name.trim(),
    phone: parsed.data.phone?.trim() || "",
    email: parsed.data.email?.trim() || "",
    dni_cuil: parsed.data.dni_cuil?.trim() || "",
    address: parsed.data.address?.trim() || "",
    credit_limit: Number(parsed.data.credit_limit) || 0.0,
    notes: parsed.data.notes?.trim() || "",
    is_active: parsed.data.is_active ?? true,
    updated_at: new Date().toISOString(),
  }

  let updatedCustomer: CustomerRecord | null = null
  const { data, error } = await supabase
    .from("customers")
    .update(updateData)
    .eq("id", customerId)
    .eq("business_id", businessId)
    .select()
    .maybeSingle()

  if (!error && data) {
    updatedCustomer = data as CustomerRecord
  }

  // Metadata fallback update
  const currentMeta =
    (user.user_metadata?.[`business_customers_${businessId}`] as CustomerRecord[]) || []
  if (currentMeta.length > 0 || !updatedCustomer) {
    const updatedList = currentMeta.map((c) =>
      c.id === customerId ? { ...c, ...updateData } : c
    )
    if (!updatedList.some((c) => c.id === customerId) && updatedCustomer) {
      updatedList.push(updatedCustomer)
    }
    await supabase.auth
      .updateUser({
        data: {
          [`business_customers_${businessId}`]: updatedList,
        },
      })
      .catch(() => null)
  }

  revalidatePath("/dashboard/customers")
  revalidatePath("/dashboard/pos")
  return { success: true, data: updatedCustomer }
}

export async function deleteCustomerAction(customerId: string, businessId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  // Check debt or sales
  const { data: customer } = await supabase
    .from("customers")
    .select("current_debt")
    .eq("id", customerId)
    .eq("business_id", businessId)
    .maybeSingle()

  if (customer && Number(customer.current_debt) > 0) {
    return {
      error: `No podés eliminar este cliente porque tiene un saldo deudor pendiente de $${Number(
        customer.current_debt
      ).toLocaleString("es-AR")}. Registrá la cancelación del saldo primero.`,
    }
  }

  // Soft delete
  try {
    await supabase
      .from("customers")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", customerId)
      .eq("business_id", businessId)
  } catch {
    // Ignore if table missing
  }

  // Metadata cleanup
  const currentMeta =
    (user.user_metadata?.[`business_customers_${businessId}`] as CustomerRecord[]) || []
  if (currentMeta.length > 0) {
    const updatedList = currentMeta.filter((c) => c.id !== customerId)
    await supabase.auth
      .updateUser({
        data: {
          [`business_customers_${businessId}`]: updatedList,
        },
      })
      .catch(() => null)
  }

  revalidatePath("/dashboard/customers")
  revalidatePath("/dashboard/pos")
  return { success: true }
}

export async function registerCustomerPaymentAction(
  input: CustomerPaymentInput,
  businessId: string
) {
  const parsed = customerPaymentSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Datos inválidos" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  // Fetch current debt
  const { data: customer, error: custErr } = await supabase
    .from("customers")
    .select("id, name, current_debt")
    .eq("id", parsed.data.customerId)
    .eq("business_id", businessId)
    .maybeSingle()

  const currentDebt = customer ? Number(customer.current_debt || 0) : 0
  const paymentAmount = parsed.data.amount
  const newDebt = Math.max(0, currentDebt - paymentAmount)

  // 1. Update customer current_debt
  if (customer) {
    await supabase
      .from("customers")
      .update({
        current_debt: newDebt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customer.id)
  }

  // 2. Insert account movement
  try {
    await supabase.from("customer_account_movements").insert({
      business_id: businessId,
      customer_id: parsed.data.customerId,
      user_id: user.id,
      type: "payment",
      amount: paymentAmount,
      balance_after: newDebt,
      payment_method: parsed.data.paymentMethod,
      notes: parsed.data.notes?.trim() || "Entrega / Pago a cuenta",
    })
  } catch {
    // Ignore if table unmigrated
  }

  // 3. Fallback sync in user metadata
  const currentMeta =
    (user.user_metadata?.[`business_customers_${businessId}`] as CustomerRecord[]) || []
  if (currentMeta.length > 0) {
    const updatedList = currentMeta.map((c) =>
      c.id === parsed.data.customerId ? { ...c, current_debt: newDebt } : c
    )
    await supabase.auth
      .updateUser({
        data: {
          [`business_customers_${businessId}`]: updatedList,
        },
      })
      .catch(() => null)
  }

  revalidatePath("/dashboard/customers")
  revalidatePath("/dashboard/pos")
  return { success: true, newDebt }
}

export async function fetchCustomerMovementsAction(
  customerId: string,
  businessId: string
): Promise<{ movements: CustomerMovementRecord[] }> {
  const supabase = await createClient()

  try {
    const { data } = await supabase
      .from("customer_account_movements")
      .select("id, customer_id, type, amount, balance_after, payment_method, notes, created_at")
      .eq("customer_id", customerId)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (data) {
      return {
        movements: data.map((m) => ({
          id: String(m.id),
          customer_id: String(m.customer_id),
          type: m.type as "charge" | "payment" | "adjustment",
          amount: Number(m.amount),
          balance_after: Number(m.balance_after),
          payment_method: m.payment_method ? String(m.payment_method) : null,
          notes: String(m.notes || ""),
          created_at: String(m.created_at),
        })),
      }
    }
  } catch {
    // Return empty on unmigrated table
  }

  return { movements: [] }
}
