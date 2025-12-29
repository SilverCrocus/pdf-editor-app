# PDF Viewer & Editor App - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a desktop PDF viewer with page reordering, multi-PDF merging, and annotation tools.

**Architecture:** Electron app with React frontend. PDF.js renders pages for viewing, pdf-lib handles manipulation and saving. Annotations live on a canvas layer until baked into the PDF on save.

**Tech Stack:** Electron, React, TypeScript, Vite, PDF.js, pdf-lib, @dnd-kit (drag-drop)

---

## Phase 1: Project Scaffolding

### Task 1.1: Initialize Electron + Vite + React + TypeScript Project

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `electron.vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`

**Step 1: Initialize npm project**

```bash
npm init -y
```

**Step 2: Install core dependencies**

```bash
npm install react react-dom
npm install -D typescript vite @vitejs/plugin-react electron electron-builder
npm install -D @types/react @types/react-dom
```

**Step 3: Install electron-vite for easy Electron + Vite integration**

```bash
npm install -D electron-vite
```

**Step 4: Create package.json scripts**

Update `package.json`:
```json
{
  "name": "pdf-editor-app",
  "version": "1.0.0",
  "main": "dist-electron/main/main.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "electron-builder"
  }
}
```

**Step 5: Create electron-vite config**

Create `electron.vite.config.ts`:
```typescript
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      outDir: 'dist-electron/main'
    }
  },
  preload: {
    build: {
      outDir: 'dist-electron/preload'
    }
  },
  renderer: {
    plugins: [react()],
    build: {
      outDir: 'dist'
    }
  }
})
```

**Step 6: Create tsconfig.json**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: initialize electron-vite project"
```

---

### Task 1.2: Create Electron Main Process

**Files:**
- Create: `src/main/main.ts`
- Create: `src/main/ipc.ts`

**Step 1: Create main entry point**

Create `src/main/main.ts`:
```typescript
import { app, BrowserWindow } from 'electron'
import path from 'path'
import { setupIpcHandlers } from './ipc'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  setupIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

**Step 2: Create IPC handlers stub**

Create `src/main/ipc.ts`:
```typescript
import { ipcMain, dialog } from 'electron'
import fs from 'fs/promises'

export function setupIpcHandlers() {
  ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    })
    return result.filePaths
  })

  ipcMain.handle('read-file', async (_, filePath: string) => {
    const buffer = await fs.readFile(filePath)
    return buffer
  })

  ipcMain.handle('save-file', async (_, filePath: string, data: Uint8Array) => {
    await fs.writeFile(filePath, data)
    return true
  })

  ipcMain.handle('save-file-dialog', async () => {
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    })
    return result.filePath
  })
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add electron main process with IPC handlers"
```

---

### Task 1.3: Create Preload Script

**Files:**
- Create: `src/preload/preload.ts`

**Step 1: Create preload script**

Create `src/preload/preload.ts`:
```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  saveFile: (filePath: string, data: Uint8Array) =>
    ipcRenderer.invoke('save-file', filePath, data),
  saveFileDialog: () => ipcRenderer.invoke('save-file-dialog')
})
```

**Step 2: Create type declarations**

Create `src/preload/electron.d.ts`:
```typescript
export interface ElectronAPI {
  openFileDialog: () => Promise<string[]>
  readFile: (filePath: string) => Promise<Buffer>
  saveFile: (filePath: string, data: Uint8Array) => Promise<boolean>
  saveFileDialog: () => Promise<string | undefined>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add preload script with electron API bridge"
```

---

### Task 1.4: Create React App Entry

**Files:**
- Create: `index.html`
- Create: `src/renderer/main.tsx`
- Create: `src/renderer/App.tsx`
- Create: `src/renderer/index.css`

**Step 1: Create index.html**

Create `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'">
    <title>PDF Editor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/renderer/main.tsx"></script>
  </body>
</html>
```

**Step 2: Create React entry**

Create `src/renderer/main.tsx`:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Step 3: Create App component**

Create `src/renderer/App.tsx`:
```typescript
export default function App() {
  return (
    <div className="app">
      <h1>PDF Editor</h1>
      <p>App is running!</p>
    </div>
  )
}
```

