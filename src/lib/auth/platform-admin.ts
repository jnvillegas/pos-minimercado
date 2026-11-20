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

  return { user, role: adminRecord?.role || "superadmin" }
}
