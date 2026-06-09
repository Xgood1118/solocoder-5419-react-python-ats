import logging
from pathlib import Path
from PIL import Image
from app.config import TESSERACT_CMD

logger = logging.getLogger(__name__)


def parse_image(file_path: str) -> str:
    text = ""
    try:
        import pytesseract
        if TESSERACT_CMD:
            pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

        img = Image.open(file_path)
        try:
            text = pytesseract.image_to_string(img, lang="chi_sim+eng")
        except Exception as e:
            logger.warning(f"中文OCR失败，尝试英文: {e}")
            try:
                text = pytesseract.image_to_string(img, lang="eng")
            except Exception as e2:
                text = f"OCR解析失败: {str(e2)}"
    except ImportError:
        text = "OCR库未安装，请安装pytesseract和Tesseract"
    except Exception as e:
        text = f"图片解析错误: {str(e)}"
    return text
