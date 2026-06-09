from enum import Enum
from typing import Optional
from pydantic import BaseModel


class JobStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    ARCHIVED = "archived"


class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    SCREENING_PASS = "screening_pass"
    SCREENING_FAIL = "screening_fail"
    SCREENING_PENDING = "screening_pending"
    INTERVIEW_FIRST = "interview_first"
    INTERVIEW_SECOND = "interview_second"
    INTERVIEW_THIRD = "interview_third"
    INTERVIEW_HR = "interview_hr"
    INTERVIEW_PASS = "interview_pass"
    INTERVIEW_FAIL = "interview_fail"
    OFFER = "offer"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_DECLINED = "offer_declined"
    OFFER_NEGOTIATING = "offer_negotiating"
    HIRED = "hired"


class InterviewRound(str, Enum):
    FIRST_TECH = "first_tech"
    SECOND_TECH = "second_tech"
    THIRD_TECH = "third_tech"
    HR = "hr"


class InterviewStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class OfferStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    COUNTER_OFFER = "counter_offer"
    LOCKED = "locked"


class ResumeFileType(str, Enum):
    PDF = "pdf"
    DOCX = "docx"
    IMAGE = "image"


class SourceChannel(str, Enum):
    EMAIL = "email"
    RECRUITMENT_PLATFORM = "recruitment_platform"
    REFERRAL = "referral"


class ScreeningResult(str, Enum):
    MATCH = "match"
    NOT_MATCH = "not_match"
    PENDING = "pending"


class OverallRating(str, Enum):
    STRONG_RECOMMEND = "strong_recommend"
    RECOMMEND = "recommend"
    NEUTRAL = "neutral"
    NOT_RECOMMEND = "not_recommend"


class StatusHistoryItem(BaseModel):
    status: str
    timestamp: str
    note: Optional[str] = ""
