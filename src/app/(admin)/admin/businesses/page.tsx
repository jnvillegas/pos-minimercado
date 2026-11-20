import React from "react"
import { connection } from "next/server"
import { requirePlatformAdmin } from "@/lib/auth/platform-admin"
import { fetchPlatformDataAction } from "../actions"
import { BusinessesView } from "./businesses-view"

export const instant = false

export default async function AdminBusinessesPage() {
  await connection()
  await requirePlatformAdmin()

  const { businesses } = await fetchPlatformDataAction()

  return <BusinessesView initialBusinesses={businesses} />
}
