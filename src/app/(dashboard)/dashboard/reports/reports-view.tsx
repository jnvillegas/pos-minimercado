"use client"

import React, { useState, useTransition } from "react"
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Download,
  Clock,
  CreditCard,
  Package,
  RefreshCw,
  Trophy,
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import * as XLSX from "xlsx"
import { fetchFinancialReportAction } from "./actions"

export interface FinancialReportData {
  gross_revenue: number
  cogs: number
  gross_profit: number
  margin_pct: number
  sales_count: number
  aov: number
  daily_trend: {
    sale_date: string
    revenue: number
    count: number
  }[]
  hourly_distribution: {
    hour_of_day: number
    sales_count: number
    revenue: number
  }[]
  payment_methods: {
    payment_method: string
    count: number
    total: number
  }[]
  top_products: {
    product_name: string
    units_sold: number
    revenue: number
    cost: number
    profit: number
  }[]
}

interface ReportsViewProps {
  initialReport: FinancialReportData
  businessId: string
  currency: string
}

type PeriodPreset = "today" | "7days" | "30days" | "this_month"

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"]

export function ReportsView({
  initialReport,
  businessId,
  currency,
}: ReportsViewProps) {
  const [report, setReport] = useState<FinancialReportData>(initialReport)
  const [activePeriod, setActivePeriod] = useState<PeriodPreset>("30days")
  const [productSortBy, setProductSortBy] = useState<"profit" | "units">("profit")
  const [isPending, startTransition] = useTransition()

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "ARS",
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Calculate Dates for Selected Preset
  const handlePeriodChange = (preset: PeriodPreset) => {
    setActivePeriod(preset)
    const now = new Date()
    let startDate: Date
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    switch (preset) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        break
      case "7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        startDate.setHours(0, 0, 0, 0)
        break
      case "30days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        startDate.setHours(0, 0, 0, 0)
        break
      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
        break
    }

    startTransition(async () => {
      const res = await fetchFinancialReportAction(
        businessId,
        startDate.toISOString(),
        endDate.toISOString()
      )
      if (res.success && res.data) {
        setReport(res.data as FinancialReportData)
      }
    })
  }

  // Excel Multi-Tab Export
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new()

    // Sheet 1: Executive Summary
    const summaryData = [
      { Métrica: "Facturación Bruta (Ventas)", Valor: report.gross_revenue },
      { Métrica: "Costo de Mercadería (COGS)", Valor: report.cogs },
      { Métrica: "Ganancia Bruta", Valor: report.gross_profit },
      { Métrica: "Margen Bruto (%)", Valor: `${report.margin_pct}%` },
      { Métrica: "Cantidad Total de Ventas", Valor: report.sales_count },
      { Métrica: "Ticket Promedio (AOV)", Valor: report.aov },
    ]
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen Ejecutivo")

    // Sheet 2: Top Products
    const productsData = (report.top_products || []).map((p, idx) => ({
      Ranking: idx + 1,
      Producto: p.product_name,
      UnidadesVendidas: Number(p.units_sold),
      Facturacion: Number(p.revenue),
      CostoTotal: Number(p.cost),
      GananciaNeta: Number(p.profit),
      Margen: p.revenue > 0 ? `${Math.round((p.profit / p.revenue) * 100)}%` : "0%",
    }))
    const productsSheet = XLSX.utils.json_to_sheet(productsData)
    XLSX.utils.book_append_sheet(workbook, productsSheet, "Top Productos")

    // Sheet 3: Payment Methods
    const paymentData = (report.payment_methods || []).map((pm) => ({
      MetodoDePago: pm.payment_method,
      CantidadOperaciones: pm.count,
      TotalFacturado: Number(pm.total),
    }))
    const paymentSheet = XLSX.utils.json_to_sheet(paymentData)
    XLSX.utils.book_append_sheet(workbook, paymentSheet, "Metodos de Pago")

    XLSX.writeFile(workbook, `reporte_financiero_${activePeriod}.xlsx`)
  }

  // Sorted Top Products
  const sortedTopProducts = [...(report.top_products || [])].sort((a, b) => {
    if (productSortBy === "profit") {
      return b.profit - a.profit
    }
    return b.units_sold - a.units_sold
  })

  // Format Payment Method Name
  const formatPaymentName = (method: string) => {
    switch (method) {
      case "cash":
        return "Efectivo"
      case "transfer":
        return "Transferencia"
      case "debit_card":
        return "Débito"
      case "credit_card":
        return "Crédito"
      default:
        return method
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1F1F1F]">
            Reportes Financieros y Rentabilidad
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Analítica de facturación, costo de mercadería, margen comercial y horas pico de venta
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-white border border-neutral-200">
            {(
              [
                { id: "today", label: "Hoy" },
                { id: "7days", label: "7 Días" },
                { id: "30days", label: "30 Días" },
                { id: "this_month", label: "Mes Actual" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => handlePeriodChange(p.id)}
                disabled={isPending}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePeriod === p.id
                    ? "bg-[#FE9820] text-neutral-950 shadow-sm"
                    : "text-neutral-400 hover:text-[#1F1F1F]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 text-xs font-semibold text-neutral-800 hover:text-[#1F1F1F] transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Loading state indicator */}
      {isPending && (
        <div className="p-3 rounded-xl bg-white/60 border border-neutral-200 text-xs text-[#FE9820] flex items-center gap-2 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Actualizando métricas financieras...</span>
        </div>
      )}

      {/* 5 Headline Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Facturación Total */}
        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-medium uppercase tracking-wider">Facturación</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold font-mono text-[#1F1F1F] mt-1">
            {formatMoney(report.gross_revenue)}
          </h3>
          <p className="text-[11px] text-neutral-500 mt-1">Ingresos brutos por ventas</p>
        </div>

        {/* Card 2: Costo de Mercadería (COGS) */}
        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-medium uppercase tracking-wider">Costo (COGS)</span>
            <Package className="w-4 h-4 text-neutral-500" />
          </div>
          <h3 className="text-xl font-bold font-mono text-neutral-700 mt-1">
            {formatMoney(report.cogs)}
          </h3>
          <p className="text-[11px] text-neutral-500 mt-1">Costo de reposición</p>
        </div>

        {/* Card 3: Ganancia Bruta & Margen % */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Ganancia Bruta</span>
            <span className="font-bold font-mono text-xs bg-emerald-500/20 px-1.5 py-0.5 rounded">
              {report.margin_pct}%
            </span>
          </div>
          <h3 className="text-xl font-black font-mono text-emerald-400 mt-1">
            {formatMoney(report.gross_profit)}
          </h3>
          <p className="text-[11px] text-emerald-500/80 mt-1">Ventas menos costos</p>
        </div>

        {/* Card 4: Ticket Promedio (AOV) */}
        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-medium uppercase tracking-wider">Ticket Promedio</span>
            <ShoppingBag className="w-4 h-4 text-[#FE9820]" />
          </div>
          <h3 className="text-xl font-bold font-mono text-amber-300 mt-1">
            {formatMoney(report.aov)}
          </h3>
          <p className="text-[11px] text-neutral-500 mt-1">Gasto medio por cliente</p>
        </div>

        {/* Card 5: Cantidad de Ventas */}
        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-medium uppercase tracking-wider">Operaciones</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold font-mono text-[#1F1F1F] mt-1">
            {report.sales_count}
          </h3>
          <p className="text-[11px] text-neutral-500 mt-1">Tickets emitidos</p>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: Daily Revenue Trend (Area Chart) */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-neutral-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FE9820]" />
              <h3 className="font-bold text-[#1F1F1F] text-sm">Evolución de Facturación Diaria</h3>
            </div>
            <span className="text-[11px] text-neutral-500">Monto total facturado por día</span>
          </div>

          <div className="h-64 w-full pt-2">
            {report.daily_trend && report.daily_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={report.daily_trend}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="sale_date"
                    stroke="#737373"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#737373"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `$${val.toLocaleString("es-AR")}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      borderColor: "#262626",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [`$${Number(value || 0).toLocaleString("es-AR")}`, "Venta"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-500">
                Sin ventas registradas en el período seleccionado.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Payment Methods Share (Donut / Pie Chart) */}
        <div className="rounded-2xl bg-white border border-neutral-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-[#1F1F1F] text-sm">Métodos de Cobro</h3>
            </div>
          </div>

          <div className="h-52 w-full">
            {report.payment_methods && report.payment_methods.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={report.payment_methods}
                    dataKey="total"
                    nameKey="payment_method"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {report.payment_methods.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      borderColor: "#262626",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val) => [`$${Number(val || 0).toLocaleString("es-AR")}`, "Total"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-500">
                Sin cobros registrados
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-200/80">
            {(report.payment_methods || []).map((pm, idx) => (
              <div
                key={pm.payment_method}
                className="flex items-center justify-between text-xs text-neutral-700"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span>{formatPaymentName(pm.payment_method)}</span>
                </div>
                <span className="font-mono font-semibold">
                  {formatMoney(Number(pm.total))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Peak Hours Distribution (Bar Chart) */}
      <div className="rounded-2xl bg-white border border-neutral-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-[#1F1F1F] text-sm">
              Horarios Pico de Atención (Volumen de Tickets)
            </h3>
          </div>
          <span className="text-[11px] text-neutral-500">
            Identificá las franjas horarias con mayor afluencia de clientes
          </span>
        </div>

        <div className="h-56 w-full pt-2">
          {report.hourly_distribution && report.hourly_distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.hourly_distribution}>
                <XAxis
                  dataKey="hour_of_day"
                  stroke="#737373"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${val}:00`}
                />
                <YAxis
                  stroke="#737373"
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    borderColor: "#262626",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val) => [`${val || 0} operaciones`, "Tickets"]}
                  labelFormatter={(lbl) => `Horario: ${lbl}:00 hs`}
                />
                <Bar
                  dataKey="sales_count"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-neutral-500">
              Sin datos de franja horaria en este período.
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Top 10 Best-Selling Products Table */}
      <div className="rounded-2xl bg-white border border-neutral-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FE9820]" />
            <h3 className="font-bold text-[#1F1F1F] text-base">
              Top 10 Productos Más Rentables y Vendidos
            </h3>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-neutral-50 border border-neutral-200">
            <button
              onClick={() => setProductSortBy("profit")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                productSortBy === "profit"
                  ? "bg-emerald-500 text-neutral-950 shadow-sm"
                  : "text-neutral-400 hover:text-[#1F1F1F]"
              }`}
            >
              Mayor Ganancia ($)
            </button>
            <button
              onClick={() => setProductSortBy("units")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                productSortBy === "units"
                  ? "bg-[#FE9820] text-neutral-950 shadow-sm"
                  : "text-neutral-400 hover:text-[#1F1F1F]"
              }`}
            >
              Más Vendidos (Unidades)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/60 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4 text-center">Unidades</th>
                <th className="py-3 px-4 text-right">Facturación</th>
                <th className="py-3 px-4 text-right">Costo Total</th>
                <th className="py-3 px-4 text-right">Ganancia Neta</th>
                <th className="py-3 px-4 text-right">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {sortedTopProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-neutral-500">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-neutral-400">Sin datos de productos</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Los artículos vendidos en este período aparecerán ranqueados acá.
                    </p>
                  </td>
                </tr>
              ) : (
                sortedTopProducts.map((prod, idx) => {
                  const margin =
                    prod.revenue > 0
                      ? Math.round((prod.profit / prod.revenue) * 100)
                      : 0

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-neutral-100/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-bold text-xs font-mono text-amber-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#1F1F1F]">
                        {prod.product_name}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-neutral-700">
                        {prod.units_sold}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-700">
                        {formatMoney(prod.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-500">
                        {formatMoney(prod.cost)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatMoney(prod.profit)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                            margin >= 40
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : margin >= 20
                              ? "bg-[#FE9820]/10 text-[#FE9820] border border-[#FE9820]/30"
                              : "bg-neutral-800 text-neutral-400"
                          }`}
                        >
                          {margin}%
                        </span>
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
