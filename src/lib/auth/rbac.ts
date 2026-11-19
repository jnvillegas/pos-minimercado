import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export type AppRole = "owner" | "manager" | "cashier"

export async function getUserRole(
  businessId: string
): Promise<{ role: AppRole | null; userId: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { role: null, userId: null }

  const { data: member } = await supabase
    .from("business_members")
    .select("role")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle()

  return { role: (member?.role as AppRole) || null, userId: user.id }
}

export async function requireOwner(businessId: string) {
  const { role } = await getUserRole(businessId)
  if (role !== "owner") {
    redirect("/dashboard")
  }
}

export async function requireOwnerOrManager(businessId: string) {
  const { role } = await getUserRole(businessId)
  if (role !== "owner" && role !== "manager") {
    redirect("/dashboard")
  }
}
