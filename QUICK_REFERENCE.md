# Quick Reference Card

## 🎯 Visual Merge Tab

### Workflow
```
1. Click "Add PDF Files" → Select multiple PDFs
2. View thumbnails of all pages
3. Use ↑↓ to reorder pages
4. Click ✕ to delete unwanted pages
5. Click "Merge Selected Pages" → Save
```

### Controls
- **↑ button** - Move page earlier in sequence
- **↓ button** - Move page later in sequence
- **✕ button** - Delete this page
- **Clear All Pages** - Remove all loaded pages

---

## ✍️ Visual Annotation Tab

### Workflow
```
1. Click "Select PDF" → Choose your PDF
2. Click on the PDF where you want text
3. Type your text
4. Adjust font size (8-72pt)
5. Click "Choose Color" for text color
6. Click "Add Annotation to List"
7. Repeat steps 2-6 for more annotations
8. Click "Save Annotated PDF" → Save
```

### Controls
- **◄ Previous / Next ►** - Navigate pages
- **Click on PDF** - Set annotation position
- **Font Size spinner** - Adjust text size
- **Choose Color** - Pick text color
- **Add Annotation to List** - Stage annotation
- **Remove Selected** - Delete annotation from list
- **Clear All** - Clear all staged annotations
- **Save Annotated PDF** - Apply all and save

### Tips
- Red dots show where annotations will be placed
- Navigate pages freely - annotations are remembered
- Remove from list before saving if you change your mind
- All annotations save in one operation

---

## 🔐 Sign PDFs Tab

### Workflow (unchanged)
```
1. Select PDF to sign
2. Select certificate (.p12 file)
3. Enter certificate password
4. Click "Sign PDF" → Save
```

---

## 💡 Pro Tips

### Merging
- Mix pages from unlimited PDFs
- Create custom documents page-by-page
- Thumbnails show file name for easy identification

### Annotating
- Zoom is automatically optimized for readability
- Click accuracy improves with practice
- Start with larger font sizes (14pt+) for visibility
- Preview annotations before committing

---

## ⌨️ Keyboard Shortcuts

- **Ctrl+Q** - Quit application
- **Tab** - Switch between tabs
- **Enter** - Confirm dialogs

---

## 🚀 Launch Commands

```bash
# Quick start (recommended)
./run.sh          # Linux/macOS
run.bat           # Windows

# Manual start
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows
python main.py
```

---

## 📁 File Support

- **Input**: PDF files only
- **Output**: PDF files only
- **Certificates**: .p12 files (for signing)

---

## ❓ Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| No thumbnails | Check PyMuPDF installed |
| PDF won't load | Check file path is valid |
| Can't click for position | Ensure PDF is loaded first |
| Annotations not saving | Click "Add to List" first |
| App won't start | Activate virtual environment |

---

**Version**: 2.0 (Visual)
**Last Updated**: 2025-10-12

For detailed help, see [VISUAL_FEATURES_GUIDE.md](VISUAL_FEATURES_GUIDE.md)
