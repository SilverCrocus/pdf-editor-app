# Text Selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable text-aware selection for highlight, underline, and strikethrough tools with word-snapping and multi-line support.

**Architecture:** TextLayer handles text detection, line grouping, and selection state. On selection complete, it calls back to create annotations via existing onAddAnnotation flow. Preview rendering happens within TextLayer during drag.

**Tech Stack:** React, TypeScript, PDF.js text content API, Vitest for testing.

---

## Task 1: Create Text Utilities with Line Detection

**Files:**
- Create: `src/renderer/services/textUtils.ts`
- Create: `src/renderer/services/textUtils.test.ts`

**Step 1: Write failing tests for text line grouping**

```typescript
// src/renderer/services/textUtils.test.ts
import { describe, it, expect } from 'vitest'
import { groupTextIntoLines, type TextBox, type TextLine } from './textUtils'

describe('textUtils', () => {
  describe('groupTextIntoLines', () => {
    it('groups words on same Y position into one line', () => {
      const boxes: TextBox[] = [
        { x: 10, y: 100, width: 30, height: 12, text: 'Hello' },
        { x: 50, y: 100, width: 40, height: 12, text: 'World' }
      ]

      const lines = groupTextIntoLines(boxes)

      expect(lines).toHaveLength(1)
      expect(lines[0].boxes).toHaveLength(2)
      expect(lines[0].boxes[0].text).toBe('Hello')
      expect(lines[0].boxes[1].text).toBe('World')
    })

    it('separates words on different Y positions into different lines', () => {
      const boxes: TextBox[] = [
        { x: 10, y: 100, width: 30, height: 12, text: 'Line1' },
        { x: 10, y: 120, width: 30, height: 12, text: 'Line2' }
      ]

      const lines = groupTextIntoLines(boxes)

      expect(lines).toHaveLength(2)
      expect(lines[0].boxes[0].text).toBe('Line1')
      expect(lines[1].boxes[0].text).toBe('Line2')
    })

    it('detects column gaps and splits into separate lines', () => {
      // Two columns: "Left" at x=10, "Right" at x=300 (large gap)
      const boxes: TextBox[] = [
        { x: 10, y: 100, width: 30, height: 12, text: 'Left' },
        { x: 300, y: 100, width: 40, height: 12, text: 'Right' }
      ]

      const lines = groupTextIntoLines(boxes)

      expect(lines).toHaveLength(2)
      expect(lines[0].boxes[0].text).toBe('Left')
      expect(lines[1].boxes[0].text).toBe('Right')
    })

    it('sorts lines by Y then X', () => {
      const boxes: TextBox[] = [
        { x: 300, y: 100, width: 40, height: 12, text: 'RightCol' },
        { x: 10, y: 100, width: 30, height: 12, text: 'LeftCol' },
        { x: 10, y: 120, width: 30, height: 12, text: 'SecondRow' }
      ]

      const lines = groupTextIntoLines(boxes)

      expect(lines).toHaveLength(3)
      expect(lines[0].boxes[0].text).toBe('LeftCol')
      expect(lines[1].boxes[0].text).toBe('RightCol')
      expect(lines[2].boxes[0].text).toBe('SecondRow')
    })

    it('calculates line bounds correctly', () => {
      const boxes: TextBox[] = [
        { x: 10, y: 100, width: 30, height: 12, text: 'Hello' },
        { x: 50, y: 100, width: 40, height: 12, text: 'World' }
      ]

      const lines = groupTextIntoLines(boxes)

      expect(lines[0].minX).toBe(10)
      expect(lines[0].maxX).toBe(90) // 50 + 40
      expect(lines[0].y).toBe(100)
      expect(lines[0].height).toBe(12)
    })

    it('returns empty array for empty input', () => {
      const lines = groupTextIntoLines([])
      expect(lines).toHaveLength(0)
    })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/renderer/services/textUtils.test.ts`
Expected: FAIL - module not found

**Step 3: Implement textUtils**

