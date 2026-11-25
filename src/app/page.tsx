import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const instant = false

export default async function HomePage() {
  await connection()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { count } = await supabase
    .from("business_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  if (!count || count === 0) {
    redirect("/login")
  }

  redirect("/dashboard")
}
