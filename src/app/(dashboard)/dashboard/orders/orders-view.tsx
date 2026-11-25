"use client"

import React, { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  Search,
  RotateCcw,
  ShoppingBag,
  User,
  Phone,
  Flame,
  AlertCircle,
  Banknote,
  QrCode,
  CreditCard,
  Wallet,
  ChevronRight,
  RefreshCw,
} from "lucide-react"
import { updateSaleDeliveryStatusAction } from "@/app/(dashboard)/dashboard/pos/actions"
import { getBusinessTheme } from "@/lib/theme/business-theme"

export interface FoodOrderItem {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface FoodOrderRecord {
  id: string
  ticketNumber: string
  createdAt: string
  totalAmount: number
  paymentMethod: string
  deliveryStatus: "pending" | "delivered"
  customerName: string | null
  customerPhone: string | null
  items: FoodOrderItem[]
}

interface OrdersViewProps {
  businessId: string
  businessName: string
  industry?: string | null
  currency: string
  initialOrders: FoodOrderRecord[]
}

export function OrdersView({
  businessId,
  businessName,
  industry,
  currency,
  initialOrders,
}: OrdersViewProps) {
  const router = useRouter()
  const theme = getBusinessTheme(industry)
  const [orders, setOrders] = useState<FoodOrderRecord[]>(initialOrders)
  const [filterTab, setFilterTab] = useState<"pending" | "delivered" | "all">("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  // Status toggle handler with optimistic update
  const handleToggleStatus = (orderId: string, newStatus: "pending" | "delivered") => {
    setActionError(null)

    // Optimistic UI update
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, deliveryStatus: newStatus } : ord))
    )

    startTransition(async () => {
      const res = await updateSaleDeliveryStatusAction(orderId, newStatus, businessId)
      if (res?.error) {
        setActionError(res.error)
        // Rollback on failure
        setOrders(initialOrders)
      } else {
        router.refresh()
      }
    })
  }

  // Filter calculations
  const pendingCount = orders.filter((o) => o.deliveryStatus === "pending").length
  const deliveredCount = orders.filter((o) => o.deliveryStatus === "delivered").length

  const filteredOrders = orders.filter((order) => {
    // 1. Tab filter
    if (filterTab === "pending" && order.deliveryStatus !== "pending") return false
    if (filterTab === "delivered" && order.deliveryStatus !== "delivered") return false

    // 2. Search query filter
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true

    const matchesTicket = order.ticketNumber.toLowerCase().includes(q)
    const matchesCustomer =
      order.customerName?.toLowerCase().includes(q) ||
      order.customerPhone?.toLowerCase().includes(q)
    const matchesItems = order.items.some((it) => it.productName.toLowerCase().includes(q))

    return matchesTicket || matchesCustomer || matchesItems
  })

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "Recién"
    if (diffMins < 60) return `Hace ${diffMins} min`
    const hours = Math.floor(diffMins / 60)
    return `Hace ${hours}h`
  }

  const formatHour = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case "cash":
        return { label: "Efectivo", icon: Banknote, color: "text-emerald-700 bg-emerald-50 border-emerald-200" }
      case "transfer":
        return { label: "Transferencia / QR", icon: QrCode, color: "text-blue-700 bg-blue-50 border-blue-200" }
      case "debit_card":
        return { label: "Tarjeta Débito", icon: CreditCard, color: "text-neutral-700 bg-neutral-100 border-neutral-200" }
      case "credit_card":
        return { label: "Tarjeta Crédito", icon: CreditCard, color: "text-neutral-700 bg-neutral-100 border-neutral-200" }
      case "credit":
        return { label: "Fiado", icon: Wallet, color: "text-purple-700 bg-purple-50 border-purple-200" }
      default:
        return { label: method, icon: Banknote, color: "text-neutral-700 bg-neutral-100 border-neutral-200" }
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white border border-neutral-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#1F1F1F]">
                Despacho de Pedidos
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                Rotisería & Comida
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5 font-medium">
              Control simple de comandas en mostrador: marcá lo que está pendiente y lo que ya entregaste.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/dashboard/pos"
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Abrir POS & cobrar</span>
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setFilterTab("pending")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterTab === "pending"
              ? "bg-amber-500/10 border-amber-500/30 ring-2 ring-amber-500/20"
              : "bg-white border-neutral-200/80 hover:bg-neutral-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              No entregados
            </span>
            <span className="text-2xl font-black text-amber-700">{pendingCount}</span>
          </div>
          <span className="text-[11px] text-amber-800/80 mt-1 block font-medium">
            Pendientes de entrega
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab("delivered")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterTab === "delivered"
              ? "bg-emerald-500/10 border-emerald-500/30 ring-2 ring-emerald-500/20"
              : "bg-white border-neutral-200/80 hover:bg-neutral-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Entregados
            </span>
            <span className="text-2xl font-black text-emerald-700">{deliveredCount}</span>
          </div>
          <span className="text-[11px] text-emerald-800/80 mt-1 block font-medium">
            Despachados
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab("all")}
          className={`col-span-2 sm:col-span-1 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterTab === "all"
              ? "bg-neutral-100 border-neutral-300 ring-2 ring-neutral-300/40"
              : "bg-white border-neutral-200/80 hover:bg-neutral-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-700">Total registrados</span>
            <span className="text-2xl font-black text-neutral-800">{orders.length}</span>
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block font-medium">
            Historial reciente
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-neutral-200/80">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterTab("pending")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === "pending"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("delivered")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === "delivered"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Entregados ({deliveredCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === "all"
                ? "bg-neutral-900 text-white shadow-xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Todos ({orders.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por ticket, plato o cliente..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-[#1F1F1F] placeholder:text-neutral-400 outline-none focus:border-rose-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Orders List / Cards Grid */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-neutral-200/80 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center">
            {filterTab === "pending" ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            ) : (
              <UtensilsCrossed className="w-7 h-7" />
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-neutral-800 text-base">
              {filterTab === "pending"
                ? "¡No hay pedidos pendientes de entrega!"
                : "No se encontraron pedidos con este filtro"}
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              {filterTab === "pending"
                ? "Todas las comandas fueron entregadas o podés registrar un nuevo pedido en el POS."
                : "Probá cambiando el texto de búsqueda o el filtro de estado."}
            </p>
          </div>
          <Link
            href="/dashboard/pos"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Crear nuevo pedido en POS</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isDelivered = order.deliveryStatus === "delivered"
            const paymentInfo = getPaymentLabel(order.paymentMethod)
            const PaymentIcon = paymentInfo.icon

            return (
              <div
                key={order.id}
                className={`flex flex-col justify-between rounded-3xl border transition-all ${
                  isDelivered
                    ? "bg-white/80 border-neutral-200 opacity-80"
                    : "bg-white border-amber-300/80 shadow-md ring-1 ring-amber-400/20"
                }`}
              >
                {/* Card Top: Ticket, Time, Delivery Badge */}
                <div className="p-4 sm:p-5 border-b border-neutral-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded-xl">
                        {order.ticketNumber}
                      </span>
                      <span className="text-[11px] font-semibold text-neutral-400">
                        {formatHour(order.createdAt)} • {formatTimeAgo(order.createdAt)}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        isDelivered
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-100 text-amber-900 border-amber-300 animate-pulse"
                      }`}
                    >
                      {isDelivered ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Entregado</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>No entregado</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Customer (if assigned) */}
                  {order.customerName && (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 bg-neutral-50 px-2.5 py-1.5 rounded-xl border border-neutral-100">
                      <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="font-bold truncate">{order.customerName}</span>
                      {order.customerPhone && (
                        <span className="text-[11px] text-neutral-400 ml-auto flex items-center gap-1 shrink-0">
                          <Phone className="w-3 h-3" />
                          {order.customerPhone}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Items list */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                      Comanda ({order.items.reduce((acc, it) => acc + it.quantity, 0)} artículos):
                    </span>
                    <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {order.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-start justify-between text-xs py-1 px-2 rounded-lg bg-neutral-50/70 border border-neutral-100/80"
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                              {item.quantity}x
                            </span>
                            <span className="font-semibold text-neutral-800 leading-tight">
                              {item.productName}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-neutral-500 ml-2 shrink-0">
                            ${item.subtotal.toLocaleString("es-AR")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Bottom: Total, Payment Method & Single-click Toggle */}
                <div className="p-4 sm:p-5 bg-neutral-50/50 rounded-b-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${paymentInfo.color}`}
                      >
                        <PaymentIcon className="w-3 h-3" />
                        <span>{paymentInfo.label}</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 block font-medium">Total</span>
                      <span className="text-base font-black text-neutral-900">
                        ${order.totalAmount.toLocaleString("es-AR")}{" "}
                        <span className="text-[10px] text-neutral-500">{currency}</span>
                      </span>
                    </div>
                  </div>

                  {/* Single-Click Toggle Button */}
                  <div>
                    {!isDelivered ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleStatus(order.id, "delivered")}
                        className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Marcar como Entregado</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleStatus(order.id, "pending")}
                        className="w-full py-2 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Volver a No entregado</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