```typescript
// src/renderer/services/textUtils.ts
export interface TextBox {
  x: number
  y: number
  width: number
  height: number
  text: string
}

export interface TextLine {
  boxes: TextBox[]
  minX: number
  maxX: number
  y: number
  height: number
}

/**
 * Group text boxes into logical lines, handling multi-column layouts.
 * Uses gap detection to identify column boundaries.
 */
export function groupTextIntoLines(boxes: TextBox[]): TextLine[] {
  if (boxes.length === 0) return []

  // Calculate average height for Y tolerance
  const avgHeight = boxes.reduce((sum, b) => sum + b.height, 0) / boxes.length
  const yTolerance = avgHeight * 0.5

  // Group by Y position (within tolerance)
  const yBands = new Map<number, TextBox[]>()

  for (const box of boxes) {
    let foundBand = false
    for (const [bandY, bandBoxes] of yBands) {
      if (Math.abs(box.y - bandY) <= yTolerance) {
        bandBoxes.push(box)
        foundBand = true
        break
      }
    }
    if (!foundBand) {
      yBands.set(box.y, [box])
    }
  }

  const lines: TextLine[] = []

  // Process each Y band
  for (const [, bandBoxes] of yBands) {
    // Sort by X position
    bandBoxes.sort((a, b) => a.x - b.x)

    // Calculate average word spacing in this band
    let totalGap = 0
    let gapCount = 0
    for (let i = 1; i < bandBoxes.length; i++) {
      const gap = bandBoxes[i].x - (bandBoxes[i - 1].x + bandBoxes[i - 1].width)
      if (gap > 0) {
        totalGap += gap
        gapCount++
      }
    }
    const avgGap = gapCount > 0 ? totalGap / gapCount : 0
    const columnGapThreshold = avgGap * 3

    // Split into lines based on column gaps
    let currentLineBoxes: TextBox[] = [bandBoxes[0]]

    for (let i = 1; i < bandBoxes.length; i++) {
      const gap = bandBoxes[i].x - (bandBoxes[i - 1].x + bandBoxes[i - 1].width)

      if (columnGapThreshold > 0 && gap > columnGapThreshold) {
        // Column break - finish current line and start new one
        lines.push(createLine(currentLineBoxes))
        currentLineBoxes = [bandBoxes[i]]
      } else {
        currentLineBoxes.push(bandBoxes[i])
      }
    }

    // Don't forget the last line
    if (currentLineBoxes.length > 0) {
      lines.push(createLine(currentLineBoxes))
    }
  }

  // Sort lines by Y, then by X (for same-row columns)
  lines.sort((a, b) => {
    const yDiff = a.y - b.y
    if (Math.abs(yDiff) > avgHeight * 0.5) return yDiff
    return a.minX - b.minX
  })

  return lines
}

function createLine(boxes: TextBox[]): TextLine {
  const minX = Math.min(...boxes.map(b => b.x))
  const maxX = Math.max(...boxes.map(b => b.x + b.width))
  const y = boxes[0].y
  const height = Math.max(...boxes.map(b => b.height))

  return { boxes, minX, maxX, y, height }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/renderer/services/textUtils.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add src/renderer/services/textUtils.ts src/renderer/services/textUtils.test.ts
git commit -m "feat: add text line detection utility with column gap detection"
```

---

## Task 2: Add Selection Utilities

**Files:**
- Modify: `src/renderer/services/textUtils.ts`
- Modify: `src/renderer/services/textUtils.test.ts`

**Step 1: Write failing tests for selection utilities**

Add to `src/renderer/services/textUtils.test.ts`:

