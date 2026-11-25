import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 1. Unauthenticated users attempting to access protected routes
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding"))) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    return NextResponse.redirect(redirectUrl)
  }

  // 2. Authenticated users route protection & redirection
  if (user) {
    const isAuthRoute = pathname === "/login" || pathname === "/register"
    const isOnboardingRoute = pathname === "/onboarding"
    const isDashboardRoute = pathname.startsWith("/dashboard")

    if (isAuthRoute || isOnboardingRoute || isDashboardRoute) {
      const { count } = await supabase
        .from("business_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)

      const hasBusiness = (count ?? 0) > 0

      if (isAuthRoute) {
        // Only auto-redirect away from /login or /register if the user already has a business.
        // Users without a business can still access /login to switch accounts or sign in.
        if (hasBusiness) {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = "/dashboard"
          return NextResponse.redirect(redirectUrl)
        }
        return supabaseResponse
      }

      if (isOnboardingRoute && hasBusiness) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = "/dashboard"
        return NextResponse.redirect(redirectUrl)
      }

      if (isDashboardRoute && !hasBusiness) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = "/onboarding"
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
