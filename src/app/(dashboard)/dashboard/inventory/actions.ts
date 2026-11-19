"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { Json } from "@/lib/supabase/database.types"
import {
  productSchema,
  categorySchema,
  stockAdjustmentSchema,
  ProductInput,
  SpreadsheetProductRow,
} from "@/lib/validations/product"

export async function createProductAction(input: ProductInput, businessId: string) {
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Datos inválidos" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  const productData = {
    business_id: businessId,
    name: parsed.data.name,
    barcode: parsed.data.barcode || null,
    category_id: parsed.data.category_id || null,
    cost_price: parsed.data.cost_price,
    sale_price: parsed.data.sale_price,
    stock: parsed.data.stock,
    min_stock: parsed.data.min_stock,
    image_url: parsed.data.image_url || null,
    is_active: parsed.data.is_active,
  }

  const { data, error } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un producto con ese código de barras en tu negocio" }
    }
    return { error: error.message || "Error al crear el producto" }
  }

  revalidatePath("/dashboard/inventory")
  revalidatePath("/dashboard/pos")
  return { success: true, data }
}

export async function updateProductAction(
  productId: string,
  input: ProductInput,
  businessId: string
) {
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Datos inválidos" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  const updateData = {
    name: parsed.data.name,
    barcode: parsed.data.barcode || null,
    category_id: parsed.data.category_id || null,
    cost_price: parsed.data.cost_price,
    sale_price: parsed.data.sale_price,
    stock: parsed.data.stock,
    min_stock: parsed.data.min_stock,
    image_url: parsed.data.image_url || null,
    is_active: parsed.data.is_active,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", productId)
    .eq("business_id", businessId)
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe otro producto con ese código de barras" }
    }
    return { error: error.message || "Error al actualizar el producto" }
  }

  revalidatePath("/dashboard/inventory")
  revalidatePath("/dashboard/pos")
  return { success: true, data }
}

export async function deleteProductAction(productId: string, businessId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  // Soft delete by marking is_active = false
  const { error } = await supabase
    .from("products")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("business_id", businessId)

  if (error) {
    return { error: error.message || "Error al eliminar el producto" }
  }

  revalidatePath("/dashboard/inventory")
  revalidatePath("/dashboard/pos")
  return { success: true }
}

export async function createCategoryAction(name: string, businessId: string) {
  const parsed = categorySchema.safeParse({ name })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Nombre inválido" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      business_id: businessId,
      name: parsed.data.name,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe una categoría con ese nombre" }
    }
    return { error: error.message || "Error al crear la categoría" }
  }

  revalidatePath("/dashboard/inventory")
  revalidatePath("/dashboard/pos")
  return { success: true, data }
}

export async function adjustStockAction(productId: string, delta: number, reason: string = "manual_adjustment") {
  const parsed = stockAdjustmentSchema.safeParse({ productId, delta, reason })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Ajuste inválido" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  const { data, error } = await supabase.rpc("adjust_product_stock", {
    p_product_id: parsed.data.productId,
    p_delta: parsed.data.delta,
    p_reason: parsed.data.reason,
  })

  if (error) {
    return { error: error.message || "Error al ajustar el stock" }
  }

  revalidatePath("/dashboard/inventory")
  revalidatePath("/dashboard/pos")
  return { success: true, data }
}

export async function importProductsAction(businessId: string, rows: SpreadsheetProductRow[]) {
  if (!rows || rows.length === 0) {
    return { error: "No hay productos para importar" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  const { data, error } = await supabase.rpc("batch_import_products", {
    p_business_id: businessId,
    p_rows: rows as unknown as Json,
  })

  if (error) {
    return { error: error.message || "Error al importar productos" }
  }

  revalidatePath("/dashboard/inventory")
  revalidatePath("/dashboard/pos")
  return { success: true, data }
}