```typescript
import {
  groupTextIntoLines,
  getSelectedWords,
  type TextBox,
  type TextLine,
  type TextSelection
} from './textUtils'

// ... existing tests ...

describe('getSelectedWords', () => {
  const lines: TextLine[] = [
    {
      boxes: [
        { x: 10, y: 100, width: 30, height: 12, text: 'Hello' },
        { x: 50, y: 100, width: 40, height: 12, text: 'World' }
      ],
      minX: 10, maxX: 90, y: 100, height: 12
    },
    {
      boxes: [
        { x: 10, y: 120, width: 40, height: 12, text: 'Second' },
        { x: 60, y: 120, width: 30, height: 12, text: 'Line' }
      ],
      minX: 10, maxX: 90, y: 120, height: 12
    },
    {
      boxes: [
        { x: 10, y: 140, width: 40, height: 12, text: 'Third' },
        { x: 60, y: 140, width: 30, height: 12, text: 'Row' }
      ],
      minX: 10, maxX: 90, y: 140, height: 12
    }
  ]

  it('returns single word for same start/end', () => {
    const selection: TextSelection = {
      startLine: 0, startWord: 0,
      endLine: 0, endWord: 0
    }

    const result = getSelectedWords(lines, selection)

    expect(result).toHaveLength(1)
    expect(result[0].boxes).toHaveLength(1)
    expect(result[0].boxes[0].text).toBe('Hello')
  })

  it('returns word range on same line', () => {
    const selection: TextSelection = {
      startLine: 0, startWord: 0,
      endLine: 0, endWord: 1
    }

    const result = getSelectedWords(lines, selection)

    expect(result).toHaveLength(1)
    expect(result[0].boxes).toHaveLength(2)
    expect(result[0].boxes[0].text).toBe('Hello')
    expect(result[0].boxes[1].text).toBe('World')
  })

  it('handles multi-line selection (forward)', () => {
    const selection: TextSelection = {
      startLine: 0, startWord: 1,  // "World"
      endLine: 2, endWord: 0       // "Third"
    }

    const result = getSelectedWords(lines, selection)

    // Line 0: World (to end)
    // Line 1: Second, Line (full line)
    // Line 2: Third (from start)
    expect(result).toHaveLength(3)
    expect(result[0].boxes.map(b => b.text)).toEqual(['World'])
    expect(result[1].boxes.map(b => b.text)).toEqual(['Second', 'Line'])
    expect(result[2].boxes.map(b => b.text)).toEqual(['Third'])
  })

  it('handles reversed selection (backward drag)', () => {
    const selection: TextSelection = {
      startLine: 2, startWord: 0,  // "Third"
      endLine: 0, endWord: 1       // "World"
    }

    const result = getSelectedWords(lines, selection)

    // Same result as forward, just normalized
    expect(result).toHaveLength(3)
    expect(result[0].boxes.map(b => b.text)).toEqual(['World'])
    expect(result[1].boxes.map(b => b.text)).toEqual(['Second', 'Line'])
    expect(result[2].boxes.map(b => b.text)).toEqual(['Third'])
  })

  it('handles reversed word selection on same line', () => {
    const selection: TextSelection = {
      startLine: 0, startWord: 1,
      endLine: 0, endWord: 0
    }

    const result = getSelectedWords(lines, selection)

    expect(result).toHaveLength(1)
    expect(result[0].boxes).toHaveLength(2)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/renderer/services/textUtils.test.ts`
Expected: FAIL - getSelectedWords not exported

**Step 3: Add selection types and getSelectedWords**

Add to `src/renderer/services/textUtils.ts`:

```typescript
export interface TextSelection {
  startLine: number
  startWord: number
  endLine: number
  endWord: number
}

export interface SelectedLineWords {
  lineIndex: number
  boxes: TextBox[]
  minX: number
  maxX: number
  y: number
  height: number
}

/**
 * Get selected words from a text selection, handling multi-line and reversed selections.
 * Returns one entry per line with the selected words on that line.
 */
export function getSelectedWords(
  lines: TextLine[],
  selection: TextSelection
): SelectedLineWords[] {
  // Normalize selection (ensure start is before end)
  let { startLine, startWord, endLine, endWord } = selection

  if (startLine > endLine || (startLine === endLine && startWord > endWord)) {
    // Swap start and end
    ;[startLine, endLine] = [endLine, startLine]
    ;[startWord, endWord] = [endWord, startWord]
  }

  const result: SelectedLineWords[] = []

  for (let lineIdx = startLine; lineIdx <= endLine; lineIdx++) {
    const line = lines[lineIdx]
    if (!line) continue

    let fromWord: number
    let toWord: number

    if (lineIdx === startLine && lineIdx === endLine) {
      // Single line selection
      fromWord = startWord
      toWord = endWord
    } else if (lineIdx === startLine) {
      // First line: from startWord to end of line
      fromWord = startWord
      toWord = line.boxes.length - 1
    } else if (lineIdx === endLine) {
      // Last line: from start to endWord
      fromWord = 0
      toWord = endWord
    } else {
      // Middle line: all words
      fromWord = 0
      toWord = line.boxes.length - 1
    }

    const selectedBoxes = line.boxes.slice(fromWord, toWord + 1)
    if (selectedBoxes.length === 0) continue

    const minX = Math.min(...selectedBoxes.map(b => b.x))
    const maxX = Math.max(...selectedBoxes.map(b => b.x + b.width))

    result.push({
      lineIndex: lineIdx,
      boxes: selectedBoxes,
      minX,
      maxX,
      y: line.y,
      height: line.height
    })
  }

  return result
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/renderer/services/textUtils.test.ts`
Expected: PASS (11 tests)

