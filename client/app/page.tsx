// Page.tsx
"use client"

import React from "react"
import ResourceFinder from "../components/resource-finder"
import Auth from "../components/Auth/Auth"
import { AuthProvider, useAuth } from "../components/Auth/AuthContext"
import { ArrowLeftOnRectangleIcon } from "@heroicons/react/24/solid"

// Main App component that uses the AuthContext
const AppContent: React.FC = () => {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="ml-4 text-lg text-gray-700">Loading authentication...</p>
      </div>
    )
  }

  // return (
  //   <>
  //     {user ? (
  //       <div className="relative">
  //         {/* Logout Button */}
  //         <button
  //           onClick={logout}
  //           className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600 transition duration-150 shadow-md"
  //         >
  //           <ArrowLeftOnRectangleIcon className="h-5 w-5" /> Logout
  //         </button>
  //         <ResourceFinder />
  //       </div>
  //     ) : (
  //       <Auth />
  //     )}
  //   </>
  // )

  return (
    <div className="relative">
        {/* Logout Button */}
        <button
          onClick={logout}
          className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600 transition duration-150 shadow-md"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" /> Logout
        </button>
        <ResourceFinder />
      </div>
  )
}

// Export the Page component wrapped with AuthProvider
export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
