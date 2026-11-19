import React from "react"
import { Building2 } from "lucide-react"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-neutral-950 p-4 text-neutral-100">
      <div className="w-full max-w-lg flex flex-col items-center mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-3 shadow-lg shadow-amber-500/5">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Configurá tu primer comercio
        </h1>
        <p className="text-sm text-neutral-400 mt-1 max-w-sm">
          Completá los datos básicos para comenzar a operar tu punto de venta e inventario
        </p>
      </div>

      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  )
}
