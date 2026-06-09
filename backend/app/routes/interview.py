from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from app.models import (
    Interview, InterviewCreate, InterviewUpdate, InterviewScore,
    InterviewRound, InterviewStatus, ApplicationStatus, OverallRating,
)
from app.database import db

router = APIRouter(prefix="/api/interviews", tags=["interviews"])


@router.get("", response_model=List[Interview])
def list_interviews(application_id: Optional[str] = None, interviewer: Optional[str] = None):
    return db.list_interviews(application_id=application_id, interviewer=interviewer)


@router.post("", response_model=Interview)
def create_interview(interview_create: InterviewCreate):
    app = db.get_application(interview_create.application_id)
    if not app:
        raise HTTPException(status_code=404, detail="申请不存在")

    if interview_create.weight <= 0:
        interview_create.weight = 1.0

    interview = db.create_interview(interview_create)

    if interview_create.round == InterviewRound.FIRST_TECH:
        db.update_application_status(interview_create.application_id, ApplicationStatus.INTERVIEW_FIRST, "安排一面")
    elif interview_create.round == InterviewRound.SECOND_TECH:
        db.update_application_status(interview_create.application_id, ApplicationStatus.INTERVIEW_SECOND, "安排二面")
    elif interview_create.round == InterviewRound.THIRD_TECH:
        db.update_application_status(interview_create.application_id, ApplicationStatus.INTERVIEW_THIRD, "安排三面")
    elif interview_create.round == InterviewRound.HR:
        db.update_application_status(interview_create.application_id, ApplicationStatus.INTERVIEW_HR, "安排HR面")

    return interview


@router.get("/{interview_id}", response_model=Interview)
def get_interview(interview_id: str):
    interview = db.get_interview(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="面试不存在")
    return interview


@router.put("/{interview_id}", response_model=Interview)
def update_interview(interview_id: str, interview_update: InterviewUpdate):
    interview = db.get_interview(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="面试不存在")

    update_data = interview_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(interview, key, value)
    from datetime import datetime
    interview.updated_at = datetime.utcnow().isoformat()
    return interview


@router.post("/{interview_id}/score", response_model=Interview)
def submit_score(interview_id: str, score: InterviewScore):
    interview = db.submit_interview_score(interview_id, score)
    if not interview:
        raise HTTPException(status_code=404, detail="面试不存在")
    return interview


@router.get("/application/{app_id}/weighted-score")
def get_weighted_score(app_id: str) -> Dict[str, Any]:
    app = db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="申请不存在")

    interviews = db.list_interviews(application_id=app_id)
    completed_interviews = [i for i in interviews if i.status == InterviewStatus.COMPLETED and i.score]

    if not completed_interviews:
        return {
            "total_weight": 0,
            "weighted_score": None,
            "dimension_scores": {},
            "interviews": [],
            "overall_rating": None,
        }

    total_weight = sum(i.weight for i in completed_interviews)
    if total_weight == 0:
        total_weight = len(completed_interviews)
        for i in completed_interviews:
            i.weight = 1.0

    dimensions = ["technical_ability", "communication_skill", "cultural_fit", "potential", "stress_resistance"]
    dimension_scores = {}

    for dim in dimensions:
        weighted_sum = sum(getattr(i.score, dim) * i.weight for i in completed_interviews)
        dimension_scores[dim] = round(weighted_sum / total_weight, 2)

    overall_score = sum(dimension_scores.values()) / len(dimensions)

    if overall_score >= 4.2:
        overall_rating = OverallRating.STRONG_RECOMMEND
    elif overall_score >= 3.5:
        overall_rating = OverallRating.RECOMMEND
    elif overall_score >= 2.5:
        overall_rating = OverallRating.NEUTRAL
    else:
        overall_rating = OverallRating.NOT_RECOMMEND

    return {
        "total_weight": total_weight,
        "weighted_score": round(overall_score, 2),
        "dimension_scores": dimension_scores,
        "overall_rating": overall_rating.value,
        "interviews": [
            {
                "id": i.id,
                "round": i.round.value,
                "interviewer": i.interviewer_name,
                "weight": i.weight,
                "score": i.score.model_dump() if i.score else None,
            }
            for i in completed_interviews
        ],
    }