**Step 5: Commit**

```bash
git add src/renderer/services/textUtils.ts src/renderer/services/textUtils.test.ts
git commit -m "feat: add getSelectedWords utility for multi-line text selection"
```

---

## Task 3: Add Hit Testing Utility

**Files:**
- Modify: `src/renderer/services/textUtils.ts`
- Modify: `src/renderer/services/textUtils.test.ts`

**Step 1: Write failing tests for hit testing**

Add to `src/renderer/services/textUtils.test.ts`:

```typescript
import {
  groupTextIntoLines,
  getSelectedWords,
  findWordAtPoint,
  type TextBox,
  type TextLine,
  type TextSelection
} from './textUtils'

// ... existing tests ...

describe('findWordAtPoint', () => {
  const lines: TextLine[] = [
    {
      boxes: [
        { x: 10, y: 100, width: 30, height: 12, text: 'Hello' },
        { x: 50, y: 100, width: 40, height: 12, text: 'World' }
      ],
      minX: 10, maxX: 90, y: 100, height: 12
    },
    {
      boxes: [
        { x: 10, y: 120, width: 40, height: 12, text: 'Second' }
      ],
      minX: 10, maxX: 50, y: 120, height: 12
    }
  ]

  it('finds word when point is inside box', () => {
    const result = findWordAtPoint(lines, 25, 106) // Inside "Hello"

    expect(result).not.toBeNull()
    expect(result!.lineIndex).toBe(0)
    expect(result!.wordIndex).toBe(0)
  })

  it('finds correct word in line', () => {
    const result = findWordAtPoint(lines, 70, 106) // Inside "World"

    expect(result).not.toBeNull()
    expect(result!.lineIndex).toBe(0)
    expect(result!.wordIndex).toBe(1)
  })

  it('finds word on second line', () => {
    const result = findWordAtPoint(lines, 25, 126) // Inside "Second"

    expect(result).not.toBeNull()
    expect(result!.lineIndex).toBe(1)
    expect(result!.wordIndex).toBe(0)
  })

  it('returns null when point is not on any word', () => {
    const result = findWordAtPoint(lines, 200, 200) // Empty space

    expect(result).toBeNull()
  })

  it('returns null for point between words', () => {
    const result = findWordAtPoint(lines, 45, 106) // Gap between Hello and World

    expect(result).toBeNull()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/renderer/services/textUtils.test.ts`
Expected: FAIL - findWordAtPoint not exported

**Step 3: Implement findWordAtPoint**

Add to `src/renderer/services/textUtils.ts`:

```typescript
export interface WordLocation {
  lineIndex: number
  wordIndex: number
}

/**
 * Find which word (if any) is at the given point.
 * Returns null if the point is not on any word.
 */
export function findWordAtPoint(
  lines: TextLine[],
  x: number,
  y: number
): WordLocation | null {
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]

    // Check if Y is within line bounds
    if (y < line.y || y > line.y + line.height) continue

    // Check each word in the line
    for (let wordIdx = 0; wordIdx < line.boxes.length; wordIdx++) {
      const box = line.boxes[wordIdx]

      if (x >= box.x && x <= box.x + box.width) {
        return { lineIndex: lineIdx, wordIndex: wordIdx }
      }
    }
  }

  return null
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/renderer/services/textUtils.test.ts`
Expected: PASS (16 tests)

