from fastapi import APIRouter, HTTPException
from typing import List
from app.models import (
    Hire, HireCreate, Candidate, ApplicationStatus,
)
from app.database import db

router = APIRouter(prefix="/api/hire", tags=["hire"])


@router.get("/hires", response_model=List[Hire])
def list_hires():
    return db.list_hires()


@router.post("/hires", response_model=Hire)
def create_hire(hire_create: HireCreate):
    candidate = db.get_candidate(hire_create.candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")

    job = db.get_job(hire_create.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="职位不存在")

    offer = db.get_offer(hire_create.offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer不存在")

    hire = db.create_hire(hire_create)

    applications = db.list_applications(candidate_id=hire_create.candidate_id, job_id=hire_create.job_id)
    for app in applications:
        db.update_application_status(app.id, ApplicationStatus.HIRED, "已入职")

    return hire


@router.get("/hires/{hire_id}", response_model=Hire)
def get_hire(hire_id: str):
    hire = db.get_hire(hire_id)
    if not hire:
        raise HTTPException(status_code=404, detail="入职记录不存在")
    return hire


@router.post("/hires/{hire_id}/complete", response_model=Hire)
def complete_onboarding(hire_id: str):
    hire = db.get_hire(hire_id)
    if not hire:
        raise HTTPException(status_code=404, detail="入职记录不存在")
    hire.onboarding_completed = True
    return hire


@router.get("/talent-pool", response_model=List[Candidate])
def list_talent_pool():
    return db.list_talent_pool()


@router.get("/talent-pool/{candidate_id}", response_model=Candidate)
def get_talent_candidate(candidate_id: str):
    candidate = db.get_talent_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="人才库中找不到该候选人")
    return candidate


@router.post("/talent-pool/{candidate_id}/activate")
def activate_candidate(candidate_id: str, job_id: str):
    candidate = db.get_talent_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="人才库中找不到该候选人")

    job = db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="职位不存在")

    return {"message": "候选人已激活到新职位", "candidate_id": candidate_id, "job_id": job_id}
