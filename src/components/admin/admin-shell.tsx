"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOutAction } from "@/app/(auth)/actions"
import { BrandIcon } from "@/components/brand/brand-logo"
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Receipt,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Store,
  ExternalLink,
} from "lucide-react"

interface AdminShellProps {
  userEmail: string
  totalBusinesses?: number
  children: React.ReactNode
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: string | number
}

interface NavGroup {
  title: string
  items: NavItem[]
}

export function AdminShell({
  userEmail,
  totalBusinesses = 0,
  children,
}: AdminShellProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navGroups: NavGroup[] = [
    {
      title: "Plataforma",
      items: [
        {
          label: "Métricas Globales",
          href: "/admin",
          icon: LayoutDashboard,
        },
        {
          label: "Comercios",
          href: "/admin/businesses",
          icon: Building2,
          badge: totalBusinesses > 0 ? totalBusinesses : undefined,
        },
      ],
    },
    {
      title: "Monetización",
      items: [
        {
          label: "Suscripciones",
          href: "/admin/subscriptions",
          icon: CreditCard,
          badge: "SaaS",
        },
        {
          label: "Cobros y Pagos",
          href: "/admin/payments",
          icon: Receipt,
        },
      ],
    },
    {
      title: "Sistema",
      items: [
        {
          label: "Equipo Admin",
          href: "/admin/team",
          icon: Users,
        },
        {
          label: "Configuración",
          href: "/admin/settings",
          icon: Settings,
        },
      ],
    },
  ]

  const getPageTitle = () => {
    if (pathname === "/admin") return "Métricas Globales"
    if (pathname.startsWith("/admin/businesses")) return "Comercios Registrados"
    if (pathname.startsWith("/admin/subscriptions")) return "Planes y Suscripciones"
    if (pathname.startsWith("/admin/payments")) return "Cobros y Pagos"
    if (pathname.startsWith("/admin/team")) return "Equipo de Superadmin"
    if (pathname.startsWith("/admin/settings")) return "Configuración de Plataforma"
    return "Panel Superadmin"
  }

  const renderNavGroupList = (onItemClick?: () => void) => (
    <div className="space-y-4 px-3 py-3">
      {navGroups.map((group) => (
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
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href)

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
                        isActive
                          ? "text-purple-600"
                          : "text-neutral-400 group-hover:text-neutral-600"
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide ${
                        isActive
                          ? "bg-purple-100 text-purple-700 border border-purple-200"
                          : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Active Indicator Right Bar */}
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-purple-600" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1F1F1F] flex">
      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 z-30 bg-white border-r border-neutral-200 shadow-sm transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandIcon size={36} className="shrink-0" />
            {!isCollapsed && (
              <div className="min-w-0 flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-[#1F1F1F]">
                    POS <span className="text-[#FE9820]">Admin</span>
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    Super
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 truncate">
                  Gestión de Red Multi-Tenant
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

        {/* Grouped Nav Items */}
        <div className="flex-1 overflow-y-auto">{renderNavGroupList()}</div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-neutral-200 space-y-2 mt-auto bg-neutral-50/50">
          {!isCollapsed ? (
            <Link
              href="/dashboard"
              className="flex items-center justify-between px-3 py-2 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-all shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#FE9820]" />
                <span>Volver a mi Comercio</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            </Link>
          ) : (
            <div className="flex justify-center">
              <Link
                href="/dashboard"
                title="Volver a mi Comercio"
                className="p-2 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 text-[#FE9820] shadow-xs"
              >
                <Store className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* User Card */}
          <div
            className={`p-2 rounded-xl bg-white border border-neutral-200/80 flex items-center ${
              isCollapsed ? "justify-center" : "justify-between"
            } gap-2.5 shadow-xs`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 text-left">
                  <p className="text-xs font-semibold text-[#1F1F1F] truncate">
                    Superadmin
                  </p>
                  <p
                    className="text-[10px] text-neutral-400 truncate"
                    title={userEmail}
                  >
                    {userEmail}
                  </p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
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
                <span className="font-bold text-sm text-[#1F1F1F]">
                  POS Superadmin
                </span>
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
              {renderNavGroupList(() => setMobileMenuOpen(false))}
            </div>
            <div className="p-3 border-t border-neutral-200 bg-neutral-50/50 space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-[#FE9820] bg-orange-50 border border-orange-200 rounded-lg"
              >
                <Store className="w-4 h-4" />
                <span>Volver a mi Comercio</span>
              </Link>
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-500 font-medium">
              <span>Superadmin</span>
              <span>/</span>
              <span className="text-[#1F1F1F] font-semibold">
                {getPageTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Multi-Tenant RLS Activo</span>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-all shadow-xs"
            >
              <Store className="w-3.5 h-3.5 text-[#FE9820]" />
              <span className="hidden sm:inline">Mi Comercio</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
