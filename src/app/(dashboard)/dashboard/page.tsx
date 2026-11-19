import React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  ShoppingBag,
  Package,
  Landmark,
  ArrowLeftRight,
  ShieldCheck,
  Building2,
  Sparkles,
} from "lucide-react"

export const instant = false

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: members } = await supabase
    .from("business_members")
    .select(`
      role,
      businesses (
        id,
        name,
        industry,
        currency,
        created_at
      )
    `)
    .eq("user_id", user?.id)
    .limit(1)

  const membership = members?.[0]
  const business = Array.isArray(membership?.businesses)
    ? membership?.businesses[0]
    : membership?.businesses

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/20 via-neutral-900 to-neutral-900 border border-amber-500/30 p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Panel de Operaciones
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            ¡Hola! Bienvenido a <span className="text-amber-400">{business?.name || "tu comercio"}</span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 mt-2">
            Gestioná tus ventas en mostrador, controlá el inventario y auditá los turnos de caja en tiempo real con aislamiento total de datos.
          </p>
        </div>
      </div>

      {/* Quick Action Cards (Treinta style) */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span>Accesos rápidos</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/pos"
            className="group p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800/80 transition-all flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-white text-base">Punto de Venta</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Cobro ágil con lector de código de barras o cámara del celular.
              </p>
            </div>
            <span className="text-xs text-amber-400 font-semibold mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Abrir POS &rarr;
            </span>
          </Link>

          <Link
            href="/dashboard/inventory"
            className="group p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800/80 transition-all flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-white text-base">Inventario y Stock</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Catálogo de productos, alertas de stock mínimo e importación masiva Excel.
              </p>
            </div>
            <span className="text-xs text-blue-400 font-semibold mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Ver catálogo &rarr;
            </span>
          </Link>

          <Link
            href="/dashboard/cash-register"
            className="group p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800/80 transition-all flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-white text-base">Caja y Turnos</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Apertura y cierre de caja con control de sobrantes y faltantes de dinero.
              </p>
            </div>
            <span className="text-xs text-emerald-400 font-semibold mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Control de caja &rarr;
            </span>
          </Link>

          <Link
            href="/dashboard/movements"
            className="group p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800/80 transition-all flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition-transform">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-white text-base">Movimientos</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Libro diario de ingresos por ventas y registro de gastos o proveedores.
              </p>
            </div>
            <span className="text-xs text-purple-400 font-semibold mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Ver libro diario &rarr;
            </span>
          </Link>
        </div>
      </div>

      {/* Tenancy Security Card */}
      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Aislamiento Multi-Tenant Activo</h4>
            <p className="text-xs text-neutral-400">
              Tus datos están protegidos por Row Level Security (RLS) en Supabase bajo el ID de comercio <code className="text-neutral-300 font-mono text-[11px] bg-neutral-800 px-1.5 py-0.5 rounded">{business?.id}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-300 bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700/60 shrink-0">
          <Building2 className="w-4 h-4 text-amber-400" />
          <span>Rubro: <strong className="text-white">{business?.industry}</strong></span>
          <span className="text-neutral-500">•</span>
          <span>Moneda: <strong className="text-white">{business?.currency}</strong></span>
        </div>
      </div>
    </div>
  )
}
