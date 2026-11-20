"use client"

import React, { useState, useMemo, useTransition } from "react"
import Link from "next/link"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  ShoppingBag,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Banknote,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Trash2,
  RefreshCw,
} from "lucide-react"
import {
  createCashMovementAction,
  deleteCashMovementAction,
} from "./actions"
import {
  movementCategoryOptions,
  MovementInput,
} from "@/lib/validations/movement"

export interface MovementRecord {
  id: string
  business_id: string
  shift_id: string | null
  user_id: string
  type: string
  category: string
  concept: string
  amount: number
  payment_method: string
  notes: string | null
  created_at: string
}

export interface UnifiedActivityItem {
  id: string
  source: "sale" | "movement"
  type: "income" | "expense"
  category: string
  concept: string
  amount: number
  payment_method: string
  created_at: string
  notes?: string | null
  shift_id?: string | null
  items?: {
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
  }[]
}

interface MovementsManagerProps {
  initialItems: UnifiedActivityItem[]
  businessId: string
  currency: string
  isCashShiftOpen: boolean
}

type TabType = "all" | "income" | "expense"
type DatePresetType = "today" | "week" | "month" | "all"

export function MovementsManager({
  initialItems,
  businessId,
  currency,
  isCashShiftOpen,
}: MovementsManagerProps) {
  const [items, setItems] = useState<UnifiedActivityItem[]>(initialItems)
  const [activeTab, setActiveTab] = useState<TabType>("all")
  const [datePreset, setDatePreset] = useState<DatePresetType>("today")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"expense" | "income">("expense")
  const [selectedItemDetail, setSelectedItemDetail] = useState<UnifiedActivityItem | null>(null)

  // Transitions & Feedback
  const [, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(null), 5000)
    } else {
      setSuccessMsg(msg)
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "ARS",
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr))
  }

  // Filter Items by Date Preset, Tab, Payment Method, and Search Query
  const filteredItems = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    return items.filter((item) => {
      const itemTime = new Date(item.created_at).getTime()

      // Date preset
      if (datePreset === "today" && itemTime < todayStart) return false
      if (datePreset === "week" && itemTime < weekStart) return false
      if (datePreset === "month" && itemTime < monthStart) return false

      // Tab filter
      if (activeTab === "income" && item.type !== "income") return false
      if (activeTab === "expense" && item.type !== "expense") return false

      // Payment method
      if (paymentFilter !== "all" && item.payment_method !== paymentFilter) return false

      // Search Query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim()
        const matchesConcept = item.concept.toLowerCase().includes(q)
        const matchesCategory = item.category.toLowerCase().includes(q)
        return matchesConcept || matchesCategory
      }

      return true
    })
  }, [items, datePreset, activeTab, paymentFilter, searchQuery])

  // KPI Calculations based on currently active date filter
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    let income = 0
    let expense = 0

    filteredItems.forEach((i) => {
      if (i.type === "income") {
        income += i.amount
      } else {
        expense += i.amount
      }
    })

    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense,
    }
  }, [filteredItems])

  // Open Expense or Income Modal
  const handleOpenModal = (type: "expense" | "income") => {
    setModalType(type)
    setIsExpenseModalOpen(true)
  }

  // Handle Delete Manual Movement
  const handleDeleteMovement = async (item: UnifiedActivityItem) => {
    if (item.source !== "movement") return
    if (!confirm(`¿Eliminar el movimiento "${item.concept}" de ${formatMoney(item.amount)}?`)) return

    startTransition(async () => {
      const res = await deleteCashMovementAction(item.id, businessId)
      if (res.error) {
        showNotification(res.error, true)
      } else {
        setItems((prev) => prev.filter((i) => i.id !== item.id))
        showNotification("Movimiento eliminado correctamente")
      }
    })
  }

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case "cash":
        return { label: "Efectivo", icon: Banknote, color: "text-emerald-600" }
      case "transfer":
        return { label: "Transferencia", icon: ArrowUpRight, color: "text-blue-600" }
      case "debit_card":
        return { label: "Débito", icon: CreditCard, color: "text-purple-600" }
      case "credit_card":
        return { label: "Crédito", icon: CreditCard, color: "text-amber-600" }
      default:
        return { label: method, icon: DollarSign, color: "text-neutral-500" }
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="hover:text-[#1F1F1F]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="hover:text-[#1F1F1F]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header with Title and Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1F1F1F]">
            Movimientos y Flujo Diario
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Libro unificado de ventas, pagos a proveedores, gastos diarios e ingresos manuales
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full sm:flex sm:items-center sm:gap-2.5 sm:w-auto">
          <Link
            href="/dashboard/pos"
            className="px-2.5 sm:px-4 py-2.5 rounded-xl bg-amber-50/80 hover:bg-amber-100/90 border border-amber-200/70 text-amber-900 font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FE9820] shrink-0" />
            <span className="hidden sm:inline">+ Nueva Venta (POS)</span>
            <span className="sm:hidden font-semibold">Venta</span>
          </Link>

          <button
            onClick={() => handleOpenModal("income")}
            className="px-2.5 sm:px-4 py-2.5 rounded-xl bg-emerald-50/80 hover:bg-emerald-100/90 border border-emerald-200/70 text-emerald-900 font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">+ Ingreso</span>
            <span className="sm:hidden font-semibold">Ingreso</span>
          </button>

          <button
            onClick={() => handleOpenModal("expense")}
            className="px-2.5 sm:px-4 py-2.5 rounded-xl bg-rose-50/80 hover:bg-rose-100/90 border border-rose-200/70 text-rose-900 font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 stroke-[2.5] shrink-0" />
            <span className="hidden sm:inline">+ Nuevo Gasto</span>
            <span className="sm:hidden font-semibold">Gasto</span>
          </button>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Balance (Net Cash Flow) */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Balance Neto
            </p>
            <h3
              className={`text-2xl font-black font-mono mt-1 ${
                netBalance >= 0 ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {netBalance >= 0 && "+"}
              {formatMoney(netBalance)}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">Ingresos menos gastos</p>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              netBalance >= 0
                ? "bg-emerald-50 border border-emerald-100 text-emerald-600"
                : "bg-rose-50 border border-rose-100 text-rose-600"
            }`}
          >
            {netBalance >= 0 ? (
              <TrendingUp className="w-6 h-6" />
            ) : (
              <TrendingDown className="w-6 h-6" />
            )}
          </div>
        </div>

        {/* Card 2: Total Incomes */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Ingresos Totales
            </p>
            <h3 className="text-2xl font-black font-mono text-emerald-700 mt-1">
              +{formatMoney(totalIncome)}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">Ventas y cobranzas del período</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Gastos y Egresos
            </p>
            <h3 className="text-2xl font-black font-mono text-rose-700 mt-1">
              -{formatMoney(totalExpense)}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">Proveedores, servicios y retiros</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-4">
        {/* Row 1: Tabs & Date Presets */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs: Resumen, Ingresos, Gastos */}
          <div className="inline-flex p-1 rounded-xl bg-neutral-50 border border-neutral-200">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "all"
                  ? "bg-white text-[#1F1F1F] shadow-sm border border-neutral-200"
                  : "text-neutral-400 hover:text-[#1F1F1F]"
              }`}
            >
              Resumen ({items.length})
            </button>
            <button
              onClick={() => setActiveTab("income")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "income"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "text-neutral-400 hover:text-emerald-600"
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Ingresos</span>
            </button>
            <button
              onClick={() => setActiveTab("expense")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "expense"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "text-neutral-400 hover:text-rose-600"
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Gastos</span>
            </button>
          </div>

          {/* Date Presets */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-neutral-500 mr-1 hidden sm:block" />
            {(
              [
                { id: "today", label: "Hoy" },
                { id: "week", label: "Esta Semana" },
                { id: "month", label: "Este Mes" },
                { id: "all", label: "Todo" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  datePreset === p.id
                    ? "bg-[#FE9820] text-neutral-950 font-bold"
                    : "bg-neutral-50 border border-neutral-200 text-neutral-400 hover:text-[#1F1F1F]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Search & Payment Method Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-neutral-200/80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por concepto o categoría (ej: Distribuidora, Luz, Venta #...)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-[#1F1F1F] placeholder-neutral-500 focus:outline-none focus:border-[#FE9820]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#1F1F1F] text-xs"
              >
                Limpiar
              </button>
            )}
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:border-[#FE9820]"
          >
            <option value="all">Todos los Métodos de Pago</option>
            <option value="cash">Efectivo</option>
            <option value="transfer">Transferencia</option>
            <option value="debit_card">Tarjeta Débito</option>
            <option value="credit_card">Tarjeta Crédito</option>
          </select>
        </div>
      </div>

      {/* Unified Activity Table */}
      <div className="rounded-2xl bg-white border border-neutral-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/60 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Tipo & Categoría</th>
                <th className="py-3 px-4">Concepto / Descripción</th>
                <th className="py-3 px-4">Método de Pago</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-neutral-400">
                      No hay movimientos en este período
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Probá cambiando el filtro de fecha o registrá una nueva venta o gasto.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isIncome = item.type === "income"
                  const payInfo = getPaymentLabel(item.payment_method)
                  const PayIcon = payInfo.icon

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-neutral-50/70 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-neutral-400">
                        {formatDate(item.created_at)}
                      </td>

                      {/* Type & Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            isIncome
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-rose-50 text-rose-700 border border-rose-200/60"
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                          )}
                          <span>{item.category}</span>
                        </span>
                      </td>

                      {/* Concept */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setSelectedItemDetail(item)}
                          className="font-medium text-[#1F1F1F] hover:text-[#FE9820] text-left transition-colors flex items-center gap-1.5"
                        >
                          <span>{item.concept}</span>
                          {item.source === "sale" && (
                            <span className="text-[10px] text-neutral-500 font-normal">
                              (Ver ticket)
                            </span>
                          )}
                        </button>
                        {item.notes && (
                          <p className="text-[11px] text-neutral-500 truncate max-w-xs">
                            {item.notes}
                          </p>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs text-neutral-700">
                          <PayIcon className={`w-3.5 h-3.5 ${payInfo.color}`} />
                          <span>{payInfo.label}</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td
                        className={`py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap ${
                          isIncome ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatMoney(item.amount)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedItemDetail(item)}
                            title="Ver detalle"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-[#1F1F1F] hover:bg-neutral-100 transition-colors"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          {item.source === "movement" && (
                            <button
                              onClick={() => handleDeleteMovement(item)}
                              title="Eliminar gasto/ingreso"
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Quick Expense / Income Form */}
      {isExpenseModalOpen && (
        <MovementFormModal
          type={modalType}
          businessId={businessId}
          isCashShiftOpen={isCashShiftOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onCreated={(newMovement) => {
            const unifiedItem: UnifiedActivityItem = {
              id: newMovement.id,
              source: "movement",
              type: newMovement.type as "income" | "expense",
              category: newMovement.category,
              concept: newMovement.concept,
              amount: Number(newMovement.amount),
              payment_method: newMovement.payment_method,
              created_at: newMovement.created_at,
              notes: newMovement.notes,
              shift_id: newMovement.shift_id,
            }
            setItems((prev) => [unifiedItem, ...prev])
            showNotification(
              `${modalType === "expense" ? "Gasto" : "Ingreso"} de ${formatMoney(
                unifiedItem.amount
              )} registrado exitosamente`
            )
            setIsExpenseModalOpen(false)
          }}
        />
      )}

      {/* Modal: Transaction Detail */}
      {selectedItemDetail && (
        <TransactionDetailModal
          item={selectedItemDetail}
          currency={currency}
          onClose={() => setSelectedItemDetail(null)}
        />
      )}
    </div>
  )
}

