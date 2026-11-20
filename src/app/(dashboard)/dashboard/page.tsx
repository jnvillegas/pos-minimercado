import React from "react"
import Link from "next/link"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getActiveBusinessContext } from "@/lib/auth/business-context"
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
  await connection()

  const { business } = await getActiveBusinessContext()

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Brand Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FBDAA9] via-[#FE9820] to-[#FE9820] p-6 sm:p-8 text-white shadow-lg shadow-[#FE9820]/20">
        <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 rounded-l-full pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Panel de Operaciones
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
            ¡Hola! Bienvenido a <span>{business?.name || "tu comercio"}</span>
          </h1>
          <p className="text-sm sm:text-base text-white/90 mt-2 font-medium">
            Gestioná tus ventas en mostrador, controlá el inventario y auditá los turnos de caja en tiempo real con aislamiento total de datos.
          </p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div>
        <h2 className="text-lg font-bold text-[#1F1F1F] mb-3 flex items-center gap-2">
          <span>Accesos rápidos</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/pos"
            className="group p-5 rounded-2xl bg-white border border-neutral-200 hover:border-[#FE9820] hover:shadow-md transition-all flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#FE9820]/15 border border-[#FE9820]/30 flex items-center justify-center text-[#FE9820] mb-4 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-[#1F1F1F] text-base">Punto de Venta</h3>
              <p className="text-xs text-[#9E9E9E] mt-1">
                Cobro ágil con lector de código de barras o cámara del celular.
              </p>
            </div>
            <span className="text-xs text-[#FE9820] font-semibold mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Abrir POS &rarr;
            </span>
          </Link>

          <Link
            href="/dashboard/inventory"
            className="group p-5 rounded-2xl bg-white border border-neutral-200 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-105 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-[#1F1F1F] text-base">Inventario y Stock</h3>
              <p className="text-xs text-[#9E9E9E] mt-1">
                Catálogo de productos, alertas de stock mínimo e importación masiva Excel.
              </p>
            </div>
            <span className="text-xs text-blue-600 font-semibold mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Ver catálogo &rarr;
            </span>
          </Link>

          <Link
            href="/dashboard/cash-register"
            className="group p-5 rounded-2xl bg-white border border-neutral-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-105 transition-transform">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-[#1F1F1F] text-base">Caja y Turnos</h3>
              <p className="text-xs text-[#9E9E9E] mt-1">
                Apertura y cierre de caja con control de sobrantes y faltantes de dinero.
              </p>
            </div>
            <span className="text-xs text-emerald-600 font-semibold mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Control de caja &rarr;
            </span>
          </Link>

          <Link
            href="/dashboard/movements"
            className="group p-5 rounded-2xl bg-white border border-neutral-200 hover:border-purple-500 hover:shadow-md transition-all flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-105 transition-transform">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-[#1F1F1F] text-base">Movimientos</h3>
              <p className="text-xs text-[#9E9E9E] mt-1">
                Libro diario de ingresos por ventas y registro de gastos o proveedores.
              </p>
            </div>
            <span className="text-xs text-purple-600 font-semibold mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Ver libro diario &rarr;
            </span>
          </Link>
        </div>
      </div>

      {/* Tenancy Security Card */}
      <div className="p-5 rounded-2xl bg-white border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#1F1F1F]">Aislamiento Multi-Tenant Activo</h4>
            <p className="text-xs text-[#9E9E9E]">
              Tus datos están protegidos por Row Level Security (RLS) en Supabase bajo el ID de comercio <code className="text-neutral-700 font-mono text-[11px] bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded">{business?.id}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200 shrink-0">
          <Building2 className="w-4 h-4 text-[#FE9820]" />
          <span>Rubro: <strong className="text-[#1F1F1F]">{business?.industry}</strong></span>
          <span className="text-neutral-400">•</span>
          <span>Moneda: <strong className="text-[#1F1F1F]">{business?.currency}</strong></span>
        </div>
      </div>
    </div>
  )
}