**Step 5: Commit**

```bash
git add src/renderer/services/textUtils.ts src/renderer/services/textUtils.test.ts
git commit -m "feat: add findWordAtPoint hit testing utility"
```

---

## Task 4: Update TextLayer Props Interface

**Files:**
- Modify: `src/renderer/components/TextLayer.tsx`

**Step 1: Update TextLayer props to accept tool and callbacks**

Update the interface in `src/renderer/components/TextLayer.tsx`:

```typescript
import { useEffect, useRef, useState, useCallback } from 'react'
import { getTextContent } from '../services/pdfRenderer'
import {
  groupTextIntoLines,
  findWordAtPoint,
  getSelectedWords,
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
  // Tool props
  currentTool: AnnotationTool
  highlightColor: HighlightColor
  lineColor: string
  // Callbacks
  onAddAnnotation: (annotation: Annotation) => void
  // Existing annotations for merge detection
  annotations: Annotation[]
  debug?: boolean
}
```

**Step 2: Verify build still works**

Run: `npm run build`
Expected: Build may fail due to missing props - that's expected, we'll fix in Task 5

**Step 3: Commit interface changes**

```bash
git add src/renderer/components/TextLayer.tsx
git commit -m "refactor: update TextLayer props for text selection support"
```

---

## Task 5: Update MainViewer to Pass New Props

**Files:**
- Modify: `src/renderer/components/MainViewer.tsx`

**Step 1: Update TextLayer usage in MainViewer**

In `src/renderer/components/MainViewer.tsx`, update the TextLayer component:

```typescript
{hasContent && documentId && pageId && canvasDimensions.width > 0 && (
  <TextLayer
    documentId={documentId}
    pageId={pageId}
    pageIndex={pageIndex}
    width={canvasDimensions.width}
    height={canvasDimensions.height}
    scale={zoom}
    currentTool={currentTool}
    highlightColor={highlightColor}
    lineColor={lineColor}
    onAddAnnotation={onAddAnnotation}
    annotations={annotations}
    debug={false}
  />
)}
```

**Step 2: Verify build works**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/renderer/components/MainViewer.tsx
git commit -m "feat: pass annotation props to TextLayer"
```

---

## Task 6: Implement Selection State in TextLayer

**Files:**
- Modify: `src/renderer/components/TextLayer.tsx`

**Step 1: Add line detection and selection state**

Replace the TextLayer component body with:

```typescript
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
  onAddAnnotation,
  annotations,
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

    // Get selected words
    const selectedWords = getSelectedWords(lines, selection)
    if (selectedWords.length === 0) {
      setSelection(null)
      return
    }

    // Create annotations (one per line)
    for (const lineSelection of selectedWords) {
      const annotation: Annotation = createAnnotationFromSelection(
        pageId,
        lineSelection,
        width,
        height,
        currentTool as 'highlight' | 'underline' | 'strikethrough',
        currentTool === 'highlight' ? highlightColor : lineColor
      )
      onAddAnnotation(annotation)
    }

    setSelection(null)
  }, [isDragging, selection, lines, pageId, width, height, currentTool, highlightColor, lineColor, onAddAnnotation])

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
            // Strikethrough: line through middle
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
```

**Step 2: Verify build works**

Run: `npm run build`
Expected: PASS

**Step 3: Run existing tests**

Run: `npm test`
Expected: PASS (some MainViewer tests may need updating)

**Step 4: Commit**

```bash
git add src/renderer/components/TextLayer.tsx
git commit -m "feat: implement text selection state and preview in TextLayer"
```

---

## Task 7: Update TextLayer CSS

**Files:**
- Modify: `src/renderer/components/TextLayer.css`

**Step 1: Add styles for text selection**

Replace `src/renderer/components/TextLayer.css`:

```css
/* Text layer - overlay on canvas for text selection */
.text-layer {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  pointer-events: none;
}

