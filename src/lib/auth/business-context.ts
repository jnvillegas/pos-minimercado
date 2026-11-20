import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export interface ActiveBusinessContext {
  user: {
    id: string
    email?: string
    user_metadata?: Record<string, any>
  }
  business: {
    id: string
    name: string
    industry: string
    currency: string
    created_at?: string
  }
  role: string
  isPlatformAdmin: boolean
  isSupportMode: boolean
}

export async function getActiveBusinessContext(): Promise<ActiveBusinessContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // 1. Check if user is a platform admin
  const { data: adminRecord } = await supabase
    .from("platform_admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  const isOwnerEmail =
    user.email === "dueño@minimercado.com" ||
    user.email === "jnvillegas86@gmail.com" ||
    user.email === "jnvillegas85@gmail.com"

  const isPlatformAdmin = Boolean(adminRecord || isOwnerEmail)

  // 2. Check if in Support Mode (impersonating a client business)
  const cookieStore = await cookies()
  const supportBusinessId = cookieStore.get("support_target_business_id")?.value

  if (supportBusinessId && isPlatformAdmin) {
    const { data: targetBusiness } = await supabase
      .from("businesses")
      .select("id, name, industry, currency, created_at")
      .eq("id", supportBusinessId)
      .maybeSingle()

    if (targetBusiness) {
      return {
        user,
        business: targetBusiness,
        role: "support",
        isPlatformAdmin: true,
        isSupportMode: true,
      }
    }
  }

  // 3. Normal tenant resolution from user's membership
  const { data: members, error } = await supabase
    .from("business_members")
    .select(`
      role,
      businesses (
        id,
        name,
        industry,
        currency,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .limit(1)

  if (error || !members || members.length === 0 || !members[0].businesses) {
    redirect("/onboarding")
  }

  const membership = members[0]
  const business = Array.isArray(membership.businesses)
    ? membership.businesses[0]
    : membership.businesses

  return {
    user,
    business,
    role: membership.role,
    isPlatformAdmin,
    isSupportMode: false,
  }
}
