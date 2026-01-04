# Text Selection for Highlight/Underline/Strikethrough

Design document for text-aware selection when using highlight, underline, and strikethrough annotation tools.

## Overview

When a user selects the highlight, underline, or strikethrough tool and drags across PDF text, the selection should snap to word boundaries and create annotations that precisely cover the selected text.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Selection granularity | Word-snapping (not character-level) |
| Multi-line handling | Separate annotation per line |
| Line detection | Gap detection for multi-column support |
| Visual feedback | Instant preview while dragging |
| Overlapping annotations | Merge/extend same type and color |
| Single click behavior | Selects existing annotation, otherwise nothing |

## Text Line Detection

### Goal
Group text boxes into logical lines, handling multi-column layouts.

### Algorithm

1. **Sort by Y position** - Group text boxes into horizontal bands (Y tolerance = ~50% of average text height)

2. **Detect column gaps within each band** - For each Y-band, sort boxes by X. Look for gaps > 3× the average word spacing in that band. These gaps indicate column boundaries.

3. **Split into lines** - Each continuous run of words (no column gap) within a Y-band becomes a "line"

4. **Sort lines** - Sort all lines by Y (top to bottom), then by X (left column before right column for same Y)

### Data Structure

```typescript
interface TextLine {
  boxes: TextBox[]      // Words in reading order (left-to-right)
  minX: number          // Leftmost X
  maxX: number          // Rightmost X (end of last word)
  y: number             // Vertical position
  height: number        // Line height
}
```

This preprocessing happens once when text content loads.

## Selection Interaction

### State During Selection

```typescript
interface TextSelection {
  startLine: number      // Index of line where drag started
  startWord: number      // Index of word within that line
  endLine: number        // Current end line
  endWord: number        // Current end word
}
```

### Mouse Events

**mousedown** on a text box:
- Only activate if current tool is highlight/underline/strikethrough
- Find which line and word was clicked
- Initialize selection: start and end both point to that word
- Begin tracking

**mousemove** while dragging:
- Hit-test against all text boxes to find word under cursor
- If over a word, update `endLine` and `endWord`
- If not over any word, keep previous end position

**mouseup**:
- If start === end and clicking on existing annotation of same type → select it
- Otherwise, compute selected words and create annotations
- Clear selection state

### Multi-line Word Collection

When selection spans multiple lines:
- **Start line:** From `startWord` to end of line
- **Middle lines:** All words
- **End line:** From start of line to `endWord`

If user drags upward/leftward, reverse the logic accordingly.

## Annotation Creation & Merging

### Creating Annotations on mouseup

1. **Group selected words by line** - Produce a list of word groups, one per line

2. **For each line's words:**
   - Calculate bounding rect: `minX` of first word to `maxX` of last word
   - Convert to normalized coordinates (0-1 range)

3. **Check for merge candidates:**
   - Find existing annotations where:
     - Same `pageId`
     - Same `type` (highlight/underline/strikethrough)
     - Same `color`
     - Overlaps or is adjacent to the new rect (within ~1% tolerance)

4. **Merge or create:**
   - If merge candidate found: update existing annotation's bounds to encompass both
   - If no candidate: create new annotation

### Annotation Structure (existing)

```typescript
{ type: 'highlight', pageId, x, y, width, height, color }
{ type: 'underline', pageId, x, y, width, height, color }
{ type: 'strikethrough', pageId, x, y, width, height, color }
```

## Visual Rendering

### During Selection (Preview)

- Compute selected words from current `TextSelection` state
- For each line in selection, render preview annotation with current tool's color
- Preview uses same visual style as final annotations
- Preview elements have `pointer-events: none`

### Final Annotation Rendering

- **Highlight:** Semi-transparent filled rectangle
- **Underline:** 2px line at bottom of bounding box
- **Strikethrough:** 2px line at vertical center

### Layer Ordering (bottom to top)

1. PDF canvas
2. TextLayer (invisible boxes for hit-testing)
3. AnnotationLayer (renders highlights, underlines, etc.)
4. Selection preview (during drag)

### Pointer Events

TextLayer text boxes need `pointer-events: auto` when highlight/underline/strikethrough tool is active, `pointer-events: none` for other tools.

## Edge Cases

- **Empty selection:** User drags but doesn't land on any words → no annotation created
- **Single word:** Drag starts and ends on same word → valid single-word annotation
- **Reversed selection:** User drags right-to-left or bottom-to-top → normalize direction
- **Tool switch during drag:** Cancel current selection
- **Zoom changes:** Text boxes scale with zoom, coordinates stay normalized

## Implementation Phases

### Phase 1: Text Line Detection
- Add line-grouping logic to TextLayer
- Store `TextLine[]` in state after text content loads
- Expose lines to parent via callback or context

### Phase 2: Selection State & Hit Testing
- Add `TextSelection` state to track drag start/end
- Add mouse handlers to TextLayer
- Implement word hit-testing
- Implement multi-line word collection logic

### Phase 3: Selection Preview
- Render preview annotations during drag
- Use actual highlight/underline/strikethrough colors

### Phase 4: Annotation Creation
- On mouseup, create annotations from selected words
- One annotation per line with correct bounds
- Integrate with existing `onAddAnnotation` callback

### Phase 5: Merge Logic
- Before creating, check for overlapping same-type/color annotations
- Extend existing annotation bounds when merging

### Phase 6: Click to Select Existing
- On click (no drag) over existing text annotation, select it
- Enables delete/move of text-based annotations

## Files to Modify

- `TextLayer.tsx` - Line detection, selection state, mouse handlers, preview
- `TextLayer.css` - Selection preview styles
- `AnnotationLayer.tsx` - Minor updates for text annotation selection
- `MainViewer.tsx` - Pass current tool to TextLayer, wire up callbacks
- New `textUtils.ts` - Line detection algorithm (optional, could be in TextLayer)
