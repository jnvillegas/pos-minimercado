"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOutAction } from "@/app/(auth)/actions"
import { BrandIcon, BrandStar } from "@/components/brand/brand-logo"
import {
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
  Bell,
  Printer,
  ChevronDown,
  ChevronsUpDown,
  HelpCircle,
  Store,
  PanelLeftClose,
  PanelLeftOpen,
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

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Operaciones",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Punto de Venta", href: "/dashboard/pos", icon: ShoppingBag, badge: "POS" },
      { label: "Inventario", href: "/dashboard/inventory", icon: Package },
    ],
  },
  {
    title: "Finanzas",
    items: [
      { label: "Caja y Turnos", href: "/dashboard/cash-register", icon: Landmark },
      { label: "Movimientos", href: "/dashboard/movements", icon: ArrowLeftRight },
    ],
  },
  {
    title: "Gestión",
    items: [
      { label: "Reportes", href: "/dashboard/reports", icon: BarChart3 },
      { label: "Configuración", href: "/dashboard/settings", icon: Settings },
    ],
  },
]

function NavigationGroupList({
  pathname,
  isCashShiftOpen = false,
  isCollapsed = false,
  onItemClick,
}: {
  pathname: string
  isCashShiftOpen?: boolean
  isCollapsed?: boolean
  onItemClick?: () => void
}) {
  return (
    <div className="space-y-4 px-3 py-3">
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="space-y-1">
          {!isCollapsed && (
            <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              {group.title}
            </h3>
          )}
          <div className="space-y-1">
            {group.items.map((item) => {
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
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center ${
                    isCollapsed ? "justify-center px-2" : "justify-between px-3.5"
                  } py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#FE9820] text-white font-semibold shadow-md shadow-[#FE9820]/25"
                      : "text-neutral-600 hover:text-[#1F1F1F] hover:bg-neutral-100/80"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-neutral-500"}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && (
                    <>
                      {isCashRegisterItem ? (
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide flex items-center gap-1 ${
                            isActive
                              ? "bg-white/20 text-white"
                              : isCashShiftOpen
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCashShiftOpen ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"
                            }`}
                          />
                          {isCashShiftOpen ? "Abierta" : "Cerrada"}
                        </span>
                      ) : item.badge ? (
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide ${
                            isActive
                              ? "bg-white text-[#FE9820]"
                              : "bg-[#FE9820]/10 text-[#FE9820] border border-[#FE9820]/20"
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [notifTooltip, setNotifTooltip] = useState(false)

  const roleLabel =
    {
      owner: "Dueño",
      manager: "Encargado",
      cashier: "Cajero",
    }[role] || role

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1F1F1F] flex">
      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 z-30 bg-white border-r border-neutral-200 shadow-sm transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandIcon size={36} className="shrink-0" />
            {!isCollapsed && (
              <div className="min-w-0 flex flex-col">
                <span className="font-bold text-base tracking-tight text-[#1F1F1F] flex items-center gap-1">
                  POS <span className="text-[#FE9820]">Minimercado</span>
                </span>
                <span className="text-[10px] text-neutral-400 truncate">
                  {business.industry}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-[#1F1F1F] hover:bg-neutral-100 transition-colors"
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Grouped Navigation Links */}
        <div className="flex-1 overflow-y-auto">
          <NavigationGroupList
            pathname={pathname}
            isCashShiftOpen={isCashShiftOpen}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Sidebar Bottom / User Card */}
        <div className="p-3 border-t border-neutral-200 space-y-2 mt-auto bg-neutral-50/50">
          {!isCollapsed && (
            <div className="space-y-0.5 px-1">
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-[#1F1F1F] hover:bg-neutral-100 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Centro de Ayuda</span>
              </Link>
            </div>
          )}

          {/* User Account Card */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className={`w-full p-2 rounded-xl bg-white border border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50/80 transition-all flex items-center ${
                isCollapsed ? "justify-center" : "justify-between"
              } gap-2.5 shadow-xs`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FBDAA9] to-[#FE9820] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {business.name.charAt(0).toUpperCase()}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-semibold text-[#1F1F1F] truncate" title={business.name}>
                      {business.name}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate" title={userEmail}>
                      {userEmail}
                    </p>
                  </div>
                )}
              </div>
              {!isCollapsed && <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-white rounded-2xl border border-neutral-200 shadow-xl space-y-1 z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-neutral-100">
                  <p className="text-xs font-bold text-[#1F1F1F]">{business.name}</p>
                  <p className="text-[11px] text-[#FE9820] font-semibold mt-0.5">
                    Rol: {roleLabel} • {business.currency}
                  </p>
                </div>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white border-r border-neutral-200 flex flex-col z-50 shadow-2xl">
            <div className="flex items-center justify-between p-3.5 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <BrandIcon size={32} />
                <span className="font-bold text-sm text-[#1F1F1F]">POS Minimercado</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-[#1F1F1F] hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavigationGroupList
                pathname={pathname}
                isCashShiftOpen={isCashShiftOpen}
                onItemClick={() => setMobileMenuOpen(false)}
              />
            </div>
            <div className="p-3 border-t border-neutral-200 bg-neutral-50/50">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* DESKTOP & MOBILE TOP BAR */}
        <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur border-b border-neutral-200/80 px-4 sm:px-8 flex items-center justify-between">
          {/* Left Side: Mobile Hamburger & Page Context */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-500 font-medium">
              <span>POS Minimercado</span>
              <span>/</span>
              <span className="text-[#1F1F1F] font-semibold capitalize">
                {pathname.replace("/dashboard", "").replace("/", "") || "Panel General"}
              </span>
            </div>
          </div>

          {/* Right Side: Quick Action Icons & Business Pill */}
          <div className="flex items-center gap-2.5">
            {/* Quick Action 1: Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifTooltip(!notifTooltip)}
                className="p-2 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-[#1F1F1F] transition-all relative"
                title="Notificaciones"
              >
                <Bell className="w-4 h-4" />
                {isCashShiftOpen && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
              {notifTooltip && (
                <div className="absolute right-0 mt-2 w-64 p-3 bg-white rounded-2xl border border-neutral-200 shadow-xl z-50 text-xs space-y-2 animate-fadeIn">
                  <div className="font-bold text-[#1F1F1F] border-b border-neutral-100 pb-1.5">
                    Notificaciones del Sistema
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCashShiftOpen ? "bg-emerald-500" : "bg-neutral-400"
                      }`}
                    />
                    <span>
                      Caja actual: <strong>{isCashShiftOpen ? "Abierta" : "Cerrada"}</strong>
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Aislamiento multi-tenant activo para {business.name}.
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action 2: Quick POS / Ticket shortcut */}
            <Link
              href="/dashboard/pos"
              className="p-2 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-[#1F1F1F] transition-all"
              title="Abrir terminal de ventas"
            >
              <Printer className="w-4 h-4" />
            </Link>

            {/* Store / Business Switcher Pill Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-xs"
              >
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200">
                  {business.currency}
                </span>
                <span className="text-xs font-bold text-[#1F1F1F] max-w-[120px] sm:max-w-[180px] truncate">
                  {business.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
