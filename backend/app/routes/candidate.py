from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models import (
    Candidate, CandidateCreate, CandidateUpdate,
    Application, ApplicationStatus, SourceChannel,
)
from app.database import db

router = APIRouter(prefix="/api/candidates", tags=["candidates"])


@router.get("", response_model=List[Candidate])
def list_candidates():
    return db.list_candidates()


@router.post("", response_model=Candidate)
def create_candidate(candidate_create: CandidateCreate):
    return db.create_candidate(candidate_create)


@router.get("/{candidate_id}", response_model=Candidate)
def get_candidate(candidate_id: str):
    candidate = db.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")
    return candidate


@router.put("/{candidate_id}", response_model=Candidate)
def update_candidate(candidate_id: str, candidate_update: CandidateUpdate):
    candidate = db.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")

    update_data = candidate_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(candidate, key, value)
    from datetime import datetime
    candidate.updated_at = datetime.utcnow().isoformat()
    return candidate


@router.get("/{candidate_id}/applications", response_model=List[Application])
def get_candidate_applications(candidate_id: str):
    candidate = db.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")
    return db.list_applications(candidate_id=candidate_id)
