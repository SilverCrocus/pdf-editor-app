import { useEffect, useRef, useState } from 'react'
import { renderPage, getPageDimensions } from '../services/pdfRenderer'
import './PageThumbnail.css'

interface PageThumbnailProps {
  documentId: string
  pageIndex: number
  pageNumber: number
  selected: boolean
  onClick?: () => void
  thumbnailWidth: number
}

export default function PageThumbnail({
  documentId,
  pageIndex,
  pageNumber,
  selected,
  onClick,
  thumbnailWidth
}: PageThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)

  // Get base page dimensions first
  useEffect(() => {
    let cancelled = false

    getPageDimensions(documentId, pageIndex)
      .then((dims) => {
        if (!cancelled) {
          setDimensions(dims)
        }
      })
      .catch(console.error)

    return () => {
      cancelled = true
    }
  }, [documentId, pageIndex])

  // Render thumbnail at appropriate scale when dimensions or thumbnailWidth changes
  useEffect(() => {
    if (!canvasRef.current || !dimensions) return

    let cancelled = false

    // Calculate scale to fit width while maintaining aspect ratio
    const scale = thumbnailWidth / dimensions.width

    renderPage(documentId, pageIndex, scale)
      .then(({ canvas: renderedCanvas, width, height }) => {
        if (cancelled || !canvasRef.current) return

        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          canvasRef.current.width = width
          canvasRef.current.height = height
          ctx.drawImage(renderedCanvas, 0, 0)
        }
      })
      .catch(console.error)

    return () => {
      cancelled = true
    }
  }, [documentId, pageIndex, dimensions, thumbnailWidth])

  return (
    <div
      className={`page-thumbnail ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="thumbnail-canvas">
        <canvas ref={canvasRef} />
      </div>
      <span className="page-number">{pageNumber}</span>
    </div>
  )
}
