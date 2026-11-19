"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOutAction } from "@/app/(auth)/actions"
import { BrandIcon, BrandStar } from "@/components/brand/brand-logo"
import {
  Store,
  LayoutDashboard,
  ArrowLeftRight,
  Package,
  Landmark,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ShoppingBag,
} from "lucide-react"

interface Business {
  id: string
  name: string
  industry: string
  currency: string
}

interface DashboardShellProps {
  business: Business
  userEmail: string
  role: string
  isCashShiftOpen?: boolean
  children: React.ReactNode
}

const NAV_ITEMS = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { label: "Punto de Venta", href: "/dashboard/pos", icon: ShoppingBag, badge: "POS" },
  { label: "Movimientos", href: "/dashboard/movements", icon: ArrowLeftRight },
  { label: "Inventario", href: "/dashboard/inventory", icon: Package },
  { label: "Caja y Turnos", href: "/dashboard/cash-register", icon: Landmark },
  { label: "Reportes", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Configuración", href: "/dashboard/settings", icon: Settings },
]

function NavigationLinks({
  pathname,
  isCashShiftOpen = false,
  onItemClick,
}: {
  pathname: string
  isCashShiftOpen?: boolean
  onItemClick?: () => void
}) {
  return (
    <nav className="space-y-1.5 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href)

        const isCashRegisterItem = item.href === "/dashboard/cash-register"

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-brand-subtitle transition-all ${
              isActive
                ? "bg-[#FE9820] text-neutral-950 font-semibold shadow-md shadow-[#FE9820]/20"
                : "text-[#9E9E9E] hover:text-[#F3F3F3] hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 ${isActive ? "text-neutral-950" : "text-[#9E9E9E]"}`} />
              <span>{item.label}</span>
            </div>
            {isCashRegisterItem ? (
              <span
                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide flex items-center gap-1 ${
                  isActive
                    ? "bg-neutral-950 text-neutral-200"
                    : isCashShiftOpen
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/10 text-[#9E9E9E] border border-white/10"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCashShiftOpen ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"
                  }`}
                />
                {isCashShiftOpen ? "Abierta" : "Cerrada"}
              </span>
            ) : item.badge ? (
              <span
                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide ${
                  isActive
                    ? "bg-neutral-950 text-[#FE9820]"
                    : "bg-[#FE9820]/20 text-[#ECAA49] border border-[#FE9820]/30"
                }`}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}

function BusinessHeader({ business }: { business: Business }) {
  return (
    <div className="p-4 border-b border-white/10">
      <div className="flex items-center gap-3">
        <BrandIcon size={38} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-[#F3F3F3] truncate flex items-center gap-1" title={business.name}>
            {business.name}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-brand-caption text-[#9E9E9E] truncate">
              {business.industry}
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/20 text-neutral-300">
              {business.currency}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function UserFooter({
  userEmail,
  roleLabel,
}: {
  userEmail: string
  roleLabel: string
}) {
  return (
    <div className="p-3 border-t border-white/10 mt-auto bg-black/20">
      <div className="flex items-center justify-between px-2 py-1.5 mb-2">
        <div className="min-w-0">
          <p className="text-brand-caption font-medium text-[#F3F3F3] truncate max-w-[140px]" title={userEmail}>
            {userEmail}
          </p>
          <span className="text-[11px] text-[#ECAA49] font-medium">
            Rol: {roleLabel}
          </span>
        </div>
      </div>

      <form action={signOutAction}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-900/50"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>
      </form>
    </div>
  )
}

export function DashboardShell({
  business,
  userEmail,
  role,
  isCashShiftOpen = false,
  children,
}: DashboardShellProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const roleLabel =
    {
      owner: "Dueño",
      manager: "Encargado",
      cashier: "Cajero",
    }[role] || role

  return (
    <div className="dark min-h-screen bg-[#3A3A3A] text-[#F3F3F3] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-30 bg-[#4D4D4D] border-r border-white/10 backdrop-blur">
        <BusinessHeader business={business} />
        <div className="flex-1 overflow-y-auto">
          <NavigationLinks pathname={pathname} isCashShiftOpen={isCashShiftOpen} />
        </div>
        <UserFooter userEmail={userEmail} roleLabel={roleLabel} />
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-[#4D4D4D] border-r border-white/10 flex flex-col z-50">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BrandStar className="w-4 h-4 text-[#FE9820]" />
                <span className="font-semibold text-sm text-[#F3F3F3]">POS Minimercado</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-[#9E9E9E] hover:text-[#F3F3F3] hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <BusinessHeader business={business} />
            <div className="flex-1 overflow-y-auto">
              <NavigationLinks
                pathname={pathname}
                isCashShiftOpen={isCashShiftOpen}
                onItemClick={() => setMobileMenuOpen(false)}
              />
            </div>
            <UserFooter userEmail={userEmail} roleLabel={roleLabel} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[#4D4D4D] border-b border-white/10 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg bg-white/10 text-[#F3F3F3] hover:bg-white/20"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-[#F3F3F3] truncate max-w-[180px]">
                {business.name}
              </h1>
              <p className="text-[11px] text-[#ECAA49] font-medium">
                {business.currency} • {roleLabel}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/pos"
            className="px-2.5 py-1.5 rounded-lg bg-[#FE9820] text-neutral-950 font-bold text-xs flex items-center gap-1 shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>POS</span>
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
