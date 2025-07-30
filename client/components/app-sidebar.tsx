// app-sidebar.tsx
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./Auth/AuthContext"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  User,
  Settings,
  LogOut,
  MoreHorizontal,
  Edit2,
  Trash2,
  Calendar,
  Search,
  FileText,
  Loader2,
  Home,
  History,
} from "lucide-react"
import { BACKEND_API_URL } from "./constants"

// Define interfaces for structured input data and API response (copied from resource-finder.tsx for consistency)
interface StructuredInput {
  curriculum: string
  grade: number // Grade from DB is number
  subject: string
  topics: string[]
}

interface FileResult {
  filename: string
  link: string
  type: string // Added type based on output schema
}

interface ApiResponse {
  [folderName: string]: FileResult[]
}

interface HistoryRecord {
  id: string
  name: string
  created_at: string
  input_type: "form" | "freeform"
  input: StructuredInput | string // More specific type
  output: ApiResponse // More specific type
}

interface AppSidebarProps {
  onNavigate?: (page: string) => void
  currentPage?: string
  onSelectHistoryRecord?: (record: HistoryRecord) => void // New prop
}

export function AppSidebar({ onNavigate, currentPage = "finder", onSelectHistoryRecord }: AppSidebarProps) {
  const { user, logout, getAccessToken } = useAuth()
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch user history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return

      try {
        const token = getAccessToken()
        const response = await fetch(`${BACKEND_API_URL}/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setHistory(data)
        }
      } catch (error) {
        console.error("Failed to fetch history:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [user, getAccessToken])

  // Filter history based on search query
  const filteredHistory = history.filter((record) => record.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Handle rename
  const handleRename = async (historyId: string, newName: string) => {
    if (!user || !newName.trim()) return

    try {
      const token = getAccessToken()
      const response = await fetch(`${BACKEND_API_URL}/history`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          history_id: historyId,
          new_name: newName.trim(),
        }),
      })

      if (response.ok) {
        setHistory((prev) =>
          prev.map((record) => (record.id === historyId ? { ...record, name: newName.trim() } : record)),
        )
        setEditingId(null)
        setEditingName("")
      }
    } catch (error) {
      console.error("Failed to rename record:", error)
    }
  }

  // Handle delete
  const handleDelete = async (historyId: string) => {
    if (!user) return

    try {
      const token = getAccessToken()
      const response = await fetch(`${BACKEND_API_URL}/history?history_id=${historyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setHistory((prev) => prev.filter((record) => record.id !== historyId))
      }
    } catch (error) {
      console.error("Failed to delete record:", error)
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user) return

    try {
      const token = getAccessToken()
      const response = await fetch(`${BACKEND_API_URL}/auth`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await logout()
      }
    } catch (error) {
      console.error("Failed to delete account:", error)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#05233d] text-white">
                  <img src="/favicon.svg" alt="Workbox" className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Workbox</span>
                  <span className="truncate text-xs">Educational Resources</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Resource Finder"
                  isActive={currentPage === "finder"}
                  onClick={() => onNavigate?.("finder")}
                >
                  <Home className="h-4 w-4" />
                  <span>Resource Finder</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Settings"
                  isActive={currentPage === "settings"}
                  onClick={() => onNavigate?.("settings")}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Search History */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Search History</span>
            <Badge variant="secondary" className="text-xs bg-[#ff7643] text-white">
              {filteredHistory.length}
            </Badge>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Search Input */}
            <div className="px-2 pb-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  placeholder="Search history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-8 text-xs focus:border-[#05233d] focus:ring-[#05233d]"
                />
              </div>
            </div>

            <SidebarMenu>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-[#05233d]" />
                </div>
              ) : filteredHistory.length > 0 ? (
                filteredHistory.slice(0, 10).map((record) => (
                  <SidebarMenuItem key={record.id}>
                    <SidebarMenuButton className="group" tooltip={record.name} onClick={() => onSelectHistoryRecord?.(record)}>
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <FileText className="h-3 w-3 text-[#ff7643] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          {editingId === record.id ? (
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={() => handleRename(record.id, editingName)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleRename(record.id, editingName)
                                } else if (e.key === "Escape") {
                                  setEditingId(null)
                                  setEditingName("")
                                }
                              }}
                              className="h-6 text-xs focus:border-[#05233d] focus:ring-[#05233d]"
                              autoFocus
                            />
                          ) : (
                            <div className="truncate">
                              <div className="text-xs font-medium truncate">{record.name}</div>
                              <div className="text-xs text-gray-500 flex items-center space-x-1">
                                <Calendar className="h-2 w-2" />
                                <span>{formatDate(record.created_at)}</span>
                                <Badge variant="outline" className="text-xs px-1 py-0 border-[#ff7643] text-[#ff7643]">
                                  {record.input_type}
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction showOnHover>
                          <MoreHorizontal className="h-3 w-3" />
                          <span className="sr-only">More</span>
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48" side="bottom" align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingId(record.id)
                            setEditingName(record.name)
                          }}
                        >
                          <Edit2 className="h-3 w-3 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(record.id)} className="text-red-600">
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-xs text-gray-500">
                  {searchQuery ? "No matching searches" : "No search history yet"}
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collapsed History Icon */}
        <SidebarGroup className="group-data-[collapsible=icon]:block hidden">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={`${history.length} searches in history`}>
                  <History className="h-4 w-4" />
                  <span>History</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#05233d] text-white">
                    <User className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.email?.split("@")[0] || "User"}</span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => onNavigate?.("settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data
                        from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}