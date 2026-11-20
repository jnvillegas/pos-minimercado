import React from "react"
import Link from "next/link"
import { connection } from "next/server"
import { requirePlatformAdmin } from "@/lib/auth/platform-admin"
import { BrandIcon, BrandStar } from "@/components/brand/brand-logo"
import { signOutAction } from "@/app/(auth)/actions"
import {
  ShieldAlert,
  ArrowRight,
  LogOut,
  LayoutDashboard,
  ExternalLink,
} from "lucide-react"

export const instant = false

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await connection()
  const { user, role } = await requirePlatformAdmin()

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1F1F1F] flex flex-col">
      {/* Superadmin Top Banner */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-neutral-200 px-4 sm:px-8 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <BrandIcon size={36} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[#1F1F1F]">
                POS <span className="text-[#FE9820]">Minimercado</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Superadmin
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Panel de Control Global de Plataforma
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 transition-all shadow-xs"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Mi Comercio</span>
          </Link>

          <div className="h-6 w-px bg-neutral-200 hidden sm:block" />

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500 hidden md:inline">{user.email}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  )
}