/* Enable pointer events when text tool is active */
.text-layer.text-tool-active {
  pointer-events: auto;
  cursor: text;
}

/* Individual text boxes - invisible by default */
.text-box {
  position: absolute;
}

/* Debug mode - show yellow semi-transparent boxes */
.text-layer.debug .text-box {
  background: rgba(255, 255, 0, 0.3);
  border: 1px solid rgba(255, 200, 0, 0.5);
}

/* Selection preview - shown while dragging */
.selection-preview {
  position: absolute;
  pointer-events: none;
}

.selection-preview.highlight {
  /* Background color set inline */
}

.selection-preview.underline {
  /* Border-bottom set inline */
}

.selection-preview.strikethrough {
  /* Background gradient set inline for line through middle */
}
```

**Step 2: Verify build works**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/renderer/components/TextLayer.css
git commit -m "style: add CSS for text selection preview"
```

---

## Task 8: Fix MainViewer Tests

**Files:**
- Modify: `src/renderer/components/MainViewer.test.tsx`

**Step 1: Update test mocks for new TextLayer props**

Check and update `src/renderer/components/MainViewer.test.tsx` to mock TextLayer properly or update props passed. The exact changes depend on current test structure - read the file and ensure TextLayer receives required props in test setup.

**Step 2: Run tests**

Run: `npm test`
Expected: PASS

**Step 3: Commit if changes needed**

```bash
git add src/renderer/components/MainViewer.test.tsx
git commit -m "test: update MainViewer tests for TextLayer props"
```

---

## Task 9: Implement Annotation Merging

**Files:**
- Modify: `src/renderer/services/textUtils.ts`
- Modify: `src/renderer/services/textUtils.test.ts`

**Step 1: Write failing tests for merge detection**

Add to `src/renderer/services/textUtils.test.ts`:

```typescript
import {
  groupTextIntoLines,
  getSelectedWords,
  findWordAtPoint,
  findMergeCandidate,
  type TextBox,
  type TextLine,
  type TextSelection
} from './textUtils'
import type { Annotation, HighlightAnnotation } from '../types/annotations'

// ... existing tests ...

describe('findMergeCandidate', () => {
  it('finds overlapping annotation of same type and color', () => {
    const existing: Annotation[] = [
      {
        id: 'h1',
        pageId: 'page-1',
        type: 'highlight',
        x: 0.1,
        y: 0.2,
        width: 0.2,
        height: 0.02,
        color: 'yellow'
      }
    ]

    const newBounds = { x: 0.25, y: 0.2, width: 0.15, height: 0.02 }
    const result = findMergeCandidate(existing, 'page-1', 'highlight', 'yellow', newBounds)

    expect(result).not.toBeNull()
    expect(result!.id).toBe('h1')
  })

  it('returns null for different type', () => {
    const existing: Annotation[] = [
      {
        id: 'u1',
        pageId: 'page-1',
        type: 'underline',
        x: 0.1,
        y: 0.2,
        width: 0.2,
        height: 0.02,
        color: '#000000'
      }
    ]

    const newBounds = { x: 0.25, y: 0.2, width: 0.15, height: 0.02 }
    const result = findMergeCandidate(existing, 'page-1', 'highlight', 'yellow', newBounds)

    expect(result).toBeNull()
  })

  it('returns null for different color', () => {
    const existing: Annotation[] = [
      {
        id: 'h1',
        pageId: 'page-1',
        type: 'highlight',
        x: 0.1,
        y: 0.2,
        width: 0.2,
        height: 0.02,
        color: 'green'
      }
    ]

    const newBounds = { x: 0.25, y: 0.2, width: 0.15, height: 0.02 }
    const result = findMergeCandidate(existing, 'page-1', 'highlight', 'yellow', newBounds)

    expect(result).toBeNull()
  })

  it('returns null for non-overlapping annotations', () => {
    const existing: Annotation[] = [
      {
        id: 'h1',
        pageId: 'page-1',
        type: 'highlight',
        x: 0.1,
        y: 0.2,
        width: 0.1,
        height: 0.02,
        color: 'yellow'
      }
    ]

    const newBounds = { x: 0.5, y: 0.2, width: 0.1, height: 0.02 } // Far away
    const result = findMergeCandidate(existing, 'page-1', 'highlight', 'yellow', newBounds)

    expect(result).toBeNull()
  })

  it('detects adjacent annotations (within tolerance)', () => {
    const existing: Annotation[] = [
      {
        id: 'h1',
        pageId: 'page-1',
        type: 'highlight',
        x: 0.1,
        y: 0.2,
        width: 0.1,
        height: 0.02,
        color: 'yellow'
      }
    ]

    // Adjacent (ends at 0.2, new starts at 0.205 - within 1% tolerance)
    const newBounds = { x: 0.205, y: 0.2, width: 0.1, height: 0.02 }
    const result = findMergeCandidate(existing, 'page-1', 'highlight', 'yellow', newBounds)

    expect(result).not.toBeNull()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/renderer/services/textUtils.test.ts`
