# PDF Editor

> **A modern, visual PDF editor with interactive page management and annotations**

![Version](https://img.shields.io/badge/version-2.0-blue)
![Python](https://img.shields.io/badge/python-3.10%2B-green)

## Features

- 🖼️ **Visual Page Management** - See all pages as thumbnails, reorder and delete with keyboard
- ✍️ **Interactive Annotations** - Click to place text, customize font size and color
- 📄 **Smart Merging** - Combine specific pages from multiple PDFs
- 🔐 **Digital Signatures** - Sign PDFs with certificates
- ⌨️ **Keyboard-Driven** - Navigate pages with arrows, delete with Delete/Backspace
- 💾 **Batch Operations** - Apply all changes (merge + annotate + sign) at once

## Quick Start

```bash
# Run the application
./run.sh

# Or manually:
source .venv/bin/activate
python3 main.py
```

### First-Time Setup

```bash
# 1. Create virtual environment
python3 -m venv .venv

# 2. Activate it
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run tests
python3 test_application.py

# 5. Start the application
python3 main.py
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+O` | Add PDF files |
| `↑` | Previous page |
| `↓` | Next page |
| `Delete` | Remove current page |
| `Backspace` | Remove current page |
| `Ctrl+Q` | Quit |

## Dependencies

- **PyMuPDF** - PDF rendering
- **pikepdf** - PDF merging
- **pyHanko** - Digital signatures
- **PySide6** - Qt6 GUI

## Testing

```bash
python3 test_application.py
```

## License

MIT License

---

**Ready to edit PDFs?** Run `./run.sh` and start editing!
