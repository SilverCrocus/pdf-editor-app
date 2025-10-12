# Document Closed Error - Fix

## Issue

**Error Message**: "Failed to load PDF files: document closed"

**When it occurred**: When adding PDF files to the page list

## Root Cause

In `src/gui/page_list.py`, the `add_pages_from_pdf()` method was:

1. Opening the PDF document
2. Iterating through pages to create PageListItem widgets
3. **Closing the document** (line 180)
4. Trying to access `len(doc)` **after** closing (line 186) ❌

```python
# BEFORE (Broken)
def add_pages_from_pdf(self, pdf_path: str):
    doc = fitz.open(pdf_path)
    source_name = Path(pdf_path).name

    for page_num in range(len(doc)):
        item = PageListItem(pdf_path, page_num, source_name)
        self.page_items.append(item)
        self.container_layout.addWidget(item)

    doc.close()  # ← Document closed here

    logger.info(f"Added {len(doc)} pages from {pdf_path}")  # ← ERROR! Accessing closed doc
    return len(doc)  # ← ERROR! Accessing closed doc
```

## Solution

Store the page count **before** closing the document:

```python
# AFTER (Fixed)
def add_pages_from_pdf(self, pdf_path: str):
    doc = fitz.open(pdf_path)
    source_name = Path(pdf_path).name
    page_count = len(doc)  # ← Store count BEFORE closing

    for page_num in range(page_count):
        item = PageListItem(pdf_path, page_num, source_name)
        self.page_items.append(item)
        self.container_layout.addWidget(item)

    doc.close()  # ← Safe to close now

    logger.info(f"Added {page_count} pages from {pdf_path}")  # ← Uses stored count
    return page_count  # ← Uses stored count
```

## Changes Made

**File**: `src/gui/page_list.py`

**Line 172**: Added `page_count = len(doc)` to store count before closing

**Line 187**: Changed `f"Added {len(doc)} pages"` to `f"Added {page_count} pages"`

**Line 188**: Changed `return len(doc)` to `return page_count`

## Why This Works

1. **Document lifecycle**: Each PyMuPDF document must be properly closed to free resources
2. **Timing**: We need the page count info, but must close the document
3. **Solution**: Store the value we need **before** closing

## Testing

Ran test with all test PDFs:

```bash
$ python3 test_page_loading_fix.py

Testing page list PDF loading...
============================================================
✓ testpdfs/testp1.pdf - Loaded 1 pages
✓ testpdfs/testp2.pdf - Loaded 1 pages
✓ testpdfs/testp3.pdf - Loaded 3 pages

✓ Total pages loaded: 5
============================================================
✓ All tests passed! No 'document closed' error.
```

## Verification

To verify the fix works:

```bash
# Activate environment
source .venv/bin/activate

# Run the application
python3 main_unified.py

# Add PDF files (Ctrl+O or click "+ Add PDF Files")
# Should load successfully without error
```

## Related Code

The `PageListItem` class correctly manages its own document lifecycle:

```python
def _load_thumbnail(self):
    doc = fitz.open(self.pdf_path)  # Opens fresh
    # ... render thumbnail ...
    doc.close()  # Closes properly
```

Each thumbnail loads its own document instance independently, so there's no conflict.

## Prevention

**Best Practice**: When working with PyMuPDF documents:

```python
# ✓ GOOD: Store what you need first
doc = fitz.open(path)
count = len(doc)
data = doc.metadata
doc.close()
use(count, data)  # Safe - values stored

# ✗ BAD: Access after close
doc = fitz.open(path)
doc.close()
count = len(doc)  # ERROR! Document closed
```

---

**Status**: ✅ Fixed and tested
**File modified**: `src/gui/page_list.py`
**Lines changed**: 3 (lines 172, 187, 188)
