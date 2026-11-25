"use client"

import React, { useState, useActionState } from "react"
import { createBusinessOnboardingAction } from "@/app/(onboarding)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowRight, Check, ShoppingCart, Shirt, UtensilsCrossed } from "lucide-react"
import { VERTICAL_OPTIONS, BusinessVertical } from "@/lib/theme/business-theme"

const VERTICAL_ICONS: Record<BusinessVertical, React.ElementType> = {
  minimarket: ShoppingCart,
  clothing: Shirt,
  food: UtensilsCrossed,
}

export function OnboardingForm({ userEmail }: { userEmail: string }) {
  const [selectedVertical, setSelectedVertical] = useState<BusinessVertical>("minimarket")
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS")

  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error?: string } | null, formData: FormData) => {
      return await createBusinessOnboardingAction(formData)
    },
    null
  )

  const activeOption = VERTICAL_OPTIONS.find((v) => v.id === selectedVertical) || VERTICAL_OPTIONS[0]

  return (
    <Card className="border-neutral-800 bg-neutral-900/90 text-neutral-100 backdrop-blur shadow-2xl max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-white">Configurá tu nuevo negocio</CardTitle>
        <CardDescription className="text-neutral-400">
          Asociado a tu cuenta <span className="text-amber-400 font-semibold">{userEmail}</span>. Elegí el rubro para adaptar el Punto de Venta a tu medida.
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-6">
          {state?.error && (
            <div className="p-3 text-sm rounded-lg bg-red-950/60 border border-red-800 text-red-200">
              {state.error}
            </div>
          )}

          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-neutral-200 font-medium">
              Nombre del comercio / marca <span className="text-amber-400">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ej. Almacén Los Primos / Showroom Sol / Rotisería Don Pepe"
              required
              className="border-neutral-700 bg-neutral-950 text-white placeholder:text-neutral-500 text-base h-11"
              autoFocus
            />
          </div>

          {/* Rubro / Vertical Selection Cards */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-neutral-200 font-medium">
                ¿Qué tipo de negocio vas a gestionar? <span className="text-amber-400">*</span>
              </Label>
              <span className="text-xs text-neutral-400">Personaliza colores y flujo del POS</span>
            </div>

            {/* Hidden industry input for server action */}
            <input type="hidden" name="industry" value={activeOption.name} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {VERTICAL_OPTIONS.map((opt) => {
                const Icon = VERTICAL_ICONS[opt.id]
                const isSelected = selectedVertical === opt.id

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedVertical(opt.id)}
                    className={`relative p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer group ${
                      isSelected
                        ? opt.id === "minimarket"
                          ? "border-[#FE9820] bg-[#FE9820]/10 ring-2 ring-[#FE9820]/50"
                          : opt.id === "clothing"
                          ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/50"
                          : "border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/50"
                        : "border-neutral-800 bg-neutral-950/80 hover:border-neutral-700 hover:bg-neutral-950"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected
                              ? opt.id === "minimarket"
                                ? "bg-[#FE9820] text-white shadow-xs"
                                : opt.id === "clothing"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-rose-600 text-white shadow-xs"
                              : "bg-neutral-900 text-neutral-400 group-hover:text-white"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? opt.id === "minimarket"
                                ? "border-[#FE9820] bg-[#FE9820] text-white"
                                : opt.id === "clothing"
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-rose-500 bg-rose-500 text-white"
                              : "border-neutral-700 bg-transparent"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </div>

                      <h4
                        className={`font-bold text-sm mb-1 ${
                          isSelected ? "text-white" : "text-neutral-300"
                        }`}
                      >
                        {opt.shortLabel}
                      </h4>
                      <p className="text-xs text-neutral-400 leading-snug line-clamp-3">
                        {opt.description}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-neutral-800/80 flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: opt.hex }}
                      />
                      <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                        Tema {opt.id === "minimarket" ? "Naranja" : opt.id === "clothing" ? "Verde" : "Rojo"}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Default Currency */}
          <div className="space-y-2">
            <Label className="text-neutral-200 font-medium">
              Moneda predeterminada <span className="text-amber-400">*</span>
            </Label>
            <input type="hidden" name="currency" value={currency} />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCurrency("ARS")}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  currency === "ARS"
                    ? "border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500"
                    : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div>
                  <div className="font-bold text-sm">Pesos Argentinos ($)</div>
                  <div className="text-xs text-neutral-400">ARS</div>
                </div>
                {currency === "ARS" && <Check className="w-4 h-4 text-amber-500" />}
              </button>

              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  currency === "USD"
                    ? "border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500"
                    : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div>
                  <div className="font-bold text-sm">Dólares ($)</div>
                  <div className="text-xs text-neutral-400">USD</div>
                </div>
                {currency === "USD" && <Check className="w-4 h-4 text-amber-500" />}
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className={`w-full font-bold h-12 text-base text-white shadow-lg transition-all cursor-pointer ${
              selectedVertical === "minimarket"
                ? "bg-[#FE9820] hover:bg-[#FE9820]/90 shadow-orange-500/20"
                : selectedVertical === "clothing"
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
            }`}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando tu {activeOption.shortLabel}...
              </>
            ) : (
              <>
                Continuar al Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-neutral-400">
            Quedarás registrado como <span className="text-neutral-200 font-semibold">Dueño (Owner)</span> con acceso total y control exclusivo.
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
