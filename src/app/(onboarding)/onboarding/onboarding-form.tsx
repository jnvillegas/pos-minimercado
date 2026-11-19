"use client"

import React, { useState, useActionState } from "react"
import { createBusinessOnboardingAction } from "@/app/(onboarding)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowRight, Check } from "lucide-react"

const INDUSTRY_PRESETS = [
  "Minimercado / Autoservicio",
  "Almacén de barrio",
  "Kiosco / Drugstore",
  "Fiambrería / Granja",
  "Verdulería / Frutería",
  "Comercio de Servicios",
]

export function OnboardingForm({ userEmail }: { userEmail: string }) {
  const [selectedIndustry, setSelectedIndustry] = useState(INDUSTRY_PRESETS[0])
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS")

  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error?: string } | null, formData: FormData) => {
      return await createBusinessOnboardingAction(formData)
    },
    null
  )

  return (
    <Card className="border-neutral-800 bg-neutral-900/90 text-neutral-100 backdrop-blur shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold text-white">Datos de tu negocio</CardTitle>
        <CardDescription className="text-neutral-400">
          Asociado a la cuenta <span className="text-amber-400 font-medium">{userEmail}</span>
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-5">
          {state?.error && (
            <div className="p-3 text-sm rounded-lg bg-red-950/60 border border-red-800 text-red-200">
              {state.error}
            </div>
          )}

          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-neutral-300">
              Nombre del comercio / fantasía <span className="text-amber-400">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ej. Minimercado San Cayetano"
              required
              className="border-neutral-700 bg-neutral-950 text-white placeholder:text-neutral-500 text-base"
              autoFocus
            />
          </div>

          {/* Industry / Rubro */}
          <div className="space-y-2">
            <Label htmlFor="industry" className="text-neutral-300">
              Rubro principal <span className="text-amber-400">*</span>
            </Label>
            <Input
              id="industry"
              name="industry"
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              placeholder="Escribí o seleccioná tu rubro"
              required
              className="border-neutral-700 bg-neutral-950 text-white placeholder:text-neutral-500"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {INDUSTRY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSelectedIndustry(preset)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                    selectedIndustry === preset
                      ? "border-amber-500 bg-amber-500/15 text-amber-300"
                      : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Default Currency */}
          <div className="space-y-2">
            <Label className="text-neutral-300">
              Moneda predeterminada <span className="text-amber-400">*</span>
            </Label>
            <input type="hidden" name="currency" value={currency} />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCurrency("ARS")}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                  currency === "ARS"
                    ? "border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500"
                    : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div>
                  <div className="font-semibold text-sm">ARS ($)</div>
                  <div className="text-xs text-neutral-400">Pesos Argentinos</div>
                </div>
                {currency === "ARS" && <Check className="w-4 h-4 text-amber-500" />}
              </button>

              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                  currency === "USD"
                    ? "border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500"
                    : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div>
                  <div className="font-semibold text-sm">USD ($)</div>
                  <div className="text-xs text-neutral-400">Dólares Estadounidenses</div>
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
            className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold h-11 text-base shadow-lg shadow-amber-500/15"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando tu comercio...
              </>
            ) : (
              <>
                Continuar al Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-neutral-400">
            Quedarás registrado como <span className="text-neutral-300 font-medium">Dueño (Owner)</span> con acceso total y control exclusivo.
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
