import React from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { InventoryManager, ProductRecord, CategoryRecord } from "./inventory-manager"

export const instant = false

export default async function InventoryPage() {
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch active business
  const { data: members } = await supabase
    .from("business_members")
    .select(`
      role,
      businesses (
        id,
        name,
        currency
      )
    `)
    .eq("user_id", user.id)
    .limit(1)

  const membership = members?.[0]
  const business = Array.isArray(membership?.businesses)
    ? membership?.businesses[0]
    : membership?.businesses

  if (!business) {
    redirect("/onboarding")
  }

  // Fetch categories
  const { data: rawCategories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("business_id", business.id)
    .order("name", { ascending: true })

  // Fetch products (all active products for this business)
  const { data: rawProducts } = await supabase
    .from("products")
    .select(
      "id, name, barcode, category_id, cost_price, sale_price, stock, min_stock, image_url, is_active"
    )
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("name", { ascending: true })

  const products: ProductRecord[] = (rawProducts || []).map((p) => ({
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    category_id: p.category_id,
    cost_price: Number(p.cost_price),
    sale_price: Number(p.sale_price),
    stock: Number(p.stock),
    min_stock: Number(p.min_stock),
    image_url: p.image_url,
    is_active: p.is_active,
  }))

  const categories: CategoryRecord[] = (rawCategories || []).map((c) => ({
    id: c.id,
    name: c.name,
  }))

  return (
    <div className="space-y-6">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Inventario y Stock
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Control de productos, costos, precios de venta, margen comercial y alertas de stock
          </p>
        </div>
      </div>

      <InventoryManager
        initialProducts={products}
        initialCategories={categories}
        businessId={business.id}
        currency={business.currency || "ARS"}
      />
    </div>
  )
}
