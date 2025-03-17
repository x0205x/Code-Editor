"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Undo, Redo, Plus, Trash2, Upload, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const getLanguageFromFileName = (fileName) => {
  const extension = fileName.split(".").pop()?.toLowerCase()
  switch (extension) {
    case "html":
      return { name: "HTML", template: "<!-- Write your HTML here -->\n<div>\n  <h1>Hello World!</h1>\n</div>" }
    case "css":
      return { name: "CSS", template: "/* Write your CSS here */\nbody {\n  color: blue;\n}" }
    case "js":
      return { name: "JavaScript", template: '// Write your JavaScript here\nconsole.log("Hello World!");' }
    default:
      return null
  }
}

const CodeEditor = () => {
  const [files, setFiles] = useState([
    {
      id: 1,
      name: "index.html",
      language: "html",
      content: getLanguageFromFileName("index.html").template,
      history: [getLanguageFromFileName("index.html").template],
      historyIndex: 0,
    },
  ])
  const [activeFile, setActiveFile] = useState(1)
  const [preview, setPreview] = useState("")
  const [error, setError] = useState("")
  const [theme, setTheme] = useState("tom")
  const [newFileName, setNewFileName] = useState("")
  const [autoSave, setAutoSave] = useState(true)
  const [lastSaved, setLastSaved] = useState(new Date())
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)

  const themes = {
    tom: {
      bg: "bg-gradient-to-br from-blue-50 to-gray-100",
      text: "text-gray-800",
      primary: "bg-white/80 backdrop-blur-xl",
      secondary: "bg-blue-50/80",
      accent: "text-blue-600",
      border: "border-blue-200",
      editor: "bg-white/90",
      button: "bg-blue-100 hover:bg-blue-200 text-blue-700 shadow-lg hover:shadow-xl transition-all duration-300",
      activeTab: "bg-white text-blue-900 border-blue-300 shadow-md",
      inactiveTab: "text-gray-600 hover:text-gray-900 hover:bg-white/50",
      preview: "bg-white/90 backdrop-blur-md",
    },
    jerry: {
      bg: "bg-gradient-to-br from-gray-900 to-yellow-900",
      text: "text-gray-100",
      primary: "bg-gray-800/80 backdrop-blur-xl",
      secondary: "bg-yellow-900/50",
      accent: "text-yellow-400",
      border: "border-yellow-700",
      editor: "bg-gray-900/90",
      button:
        "bg-yellow-700 hover:bg-yellow-600 text-gray-100 shadow-lg shadow-yellow-500/20 hover:shadow-xl hover:shadow-yellow-500/30 transition-all duration-300",
      activeTab: "bg-gray-800 text-yellow-100 border-yellow-600 shadow-lg shadow-yellow-500/20",
      inactiveTab: "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50",
      preview: "bg-gray-800/90 backdrop-blur-md",
    },
  }

  const currentTheme = themes[theme]

  // Undo/Redo operations
  const undo = () => {
    const currentFile = getCurrentFile()
    if (!currentFile || currentFile.historyIndex <= 0) return

    setFiles(
      files.map((f) => {
        if (f.id === activeFile) {
          const newContent = f.history[f.historyIndex - 1]
          return {
            ...f,
            content: newContent,
            historyIndex: f.historyIndex - 1,
          }
        }
        return f
      }),
    )
  }

  const redo = () => {
    const currentFile = getCurrentFile()
    if (!currentFile || currentFile.historyIndex >= currentFile.history.length - 1) return

    setFiles(
      files.map((f) => {
        if (f.id === activeFile) {
          const newContent = f.history[f.historyIndex + 1]
          return {
            ...f,
            content: newContent,
            historyIndex: f.historyIndex + 1,
          }
        }
        return f
      }),
    )
  }

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const content = e.target?.result as string
      if (content) {
        const languageInfo = getLanguageFromFileName(file.name)

        if (!languageInfo) {
          setError("Invalid file type. Please upload .html, .css, or .js files")
          return
        }

        const newId = Math.max(...files.map((f) => f.id)) + 1
        const newFile = {
          id: newId,
          name: file.name,
          language: languageInfo.name.toLowerCase(),
          content: content,
          history: [content],
          historyIndex: 0,
        }

        setFiles([...files, newFile])
        setActiveFile(newId)
        setError("")

        if (languageInfo.name.toLowerCase() === "html") {
          setPreview(content)
        }
      }
    }
    reader.readAsText(file)
  }

  // Auto-save functionality
  useEffect(() => {
    if (autoSave) {
      const saveTimer = setInterval(() => {
        const currentFile = getCurrentFile()
        if (currentFile) {
          localStorage.setItem(`editor_${currentFile.id}`, JSON.stringify(currentFile))
          setLastSaved(new Date())
        }
      }, 30000)
      return () => clearInterval(saveTimer)
    }
  }, [autoSave]) //Corrected dependency

  // File operations
  const getCurrentFile = useCallback(() => files.find((f) => f.id === activeFile), [files, activeFile])

  const updateCurrentFile = (newContent, addToHistory = true) => {
    setFiles(
      files.map((f) => {
        if (f.id === activeFile) {
          const newFile = { ...f, content: newContent }
          if (addToHistory) {
            newFile.history = [...f.history.slice(0, f.historyIndex + 1), newContent]
            newFile.historyIndex = f.historyIndex + 1
          }
          return newFile
        }
        return f
      }),
    )

    try {
      const currentFile = getCurrentFile()
      if (currentFile && currentFile.language === "html") {
        setPreview(newContent)
      } else {
        setPreview("")
      }
      setError("")
    } catch (err) {
      setError(err.message)
    }
  }

  // File management
  const addFile = () => {
    if (!newFileName.trim()) {
      setError("Please enter a file name")
      return
    }

    const languageInfo = getLanguageFromFileName(newFileName)
    if (!languageInfo) {
      setError("Invalid file type. Please use .html, .css, or .js extension")
      return
    }

    const newId = Math.max(...files.map((f) => f.id)) + 1
    const newFile = {
      id: newId,
      name: newFileName,
      language: languageInfo.name.toLowerCase(),
      content: languageInfo.template,
      history: [languageInfo.template],
      historyIndex: 0,
    }
    setFiles([...files, newFile])
    setActiveFile(newId)
    setNewFileName("")
    setError("")
  }

  const deleteFile = (id) => {
    if (files.length > 1) {
      setFiles(files.filter((f) => f.id !== id))
      if (activeFile === id) {
        setActiveFile(files.find((f) => f.id !== id).id)
      }
    }
  }

  // Export functionality
  const exportFile = () => {
    const file = getCurrentFile()
    if (!file) return

    const blob = new Blob([file.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={`min-h-screen p-2 sm:p-4 ${currentTheme.bg} ${currentTheme.text} transition-colors duration-500 relative overflow-hidden`}
    >
      {theme === "tom" && (
        <div
          className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-contain bg-no-repeat opacity-20"
          style={{ backgroundImage: "url('/tom.png')" }}
        ></div>
      )}
      {theme === "jerry" && (
        <div
          className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-contain bg-no-repeat opacity-20"
          style={{ backgroundImage: "url('/jerry.png')" }}
        ></div>
      )}
      {/* Main toolbar */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className={`${currentTheme.button} group text-sm sm:text-base`}
            onClick={() => setTheme(theme === "tom" ? "jerry" : "tom")}
          >
            {theme === "tom" ? (
              <span className="group-hover:animate-bounce">🐭</span>
            ) : (
              <span className="group-hover:animate-bounce">🐱</span>
            )}
          </Button>
          <Button
            variant="outline"
            className={`${currentTheme.button} text-sm sm:text-base`}
            onClick={() => document.getElementById("file-upload").click()}
          >
            <Upload className="h-4 w-4 mr-1 sm:mr-2" />
            Upload
          </Button>
          <input id="file-upload" type="file" accept=".html,.css,.js" className="hidden" onChange={handleFileUpload} />
          <Button variant="outline" className={`${currentTheme.button} text-sm sm:text-base`} onClick={exportFile}>
            <Download className="h-4 w-4 mr-1 sm:mr-2" />
            Export
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Input
            type="text"
            placeholder="New file name (e.g., style.css)"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className={`${currentTheme.primary} ${currentTheme.text} ${currentTheme.border} text-sm sm:text-base`}
          />
          <Button variant="outline" className={`${currentTheme.button} text-sm sm:text-base`} onClick={addFile}>
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            Add File
          </Button>
        </div>
      </div>

      {/* File tabs */}
      <div className="overflow-x-auto mb-2 sm:mb-4 -mx-2 px-2">
        <div className="flex gap-1 sm:gap-2 min-w-max">
          {files.map((file) => (
            <div key={file.id} className="flex items-center group">
              <Button
                variant="outline"
                className={`${activeFile === file.id ? currentTheme.activeTab : currentTheme.inactiveTab} 
                ${currentTheme.border} text-xs sm:text-sm transition-all duration-300 py-1 px-2 sm:py-2 sm:px-3`}
                onClick={() => setActiveFile(file.id)}
              >
                {file.name}
              </Button>
              {files.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`${currentTheme.inactiveTab} opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-1 sm:p-2`}
                  onClick={() => deleteFile(file.id)}
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-2 sm:mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Editor and Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
        <Card className={`p-2 sm:p-4 ${currentTheme.primary} ${currentTheme.border} ring-1 ring-indigo-500/20`}>
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" className={`${currentTheme.button} p-1 sm:p-2`} onClick={undo}>
                <Undo className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button variant="outline" className={`${currentTheme.button} p-1 sm:p-2`} onClick={redo}>
                <Redo className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            <div className="text-xs sm:text-sm opacity-60">Last saved: {lastSaved.toLocaleTimeString()}</div>
          </div>
          <textarea
            value={getCurrentFile()?.content || ""}
            onChange={(e) => updateCurrentFile(e.target.value)}
            className={`w-full h-[40vh] sm:h-[60vh] p-2 sm:p-4 font-mono text-xs sm:text-sm rounded-md ${currentTheme.editor} ${currentTheme.text} 
            resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300`}
            spellCheck="false"
          />
        </Card>

        <Card
          className={`p-2 sm:p-4 ${currentTheme.primary} ${currentTheme.border} ring-1 ring-indigo-500/20 
        ${isPreviewFullscreen ? "fixed inset-2 sm:inset-4 z-50" : ""}`}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="font-semibold text-sm sm:text-base">Preview</div>
            <Button
              variant="outline"
              className={`${currentTheme.button} text-xs sm:text-sm`}
              onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
            >
              {isPreviewFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </Button>
          </div>
          <div
            className={`w-full ${isPreviewFullscreen ? "h-[calc(100vh-6rem)]" : "h-[40vh] sm:h-[60vh]"} p-2 sm:p-4 overflow-auto rounded-md 
            ${currentTheme.preview} transition-all duration-300`}
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </Card>
      </div>
    </div>
  )
}

export default CodeEditor

