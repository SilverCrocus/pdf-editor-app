# Visual Features Guide

## Overview

The PDF Editor has been enhanced with powerful visual features that make merging and annotating PDFs intuitive and interactive.

## What's New

### 🖼️ Visual Merge Tab
- **Page Thumbnails**: See preview images of every page before merging
- **Drag to Reorder**: Use ↑↓ buttons to reorder pages
- **Delete Specific Pages**: Remove individual pages with the ✕ button
- **Mix and Match**: Add multiple PDFs and see all pages laid out horizontally

### ✍️ Interactive Annotation Tab
- **Visual PDF Viewer**: See the actual rendered PDF page at a readable size
- **Click to Place**: Simply click on the PDF where you want to add text
- **Visual Controls**:
  - Font size slider (8-72pt)
  - Color picker for text color
  - Real-time position feedback
- **Annotation Staging**: Add multiple annotations and preview them before saving
- **Batch Save**: All annotations are applied at once when you press "Save Annotated PDF"
- **Page Navigation**: Browse through multi-page PDFs with Previous/Next buttons

## New Workflow: Merging PDFs

### Before (Old Way)
1. Select multiple PDF files
2. Files merge in the order added
3. No visual feedback
4. Cannot reorder or delete specific pages

### After (New Way)
1. Click **"Add PDF Files"** and select your PDFs
2. **See thumbnail previews** of every page from all PDFs
3. **Reorder pages** using the ↑↓ buttons on each thumbnail
4. **Delete unwanted pages** using the ✕ button
5. Click **"Merge Selected Pages"** to create your custom PDF
6. Save the result

### Example Use Case
*You have 3 contracts (5 pages each) but only need pages 1-2 from the first, page 3 from the second, and all pages from the third:*

1. Add all 3 PDFs (15 thumbnails appear)
2. Click ✕ on unwanted pages from contracts 1 and 2
3. Reorder if needed
4. Merge → You get exactly the pages you want!

## New Workflow: Annotating PDFs

### Before (Old Way)
1. Select PDF
2. Manually enter X, Y coordinates (how do you know what coordinates to use?)
3. Type text blindly
4. Save immediately after each annotation
5. Open PDF externally to verify it looks right

### After (New Way)
1. Click **"Select PDF"** and choose your PDF
2. The PDF **renders visually** in the viewer
3. **Click directly on the PDF** where you want text to appear
4. The position is automatically captured
5. Enter your text in the editor panel
6. Customize:
   - **Font size** with the spinner
   - **Text color** with the color picker
7. Click **"Add Annotation to List"**
8. **Preview the annotation** on the PDF immediately
9. Navigate to other pages and add more annotations
10. When done, click **"Save Annotated PDF"** to apply all at once

### Example Use Case
*You need to add 10 comments to different pages of a report:*

1. Load the PDF → Page 1 renders
2. Click where you want "Approved by Manager" to appear
3. Type the text, set font size to 14pt, choose blue color
4. Add to list → See it preview on the PDF
5. Click "Next ►" → Page 2 renders
6. Add more annotations...
7. When all 10 are added, click "Save Annotated PDF"
8. All 10 annotations are applied to the final document in one operation

## Key Benefits

### Merge Tab
✅ **Visual confidence** - See exactly what you're merging
✅ **Precise control** - Reorder and delete at the page level
✅ **Time savings** - No need to edit PDFs externally first
✅ **Error prevention** - Preview prevents merging wrong pages

### Annotation Tab
✅ **No guessing coordinates** - Click where you want text
✅ **Real-time preview** - See annotations before committing
✅ **Batch operations** - Add many annotations, save once
✅ **Visual feedback** - Know exactly where text will appear
✅ **Customization** - Font size and color controls
✅ **Multi-page support** - Navigate and annotate any page

## Technical Details

### New Components
- **PagePreviewWidget** ([src/gui/page_preview.py](src/gui/page_preview.py)) - Individual page thumbnail with controls
- **PDFViewerWidget** ([src/gui/pdf_viewer.py](src/gui/pdf_viewer.py)) - Interactive PDF renderer with click handling
- **AnnotationEditorWidget** ([src/gui/annotation_editor.py](src/gui/annotation_editor.py)) - Annotation properties and list manager

### Enhanced Core Functionality
- **PDFMerger.merge_pages()** - New method for page-level merging
- **PDFAnnotator.add_batch_annotations()** - Apply multiple annotations at once with font/color support

## Running the App

```bash
# Activate virtual environment
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows

# Run the application
python main.py
```

Or use the launcher scripts:
```bash
./run.sh    # Linux/macOS
run.bat     # Windows
```

## Tips and Tricks

### Merge Tab
- Thumbnails are 150x150px for quick loading
- Source file name is shown under each page
- Up/Down buttons are disabled for first/last pages automatically
- You can mix pages from any number of PDFs

### Annotation Tab
- The PDF renders at 1.5x zoom for readability
- Red dots mark annotation positions on the preview
- Page navigation preserves your annotation list
- Annotations persist across page changes until you save
- Remove annotations from the list before saving if you change your mind
- Font sizes range from 8pt (tiny) to 72pt (huge)

## Troubleshooting

### Thumbnails not loading?
- Ensure PyMuPDF (fitz) is installed: `pip install PyMuPDF`
- Check that PDF files are not corrupted

### PDF viewer shows "Error"?
- File path must be absolute
- PDF must be readable (not password protected)

### Annotations not appearing?
- Make sure you clicked "Add Annotation to List"
- Check that text is entered in the text box
- Verify you clicked on the PDF to set position first

### Slow performance with many pages?
- Thumbnails are generated on-demand and cached
- Consider splitting very large PDFs (100+ pages) before merging

## What's the Same

The **Sign PDFs** tab remains unchanged and works as before:
- Select PDF to sign
- Choose certificate (.p12 file)
- Enter password
- Sign and save

All existing functionality is preserved!

## Feedback

Found a bug or have a suggestion? Please create an issue on the project repository.

---

**Enjoy your enhanced PDF editing experience!** 🎉
