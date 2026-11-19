import React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Store, UserCheck, AlertTriangle } from "lucide-react"
import { acceptInviteAction } from "./actions"

export const instant = false

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  // 1. Fetch user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. Fetch invitation record
  const { data: invite } = await supabase
    .from("business_invitations")
    .select(`
      id,
      email,
      role,
      token,
      status,
      expires_at,
      businesses (
        name,
        industry
      )
    `)
    .eq("token", token)
    .maybeSingle()

  const isValid =
    invite &&
    invite.status === "pending" &&
    new Date(invite.expires_at) > new Date()

  const business = Array.isArray(invite?.businesses)
    ? invite?.businesses[0]
    : invite?.businesses

  const roleLabel =
    invite?.role === "manager"
      ? "Encargado de Tienda"
      : invite?.role === "cashier"
      ? "Cajero / Operador POS"
      : invite?.role || "Miembro"

  if (!isValid) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white">Invitación Inválida o Expirada</h1>
          <p className="text-sm text-neutral-400">
            Este enlace de invitación ya fue utilizado, revocado o caducó después de 7 días.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <Store className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            Invitación de Equipo
          </span>
          <h1 className="text-2xl font-black text-white mt-3">
            {business?.name || "Comercio"}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Te invitaron a formar parte del equipo con el rol de:
          </p>
          <div className="mt-3 inline-block px-4 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 font-bold text-amber-400 text-sm">
            {roleLabel}
          </div>
        </div>

        {user ? (
          <div className="space-y-4 pt-2 border-t border-neutral-800">
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300">
              Conectado como: <strong className="text-white">{user.email}</strong>
            </div>

            <form
              action={async () => {
                "use server"
                await acceptInviteAction(token)
              }}
            >
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <UserCheck className="w-4 h-4 stroke-[3]" />
                <span>Aceptar Invitación y Entrar</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <p className="text-xs text-neutral-400">
              Para unirte, iniciá sesión con tu cuenta o registrate:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/login`}
                className="py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs flex items-center justify-center transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                href={`/register`}
                className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center transition-colors"
              >
                Crear Cuenta
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
