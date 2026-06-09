from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models import (
    Application, ApplicationCreate, ApplicationStatus,
    ScreeningResult,
)
from app.database import db

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.get("", response_model=List[Application])
def list_applications(
    job_id: Optional[str] = None,
    candidate_id: Optional[str] = None,
    status: Optional[ApplicationStatus] = None,
):
    return db.list_applications(job_id=job_id, candidate_id=candidate_id, status=status)


@router.post("", response_model=Application)
def create_application(app_create: ApplicationCreate):
    job = db.get_job(app_create.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="职位不存在")
    candidate = db.get_candidate(app_create.candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")
    resume = db.get_resume(app_create.resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")

    return db.create_application(app_create)


@router.get("/{app_id}", response_model=Application)
def get_application(app_id: str):
    app = db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="申请不存在")
    return app


@router.post("/{app_id}/screen", response_model=Application)
def screen_application(
    app_id: str,
    result: ScreeningResult,
    note: str = "",
):
    app = db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="申请不存在")

    app.screening_result = result
    app.screening_note = note

    if result == ScreeningResult.MATCH:
        new_status = ApplicationStatus.SCREENING_PASS
    elif result == ScreeningResult.NOT_MATCH:
        new_status = ApplicationStatus.SCREENING_FAIL
    else:
        new_status = ApplicationStatus.SCREENING_PENDING

    return db.update_application_status(app_id, new_status, f"初筛: {result.value} - {note}")


@router.put("/{app_id}/status", response_model=Application)
def update_status(
    app_id: str,
    status: ApplicationStatus,
    note: str = "",
):
    app = db.update_application_status(app_id, status, note)
    if not app:
        raise HTTPException(status_code=404, detail="申请不存在")
    return app
