import React from "react"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getActiveBusinessContext } from "@/lib/auth/business-context"
import {
  InventoryManager,
  ProductRecord,
  CategoryRecord,
  SupplierRecordOption,
} from "./inventory-manager"

export const instant = false

export default async function InventoryPage() {
  await connection()
  const { business } = await getActiveBusinessContext()

  const supabase = await createClient()

  // Fetch categories
  const { data: rawCategories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("business_id", business.id)
    .order("name", { ascending: true })

  // Fetch active suppliers
  let rawSuppliers: { id: string; name: string }[] | null = null
  try {
    const res = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("name", { ascending: true })
    rawSuppliers = res.data
  } catch {
    rawSuppliers = []
  }

  // Fetch products (all active products for this business)
  let rawProducts: Record<string, unknown>[] | null = null
  const primaryProductsRes = await supabase
    .from("products")
    .select(
      "id, name, barcode, category_id, supplier_id, cost_price, sale_price, stock, min_stock, image_url, is_active"
    )
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (!primaryProductsRes.error && primaryProductsRes.data) {
    rawProducts = primaryProductsRes.data as Record<string, unknown>[]
  } else {
    // Fallback if supplier_id column is missing on remote DB
    const fallbackRes = await supabase
      .from("products")
      .select(
        "id, name, barcode, category_id, cost_price, sale_price, stock, min_stock, image_url, is_active"
      )
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("name", { ascending: true })
    rawProducts = fallbackRes.data as Record<string, unknown>[] | null
  }

  const products: ProductRecord[] = (rawProducts || []).map((p) => ({
    id: String(p.id),
    name: String(p.name),
    barcode: p.barcode ? String(p.barcode) : null,
    category_id: p.category_id ? String(p.category_id) : null,
    supplier_id: p.supplier_id ? String(p.supplier_id) : null,
    cost_price: Number(p.cost_price),
    sale_price: Number(p.sale_price),
    stock: Number(p.stock),
    min_stock: Number(p.min_stock),
    image_url: p.image_url ? String(p.image_url) : null,
    is_active: Boolean(p.is_active),
  }))

  const categories: CategoryRecord[] = (rawCategories || []).map((c) => ({
    id: c.id,
    name: c.name,
  }))

  const suppliers: SupplierRecordOption[] = (rawSuppliers || []).map((s) => ({
    id: s.id,
    name: s.name,
  }))

  return (
    <div className="space-y-6">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1F1F1F]">
            Inventario y Stock
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Control de productos, costos, precios de venta, margen comercial, proveedores y alertas de stock
          </p>
        </div>
      </div>

      <InventoryManager
        initialProducts={products}
        initialCategories={categories}
        initialSuppliers={suppliers}
        businessId={business.id}
        currency={business.currency || "ARS"}
        industry={business.industry}
      />
    </div>
  )
}
