import React from "react"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getActiveBusinessContext } from "@/lib/auth/business-context"
import { PosTerminal, ProductItem, CategoryItem, CustomerPosItem } from "./pos-terminal"

export const instant = false

export default async function PosPage() {
  await connection()
  const { business, user } = await getActiveBusinessContext()

  const supabase = await createClient()

  // Fetch categories
  const { data: rawCategories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("business_id", business.id)
    .order("name", { ascending: true })

  // Fetch active products
  const { data: rawProducts } = await supabase
    .from("products")
    .select("id, name, barcode, sale_price, cost_price, stock, category_id")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("name", { ascending: true })

  // Fetch active customers for credit / fiado sales
  let dbCustomers: CustomerPosItem[] = []
  try {
    const { data: rawCustomers } = await supabase
      .from("customers")
      .select("id, name, phone, dni_cuil, current_debt, credit_limit")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (rawCustomers) {
      dbCustomers = rawCustomers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || "",
        dni_cuil: c.dni_cuil || "",
        current_debt: Number(c.current_debt || 0),
        credit_limit: Number(c.credit_limit || 0),
      }))
    }
  } catch {
    dbCustomers = []
  }

  // Fallback to user metadata
  const metaCustomers =
    (user?.user_metadata?.[`business_customers_${business.id}`] as Array<{
      id: string
      name: string
      phone?: string
      dni_cuil?: string
      current_debt?: number
      credit_limit?: number
      is_active?: boolean
    }>) || []

  const combinedMap = new Map<string, CustomerPosItem>()
  metaCustomers
    .filter((c) => c.is_active !== false)
    .forEach((c) => {
      combinedMap.set(c.id, {
        id: c.id,
        name: c.name,
        phone: c.phone || "",
        dni_cuil: c.dni_cuil || "",
        current_debt: Number(c.current_debt || 0),
        credit_limit: Number(c.credit_limit || 0),
      })
    })
  dbCustomers.forEach((c) => combinedMap.set(c.id, c))

  // Auto-sync missing metadata customers to PostgreSQL table now that table exists
  const missingInDb = metaCustomers.filter((mc) => !dbCustomers.some((dc) => dc.id === mc.id))
  if (missingInDb.length > 0) {
    try {
      await supabase.from("customers").upsert(
        missingInDb.map((c) => ({
          id: c.id,
          business_id: business.id,
          name: c.name,
          phone: c.phone || "",
          email: "",
          dni_cuil: c.dni_cuil || "",
          address: "",
          current_debt: Number(c.current_debt || 0),
          credit_limit: Number(c.credit_limit || 0),
          notes: "",
          is_active: c.is_active ?? true,
        })),
        { onConflict: "id" }
      )
    } catch {
      // Non-blocking
    }
  }

  const customers: CustomerPosItem[] = Array.from(combinedMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  )

  const products: ProductItem[] = (rawProducts || []).map((p) => ({
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    sale_price: Number(p.sale_price),
    cost_price: Number(p.cost_price),
    stock: Number(p.stock),
    category_id: p.category_id,
  }))

  const categories: CategoryItem[] = (rawCategories || []).map((c) => ({
    id: c.id,
    name: c.name,
  }))

  return (
    <PosTerminal
      businessId={business.id}
      businessName={business.name}
      currency={business.currency || "ARS"}
      initialProducts={products}
      categories={categories}
      initialCustomers={customers}
    />
  )
}
