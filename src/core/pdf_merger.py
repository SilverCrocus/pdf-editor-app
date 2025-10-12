"""PDF merging functionality using pikepdf."""

import logging
from pathlib import Path
from typing import List, Union, Tuple

from pikepdf import Pdf, PdfError

logger = logging.getLogger(__name__)


class PDFMergerError(Exception):
    """Custom exception for PDF merger errors."""

    pass


class PDFMerger:
    """Handles merging of PDF files."""

    @staticmethod
    def merge_pdfs(
        input_files: List[Union[str, Path]], output_path: Union[str, Path]
    ) -> None:
        """
        Merge multiple PDF files into a single output file.

        Args:
            input_files: List of paths to PDF files to merge
            output_path: Path where the merged PDF should be saved

        Raises:
            PDFMergerError: If merging fails or files are invalid
        """
        if not input_files:
            raise PDFMergerError("No input files provided")

        if len(input_files) < 2:
            raise PDFMergerError("At least 2 PDF files are required for merging")

        try:
            pdf = Pdf.new()

            for file_path in input_files:
                file_path = Path(file_path)

                if not file_path.exists():
                    raise PDFMergerError(f"File not found: {file_path}")

                if not file_path.suffix.lower() == ".pdf":
                    raise PDFMergerError(f"Not a PDF file: {file_path}")

                try:
                    src = Pdf.open(file_path)
                    pdf.pages.extend(src.pages)
                    logger.info(f"Added {len(src.pages)} pages from {file_path}")
                except PdfError as e:
                    raise PDFMergerError(f"Failed to open {file_path}: {str(e)}")

            output_path = Path(output_path)
            pdf.save(output_path)
            logger.info(
                f"Successfully merged {len(input_files)} files to {output_path}"
            )

        except PdfError as e:
            raise PDFMergerError(f"PDF processing error: {str(e)}")
        except Exception as e:
            raise PDFMergerError(f"Unexpected error during merge: {str(e)}")

    @staticmethod
    def merge_pages(
        page_list: List[Tuple[Union[str, Path], int]], output_path: Union[str, Path]
    ) -> None:
        """
        Merge specific pages from multiple PDF files.

        Args:
            page_list: List of tuples (pdf_path, page_num) where page_num is 0-indexed
            output_path: Path where the merged PDF should be saved

        Raises:
            PDFMergerError: If merging fails or files are invalid
        """
        if not page_list:
            raise PDFMergerError("No pages provided")

        try:
            pdf = Pdf.new()
            opened_pdfs = {}

            for pdf_path, page_num in page_list:
                pdf_path = Path(pdf_path)

                if not pdf_path.exists():
                    raise PDFMergerError(f"File not found: {pdf_path}")

                # Open PDF if not already opened
                pdf_key = str(pdf_path)
                if pdf_key not in opened_pdfs:
                    try:
                        opened_pdfs[pdf_key] = Pdf.open(pdf_path)
                    except PdfError as e:
                        raise PDFMergerError(f"Failed to open {pdf_path}: {str(e)}")

                src = opened_pdfs[pdf_key]

                # Validate page number
                if page_num < 0 or page_num >= len(src.pages):
                    raise PDFMergerError(
                        f"Invalid page number {page_num} for {pdf_path}"
                    )

                # Add the specific page
                pdf.pages.append(src.pages[page_num])
                logger.info(f"Added page {page_num} from {pdf_path}")

            output_path = Path(output_path)
            pdf.save(output_path)
            logger.info(f"Successfully merged {len(page_list)} pages to {output_path}")

            # Close all opened PDFs
            for src in opened_pdfs.values():
                src.close()

        except PdfError as e:
            raise PDFMergerError(f"PDF processing error: {str(e)}")
        except Exception as e:
            raise PDFMergerError(f"Unexpected error during merge: {str(e)}")


def merge_pdfs(
    input_files: List[Union[str, Path]], output_path: Union[str, Path]
) -> None:
    """
    Convenience function to merge PDFs.

    Args:
        input_files: List of paths to PDF files to merge
        output_path: Path where the merged PDF should be saved
    """
    merger = PDFMerger()
    merger.merge_pdfs(input_files, output_path)
