"use client"

import React, { useActionState, useState } from "react"
import Link from "next/link"
import { signInAction } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error?: string } | null, formData: FormData) => {
      return await signInAction(formData)
    },
    null
  )

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-[#1F1F1F]">
          Bienvenido de nuevo
        </h1>
        <p className="text-xs text-neutral-500">
          Ingresá a tu cuenta POS para continuar operando.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="p-3 text-xs font-medium rounded-xl bg-red-50 border border-red-200 text-red-700">
            {state.error}
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
              placeholder="Ingresá tu contraseña"
              required
              autoComplete="current-password"
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

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-xl bg-[#1F1F1F] hover:bg-black text-white font-semibold text-sm shadow-sm transition-all cursor-pointer mt-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            "Iniciar Sesión"
          )}
        </Button>
      </form>

      <p className="text-xs text-center text-neutral-500">
        ¿No tenés una cuenta?{" "}
        <Link
          href="/register"
          className="text-[#FE9820] hover:text-[#FE9820]/80 font-semibold transition-colors"
        >
          Registrate acá
        </Link>
      </p>
    </div>
  )
}
