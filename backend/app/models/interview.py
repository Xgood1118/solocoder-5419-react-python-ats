from typing import Optional, List
from pydantic import BaseModel, Field
from .common import InterviewRound, InterviewStatus, OverallRating


class InterviewScore(BaseModel):
    technical_ability: int = Field(ge=1, le=5, default=3)
    communication_skill: int = Field(ge=1, le=5, default=3)
    cultural_fit: int = Field(ge=1, le=5, default=3)
    potential: int = Field(ge=1, le=5, default=3)
    stress_resistance: int = Field(ge=1, le=5, default=3)
    overall_rating: OverallRating = OverallRating.NEUTRAL
    comments: str = ""


class InterviewCreate(BaseModel):
    application_id: str
    round: InterviewRound
    interviewer_name: str
    scheduled_at: str
    location: str = ""
    weight: float = 1.0


class InterviewUpdate(BaseModel):
    scheduled_at: Optional[str] = None
    interviewer_name: Optional[str] = None
    location: Optional[str] = None
    status: Optional[InterviewStatus] = None
    weight: Optional[float] = None


class Interview(BaseModel):
    id: str
    application_id: str
    round: InterviewRound
    interviewer_name: str
    scheduled_at: str
    location: str = ""
    status: InterviewStatus = InterviewStatus.SCHEDULED
    score: Optional[InterviewScore] = None
    weight: float = 1.0
    created_at: str
    updated_at: str
