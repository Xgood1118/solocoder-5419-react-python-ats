from typing import List, Dict, Optional
from pydantic import BaseModel


class InterviewStatsItem(BaseModel):
    interviewer_name: str
    count: int


class JobCycleStats(BaseModel):
    job_id: str
    job_title: str
    cycle_days: Optional[float] = None


class MonthlyStats(BaseModel):
    month: str
    job_cycle_stats: List[JobCycleStats] = []
    avg_cycle_days: Optional[float] = None
    offer_count: int = 0
    offer_accepted_count: int = 0
    offer_acceptance_rate: Optional[float] = None
    interview_stats: List[InterviewStatsItem] = []
