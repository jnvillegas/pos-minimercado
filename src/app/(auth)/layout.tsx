import React from "react"
import { AuthCarouselShell } from "@/components/auth/auth-carousel-shell"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthCarouselShell>{children}</AuthCarouselShell>
}
