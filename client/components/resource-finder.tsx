// resource-finder.tsx
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
import { Folder, ChevronDown, GraduationCap, BookOpen, X, Plus, Download, Loader2, RefreshCw } from "lucide-react"

// Update the StructuredInput interface to match the backend schema
interface StructuredInput {
  curriculum: string
  grade: number // This should be number to match your example
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

interface FileTypes {
  webpages: boolean
  documents: boolean
  images: boolean
  videos: boolean
}

// Add an interface for HistoryRecord (copied from AppSidebar for consistency)
interface HistoryRecord {
  id: string
  name: string
  created_at: string
  input_type: "form" | "freeform"
  input: StructuredInput | string // More specific type
  output: ApiResponse // More specific type
  file_types: FileTypes
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
    <Card className="mb-4 border-border hover:shadow-md transition duration-150">
      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Folder className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg text-foreground">{folderName}</CardTitle>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
          />
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          {files.length > 0 ? (
            <ul className="space-y-2 text-foreground">
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
            <p className="text-muted-foreground italic">No files found for this topic.</p>
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
  const [activeTab, setActiveTab] = useState<HistoryRecord["input_type"]>("form")

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

  // State to hold the selected history record
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<HistoryRecord | null>(null)

  // Function to clear all form fields and start a new session
  const startNewSession = useCallback(() => {
    setGrade("")
    setCurriculum("")
    setSubject("")
    setTopics([])
    setCurrentTopic("")
    setFreeformInput("")
    setResults(null)
    setError(null)
    setSelectedHistoryRecord(null)
    setActiveTab("form") // Reset to structured tab by default
    setFileTypes({
      // Reset file types to default
      webpages: true,
      documents: true,
      images: false,
      videos: false,
    })
  }, [])

  // Auto-save function - Fixed version
  const autoSaveToHistory = useCallback(
    async (searchResults: ApiResponse) => {
      if (!user || !autoSaveEnabled || !searchResults) return

      try {
        const token = getAccessToken()

        // Generate a proper UUID for the history record
        const historyId = crypto.randomUUID()

        // Prepare the history record based on the exact schema
        let historyRecord: any

        if (activeTab === "freeform") {
          historyRecord = {
            id: historyId,
            user_id: user.id,
            name: freeformInput.slice(0, 50) + (freeformInput.length > 50 ? "..." : ""),
            input_type: "freeform",
            input: freeformInput, // Just the string for freeform
            output: {},
            created_at: new Date().toISOString(),
            file_types: fileTypes
          }
        } else {
          historyRecord = {
            id: historyId,
            user_id: user.id,
            name: `${subject} - ${curriculum} Grade ${grade}`,
            input_type: "form",
            input: {
              curriculum: curriculum,
              grade: Number.parseInt(grade) || 0, // Ensure it's a number
              subject: subject,
              topics: topics,
            },
            output: {},
            created_at: new Date().toISOString(),
            file_types: fileTypes
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
          console.error("Failed to auto-save to history:", response.status, errorData)
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
  const handleTabChange = (tab: HistoryRecord["input_type"]) => {
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
    setFileTypes({
      webpages: true,
      documents: true,
      images: false,
      videos: false,
    })
    setSelectedHistoryRecord(null) // Clear selected history record on tab change
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

  // New function to load a history record into the form - FIXED VERSION
  const loadHistoryRecord = useCallback((record: HistoryRecord) => {
    console.log("Loading history record:", record)
    setResults(null) // Clear previous results
    setError(null) // Clear any previous errors
    setSelectedHistoryRecord(record) // Store the selected record

    // Set active tab based on input_type
    setActiveTab(record.input_type)

    // Populate form fields
    if (record.input_type === "form") {
      // For structured form, the input should be an object like:
      // {"grade": 11, "topics": ["vectors"], "subject": "Mathematics", "curriculum": "edexcel igcse maths"}

      let input = record.input as StructuredInput
      console.log("Parsed structured input:", input)

      // Set curriculum
      if (input.curriculum) {
        setCurriculum(input.curriculum)
        console.log("Setting curriculum to:", input.curriculum)
      }

      // Set grade - convert number to string for input field
      if (input.grade !== undefined && input.grade !== null) {
        setGrade(String(input.grade))
        console.log("Setting grade to:", String(input.grade))
      }

      // Set subject
      if (input.subject) {
        setSubject(input.subject)
        console.log("Setting subject to:", input.subject)
      }

      setTopics(input.topics)
      console.log("Setting topics to:", input.topics)

      // Clear freeform input
      setFreeformInput("")
      console.log("Clearing freeform input.")
    } else {
      // freeform
      console.log("Record input type is 'freeform'. Input data:", record.input)

      // For freeform, input should be a string
      const freeformText = typeof record.input === "string" ? record.input : String(record.input || "")
      setFreeformInput(freeformText)
      console.log("Setting freeform input to:", freeformText)

      // Clear structured inputs
      setCurriculum("")
      setGrade("")
      setSubject("")
      setTopics([])
      console.log("Clearing structured inputs.")
    }

    // Load and display the historical results
    if (record.output && typeof record.output === "object") {
      // Transform the output to match our ApiResponse format
      const transformedOutput: ApiResponse = {}
      Object.entries(record.output).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          transformedOutput[key] = value.map((item: any) => ({
            filename: item.filename || "",
            link: item.link || "",
            type: item.type || "webpage",
          }))
        }
      })
      setResults(transformedOutput)
      console.log("Setting results to:", transformedOutput)
    } else {
      setResults(null)
      console.log("No results to display.")
    }

    // Reset file types to default when loading from history
    setFileTypes(record.file_types)
    console.log("Resetting file types to default.")
  }, [])

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
          grade: Number.parseInt(grade) || 0, // Ensure grade is passed as a number to the backend
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
          <Card className="aspect-auto border-border">
            <CardHeader className="bg-primary text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5" />
                  <span>Search Parameters</span>
                </CardTitle>
                <Button
                  onClick={startNewSession} // New Session button
                  size="sm"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary bg-transparent"
                  title="Start a New Search Session"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Session
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="form"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Structured Form
                  </TabsTrigger>
                  <TabsTrigger
                    value="freeform"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Free Form
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  <TabsContent value="form" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="curriculum" className="text-foreground font-medium">
                        Curriculum
                      </Label>
                      <Input
                        id="curriculum"
                        value={curriculum}
                        onChange={(e) => setCurriculum(e.target.value)}
                        placeholder="e.g., Common Core, IB, Cambridge"
                        required
                        disabled={loading}
                        className="focus:border-primary focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="grade" className="text-foreground font-medium">
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
                        className="focus:border-primary focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-foreground font-medium">
                        Subject
                      </Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g., Mathematics, Science, English"
                        required
                        disabled={loading}
                        className="focus:border-primary focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="topics" className="text-foreground font-medium">
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
                          className="focus:border-primary focus:ring-primary"
                        />
                        <Button
                          type="button"
                          onClick={addTopic}
                          disabled={loading}
                          className="bg-primary hover:bg-primary/90 text-white"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {topics.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-foreground font-medium">Added Topics ({topics.length})</Label>
                        <div className="flex flex-wrap gap-2">
                          {topics.map((topic, index) => (
                            <Badge key={index} className="bg-primary text-white flex items-center space-x-1">
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
                      <Label htmlFor="freeform" className="text-foreground font-medium">
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
                        className="focus:border-primary focus:ring-primary resize-none"
                      />
                    </div>
                  </TabsContent>

                  {/* File Types */}
                  <div className="space-y-3">
                    <Label className="text-foreground font-medium">File Types</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="webpages"
                          checked={fileTypes.webpages}
                          onCheckedChange={(checked) => handleFileTypesChange("webpages", checked as boolean)}
                          disabled={loading}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor="webpages" className="text-sm text-foreground">
                          Webpages
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="documents"
                          checked={fileTypes.documents}
                          onCheckedChange={(checked) => handleFileTypesChange("documents", checked as boolean)}
                          disabled={loading}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor="documents" className="text-sm text-foreground">
                          Documents
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="images"
                          checked={fileTypes.images}
                          onCheckedChange={(checked) => handleFileTypesChange("images", checked as boolean)}
                          disabled={loading}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor="images" className="text-sm text-foreground">
                          Images
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="videos"
                          checked={fileTypes.videos}
                          onCheckedChange={(checked) => handleFileTypesChange("videos", checked as boolean)}
                          disabled={loading}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor="videos" className="text-sm text-foreground">
                          Videos
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
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
          <Card className="aspect-auto border-border">
            <CardHeader className="bg-orange-500 text-white">
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
                    className="border-white text-white hover:bg-white hover:text-orange-500 bg-transparent"
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Searching for educational resources...</p>
                  </div>
                )}

                {results && resultTopics.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-sm text-foreground mb-4">
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
                      <p className="text-muted-foreground">
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
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-4">
          <div className="text-center text-muted-foreground py-8">
            <h3 className="text-lg font-semibold mb-2 text-primary">Welcome to Workbox</h3>
            <p className="text-sm">
              Use the search form above to find educational resources, or browse your search history in the sidebar.
            </p>
            {autoSaveEnabled && (
              <p className="text-xs mt-2 text-orange-500">
                ✓ Auto-save is enabled - your searches will be automatically saved to history
              </p>
            )}
            {selectedHistoryRecord && (
              <div className="text-xs mt-2 text-foreground">
                <p>
                  Loaded from history: <span className="font-semibold">{selectedHistoryRecord.name}</span>
                </p>
                <p className="italic">Modify parameters and click 'Find Resources' again to search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      {/* Pass the loadHistoryRecord function to AppSidebar */}
      <AppSidebar onNavigate={setCurrentPage} currentPage={currentPage} onSelectHistoryRecord={loadHistoryRecord} />
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
                    <img src="/favicon.svg" alt="Workbox" className="w-4 h-4 mr-2" />
                    Workbox
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
