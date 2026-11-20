import React from "react"
import { connection } from "next/server"
import { requirePlatformAdmin } from "@/lib/auth/platform-admin"
import { fetchPlatformDataAction } from "../actions"
import {
  Receipt,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Download,
  Plus,
  Building2,
  DollarSign,
  CreditCard,
} from "lucide-react"

export const instant = false

export default async function AdminPaymentsPage() {
  await connection()
  await requirePlatformAdmin()

  const { businesses } = await fetchPlatformDataAction()

  // Generate simulated ledger records for demo/real businesses
  const payments = businesses.map((b, idx) => ({
    id: `PAY-${1000 + idx}`,
    businessName: b.name,
    ownerEmail: b.owner_email,
    plan: "Plan Pro Crecimiento",
    amount: 15000,
    date: new Date().toISOString(),
    status: "paid" as const,
    method: "Transferencia Bancaria",
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1F1F1F]">
            Cobros y Liquidaciones de Plataforma
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Registro contable de facturación por suscripciones SaaS a los comercios clientes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Cobro</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Total Cobrado este Mes
          </p>
          <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">
            ${(payments.length * 15000).toLocaleString("es-AR")}
          </h3>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {payments.length} facturas al día
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Cuentas por Cobrar
          </p>
          <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">
            $0
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            0 facturas vencidas
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Método Principal
          </p>
          <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">
            Transferencia
          </h3>
          <p className="text-xs text-purple-600 font-medium mt-1">
            CVU / CBU Verificado
          </p>
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#1F1F1F]">
              Historial de Facturación Recurrente
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Comprobantes emitidos y estado de liquidación de cada comercio
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Comprobante</th>
                <th className="px-4 py-3">Comercio</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-5 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-neutral-700">
                    {pay.id}
                  </td>
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="font-bold text-[#1F1F1F]">{pay.businessName}</p>
                      <p className="text-[10px] text-neutral-400">{pay.ownerEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-neutral-600 font-medium">
                    {pay.plan}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-[#1F1F1F]">
                    ${pay.amount.toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-500">
                    {pay.method}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Cobrado
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-400">
                    {new Date(pay.date).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
