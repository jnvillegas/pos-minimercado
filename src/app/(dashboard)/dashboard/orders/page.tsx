import React from "react"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getActiveBusinessContext } from "@/lib/auth/business-context"
import { OrdersView, FoodOrderRecord } from "./orders-view"

export const instant = false

export default async function OrdersPage() {
  await connection()
  const { user, business, role } = await getActiveBusinessContext()
  const supabase = await createClient()

  // Resilient query: fetch recent sales and their items
  type RawCustomer = { id: string; name: string; phone?: string | null }
  let rawSales: Array<{
    id: string
    created_at: string
    total_amount: number
    payment_method: string
    status: string
    delivery_status?: string | null
    customer_id?: string | null
    customers?: RawCustomer | RawCustomer[] | null
    sale_items?: Array<{
      id: string
      product_name: string
      quantity: number
      unit_price: number
      subtotal: number
    }>
  }> = []

  const { data: salesData, error: salesError } = await supabase
    .from("sales")
    .select(`
      id,
      created_at,
      total_amount,
      payment_method,
      status,
      delivery_status,
      customer_id,
      customers ( id, name, phone ),
      sale_items ( id, product_name, quantity, unit_price, subtotal )
    `)
    .eq("business_id", business.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(100)

  if (!salesError && salesData) {
    rawSales = salesData as typeof rawSales
  } else {
    // Graceful fallback if delivery_status column not yet migrated in Supabase Cloud
    const { data: fallbackSales } = await supabase
      .from("sales")
      .select(`
        id,
        created_at,
        total_amount,
        payment_method,
        status,
        customer_id,
        customers ( id, name, phone ),
        sale_items ( id, product_name, quantity, unit_price, subtotal )
      `)
      .eq("business_id", business.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(100)

    rawSales = (fallbackSales as typeof rawSales) || []
  }

  // Metadata override fallback for unmigrated instances
  const metaStatusKey = `business_orders_status_${business.id}`
  const metaStatuses =
    (user.user_metadata?.[metaStatusKey] as Record<string, "pending" | "delivered">) || {}

  const orders: FoodOrderRecord[] = rawSales.map((sale, idx) => {
    // Delivery status priority: metadata override > database column > default "pending" for recent food sales, or "delivered"
    let status: "pending" | "delivered" = "delivered"
    if (metaStatuses[sale.id]) {
      status = metaStatuses[sale.id]
    } else if (sale.delivery_status === "pending" || sale.delivery_status === "delivered") {
      status = sale.delivery_status
    }

    const customerObj = Array.isArray(sale.customers)
      ? sale.customers[0]
      : sale.customers

    return {
      id: sale.id,
      ticketNumber: `#${sale.id.slice(0, 6).toUpperCase()}`,
      createdAt: sale.created_at,
      totalAmount: Number(sale.total_amount),
      paymentMethod: sale.payment_method,
      deliveryStatus: status,
      customerName: customerObj?.name || null,
      customerPhone: customerObj?.phone || null,
      items: (sale.sale_items || []).map((item) => ({
        id: item.id,
        productName: item.product_name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        subtotal: Number(item.subtotal),
      })),
    }
  })

  return (
    <OrdersView
      businessId={business.id}
      businessName={business.name}
      industry={business.industry}
      currency={business.currency || "ARS"}
      initialOrders={orders}
    />
  )
}
