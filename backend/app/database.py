from datetime import datetime
from typing import Dict, List, Optional
from app.models import (
    Job, JobCreate,
    Candidate, CandidateCreate,
    Resume, ResumeCreate,
    Application, ApplicationCreate,
    Interview, InterviewCreate, InterviewScore,
    Offer, OfferCreate,
    Hire, HireCreate,
)
from app.models.common import ApplicationStatus, JobStatus, InterviewRound, OfferStatus


class InMemoryDB:
    def __init__(self):
        self.jobs: Dict[str, Job] = {}
        self.candidates: Dict[str, Candidate] = {}
        self.resumes: Dict[str, Resume] = {}
        self.applications: Dict[str, Application] = {}
        self.interviews: Dict[str, Interview] = {}
        self.offers: Dict[str, Offer] = {}
        self.hires: Dict[str, Hire] = {}
        self.talent_pool: Dict[str, Candidate] = {}
        self._counters = {
            "job": 0,
            "candidate": 0,
            "resume": 0,
            "application": 0,
            "interview": 0,
            "offer": 0,
            "hire": 0,
        }

    def _next_id(self, prefix: str) -> str:
        self._counters[prefix] += 1
        return f"{prefix}_{self._counters[prefix]:06d}"

    def create_job(self, job_create: JobCreate) -> Job:
        job_id = self._next_id("job")
        now = datetime.utcnow().isoformat()
        job = Job(
            id=job_id,
            status=JobStatus.OPEN,
            created_at=now,
            updated_at=now,
            **job_create.model_dump(),
        )
        self.jobs[job_id] = job
        return job

    def get_job(self, job_id: str) -> Optional[Job]:
        return self.jobs.get(job_id)

    def list_jobs(self, status: Optional[JobStatus] = None) -> List[Job]:
        jobs = list(self.jobs.values())
        if status:
            jobs = [j for j in jobs if j.status == status]
        return sorted(jobs, key=lambda j: j.created_at, reverse=True)

    def update_job_status(self, job_id: str, status: JobStatus) -> Optional[Job]:
        job = self.jobs.get(job_id)
        if not job:
            return None
        job.status = status
        job.updated_at = datetime.utcnow().isoformat()
        if status == JobStatus.CLOSED:
            job.closed_at = datetime.utcnow().isoformat()
        return job

    def create_candidate(self, candidate_create: CandidateCreate) -> Candidate:
        candidate_id = self._next_id("candidate")
        now = datetime.utcnow().isoformat()
        candidate = Candidate(
            id=candidate_id,
            created_at=now,
            updated_at=now,
            **candidate_create.model_dump(),
        )
        self.candidates[candidate_id] = candidate
        return candidate

    def get_candidate(self, candidate_id: str) -> Optional[Candidate]:
        return self.candidates.get(candidate_id)

    def list_candidates(self) -> List[Candidate]:
        return sorted(list(self.candidates.values()), key=lambda c: c.created_at, reverse=True)

    def create_resume(self, resume_create: ResumeCreate) -> Resume:
        resume_id = self._next_id("resume")
        now = datetime.utcnow().isoformat()
        resume = Resume(
            id=resume_id,
            created_at=now,
            **resume_create.model_dump(),
        )
        self.resumes[resume_id] = resume
        return resume

    def get_resume(self, resume_id: str) -> Optional[Resume]:
        return self.resumes.get(resume_id)

    def get_resumes_by_candidate(self, candidate_id: str) -> List[Resume]:
        return [r for r in self.resumes.values() if r.candidate_id == candidate_id]

    def create_application(self, app_create: ApplicationCreate) -> Application:
        app_id = self._next_id("app")
        now = datetime.utcnow().isoformat()
        status_history = [{"status": ApplicationStatus.APPLIED, "timestamp": now, "note": "简历投递"}]
        application = Application(
            id=app_id,
            status=ApplicationStatus.APPLIED,
            status_history=status_history,
            created_at=now,
            updated_at=now,
            **app_create.model_dump(),
        )
        self.applications[app_id] = application
        return application

    def get_application(self, app_id: str) -> Optional[Application]:
        return self.applications.get(app_id)

    def list_applications(self, job_id: Optional[str] = None, candidate_id: Optional[str] = None,
                          status: Optional[ApplicationStatus] = None) -> List[Application]:
        apps = list(self.applications.values())
        if job_id:
            apps = [a for a in apps if a.job_id == job_id]
        if candidate_id:
            apps = [a for a in apps if a.candidate_id == candidate_id]
        if status:
            apps = [a for a in apps if a.status == status]
        return sorted(apps, key=lambda a: a.created_at, reverse=True)

    def update_application_status(self, app_id: str, status: ApplicationStatus, note: str = "") -> Optional[Application]:
        app = self.applications.get(app_id)
        if not app:
            return None
        app.status = status
        app.updated_at = datetime.utcnow().isoformat()
        app.status_history.append({
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            "note": note,
        })
        return app

    def create_interview(self, interview_create: InterviewCreate) -> Interview:
        interview_id = self._next_id("interview")
        now = datetime.utcnow().isoformat()
        interview = Interview(
            id=interview_id,
            created_at=now,
            updated_at=now,
            **interview_create.model_dump(),
        )
        self.interviews[interview_id] = interview
        return interview

    def get_interview(self, interview_id: str) -> Optional[Interview]:
        return self.interviews.get(interview_id)

    def list_interviews(self, application_id: Optional[str] = None, interviewer: Optional[str] = None) -> List[Interview]:
        interviews = list(self.interviews.values())
        if application_id:
            interviews = [i for i in interviews if i.application_id == application_id]
        if interviewer:
            interviews = [i for i in interviews if i.interviewer_name == interviewer]
        return sorted(interviews, key=lambda i: i.scheduled_at, reverse=True)

    def submit_interview_score(self, interview_id: str, score: InterviewScore) -> Optional[Interview]:
        interview = self.interviews.get(interview_id)
        if not interview:
            return None
        interview.score = score
        interview.status = "completed"
        interview.updated_at = datetime.utcnow().isoformat()
        return interview

    def create_offer(self, offer_create: OfferCreate) -> Offer:
        offer_id = self._next_id("offer")
        now = datetime.utcnow().isoformat()
        offer = Offer(
            id=offer_id,
            status=OfferStatus.DRAFT,
            created_at=now,
            updated_at=now,
            **offer_create.model_dump(),
        )
        self.offers[offer_id] = offer
        return offer

    def get_offer(self, offer_id: str) -> Optional[Offer]:
        return self.offers.get(offer_id)

    def list_offers(self, application_id: Optional[str] = None, status: Optional[OfferStatus] = None) -> List[Offer]:
        offers = list(self.offers.values())
        if application_id:
            offers = [o for o in offers if o.application_id == application_id]
        if status:
            offers = [o for o in offers if o.status == status]
        return sorted(offers, key=lambda o: o.created_at, reverse=True)

    def update_offer_status(self, offer_id: str, status: OfferStatus, **kwargs) -> Optional[Offer]:
        offer = self.offers.get(offer_id)
        if not offer:
            return None
        offer.status = status
        offer.updated_at = datetime.utcnow().isoformat()
        for key, value in kwargs.items():
            if hasattr(offer, key) and value is not None:
                setattr(offer, key, value)
        return offer

    def create_hire(self, hire_create: HireCreate) -> Hire:
        hire_id = self._next_id("hire")
        now = datetime.utcnow().isoformat()
        hire = Hire(
            id=hire_id,
            created_at=now,
            **hire_create.model_dump(),
        )
        self.hires[hire_id] = hire
        candidate = self.candidates.get(hire.candidate_id)
        if candidate:
            self.talent_pool[candidate.id] = candidate
        return hire

    def get_hire(self, hire_id: str) -> Optional[Hire]:
        return self.hires.get(hire_id)

    def list_hires(self) -> List[Hire]:
        return sorted(list(self.hires.values()), key=lambda h: h.created_at, reverse=True)

    def list_talent_pool(self) -> List[Candidate]:
        return list(self.talent_pool.values())

    def get_talent_candidate(self, candidate_id: str) -> Optional[Candidate]:
        return self.talent_pool.get(candidate_id)


db = InMemoryDB()
