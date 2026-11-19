import React from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { OnboardingForm } from "./onboarding-form"

export const instant = false

export default async function OnboardingPage() {
  await connection()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // If user already belongs to an active business, bypass onboarding
  const { count } = await supabase
    .from("business_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  if (count && count > 0) {
    redirect("/dashboard")
  }

  return <OnboardingForm userEmail={user.email || ""} />
}
