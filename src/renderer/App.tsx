import { useState, useCallback, useEffect } from 'react'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import MainViewer from './components/MainViewer'
import { loadPdfDocument } from './services/pdfRenderer'
import type { PdfDocument, PdfPage } from './types/pdf'
import './index.css'

export default function App() {
  const [documents, setDocuments] = useState<PdfDocument[]>([])
  const [pages, setPages] = useState<PdfPage[]>([])
  const [selectedPageIndex, setSelectedPageIndex] = useState(0)
  const [zoom, setZoom] = useState(1.0)

  const handleOpenFiles = useCallback(async () => {
    try {
      const filePaths = await window.electronAPI.openFileDialog()
      if (filePaths.length === 0) return

      for (const filePath of filePaths) {
        const data = await window.electronAPI.readFile(filePath)
        const id = crypto.randomUUID()
        const name = filePath.split('/').pop() || filePath.split('\\').pop() || 'Unknown'

        const arrayBuffer = new Uint8Array(data).buffer
        const pdf = await loadPdfDocument(arrayBuffer, id)
        const pageCount = pdf.numPages

        const newDoc: PdfDocument = { id, name, path: filePath, pageCount }
        const newPages: PdfPage[] = Array.from({ length: pageCount }, (_, i) => ({
          id: crypto.randomUUID(),
          documentId: id,
          pageIndex: i,
          originalPageIndex: i
        }))

        setDocuments(prev => [...prev, newDoc])
        setPages(prev => [...prev, ...newPages])
      }
    } catch (error) {
      console.error('Error opening PDF:', error)
    }
  }, [])

  const handleReorder = useCallback((oldIndex: number, newIndex: number) => {
    setPages(prev => {
      const newPages = [...prev]
      const [moved] = newPages.splice(oldIndex, 1)
      newPages.splice(newIndex, 0, moved)
      return newPages
    })
    // Adjust selection if needed
    if (selectedPageIndex === oldIndex) {
      setSelectedPageIndex(newIndex)
    } else if (oldIndex < selectedPageIndex && newIndex >= selectedPageIndex) {
      setSelectedPageIndex(prev => prev - 1)
    } else if (oldIndex > selectedPageIndex && newIndex <= selectedPageIndex) {
      setSelectedPageIndex(prev => prev + 1)
    }
  }, [selectedPageIndex])

  const handleDeletePage = useCallback((index: number) => {
    setPages(prev => {
      if (prev.length <= 1) return prev // Don't delete last page
      return prev.filter((_, i) => i !== index)
    })
    setSelectedPageIndex(prev => {
      if (prev >= index && prev > 0) return prev - 1
      return prev
    })
  }, [])

  const handleDuplicatePage = useCallback((index: number) => {
    setPages(prev => {
      const newPages = [...prev]
      const duplicate = { ...prev[index], id: crypto.randomUUID() }
      newPages.splice(index + 1, 0, duplicate)
      return newPages
    })
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + O: Open files
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault()
        handleOpenFiles()
        return
      }

      // Ctrl/Cmd + Plus: Zoom in
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        setZoom(z => Math.min(3, z + 0.25))
        return
      }

      // Ctrl/Cmd + Minus: Zoom out
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault()
        setZoom(z => Math.max(0.25, z - 0.25))
        return
      }

      // Ctrl/Cmd + 0: Reset zoom
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        setZoom(1)
        return
      }

      // Page navigation with arrow keys (when not in input)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Ctrl/Cmd + Arrow Up: First page
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp' && pages.length > 0) {
        e.preventDefault()
        setSelectedPageIndex(0)
        return
      }

      // Ctrl/Cmd + Arrow Down: Last page
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown' && pages.length > 0) {
        e.preventDefault()
        setSelectedPageIndex(pages.length - 1)
        return
      }

      // Arrow Up: Previous page
      if (e.key === 'ArrowUp' && pages.length > 0) {
        e.preventDefault()
        setSelectedPageIndex(prev => Math.max(0, prev - 1))
        return
      }

      // Arrow Down: Next page
      if (e.key === 'ArrowDown' && pages.length > 0) {
        e.preventDefault()
        setSelectedPageIndex(prev => Math.min(pages.length - 1, prev + 1))
        return
      }

      // Home: First page
      if (e.key === 'Home' && pages.length > 0) {
        e.preventDefault()
        setSelectedPageIndex(0)
        return
      }

      // End: Last page
      if (e.key === 'End' && pages.length > 0) {
        e.preventDefault()
        setSelectedPageIndex(pages.length - 1)
        return
      }

      // Delete or Backspace: Delete selected page
      if ((e.key === 'Delete' || e.key === 'Backspace') && pages.length > 1) {
        e.preventDefault()
        handleDeletePage(selectedPageIndex)
        return
      }

      // Ctrl/Cmd + D: Duplicate selected page
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && pages.length > 0) {
        e.preventDefault()
        handleDuplicatePage(selectedPageIndex)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleOpenFiles, handleDeletePage, handleDuplicatePage, pages.length, selectedPageIndex])

  // Get current page info for viewer
  const currentPage = pages[selectedPageIndex]

  return (
    <div className="app">
      <Toolbar
        hasDocuments={documents.length > 0}
        zoom={zoom}
        onOpenFiles={handleOpenFiles}
        onZoomChange={setZoom}
      />
      <div className="main-content">
        <Sidebar
          documents={documents}
          pages={pages}
          selectedPageIndex={selectedPageIndex}
          onPageSelect={setSelectedPageIndex}
          onReorder={handleReorder}
          onDeletePage={handleDeletePage}
          onDuplicatePage={handleDuplicatePage}
        />
        <MainViewer
          documentId={currentPage?.documentId || null}
          pageIndex={currentPage?.originalPageIndex || 0}
          zoom={zoom}
        />
      </div>
    </div>
  )
}
