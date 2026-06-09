from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List
from pathlib import Path
from app.models import Resume, ResumeCreate, ResumeParsedResult, ResumeFileType
from app.database import db
from app.config import RESUME_STORAGE_PATH
from app.utils.resume_parser import resume_parser

router = APIRouter(prefix="/api/resumes", tags=["resumes"])


@router.get("", response_model=List[Resume])
def list_resumes(candidate_id: str = None):
    if candidate_id:
        return db.get_resumes_by_candidate(candidate_id)
    return list(db.resumes.values())


@router.get("/{resume_id}", response_model=Resume)
def get_resume(resume_id: str):
    resume = db.get_resume(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    return resume


@router.post("/upload", response_model=Resume)
async def upload_resume(
    candidate_id: str = Form(...),
    file: UploadFile = File(...),
):
    candidate = db.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")

    file_type = resume_parser.detect_file_type(file.filename)

    candidate_dir = RESUME_STORAGE_PATH / candidate_id
    candidate_dir.mkdir(parents=True, exist_ok=True)

    import uuid
    file_ext = Path(file.filename).suffix
    saved_name = f"{uuid.uuid4().hex}{file_ext}"
    file_path = candidate_dir / saved_name

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    resume_create = ResumeCreate(
        candidate_id=candidate_id,
        file_name=file.filename,
        file_type=file_type,
        file_path=str(file_path),
    )
    resume = db.create_resume(resume_create)
    return resume


@router.post("/{resume_id}/parse", response_model=Resume)
def parse_resume(resume_id: str):
    resume = db.get_resume(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")

    parsed_result = resume_parser.parse_resume(resume.file_path, resume.file_type)
    resume.parsed = True
    resume.parsed_result = parsed_result

    candidate = db.get_candidate(resume.candidate_id)
    if candidate and parsed_result:
        if parsed_result.name and not candidate.name:
            candidate.name = parsed_result.name
        if parsed_result.phone and not candidate.phone:
            candidate.phone = parsed_result.phone
        if parsed_result.email and not candidate.email:
            candidate.email = parsed_result.email
        if parsed_result.education:
            candidate.education = parsed_result.education
        if parsed_result.work_experience:
            candidate.work_experience = parsed_result.work_experience
        if parsed_result.project_experience:
            candidate.project_experience = parsed_result.project_experience
        if parsed_result.skills:
            candidate.skills = parsed_result.skills
        if parsed_result.self_evaluation:
            candidate.self_evaluation = parsed_result.self_evaluation
        from datetime import datetime
        candidate.updated_at = datetime.utcnow().isoformat()

    return resume


@router.get("/{resume_id}/parsed", response_model=ResumeParsedResult)
def get_parsed_result(resume_id: str):
    resume = db.get_resume(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    if not resume.parsed_result:
        raise HTTPException(status_code=404, detail="简历未解析")
    return resume.parsed_result
