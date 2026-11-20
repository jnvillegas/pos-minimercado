"use client"

import React, { useState, useTransition } from "react"
import Link from "next/link"
import {
  PlatformMetrics,
  PlatformBusiness,
  enterSupportModeAction,
} from "./actions"
import {
  Building2,
  TrendingUp,
  Receipt,
  Store,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Users,
  Settings,
  ArrowRight,
  Sparkles,
  Loader2,
  Clock,
} from "lucide-react"

interface PlatformViewProps {
  initialMetrics: PlatformMetrics
  initialBusinesses: PlatformBusiness[]
}

export function PlatformView({
  initialMetrics,
  initialBusinesses,
}: PlatformViewProps) {
  const [metrics] = useState<PlatformMetrics>(initialMetrics)
  const [businesses] = useState<PlatformBusiness[]>(initialBusinesses)
  const [isPending, startTransition] = useTransition()
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null)

  const handleSupportJump = (bizId: string) => {
    setActiveTargetId(bizId)
    startTransition(async () => {
      await enterSupportModeAction(bizId)
    })
  }

  // Calculate MRR estimate based on active businesses
  const estimatedMRR = businesses.length * 15000 // Average Plan Pro: $15.000/mo

  return (
    <div className="space-y-8">
      {/* Executive Welcome & Platform Health */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-purple-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#FE9820]" />
            <span>Consola Ejecutiva de Plataforma</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Red Multi-Tenant POS Minimercado
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-xl">
            Monitoreo en tiempo real de comercios clientes, volumen de facturación consolidado y liquidaciones.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:items-end gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Infraestructura 100% Operativa</span>
          </div>
          <span className="text-[11px] text-purple-300">
            PostgreSQL RLS • Next.js 16 App Router
          </span>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Businesses */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between hover:border-neutral-300 transition-all">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Total Comercios
            </p>
            <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">
              {metrics.total_businesses}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              {metrics.active_today} con actividad hoy
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Active Today */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between hover:border-neutral-300 transition-all">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Activos Hoy
            </p>
            <h3 className="text-2xl font-black text-[#1F1F1F] mt-1 flex items-center gap-2">
              <span>{metrics.active_today}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Cajas o ventas abiertas
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Store className="w-6 h-6" />
          </div>
        </div>

        {/* Global GMV */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between hover:border-neutral-300 transition-all">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              GMV Consolidado
            </p>
            <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">
              ${Number(metrics.total_gmv).toLocaleString("es-AR")}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Volumen total transaccionado
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Global Sales Count */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between hover:border-neutral-300 transition-all">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Tickets Emitidos
            </p>
            <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">
              {metrics.total_sales_count}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              {metrics.total_products} productos en catálogo
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FE9820]/10 border border-[#FE9820]/20 flex items-center justify-center text-[#FE9820]">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/businesses"
          className="group p-5 rounded-2xl bg-white border border-neutral-200 hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-[#1F1F1F] group-hover:text-purple-700 transition-colors">
              Directorio de Comercios
            </h4>
            <p className="text-xs text-neutral-500">
              Ver los {businesses.length} clientes, consultar su facturación y entrar en Modo Soporte.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-purple-700">
            <span>Ver listado completo</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/subscriptions"
          className="group p-5 rounded-2xl bg-white border border-neutral-200 hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-[#1F1F1F] group-hover:text-purple-700 transition-colors">
              Planes y Suscripciones
            </h4>
            <p className="text-xs text-neutral-500">
              Gestión del modelo SaaS estilo Treinta, cobros recurrentes y cálculo de MRR.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-purple-700">
            <span>Gestionar planes</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/payments"
          className="group p-5 rounded-2xl bg-white border border-neutral-200 hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-[#1F1F1F] group-hover:text-purple-700 transition-colors">
              Cobros y Liquidaciones
            </h4>
            <p className="text-xs text-neutral-500">
              Historial de pagos recibidos, comprobantes y estado de cuenta de cada tienda.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-purple-700">
            <span>Ver cobros</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Top Performing Businesses Preview */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#1F1F1F]">
              Comercios con Mayor Actividad
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Ranking de tiendas por facturación histórica generada
            </p>
          </div>
          <Link
            href="/admin/businesses"
            className="text-xs font-semibold text-purple-700 hover:underline inline-flex items-center gap-1"
          >
            <span>Ver todos ({businesses.length})</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Comercio</th>
                <th className="px-4 py-3">Dueño</th>
                <th className="px-4 py-3 text-right">Facturación</th>
                <th className="px-4 py-3 text-center">Ventas</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-5 py-3 text-right">Soporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {businesses.slice(0, 5).map((biz) => {
                const isCurrentPending = isPending && activeTargetId === biz.id
                return (
                  <tr
                    key={biz.id}
                    className="hover:bg-neutral-50/70 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FBDAA9] to-[#FE9820] text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {biz.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#1F1F1F]">{biz.name}</p>
                          <p className="text-[10px] text-neutral-400">
                            {biz.industry}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-600">
                      {biz.owner_email}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-[#1F1F1F]">
                      ${Number(biz.total_sales).toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-semibold">
                        {biz.sales_count}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {biz.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Activo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-500 border border-neutral-200">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleSupportJump(biz.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs transition-all disabled:opacity-50"
                      >
                        {isCurrentPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <ExternalLink className="w-3 h-3" />
                            <span>Entrar</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
