"use client"

import React, { useState, useTransition } from "react"
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
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  Users,
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
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null)

  const filteredBusinesses = businesses.filter((b) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      b.name.toLowerCase().includes(q) ||
      b.owner_email.toLowerCase().includes(q) ||
      b.industry.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q)
    )
  })

  const handleSupportJump = (bizId: string) => {
    setActiveTargetId(bizId)
    startTransition(async () => {
      await enterSupportModeAction(bizId)
    })
  }

  return (
    <div className="space-y-6">
      {/* Executive Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1F1F1F]">
            Panel de Superadmin
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Métricas consolidadas de la plataforma, volumen de facturación y directorio de comercios
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>Aislamiento RLS en vigor</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Businesses */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between">
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
          <div className="w-12 h-12 rounded-xl bg-[#FE9820]/10 border border-[#FE9820]/20 flex items-center justify-center text-[#FE9820]">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Active Today */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Activos Hoy
            </p>
            <h3 className="text-2xl font-black text-[#1F1F1F] mt-1 flex items-center gap-2">
              <span>{metrics.active_today}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Turnos o ventas registradas
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Store className="w-6 h-6" />
          </div>
        </div>

        {/* Global GMV */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              GMV Plataforma
            </p>
            <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">
              ${Number(metrics.total_gmv).toLocaleString("es-AR")}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Facturación acumulada
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Global Sales Count */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Tickets Emitidos
            </p>
            <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">
              {metrics.total_sales_count}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              {metrics.total_products} productos activos
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tenants Directory Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#1F1F1F]">
              Directorio de Comercios Registrados
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
              {filteredBusinesses.length}
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por comercio, dueño o rubro..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 bg-white text-xs text-[#1F1F1F] placeholder:text-neutral-400 focus:outline-none focus:border-[#FE9820] shadow-xs"
            />
          </div>
        </div>

        {/* Businesses Table */}
        <div className="rounded-2xl bg-white border border-neutral-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Comercio</th>
                  <th className="py-3 px-4">Dueño</th>
                  <th className="py-3 px-4">Rubro</th>
                  <th className="py-3 px-4 text-right">Ventas Totales</th>
                  <th className="py-3 px-4 text-right">Tickets</th>
                  <th className="py-3 px-4">Última Venta</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-neutral-500">
                      No se encontraron comercios registrados
                    </td>
                  </tr>
                ) : (
                  filteredBusinesses.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-neutral-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-[#1F1F1F]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {b.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#1F1F1F]">{b.name}</p>
                            <span className="font-mono text-[10px] text-neutral-400">
                              ID: {b.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-neutral-600 font-medium">
                        {b.owner_email}
                      </td>

                      <td className="py-3.5 px-4 text-neutral-500">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200 text-[11px]">
                          {b.industry || "General"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1F1F1F]">
                        ${b.total_sales.toLocaleString("es-AR")}{" "}
                        <span className="text-[10px] font-normal text-neutral-400">
                          {b.currency}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-neutral-600">
                        {b.sales_count}
                      </td>

                      <td className="py-3.5 px-4 text-neutral-500 text-[11px]">
                        {b.last_sale_at ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            <span>
                              {new Date(b.last_sale_at).toLocaleDateString(
                                "es-AR",
                                { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">Sin ventas aún</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              b.is_active ? "bg-emerald-500" : "bg-neutral-400"
                            }`}
                          />
                          {b.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleSupportJump(b.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-[#FE9820] hover:text-white text-neutral-700 font-semibold text-xs border border-neutral-200 transition-all shadow-2xs"
                          title="Ingresar al panel de este comercio para soporte"
                        >
                          {isPending && activeTargetId === b.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5" />
                          )}
                          <span>Soporte</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
