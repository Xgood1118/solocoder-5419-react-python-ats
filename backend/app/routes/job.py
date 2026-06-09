from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models import Job, JobCreate, JobUpdate, JobStatus
from app.database import db

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("", response_model=List[Job])
def list_jobs(status: Optional[JobStatus] = None):
    return db.list_jobs(status=status)


@router.post("", response_model=Job)
def create_job(job_create: JobCreate):
    return db.create_job(job_create)


@router.get("/{job_id}", response_model=Job)
def get_job(job_id: str):
    job = db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="职位不存在")
    return job


@router.put("/{job_id}", response_model=Job)
def update_job(job_id: str, job_update: JobUpdate):
    job = db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="职位不存在")

    update_data = job_update.model_dump(exclude_unset=True)
    if "status" in update_data:
        job = db.update_job_status(job_id, update_data["status"])
        update_data.pop("status")

    for key, value in update_data.items():
        setattr(job, key, value)
    job.updated_at = __import__("datetime").datetime.utcnow().isoformat()
    return job


@router.post("/{job_id}/close", response_model=Job)
def close_job(job_id: str):
    job = db.update_job_status(job_id, JobStatus.CLOSED)
    if not job:
        raise HTTPException(status_code=404, detail="职位不存在")
    return job


@router.post("/{job_id}/archive", response_model=Job)
def archive_job(job_id: str):
    job = db.update_job_status(job_id, JobStatus.ARCHIVED)
    if not job:
        raise HTTPException(status_code=404, detail="职位不存在")
    return job


@router.post("/{job_id}/reopen", response_model=Job)
def reopen_job(job_id: str):
    job = db.update_job_status(job_id, JobStatus.OPEN)
    if not job:
        raise HTTPException(status_code=404, detail="职位不存在")
    return job
