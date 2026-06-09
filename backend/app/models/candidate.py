from typing import Optional, List
from pydantic import BaseModel
from .common import SourceChannel


class Education(BaseModel):
    school: str = ""
    major: str = ""
    degree: str = ""
    start_date: str = ""
    end_date: str = ""


class WorkExperience(BaseModel):
    company: str = ""
    position: str = ""
    start_date: str = ""
    end_date: str = ""
    description: str = ""


class ProjectExperience(BaseModel):
    name: str = ""
    start_date: str = ""
    end_date: str = ""
    responsibilities: str = ""
    tech_stack: str = ""


class CandidateBase(BaseModel):
    name: str = ""
    phone: str = ""
    email: str = ""
    source_channel: Optional[SourceChannel] = None


class CandidateCreate(CandidateBase):
    pass


class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    education: Optional[List[Education]] = None
    work_experience: Optional[List[WorkExperience]] = None
    project_experience: Optional[List[ProjectExperience]] = None
    skills: Optional[List[str]] = None
    self_evaluation: Optional[str] = None


class Candidate(CandidateBase):
    id: str
    education: List[Education] = []
    work_experience: List[WorkExperience] = []
    project_experience: List[ProjectExperience] = []
    skills: List[str] = []
    self_evaluation: str = ""
    created_at: str
    updated_at: str
