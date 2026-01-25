import { app, BrowserWindow } from 'electron'
import path from 'path'
import { setupIpcHandlers, setPendingFiles } from './ipc'

let mainWindow: BrowserWindow | null = null
let pendingFilePaths: string[] = []
let batchTimer: NodeJS.Timeout | null = null
const BATCH_DELAY_MS = 150

// Natural sort comparator for filenames
function naturalSort(paths: string[]): string[] {
  return [...paths].sort((a, b) => {
    const nameA = path.basename(a)
    const nameB = path.basename(b)
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' })
  })
}

function createWindow(filePaths?: string[]) {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Store pending files for this window
  if (filePaths && filePaths.length > 0) {
    setPendingFiles(window.webContents.id, filePaths)
  }

  if (process.env.NODE_ENV === 'development') {
    window.loadURL('http://localhost:5173')
    window.webContents.openDevTools()
  } else {
    window.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  window.on('closed', () => {
    if (window === mainWindow) {
      mainWindow = null
    }
  })

  // Track first window as main
  if (!mainWindow) {
    mainWindow = window
  }

  return window
}

// Process a batch of files - sort and open in single window
function processBatch() {
  if (pendingFilePaths.length > 0) {
    const sortedPaths = naturalSort(pendingFilePaths)
    createWindow(sortedPaths)
    pendingFilePaths = []
  }
  batchTimer = null
}

// Handle file open from Finder (macOS)
app.on('open-file', (event, filePath) => {
  event.preventDefault()

  if (app.isReady()) {
    // Add to pending batch
    pendingFilePaths.push(filePath)

    // Reset/start the batch timer
    if (batchTimer) clearTimeout(batchTimer)
    batchTimer = setTimeout(processBatch, BATCH_DELAY_MS)
  } else {
    // App is starting, collect for initial batch
    pendingFilePaths.push(filePath)
  }
})

app.whenReady().then(() => {
  setupIpcHandlers()

  // Check for file paths in command line args (macOS passes files as args)
  const fileArgs = process.argv.filter(arg => arg.endsWith('.pdf') && !arg.startsWith('-'))

  // Combine any pending paths with command line args
  const allPaths = [...pendingFilePaths, ...fileArgs]
  pendingFilePaths = []

  if (allPaths.length > 0) {
    createWindow(naturalSort(allPaths))
  } else {
    createWindow()
  }

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
