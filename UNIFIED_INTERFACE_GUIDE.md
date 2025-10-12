# Unified Interface Guide

## Overview

The PDF Editor now features a **unified single-view interface** that combines all functionality into one powerful workspace. No more switching between tabs!

## Interface Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [Tool Selector] [Text Properties]         [💾 Apply Changes]│ ← Toolbar
├──────┬──────────────────────────────────────────────────────┤
│      │                                                       │
│ Page │                                                       │
│ List │              Full-Size PDF Viewer                    │ ← Main Area
│      │          (Click to place annotations)                │
│      │                                                       │
├──────┴──────────────────────────────────────────────────────┤
│ [Text Annotation Input] or [Signature Settings]             │ ← Bottom Panel
├──────────────────────────────────────────────────────────────┤
│ Status: Ready - Add PDF files to begin                      │ ← Status Bar
└─────────────────────────────────────────────────────────────┘
```

### Components

1. **Toolbar (Top)**
   - Tool selector: ✎ Text, ▓ Highlight, ✍ Signature
   - Text properties: Font size, color picker
   - **💾 Apply Changes** button (top-right, always visible)

2. **Page List (Left, Vertical)**
   - Thumbnail previews (120x120px)
   - Shows page number and source file
   - Green border indicates selected page
   - Click to select, use ↑↓ arrows to navigate
   - Press Delete/Backspace to remove

3. **PDF Viewer (Right, Large)**
   - Full-size page rendering (2x zoom for clarity)
   - Click to place annotations
   - See real-time annotation previews
   - Dark background (#2b2b2b) for better contrast

4. **Bottom Panel (Context-Sensitive)**
   - **Text tool**: Text input box and "Add Text" button
   - **Signature tool**: Certificate selection and password

## Workflow

### Basic Editing Session

```
1. Add PDFs
   ↓
2. Navigate pages (arrows or click)
   ↓
3. Delete unwanted pages (Delete/Backspace)
   ↓
4. Select tool from toolbar
   ↓
5. Click on PDF to work
   ↓
6. Repeat steps 2-5 as needed
   ↓
7. Click "Apply Changes" to save
```

### Text Annotation Workflow

```
Step 1: Select Text Tool (✎ Text)
   └─ Bottom panel shows text input

Step 2: Customize (optional)
   ├─ Font size: 8-72pt
   └─ Color: Click "Choose" button

Step 3: Click on PDF where you want text
   └─ Position captured

Step 4: Type your text in bottom panel
   └─ Text shows in input box

Step 5: Click "Add Text"
   └─ Annotation appears on PDF with red dot marker

Step 6: Repeat steps 3-5 for more annotations
   └─ Navigate pages with arrows as needed

Step 7: Click "Apply Changes" (top-right)
   └─ Choose save location
   └─ All changes applied at once!
```

### Page Management Workflow

```
Step 1: Click "+ Add PDF Files" or Ctrl+O
   └─ Select one or more PDFs

Step 2: Thumbnails appear in left panel
   ├─ Each page shown separately
   └─ First page auto-selected

Step 3: Navigate pages
   ├─ Click thumbnail directly
   ├─ Use ↑ arrow (previous)
   └─ Use ↓ arrow (next)

Step 4: Delete unwanted pages
   ├─ Select page (click or arrows)
   └─ Press Delete or Backspace
   └─ Page removed instantly

Step 5: Selected page shows in full view
   └─ Ready for annotation
```

### Digital Signature Workflow

```
Step 1: Prepare your PDF
   ├─ Add pages
   ├─ Add any text annotations
   └─ Navigate to verify everything looks good

Step 2: Select Signature Tool (✍ Signature)
   └─ Bottom panel changes to signature settings

Step 3: Select certificate
   ├─ Click "Browse..." button
   └─ Choose your .p12 certificate file

Step 4: Enter certificate password
   └─ Type in password field (hidden)

Step 5: Click "Apply Changes"
   └─ PDF is merged, annotated, AND signed
   └─ All in one operation!
