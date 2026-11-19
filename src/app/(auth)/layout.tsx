import React from "react"
import { Store } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-neutral-950 p-4 text-neutral-100">
      <div className="w-full max-w-md flex flex-col items-center mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-neutral-950 font-bold shadow-lg shadow-amber-500/20">
            <Store className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            POS <span className="text-amber-500">Minimercado</span>
          </span>
        </div>
        <p className="text-sm text-neutral-400">
          Tu punto de venta y gestión de stock ágil
        </p>
      </div>

      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
