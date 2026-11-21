"use client"

import React, { useState, useTransition } from "react"
import {
  CreditCard,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
  Settings2,
  DollarSign,
  Plus,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Building2,
  Save,
  Check,
} from "lucide-react"
import {
  updatePlanTemplateAction,
  assignBusinessSubscriptionAction,
  PlanUpdateInput,
} from "./actions"

export interface SubscriptionPlanItem {
  id: "basic" | "full" | "custom"
  name: string
  subtitle: string
  price: number
  period_label: string
  badge: string
  highlight: boolean
  features: string[]
  assigned_count: number
}

export interface BusinessSubscriptionSummary {
  id: string
  name: string
  owner_email: string
  industry: string
  subscription_plan: "basic" | "full" | "custom"
  subscription_price: number
  subscription_status: string
  subscription_notes?: string
}

interface SubscriptionsViewProps {
  initialPlans: SubscriptionPlanItem[]
  initialBusinesses: BusinessSubscriptionSummary[]
}

export function SubscriptionsView({
  initialPlans,
  initialBusinesses,
}: SubscriptionsViewProps) {
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>(initialPlans)
  const [businesses, setBusinesses] = useState<BusinessSubscriptionSummary[]>(initialBusinesses)

  // Modals state
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanItem | null>(null)
  const [isClientsModalOpen, setIsClientsModalOpen] = useState(false)

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

  // Calculate live dynamic metrics
  const totalMRR = businesses.reduce((acc, b) => {
    if (b.subscription_status === "active") {
      return acc + (Number(b.subscription_price) || 0)
    }
    return acc
  }, 0)

  const totalARR = totalMRR * 12
  const totalBusinesses = businesses.length

  // Counts per plan
  const basicCount = businesses.filter((b) => b.subscription_plan === "basic").length
  const fullCount = businesses.filter((b) => b.subscription_plan === "full").length
  const customCount = businesses.filter((b) => b.subscription_plan === "custom").length

  // Save Plan Template Changes
  const handleSavePlanTemplate = (updated: PlanUpdateInput) => {
    if (!editingPlan) return

    startTransition(async () => {
      const res = await updatePlanTemplateAction(editingPlan.id, updated)
      if (res.error) {
        showToast(res.error, true)
      } else {
        setPlans((prev) =>
          prev.map((p) =>
            p.id === editingPlan.id
              ? {
                  ...p,
                  name: updated.name,
                  subtitle: updated.subtitle,
                  price: updated.price,
                  badge: updated.badge,
                  features: updated.features,
                }
              : p
          )
        )
        showToast(`Parámetros del ${updated.name} actualizados correctamente`)
        setEditingPlan(null)
      }
    })
  }

  // Save Business Custom Subscription
  const handleSaveBusinessSubscription = (
    businessId: string,
    planId: "basic" | "full" | "custom",
    customPrice: number,
    notes: string
  ) => {
    startTransition(async () => {
      const res = await assignBusinessSubscriptionAction({
        businessId,
        planId,
        customPrice,
        notes,
      })
      if (res.error) {
        showToast(res.error, true)
      } else {
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === businessId
              ? {
                  ...b,
                  subscription_plan: planId,
                  subscription_price: customPrice,
                  subscription_notes: notes,
                }
              : b
          )
        )
        showToast("Suscripción de comercio actualizada con éxito")
      }
    })
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl border shadow-xl flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-2 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1F1F1F]">
            Planes y Suscripciones (Modelo SaaS)
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Estructura de monetización: Plan Básico, Plan Full y Plan Customizado con tarifas acordadas por cliente.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsClientsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Users className="w-4 h-4" />
          <span>Asignar Planes a Comercios</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            MRR Real Proyectado (Mensual)
          </p>
          <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">
            ${Number(totalMRR).toLocaleString("es-AR")}
          </h3>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            Suma de facturación de comercios activos
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            ARR Anualizado
          </p>
          <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">
            ${Number(totalARR).toLocaleString("es-AR")}
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Valor de la cartera a 12 meses
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Distribución de Comercios
          </p>
          <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">
            {totalBusinesses}
          </h3>
          <p className="text-xs text-purple-600 font-medium mt-1">
            {basicCount} Básico • {fullCount} Full • {customCount} Custom
          </p>
        </div>
      </div>

      {/* Pricing Tiers Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const assignedCount =
            plan.id === "basic"
              ? basicCount
              : plan.id === "full"
              ? fullCount
              : customCount

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
                plan.highlight
                  ? "bg-white border-2 border-purple-500 shadow-lg relative"
                  : "bg-white border border-neutral-200 shadow-xs"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#FE9820]" />
                  <span>{plan.badge}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-[#1F1F1F]">{plan.name}</h3>
                  {!plan.highlight && (
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        plan.id === "custom"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-1 min-h-[32px]">{plan.subtitle}</p>

                <div className="mt-6 mb-6">
                  <div className="flex items-baseline gap-1">
                    {plan.id === "custom" ? (
                      <span className="text-2xl sm:text-3xl font-black text-[#FE9820]">
                        A Medida
                      </span>
                    ) : (
                      <>
                        <span className="text-3xl sm:text-4xl font-black text-[#1F1F1F]">
                          ${Number(plan.price).toLocaleString("es-AR")}
                        </span>
                        <span className="text-xs text-neutral-500 font-medium">
                          {plan.period_label}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-50 text-[11px] font-semibold text-neutral-600 border border-neutral-100">
                    <Users className="w-3.5 h-3.5 text-neutral-400" />
                    <span>
                      {assignedCount} {assignedCount === 1 ? "comercio asignado" : "comercios asignados"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-5 space-y-3">
                  <p className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Incluye:
                  </p>
                  <ul className="space-y-2.5 text-xs text-neutral-600">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            plan.highlight
                              ? "text-purple-600"
                              : plan.id === "custom"
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button: Open Configuration Modal */}
              <div className="mt-8 pt-4 border-t border-neutral-100">
                {plan.id === "custom" ? (
                  <button
                    type="button"
                    onClick={() => setIsClientsModalOpen(true)}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-neutral-950 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Configurar Clientes y Tarifas Custom</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingPlan(plan)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      plan.highlight
                        ? "bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                        : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
                    }`}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Configurar Parámetros del Plan</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal 1: Edit Plan Template (Básico & Full) */}
      {editingPlan && (
        <PlanConfigModal
          plan={editingPlan}
          isPending={isPending}
          onClose={() => setEditingPlan(null)}
          onSave={handleSavePlanTemplate}
        />
      )}

      {/* Modal 2: Assign Businesses & Custom Rates */}
      {isClientsModalOpen && (
        <BusinessSubscriptionsModal
          businesses={businesses}
          plans={plans}
          isPending={isPending}
          onClose={() => setIsClientsModalOpen(false)}
          onSaveBusiness={handleSaveBusinessSubscription}
        />
      )}
    </div>
  )
}

// -------------------------------------------------------------
// Sub-component: Modal to Edit Standard Plan Parameters
// -------------------------------------------------------------
function PlanConfigModal({
  plan,
  isPending,
  onClose,
  onSave,
}: {
  plan: SubscriptionPlanItem
  isPending: boolean
  onClose: () => void
  onSave: (data: PlanUpdateInput) => void
}) {
  const [name, setName] = useState(plan.name)
  const [subtitle, setSubtitle] = useState(plan.subtitle)
  const [price, setPrice] = useState(String(plan.price))
  const [badge, setBadge] = useState(plan.badge)
  const [features, setFeatures] = useState<string[]>(plan.features)
  const [newFeature, setNewFeature] = useState("")

  const handleAddFeature = () => {
    if (!newFeature.trim()) return
    setFeatures([...features, newFeature.trim()])
    setNewFeature("")
  }

  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      subtitle,
      price: Number(price) || 0,
      badge,
      features,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-neutral-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1F1F1F]">
                Configurar Parámetros del {plan.name}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Ajustá el precio de lista mensual y las características incluidas
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-[#1F1F1F] hover:bg-neutral-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Nombre del Plan</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Etiqueta / Badge</label>
              <input
                type="text"
                required
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700">Precio Mensual ($ ARS)</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                step="500"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-mono font-bold text-[#1F1F1F] focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700">Subtítulo Descriptivo</label>
            <input
              type="text"
              required
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Features list management */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <label className="text-xs font-semibold text-neutral-700 block">
              Funcionalidades Incluidas ({features.length})
            </label>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-200/70 text-xs text-neutral-700"
                >
                  <span className="truncate flex-1 pr-2">{feat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-neutral-400 hover:text-rose-600 p-1"
                    title="Eliminar ítem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Nueva funcionalidad (ej: Ticket WhatsApp)..."
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddFeature()
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-[#1F1F1F] focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold text-xs flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Guardar Parámetros</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// Sub-component: Modal to Assign Plans & Custom Rates to Clients
// -------------------------------------------------------------
function BusinessSubscriptionsModal({
  businesses,
  plans,
  isPending,
  onClose,
  onSaveBusiness,
}: {
  businesses: BusinessSubscriptionSummary[]
  plans: SubscriptionPlanItem[]
  isPending: boolean
  onClose: () => void
  onSaveBusiness: (
    businessId: string,
    planId: "basic" | "full" | "custom",
    customPrice: number,
    notes: string
  ) => void
}) {
  const [selectedBizId, setSelectedBizId] = useState<string>(businesses[0]?.id || "")
  const selectedBiz = businesses.find((b) => b.id === selectedBizId)

  const [selectedPlan, setSelectedPlan] = useState<"basic" | "full" | "custom">(
    selectedBiz?.subscription_plan || "full"
  )
  const [customPrice, setCustomPrice] = useState<string>(
    String(selectedBiz?.subscription_price || 25000)
  )
  const [notes, setNotes] = useState<string>(selectedBiz?.subscription_notes || "")

  const handleSelectBusiness = (b: BusinessSubscriptionSummary) => {
    setSelectedBizId(b.id)
    setSelectedPlan(b.subscription_plan || "full")
    setCustomPrice(String(b.subscription_price || 25000))
    setNotes(b.subscription_notes || "")
  }

  const handleSave = () => {
    if (!selectedBiz) return
    onSaveBusiness(
      selectedBiz.id,
      selectedPlan,
      Number(customPrice) || 0,
      notes
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white border border-neutral-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1F1F1F]">
                Asignación de Planes y Tarifas Especiales
              </h3>
              <p className="text-[11px] text-neutral-400">
                Fijá el plan para cada comercio o definí un precio a medida para clientes con acuerdos especiales.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-[#1F1F1F] hover:bg-neutral-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Businesses List */}
          <div className="space-y-2 border-r border-neutral-100 pr-4">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Comercios ({businesses.length})
            </p>
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {businesses.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelectBusiness(b)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all ${
                    b.id === selectedBizId
                      ? "bg-purple-50 border border-purple-200 shadow-xs"
                      : "hover:bg-neutral-50 border border-transparent"
                  }`}
                >
                  <p className="font-bold text-xs text-[#1F1F1F] truncate">{b.name}</p>
                  <p className="text-[10px] text-neutral-400 truncate">{b.owner_email}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        b.subscription_plan === "custom"
                          ? "bg-amber-100 text-amber-800"
                          : b.subscription_plan === "basic"
                          ? "bg-neutral-100 text-neutral-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {b.subscription_plan}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-neutral-700">
                      ${Number(b.subscription_price || 0).toLocaleString("es-AR")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Plan Configuration for selected Business */}
          <div className="md:col-span-2 space-y-4">
            {selectedBiz ? (
              <>
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-sm text-[#1F1F1F]">{selectedBiz.name}</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Titular: <strong>{selectedBiz.owner_email}</strong> • Rubro: {selectedBiz.industry}
                  </p>
                </div>

                {/* Plan Selection Radio Tabs */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-700 block">
                    Plan Asignado
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: "basic", label: "Básico", tag: "Entrada" },
                        { id: "full", label: "Full", tag: "Estándar" },
                        { id: "custom", label: "Customizado", tag: "A Medida" },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlan(t.id)
                          if (t.id === "basic") {
                            const p = plans.find((pl) => pl.id === "basic")
                            setCustomPrice(String(p?.price || 12000))
                          } else if (t.id === "full") {
                            const p = plans.find((pl) => pl.id === "full")
                            setCustomPrice(String(p?.price || 25000))
                          }
                        }}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          selectedPlan === t.id
                            ? t.id === "custom"
                              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/30"
                              : "bg-purple-50 border-purple-300 ring-2 ring-purple-400/30"
                            : "bg-white border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <p className="font-bold text-xs text-[#1F1F1F]">{t.label}</p>
                        <span className="text-[10px] text-neutral-400 font-medium">{t.tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Fee Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 flex items-center justify-between">
                    <span>
                      {selectedPlan === "custom"
                        ? "Precio Especial Pactado Mensual ($ ARS)"
                        : "Precio Mensual Facturado ($ ARS)"}
                    </span>
                    {selectedPlan === "custom" && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Tarifa Única Cliente
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm font-mono font-bold focus:outline-none transition-all ${
                        selectedPlan === "custom"
                          ? "bg-amber-50/40 border-amber-300 text-amber-950 focus:border-amber-500"
                          : "bg-neutral-50 border-neutral-200 text-[#1F1F1F] focus:border-purple-500"
                      }`}
                    />
                  </div>
                  {selectedPlan === "custom" && (
                    <p className="text-[11px] text-amber-700">
                      Este monto se cobra exclusivamente a este comercio. No altera los planes del resto.
                    </p>
                  )}
                </div>

                {/* Agreement Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 block">
                    Notas y Alcance del Acuerdo (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Incluye 3 sucursales, balanzas Systel y soporte telefónico prioritario..."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-[#1F1F1F] placeholder-neutral-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPending}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Guardar Suscripción de {selectedBiz.name}</span>
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-neutral-400">Seleccioná un comercio</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
