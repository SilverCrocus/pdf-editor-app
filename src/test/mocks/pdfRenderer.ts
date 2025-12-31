import { vi } from 'vitest'

export const mockPdfDocument = {
  numPages: 3,
  getPage: vi.fn()
}

export const mockCanvas = document.createElement('canvas')
mockCanvas.width = 100
mockCanvas.height = 150

export const loadPdfDocument = vi.fn().mockResolvedValue(mockPdfDocument)

export const renderPage = vi.fn().mockResolvedValue({
  canvas: mockCanvas,
  width: 100,
  height: 150
})

export const getDocument = vi.fn().mockReturnValue(mockPdfDocument)

export const unloadDocument = vi.fn()
