import React from "react"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getActiveBusinessContext } from "@/lib/auth/business-context"
import { PosTerminal, ProductItem, CategoryItem } from "./pos-terminal"

export const instant = false

export default async function PosPage() {
  await connection()
  const { business } = await getActiveBusinessContext()

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
      currency={business.currency}
      initialProducts={products}
      categories={categories}
    />
  )
}