Expected: FAIL - findMergeCandidate not exported

**Step 3: Implement findMergeCandidate**

Add to `src/renderer/services/textUtils.ts`:

```typescript
import type { Annotation } from '../types/annotations'

// ... existing code ...

interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

const ADJACENCY_TOLERANCE = 0.01 // 1% of page width

/**
 * Find an existing annotation that can be merged with a new one.
 * Returns the annotation if found, null otherwise.
 */
export function findMergeCandidate(
  annotations: Annotation[],
  pageId: string,
  type: 'highlight' | 'underline' | 'strikethrough',
  color: string,
  newBounds: Bounds
): Annotation | null {
  for (const ann of annotations) {
    // Must match page, type, and color
    if (ann.pageId !== pageId) continue
    if (ann.type !== type) continue
    if (!('color' in ann) || ann.color !== color) continue

    // Check if on same line (Y overlap)
    const yOverlap = !(
      newBounds.y + newBounds.height < ann.y ||
      ann.y + ann.height < newBounds.y
    )
    if (!yOverlap) continue

    // Check if overlapping or adjacent on X axis
    const newRight = newBounds.x + newBounds.width
    const annRight = ann.x + ann.width

    const overlapsOrAdjacent =
      // Overlapping
      (newBounds.x < annRight && newRight > ann.x) ||
      // Adjacent (within tolerance)
      Math.abs(newBounds.x - annRight) < ADJACENCY_TOLERANCE ||
      Math.abs(ann.x - newRight) < ADJACENCY_TOLERANCE

    if (overlapsOrAdjacent) {
      return ann
    }
  }

  return null
}

/**
 * Calculate merged bounds from existing annotation and new bounds.
 */
export function getMergedBounds(
  existing: Bounds,
  newBounds: Bounds
): Bounds {
  const minX = Math.min(existing.x, newBounds.x)
  const maxX = Math.max(existing.x + existing.width, newBounds.x + newBounds.width)
  const minY = Math.min(existing.y, newBounds.y)
  const maxY = Math.max(existing.y + existing.height, newBounds.y + newBounds.height)

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/renderer/services/textUtils.test.ts`
Expected: PASS (21 tests)

**Step 5: Commit**

```bash
git add src/renderer/services/textUtils.ts src/renderer/services/textUtils.test.ts
git commit -m "feat: add merge candidate detection for overlapping annotations"
```

---

## Task 10: Integrate Merging into TextLayer

**Files:**
- Modify: `src/renderer/components/TextLayer.tsx`

**Step 1: Update handleMouseUp to merge annotations**

Update the imports and handleMouseUp in `src/renderer/components/TextLayer.tsx`:

```typescript
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
```

Update handleMouseUp:

```typescript
const handleMouseUp = useCallback(() => {
  if (!isDragging || !selection) {
    setIsDragging(false)
    return
  }

  setIsDragging(false)

  const selectedWords = getSelectedWords(lines, selection)
  if (selectedWords.length === 0) {
    setSelection(null)
    return
  }

  const tool = currentTool as 'highlight' | 'underline' | 'strikethrough'
  const color = currentTool === 'highlight' ? highlightColor : lineColor

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
}, [isDragging, selection, lines, pageId, width, height, currentTool, highlightColor, lineColor, onAddAnnotation, onUpdateAnnotation, annotations])
```

