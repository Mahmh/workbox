import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { AuthProvider } from "@/components/Auth/AuthContext"
import { ThemeProvider } from "@/components/theme-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Workbox",
  description: "Find educational resources",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head><link rel="icon" href="/favicon.svg" /></head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
          {children}
          </ThemeProvider>  
        </AuthProvider>
      </body>
    </html>
  )
}
