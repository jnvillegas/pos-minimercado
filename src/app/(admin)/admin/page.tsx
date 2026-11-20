import React from "react"
import { connection } from "next/server"
import { requirePlatformAdmin } from "@/lib/auth/platform-admin"
import { fetchPlatformDataAction } from "./actions"
import { PlatformView } from "./platform-view"

export const instant = false

export default async function AdminPage() {
  await connection()
  await requirePlatformAdmin()

  const { metrics, businesses } = await fetchPlatformDataAction()

  return (
    <PlatformView
      initialMetrics={metrics}
      initialBusinesses={businesses}
    />
  )
}
