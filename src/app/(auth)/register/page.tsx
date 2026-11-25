"use client"

import React, { useActionState, useState } from "react"
import Link from "next/link"
import { signUpAction } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [state, formAction, isPending] = useActionState(
    async (
      _prevState: { error?: string; success?: boolean; message?: string } | null,
      formData: FormData
    ) => {
      return await signUpAction(formData)
    },
    null
  )

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-[#1F1F1F]">
          Crear Cuenta
        </h1>
        <p className="text-xs text-neutral-500">
          Configurá tu cuenta POS para empezar a vender.
        </p>
      </div>

      <form action={formAction} className="space-y-3.5">
        {state?.error && (
          <div className="p-3 text-xs font-medium rounded-xl bg-red-50 border border-red-200 text-red-700">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="p-3 text-xs font-medium rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{state.message}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-neutral-700">
            Correo electrónico
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Ingresá tu correo"
            required
            autoComplete="email"
            className="h-11 rounded-xl border-neutral-200 bg-white text-sm text-[#1F1F1F] placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-neutral-900"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-neutral-700">
            Contraseña
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              required
              autoComplete="new-password"
              className="h-11 rounded-xl border-neutral-200 bg-white pr-10 text-sm text-[#1F1F1F] placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-neutral-900"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="confirmPassword"
            className="text-xs font-semibold text-neutral-700"
          >
            Confirmar contraseña
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Repetí tu contraseña"
              required
              autoComplete="new-password"
              className="h-11 rounded-xl border-neutral-200 bg-white pr-10 text-sm text-[#1F1F1F] placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-neutral-900"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              aria-label={showConfirm ? "Ocultar contraseña" : "Ver contraseña"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              {showConfirm ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-xl bg-[#1F1F1F] hover:bg-black text-white font-semibold text-sm shadow-sm transition-all cursor-pointer mt-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            "Crear Cuenta"
          )}
        </Button>
      </form>

      <p className="text-xs text-center text-neutral-500">
        ¿Ya tenés una cuenta?{" "}
        <Link
          href="/login"
          className="text-[#FE9820] hover:text-[#FE9820]/80 font-semibold transition-colors"
        >
          Iniciá sesión acá
        </Link>
      </p>
    </div>
  )
}
