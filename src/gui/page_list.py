"""Vertical page list widget with keyboard navigation."""

import logging
from pathlib import Path
from typing import List, Optional, Callable

import fitz
from PySide6.QtWidgets import (
    QWidget,
    QVBoxLayout,
    QScrollArea,
    QLabel,
    QPushButton,
)
from PySide6.QtCore import Qt, Signal, QSize
from PySide6.QtGui import QPixmap, QImage, QKeyEvent

logger = logging.getLogger(__name__)


class PageListItem(QWidget):
    """Single page list item with thumbnail and info."""

    clicked = Signal(object)  # Emits self when clicked

    def __init__(self, pdf_path: str, page_num: int, source_file: str, thumbnail_size: int = 120, parent=None):
        super().__init__(parent)
        self.pdf_path = pdf_path
        self.page_num = page_num
        self.source_file = source_file
        self.thumbnail_size = thumbnail_size
        self.is_selected = False

        self._setup_ui()
        self._load_thumbnail()

    def _setup_ui(self):
        """Setup the widget UI."""
        layout = QVBoxLayout()
        layout.setContentsMargins(5, 5, 5, 5)
        layout.setSpacing(3)

        # Thumbnail
        self.thumbnail_label = QLabel()
        self.thumbnail_label.setAlignment(Qt.AlignCenter)
        self.thumbnail_label.setFixedSize(self.thumbnail_size, self.thumbnail_size)
        self._update_style()
        layout.addWidget(self.thumbnail_label)

        # Info
        info_text = f"Page {self.page_num + 1}\n{Path(self.source_file).name}"
        self.info_label = QLabel(info_text)
        self.info_label.setAlignment(Qt.AlignCenter)
        self.info_label.setWordWrap(True)
        self.info_label.setMaximumWidth(self.thumbnail_size)
        self.info_label.setStyleSheet("font-size: 9pt; color: #666;")
        layout.addWidget(self.info_label)

        self.setLayout(layout)
        self.setFixedWidth(self.thumbnail_size + 10)

    def _load_thumbnail(self):
        """Load and display the PDF page thumbnail."""
        try:
            doc = fitz.open(self.pdf_path)
            if self.page_num >= len(doc):
                self.thumbnail_label.setText("Error")
                return

            page = doc[self.page_num]
            zoom = self.thumbnail_size / max(page.rect.width, page.rect.height)
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)

            img_data = pix.tobytes("png")
            qimage = QImage()
            qimage.loadFromData(img_data)
            pixmap = QPixmap.fromImage(qimage)

            self.thumbnail_label.setPixmap(
                pixmap.scaled(
                    self.thumbnail_size,
                    self.thumbnail_size,
                    Qt.KeepAspectRatio,
                    Qt.SmoothTransformation,
                )
            )
            doc.close()

        except Exception as e:
            logger.error(f"Failed to load thumbnail: {e}")
            self.thumbnail_label.setText("Error")

    def _update_style(self):
        """Update the widget style based on selection state."""
        if self.is_selected:
            self.thumbnail_label.setStyleSheet(
                "QLabel { border: 3px solid #4CAF50; background-color: white; }"
            )
        else:
            self.thumbnail_label.setStyleSheet(
                "QLabel { border: 1px solid #ccc; background-color: white; }"
            )

    def set_selected(self, selected: bool):
        """Set the selection state."""
        self.is_selected = selected
        self._update_style()

    def mousePressEvent(self, event):
        """Handle mouse press."""
        if event.button() == Qt.LeftButton:
            self.clicked.emit(self)

    def get_page_info(self):
        """Get page info tuple."""
        return (self.pdf_path, self.page_num)


