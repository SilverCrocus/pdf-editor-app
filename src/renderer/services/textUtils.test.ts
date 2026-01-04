import { describe, it, expect } from 'vitest'
import {
  groupTextIntoLines,
  getSelectedWords,
  findWordAtPoint,
  findMergeCandidate,
  getMergedBounds,
  type TextBox,
  type TextLine,
  type TextSelection
} from './textUtils'
import type { Annotation } from '../types/annotations'

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

  describe('getMergedBounds', () => {
    it('calculates merged bounds for overlapping regions', () => {
      const existing = { x: 0.1, y: 0.2, width: 0.2, height: 0.02 }
      const newBounds = { x: 0.25, y: 0.2, width: 0.15, height: 0.02 }

      const result = getMergedBounds(existing, newBounds)

      expect(result.x).toBe(0.1)
      expect(result.width).toBeCloseTo(0.3) // 0.1 to 0.4
    })

    it('handles non-overlapping adjacent regions', () => {
      const existing = { x: 0.1, y: 0.2, width: 0.1, height: 0.02 }
      const newBounds = { x: 0.3, y: 0.2, width: 0.1, height: 0.02 }

      const result = getMergedBounds(existing, newBounds)

      expect(result.x).toBe(0.1)
      expect(result.width).toBeCloseTo(0.3) // 0.1 to 0.4
    })
  })
})
