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
    <Card className="border-neutral-800 bg-neutral-900/90 text-neutral-100 backdrop-blur shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold text-white">Iniciar Sesión</CardTitle>
        <CardDescription className="text-neutral-400">
          Ingresá con tu correo y contraseña para acceder a tu comercio
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="p-3 text-sm rounded-lg bg-red-950/60 border border-red-800 text-red-200">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-neutral-300">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="dueño@minimercado.com"
              required
              autoComplete="email"
              className="border-neutral-700 bg-neutral-950 text-white placeholder:text-neutral-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-neutral-300">Contraseña</Label>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="border-neutral-700 bg-neutral-950 text-white placeholder:text-neutral-500"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold h-10 shadow-lg shadow-amber-500/10"
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

          <p className="text-sm text-center text-neutral-400">
            ¿No tenés una cuenta?{" "}
            <Link href="/register" className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-4">
              Registrate acá
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
