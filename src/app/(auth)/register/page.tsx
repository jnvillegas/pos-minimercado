"use client"

import React, { useActionState } from "react"
import Link from "next/link"
import { signUpAction } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, UserPlus, CheckCircle2 } from "lucide-react"

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error?: string; success?: boolean; message?: string } | null, formData: FormData) => {
      return await signUpAction(formData)
    },
    null
  )

  return (
    <Card className="border-neutral-200 bg-white text-[#1F1F1F] shadow-xl shadow-neutral-200/50 rounded-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold text-[#1F1F1F]">Crear Cuenta</CardTitle>
        <CardDescription className="text-[#9E9E9E]">
          Registrate para administrar tu negocio e inventario
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="p-3 text-sm rounded-lg bg-red-50 border border-red-200 text-red-700">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="p-3 text-sm rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <span>{state.message}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#1F1F1F] font-medium">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="dueño@minimercado.com"
              required
              autoComplete="email"
              className="border-neutral-300 bg-white text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:border-[#FE9820] focus:ring-[#FE9820]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#1F1F1F] font-medium">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              required
              autoComplete="new-password"
              className="border-neutral-300 bg-white text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:border-[#FE9820] focus:ring-[#FE9820]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-[#1F1F1F] font-medium">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Repetí la contraseña"
              required
              autoComplete="new-password"
              className="border-neutral-300 bg-white text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:border-[#FE9820] focus:ring-[#FE9820]"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#FE9820] hover:bg-[#FE9820]/90 text-white font-semibold h-11 rounded-xl shadow-md shadow-[#FE9820]/25 transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Registrarme
              </>
            )}
          </Button>

          <p className="text-sm text-center text-[#9E9E9E]">
            ¿Ya tenés una cuenta?{" "}
            <Link href="/login" className="text-[#FE9820] hover:text-[#FE9820]/80 font-medium underline underline-offset-4">
              Iniciá sesión acá
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
