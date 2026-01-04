import { useEffect, useState, useCallback } from 'react'
import { getTextContent } from '../services/pdfRenderer'
import {
  groupTextIntoLines,
  findWordAtPoint,
  getSelectedWords,
  findMergeCandidate,
  getMergedBounds,
  type TextLine,
  type TextSelection,
  type TextBox
} from '../services/textUtils'
import type { AnnotationTool, HighlightColor, Annotation } from '../types/annotations'
import { HIGHLIGHT_COLORS_TRANSPARENT } from '../types/annotations'
import './TextLayer.css'

interface TextLayerProps {
  documentId: string
  pageId: string
  pageIndex: number
  width: number
  height: number
  scale: number
  currentTool: AnnotationTool
  highlightColor: HighlightColor
  lineColor: string
  annotations: Annotation[]
  onAddAnnotation: (annotation: Annotation) => void
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void
  onSelectAnnotation: (id: string | null) => void
  debug?: boolean
}

export default function TextLayer({
  documentId,
  pageId,
  pageIndex,
  width,
  height,
  scale,
  currentTool,
  highlightColor,
  lineColor,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onSelectAnnotation,
  debug = false
}: TextLayerProps) {
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([])
  const [lines, setLines] = useState<TextLine[]>([])
  const [selection, setSelection] = useState<TextSelection | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Is this a text-selection tool?
  const isTextTool = currentTool === 'highlight' || currentTool === 'underline' || currentTool === 'strikethrough'

  useEffect(() => {
    if (!documentId) return

    let cancelled = false

    getTextContent(documentId, pageIndex, scale)
      .then(({ textContent, viewport }) => {
        if (cancelled) return

        const boxes: TextBox[] = []

        for (const item of textContent.items) {
          if (!('str' in item) || !item.str.trim()) continue

          const transform = item.transform
          const x = transform[4]
          const y = viewport.height - transform[5]
          const itemWidth = item.width
          const itemHeight = Math.abs(transform[3])

          boxes.push({
            x,
            y: y - itemHeight,
            width: itemWidth,
            height: itemHeight,
            text: item.str
          })
        }

        setTextBoxes(boxes)
        setLines(groupTextIntoLines(boxes))
      })
      .catch((err) => {
        if (!cancelled) console.error('TextLayer error:', err)
      })

    return () => {
      cancelled = true
    }
  }, [documentId, pageIndex, scale])

  // Clear selection when tool changes
  useEffect(() => {
    setSelection(null)
    setIsDragging(false)
  }, [currentTool])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isTextTool) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const hit = findWordAtPoint(lines, x, y)
    if (!hit) return

    e.preventDefault()
    e.stopPropagation()

    setSelection({
      startLine: hit.lineIndex,
      startWord: hit.wordIndex,
      endLine: hit.lineIndex,
      endWord: hit.wordIndex
    })
    setIsDragging(true)
  }, [isTextTool, lines])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selection) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const hit = findWordAtPoint(lines, x, y)
    if (hit) {
      setSelection(prev => prev ? {
        ...prev,
        endLine: hit.lineIndex,
        endWord: hit.wordIndex
      } : null)
    }
  }, [isDragging, selection, lines])

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !selection) {
      setIsDragging(false)
      return
    }

    setIsDragging(false)

    const tool = currentTool as 'highlight' | 'underline' | 'strikethrough'
    const color = currentTool === 'highlight' ? highlightColor : lineColor

    // Check if this is a click (same start and end position)
    const isClick = selection.startLine === selection.endLine &&
                    selection.startWord === selection.endWord

    if (isClick) {
      // Check if clicking on existing annotation of same type
      const clickedBox = lines[selection.startLine]?.boxes[selection.startWord]
      if (clickedBox) {
        const clickX = (clickedBox.x + clickedBox.width / 2) / width
        const clickY = (clickedBox.y + clickedBox.height / 2) / height

        // Find annotation at this position
        for (const ann of annotations) {
          if (ann.pageId !== pageId || ann.type !== tool) continue
          if ('color' in ann && ann.color !== color) continue

          // Check if click is within annotation bounds
          if (clickX >= ann.x && clickX <= ann.x + ann.width &&
              clickY >= ann.y && clickY <= ann.y + ann.height) {
            onSelectAnnotation(ann.id)
            setSelection(null)
            return
          }
        }
      }

      // No existing annotation found, don't create for single click
      setSelection(null)
      return
    }

    // Get selected words for drag selection
    const selectedWords = getSelectedWords(lines, selection)
    if (selectedWords.length === 0) {
      setSelection(null)
      return
    }

    // Create or merge annotations (one per line)
    for (const lineSelection of selectedWords) {
      const newBounds = {
        x: lineSelection.minX / width,
        y: lineSelection.y / height,
        width: (lineSelection.maxX - lineSelection.minX) / width,
        height: lineSelection.height / height
      }

      // Check for merge candidate
      const mergeCandidate = findMergeCandidate(annotations, pageId, tool, color, newBounds)

      if (mergeCandidate) {
        // Merge: update existing annotation with expanded bounds
        const merged = getMergedBounds(mergeCandidate, newBounds)
        onUpdateAnnotation(mergeCandidate.id, merged)
      } else {
        // Create new annotation
        const annotation = createAnnotationFromSelection(
          pageId,
          lineSelection,
          width,
          height,
          tool,
          color
        )
        onAddAnnotation(annotation)
      }
    }

    setSelection(null)
  }, [isDragging, selection, lines, pageId, width, height, currentTool, highlightColor, lineColor, onAddAnnotation, onUpdateAnnotation, onSelectAnnotation, annotations])

  // Get preview boxes for current selection
  const previewBoxes = selection ? getSelectedWords(lines, selection) : []

  return (
    <div
      className={`text-layer ${debug ? 'debug' : ''} ${isTextTool ? 'text-tool-active' : ''}`}
      style={{ width, height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Debug boxes */}
      {debug && textBoxes.map((box, i) => (
        <div
          key={i}
          className="text-box"
          style={{
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height
          }}
          data-text={box.text}
        />
      ))}

      {/* Selection preview */}
      {previewBoxes.map((lineSelection, i) => (
        <div
          key={`preview-${i}`}
          className={`selection-preview ${currentTool}`}
          style={{
            left: lineSelection.minX,
            top: lineSelection.y,
            width: lineSelection.maxX - lineSelection.minX,
            height: lineSelection.height,
            backgroundColor: currentTool === 'highlight'
              ? HIGHLIGHT_COLORS_TRANSPARENT[highlightColor]
              : undefined,
            borderBottom: currentTool === 'underline'
              ? `2px solid ${lineColor}`
              : undefined,
            ...(currentTool === 'strikethrough' ? {
              backgroundImage: `linear-gradient(${lineColor}, ${lineColor})`,
              backgroundSize: '100% 2px',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            } : {})
          }}
        />
      ))}
    </div>
  )
}

function createAnnotationFromSelection(
  pageId: string,
  lineSelection: { minX: number; maxX: number; y: number; height: number },
  canvasWidth: number,
  canvasHeight: number,
  tool: 'highlight' | 'underline' | 'strikethrough',
  color: string | HighlightColor
): Annotation {
  const x = lineSelection.minX / canvasWidth
  const y = lineSelection.y / canvasHeight
  const w = (lineSelection.maxX - lineSelection.minX) / canvasWidth
  const h = lineSelection.height / canvasHeight

  const base = {
    id: crypto.randomUUID(),
    pageId,
    x,
    y,
    width: w,
    height: h
  }

  if (tool === 'highlight') {
    return { ...base, type: 'highlight', color: color as HighlightColor }
  } else if (tool === 'underline') {
    return { ...base, type: 'underline', color: color as string }
  } else {
    return { ...base, type: 'strikethrough', color: color as string }
  }
}