```

## Keyboard Shortcuts

### Essential

| Key | Action |
|-----|--------|
| **Ctrl+O** | Add PDF files |
| **↑** | Select previous page |
| **↓** | Select next page |
| **Delete** | Remove selected page |
| **Backspace** | Remove selected page |
| **Ctrl+Q** | Quit application |

### Tips

- Page list must have focus for arrow keys to work
  - Click on page list or thumbnails to focus it
  - After adding files, focus is automatically set
- Delete/Backspace work immediately (no confirmation)
- Removed pages are gone from the final PDF

## Features

### ✅ What You Can Do

- **Visual page management**
  - See all pages as thumbnails
  - Reorder by selecting and navigating
  - Delete specific pages with keyboard

- **Interactive annotations**
  - Click exactly where you want text
  - Customize font size and color
  - Preview before saving
  - Add multiple annotations per page
  - Annotations across multiple pages

- **Single-click save**
  - One "Apply Changes" button for everything
  - Merges pages in order shown
  - Applies all annotations
  - Signs PDF (if signature tool used)
  - All operations atomic

- **Keyboard-driven**
  - Navigate pages without mouse
  - Delete pages with keyboard
  - Quick file operations (Ctrl+O)

### 🎯 Key Improvements Over Tabbed Interface

| Feature | Tabbed Version | Unified Version |
|---------|---------------|-----------------|
| Page viewing | Small thumbnails | Full-size rendering |
| Navigation | Manual scrolling | Keyboard arrows |
| Page deletion | Click tiny ✕ button | Press Delete/Backspace |
| Tool switching | Switch tabs | Toolbar buttons |
| Workflow | Fragmented | Continuous |
| Save button | Bottom of tab | Always visible top-right |
| Screen usage | ~60% utilized | ~95% utilized |

## Pro Tips

### Efficient Page Management

1. **Add multiple PDFs at once**
   - Ctrl+O → Select multiple files
   - All pages load as separate thumbnails
   - Pages maintain source file order initially

2. **Quick navigation**
   - Click page list area first (to focus)
   - Use ↑↓ arrows to move fast
   - Selected page shows green border

3. **Rapid deletion**
   - Hold ↓ arrow, tap Delete repeatedly
   - Or: Select, Delete, repeat
   - No confirmation needed (be careful!)

### Annotation Best Practices

1. **Start with larger fonts**
   - Use 14pt or higher initially
   - Easier to see and position
   - Reduce size if needed later

2. **Color coding**
   - Red for important notes
   - Blue for regular text
   - Black for formal documents

3. **Position accuracy**
   - Zoom level is 2x for precision
   - Click slightly above where text should appear
   - PyMuPDF uses top-left corner of text

4. **Batch workflow**
   - Add ALL annotations first
   - Review by navigating pages
   - Save once at the end

### Signature Integration

1. **Prepare first, sign last**
   - Add all pages
   - Add all annotations
   - THEN select signature tool
   - Apply changes does everything

2. **Test certificates**
   - Use test certificate first
   - Verify it works before using real one
   - Check "About" menu for certificate info

## Troubleshooting

### Page list arrow keys not working?
**Solution**: Click anywhere in the page list panel to give it focus.

### Annotation not appearing?
**Check**:
1. Did you click "Add Text" button?
2. Is text input empty?
3. Did you click on PDF first?

### Apply Changes button disabled?
**Reason**: No changes have been made yet.
**To enable**: Add at least one annotation.

### PDF rendering looks blurry?
**Note**: Zoom is set to 2x for quality. If still blurry:
- Check source PDF quality
- Ensure PyMuPDF is latest version

### Can't see added PDF pages?
**Solution**: Scroll down in page list (left panel).

## Comparison: Tabbed vs Unified

### When to Use Tabbed Interface (`main.py`)

✅ Familiar with traditional tab-based UIs
✅ Want clear separation between merge/annotate/sign
✅ Prefer guided step-by-step workflow

### When to Use Unified Interface (`main_unified.py`)

✅ Want maximum screen space for PDF viewing
✅ Need keyboard-driven workflow
✅ Frequently switch between annotation and page management
✅ Prefer modern single-view applications
✅ Want faster, more fluid editing experience

**Recommendation**: Try unified interface first. It's more powerful and efficient!

## Running the Interface

```bash
# Unified interface (recommended)
source .venv/bin/activate  # or .venv\Scripts\activate
python3 main_unified.py

# Or using launcher script (update it to point to main_unified.py)
./run.sh
```

## Quick Reference Card

```
┌─────────────────────────────────────┐
│       UNIFIED INTERFACE             │
├─────────────────────────────────────┤
│ ADD FILES:  Ctrl+O / "+ Add" button │
│ NAVIGATE:   ↑↓ arrows or click      │
│ DELETE:     Delete or Backspace     │
│ SAVE:       💾 Apply Changes button │
│                                     │
│ TEXT TOOL:  Click PDF → Type → Add  │
│ FONT SIZE:  8-72pt spinner          │
│ COLOR:      Choose button           │
│                                     │
│ SIGNATURE:  Select cert → password  │
│             → Apply Changes         │
└─────────────────────────────────────┘
```

---

**You're ready to edit PDFs like a pro!** 🚀

For more help: Menu → Help → Keyboard Shortcuts
