#!/usr/bin/env python3
"""
Comprehensive test suite for PDF Editor application.
Tests all major components and functionality.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))


def test_imports():
    """Test that all modules can be imported."""
    print("Testing module imports...")
    print("=" * 60)

    tests = [
        ("Core - PDFMerger", "from src.core.pdf_merger import PDFMerger"),
        ("Core - PDFAnnotator", "from src.core.pdf_annotator import PDFAnnotator"),
        ("Core - PDFSigner", "from src.core.pdf_signer import PDFSigner"),
        ("GUI - VerticalPageList", "from src.gui.page_list import VerticalPageList"),
        ("GUI - FullPDFViewer", "from src.gui.full_pdf_viewer import FullPDFViewer"),
        ("GUI - AnnotationToolbar", "from src.gui.toolbar import AnnotationToolbar"),
        ("GUI - UnifiedPDFEditor", "from src.gui.unified_window import UnifiedPDFEditor"),
    ]

    all_passed = True
    for name, import_stmt in tests:
        try:
            exec(import_stmt)
            print(f"  ✓ {name}")
        except Exception as e:
            print(f"  ✗ {name}: {e}")
            all_passed = False

    return all_passed


def test_pdf_loading():
    """Test loading PDF files with PyMuPDF."""
    print("\nTesting PDF file loading...")
    print("=" * 60)

    import fitz

    test_files = [
        "testpdfs/testp1.pdf",
        "testpdfs/testp2.pdf",
        "testpdfs/testp3.pdf",
    ]

    all_passed = True
    for pdf_path in test_files:
        if not Path(pdf_path).exists():
            print(f"  ⚠ {pdf_path} - Not found, skipping")
            continue

        try:
            doc = fitz.open(pdf_path)
            page_count = len(doc)

            if page_count > 0:
                page = doc[0]
                mat = fitz.Matrix(1.5, 1.5)
                pix = page.get_pixmap(matrix=mat, alpha=False)
                print(f"  ✓ {pdf_path} - {page_count} pages")
            else:
                print(f"  ✗ {pdf_path} - No pages")
                all_passed = False

            doc.close()

        except Exception as e:
            print(f"  ✗ {pdf_path} - Error: {e}")
            all_passed = False

    return all_passed


def test_page_list():
    """Test the page list component."""
    print("\nTesting VerticalPageList component...")
    print("=" * 60)

    from PySide6.QtWidgets import QApplication
    from src.gui.page_list import VerticalPageList

    app = QApplication.instance() or QApplication(sys.argv)
    page_list = VerticalPageList()

    test_files = ["testpdfs/testp1.pdf", "testpdfs/testp2.pdf"]

    all_passed = True
    for pdf_path in test_files:
        if not Path(pdf_path).exists():
            print(f"  ⚠ {pdf_path} - Not found, skipping")
            continue

        try:
            page_count = page_list.add_pages_from_pdf(pdf_path)
            print(f"  ✓ {pdf_path} - Loaded {page_count} pages")
        except Exception as e:
            print(f"  ✗ {pdf_path} - Error: {e}")
            all_passed = False

    total = page_list.get_page_count()
    print(f"  ✓ Total pages in list: {total}")

    return all_passed


def test_core_methods():
    """Test core PDF methods exist."""
    print("\nTesting core methods...")
    print("=" * 60)

    from src.core.pdf_merger import PDFMerger
    from src.core.pdf_annotator import PDFAnnotator

    all_passed = True

    # Test PDFMerger
    if hasattr(PDFMerger, 'merge_pages'):
        print("  ✓ PDFMerger.merge_pages() exists")
    else:
        print("  ✗ PDFMerger.merge_pages() not found")
        all_passed = False

    # Test PDFAnnotator
    if hasattr(PDFAnnotator, 'add_batch_annotations'):
        print("  ✓ PDFAnnotator.add_batch_annotations() exists")
    else:
        print("  ✗ PDFAnnotator.add_batch_annotations() not found")
        all_passed = False

    return all_passed


def test_application_startup():
    """Test that the main application can be instantiated."""
    print("\nTesting application startup...")
    print("=" * 60)

    try:
        from PySide6.QtWidgets import QApplication
        from src.gui.unified_window import UnifiedPDFEditor

        app = QApplication.instance() or QApplication(sys.argv)
        window = UnifiedPDFEditor()

        # Check major components
        components = [
            ("toolbar", "Toolbar"),
            ("page_list", "Page list"),
            ("pdf_viewer", "PDF viewer"),
            ("bottom_panel", "Bottom panel"),
        ]

        all_passed = True
        for attr, name in components:
            if hasattr(window, attr):
                print(f"  ✓ {name} component exists")
            else:
                print(f"  ✗ {name} component not found")
                all_passed = False

        return all_passed

    except Exception as e:
        print(f"  ✗ Failed to create application: {e}")
        return False


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("PDF Editor - Comprehensive Test Suite")
    print("=" * 60 + "\n")

    all_passed = True

    if not test_imports():
        all_passed = False

    if not test_core_methods():
        all_passed = False

    if not test_pdf_loading():
        all_passed = False

    if not test_page_list():
        all_passed = False

    if not test_application_startup():
        all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        print("✓ All tests passed!")
        print("\nReady to run:")
        print("  ./run.sh")
        print("  or")
        print("  python3 main.py")
    else:
        print("✗ Some tests failed")
        return 1

    print("=" * 60 + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
