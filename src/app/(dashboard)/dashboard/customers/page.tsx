import React from "react"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getActiveBusinessContext } from "@/lib/auth/business-context"
import { CustomersView } from "./customers-view"
import { CustomerRecord } from "./actions"

export const instant = false

export default async function CustomersPage() {
  await connection()
  const { business, user } = await getActiveBusinessContext()

  const supabase = await createClient()

  // 1. Fetch customers from DB table
  let dbCustomers: CustomerRecord[] = []
  try {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("business_id", business.id)
      .order("name", { ascending: true })

    if (data) {
      dbCustomers = data as CustomerRecord[]
    }
  } catch {
    dbCustomers = []
  }

  // 2. Fetch metadata fallback (in case remote migrations are not yet applied)
  const metaCustomers =
    (user.user_metadata?.[`business_customers_${business.id}`] as CustomerRecord[]) || []

  // Combine DB & Metadata customers (avoiding duplicate IDs, DB takes precedence)
  const combinedMap = new Map<string, CustomerRecord>()
  metaCustomers.forEach((c) => combinedMap.set(c.id, c))
  dbCustomers.forEach((c) => combinedMap.set(c.id, c))

  const customersList = Array.from(combinedMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  )

  return (
    <CustomersView
      initialCustomers={customersList}
      businessName={business.name}
      businessId={business.id}
      currency={business.currency || "ARS"}
    />
  )
}
