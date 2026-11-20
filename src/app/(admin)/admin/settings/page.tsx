import React from "react"
import { connection } from "next/server"
import { requirePlatformAdmin } from "@/lib/auth/platform-admin"
import {
  Settings,
  CreditCard,
  Building2,
  Bell,
  Save,
  ShieldAlert,
  Globe,
  Sliders,
} from "lucide-react"

export const instant = false

export default async function AdminSettingsPage() {
  await connection()
  await requirePlatformAdmin()

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#1F1F1F]">
          Configuración Global de la Plataforma
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Parámetros generales de cobro, integración con pasarelas de pago y reglas de negocio para los comercios
        </p>
      </div>

      {/* Form sections */}
      <div className="space-y-6">
        {/* Section 1: Monetization Defaults */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100">
            <CreditCard className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-[#1F1F1F]">
              Parámetros de Cobro y Facturación
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700">
                Moneda de facturación de la plataforma
              </label>
              <select
                defaultValue="ARS"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/50 font-medium text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="ARS">ARS ($ - Pesos Argentinos)</option>
                <option value="USD">USD ($ - Dólares Estadounidenses)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700">
                Días de prueba gratuita para nuevos comercios
              </label>
              <input
                type="number"
                defaultValue={30}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/50 font-medium text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700">
                Precio mensual Plan Pro ($)
              </label>
              <input
                type="number"
                defaultValue={15000}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/50 font-medium text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700">
                Precio mensual Plan Enterprise ($)
              </label>
              <input
                type="number"
                defaultValue={35000}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/50 font-medium text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Payment Gateways */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100">
            <Globe className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-[#1F1F1F]">
              Pasarelas de Pago para Cobro de Planes
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
              <div>
                <p className="font-bold text-[#1F1F1F]">Transferencia Bancaria Directa (Alias / CBU)</p>
                <p className="text-neutral-400">Verificación manual de comprobantes subidos por el cliente.</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold text-[11px]">
                Activo
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
              <div>
                <p className="font-bold text-[#1F1F1F]">Mercado Pago Subscriptions (Débito Automático)</p>
                <p className="text-neutral-400">Cobro recurrente mensual automático con tarjeta de débito o crédito.</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-neutral-500 bg-neutral-200/60 font-bold text-[11px]">
                Disponible para configurar
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Platform Guard & Support Mode */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100">
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-[#1F1F1F]">
              Seguridad y Modo Soporte (Impersonación)
            </h3>
          </div>

          <div className="space-y-2 text-xs text-neutral-600">
            <p>
              El modo soporte permite que los superadministradores ingresen a la interfaz de cualquier comercio cliente para resolver inconvenientes operativos de stock, cierres de caja o tickets.
            </p>
            <p className="font-semibold text-purple-700">
              Duración de sesión de soporte: 1 hora (cookie segura y httpOnly con expiración automática).
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Parámetros</span>
          </button>
        </div>
      </div>
    </div>
  )
}
