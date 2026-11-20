"use client"

import React, { useState, useTransition } from "react"
import {
  PlatformBusiness,
  enterSupportModeAction,
} from "../actions"
import {
  Building2,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Store,
  Loader2,
  ArrowUpDown,
  Filter,
} from "lucide-react"

interface BusinessesViewProps {
  initialBusinesses: PlatformBusiness[]
}

export function BusinessesView({ initialBusinesses }: BusinessesViewProps) {
  const [businesses] = useState<PlatformBusiness[]>(initialBusinesses)
  const [search, setSearch] = useState("")
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all")
  const [isPending, startTransition] = useTransition()
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null)

  const filtered = businesses.filter((b) => {
    const q = search.toLowerCase().trim()
    const matchesQuery =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.owner_email.toLowerCase().includes(q) ||
      b.industry.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q)

    if (!matchesQuery) return false

    if (filterActive === "active") return b.is_active
    if (filterActive === "inactive") return !b.is_active
    return true
  })

  const handleSupportJump = (bizId: string) => {
    setActiveTargetId(bizId)
    startTransition(async () => {
      await enterSupportModeAction(bizId)
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1F1F1F]">
            Directorio de Comercios
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gestión de clientes, estado de actividad, facturación acumulada y soporte técnico con impersonación
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
          <Building2 className="w-4 h-4 text-purple-600" />
          <span>{businesses.length} Comercios Registrados</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o rubro..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-xs text-neutral-400 font-medium">Estado:</span>
          <div className="inline-flex rounded-xl border border-neutral-200 p-0.5 bg-neutral-50 text-xs">
            <button
              type="button"
              onClick={() => setFilterActive("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterActive === "all"
                  ? "bg-white text-[#1F1F1F] shadow-xs font-semibold"
                  : "text-neutral-500 hover:text-[#1F1F1F]"
              }`}
            >
              Todos ({businesses.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterActive("active")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterActive === "active"
                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                  : "text-neutral-500 hover:text-[#1F1F1F]"
              }`}
            >
              Activos ({businesses.filter((b) => b.is_active).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterActive("inactive")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterActive === "inactive"
                  ? "bg-white text-neutral-700 shadow-xs font-semibold"
                  : "text-neutral-500 hover:text-[#1F1F1F]"
              }`}
            >
              Inactivos ({businesses.filter((b) => !b.is_active).length})
            </button>
          </div>
        </div>
      </div>

      {/* Businesses Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Comercio</th>
                <th className="px-4 py-3.5">Dueño / Contacto</th>
                <th className="px-4 py-3.5 text-right">Facturación (GMV)</th>
                <th className="px-4 py-3.5 text-center">Ventas</th>
                <th className="px-4 py-3.5">Última Venta</th>
                <th className="px-4 py-3.5 text-center">Estado</th>
                <th className="px-5 py-3.5 text-right">Acción Soporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-neutral-400"
                  >
                    No se encontraron comercios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filtered.map((biz) => {
                  const isCurrentPending = isPending && activeTargetId === biz.id
                  return (
                    <tr
                      key={biz.id}
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      {/* Name & Industry */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FBDAA9] to-[#FE9820] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {biz.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#1F1F1F] text-sm">
                              {biz.name}
                            </p>
                            <p className="text-[11px] text-neutral-400">
                              {biz.industry || "Minimercado"} • {biz.currency}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Owner Email */}
                      <td className="px-4 py-4 text-neutral-600 font-medium">
                        {biz.owner_email}
                      </td>

                      {/* GMV */}
                      <td className="px-4 py-4 text-right">
                        <span className="font-bold text-[#1F1F1F] text-sm">
                          ${Number(biz.total_sales).toLocaleString("es-AR")}
                        </span>
                      </td>

                      {/* Sales Count */}
                      <td className="px-4 py-4 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-semibold">
                          {biz.sales_count}
                        </span>
                      </td>

                      {/* Last Sale */}
                      <td className="px-4 py-4 text-neutral-500">
                        {biz.last_sale_at ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-neutral-400" />
                            <span>
                              {new Date(biz.last_sale_at).toLocaleDateString(
                                "es-AR",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">
                            Sin ventas registradas
                          </span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="px-4 py-4 text-center">
                        {biz.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-500 border border-neutral-200">
                            Inactivo
                          </span>
                        )}
                      </td>

                      {/* Support Mode Jump */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSupportJump(biz.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs transition-all shadow-xs disabled:opacity-50"
                          title={`Ingresar al panel de ${biz.name} en Modo Soporte`}
                        >
                          {isCurrentPending ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Conectando...</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Inspeccionar</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
