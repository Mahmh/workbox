"use client"

import { useAuth } from "@/components/Auth/AuthContext"
import Auth from "@/components/Auth/Auth"
import ResourceFinder from "@/components/resource-finder"

export default function Page() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return user ? <ResourceFinder /> : <Auth />
}
