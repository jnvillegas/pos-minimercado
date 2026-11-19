import React from "react"
import { BrandLogo } from "@/components/brand/brand-logo"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dark min-h-screen flex flex-col justify-center items-center bg-[#3A3A3A] p-4 text-[#F3F3F3]">
      <div className="w-full max-w-md flex flex-col items-center mb-6">
        <BrandLogo
          size="lg"
          subtitle="Tu punto de venta y gestión de stock ágil"
          className="items-center text-center flex-col gap-2"
        />
      </div>

      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
