import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function requirePlatformAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check platform_admins table
  const { data: adminRecord } = await supabase
    .from("platform_admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  // Fallback for initial platform bootstrap
  const isOwnerEmail =
    user.email === "dueño@minimercado.com" ||
    user.email === "jnvillegas86@gmail.com" ||
    user.email === "jnvillegas85@gmail.com"

  if (!adminRecord && !isOwnerEmail) {
    redirect("/dashboard")
  }

  // If user is authorized by email but not yet in platform_admins, auto-register via RPC
  if (!adminRecord && isOwnerEmail) {
    try {
      await supabase.rpc("is_platform_admin")
    } catch {
      // Ignore background registration error
    }
  }

  return { user, role: adminRecord?.role || "superadmin" }
}
