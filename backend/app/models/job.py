from typing import Optional, List
from pydantic import BaseModel, Field
from .common import JobStatus


class JobBase(BaseModel):
    title: str
    department: str
    level: str
    location: str
    salary_range: str
    responsibilities: str
    requirements: str


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    level: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    responsibilities: Optional[str] = None
    requirements: Optional[str] = None
    status: Optional[JobStatus] = None


class Job(JobBase):
    id: str
    status: JobStatus = JobStatus.OPEN
    created_at: str
    updated_at: str
    closed_at: Optional[str] = None