class VerticalPageList(QWidget):
    """Vertical scrollable list of PDF page thumbnails with keyboard navigation."""

    page_selected = Signal(str, int)  # Emits (pdf_path, page_num)
    page_deleted = Signal(int)  # Emits index

    def __init__(self, parent=None):
        super().__init__(parent)
        self.page_items: List[PageListItem] = []
        self.current_index: int = -1

        self._setup_ui()
        self.setFocusPolicy(Qt.StrongFocus)

    def _setup_ui(self):
        """Setup the widget UI."""
        layout = QVBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)

        # Header
        header = QLabel("Pages")
        header.setStyleSheet("font-weight: bold; font-size: 11pt; padding: 5px;")
        header.setAlignment(Qt.AlignCenter)
        layout.addWidget(header)

        # Scroll area for pages
        self.scroll_area = QScrollArea()
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)

        # Container for page items
        self.container = QWidget()
        self.container_layout = QVBoxLayout()
        self.container_layout.setAlignment(Qt.AlignTop)
        self.container_layout.setSpacing(5)
        self.container.setLayout(self.container_layout)
        self.scroll_area.setWidget(self.container)

        layout.addWidget(self.scroll_area)

        # Add pages button
        self.add_btn = QPushButton("+ Add PDF Files")
        self.add_btn.setStyleSheet("padding: 8px; font-weight: bold;")
        layout.addWidget(self.add_btn)

        self.setLayout(layout)

    def add_pages_from_pdf(self, pdf_path: str):
        """Add all pages from a PDF file."""
        try:
            doc = fitz.open(pdf_path)
            source_name = Path(pdf_path).name
            page_count = len(doc)  # Store count before closing

            for page_num in range(page_count):
                item = PageListItem(pdf_path, page_num, source_name)
                item.clicked.connect(self._on_item_clicked)

                self.page_items.append(item)
                self.container_layout.addWidget(item)

            doc.close()

            # Select first page if this is the first PDF
            if len(self.page_items) > 0 and self.current_index == -1:
                self.select_page(0)

            logger.info(f"Added {page_count} pages from {pdf_path}")
            return page_count

        except Exception as e:
            logger.error(f"Failed to add pages from PDF: {e}")
            raise

    def _on_item_clicked(self, item: PageListItem):
        """Handle item click."""
        if item in self.page_items:
            index = self.page_items.index(item)
            self.select_page(index)
            # Set focus to enable keyboard navigation
            self.setFocus()

    def select_page(self, index: int):
        """Select a page by index."""
        if 0 <= index < len(self.page_items):
            # Deselect previous
            if 0 <= self.current_index < len(self.page_items):
                self.page_items[self.current_index].set_selected(False)

            # Select new
            self.current_index = index
            self.page_items[index].set_selected(True)

            # Emit signal
            pdf_path, page_num = self.page_items[index].get_page_info()
            self.page_selected.emit(pdf_path, page_num)

            # Scroll to item
            self.scroll_area.ensureWidgetVisible(self.page_items[index])

            # Ensure focus for keyboard navigation
            self.setFocus()

    def delete_current_page(self):
        """Delete the currently selected page."""
        if 0 <= self.current_index < len(self.page_items):
            # Remove widget
            item = self.page_items[self.current_index]
            self.container_layout.removeWidget(item)
            item.deleteLater()
            self.page_items.pop(self.current_index)

            # Emit signal
            self.page_deleted.emit(self.current_index)

            # Select next page or previous
            if len(self.page_items) > 0:
                new_index = min(self.current_index, len(self.page_items) - 1)
                self.current_index = -1  # Reset before selecting
                self.select_page(new_index)
            else:
                self.current_index = -1

            logger.info(f"Deleted page, {len(self.page_items)} pages remaining")

    def clear_all(self):
        """Clear all pages."""
        for item in self.page_items:
            self.container_layout.removeWidget(item)
            item.deleteLater()

        self.page_items.clear()
        self.current_index = -1

    def get_page_count(self) -> int:
        """Get total number of pages."""
        return len(self.page_items)

    def get_all_page_info(self) -> List[tuple]:
        """Get info for all pages in order."""
        return [item.get_page_info() for item in self.page_items]

    def keyPressEvent(self, event: QKeyEvent):
        """Handle keyboard events."""
        key = event.key()

        if key == Qt.Key_Up:
            if self.current_index > 0:
                self.select_page(self.current_index - 1)
        elif key == Qt.Key_Down:
            if self.current_index < len(self.page_items) - 1:
                self.select_page(self.current_index + 1)
        elif key in (Qt.Key_Delete, Qt.Key_Backspace):
            if self.current_index >= 0:
                self.delete_current_page()
        else:
            super().keyPressEvent(event)
