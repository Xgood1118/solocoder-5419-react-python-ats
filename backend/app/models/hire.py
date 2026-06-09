from typing import Optional
from pydantic import BaseModel


class HireCreate(BaseModel):
    candidate_id: str
    job_id: str
    offer_id: str
    start_date: str
    department: str
    position: str


class Hire(BaseModel):
    id: str
    candidate_id: str
    job_id: str
    offer_id: str
    start_date: str
    department: str
    position: str
    created_at: str
    onboarding_completed: bool = False
