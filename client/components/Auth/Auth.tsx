"use client"

import type React from "react"
import { useState, type FormEvent, type ChangeEvent } from "react"
import { useAuth } from "./AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Lock, Loader2, BookOpen, Sparkles, Users, Shield } from "lucide-react"

const Auth: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<"success" | "error">("error")
  const { login, signup, loading } = useAuth()

  const handleSubmit = async (e: FormEvent, isLogin: boolean) => {
    e.preventDefault()
    setMessage(null)

    let error: string | null = null
    if (isLogin) {
      error = await login(email, password)
    } else {
      error = await signup(email, password)
    }

    if (error) {
      setMessage(error)
      setMessageType("error")
    } else if (!isLogin) {
      setMessage("Signup successful! Check your email for confirmation if required.")
      setMessageType("success")
      setEmail("")
      setPassword("")
    }
  }

  const clearForm = () => {
    setEmail("")
    setPassword("")
    setMessage(null)
  }

  const features = [
    {
      icon: <BookOpen className="h-5 w-5 text-blue-500" />,
      title: "Smart Resource Discovery",
      description: "Find educational materials tailored to your curriculum and grade level",
    },
    {
      icon: <Sparkles className="h-5 w-5 text-purple-500" />,
      title: "AI-Powered Search",
      description: "Advanced algorithms to match your learning objectives with quality content",
    },
    {
      icon: <Users className="h-5 w-5 text-green-500" />,
      title: "Personalized Experience",
      description: "Save your search history and get personalized recommendations",
    },
    {
      icon: <Shield className="h-5 w-5 text-orange-500" />,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/favicon.svg" alt="ResourceFinder" className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">ResourceFinder</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen pt-16">
        {/* Left Side - Features */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div className="max-w-md">
            <div className="text-center mb-8">
              <img src="/favicon.svg" alt="ResourceFinder" className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Educational Resources</h1>
              <p className="text-gray-600">Powered by AI to find the perfect learning materials for your needs</p>
            </div>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="space-y-1 text-center pb-6">
                <img src="/favicon.svg" alt="ResourceFinder" className="w-12 h-12 mx-auto mb-4 lg:hidden" />
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Sign in to your account or create a new one to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" onValueChange={clearForm}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger
                      value="login"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  {message && (
                    <Alert
                      className={`mb-6 ${messageType === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
                    >
                      <AlertDescription className={messageType === "success" ? "text-green-800" : "text-red-800"}>
                        {message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <TabsContent value="login">
                    <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-gray-700 font-medium">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-gray-700 font-medium">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-gray-700 font-medium">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="signup-email"
                            type="email"
                            value={email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-gray-700 font-medium">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="signup-password"
                            type="password"
                            value={password}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            placeholder="Create a password"
                            className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 text-center text-sm text-gray-500">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Auth