**Step 2: Add onUpdateAnnotation prop**

Update the TextLayerProps interface:

```typescript
interface TextLayerProps {
  // ... existing props ...
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void
}
```

**Step 3: Update MainViewer to pass onUpdateAnnotation**

In MainViewer.tsx, add the prop:

```typescript
<TextLayer
  // ... existing props ...
  onUpdateAnnotation={onUpdateAnnotation}
/>
```

**Step 4: Verify build and tests**

Run: `npm run build && npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/renderer/components/TextLayer.tsx src/renderer/components/MainViewer.tsx
git commit -m "feat: integrate annotation merging into text selection"
```

---

## Task 11: Implement Click to Select Existing Annotation

**Files:**
- Modify: `src/renderer/components/TextLayer.tsx`

**Step 1: Update handleMouseUp for click-to-select**

Add logic to detect click (no drag) on existing annotation:

```typescript
const handleMouseUp = useCallback(() => {
  if (!isDragging || !selection) {
    setIsDragging(false)
    return
  }

  setIsDragging(false)

  // Check if this is a click (same start and end position)
  const isClick = selection.startLine === selection.endLine &&
                  selection.startWord === selection.endWord

  if (isClick) {
    // Check if clicking on existing annotation of same type
    const clickedBox = lines[selection.startLine]?.boxes[selection.startWord]
    if (clickedBox) {
      const clickX = clickedBox.x / width
      const clickY = clickedBox.y / height

      // Find annotation at this position
      const tool = currentTool as 'highlight' | 'underline' | 'strikethrough'
      const color = currentTool === 'highlight' ? highlightColor : lineColor

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

  // ... rest of existing handleMouseUp code for drag selection ...
}, [/* ... dependencies ... */, onSelectAnnotation])
```

**Step 2: Add onSelectAnnotation prop**

Update props interface and MainViewer:

```typescript
interface TextLayerProps {
  // ... existing props ...
  onSelectAnnotation: (id: string | null) => void
}
```

In MainViewer:
```typescript
<TextLayer
  // ... existing props ...
  onSelectAnnotation={onSelectAnnotation}
/>
```

**Step 3: Verify build and tests**

Run: `npm run build && npm test`
Expected: PASS

**Step 4: Commit**

```bash
git add src/renderer/components/TextLayer.tsx src/renderer/components/MainViewer.tsx
git commit -m "feat: click on existing text annotation to select it"
```

---

## Task 12: Final Testing and Cleanup

**Files:**
- All modified files

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 2: Run build**

Run: `npm run build`
Expected: PASS

**Step 3: Manual testing checklist**

- [ ] Open a PDF with text
- [ ] Select highlight tool, drag across words → creates highlight
- [ ] Select underline tool, drag across words → creates underline
- [ ] Select strikethrough tool, drag across words → creates strikethrough
- [ ] Drag across multiple lines → creates separate annotation per line
- [ ] Drag in reverse direction → works correctly
- [ ] Click on existing highlight (same color) → selects it
- [ ] Drag to extend existing highlight → merges into one
- [ ] Different colors → creates separate annotations
- [ ] Two-column PDF → columns detected correctly
- [ ] Preview shows while dragging

**Step 4: Remove debug mode default**

In TextLayer.tsx, ensure debug defaults to false:

```typescript
debug = false
```

**Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete text selection for highlight/underline/strikethrough tools"
```

---

## Summary

This plan implements text-aware selection in 12 tasks:

1. **Task 1-3:** Core utilities (line detection, selection, hit testing)
2. **Task 4-5:** Props interface updates
3. **Task 6-7:** Selection state and preview rendering
4. **Task 8:** Test fixes
5. **Task 9-10:** Annotation merging
6. **Task 11:** Click to select existing
7. **Task 12:** Final testing and cleanup

Each task follows TDD with explicit test→implement→verify→commit cycles.
