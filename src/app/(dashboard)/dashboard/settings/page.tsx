import React from "react"
import Link from "next/link"
import { ArrowLeft, Users, Building2 } from "lucide-react"

export default function SettingsPlaceholderPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Configuración del Comercio</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Ajustes generales del negocio, datos de facturación y administración de empleados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/settings/team"
          className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
            Equipo y Permisos
          </h2>
          <p className="text-sm text-neutral-400">
            Invitá a cajeros y encargados asignando roles con permisos restringidos (RBAC).
          </p>
          <span className="text-xs text-amber-400 font-semibold block pt-2">
            Administrar equipo →
          </span>
        </Link>

        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-white">Datos del Negocio</h2>
          <p className="text-sm text-neutral-400">
            Modificá el nombre comercial, rubro principal y moneda predeterminada (ARS/USD).
          </p>
          <span className="text-xs text-blue-400 font-semibold block pt-2">
            Configuración general
          </span>
        </div>
      </div>

      <div className="pt-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-sm font-medium text-neutral-300 hover:text-white hover:border-neutral-700 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Panel Principal
        </Link>
      </div>
    </div>
  )
}
