from typing import Optional, List
from pydantic import BaseModel
from .common import ApplicationStatus, ScreeningResult, StatusHistoryItem


class ApplicationCreate(BaseModel):
    job_id: str
    candidate_id: str
    resume_id: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    screening_result: Optional[ScreeningResult] = None
    screening_note: Optional[str] = None


class Application(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    resume_id: Optional[str] = None
    status: ApplicationStatus
    status_history: List[StatusHistoryItem] = []
    screening_result: Optional[ScreeningResult] = None
    screening_note: str = ""
    created_at: str
    updated_at: str
