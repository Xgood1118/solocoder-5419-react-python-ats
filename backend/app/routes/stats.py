from fastapi import APIRouter
from typing import List, Dict, Optional
from datetime import datetime
from app.models import MonthlyStats, JobCycleStats, InterviewStatsItem, JobStatus, OfferStatus, InterviewStatus
from app.database import db

router = APIRouter(prefix="/api/stats", tags=["stats"])


def parse_iso_date(date_str: str) -> datetime:
    try:
        return datetime.fromisoformat(date_str)
    except:
        return datetime.utcnow()


@router.get("/monthly/{month}", response_model=MonthlyStats)
def get_monthly_stats(month: str):
    stats = MonthlyStats(month=month)

    jobs = db.list_jobs()
    cycle_stats = []
    total_cycle_days = 0
    closed_count = 0

    for job in jobs:
        if job.status == JobStatus.CLOSED and job.closed_at:
            created = parse_iso_date(job.created_at)
            closed = parse_iso_date(job.closed_at)
            cycle_days = (closed - created).days
            cycle_stats.append(JobCycleStats(
                job_id=job.id,
                job_title=job.title,
                cycle_days=cycle_days,
            ))
            total_cycle_days += cycle_days
            closed_count += 1

    stats.job_cycle_stats = cycle_stats
    if closed_count > 0:
        stats.avg_cycle_days = round(total_cycle_days / closed_count, 1)

    offers = db.list_offers()
    sent_offers = [o for o in offers if o.status in [OfferStatus.SENT, OfferStatus.ACCEPTED, OfferStatus.DECLINED, OfferStatus.LOCKED]]
    accepted_offers = [o for o in offers if o.status in [OfferStatus.ACCEPTED, OfferStatus.LOCKED]]

    stats.offer_count = len(sent_offers)
    stats.offer_accepted_count = len(accepted_offers)
    if len(sent_offers) > 0:
        stats.offer_acceptance_rate = round(len(accepted_offers) / len(sent_offers) * 100, 1)

    interviews = db.list_interviews()
    completed_interviews = [i for i in interviews if i.status == InterviewStatus.COMPLETED]
    interviewer_counts: Dict[str, int] = {}
    for interview in completed_interviews:
        name = interview.interviewer_name
        if name:
            interviewer_counts[name] = interviewer_counts.get(name, 0) + 1

    stats.interview_stats = [
        InterviewStatsItem(interviewer_name=name, count=count)
        for name, count in sorted(interviewer_counts.items(), key=lambda x: -x[1])
    ]

    return stats


@router.get("/overview")
def get_overview_stats():
    jobs = db.list_jobs()
    candidates = db.list_candidates()
    applications = list(db.applications.values())
    hires = db.list_hires()
    talent_pool = db.list_talent_pool()

    status_counts = {}
    for app in applications:
        status = app.status.value
        status_counts[status] = status_counts.get(status, 0) + 1

    return {
        "total_jobs": len(jobs),
        "open_jobs": len([j for j in jobs if j.status == JobStatus.OPEN]),
        "total_candidates": len(candidates),
        "total_applications": len(applications),
        "total_hires": len(hires),
        "talent_pool_size": len(talent_pool),
        "application_status_counts": status_counts,
    }


@router.get("/interviewers")
def get_interviewer_stats():
    interviews = db.list_interviews()
    completed = [i for i in interviews if i.status == InterviewStatus.COMPLETED]

    interviewer_data: Dict[str, dict] = {}
    for interview in completed:
        name = interview.interviewer_name
        if not name:
            continue
        if name not in interviewer_data:
            interviewer_data[name] = {"count": 0, "rounds": {}}
        interviewer_data[name]["count"] += 1
        rnd = interview.round.value
        interviewer_data[name]["rounds"][rnd] = interviewer_data[name]["rounds"].get(rnd, 0) + 1

    result = [
        {"name": name, "count": data["count"], "rounds": data["rounds"]}
        for name, data in sorted(interviewer_data.items(), key=lambda x: -x[1]["count"])
    ]
    return result
