"use client"

import type React from "react"
import { useState, useMemo, FormEvent, ChangeEvent, useCallback } from "react"
import {
  FolderIcon,
  ChevronDownIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ListBulletIcon,
  XMarkIcon,
  PlusIcon,
} from "@heroicons/react/24/solid"

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
  webpage: boolean
  document: boolean
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

  // Format the folder name: display "subject/topic" only if subject is provided, otherwise just "topic"
  const folderName = subject && subject.trim() !== '' ? `${subject}/${topic}` : topic;

  return (
    <div className="topic-result-item border border-gray-200 rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition duration-150">
      <div
        className="flex items-center justify-between cursor-pointer text-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          <FolderIcon className="h-6 w-6 text-yellow-500" />
          <span className="font-semibold text-lg">{folderName}</span>
        </div>
        <ChevronDownIcon
          className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
        />
      </div>

      {isOpen && files.length > 0 && (
        <ul className="mt-4 ml-6 space-y-2 text-gray-700">
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
      )}

      {isOpen && files.length === 0 && <p className="mt-4 text-gray-500 italic">No files found for this topic.</p>}
    </div>
  )
}

export default function ResourceFinder() {
  // State for structured form inputs
  const [grade, setGrade] = useState("")
  const [curriculum, setCurriculum] = useState("")
  const [subject, setSubject] = useState("")
  const [topics, setTopics] = useState<string[]>([])
  const [currentTopic, setCurrentTopic] = useState("")

  // State for free form input
  const [freeformInput, setFreeformInput] = useState("")
  const [isFreeform, setIsFreeform] = useState(false) // false: structured form, true: free form

  // State for file type checkboxes
  const [fileTypes, setFileTypes] = useState<FileTypes>({
    webpage: true,
    document: true,
    images: false,
    videos: false,
  })

  // General state
  const [results, setResults] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- Utility functions for structured form topic management ---

  // Wrapped in useCallback to ensure reliable state capture and prevent issues on initial render
  const addTopic = useCallback(() => {
    if (currentTopic.trim() && !topics.includes(currentTopic.trim())) {
      setTopics([...topics, currentTopic.trim()])
      setCurrentTopic("")
    }
  }, [currentTopic, topics])

  const removeTopic = (topicToRemove: string) => {
    setTopics(topics.filter((topic) => topic !== topicToRemove))
  }

  // Wrapped in useCallback to ensure reliable execution when Enter is pressed
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTopic()
    }
  }, [addTopic])

  // Handler for file type checkbox changes
  const handleFileTypesChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFileTypes({
      ...fileTypes,
      [event.target.name]: event.target.checked,
    })
  }

  // --- Tab switching and input clearing ---
  const switchMode = (mode: 'structured' | 'freeform') => {
    setIsFreeform(mode === 'freeform')
    setResults(null)
    setError(null)

    // Clear ALL inputs when switching modes to ensure a clean slate
    setFreeformInput('')
    setCurriculum('')
    setGrade('')
    setSubject('')
    setTopics([])
    setCurrentTopic('')
  }

  // --- Form Submission Handler ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults(null)

    const API_BASE_URL = 'http://localhost:8000';
    let endpoint = '';
    let payload: any = null;

    if (isFreeform) {
      // Freeform mode: POST to /input/freeform
      endpoint = `${API_BASE_URL}/input/freeform`;
      payload = {
        user_input: freeformInput,
        file_types: fileTypes
      };
    } else {
      // Structured form mode: POST to /input/form
      endpoint = `${API_BASE_URL}/input/form`;
      // Correctly nest the structured form data under the 'user_input' key
      payload = {
        user_input: {
          curriculum,
          grade,
          subject,
          topics,
        },
        file_types: fileTypes,
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      const data: ApiResponse = await response.json();
      setResults(data);

    } catch (error: any) {
      console.error("Error fetching data:", error);
      setError(error.message || "An error occurred while fetching data. Check your connection to the server.");
    } finally {
      setLoading(false);
    }
  }

  const resultTopics = useMemo(() => (results ? Object.keys(results) : []), [results])

  // Calculate the total number of files found across all topics
  const totalFileCount = useMemo(() => {
    if (!results) return 0;
    let count = 0;
    // Iterate over the files array for each topic and sum the lengths
    for (const topicFiles of Object.values(results)) {
      count += topicFiles.length;
    }
    return count;
  }, [results]);

  // Determine if the submit button should be disabled
  const isSubmitDisabled = loading || (
    isFreeform
      ? freeformInput.trim() === ''
      : (curriculum.trim() === '' || grade.trim() === '' || subject.trim() === '' || topics.length === 0)
  )

  // --- Render Input Fields based on mode ---
  const renderInputs = () => {
    if (isFreeform) {
      return (
        <div className="flex flex-col gap-4">
          <textarea
            className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-150 ease-in-out resize-none"
            placeholder="Enter free text prompt (e.g., 'Revision notes for high school biology')"
            rows={6}
            value={freeformInput}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFreeformInput(e.target.value)}
            required
            disabled={loading}
          />
        </div>
      )
    } else {
      // Structured Form Inputs (original layout)
      return (
        <div className="space-y-6">
          {/* Curriculum */}
          <div>
            <label htmlFor="curriculum" className="block text-sm font-medium text-gray-700 mb-2">
              Curriculum
            </label>
            <div className="relative">
              <AcademicCapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="curriculum"
                type="text"
                value={curriculum}
                onChange={(e) => setCurriculum(e.target.value)}
                required
                className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150"
                placeholder="e.g., Common Core, IB, Cambridge"
                disabled={loading}
              />
            </div>
          </div>

          {/* Grade Year */}
          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
              Grade Year
            </label>
            <div className="relative">
              <BookOpenIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="grade"
                type="number"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                required
                className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150"
                placeholder="e.g., 9"
                disabled={loading}
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <div className="relative">
              <AcademicCapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150"
                placeholder="e.g., Mathematics, Science, English"
                disabled={loading}
              />
            </div>
          </div>

          {/* Topics */}
          <div>
            <label htmlFor="topics" className="block text-sm font-medium text-gray-700 mb-2">
              Topics
            </label>
            <div className="relative flex items-center">
              <ListBulletIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="topics"
                type="text"
                value={currentTopic}
                onChange={(e) => setCurrentTopic(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full p-3 pl-10 pr-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150"
                placeholder="e.g., Algebra, Geometry, Fractions"
                disabled={loading}
              />
              <button
                type="button"
                onClick={addTopic}
                className="absolute right-2 p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-150"
                aria-label="Add Topic"
                disabled={loading}
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Added Topics Display */}
          {topics.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Added Topics ({topics.length})</label>
              <div className="flex flex-wrap gap-2">
                {topics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {topic}
                    <button
                      type="button"
                      onClick={() => removeTopic(topic)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-gray-100">
      <div className="container-box max-w-6xl w-full bg-white border border-gray-300 shadow-xl rounded-lg overflow-hidden flex flex-col lg:flex-row">

        {/* Input Section */}
        <div className="w-full lg:w-1/2 border-r border-gray-300">
          <div className="bg-[#4CAF50] text-white p-4 font-bold text-xl">Input</div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => switchMode('structured')}
              className={`px-8 py-3 text-lg font-semibold transition-colors duration-200 focus:outline-none
                          ${!isFreeform
                  ? 'border-b-4 border-green-600 text-green-700 bg-gray-50'
                  : 'text-gray-500 hover:text-gray-700'}`
              }
            >
              Structured Form
            </button>
            <button
              onClick={() => switchMode('freeform')}
              className={`px-8 py-3 text-lg font-semibold transition-colors duration-200 focus:outline-none
                          ${isFreeform
                  ? 'border-b-4 border-green-600 text-green-700 bg-gray-50'
                  : 'text-gray-500 hover:text-gray-700'}`
              }
            >
              Free Form Input
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {renderInputs()}

            {/* File Type Checkboxes */}
            <div className="pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">File Types</label>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div className="flex items-center">
                  <input
                    id="webpage-checkbox"
                    type="checkbox"
                    name="webpage"
                    checked={fileTypes.webpage}
                    onChange={handleFileTypesChange}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    disabled={loading}
                  />
                  <label htmlFor="webpage-checkbox" className="ml-2 text-sm text-gray-700">
                    Webpages
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="document-checkbox"
                    type="checkbox"
                    name="document"
                    checked={fileTypes.document}
                    onChange={handleFileTypesChange}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    disabled={loading}
                  />
                  <label htmlFor="document-checkbox" className="ml-2 text-sm text-gray-700">
                    Documents (.pdf, .ppt, .docx)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="images-checkbox"
                    type="checkbox"
                    name="images"
                    checked={fileTypes.images}
                    onChange={handleFileTypesChange}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    disabled={loading}
                  />
                  <label htmlFor="images-checkbox" className="ml-2 text-sm text-gray-700">
                    Images
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="videos-checkbox"
                    type="checkbox"
                    name="videos"
                    checked={fileTypes.videos}
                    onChange={handleFileTypesChange}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    disabled={loading}
                  />
                  <label htmlFor="videos-checkbox" className="ml-2 text-sm text-gray-700">
                    Videos
                  </label>
                </div>
              </div>
            </div>

            {/* Process Button */}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full py-3 rounded-md font-bold transition duration-150 ${
                isSubmitDisabled
                  ? "bg-gray-400 cursor-not-allowed text-gray-600"
                  : "bg-[#4CAF50] text-white hover:bg-green-600"
                }`}
            >
              {loading ? "Processing..." : "Find Resources"}
            </button>
          </form>

          {error && <div className="text-red-600 p-6 pt-0 font-medium">Error: {error}</div>}
        </div>

        {/* Output Section */}
        <div className="w-full lg:w-1/2 relative">
          <div className="bg-[#00897B] text-white p-4 font-bold text-xl flex items-center justify-between">
            Output
          </div>
          <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
            {loading && !results && (
              <div className="text-gray-500 italic text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
                Searching for educational resources...
              </div>
            )}

            {results && resultTopics.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  {/* Display total file count and topic count */}
                  Found {totalFileCount} resources across {resultTopics.length} topic{resultTopics.length !== 1 ? "s" : ""}
                </div>
                {resultTopics.map((topic) => (
                  <TopicResultItem
                    key={topic}
                    topic={topic}
                    files={results[topic]}
                    // Pass 'subject' only if in structured form; otherwise, pass an empty string
                    subject={!isFreeform ? subject : ""}
                  />
                ))}
              </div>
            ) : (
              !loading &&
              !error && (
                <div className="text-gray-500 italic text-center py-10">
                  <BookOpenIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  Add inputs and click 'Find Resources' to discover educational materials.
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}