"use client"

import React, { useState, useMemo, useTransition } from "react"
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  ExternalLink,
  MessageSquare,
  Edit2,
  Trash2,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  Wallet,
} from "lucide-react"
import {
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
  registerCustomerPaymentAction,
  fetchCustomerMovementsAction,
  CustomerRecord,
  CustomerMovementRecord,
} from "./actions"
import { CustomerInput } from "@/lib/validations/customer"

interface CustomersViewProps {
  initialCustomers: CustomerRecord[]
  businessName: string
  businessId: string
  currency: string
}

export function CustomersView({
  initialCustomers,
  businessName,
  businessId,
  currency,
}: CustomersViewProps) {
  const [customers, setCustomers] = useState<CustomerRecord[]>(initialCustomers)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "debt" | "clean">("all")

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerRecord | null>(null)

  // Payment Modal state
  const [payingCustomer, setPayingCustomer] = useState<CustomerRecord | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "debit_card" | "other">("cash")
  const [paymentNotes, setPaymentNotes] = useState("")

  // History Modal state
  const [historyCustomer, setHistoryCustomer] = useState<CustomerRecord | null>(null)
  const [movements, setMovements] = useState<CustomerMovementRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Notification feedback
  const [notification, setNotification] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const [isPending, startTransition] = useTransition()

  const showToast = (message: string, isError = false) => {
    setNotification({
      type: isError ? "error" : "success",
      message,
    })
    setTimeout(() => {
      setNotification(null)
    }, 4500)
  }

  // Currency Formatter
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "ARS",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Filtered list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.dni_cuil.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q)

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "debt" && c.current_debt > 0) ||
        (statusFilter === "clean" && c.current_debt <= 0)

      return matchesSearch && matchesStatus
    })
  }, [customers, searchQuery, statusFilter])

  // KPIs
  const totalDebt = useMemo(() => {
    return customers.reduce((acc, c) => acc + (Number(c.current_debt) || 0), 0)
  }, [customers])

  const customersWithDebt = useMemo(() => {
    return customers.filter((c) => Number(c.current_debt) > 0).length
  }, [customers])

  const customersClean = customers.length - customersWithDebt

  // Save Customer (Create / Edit)
  const handleSaveCustomer = (data: CustomerInput) => {
    startTransition(async () => {
      if (editingCustomer) {
        const res = await updateCustomerAction(editingCustomer.id, data, businessId)
        if (res.error) {
          showToast(res.error, true)
        } else {
          setCustomers((prev) =>
            prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...data } : c))
          )
          showToast(`Cliente "${data.name}" actualizado`)
          setIsModalOpen(false)
          setEditingCustomer(null)
        }
      } else {
        const res = await createCustomerAction(data, businessId)
        if (res.error) {
          showToast(res.error, true)
        } else if (res.data) {
          setCustomers((prev) => [res.data!, ...prev])
          showToast(`Cliente "${data.name}" creado con éxito`)
          setIsModalOpen(false)
        }
      }
    })
  }

  // Delete Customer
  const handleDeleteCustomer = () => {
    if (!deletingCustomer) return
    startTransition(async () => {
      const res = await deleteCustomerAction(deletingCustomer.id, businessId)
      if (res.error) {
        showToast(res.error, true)
      } else {
        setCustomers((prev) => prev.filter((c) => c.id !== deletingCustomer.id))
        showToast("Cliente eliminado correctamente")
        setDeletingCustomer(null)
      }
    })
  }

  // Open Payment Modal
  const handleOpenPayment = (customer: CustomerRecord) => {
    setPayingCustomer(customer)
    setPaymentAmount(customer.current_debt > 0 ? String(customer.current_debt) : "")
    setPaymentMethod("cash")
    setPaymentNotes("")
  }

  // Submit Payment / Delivery on Account
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!payingCustomer) return
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) {
      showToast("Ingresá un monto válido para el cobro", true)
      return
    }

    startTransition(async () => {
      const res = await registerCustomerPaymentAction(
        {
          customerId: payingCustomer.id,
          amount,
          paymentMethod,
          notes: paymentNotes.trim(),
        },
        businessId
      )

      if (res.error) {
        showToast(res.error, true)
      } else {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === payingCustomer.id
              ? { ...c, current_debt: res.newDebt ?? Math.max(0, c.current_debt - amount) }
              : c
          )
        )
        showToast(`Pago de ${formatMoney(amount)} asentado a ${payingCustomer.name}`)
        setPayingCustomer(null)
      }
    })
  }

  // Open History Statement
  const handleOpenHistory = async (customer: CustomerRecord) => {
    setHistoryCustomer(customer)
    setLoadingHistory(true)
    const { movements: movs } = await fetchCustomerMovementsAction(customer.id, businessId)
    setMovements(movs)
    setLoadingHistory(false)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-[100] p-4 rounded-2xl border shadow-2xl flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-2 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-rose-50 border-rose-300 text-rose-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1F1F1F] flex items-center gap-2">
            <Users className="w-7 h-7 text-purple-600" />
            <span>Clientes y Cuentas Corrientes (Fiado)</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Libreta digital de fiados: control de saldos, entregas a cuenta y recordatorios por WhatsApp
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingCustomer(null)
            setIsModalOpen(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Debt in the street */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Total Fiado en la Calle
            </p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">
              {formatMoney(totalDebt)}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Saldo acumulado a cobrar a vecinos
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Customers with pending debt */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Clientes con Deuda Activa
            </p>
            <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">
              {customersWithDebt}
            </h3>
            <p className="text-xs text-rose-600 font-medium mt-1">
              Con libreta abierta pendiente
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Customers clean */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Clientes al Día
            </p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              {customersClean}
            </h3>
            <p className="text-xs text-emerald-700 font-medium mt-1">
              {customers.length} clientes en total
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search and Status Filters */}
      <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono, DNI o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-[#1F1F1F] placeholder-neutral-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Todos ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("debt")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              statusFilter === "debt"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            Con Deuda Pendiente ({customersWithDebt})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("clean")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              statusFilter === "clean"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            Al Día ({customersClean})
          </button>
        </div>
      </div>

      {/* Customers List Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-neutral-200 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-[#1F1F1F]">
            {customers.length === 0
              ? "No tenés clientes registrados aún"
              : "No se encontraron clientes con ese filtro"}
          </h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {customers.length === 0
              ? "Registrá a los vecinos que compran en tu comercio para llevar su cuenta corriente y enviarles su saldo por WhatsApp."
              : "Probá cambiando el texto de búsqueda o el filtro de saldos."}
          </p>
          {customers.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setEditingCustomer(null)
                setIsModalOpen(true)
              }}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primer Cliente</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const hasDebt = Number(customer.current_debt) > 0
            const cleanPhone = customer.phone.replace(/[^\d]/g, "")
            const debtFormatted = formatMoney(customer.current_debt)

            // WhatsApp Message Generator
            const waText = encodeURIComponent(
              `Hola ${customer.name}, te escribo desde "${businessName}" para pasarte el estado de tu libreta de cuenta corriente.\n\nSaldo pendiente: ${debtFormatted}.\n\n¡Muchas gracias!`
            )
            const waUrl = cleanPhone
              ? `https://wa.me/${cleanPhone.startsWith("54") ? cleanPhone : "549" + cleanPhone}?text=${waText}`
              : null

            return (
              <div
                key={customer.id}
                className={`rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 border ${
                  hasDebt
                    ? "bg-white border-rose-200/90 hover:border-rose-300"
                    : "bg-white border-neutral-200/90 hover:border-purple-300"
                }`}
              >
                <div className="space-y-3">
                  {/* Top: Customer Name & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-[#1F1F1F] truncate">
                          {customer.name}
                        </h3>
                        {!customer.is_active && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-500">
                            Inactivo
                          </span>
                        )}
                      </div>

                      {customer.dni_cuil && (
                        <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                          DNI/CUIT: {customer.dni_cuil}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCustomer(customer)
                          setIsModalOpen(true)
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-purple-600 hover:bg-purple-50 transition-all cursor-pointer"
                        title="Editar cliente"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCustomer(customer)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Saldo Deudor Highlight Hero */}
                  <div
                    className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      hasDebt
                        ? "bg-rose-50/70 border-rose-200 text-rose-900"
                        : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                    }`}
                  >
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        {hasDebt ? "Saldo Deudor Pendiente" : "Estado de Cuenta"}
                      </p>
                      <h4 className="text-xl font-black font-mono mt-0.5">
                        {hasDebt ? debtFormatted : "Al Día ($0)"}
                      </h4>
                    </div>

                    {hasDebt ? (
                      <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-rose-200 text-rose-900">
                        Debe
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-emerald-200 text-emerald-900">
                        Al día
                      </span>
                    )}
                  </div>

                  {/* Phone & Address Details */}
                  <div className="space-y-1.5 text-xs text-neutral-600 pt-1">
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    )}
                    {customer.credit_limit > 0 && (
                      <div className="text-[11px] text-neutral-400">
                        Límite autorizado: {formatMoney(customer.credit_limit)}
                      </div>
                    )}
                    {customer.notes && (
                      <p className="text-[11px] text-neutral-500 bg-neutral-50 p-2 rounded-lg border border-neutral-100 line-clamp-2">
                        <FileText className="w-3 h-3 inline mr-1 text-neutral-400" />
                        {customer.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="space-y-2 pt-3 border-t border-neutral-100">
                  {/* WhatsApp Reminder Button (Only active when hasDebt & phone) */}
                  {hasDebt && waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Enviar Saldo por WhatsApp</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    </a>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPayment(customer)}
                      className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Registrar Pago</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenHistory(customer)}
                      className="py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Ver Libreta</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal 1: Create / Edit Customer */}
      {isModalOpen && (
        <CustomerFormModal
          customer={editingCustomer}
          isPending={isPending}
          onClose={() => {
            setIsModalOpen(false)
            setEditingCustomer(null)
          }}
          onSave={handleSaveCustomer}
        />
      )}

      {/* Modal 2: Register Payment / Delivery on Account */}
      {payingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-neutral-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1F1F1F]">
                    Registrar Cobro / Entrega a Cuenta
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Cliente: <strong>{payingCustomer.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPayingCustomer(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-[#1F1F1F] hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-neutral-400">Deuda Actual</p>
                <p className="text-lg font-mono font-black text-rose-600">
                  {formatMoney(payingCustomer.current_debt)}
                </p>
              </div>
              {payingCustomer.current_debt > 0 && (
                <button
                  type="button"
                  onClick={() => setPaymentAmount(String(payingCustomer.current_debt))}
                  className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-[11px] font-bold text-purple-600 hover:bg-neutral-50 shadow-xs cursor-pointer"
                >
                  Cobrar Totalidad
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">
                  Monto a Pagar ($ ARS) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="0"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-mono font-bold text-[#1F1F1F] focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">
                  Medio de Cobro
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "cash", label: "Efectivo" },
                    { id: "transfer", label: "Transferencia / MP" },
                    { id: "debit_card", label: "Tarjeta Débito" },
                    { id: "other", label: "Otro" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        paymentMethod === m.id
                          ? "bg-purple-50 border-purple-300 text-purple-700 ring-2 ring-purple-400/20"
                          : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">
                  Nota / Detalle (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Entrega semanal en efectivo..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-[#1F1F1F] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setPayingCustomer(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Asentar Pago</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Statement History (Libreta de movimientos) */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-neutral-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1F1F1F]">
                    Libreta de Cuenta: {historyCustomer.name}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Historial de ventas fiadas y cobros recibidos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryCustomer(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-[#1F1F1F] hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-neutral-400">Saldo Pendiente Hoy</p>
                <p className="text-xl font-mono font-black text-rose-600">
                  {formatMoney(historyCustomer.current_debt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const c = historyCustomer
                  setHistoryCustomer(null)
                  handleOpenPayment(c)
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Cobrar Ahora
              </button>
            </div>

            {/* Timeline Movements */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {loadingHistory ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-400">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="text-xs">Cargando movimientos...</span>
                </div>
              ) : movements.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400">
                  No hay movimientos registrados en la cuenta corriente de este cliente.
                </div>
              ) : (
                movements.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          m.type === "payment"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {m.type === "payment" ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[#1F1F1F]">
                          {m.type === "payment" ? "Entrega / Pago recibido" : "Compra fiada en POS"}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          {new Date(m.created_at).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          {m.notes ? `• ${m.notes}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-mono font-bold ${
                          m.type === "payment" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {m.type === "payment" ? "-" : "+"}
                        {formatMoney(m.amount)}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        Quedó: {formatMoney(m.balance_after)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryCustomer(null)}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Confirm Delete */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-neutral-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h3 className="font-bold text-base text-[#1F1F1F]">
                ¿Eliminar {deletingCustomer.name}?
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                El cliente quedará desactivado del sistema.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------------
// Sub-component: Modal Create / Edit Customer
// -------------------------------------------------------------
function CustomerFormModal({
  customer,
  isPending,
  onClose,
  onSave,
}: {
  customer: CustomerRecord | null
  isPending: boolean
  onClose: () => void
  onSave: (data: CustomerInput) => void
}) {
  const [name, setName] = useState(customer?.name || "")
  const [phone, setPhone] = useState(customer?.phone || "")
  const [email, setEmail] = useState(customer?.email || "")
  const [dniCuil, setDniCuil] = useState(customer?.dni_cuil || "")
  const [address, setAddress] = useState(customer?.address || "")
  const [creditLimit, setCreditLimit] = useState(customer?.credit_limit?.toString() || "0")
  const [notes, setNotes] = useState(customer?.notes || "")
  const [isActive, setIsActive] = useState(customer ? customer.is_active : true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      dni_cuil: dniCuil.trim(),
      address: address.trim(),
      credit_limit: parseFloat(creditLimit) || 0,
      notes: notes.trim(),
      is_active: isActive,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-neutral-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1F1F1F]">
                {customer ? `Editar ${customer.name}` : "Nuevo Cliente"}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Datos de identificación, contacto y límite de fiado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-[#1F1F1F] hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Nombre y Apellido <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Doña Rosa, Carlos Gómez..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ej: 11 2345 6789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">DNI / CUIL</label>
              <input
                type="text"
                placeholder="Ej: 34.567.890"
                value={dniCuil}
                onChange={(e) => setDniCuil(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-mono font-medium text-[#1F1F1F] focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Límite de Fiado ($ ARS)
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0 (Sin límite)"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-mono font-medium text-[#1F1F1F] focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700">
              Dirección / Ubicación en el barrio
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ej: Mitre 1234, Timbre B (o Casa de la esquina)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700">
              Notas adicionales (acuerdos, días de cobro)
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Cobra los 5 de cada mes. Hermano de María..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-[#1F1F1F] placeholder-neutral-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-neutral-300"
              />
              <span>Cliente Activo</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{customer ? "Guardar Cambios" : "Crear Cliente"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
