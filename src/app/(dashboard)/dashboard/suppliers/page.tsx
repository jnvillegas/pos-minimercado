import React from "react"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getActiveBusinessContext } from "@/lib/auth/business-context"
import { SuppliersView } from "./suppliers-view"
import { SupplierRecord } from "./actions"

export const instant = false

export default async function SuppliersPage() {
  await connection()
  const { business, user } = await getActiveBusinessContext()

  const supabase = await createClient()

  // 1. Fetch suppliers from DB table
  let dbSuppliers: SupplierRecord[] = []
  try {
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .eq("business_id", business.id)
      .order("name", { ascending: true })

    if (data) {
      dbSuppliers = data as SupplierRecord[]
    }
  } catch {
    dbSuppliers = []
  }

  // 2. Fetch metadata fallback (in case remote migrations are not yet applied)
  const metaSuppliers =
    (user.user_metadata?.[`business_suppliers_${business.id}`] as SupplierRecord[]) || []

  // Combine DB & Metadata suppliers (avoiding duplicate IDs)
  const combinedMap = new Map<string, SupplierRecord>()
  metaSuppliers.forEach((s) => combinedMap.set(s.id, s))
  dbSuppliers.forEach((s) => combinedMap.set(s.id, s))

  let suppliersList = Array.from(combinedMap.values())

  // Default seed if totally empty so user sees examples
  if (suppliersList.length === 0) {
    suppliersList = []
  }

  // 3. Count products linked per supplier
  try {
    const { data: prodData } = await supabase
      .from("products")
      .select("supplier_id")
      .eq("business_id", business.id)
      .eq("is_active", true)

    if (prodData) {
      const counts: Record<string, number> = {}
      prodData.forEach((p) => {
        if (p.supplier_id) {
          counts[p.supplier_id] = (counts[p.supplier_id] || 0) + 1
        }
      })

      suppliersList = suppliersList.map((s) => ({
        ...s,
        products_count: counts[s.id] || 0,
      }))
    }
  } catch {
    // If supplier_id column is not yet present on remote DB
  }

  return (
    <SuppliersView
      initialSuppliers={suppliersList}
      businessName={business.name}
      businessId={business.id}
    />
  )
}
