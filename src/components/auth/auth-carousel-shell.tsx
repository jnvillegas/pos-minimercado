"use client"

import React, { useState, useEffect } from "react"
import { BrandLogo } from "@/components/brand/brand-logo"

interface CarouselSlide {
  id: "minimarket" | "clothing" | "food"
  label: string
  image: string
  quote: string
  author: string
  accentDot: string
}

const SLIDES: CarouselSlide[] = [
  {
    id: "minimarket",
    label: "Minimercado & Almacén",
    image: "/images/auth/minimarket.jpg",
    quote:
      "Desde que usamos el sistema en nuestro almacén, cobramos el doble de rápido con el lector de códigos y llevamos la libreta de fiado sin perder un solo peso.",
    author: "Martín González — Almacén Don Martín",
    accentDot: "bg-[#FE9820]",
  },
  {
    id: "clothing",
    label: "Ropa & Showroom",
    image: "/images/auth/clothing.jpg",
    quote:
      "Necesitábamos algo ágil para nuestro showroom sin planillas eternas. En minutos cargamos las prendas y controlamos la caja diaria desde el celular.",
    author: "Lucía Fernández — Aura Indumentaria",
    accentDot: "bg-[#10B981]",
  },
  {
    id: "food",
    label: "Comida al paso & Rotisería",
    image: "/images/auth/food.jpg",
    quote:
      "Para nuestra rotisería fue un antes y un después. Tomamos el pedido en mostrador y marcamos con un clic qué está pendiente y qué ya salió.",
    author: "Diego Morales — La Esquina Rotisería",
    accentDot: "bg-[#EF4444]",
  },
]

export function AuthCarouselShell({ children }: { children: React.ReactNode }) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [])

  const currentSlide = SLIDES[activeIndex]

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-neutral-950 flex flex-col lg:flex-row text-[#1F1F1F]">
      {/* Background Carousel Images (full-bleed 100% viewport behind the floating card) */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        {SLIDES.map((slide, idx) => (
          <img
            key={slide.id}
            src={slide.image}
            alt={slide.label}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out ${
              idx === activeIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {/* Gradient overlay for high-contrast testimonial readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/15" />
      </div>

      {/* LEFT SIDE: Floating White Auth Card */}
      <div className="relative z-20 w-full lg:w-[440px] xl:w-[470px] shrink-0 p-3 sm:p-5 lg:p-6 min-h-screen lg:min-h-0 flex">
        <div className="w-full bg-white rounded-[22px] shadow-2xl flex flex-col justify-between p-6 sm:p-8 overflow-y-auto">
          {/* Top Brand Header */}
          <div className="flex justify-center pt-1 pb-4">
            <BrandLogo size="sm" />
          </div>

          {/* Form Slot (Login or Register) */}
          <div className="my-auto py-2">{children}</div>

          {/* Footer */}
          <div className="pt-4 text-center text-[11px] font-medium text-neutral-400">
            © 2026 POS App — Gestión multi-rubro
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Editorial Testimonial & 3-Slide Progress Indicators */}
      <div className="relative z-10 hidden lg:flex flex-1 flex-col justify-end p-10 xl:p-14 text-white">
        <div className="max-w-xl space-y-4">
          {/* Vertical Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide">
            <span className={`w-2 h-2 rounded-full ${currentSlide.accentDot}`} />
            <span>{currentSlide.label}</span>
          </div>

          {/* Quote Mark */}
          <div className="text-5xl font-serif leading-none text-white/90 select-none -mb-2">
            &ldquo;
          </div>

          {/* Testimonial Copy */}
          <p className="text-lg xl:text-xl font-medium leading-relaxed text-white/95 drop-shadow-sm transition-all duration-500">
            {currentSlide.quote}
          </p>

          <p className="text-sm font-semibold text-white/80">
            {currentSlide.author}
          </p>

          {/* 3 Clickable Carousel Progress Bars */}
          <div className="grid grid-cols-3 gap-2.5 pt-3">
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Ver ejemplo de ${slide.label}`}
                className="group py-2 cursor-pointer focus:outline-none"
              >
                <div
                  className={`h-1 w-full rounded-full transition-all duration-300 ${
                    idx === activeIndex
                      ? "bg-white"
                      : "bg-white/35 group-hover:bg-white/60"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
