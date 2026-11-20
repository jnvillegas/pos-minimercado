import React from "react"
import { connection } from "next/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileView, UserProfileData } from "./profile-view"

export const instant = false

export default async function ProfilePage() {
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // 1. Try to invoke get_my_profile RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_my_profile")

  let profileData: UserProfileData

  if (!rpcError && rpcData) {
    const r = rpcData as UserProfileData
    profileData = {
      ...r,
      full_name:
        r.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "",
      phone: r.phone || user.user_metadata?.phone || "",
      dni_cuil: r.dni_cuil || user.user_metadata?.dni_cuil || "",
      alias: r.alias || user.user_metadata?.alias || "",
      avatar_url: r.avatar_url || user.user_metadata?.avatar_url || "",
    }
  } else {
    // Fallback: Fetch directly from tables
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    const { data: platformAdmin } = await supabase
      .from("platform_admins")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()

    const { data: memberRecord } = await supabase
      .from("business_members")
      .select("role, businesses(id, name, business_cuit, subscription_plan, subscription_status, subscription_price, subscription_renewal_at)")
      .eq("user_id", user.id)
      .maybeSingle()

    const business = memberRecord?.businesses as any

    profileData = {
      id: user.id,
      email: user.email || "",
      full_name:
        userProfile?.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "",
      phone: userProfile?.phone || user.user_metadata?.phone || "",
      dni_cuil: userProfile?.dni_cuil || user.user_metadata?.dni_cuil || "",
      alias: userProfile?.alias || user.user_metadata?.alias || "",
      avatar_url: userProfile?.avatar_url || user.user_metadata?.avatar_url || "",
      created_at: user.created_at,
      is_platform_admin: !!platformAdmin,
      platform_role: platformAdmin?.role as "superadmin" | "support" | null,
      business_id: business?.id,
      business_role: memberRecord?.role as "owner" | "manager" | "cashier" | null,
      business_name: business?.name,
      business_cuit: business?.business_cuit || "",
      subscription_plan: business?.subscription_plan || "pro",
      subscription_status: business?.subscription_status || "active",
      subscription_price: Number(business?.subscription_price) || 15000,
      subscription_renewal_at: business?.subscription_renewal_at,
    }
  }

  return <ProfileView initialProfile={profileData} />
}
