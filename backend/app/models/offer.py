from typing import Optional, List
from pydantic import BaseModel
from .common import OfferStatus


class SalaryInfo(BaseModel):
    base_salary: str = ""
    performance_bonus: str = ""
    year_end_bonus: str = ""


class OfferCreate(BaseModel):
    application_id: str
    salary: SalaryInfo
    level: str
    start_date: str
    probation_period: str = "3个月"
    stock_options: str = ""
    notes: str = ""


class OfferUpdate(BaseModel):
    salary: Optional[SalaryInfo] = None
    level: Optional[str] = None
    start_date: Optional[str] = None
    probation_period: Optional[str] = None
    stock_options: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[OfferStatus] = None


class CounterOffer(BaseModel):
    salary: Optional[SalaryInfo] = None
    level: Optional[str] = None
    notes: str = ""


class Offer(BaseModel):
    id: str
    application_id: str
    salary: SalaryInfo
    level: str
    start_date: str
    probation_period: str = "3个月"
    stock_options: str = ""
    notes: str = ""
    status: OfferStatus
    candidate_feedback: str = ""
    counter_offer: Optional[SalaryInfo] = None
    created_at: str
    updated_at: str
