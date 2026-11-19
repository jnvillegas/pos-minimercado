import React from "react"
import { BrandLogo } from "@/components/brand/brand-logo"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dark min-h-screen flex flex-col justify-center items-center bg-[#3A3A3A] p-4 text-[#F3F3F3]">
      <div className="w-full max-w-lg flex flex-col items-center mb-6 text-center">
        <BrandLogo
          size="lg"
          subtitle="Punto de venta y gestión de stock ágil"
          className="items-center text-center flex-col gap-2 mb-3"
        />
        <h1 className="text-brand-h1 text-[#F3F3F3]">
          Configurá tu primer comercio
        </h1>
        <p className="text-brand-caption text-[#9E9E9E] mt-1 max-w-sm">
          Completá los datos básicos para comenzar a operar tu punto de venta e inventario
        </p>
      </div>

      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  )
}
