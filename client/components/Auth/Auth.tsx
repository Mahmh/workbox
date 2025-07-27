// Auth.tsx
"use client"

import React, { useState, FormEvent, ChangeEvent } from "react"
import { useAuth } from "./AuthContext"
import {
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
} from "@heroicons/react/24/solid"

const Auth: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoginMode, setIsLoginMode] = useState(true) // true for login, false for signup
  const [message, setMessage] = useState<string | null>(null)
  const { login, signup, loading } = useAuth()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage(null) // Clear previous messages

    let error: string | null = null;
    if (isLoginMode) {
      error = await login(email, password);
    } else {
      error = await signup(email, password);
    }

    if (error) {
      setMessage(error);
    } else {
      setMessage(isLoginMode ? "Logged in successfully!" : "Signup successful! Check your email for confirmation if required.");
      setEmail("");
      setPassword("");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-8">
          {isLoginMode ? "Welcome Back!" : "Join Us!"}
        </h2>

        {message && (
          <div
            className={`p-3 mb-6 rounded-md text-sm font-medium ${
              message.includes("successful") || message.includes("confirm")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
            role="alert"
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150"
                placeholder="Email address"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150"
                placeholder="Password"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-md font-bold flex items-center justify-center gap-2 transition duration-150 ${
              loading
                ? "bg-gray-400 cursor-not-allowed text-gray-600"
                : "bg-[#4CAF50] text-white hover:bg-green-600"
            }`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : isLoginMode ? (
              <>
                <ArrowRightOnRectangleIcon className="h-5 w-5" /> Login
              </>
            ) : (
              <>
                <UserPlusIcon className="h-5 w-5" /> Sign Up
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-600">
          {isLoginMode ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(false);
                  setMessage(null); // Clear message on mode switch
                  setEmail("");
                  setPassword("");
                }}
                className="text-green-600 hover:underline font-semibold"
                disabled={loading}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(true);
                  setMessage(null); // Clear message on mode switch
                  setEmail("");
                  setPassword("");
                }}
                className="text-green-600 hover:underline font-semibold"
                disabled={loading}
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Auth
