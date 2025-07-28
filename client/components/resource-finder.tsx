"use client"

import type React from "react"
import { useState, useMemo, type FormEvent, useCallback } from "react"
import { useAuth } from "./Auth/AuthContext"
import { AppSidebar } from "./app-sidebar"
import SettingsPage from "./settings-page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Folder, ChevronDown, GraduationCap, BookOpen, X, Plus, Download, Loader2 } from "lucide-react"

// Define interfaces for structured input data and API response
interface StructuredInput {
  curriculum: string
  grade: string
  subject: string
  topics: string[]
}

interface FileResult {
  filename: string
  link: string
}

interface ApiResponse {
  [folderName: string]: FileResult[]
}

interface FileTypes {
  webpages: boolean
  documents: boolean
  images: boolean
  videos: boolean
}

// TopicResultItem component
interface TopicResultProps {
  topic: string
  files: FileResult[]
  subject: string
}

const TopicResultItem: React.FC<TopicResultProps> = ({ topic, files, subject }) => {
  const [isOpen, setIsOpen] = useState(false)
  const folderName = subject && subject.trim() !== "" ? `${subject}/${topic}` : topic

  return (
    <Card className="mb-4 border-gray-200 hover:shadow-md transition duration-150">
      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Folder className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg text-gray-800">{folderName}</CardTitle>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
          />
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          {files.length > 0 ? (
            <ul className="space-y-2 text-gray-700">
              {files.map((file, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <a
                    href={file.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline hover:text-blue-800 transition-colors"
                  >
                    {file.filename}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No files found for this topic.</p>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export default function ResourceFinder() {
  const { user, getAccessToken } = useAuth()
  const [currentPage, setCurrentPage] = useState("finder")

  // State for structured form inputs
  const [grade, setGrade] = useState("")
  const [curriculum, setCurriculum] = useState("")
  const [subject, setSubject] = useState("")
  const [topics, setTopics] = useState<string[]>([])
  const [currentTopic, setCurrentTopic] = useState("")

  // State for free form input
  const [freeformInput, setFreeformInput] = useState("")
  const [activeTab, setActiveTab] = useState("structured")

  // State for file type checkboxes
  const [fileTypes, setFileTypes] = useState<FileTypes>({
    webpages: true,
    documents: true,
    images: false,
    videos: false,
  })

  // General state
  const [results, setResults] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)

  // Auto-save function
  const autoSaveToHistory = useCallback(
    async (searchResults: ApiResponse) => {
      if (!user || !autoSaveEnabled || !searchResults) return

      try {
        const token = getAccessToken()

        // Generate a unique ID for the history record
        const historyId = `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // Prepare the history record based on the exact schema
        let historyRecord: any

        if (activeTab === "freeform") {
          historyRecord = {
            id: historyId,
            user_id: user.id,
            name: freeformInput.slice(0, 50) + (freeformInput.length > 50 ? "..." : ""),
            input_type: "freeform" as const,
            input: freeformInput, // Just the string for freeform
            output: {} as { [key: string]: Array<{ filename: string; link: string; type: string }> },
            created_at: new Date().toISOString(), // Add this line
          }
        } else {
          historyRecord = {
            id: historyId,
            user_id: user.id,
            name: `${subject} - ${curriculum} Grade ${grade}`,
            input_type: "form" as const,
            input: {
              curriculum,
              grade: Number.parseInt(grade) || 0,
              subject,
              topics,
            },
            output: {} as { [key: string]: Array<{ filename: string; link: string; type: string }> },
            created_at: new Date().toISOString(), // Add this line
          }
        }

        // Transform the output to match the expected schema
        Object.entries(searchResults).forEach(([topic, files]) => {
          historyRecord.output[topic] = files.map((file) => ({
            filename: file.filename,
            link: file.link,
            type: "webpage", // Default type as shown in schema
          }))
        })

        console.log("Saving to history:", JSON.stringify(historyRecord, null, 2))

        const response = await fetch("http://localhost:8000/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(historyRecord),
        })

        if (response.ok) {
          console.log("Search auto-saved to history successfully")
        } else {
          const errorData = await response.json()
          console.error("Failed to auto-save to history:", errorData)
        }
      } catch (error) {
        console.error("Failed to auto-save to history:", error)
      }
    },
    [user, getAccessToken, autoSaveEnabled, activeTab, freeformInput, curriculum, grade, subject, topics],
  )

  // Topic management functions
  const addTopic = useCallback(() => {
    if (currentTopic.trim() && !topics.includes(currentTopic.trim())) {
      setTopics([...topics, currentTopic.trim()])
      setCurrentTopic("")
    }
  }, [currentTopic, topics])

  const removeTopic = (topicToRemove: string) => {
    setTopics(topics.filter((topic) => topic !== topicToRemove))
  }

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        addTopic()
      }
    },
    [addTopic],
  )

  // Handler for file type checkbox changes
  const handleFileTypesChange = (type: keyof FileTypes, checked: boolean) => {
    setFileTypes((prev) => ({
      ...prev,
      [type]: checked,
    }))
  }

  // Tab switching and input clearing
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setResults(null)
    setError(null)
    // Clear inputs when switching tabs
    setFreeformInput("")
    setCurriculum("")
    setGrade("")
    setSubject("")
    setTopics([])
    setCurrentTopic("")
  }

  const downloadResults = async () => {
    if (!results) return
    setIsDownloading(true)

    try {
      const response = await fetch("http://localhost:8000/output/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(results),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "resources.zip"
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading the file:", error)
      setError("Failed to download the file. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  // Form submission handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults(null)

    const API_BASE_URL = "http://localhost:8000"
    let endpoint = ""
    let payload: any = null

    if (activeTab === "freeform") {
      endpoint = `${API_BASE_URL}/input/freeform`
      payload = {
        user_input: freeformInput,
        file_types: fileTypes,
      }
    } else {
      endpoint = `${API_BASE_URL}/input/form`
      payload = {
        user_input: {
          curriculum,
          grade,
          subject,
          topics,
        },
        file_types: fileTypes,
      }
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`)
      }

      const data: ApiResponse = await response.json()
      setResults(data)

      // Auto-save to history
      await autoSaveToHistory(data)
    } catch (error: any) {
      console.error("Error fetching data:", error)
      setError(error.message || "An error occurred while fetching data. Check your connection to the server.")
    } finally {
      setLoading(false)
    }
  }

  const resultTopics = useMemo(() => (results ? Object.keys(results) : []), [results])

  const totalFileCount = useMemo(() => {
    if (!results) return 0
    let count = 0
    for (const topicFiles of Object.values(results)) {
      count += topicFiles.length
    }
    return count
  }, [results])

  const isSubmitDisabled =
    loading ||
    (activeTab === "freeform"
      ? freeformInput.trim() === ""
      : curriculum.trim() === "" || grade.trim() === "" || subject.trim() === "" || topics.length === 0)

  const renderContent = () => {
    if (currentPage === "settings") {
      return <SettingsPage />
    }

    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-2">
          {/* Input Section */}
          <Card className="aspect-auto border-gray-200">
            <CardHeader className="bg-[#05233d] text-white">
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5" />
                <span>Search Parameters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="structured"
                    className="data-[state=active]:bg-[#05233d] data-[state=active]:text-white"
                  >
                    Structured Form
                  </TabsTrigger>
                  <TabsTrigger
                    value="freeform"
                    className="data-[state=active]:bg-[#05233d] data-[state=active]:text-white"
                  >
                    Free Form
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  <TabsContent value="structured" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="curriculum" className="text-gray-700 font-medium">
                        Curriculum
                      </Label>
                      <Input
                        id="curriculum"
                        value={curriculum}
                        onChange={(e) => setCurriculum(e.target.value)}
                        placeholder="e.g., Common Core, IB, Cambridge"
                        required
                        disabled={loading}
                        className="focus:border-[#05233d] focus:ring-[#05233d]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="grade" className="text-gray-700 font-medium">
                        Grade Year
                      </Label>
                      <Input
                        id="grade"
                        type="number"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        placeholder="e.g., 9"
                        required
                        disabled={loading}
                        className="focus:border-[#05233d] focus:ring-[#05233d]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-gray-700 font-medium">
                        Subject
                      </Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g., Mathematics, Science, English"
                        required
                        disabled={loading}
                        className="focus:border-[#05233d] focus:ring-[#05233d]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="topics" className="text-gray-700 font-medium">
                        Topics
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          id="topics"
                          value={currentTopic}
                          onChange={(e) => setCurrentTopic(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="e.g., Algebra, Geometry, Fractions"
                          disabled={loading}
                          className="focus:border-[#05233d] focus:ring-[#05233d]"
                        />
                        <Button
                          type="button"
                          onClick={addTopic}
                          disabled={loading}
                          className="bg-[#05233d] hover:bg-[#031220] text-white"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {topics.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Added Topics ({topics.length})</Label>
                        <div className="flex flex-wrap gap-2">
                          {topics.map((topic, index) => (
                            <Badge key={index} className="bg-[#05233d] text-white flex items-center space-x-1">
                              <span>{topic}</span>
                              <button
                                type="button"
                                onClick={() => removeTopic(topic)}
                                className="ml-1 hover:text-gray-300"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="freeform" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="freeform" className="text-gray-700 font-medium">
                        Free Text Input
                      </Label>
                      <Textarea
                        id="freeform"
                        value={freeformInput}
                        onChange={(e) => setFreeformInput(e.target.value)}
                        placeholder="Enter free text prompt (e.g., 'Revision notes for high school biology')"
                        rows={6}
                        required
                        disabled={loading}
                        className="focus:border-[#05233d] focus:ring-[#05233d] resize-none"
                      />
                    </div>
                  </TabsContent>

                  {/* File Types */}
                  <div className="space-y-3">
                    <Label className="text-gray-700 font-medium">File Types</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="webpages"
                          checked={fileTypes.webpages}
                          onCheckedChange={(checked) => handleFileTypesChange("webpages", checked as boolean)}
                          disabled={loading}
                          className="data-[state=checked]:bg-[#05233d] data-[state=checked]:border-[#05233d]"
                        />
                        <Label htmlFor="webpages" className="text-sm text-gray-700">
                          Webpages
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="documents"
                          checked={fileTypes.documents}
                          onCheckedChange={(checked) => handleFileTypesChange("documents", checked as boolean)}
                          disabled={loading}
                          className="data-[state=checked]:bg-[#05233d] data-[state=checked]:border-[#05233d]"
                        />
                        <Label htmlFor="documents" className="text-sm text-gray-700">
                          Documents
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="images"
                          checked={fileTypes.images}
                          onCheckedChange={(checked) => handleFileTypesChange("images", checked as boolean)}
                          disabled={loading}
                          className="data-[state=checked]:bg-[#05233d] data-[state=checked]:border-[#05233d]"
                        />
                        <Label htmlFor="images" className="text-sm text-gray-700">
                          Images
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="videos"
                          checked={fileTypes.videos}
                          onCheckedChange={(checked) => handleFileTypesChange("videos", checked as boolean)}
                          disabled={loading}
                          className="data-[state=checked]:bg-[#05233d] data-[state=checked]:border-[#05233d]"
                        />
                        <Label htmlFor="videos" className="text-sm text-gray-700">
                          Videos
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#05233d] hover:bg-[#031220] text-white font-bold"
                    disabled={isSubmitDisabled}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Find Resources"
                    )}
                  </Button>
                </form>

                {error && (
                  <Alert className="mt-4 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">Error: {error}</AlertDescription>
                  </Alert>
                )}
              </Tabs>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="aspect-auto border-gray-200">
            <CardHeader className="bg-[#ff7643] text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Results</span>
                </CardTitle>
                {results && (
                  <Button
                    onClick={downloadResults}
                    disabled={isDownloading}
                    size="sm"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-[#ff7643] bg-transparent"
                  >
                    {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="max-h-[600px] overflow-y-auto">
                {loading && !results && (
                  <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff7643] mx-auto mb-4"></div>
                    <p className="text-gray-500">Searching for educational resources...</p>
                  </div>
                )}

                {results && resultTopics.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-4">
                      Found {totalFileCount} resources across {resultTopics.length} topic
                      {resultTopics.length !== 1 ? "s" : ""}
                    </div>
                    {resultTopics.map((topic) => (
                      <TopicResultItem
                        key={topic}
                        topic={topic}
                        files={results[topic]}
                        subject={activeTab !== "freeform" ? subject : ""}
                      />
                    ))}
                  </div>
                ) : (
                  !loading &&
                  !error && (
                    <div className="text-center py-10">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">
                        Add inputs and click 'Find Resources' to discover educational materials.
                      </p>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional content area */}
        <div className="min-h-[100vh] flex-1 rounded-xl bg-gray-50 md:min-h-min p-4">
          <div className="text-center text-gray-500 py-8">
            <h3 className="text-lg font-semibold mb-2 text-[#05233d]">Welcome to ResourceFinder</h3>
            <p className="text-sm">
              Use the search form above to find educational resources, or browse your search history in the sidebar.
            </p>
            {autoSaveEnabled && (
              <p className="text-xs mt-2 text-[#ff7643]">
                ✓ Auto-save is enabled - your searches will be automatically saved to history
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar onNavigate={setCurrentPage} currentPage={currentPage} />
      <SidebarInset>
        {/* Header with breadcrumb */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#" className="flex items-center">
                    <img src="/favicon.svg" alt="ResourceFinder" className="w-4 h-4 mr-2" />
                    ResourceFinder
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentPage === "settings" ? "Settings" : "Search Resources"}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {renderContent()}
      </SidebarInset>
    </SidebarProvider>
  )
}