**Step 4: Create base styles**

Create `src/renderer/index.css`:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1e1e1e;
  color: #fff;
  overflow: hidden;
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
```

**Step 5: Verify app runs**

```bash
npm run dev
```

Expected: Electron window opens with "PDF Editor" heading.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add React app entry point"
```

---

## Phase 2: PDF Viewing

### Task 2.1: Install PDF.js and Create Renderer Service

**Files:**
- Create: `src/renderer/services/pdfRenderer.ts`
- Create: `src/renderer/types/pdf.ts`

**Step 1: Install PDF.js**

```bash
npm install pdfjs-dist
```

**Step 2: Create PDF types**

Create `src/renderer/types/pdf.ts`:
```typescript
export interface PdfDocument {
  id: string
  name: string
  path: string
  pageCount: number
}

export interface PdfPage {
  documentId: string
  pageIndex: number
  originalPageIndex: number
}

export interface PageRenderResult {
  canvas: HTMLCanvasElement
  width: number
  height: number
}
```

**Step 3: Create PDF renderer service**

Create `src/renderer/services/pdfRenderer.ts`:
```typescript
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

const documentCache = new Map<string, PDFDocumentProxy>()

export async function loadPdfDocument(
  data: ArrayBuffer,
  id: string
): Promise<PDFDocumentProxy> {
  const pdf = await pdfjsLib.getDocument({ data }).promise
  documentCache.set(id, pdf)
  return pdf
}

export async function renderPage(
  documentId: string,
  pageIndex: number,
  scale: number = 1.0
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const pdf = documentCache.get(documentId)
  if (!pdf) throw new Error(`Document ${documentId} not loaded`)

  const page = await pdf.getPage(pageIndex + 1) // PDF.js uses 1-based indexing
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height

  const context = canvas.getContext('2d')!
  await page.render({ canvasContext: context, viewport }).promise

  return { canvas, width: viewport.width, height: viewport.height }
}

export function getDocument(id: string): PDFDocumentProxy | undefined {
  return documentCache.get(id)
}

export function unloadDocument(id: string): void {
  const pdf = documentCache.get(id)
  if (pdf) {
    pdf.destroy()
    documentCache.delete(id)
  }
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add PDF.js renderer service"
```

---

### Task 2.2: Create Main Viewer Component

**Files:**
- Create: `src/renderer/components/MainViewer.tsx`
- Create: `src/renderer/components/MainViewer.css`

**Step 1: Create MainViewer component**

Create `src/renderer/components/MainViewer.tsx`:
```typescript
import { useEffect, useRef, useState } from 'react'
import { renderPage } from '../services/pdfRenderer'
import './MainViewer.css'

interface MainViewerProps {
  documentId: string | null
  pageIndex: number
  zoom: number
}

export default function MainViewer({ documentId, pageIndex, zoom }: MainViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rendering, setRendering] = useState(false)

  useEffect(() => {
    if (!documentId || !containerRef.current) return

    const container = containerRef.current
    setRendering(true)

    renderPage(documentId, pageIndex, zoom)
      .then(({ canvas }) => {
        container.innerHTML = ''
        container.appendChild(canvas)
      })
      .catch(console.error)
      .finally(() => setRendering(false))
  }, [documentId, pageIndex, zoom])

  if (!documentId) {
    return (
      <div className="main-viewer empty">
        <p>Open a PDF to get started</p>
        <p className="hint">Ctrl+O to open file</p>
      </div>
    )
  }

  return (
    <div className="main-viewer" ref={containerRef}>
      {rendering && <div className="loading">Rendering...</div>}
    </div>
  )
}
```

**Step 2: Create MainViewer styles**

Create `src/renderer/components/MainViewer.css`:
```css
.main-viewer {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  background: #2d2d2d;
}

.main-viewer.empty {
  align-items: center;
  flex-direction: column;
  color: #888;
}

.main-viewer.empty .hint {
  margin-top: 8px;
  font-size: 12px;
}

.main-viewer canvas {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.main-viewer .loading {
  position: absolute;
  color: #888;
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add MainViewer component"
```

---

## Phase 3: Sidebar with Thumbnails

