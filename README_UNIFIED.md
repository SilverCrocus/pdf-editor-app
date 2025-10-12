# PDF Editor - Unified Interface

> **A modern, keyboard-driven PDF editor with visual page management and interactive annotations**

![Version](https://img.shields.io/badge/version-2.0-blue)
![Python](https://img.shields.io/badge/python-3.10%2B-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

## ✨ What's New

The unified interface brings **all PDF editing tools into one powerful workspace**:

- 🖼️ **Full-size PDF viewing** - See your document clearly with 2x zoom
- ⌨️ **Keyboard-driven** - Navigate pages with arrows, delete with Delete/Backspace
- 📄 **Vertical page list** - All pages visible at once, click to select
- 🎨 **Visual annotations** - Click where you want text, see instant preview
- 💾 **One-click save** - Apply all changes (merge + annotate + sign) at once
- 🚀 **Faster workflow** - No more switching tabs or windows

## 🚀 Quick Start

```bash
# 1. Clone and navigate
cd pdf-editor-app

# 2. Run the unified interface
./run_unified.sh       # Linux/macOS
run_unified.bat        # Windows (create if needed)

# Or manually:
source .venv/bin/activate
python3 main_unified.py
```

## 📸 Interface Overview

```
┌─────────────────────────────────────────────────────────────┐
│ [✎ Text] [▓ Highlight] [✍ Signature]  [💾 Apply Changes]  │
├──────┬──────────────────────────────────────────────────────┤
│ Page │                                                       │
│  1   │                                                       │
│ [📄] │            Your PDF renders here                     │
│  2   │          (Click to place annotations)                │
│ [📄] │                                                       │
│  3   │                                                       │
│ [📄] │                                                       │
│  +   │                                                       │
├──────┴──────────────────────────────────────────────────────┤
│ Text: [                              ] [Add Text]           │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Key Features

### Visual Page Management

- **Add multiple PDFs** - All pages shown as thumbnails
- **Navigate with arrows** - ↑↓ keys move between pages
- **Delete instantly** - Press Delete or Backspace to remove pages
- **Click to select** - Mouse or keyboard, your choice
- **See full size** - Selected page renders large on right

### Interactive Annotations

- **Click to place** - No more guessing coordinates!
- **Live preview** - See annotations before saving
- **Font customization** - Size (8-72pt) and color picker
- **Multi-page support** - Annotate across entire document
- **Batch save** - All annotations applied at once

### Digital Signatures

- **Integrated workflow** - Sign as part of final save
- **Certificate selection** - Browse for .p12 files
- **Secure** - Password-protected certificates
- **One operation** - Merge + annotate + sign together

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Add PDF files |
| `↑` | Previous page |
| `↓` | Next page |
| `Delete` | Remove current page |
| `Backspace` | Remove current page |
| `Ctrl+Q` | Quit application |

## 📚 Complete Workflow Example

### Scenario: Merge 3 contracts, add notes, sign

```bash
1. Launch: ./run_unified.sh

2. Add files (Ctrl+O):
   - Select contract1.pdf, contract2.pdf, contract3.pdf
   - All pages appear in left panel (15 thumbnails)

3. Remove unwanted pages:
   - Click page 5 (or press ↓ to navigate to it)
   - Press Delete
   - Repeat for other unwanted pages

4. Add annotations:
   - Select remaining pages with ↑↓
   - Click on PDF where you want "Approved" text
   - Type "Approved by John Doe, 2025-10-12"
   - Adjust font size to 14pt, color to blue
   - Click "Add Text"
   - Repeat for other pages

5. Add signature:
   - Click "✍ Signature" in toolbar
   - Browse for certificate.p12
   - Enter password

6. Save everything:
   - Click "💾 Apply Changes" (top-right)
   - Choose save location
   - Done! PDF is merged, annotated, and signed

Total time: ~2 minutes for 15-page document
```

## 🔧 Installation

### Prerequisites

- Python 3.10 or higher
- Virtual environment (recommended)

### Setup

```bash
# 1. Create virtual environment
python3 -m venv .venv

# 2. Activate it
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Test installation
python3 test_unified_interface.py

# 5. Run application
python3 main_unified.py
```

### Dependencies

- `PyMuPDF` (fitz) - PDF rendering and manipulation
- `pikepdf` - PDF merging and page operations
- `pyHanko` - Digital signatures
- `PySide6` - Qt6-based GUI

## 🆚 Unified vs Tabbed Interface

### Unified Interface (`main_unified.py`) - Recommended ⭐

**Pros:**
- ✅ Everything visible at once
- ✅ Keyboard-driven workflow
- ✅ Full-size PDF viewing
- ✅ Faster for complex edits
- ✅ Modern single-view design

**Best for:**
- Power users
- Frequent PDF editing
- Multi-page documents
- Keyboard enthusiasts

### Tabbed Interface (`main.py`) - Classic

**Pros:**
- ✅ Familiar tab-based navigation
- ✅ Clear step-by-step workflow
- ✅ Good for simple tasks

**Best for:**
- Occasional use
- Single-purpose tasks (just merge or just annotate)
- Users who prefer traditional interfaces

## 📖 Documentation

- **[UNIFIED_INTERFACE_GUIDE.md](UNIFIED_INTERFACE_GUIDE.md)** - Complete user guide
- **[REDESIGN_SUMMARY.md](REDESIGN_SUMMARY.md)** - Technical implementation details
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick reference card (old interface)

## 🐛 Troubleshooting

### Arrow keys not working?
**Solution:** Click in the page list (left panel) to give it focus.

### Pages not loading?
**Check:**
1. PDF file is not corrupted
2. PyMuPDF is installed: `pip list | grep PyMuPDF`
3. File path has no special characters

### Apply Changes button disabled?
**Reason:** No changes made yet. Add at least one annotation or modify pages.

### Import errors?
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Verify imports
python3 test_unified_interface.py
```

## 🏗️ Project Structure

```
pdf-editor-app/
├── main_unified.py              # Unified interface entry point
├── main.py                      # Original tabbed interface
├── src/
│   ├── core/                    # Core PDF operations
│   │   ├── pdf_merger.py       # Page-level merging
│   │   ├── pdf_annotator.py    # Batch annotations
│   │   └── pdf_signer.py       # Digital signatures
│   └── gui/                     # GUI components
│       ├── unified_window.py   # Main window
│       ├── page_list.py        # Vertical page list
│       ├── full_pdf_viewer.py  # Large PDF viewer
│       ├── toolbar.py          # Tool selection toolbar
│       └── annotation_editor.py # (Used by both interfaces)
├── tests/
│   ├── test_unified_interface.py
│   └── test_visual_features.py
├── docs/
│   ├── UNIFIED_INTERFACE_GUIDE.md
│   ├── REDESIGN_SUMMARY.md
│   └── QUICK_REFERENCE.md
└── requirements.txt
```

## 🤝 Contributing

Found a bug or have a suggestion?

1. Check existing issues
2. Create a new issue with:
   - Description of problem/feature
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Screenshots if applicable

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- **PyMuPDF** - Excellent PDF rendering
- **pikepdf** - Robust PDF manipulation
- **pyHanko** - Digital signature support
- **PySide6** - Modern Qt6 bindings

## 📈 Roadmap

### v2.1 (Planned)
- [ ] Drag-and-drop page reordering
- [ ] Zoom controls in viewer
- [ ] Annotation editing (modify after adding)

### v2.2 (Future)
- [ ] Highlight tool implementation
- [ ] Drawing tools (shapes, freehand)
- [ ] Multiple undo/redo

### v3.0 (Vision)
- [ ] Multi-document editing
- [ ] Cloud integration
- [ ] Collaborative annotations

## 💬 Support

- **Documentation**: See docs/ folder
- **Help menu**: In-app Help → Keyboard Shortcuts
- **Issues**: GitHub issues page
- **Email**: (Add your support email)

---

**Ready to edit PDFs like a pro?** 🚀

Run `./run_unified.sh` and start editing!
