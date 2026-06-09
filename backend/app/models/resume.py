from typing import Optional, List
from pydantic import BaseModel
from .common import ResumeFileType
from .candidate import Education, WorkExperience, ProjectExperience


class ResumeCreate(BaseModel):
    candidate_id: str
    file_name: str
    file_type: ResumeFileType
    file_path: str


class ResumeParsedResult(BaseModel):
    name: str = ""
    phone: str = ""
    email: str = ""
    education: List[Education] = []
    work_experience: List[WorkExperience] = []
    project_experience: List[ProjectExperience] = []
    skills: List[str] = []
    self_evaluation: str = ""
    raw_text: str = ""


class Resume(BaseModel):
    id: str
    candidate_id: str
    file_name: str
    file_type: ResumeFileType
    file_path: str
    parsed: bool = False
    parsed_result: Optional[ResumeParsedResult] = None
    created_at: str
