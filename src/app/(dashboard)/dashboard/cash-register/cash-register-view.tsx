"use client"

import React, { useState, useTransition } from "react"
import {
  Landmark,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Receipt,
  CreditCard,
  Banknote,
  Lock,
  Unlock,
  RefreshCw,
  X,
  AlertTriangle,
} from "lucide-react"
import {
  openCashShiftAction,
  closeCashShiftAction,
} from "./actions"

export interface ShiftRecord {
  id: string
  business_id: string
  opened_by: string
  closed_by: string | null
  opened_at: string
  closed_at: string | null
  initial_cash: number
  expected_cash: number | null
  actual_cash: number | null
  difference: number | null
  notes: string | null
  status: "open" | "closed"
  created_at: string
}

export interface ShiftMetrics {
  shift_id: string
  status: string
  initial_cash: number
  opened_at: string
  cash_sales: number
  digital_sales: number
  total_sales: number
  sales_count: number
  expected_cash: number
}

interface CashRegisterViewProps {
  activeShift: ShiftRecord | null
  activeMetrics: ShiftMetrics | null
  historyShifts: ShiftRecord[]
  businessId: string
  currency: string
  userEmail: string
}

export function CashRegisterView({
  activeShift: initialActiveShift,
  activeMetrics: initialMetrics,
  historyShifts: initialHistory,
  businessId,
  currency,
  userEmail,
}: CashRegisterViewProps) {
  const [activeShift, setActiveShift] = useState<ShiftRecord | null>(initialActiveShift)
  const [activeMetrics, setActiveMetrics] = useState<ShiftMetrics | null>(initialMetrics)
  const [historyShifts, setHistoryShifts] = useState<ShiftRecord[]>(initialHistory)

  // Open Shift Form State
  const [initialCashInput, setInitialCashInput] = useState<string>("10000")

  // Close Reconciliation Modal State
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
  const [countedCashInput, setCountedCashInput] = useState<string>("")
  const [notesInput, setNotesInput] = useState<string>("")

  // Transitions & Feedback
  const [isPending, startTransition] = useTransition()
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

  // Handle Open Shift
  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(initialCashInput)
    if (isNaN(amount) || amount < 0) {
      showNotification("Ingresá un fondo inicial válido", true)
      return
    }

    startTransition(async () => {
      const res = await openCashShiftAction(businessId, amount)
      if (res.error) {
        showNotification(res.error, true)
      } else {
        const newShift: ShiftRecord = {
          id: res.data.id,
          business_id: businessId,
          opened_by: res.data.opened_by,
          closed_by: null,
          opened_at: res.data.opened_at,
          closed_at: null,
          initial_cash: Number(res.data.initial_cash),
          expected_cash: null,
          actual_cash: null,
          difference: null,
          notes: null,
          status: "open",
          created_at: res.data.created_at,
        }
        setActiveShift(newShift)
        setActiveMetrics({
          shift_id: newShift.id,
          status: "open",
          initial_cash: newShift.initial_cash,
          opened_at: newShift.opened_at,
          cash_sales: 0,
          digital_sales: 0,
          total_sales: 0,
          sales_count: 0,
          expected_cash: newShift.initial_cash,
        })
        showNotification(`Turno de caja abierto con fondo inicial de ${formatMoney(amount)}`)
      }
    })
  }

  // Handle Close Shift (Reconciliation)
  const handleOpenCloseModal = () => {
    const expected = activeMetrics?.expected_cash ?? activeShift?.initial_cash ?? 0
    setCountedCashInput(expected.toString())
    setNotesInput("")
    setIsCloseModalOpen(true)
  }

  const handleConfirmClose = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeShift) return

    const actual = parseFloat(countedCashInput)
    if (isNaN(actual) || actual < 0) {
      showNotification("Ingresá un monto de efectivo contado válido", true)
      return
    }

    const expected = activeMetrics?.expected_cash ?? activeShift.initial_cash
    const difference = actual - expected

    if (Math.abs(difference) > 0.001 && notesInput.trim().length < 4) {
      showNotification(
        "Debés ingresar un motivo o justificación cuando hay diferencia de caja",
        true
      )
      return
    }

    startTransition(async () => {
      const res = await closeCashShiftAction({
        shiftId: activeShift.id,
        actualCash: actual,
        expectedCash: expected,
        notes: notesInput.trim(),
      })

      if (res.error) {
        showNotification(res.error, true)
      } else {
        const closedShift: ShiftRecord = {
          ...activeShift,
          status: "closed",
          closed_at: res.data.closed_at,
          expected_cash: expected,
          actual_cash: actual,
          difference,
          notes: notesInput.trim() || null,
        }
        setHistoryShifts((prev) => [closedShift, ...prev])
        setActiveShift(null)
        setActiveMetrics(null)
        setIsCloseModalOpen(false)
        showNotification(
          `Caja cerrada exitosamente. Arqueo finalizado con diferencia: ${formatMoney(difference)}`
        )
      }
    })
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

      {/* Main Shift Status Card */}
      {activeShift ? (
        /* State B: OPEN SHIFT (Active) */
        <div className="rounded-2xl bg-white border border-neutral-200 p-6 shadow-sm space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h2 className="text-xl font-bold text-[#1F1F1F]">Turno de Caja Abierto</h2>
                </div>
                <p className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Iniciado el {formatDate(activeShift.opened_at)}</span>
                  <span>•</span>
                  <span>Usuario: {userEmail}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenCloseModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-[#1F1F1F] font-bold text-sm shadow-lg shadow-red-500/20 flex items-center gap-2 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Cerrar Turno y Arqueo</span>
            </button>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Fondo Inicial */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                <span>Fondo Inicial</span>
                <Banknote className="w-4 h-4 text-neutral-500" />
              </div>
              <p className="text-xl font-bold font-mono text-[#1F1F1F]">
                {formatMoney(activeShift.initial_cash)}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">Efectivo de apertura</p>
            </div>

            {/* Metric 2: Ventas en Efectivo */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                <span>Ventas Efectivo</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xl font-bold font-mono text-emerald-400">
                {formatMoney(activeMetrics?.cash_sales ?? 0)}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">Cobrado en mano</p>
            </div>

            {/* Metric 3: Ventas Digitales */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                <span>Ventas Digitales</span>
                <CreditCard className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-xl font-bold font-mono text-blue-400">
                {formatMoney(activeMetrics?.digital_sales ?? 0)}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">Transferencias y tarjetas</p>
            </div>

            {/* Metric 4: Efectivo Esperado en Cajón */}
            <div className="p-4 rounded-xl bg-[#FE9820]/10 border border-[#FE9820]/30">
              <div className="flex items-center justify-between text-[#FE9820] text-xs mb-1">
                <span className="font-semibold uppercase tracking-wider">Efectivo Esperado</span>
                <DollarSign className="w-4 h-4 text-[#FE9820]" />
              </div>
              <p className="text-2xl font-black font-mono text-amber-300">
                {formatMoney(activeMetrics?.expected_cash ?? activeShift.initial_cash)}
              </p>
              <p className="text-[11px] text-amber-500/80 mt-1">Fondo + Ventas en efectivo</p>
            </div>
          </div>

          {/* Quick info row */}
          <div className="p-3.5 rounded-xl bg-neutral-50/60 border border-neutral-200/60 flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-neutral-500" />
              <span>
                Total de operaciones registradas:{" "}
                <strong className="text-[#1F1F1F]">{activeMetrics?.sales_count ?? 0} ventas</strong>
              </span>
            </div>
            <span>
              Volumen total facturado:{" "}
              <strong className="text-[#1F1F1F] font-mono">
                {formatMoney(activeMetrics?.total_sales ?? 0)}
              </strong>
            </span>
          </div>
        </div>
      ) : (
        /* State A: CLOSED SHIFT (Need to Open) */
        <div className="rounded-2xl bg-white border border-neutral-200 p-8 shadow-sm text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#FE9820]/15 border border-[#FE9820]/30 flex items-center justify-center text-[#FE9820] mx-auto mb-4 shadow-lg shadow-amber-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-[#1F1F1F] mb-2">La Caja está Cerrada</h2>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mb-6">
            Para comenzar a operar el punto de venta y registrar ventas, abrí un nuevo turno
            indicando el fondo inicial de cambio disponible en el cajón.
          </p>

          <form onSubmit={handleOpenShift} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Fondo Inicial en Efectivo ($)
              </label>
              <div className="relative">
                <DollarSign className="w-5 h-5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-lg font-mono font-bold text-[#1F1F1F] placeholder-neutral-500 focus:outline-none focus:border-[#FE9820]"
                />
              </div>
            </div>

            {/* Quick Amount Shortcuts */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">Montos rápidos:</span>
              {[5000, 10000, 20000, 50000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInitialCashInput(amt.toString())}
                  className="px-2.5 py-1 rounded-lg bg-neutral-50 border border-neutral-200 hover:border-neutral-300 text-xs font-mono text-neutral-700 transition-colors"
                >
                  ${amt.toLocaleString("es-AR")}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-base shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all mt-4"
            >
              {isPending ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Unlock className="w-5 h-5" />
              )}
              <span>Abrir Turno de Caja</span>
            </button>
          </form>
        </div>
      )}

      {/* Historical Shift Log Table */}
      <div className="rounded-2xl bg-white border border-neutral-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#FE9820]" />
            <h3 className="font-bold text-[#1F1F1F] text-base">Historial de Turnos y Arqueos</h3>
          </div>
          <span className="text-xs text-neutral-500">
            {historyShifts.length} turnos registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/60 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4">Fecha y Horarios</th>
                <th className="py-3 px-4 text-right">Fondo Inicial</th>
                <th className="py-3 px-4 text-right">Esperado</th>
                <th className="py-3 px-4 text-right">Real Contado</th>
                <th className="py-3 px-4 text-right">Diferencia</th>
                <th className="py-3 px-4">Observaciones / Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {historyShifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-neutral-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-neutral-400">Sin historial de turnos</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Los turnos cerrados con sus arqueos aparecerán detallados acá.
                    </p>
                  </td>
                </tr>
              ) : (
                historyShifts.map((shift) => {
                  const diff = shift.difference ?? 0
                  const isBalanced = Math.abs(diff) < 0.01
                  const isSurplus = diff > 0.01

                  return (
                    <tr key={shift.id} className="hover:bg-neutral-100/40 transition-colors">
                      {/* Dates */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#1F1F1F]">
                          {formatDate(shift.opened_at)}
                        </p>
                        {shift.closed_at ? (
                          <p className="text-xs text-neutral-500">
                            Cerrado: {formatDate(shift.closed_at)}
                          </p>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            EN CURSO
                          </span>
                        )}
                      </td>

                      {/* Initial Cash */}
                      <td className="py-3.5 px-4 text-right font-mono text-neutral-400">
                        {formatMoney(shift.initial_cash)}
                      </td>

                      {/* Expected */}
                      <td className="py-3.5 px-4 text-right font-mono text-neutral-700">
                        {shift.expected_cash !== null ? formatMoney(shift.expected_cash) : "-"}
                      </td>

                      {/* Actual Counted */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1F1F1F]">
                        {shift.actual_cash !== null ? formatMoney(shift.actual_cash) : "-"}
                      </td>

                      {/* Difference Badge */}
                      <td className="py-3.5 px-4 text-right">
                        {shift.status === "closed" ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                              isBalanced
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : isSurplus
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                                : "bg-red-500/10 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {isSurplus && "+"}
                            {formatMoney(diff)}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-500">-</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-3.5 px-4">
                        {shift.notes ? (
                          <p className="text-xs text-neutral-700 max-w-xs truncate" title={shift.notes}>
                            {shift.notes}
                          </p>
                        ) : (
                          <span className="text-xs text-neutral-600 italic">Sin notas</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Arqueo y Cierre de Caja */}
      {isCloseModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1F1F1F] text-base">Arqueo y Cierre de Caja</h3>
                  <p className="text-xs text-neutral-400">Validá el efectivo físico en cajón</p>
                </div>
              </div>
              <button
                onClick={() => setIsCloseModalOpen(false)}
                className="text-neutral-400 hover:text-[#1F1F1F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Expected Balance Card */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400">Efectivo Teórico Esperado</p>
                <p className="text-2xl font-black font-mono text-[#FE9820] mt-0.5">
                  {formatMoney(activeMetrics?.expected_cash ?? activeShift.initial_cash)}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Fondo Inicial ({formatMoney(activeShift.initial_cash)}) + Ventas Efectivo (
                  {formatMoney(activeMetrics?.cash_sales ?? 0)})
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmClose} className="space-y-4">
              {/* Actual Counted Cash Input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Efectivo Real Contado en Cajón ($) *
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={countedCashInput}
                    onChange={(e) => setCountedCashInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-lg font-mono font-bold text-[#1F1F1F] focus:outline-none focus:border-[#FE9820]"
                  />
                </div>
              </div>

              {/* Dynamic Discrepancy Indicator */}
              {(() => {
                const actual = parseFloat(countedCashInput) || 0
                const expected = activeMetrics?.expected_cash ?? activeShift.initial_cash
                const diff = actual - expected
                const isBalanced = Math.abs(diff) < 0.01
                const isSurplus = diff > 0.01

                return (
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                      isBalanced
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : isSurplus
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isBalanced ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      <span className="font-semibold">
                        {isBalanced
                          ? "Caja Cuadrada (Sin diferencias)"
                          : isSurplus
                          ? "Sobrante de caja detectado"
                          : "Faltante de caja detectado"}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm">
                      {isSurplus && "+"}
                      {formatMoney(diff)}
                    </span>
                  </div>
                )
              })()}

              {/* Mandatory Justification Note if Discrepancy */}
              {(() => {
                const actual = parseFloat(countedCashInput) || 0
                const expected = activeMetrics?.expected_cash ?? activeShift.initial_cash
                const hasDiff = Math.abs(actual - expected) > 0.001

                return (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      {hasDiff ? "Motivo / Justificación de la diferencia *" : "Notas de Cierre (Opcional)"}
                    </label>
                    <textarea
                      rows={2}
                      required={hasDiff}
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      placeholder={
                        hasDiff
                          ? "Explicá el motivo del faltante o sobrante (obligatorio)..."
                          : "Observaciones del turno..."
                      }
                      className={`w-full px-3 py-2 rounded-xl bg-neutral-50 border text-xs text-[#1F1F1F] placeholder-neutral-500 focus:outline-none ${
                        hasDiff && notesInput.trim().length < 4
                          ? "border-red-500/50 focus:border-red-500"
                          : "border-neutral-200 focus:border-[#FE9820]"
                      }`}
                    />
                    {hasDiff && notesInput.trim().length < 4 && (
                      <p className="text-[11px] text-red-400 mt-1">
                        La justificación debe tener al menos 4 caracteres.
                      </p>
                    )}
                  </div>
                )
              })()}

              {/* Modal Actions */}
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-400 hover:text-[#1F1F1F] text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-[#1F1F1F] font-bold text-xs shadow-md shadow-red-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  <span>Confirmar Cierre de Caja</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
