"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function acceptInviteAction(token: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debés iniciar sesión para aceptar la invitación" }
  }

  const { error } = await supabase.rpc("accept_invitation", {
    p_token: token,
  })

  if (error) {
    return { error: error.message || "Error al aceptar la invitación" }
  }

  revalidatePath("/dashboard")
  redirect("/dashboard")
}
