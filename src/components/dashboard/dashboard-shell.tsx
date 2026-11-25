"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOutAction } from "@/app/(auth)/actions"
import { exitSupportModeAction } from "@/app/(admin)/admin/actions"
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
  ShieldAlert,
  User,
  Users,
  Truck,
  UtensilsCrossed,
} from "lucide-react"
import { getBusinessTheme, BusinessTheme } from "@/lib/theme/business-theme"

interface Business {
  id: string
  name: string
  industry: string
  currency: string
}

interface DashboardShellProps {
  business: Business
  userEmail: string
  userName?: string
  role: string
  isCashShiftOpen?: boolean
  isPlatformAdmin?: boolean
  isSupportMode?: boolean
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
      { label: "Proveedores", href: "/dashboard/suppliers", icon: Truck },
      { label: "Clientes", href: "/dashboard/customers", icon: Users },
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
    ],
  },
]

function NavigationGroupList({
  pathname,
  isCashShiftOpen = false,
  isCollapsed = false,
  onItemClick,
  theme,
}: {
  pathname: string
  isCashShiftOpen?: boolean
  isCollapsed?: boolean
  onItemClick?: () => void
  theme?: BusinessTheme
}) {
  const primaryText = theme?.primaryText || "text-[#FE9820]"
  const primaryBg = theme?.primaryBg || "bg-[#FE9820]"
  const badgeBg = theme?.badgeBg || "bg-[#FE9820]/15"
  const badgeBorder = theme?.badgeBorder || "border-[#FE9820]/30"

  const isFood = theme?.vertical === "food"
  const groups = NAV_GROUPS.map((group) => {
    if (group.title === "Operaciones" && isFood) {
      const items = [...group.items]
      const posIdx = items.findIndex((i) => i.href === "/dashboard/pos")
      const orderItem: NavItem = {
        label: "Pedidos / Despacho",
        href: "/dashboard/orders",
        icon: UtensilsCrossed,
        badge: "Cocina",
      }
      if (posIdx >= 0) {
        items.splice(posIdx + 1, 0, orderItem)
      } else {
        items.push(orderItem)
      }
      return { ...group, items }
    }
    return group
  })

  return (
    <div className="space-y-4 px-3 py-3">
      {groups.map((group) => (
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
                  className={`group relative flex items-center ${
                    isCollapsed ? "justify-center px-2" : "justify-between px-3.5"
                  } py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "text-[#1F1F1F] font-semibold bg-neutral-50/90"
                      : "text-neutral-500 hover:text-[#1F1F1F] hover:bg-neutral-50/80"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive ? primaryText : "text-neutral-400 group-hover:text-neutral-600"
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && (
                    <div className="flex items-center gap-2">
                      {isCashRegisterItem ? (
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide flex items-center gap-1 ${
                            isCashShiftOpen
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
                              ? `${badgeBg} ${primaryText} ${badgeBorder}`
                              : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}

                      {/* Right-edge vertical active indicator bar */}
                      {isActive && (
                        <span className={`w-1 h-5 rounded-full ${primaryBg} shrink-0 shadow-xs`} />
                      )}
                    </div>
                  )}

                  {/* If collapsed and active, show small right indicator */}
                  {isCollapsed && isActive && (
                    <span className={`absolute right-1 w-1 h-4 rounded-full ${primaryBg}`} />
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
  userName,
  role,
  isCashShiftOpen = false,
  isPlatformAdmin = false,
  isSupportMode = false,
  children,
}: DashboardShellProps) {
  const pathname = usePathname()
  const theme = getBusinessTheme(business.industry)
  const displayName = userName?.trim() || userEmail.split("@")[0]
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
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
                  POS <span className={theme.primaryText}>{theme.shortLabel}</span>
                </span>
                <span className="text-[10px] text-neutral-400 truncate">
                  {business.name}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-[#1F1F1F] hover:bg-neutral-100 transition-colors cursor-pointer"
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
            theme={theme}
          />
        </div>

        {/* Sidebar Bottom / User Card */}
        <div className="p-3 border-t border-neutral-200 space-y-2 mt-auto bg-neutral-50/50">
          {!isCollapsed ? (
            <div className="space-y-0.5 px-1">
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-[#1F1F1F] hover:bg-neutral-100 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Centro de Ayuda</span>
              </Link>
              <Link
                href="/dashboard/settings"
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  pathname.startsWith("/dashboard/settings")
                    ? "text-[#FE9820] font-semibold bg-[#FE9820]/10"
                    : "text-neutral-500 hover:text-[#1F1F1F] hover:bg-neutral-100"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Configuración</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-1 flex flex-col items-center">
              <Link
                href="/dashboard/settings"
                title="Configuración"
                className={`p-2 rounded-lg transition-colors ${
                  pathname.startsWith("/dashboard/settings")
                    ? "text-[#FE9820] bg-[#FE9820]/10"
                    : "text-neutral-500 hover:text-[#1F1F1F] hover:bg-neutral-100"
                }`}
              >
                <Settings className="w-4 h-4" />
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
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.gradientAvatar} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}>
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

                <Link
                  href="/dashboard/profile"
                  onClick={() => setUserDropdownOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-700 hover:text-[#1F1F1F] hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4 text-[#FE9820]" />
                  <span>Mi Perfil</span>
                </Link>

                {isPlatformAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4 text-purple-600" />
                    <span>Panel Superadmin</span>
                  </Link>
                )}

                {isSupportMode && (
                  <form action={exitSupportModeAction}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-amber-600" />
                      <span>Salir de Modo Soporte</span>
                    </button>
                  </form>
                )}

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
                theme={theme}
              />
            </div>
            <div className="p-3 border-t border-neutral-200 bg-neutral-50/50 space-y-2">
              <div className="space-y-0.5">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-[#1F1F1F] hover:bg-neutral-100 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Centro de Ayuda</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-[#1F1F1F] hover:bg-neutral-100 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Configuración</span>
                </Link>
              </div>

              {isPlatformAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  <span>Panel Superadmin</span>
                </Link>
              )}

              {isSupportMode && (
                <form action={exitSupportModeAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-amber-600" />
                    <span>Salir de Modo Soporte</span>
                  </button>
                </form>
              )}

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
        {/* Support Mode Notification Banner */}
        {isSupportMode && (
          <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-xs z-30">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Modo Soporte Plataforma activo: inspeccionando comercio <strong>{business.name}</strong>
              </span>
            </div>
            <form action={exitSupportModeAction}>
              <button
                type="submit"
                className="px-2.5 py-1 bg-white text-amber-900 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors shadow-xs"
              >
                Volver al Superadmin
              </button>
            </form>
          </div>
        )}

        {/* DESKTOP & MOBILE TOP BAR */}
        <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur border-b border-neutral-200/80 px-4 sm:px-8 flex items-center justify-between">
          {/* Left Side: User Profile Avatar & Greeting (Image 2 style) + Page Context */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen)
                  setMobileMoreOpen(false)
                }}
                className="flex items-center gap-2 p-1 rounded-2xl hover:bg-neutral-100 transition-all text-left"
                title="Perfil de Usuario"
                aria-label="Perfil de Usuario"
              >
                <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${theme.gradientAvatar} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs ring-2 ring-white`}>
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <div className="block">
                  <div className="text-[10px] text-neutral-400 font-medium leading-none">Hola,</div>
                  <div className="text-xs font-bold text-[#1F1F1F] leading-tight truncate max-w-[110px] sm:max-w-[160px]">
                    {displayName}
                  </div>
                </div>
              </button>

              {/* Profile Dropdown (Superadmin, Support Mode, Cerrar Sesión) */}
              {profileDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white border border-neutral-200 rounded-3xl p-3 shadow-2xl z-50 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-3 p-2.5 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${theme.gradientAvatar} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs`}>
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[#1F1F1F] truncate">{displayName}</div>
                        <div className="text-[11px] text-neutral-500 font-medium capitalize">
                          {roleLabel} • {business.name}
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/dashboard/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-neutral-800 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                    >
                      <User className={`w-4 h-4 ${theme.primaryText}`} />
                      <span>Mi Perfil</span>
                    </Link>

                    {isPlatformAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-purple-700 bg-purple-50/70 hover:bg-purple-100/70 transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4 text-purple-600" />
                        <span>Panel Superadmin</span>
                      </Link>
                    )}

                    {isSupportMode && (
                      <form action={exitSupportModeAction} className="w-full">
                        <button
                          type="submit"
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-600" />
                          <span>Volver al Superadmin</span>
                        </button>
                      </form>
                    )}

                    <div className="h-px bg-neutral-100 my-1" />

                    <form action={signOutAction} className="w-full">
                      <button
                        type="submit"
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </form>
                  </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 font-medium">
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

            {/* Quick Action 2: Quick POS / Ticket shortcut (Desktop only) */}
            <Link
              href="/dashboard/pos"
              className="hidden sm:flex p-2 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-[#1F1F1F] transition-all"
              title="Abrir terminal de ventas"
            >
              <Printer className="w-4 h-4" />
            </Link>

            {/* Store / Business Switcher Pill Button (Desktop only) */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-xs cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200">
                  {business.currency}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${theme.badgeBg} ${theme.primaryText} border ${theme.badgeBorder}`}>
                  {theme.badgeLabel}
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Invisible Click-away Overlay (100% transparent, outside of transformed containers) */}
      {(mobileMoreOpen || profileDropdownOpen) && (
        <div
          className="fixed inset-0 z-40 bg-transparent print:hidden"
          onClick={() => {
            setMobileMoreOpen(false)
            setProfileDropdownOpen(false)
          }}
        />
      )}

      {/* FLOATING MOBILE DOCK (LIGHT GLASS BUBBLE BAR) */}
      <nav
        aria-label="Navegación móvil rápida"
        style={{ backgroundColor: "#FFFFFF" }}
        className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md bg-white border border-neutral-200/90 shadow-2xl shadow-neutral-900/10 rounded-3xl sm:rounded-full px-2 py-1.5 flex items-center justify-between pointer-events-auto print:hidden"
      >
        {/* 1. Stock / Inventario */}
        {pathname.startsWith("/dashboard/inventory") ? (
          <Link
            href="/dashboard/inventory"
            className={`flex items-center gap-2 ${theme.badgeBg} border ${theme.badgeBorder} p-1 pr-3.5 rounded-full shadow-xs transition-all shrink-0`}
          >
            <span className={`w-8 h-8 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0 shadow-xs`}>
              <Package className="w-4 h-4" />
            </span>
            <span className={`text-xs font-bold ${theme.badgeText}`}>Stock</span>
          </Link>
        ) : (
          <Link
            href="/dashboard/inventory"
            className="w-10 h-10 rounded-full bg-neutral-100/70 hover:bg-neutral-100 border border-neutral-200/50 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-all shrink-0 active:scale-95"
            title="Inventario de Stock"
          >
            <Package className="w-5 h-5" />
          </Link>
        )}

        {/* 2. Caja y Turnos */}
        {pathname.startsWith("/dashboard/cash-register") ? (
          <Link
            href="/dashboard/cash-register"
            className={`flex items-center gap-2 ${theme.badgeBg} border ${theme.badgeBorder} p-1 pr-3.5 rounded-full shadow-xs transition-all shrink-0`}
          >
            <span className={`w-8 h-8 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0 shadow-xs`}>
              <Landmark className="w-4 h-4" />
            </span>
            <span className={`text-xs font-bold ${theme.badgeText}`}>Caja</span>
          </Link>
        ) : (
          <Link
            href="/dashboard/cash-register"
            className="relative w-10 h-10 rounded-full bg-neutral-100/70 hover:bg-neutral-100 border border-neutral-200/50 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-all shrink-0 active:scale-95"
            title="Caja y Turnos"
          >
            <Landmark className="w-5 h-5" />
            {isCashShiftOpen && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </Link>
        )}

        {/* 3. POS - HERO CENTER ACTION */}
        {pathname.startsWith("/dashboard/pos") ? (
          <Link
            href="/dashboard/pos"
            className={`flex items-center gap-2 ${theme.badgeBg} border ${theme.badgeBorder} p-1 pr-3.5 rounded-full shadow-xs transition-all shrink-0`}
          >
            <span className={`w-8 h-8 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0 shadow-xs`}>
              <ShoppingBag className="w-4 h-4" />
            </span>
            <span className={`text-xs font-bold ${theme.badgeText}`}>POS</span>
          </Link>
        ) : (
          <Link
            href="/dashboard/pos"
            className="w-10 h-10 rounded-full bg-neutral-100/70 hover:bg-neutral-100 border border-neutral-200/50 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-all shrink-0 active:scale-95"
            title="Punto de Venta"
          >
            <ShoppingBag className="w-5 h-5" />
          </Link>
        )}

        {/* 4. Movimientos / Flujo */}
        {pathname.startsWith("/dashboard/movements") ? (
          <Link
            href="/dashboard/movements"
            className={`flex items-center gap-2 ${theme.badgeBg} border ${theme.badgeBorder} p-1 pr-3.5 rounded-full shadow-xs transition-all shrink-0`}
          >
            <span className={`w-8 h-8 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0 shadow-xs`}>
              <ArrowLeftRight className="w-4 h-4" />
            </span>
            <span className={`text-xs font-bold ${theme.badgeText}`}>Flujo</span>
          </Link>
        ) : (
          <Link
            href="/dashboard/movements"
            className="w-10 h-10 rounded-full bg-neutral-100/70 hover:bg-neutral-100 border border-neutral-200/50 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-all shrink-0 active:scale-95"
            title="Movimientos y Flujo Diario"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </Link>
        )}

        {/* 5. Menú / Más opciones (Desplegable Popover) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setMobileMoreOpen(!mobileMoreOpen)
              setProfileDropdownOpen(false)
            }}
            className="w-10 h-10 rounded-full bg-neutral-100/70 hover:bg-neutral-100 border border-neutral-200/50 text-neutral-600 hover:text-neutral-900 transition-all flex items-center justify-center shrink-0 active:scale-95"
            title="Abrir opciones adicionales"
            aria-label="Abrir opciones adicionales"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Popover Desplegable con opciones restantes */}
          {mobileMoreOpen && (
            <div
              style={{ backgroundColor: "#FFFFFF" }}
              className="absolute bottom-14 right-0 w-60 bg-white border border-neutral-200 rounded-3xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5"
            >
                <div className="px-3 py-1.5 border-b border-neutral-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Opciones
                  </span>
                  <span className="text-[11px] font-semibold text-neutral-500 truncate max-w-[120px]">
                    {business.name}
                  </span>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setMobileMoreOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-colors ${
                    pathname === "/dashboard"
                      ? "bg-amber-50 text-amber-900 font-bold"
                      : "text-neutral-700 hover:text-[#1F1F1F] hover:bg-neutral-50"
                  }`}
                >
                  Panel General
                </Link>

                {theme.vertical === "food" && (
                  <Link
                    href="/dashboard/orders"
                    onClick={() => setMobileMoreOpen(false)}
                    className={`block px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-colors ${
                      pathname.startsWith("/dashboard/orders")
                        ? "bg-rose-50 text-rose-900 font-bold"
                        : "text-neutral-700 hover:text-[#1F1F1F] hover:bg-neutral-50"
                    }`}
                  >
                    Pedidos / Despacho
                  </Link>
                )}

                <Link
                  href="/dashboard/reports"
                  onClick={() => setMobileMoreOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-colors ${
                    pathname.startsWith("/dashboard/reports")
                      ? "bg-amber-50 text-amber-900 font-bold"
                      : "text-neutral-700 hover:text-[#1F1F1F] hover:bg-neutral-50"
                  }`}
                >
                  Reportes y Estadísticas
                </Link>

                <Link
                  href="/dashboard/settings"
                  onClick={() => setMobileMoreOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-colors ${
                    pathname.startsWith("/dashboard/settings")
                      ? "bg-amber-50 text-amber-900 font-bold"
                      : "text-neutral-700 hover:text-[#1F1F1F] hover:bg-neutral-50"
                  }`}
                >
                  Configuración del Negocio
                </Link>

                <Link
                  href="/dashboard/settings"
                  onClick={() => setMobileMoreOpen(false)}
                  className="block px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-neutral-500 hover:text-[#1F1F1F] hover:bg-neutral-50 transition-colors"
                >
                  Centro de Ayuda
                </Link>
              </div>
          )}
        </div>
      </nav>
    </div>
  )
}
