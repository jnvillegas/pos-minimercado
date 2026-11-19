"use client"

import React, { useActionState } from "react"
import Link from "next/link"
import { signInAction } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, LogIn } from "lucide-react"

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error?: string } | null, formData: FormData) => {
      return await signInAction(formData)
    },
    null
  )

  return (
    <Card className="border-neutral-200 bg-white text-[#1F1F1F] shadow-xl shadow-neutral-200/50 rounded-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold text-[#1F1F1F]">Iniciar Sesión</CardTitle>
        <CardDescription className="text-[#9E9E9E]">
          Ingresá con tu correo y contraseña para acceder a tu comercio
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="p-3 text-sm rounded-lg bg-red-50 border border-red-200 text-red-700">
              {state.error}
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-[#1F1F1F] font-medium">Contraseña</Label>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
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
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Ingresar al sistema
              </>
            )}
          </Button>

          <p className="text-sm text-center text-[#9E9E9E]">
            ¿No tenés una cuenta?{" "}
            <Link href="/register" className="text-[#FE9820] hover:text-[#FE9820]/80 font-medium underline underline-offset-4">
              Registrate acá
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
