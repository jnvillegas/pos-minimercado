import React from "react"
import Link from "next/link"

export function BrandStar({ className = "w-4 h-4 text-white" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z" />
    </svg>
  )
}

export function BrandIcon({
  className = "w-10 h-10",
  size = 40,
}: {
  className?: string
  size?: number
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-2xl bg-gradient-to-br from-[#FBDAA9] via-[#FE9820] to-[#ECAA49] p-2 flex items-center justify-center shadow-lg shadow-[#FE9820]/25 shrink-0 overflow-hidden ${className}`}
    >
      {/* 4-quadrant petals with negative-space 4-point star in the center */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <path
          d="M24 4C24 15.0457 15.0457 24 4 24C15.0457 24 24 32.9543 24 44C24 32.9543 32.9543 24 44 24C32.9543 24 24 15.0457 24 4Z"
          fill="white"
        />
      </svg>
    </div>
  )
}

export function BrandLogo({
  href,
  subtitle,
  size = "md",
  className = "",
}: {
  href?: string
  subtitle?: string
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const iconSizes = {
    sm: 32,
    md: 40,
    lg: 48,
  }

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  }

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <BrandIcon size={iconSizes[size]} />
      <div className="flex flex-col">
        <div className={`flex items-center gap-1.5 font-bold tracking-tight text-foreground ${textSizes[size]}`}>
          <span>POS</span>
          <span className="text-[#FE9820] dark:text-[#ECAA49] flex items-center gap-1">
            Minimercado
            <BrandStar className="w-3.5 h-3.5 fill-[#FE9820] dark:fill-[#ECAA49] inline-block animate-pulse" />
          </span>
        </div>
        {subtitle && (
          <span className="text-xs text-muted-foreground font-normal">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9820] rounded-xl">
        {content}
      </Link>
    )
  }

  return content
}

export function BrandCard({
  className = "",
}: {
  className?: string
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FBDAA9] via-[#FE9820] to-[#FE9820] p-6 text-white shadow-xl shadow-[#FE9820]/20 flex items-center justify-between ${className}`}
    >
      {/* Decorative organic background curve */}
      <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/15 rounded-l-full pointer-events-none" />

      <div className="relative z-10 flex items-center gap-3">
        <BrandIcon size={44} className="bg-white/20 shadow-none border border-white/30" />
        <div>
          <h3 className="text-2xl font-bold tracking-tight flex items-center gap-1.5 text-white drop-shadow-sm">
            POS Minimercado
            <BrandStar className="w-4 h-4 fill-white" />
          </h3>
          <p className="text-xs text-white/90 font-medium">
            Punto de venta y gestión de stock ágil
          </p>
        </div>
      </div>
    </div>
  )
}