### Task 3.1: Create Sidebar and PageThumbnail Components

**Files:**
- Create: `src/renderer/components/Sidebar.tsx`
- Create: `src/renderer/components/Sidebar.css`
- Create: `src/renderer/components/PageThumbnail.tsx`
- Create: `src/renderer/components/PageThumbnail.css`

**Step 1: Create PageThumbnail component**

Create `src/renderer/components/PageThumbnail.tsx`:
```typescript
import { useEffect, useRef } from 'react'
import { renderPage } from '../services/pdfRenderer'
import './PageThumbnail.css'

interface PageThumbnailProps {
  documentId: string
  pageIndex: number
  pageNumber: number
  selected: boolean
  onClick: () => void
}

const THUMBNAIL_SCALE = 0.2

export default function PageThumbnail({
  documentId,
  pageIndex,
  pageNumber,
  selected,
  onClick
}: PageThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    renderPage(documentId, pageIndex, THUMBNAIL_SCALE)
      .then(({ canvas }) => {
        container.innerHTML = ''
        container.appendChild(canvas)
      })
      .catch(console.error)
  }, [documentId, pageIndex])

  return (
    <div
      className={`page-thumbnail ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="thumbnail-canvas" ref={containerRef} />
      <span className="page-number">{pageNumber}</span>
    </div>
  )
}
```

**Step 2: Create PageThumbnail styles**

Create `src/renderer/components/PageThumbnail.css`:
```css
.page-thumbnail {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}

.page-thumbnail:hover {
  background: #3a3a3a;
}

.page-thumbnail.selected {
  background: #0066cc;
}

.thumbnail-canvas {
  border: 2px solid transparent;
  border-radius: 2px;
  overflow: hidden;
}

.page-thumbnail.selected .thumbnail-canvas {
  border-color: #fff;
}

.thumbnail-canvas canvas {
  display: block;
}

.page-number {
  margin-top: 4px;
  font-size: 11px;
  color: #aaa;
}

.page-thumbnail.selected .page-number {
  color: #fff;
}
```

**Step 3: Create Sidebar component**

Create `src/renderer/components/Sidebar.tsx`:
```typescript
import type { PdfDocument, PdfPage } from '../types/pdf'
import PageThumbnail from './PageThumbnail'
import './Sidebar.css'

interface SidebarProps {
  documents: PdfDocument[]
  pages: PdfPage[]
  selectedPageIndex: number
  onPageSelect: (index: number) => void
}

export default function Sidebar({
  documents,
  pages,
  selectedPageIndex,
  onPageSelect
}: SidebarProps) {
  if (documents.length === 0) {
    return (
      <div className="sidebar empty">
        <p>No documents</p>
      </div>
    )
  }

  // Group pages by document for display
  let currentDocId = ''
  let pageNumber = 0

  return (
    <div className="sidebar">
      {pages.map((page, index) => {
        const showHeader = page.documentId !== currentDocId
        if (showHeader) {
          currentDocId = page.documentId
          pageNumber = 0
        }
        pageNumber++

        const doc = documents.find(d => d.id === page.documentId)

        return (
          <div key={`${page.documentId}-${page.originalPageIndex}-${index}`}>
            {showHeader && (
              <div className="document-header">{doc?.name}</div>
            )}
            <PageThumbnail
              documentId={page.documentId}
              pageIndex={page.originalPageIndex}
              pageNumber={pageNumber}
              selected={index === selectedPageIndex}
              onClick={() => onPageSelect(index)}
            />
          </div>
        )
      })}
    </div>
  )
}
```

**Step 4: Create Sidebar styles**

Create `src/renderer/components/Sidebar.css`:
```css
.sidebar {
  width: 150px;
  min-width: 150px;
  background: #252525;
  border-right: 1px solid #3a3a3a;
  overflow-y: auto;
  padding: 8px;
}

.sidebar.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 12px;
}

