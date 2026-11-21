"use client"

import React, { useState, useMemo, useTransition } from "react"
import Link from "next/link"
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  FileText,
  User,
  Copy,
  Check,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
  Package,
  Building,
  CheckCircle2,
  MessageSquare,
} from "lucide-react"
import {
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
  SupplierRecord,
} from "./actions"
import { SupplierInput } from "@/lib/validations/product"

interface SuppliersViewProps {
  initialSuppliers: SupplierRecord[]
  businessName: string
  businessId: string
}

export function SuppliersView({
  initialSuppliers,
  businessName,
  businessId,
}: SuppliersViewProps) {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>(initialSuppliers)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDayFilter, setSelectedDayFilter] = useState("all")

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<SupplierRecord | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierRecord | null>(null)

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  const handleCopyPaymentInfo = (text: string, id: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    showToast("Datos de pago copiados al portapapeles")
  }

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.contact_name.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.cuit.toLowerCase().includes(q) ||
        s.delivery_days.toLowerCase().includes(q) ||
        s.notes.toLowerCase().includes(q)

      const matchesDay =
        selectedDayFilter === "all" ||
        s.delivery_days.toLowerCase().includes(selectedDayFilter.toLowerCase())

      return matchesSearch && matchesDay
    })
  }, [suppliers, searchQuery, selectedDayFilter])

  // KPIs
  const activeCount = suppliers.filter((s) => s.is_active).length
  const withWhatsAppCount = suppliers.filter((s) => s.phone.trim().length > 0).length
  const totalProductsCount = suppliers.reduce((acc, s) => acc + (s.products_count || 0), 0)

  // Save handler (Create / Edit)
  const handleSaveSupplier = (data: SupplierInput) => {
    startTransition(async () => {
      if (editingSupplier) {
        const res = await updateSupplierAction(editingSupplier.id, data, businessId)
        if (res.error) {
          showToast(res.error, true)
        } else {
          setSuppliers((prev) =>
            prev.map((s) => (s.id === editingSupplier.id ? { ...s, ...data } : s))
          )
          showToast(`Proveedor "${data.name}" actualizado correctamente`)
          setIsModalOpen(false)
          setEditingSupplier(null)
        }
      } else {
        const res = await createSupplierAction(data, businessId)
        if (res.error) {
          showToast(res.error, true)
        } else if (res.data) {
          setSuppliers((prev) => [res.data!, ...prev])
          showToast(`Proveedor "${data.name}" agregado con éxito`)
          setIsModalOpen(false)
        }
      }
    })
  }

  // Delete handler
  const handleDeleteSupplier = () => {
    if (!deletingSupplier) return
    startTransition(async () => {
      const res = await deleteSupplierAction(deletingSupplier.id, businessId)
      if (res.error) {
        showToast(res.error, true)
      } else {
        setSuppliers((prev) => prev.filter((s) => s.id !== deletingSupplier.id))
        showToast("Proveedor eliminado correctamente")
        setDeletingSupplier(null)
      }
    })
  }

  const daysOptions = [
    { id: "all", label: "Todos los días" },
    { id: "lunes", label: "Lunes" },
    { id: "martes", label: "Martes" },
    { id: "miercoles", label: "Miércoles" },
    { id: "jueves", label: "Jueves" },
    { id: "viernes", label: "Viernes" },
    { id: "sabado", label: "Sábado" },
  ]

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
            <Truck className="w-7 h-7 text-purple-600" />
            <span>Proveedores y Distribuidores</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Directorio de preventistas, contactos comerciales, días de reparto y cuentas para transferencias
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingSupplier(null)
            setIsModalOpen(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Proveedores Activos
          </p>
          <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">{activeCount}</h3>
          <p className="text-xs text-purple-600 font-medium mt-1">
            {suppliers.length} proveedores registrados
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Preventistas con WhatsApp
          </p>
          <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">{withWhatsAppCount}</h3>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            Contacto directo para pedidos inmediatos
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Artículos Vinculados
          </p>
          <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">{totalProductsCount}</h3>
          <p className="text-xs text-neutral-500 mt-1">
            Asociados a reposición en inventario
          </p>
        </div>
      </div>

      {/* Search and Day Filters */}
      <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por proveedor, preventista, teléfono, CUIT o día..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-[#1F1F1F] placeholder-neutral-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mr-1 shrink-0">
            Día de visita:
          </span>
          {daysOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedDayFilter(opt.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                selectedDayFilter === opt.id
                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                  : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Suppliers Grid */}
      {filteredSuppliers.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-neutral-200 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <Truck className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-[#1F1F1F]">
            {suppliers.length === 0
              ? "No tenés proveedores registrados aún"
              : "No se encontraron proveedores con ese filtro"}
          </h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {suppliers.length === 0
              ? "Agregá a tus preventistas y distribuidores habituales para hacerles pedidos por WhatsApp y asociar tus productos."
              : "Probá cambiando los términos de búsqueda o el día de visita seleccionado."}
          </p>
          {suppliers.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setEditingSupplier(null)
                setIsModalOpen(true)
              }}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primer Proveedor</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => {
            // Clean phone number for WhatsApp url
            const cleanPhone = supplier.phone.replace(/[^\d]/g, "")
            const waText = encodeURIComponent(
              `Hola ${supplier.contact_name || supplier.name}, te escribo desde "${businessName}" para coordinar un pedido.`
            )
            const waUrl = cleanPhone
              ? `https://wa.me/${cleanPhone.startsWith("54") ? cleanPhone : "549" + cleanPhone}?text=${waText}`
              : null

            return (
              <div
                key={supplier.id}
                className="rounded-3xl bg-white border border-neutral-200/90 p-5 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Name & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-[#1F1F1F] truncate">
                          {supplier.name}
                        </h3>
                        {!supplier.is_active && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-500">
                            Inactivo
                          </span>
                        )}
                      </div>

                      {supplier.contact_name ? (
                        <p className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                          <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="truncate">{supplier.contact_name}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-400 mt-0.5">Sin contacto asignado</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSupplier(supplier)
                          setIsModalOpen(true)
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-purple-600 hover:bg-purple-50 transition-all cursor-pointer"
                        title="Editar proveedor"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingSupplier(supplier)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        title="Eliminar proveedor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp Quick Action Button */}
                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>WhatsApp ({supplier.phone})</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    </a>
                  ) : supplier.phone ? (
                    <div className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-neutral-50 border border-neutral-100 text-xs text-neutral-600">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{supplier.phone}</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-neutral-400 italic">Sin teléfono registrado</p>
                  )}

                  {/* Metadata Chips: CUIT, Delivery Days */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {supplier.delivery_days && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-semibold text-[11px] border border-purple-100">
                        <Calendar className="w-3.5 h-3.5 text-purple-500" />
                        <span>Visita: {supplier.delivery_days}</span>
                      </span>
                    )}

                    {supplier.cuit && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-50 text-neutral-600 font-mono text-[11px] border border-neutral-200">
                        CUIT: {supplier.cuit}
                      </span>
                    )}
                  </div>

                  {/* Payment Details (Alias / CBU) with Copy Action */}
                  {supplier.payment_info && (
                    <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Datos de Pago / Alias
                        </p>
                        <p className="text-xs font-mono font-bold text-[#1F1F1F] truncate">
                          {supplier.payment_info}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyPaymentInfo(supplier.payment_info, supplier.id)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-purple-600 hover:bg-white border border-neutral-200 shadow-xs transition-all cursor-pointer shrink-0"
                        title="Copiar alias / CBU"
                      >
                        {copiedId === supplier.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Notes / Conditions */}
                  {supplier.notes && (
                    <p className="text-xs text-neutral-500 bg-neutral-50/50 p-2 rounded-lg border border-neutral-100 line-clamp-2">
                      <FileText className="w-3.5 h-3.5 inline mr-1 text-neutral-400" />
                      {supplier.notes}
                    </p>
                  )}
                </div>

                {/* Footer: Products Linked */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-neutral-400" />
                    <span>
                      {supplier.products_count || 0}{" "}
                      {supplier.products_count === 1 ? "producto" : "productos"}
                    </span>
                  </div>

                  <Link
                    href={`/dashboard/inventory?supplier=${supplier.id}`}
                    className="font-bold text-purple-600 hover:text-purple-700 hover:underline text-[11px]"
                  >
                    Ver en catálogo →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Create / Edit Supplier */}
      {isModalOpen && (
        <SupplierFormModal
          supplier={editingSupplier}
          isPending={isPending}
          onClose={() => {
            setIsModalOpen(false)
            setEditingSupplier(null)
          }}
          onSave={handleSaveSupplier}
        />
      )}

      {/* Modal: Confirm Delete */}
      {deletingSupplier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-neutral-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h3 className="font-bold text-base text-[#1F1F1F]">
                ¿Eliminar {deletingSupplier.name}?
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Si tiene productos vinculados, el proveedor se desactivará para no romper el historial de inventario.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingSupplier(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteSupplier}
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
// Sub-component: Modal Create / Edit Supplier
// -------------------------------------------------------------
function SupplierFormModal({
  supplier,
  isPending,
  onClose,
  onSave,
}: {
  supplier: SupplierRecord | null
  isPending: boolean
  onClose: () => void
  onSave: (data: SupplierInput) => void
}) {
  const [name, setName] = useState(supplier?.name || "")
  const [contactName, setContactName] = useState(supplier?.contact_name || "")
  const [phone, setPhone] = useState(supplier?.phone || "")
  const [email, setEmail] = useState(supplier?.email || "")
  const [cuit, setCuit] = useState(supplier?.cuit || "")
  const [deliveryDays, setDeliveryDays] = useState(supplier?.delivery_days || "")
  const [paymentInfo, setPaymentInfo] = useState(supplier?.payment_info || "")
  const [notes, setNotes] = useState(supplier?.notes || "")
  const [isActive, setIsActive] = useState(supplier ? supplier.is_active : true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: name.trim(),
      contact_name: contactName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      cuit: cuit.trim(),
      delivery_days: deliveryDays.trim(),
      payment_info: paymentInfo.trim(),
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
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1F1F1F]">
                {supplier ? `Editar ${supplier.name}` : "Nuevo Proveedor / Distribuidor"}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Cargá los datos de contacto y condiciones comerciales
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-[#1F1F1F] hover:bg-neutral-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Proveedor / Empresa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Distribuidora Quilmes, Arcor..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Contacto / Preventista
              </label>
              <input
                type="text"
                placeholder="Ej: Carlos Preventista, Juan Venta..."
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                CUIT / Identificación Fiscal
              </label>
              <input
                type="text"
                placeholder="Ej: 30-71234567-8"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-mono font-medium text-[#1F1F1F] focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Días de Visita / Reparto
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ej: Lunes y Jueves mañana..."
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="pedidos@distribuidora.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700">
              Datos de Pago (Alias / CBU para transferencias)
            </label>
            <div className="relative">
              <CreditCard className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ej: ALIAS.QUILMES.SUR / CBU: 01409999..."
                value={paymentInfo}
                onChange={(e) => setPaymentInfo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-mono font-medium text-[#1F1F1F] focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700">
              Notas y Condiciones Comerciales (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Pedido mínimo $80.000. Tomar pedidos antes de las 18hs..."
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
              <span>Proveedor Activo</span>
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
                <span>{supplier ? "Guardar Cambios" : "Crear Proveedor"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
