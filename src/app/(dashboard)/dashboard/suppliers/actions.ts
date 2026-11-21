"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { supplierSchema, SupplierInput } from "@/lib/validations/product"

export interface SupplierRecord {
  id: string
  business_id: string
  name: string
  contact_name: string
  phone: string
  email: string
  cuit: string
  delivery_days: string
  payment_info: string
  notes: string
  is_active: boolean
  created_at?: string
  products_count?: number
}

export async function createSupplierAction(input: SupplierInput, businessId: string) {
  const parsed = supplierSchema.safeParse(input)
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

  const supplierData = {
    business_id: businessId,
    name: parsed.data.name.trim(),
    contact_name: parsed.data.contact_name?.trim() || "",
    phone: parsed.data.phone?.trim() || "",
    email: parsed.data.email?.trim() || "",
    cuit: parsed.data.cuit?.trim() || "",
    delivery_days: parsed.data.delivery_days?.trim() || "",
    payment_info: parsed.data.payment_info?.trim() || "",
    notes: parsed.data.notes?.trim() || "",
    is_active: parsed.data.is_active ?? true,
  }

  // 1. Try DB insert
  let insertedSupplier: SupplierRecord | null = null
  const { data, error } = await supabase
    .from("suppliers")
    .insert(supplierData)
    .select()
    .single()

  if (!error && data) {
    insertedSupplier = data as SupplierRecord
  } else {
    // 2. Metadata fallback (for unmigrated cloud instances)
    const newId = crypto.randomUUID()
    insertedSupplier = {
      id: newId,
      ...supplierData,
      created_at: new Date().toISOString(),
    }

    const currentMetaSuppliers =
      (user.user_metadata?.[`business_suppliers_${businessId}`] as SupplierRecord[]) || []
    await supabase.auth
      .updateUser({
        data: {
          [`business_suppliers_${businessId}`]: [...currentMetaSuppliers, insertedSupplier],
        },
      })
      .catch(() => null)
  }

  revalidatePath("/dashboard/suppliers")
  revalidatePath("/dashboard/inventory")
  return { success: true, data: insertedSupplier }
}

export async function updateSupplierAction(
  supplierId: string,
  input: SupplierInput,
  businessId: string
) {
  const parsed = supplierSchema.safeParse(input)
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
    contact_name: parsed.data.contact_name?.trim() || "",
    phone: parsed.data.phone?.trim() || "",
    email: parsed.data.email?.trim() || "",
    cuit: parsed.data.cuit?.trim() || "",
    delivery_days: parsed.data.delivery_days?.trim() || "",
    payment_info: parsed.data.payment_info?.trim() || "",
    notes: parsed.data.notes?.trim() || "",
    is_active: parsed.data.is_active ?? true,
    updated_at: new Date().toISOString(),
  }

  // 1. Try DB update
  let updatedSupplier: SupplierRecord | null = null
  const { data, error } = await supabase
    .from("suppliers")
    .update(updateData)
    .eq("id", supplierId)
    .eq("business_id", businessId)
    .select()
    .maybeSingle()

  if (!error && data) {
    updatedSupplier = data as SupplierRecord
  }

  // 2. Metadata fallback update
  const currentMetaSuppliers =
    (user.user_metadata?.[`business_suppliers_${businessId}`] as SupplierRecord[]) || []
  if (currentMetaSuppliers.length > 0 || !updatedSupplier) {
    const updatedList = currentMetaSuppliers.map((s) =>
      s.id === supplierId ? { ...s, ...updateData } : s
    )
    if (!updatedList.some((s) => s.id === supplierId) && updatedSupplier) {
      updatedList.push(updatedSupplier)
    }
    await supabase.auth
      .updateUser({
        data: {
          [`business_suppliers_${businessId}`]: updatedList,
        },
      })
      .catch(() => null)
  }

  revalidatePath("/dashboard/suppliers")
  revalidatePath("/dashboard/inventory")
  return { success: true, data: updatedSupplier }
}

export async function deleteSupplierAction(supplierId: string, businessId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  // Check if any product is using this supplier
  let productCount = 0
  try {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("supplier_id", supplierId)
    productCount = count || 0
  } catch {
    productCount = 0
  }

  if (productCount > 0) {
    // Soft delete to avoid breaking product references
    try {
      await supabase
        .from("suppliers")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", supplierId)
        .eq("business_id", businessId)
    } catch {
      // Ignore
    }
  } else {
    // Hard delete
    try {
      await supabase
        .from("suppliers")
        .delete()
        .eq("id", supplierId)
        .eq("business_id", businessId)
    } catch {
      // Ignore
    }
  }

  // Metadata cleanup
  const currentMetaSuppliers =
    (user.user_metadata?.[`business_suppliers_${businessId}`] as SupplierRecord[]) || []
  if (currentMetaSuppliers.length > 0) {
    const updatedList = currentMetaSuppliers.filter((s) => s.id !== supplierId)
    await supabase.auth
      .updateUser({
        data: {
          [`business_suppliers_${businessId}`]: updatedList,
        },
      })
      .catch(() => null)
  }

  revalidatePath("/dashboard/suppliers")
  revalidatePath("/dashboard/inventory")
  return { success: true }
}