.document-header {
  padding: 8px 4px;
  font-size: 11px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #3a3a3a;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Sidebar and PageThumbnail components"
```

---

## Phase 4: Wire Up App with State

### Task 4.1: Create App State and Wire Components

**Files:**
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/index.css`

**Step 1: Update App with state management**

Replace `src/renderer/App.tsx`:
```typescript
import { useState, useCallback } from 'react'
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
    const filePaths = await window.electronAPI.openFileDialog()
    if (filePaths.length === 0) return

    for (const filePath of filePaths) {
      const buffer = await window.electronAPI.readFile(filePath)
      const id = crypto.randomUUID()
      const name = filePath.split('/').pop() || filePath.split('\\').pop() || 'Unknown'

      const pdf = await loadPdfDocument(buffer.buffer, id)
      const pageCount = pdf.numPages

      const newDoc: PdfDocument = { id, name, path: filePath, pageCount }
      const newPages: PdfPage[] = Array.from({ length: pageCount }, (_, i) => ({
        documentId: id,
        pageIndex: i,
        originalPageIndex: i
      }))

      setDocuments(prev => [...prev, newDoc])
      setPages(prev => [...prev, ...newPages])
    }
  }, [])

  // Get current page info for viewer
  const currentPage = pages[selectedPageIndex]

  return (
    <div className="app">
      <div className="toolbar">
        <button onClick={handleOpenFiles}>Open PDF</button>
        <span className="zoom-controls">
          <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}>−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.25))}>+</button>
        </span>
      </div>
      <div className="main-content">
        <Sidebar
          documents={documents}
          pages={pages}
          selectedPageIndex={selectedPageIndex}
          onPageSelect={setSelectedPageIndex}
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
```

**Step 2: Update base styles**

Replace `src/renderer/index.css`:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1e1e1e;
  color: #fff;
  overflow: hidden;
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.toolbar {
  height: 48px;
  background: #333;
  border-bottom: 1px solid #444;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 12px;
}

.toolbar button {
  padding: 6px 12px;
  background: #0066cc;
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
}

.toolbar button:hover {
  background: #0077ee;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.zoom-controls button {
  width: 28px;
  height: 28px;
  padding: 0;
  font-size: 16px;
}

.zoom-controls span {
  min-width: 50px;
  text-align: center;
  font-size: 13px;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}
```

**Step 3: Test the app**

```bash
npm run dev
```

Expected: Can open PDFs, see thumbnails in sidebar, click to view pages, zoom in/out.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire up app with PDF loading and viewing"
```

---

## Phase 5: Page Management (Drag-Drop, Delete, Duplicate)

### Task 5.1: Add Drag-and-Drop Reordering

**Files:**
- Modify: `src/renderer/components/Sidebar.tsx`
- Modify: `src/renderer/App.tsx`

**Step 1: Install dnd-kit**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Step 2: Update Sidebar with drag-drop**

Replace `src/renderer/components/Sidebar.tsx`:
```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { PdfDocument, PdfPage } from '../types/pdf'
import PageThumbnail from './PageThumbnail'
import './Sidebar.css'

interface SidebarProps {
  documents: PdfDocument[]
  pages: PdfPage[]
  selectedPageIndex: number
  onPageSelect: (index: number) => void
  onReorder: (oldIndex: number, newIndex: number) => void
  onDeletePage: (index: number) => void
  onDuplicatePage: (index: number) => void
}

interface SortableItemProps {
  id: string
  page: PdfPage
  index: number
  pageNumber: number
  showHeader: boolean
  docName: string
  selected: boolean
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

function SortableItem({
  id,
  page,
  index,
  pageNumber,
  showHeader,
  docName,
  selected,
  onClick,
  onContextMenu
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {showHeader && <div className="document-header">{docName}</div>}
      <div onContextMenu={onContextMenu}>
        <PageThumbnail
          documentId={page.documentId}
          pageIndex={page.originalPageIndex}
          pageNumber={pageNumber}
          selected={selected}
          onClick={onClick}
        />
      </div>
    </div>
  )
}

export default function Sidebar({
  documents,
  pages,
  selectedPageIndex,
  onPageSelect,
  onReorder,
  onDeletePage,
  onDuplicatePage
}: SidebarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(null)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex((_, i) => `page-${i}` === active.id)
      const newIndex = pages.findIndex((_, i) => `page-${i}` === over.id)
      onReorder(oldIndex, newIndex)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, index })
  }

  const closeContextMenu = () => setContextMenu(null)

  if (documents.length === 0) {
    return <div className="sidebar empty"><p>No documents</p></div>
  }

  let currentDocId = ''
  let pageNumber = 0

  return (
    <div className="sidebar" onClick={closeContextMenu}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={pages.map((_, i) => `page-${i}`)} strategy={verticalListSortingStrategy}>
          {pages.map((page, index) => {
            const showHeader = page.documentId !== currentDocId
            if (showHeader) {
              currentDocId = page.documentId
              pageNumber = 0
            }
            pageNumber++
            const doc = documents.find(d => d.id === page.documentId)

            return (
              <SortableItem
                key={`page-${index}`}
                id={`page-${index}`}
                page={page}
                index={index}
                pageNumber={pageNumber}
                showHeader={showHeader}
                docName={doc?.name || ''}
                selected={index === selectedPageIndex}
                onClick={() => onPageSelect(index)}
                onContextMenu={(e) => handleContextMenu(e, index)}
              />
            )
          })}
        </SortableContext>
      </DndContext>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button onClick={() => { onDuplicatePage(contextMenu.index); closeContextMenu() }}>
            Duplicate
          </button>
          <button onClick={() => { onDeletePage(contextMenu.index); closeContextMenu() }}>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
```

Note: Add `import { useState } from 'react'` at top.

**Step 3: Add context menu styles to Sidebar.css**

Append to `src/renderer/components/Sidebar.css`:
```css
.context-menu {
  position: fixed;
  background: #3a3a3a;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 4px 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.context-menu button {
  display: block;
  width: 100%;
  padding: 8px 16px;
  background: none;
  border: none;
  color: #fff;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
}

.context-menu button:hover {
  background: #0066cc;
}
```

**Step 4: Update App to handle reorder/delete/duplicate**

Add these handlers in `App.tsx` and pass to Sidebar:

```typescript
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
  setPages(prev => prev.filter((_, i) => i !== index))
  if (selectedPageIndex >= index && selectedPageIndex > 0) {
    setSelectedPageIndex(prev => prev - 1)
  }
}, [selectedPageIndex])

const handleDuplicatePage = useCallback((index: number) => {
  setPages(prev => {
    const newPages = [...prev]
    const duplicate = { ...prev[index] }
    newPages.splice(index + 1, 0, duplicate)
    return newPages
  })
}, [])
```

Pass to Sidebar:
```typescript
<Sidebar
  documents={documents}
  pages={pages}
  selectedPageIndex={selectedPageIndex}
  onPageSelect={setSelectedPageIndex}
  onReorder={handleReorder}
  onDeletePage={handleDeletePage}
  onDuplicatePage={handleDuplicatePage}
/>
```

**Step 5: Test**

```bash
npm run dev
```

Expected: Can drag pages to reorder, right-click for delete/duplicate.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add page reordering, delete, and duplicate"
```

---

## Phase 6-8: Remaining Implementation

The remaining phases follow the same pattern. Here's the outline:

### Phase 6: Toolbar Component
- Task 6.1: Create full Toolbar with file operations
- Task 6.2: Add zoom dropdown
- Task 6.3: Add keyboard shortcuts (Ctrl+O, Ctrl+S, etc.)

### Phase 7: Annotation System
- Task 7.1: Create annotation types and state
- Task 7.2: Create AnnotationLayer component
- Task 7.3: Implement Highlight tool
- Task 7.4: Implement Underline/Strikethrough tools
- Task 7.5: Implement Box tool
- Task 7.6: Implement Text tool
- Task 7.7: Add annotation selection and movement
- Task 7.8: Add annotation properties panel

### Phase 8: Save/Export with pdf-lib
- Task 8.1: Install pdf-lib and create manipulator service
- Task 8.2: Implement Save As (merge pages, bake annotations)
- Task 8.3: Implement Save with overwrite warning
- Task 8.4: Add unsaved changes tracking

### Phase 9: Polish
- Task 9.1: Add undo/redo system
- Task 9.2: Add window state persistence
- Task 9.3: Add title bar with filename
- Task 9.4: Add close confirmation dialog

---

**End of Plan**
