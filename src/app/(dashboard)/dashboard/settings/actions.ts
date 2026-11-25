"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function deleteOwnBusinessAction(businessId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  const { error } = await supabase.rpc("delete_business_account", {
    p_business_id: businessId,
  })

  if (error) {
    return {
      error:
        error.message?.includes("schema cache") || error.code === "PGRST202"
          ? "Falta ejecutar la migración 'REMOTE_DEPLOY_LATEST.sql' en Supabase Cloud para habilitar el borrado de comercios."
          : error.message || "No se pudo eliminar el comercio",
    }
  }

  const cookieStore = await cookies()
  if (cookieStore.get("active_business_id")?.value === businessId) {
    cookieStore.delete("active_business_id")
  }

  // Check if user still owns or belongs to any other business
  const { count } = await supabase
    .from("business_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  revalidatePath("/", "layout")
  if (!count || count === 0) {
    redirect("/login")
  }

  redirect("/dashboard")
}
