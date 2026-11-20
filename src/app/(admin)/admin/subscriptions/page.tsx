import React from "react"
import { connection } from "next/server"
import { requirePlatformAdmin } from "@/lib/auth/platform-admin"
import { fetchPlatformDataAction } from "../actions"
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
} from "lucide-react"

export const instant = false

export default async function AdminSubscriptionsPage() {
  await connection()
  await requirePlatformAdmin()

  const { metrics, businesses } = await fetchPlatformDataAction()

  const totalBusinesses = businesses.length
  const proPrice = 15000 // ARS
  const enterprisePrice = 35000 // ARS

  // Estimated tiers distribution
  const estimatedMRR = totalBusinesses * proPrice

  const tiers = [
    {
      id: "free",
      name: "Plan Almacén Inicial",
      subtitle: "Para pequeños comercios familiares o de barrio",
      price: "$0",
      period: "Gratis para siempre",
      highlight: false,
      features: [
        "Hasta 100 productos en catálogo",
        "1 Caja registradora activa",
        "Punto de venta táctil rápido",
        "Control de stock básico",
        "Ticket digital por WhatsApp",
      ],
      currentCount: 0,
      badge: "Entrada",
    },
    {
      id: "pro",
      name: "Plan Pro Crecimiento",
      subtitle: "El estándar para minimercados y autoservicios activos",
      price: "$15.000",
      period: "/ mes por sucursal",
      highlight: true,
      features: [
        "Catálogo y productos ilimitados",
        "Cajeros y encargados ilimitados",
        "Cierre de turnos ciego con arqueo de caja",
        "Reportes financieros y márgenes en tiempo real",
        "Importación / exportación masiva en Excel",
        "Soporte prioritario por WhatsApp",
      ],
      currentCount: totalBusinesses,
      badge: "Más Popular",
    },
    {
      id: "enterprise",
      name: "Plan Cadena & Franquicias",
      subtitle: "Para dueños con 2 o más sucursales",
      price: "$35.000",
      period: "/ mes multitienda",
      highlight: false,
      features: [
        "Todo lo incluido en el Plan Pro",
        "Múltiples sucursales consolidadas",
        "Facturación electrónica AFIP integrada",
        "Auditoría de aperturas de caja por video/PIN",
        "Gerente de cuenta dedicado",
        "SLA de disponibilidad 99.9%",
      ],
      currentCount: 0,
      badge: "Corporativo",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1F1F1F]">
            Planes y Suscripciones (Modelo SaaS)
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Estructura de monetización basada en el modelo Treinta: planes mensuales por volumen y funciones premium
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <span>Modelo de Suscripción Recurrente</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            MRR Estimado (Mensual)
          </p>
          <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">
            ${Number(estimatedMRR).toLocaleString("es-AR")}
          </h3>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            Ingresos recurrentes proyectados
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            ARR Anualizado
          </p>
          <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">
            ${Number(estimatedMRR * 12).toLocaleString("es-AR")}
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Valor de la cartera a 12 meses
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Comercios Activos
          </p>
          <h3 className="text-2xl font-black text-[#1F1F1F] mt-1">
            {totalBusinesses}
          </h3>
          <p className="text-xs text-purple-600 font-medium mt-1">
            100% Retención en plataforma
          </p>
        </div>
      </div>

      {/* Pricing Tiers Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
              tier.highlight
                ? "bg-white border-2 border-purple-500 shadow-lg relative"
                : "bg-white border border-neutral-200 shadow-xs"
            }`}
          >
            {tier.highlight && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FE9820]" />
                <span>{tier.badge}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-[#1F1F1F]">{tier.name}</h3>
                {!tier.highlight && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                    {tier.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-1">{tier.subtitle}</p>

              <div className="mt-6 mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-[#1F1F1F]">
                    {tier.price}
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">
                    {tier.period}
                  </span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-50 text-[11px] font-semibold text-neutral-600 border border-neutral-100">
                  <Users className="w-3.5 h-3.5 text-neutral-400" />
                  <span>
                    {tier.currentCount} {tier.currentCount === 1 ? "comercio" : "comercios"} asignados
                  </span>
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-5 space-y-3">
                <p className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Incluye:
                </p>
                <ul className="space-y-2.5 text-xs text-neutral-600">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          tier.highlight ? "text-purple-600" : "text-emerald-600"
                        }`}
                      />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-100">
              <button
                type="button"
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                  tier.highlight
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                    : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
                }`}
              >
                Configurar Parámetros del Plan
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Monetization Model Info Box */}
      <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#1F1F1F]">
              Estrategia de Crecimiento & Monetización
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              Al igual que Treinta, el POS puede ofrecer un período de prueba de 30 días gratuitos y luego habilitar el cobro recurrente por transferencia bancaria o débito automático con Mercado Pago.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-all shadow-xs shrink-0"
        >
          <span>Guía de Precios</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
