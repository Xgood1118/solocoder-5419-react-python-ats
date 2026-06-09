from pathlib import Path
from app.models import ResumeParsedResult, ResumeFileType
from app.utils.pdf_parser import parse_pdf
from app.utils.docx_parser import parse_docx
from app.utils.image_parser import parse_image
from app.utils.field_extractor import FieldExtractor


class ResumeParserService:
    def __init__(self):
        self._image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tiff", ".webp"}

    def detect_file_type(self, file_name: str) -> ResumeFileType:
        ext = Path(file_name).suffix.lower()
        if ext == ".pdf":
            return ResumeFileType.PDF
        elif ext == ".docx" or ext == ".doc":
            return ResumeFileType.DOCX
        elif ext in self._image_extensions:
            return ResumeFileType.IMAGE
        else:
            return ResumeFileType.PDF

    def extract_text(self, file_path: str, file_type: ResumeFileType) -> str:
        if file_type == ResumeFileType.PDF:
            return parse_pdf(file_path)
        elif file_type == ResumeFileType.DOCX:
            return parse_docx(file_path)
        elif file_type == ResumeFileType.IMAGE:
            return parse_image(file_path)
        else:
            return ""

    def parse_resume(self, file_path: str, file_type: ResumeFileType) -> ResumeParsedResult:
        text = self.extract_text(file_path, file_type)
        if not text or text.startswith("错误"):
            return ResumeParsedResult(raw_text=text or "解析失败")

        extractor = FieldExtractor(text)
        return extractor.extract_all()


resume_parser = ResumeParserService()