// -------------------------------------------------------------
// Sub-component: Quick Movement Modal (Expense / Income)
// -------------------------------------------------------------
function MovementFormModal({
  type,
  businessId,
  isCashShiftOpen,
  onClose,
  onCreated,
}: {
  type: "expense" | "income"
  businessId: string
  isCashShiftOpen: boolean
  onClose: () => void
  onCreated: (data: MovementRecord) => void
}) {
  const [concept, setConcept] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState(
    type === "expense" ? "Proveedores" : "Aporte de capital"
  )
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "transfer" | "debit_card" | "credit_card"
  >("cash")
  const [affectShift, setAffectShift] = useState(true)
  const [notes, setNotes] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Ingresá un monto mayor a cero")
      return
    }

    if (!concept.trim()) {
      setError("El concepto es obligatorio")
      return
    }

    setLoading(true)
    setError(null)

    const payload: MovementInput = {
      type,
      concept: concept.trim(),
      amount: numAmount,
      category,
      payment_method: paymentMethod,
      affect_shift: affectShift,
      notes: notes.trim() || null,
    }

    const res = await createCashMovementAction(payload, businessId)
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      onCreated(res.data)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                type === "expense"
                  ? "bg-rose-50 border border-rose-200 text-rose-600"
                  : "bg-emerald-50 border border-emerald-200 text-emerald-600"
              }`}
            >
              {type === "expense" ? (
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
              ) : (
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <h3 className="font-bold text-[#1F1F1F] text-base">
              {type === "expense" ? "Registrar Nuevo Gasto" : "Registrar Nuevo Ingreso"}
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-[#1F1F1F]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Concept */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Concepto / Detalle *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder={
                type === "expense"
                  ? "Ej: Pago de pan diario, Factura de luz..."
                  : "Ej: Cobro de fiado pendiente, Aporte de caja..."
              }
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-[#1F1F1F] placeholder-neutral-500 focus:outline-none focus:border-[#FE9820]"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Monto ($) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-base font-mono font-bold text-[#1F1F1F] focus:outline-none focus:border-[#FE9820]"
              />
            </div>
          </div>

          {/* Category & Payment Method Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Categoría
              </label>
              {type === "expense" ? (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:border-[#FE9820]"
                >
                  {movementCategoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:border-[#FE9820]"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value as "cash" | "transfer" | "debit_card" | "credit_card"
                  )
                }
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:border-[#FE9820]"
              >
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia</option>
                <option value="debit_card">Tarjeta Débito</option>
                <option value="credit_card">Tarjeta Crédito</option>
              </select>
            </div>
          </div>

          {/* Affect Active Shift Checkbox */}
          {paymentMethod === "cash" && isCashShiftOpen && (
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center gap-2.5">
              <input
                type="checkbox"
                id="affectShift"
                checked={affectShift}
                onChange={(e) => setAffectShift(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-white border-neutral-300 cursor-pointer"
              />
              <label htmlFor="affectShift" className="text-xs text-neutral-700 cursor-pointer">
                {type === "expense"
                  ? "Descontar del efectivo de la caja actual (afectar arqueo)"
                  : "Sumar al efectivo de la caja actual (afectar arqueo)"}
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Notas adicionales (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Número de comprobante, observaciones..."
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-[#1F1F1F] placeholder-neutral-500 focus:outline-none focus:border-[#FE9820]"
            />
          </div>

          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-400 hover:text-[#1F1F1F] text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-all ${
                type === "expense"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{type === "expense" ? "Registrar Gasto" : "Registrar Ingreso"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// Sub-component: Transaction Detail Modal / Drawer
// -------------------------------------------------------------
function TransactionDetailModal({
  item,
  currency,
  onClose,
}: {
  item: UnifiedActivityItem
  currency: string
  onClose: () => void
}) {
  const isIncome = item.type === "income"

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "ARS",
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "full",
      timeStyle: "medium",
    }).format(new Date(dateStr))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#FE9820]" />
            <h3 className="font-bold text-[#1F1F1F] text-base">Comprobante de Operación</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-[#1F1F1F]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount & Status Card */}
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
          <p className="text-xs text-neutral-400 mb-1">{item.concept}</p>
          <p
            className={`text-3xl font-black font-mono ${
              isIncome ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {isIncome ? "+" : "-"}
            {formatMoney(item.amount)}
          </p>
          <span
            className={`inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isIncome
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {item.category}
          </span>
        </div>

        {/* Details list */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-neutral-200/60">
            <span className="text-neutral-400">Fecha y Hora</span>
            <span className="text-neutral-800 font-medium">{formatDate(item.created_at)}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-neutral-200/60">
            <span className="text-neutral-400">Método de Pago</span>
            <span className="text-neutral-800 font-semibold uppercase">{item.payment_method}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-neutral-200/60">
            <span className="text-neutral-400">Origen</span>
            <span className="text-neutral-800">
              {item.source === "sale" ? "Punto de Venta (POS)" : "Movimiento Manual"}
            </span>
          </div>

          {item.notes && (
            <div className="py-2">
              <span className="text-neutral-400 block mb-1">Notas / Observaciones:</span>
              <p className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-700">
                {item.notes}
              </p>
            </div>
          )}

          {/* If Sale Items Exist */}
          {item.items && item.items.length > 0 && (
            <div className="pt-2">
              <span className="text-neutral-400 block mb-2 font-semibold">
                Productos Vendidos ({item.items.length})
              </span>
              <div className="border border-neutral-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-50 text-neutral-400 sticky top-0 border-b border-neutral-200">
                    <tr>
                      <th className="p-2">Producto</th>
                      <th className="p-2 text-center">Cant</th>
                      <th className="p-2 text-right">Unitario</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {item.items.map((line, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium text-[#1F1F1F]">{line.product_name}</td>
                        <td className="p-2 text-center font-mono">{line.quantity}</td>
                        <td className="p-2 text-right font-mono">{formatMoney(line.unit_price)}</td>
                        <td className="p-2 text-right font-mono font-bold text-[#1F1F1F]">
                          {formatMoney(line.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-neutral-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-700 border border-neutral-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
