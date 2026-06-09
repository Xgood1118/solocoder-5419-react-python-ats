import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", "8000"))
RESUME_STORAGE_PATH = Path(os.getenv("RESUME_STORAGE_PATH", "./resumes"))
TESSERACT_CMD = os.getenv("TESSERACT_CMD", "")

RESUME_STORAGE_PATH.mkdir(parents=True, exist_ok=True)
