from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models import (
    Offer, OfferCreate, OfferUpdate, OfferStatus,
    CounterOffer, ApplicationStatus, SalaryInfo,
)
from app.database import db

router = APIRouter(prefix="/api/offers", tags=["offers"])


@router.get("", response_model=List[Offer])
def list_offers(application_id: Optional[str] = None, status: Optional[OfferStatus] = None):
    return db.list_offers(application_id=application_id, status=status)


@router.post("", response_model=Offer)
def create_offer(offer_create: OfferCreate):
    app = db.get_application(offer_create.application_id)
    if not app:
        raise HTTPException(status_code=404, detail="申请不存在")

    offer = db.create_offer(offer_create)
    db.update_application_status(offer_create.application_id, ApplicationStatus.OFFER, "创建Offer")
    return offer


@router.get("/{offer_id}", response_model=Offer)
def get_offer(offer_id: str):
    offer = db.get_offer(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer不存在")
    return offer


@router.put("/{offer_id}", response_model=Offer)
def update_offer(offer_id: str, offer_update: OfferUpdate):
    offer = db.get_offer(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer不存在")

    if offer.status == OfferStatus.LOCKED:
        raise HTTPException(status_code=400, detail="Offer已锁定，无法修改")

    update_data = offer_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(offer, key, value)
    from datetime import datetime
    offer.updated_at = datetime.utcnow().isoformat()
    return offer


@router.post("/{offer_id}/send", response_model=Offer)
def send_offer(offer_id: str):
    offer = db.get_offer(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer不存在")
    if offer.status != OfferStatus.DRAFT:
        raise HTTPException(status_code=400, detail="只有草稿状态的Offer可以发送")

    offer = db.update_offer_status(offer_id, OfferStatus.SENT)
    db.update_application_status(offer.application_id, ApplicationStatus.OFFER, "Offer已发送")
    return offer


@router.post("/{offer_id}/accept", response_model=Offer)
def accept_offer(offer_id: str):
    offer = db.get_offer(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer不存在")
    if offer.status not in [OfferStatus.SENT, OfferStatus.COUNTER_OFFER]:
        raise HTTPException(status_code=400, detail="当前状态无法接受Offer")

    offer = db.update_offer_status(offer_id, OfferStatus.ACCEPTED)
    db.update_application_status(offer.application_id, ApplicationStatus.OFFER_ACCEPTED, "候选人接受Offer")
    return offer


@router.post("/{offer_id}/decline", response_model=Offer)
def decline_offer(offer_id: str, reason: str = ""):
    offer = db.get_offer(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer不存在")
    if offer.status not in [OfferStatus.SENT, OfferStatus.COUNTER_OFFER]:
        raise HTTPException(status_code=400, detail="当前状态无法拒绝Offer")

    offer = db.update_offer_status(offer_id, OfferStatus.DECLINED, candidate_feedback=reason)
    db.update_application_status(offer.application_id, ApplicationStatus.OFFER_DECLINED, f"候选人拒绝Offer: {reason}")
    return offer


@router.post("/{offer_id}/counter", response_model=Offer)
def counter_offer(offer_id: str, counter: CounterOffer):
    offer = db.get_offer(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer不存在")
    if offer.status != OfferStatus.SENT:
        raise HTTPException(status_code=400, detail="只有已发送的Offer可以还价")

    if counter.salary:
        offer.counter_offer = counter.salary
    offer.status = OfferStatus.COUNTER_OFFER
    offer.candidate_feedback = counter.notes
    from datetime import datetime
    offer.updated_at = datetime.utcnow().isoformat()

    db.update_application_status(offer.application_id, ApplicationStatus.OFFER_NEGOTIATING, f"候选人还价: {counter.notes}")
    return offer


@router.post("/{offer_id}/counter/accept", response_model=Offer)
def accept_counter_offer(offer_id: str):
    offer = db.get_offer(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer不存在")
    if offer.status != OfferStatus.COUNTER_OFFER:
        raise HTTPException(status_code=400, detail="只有还价状态的Offer可以接受还价")

    if offer.counter_offer:
        offer.salary = offer.counter_offer
    offer.counter_offer = None
    offer.status = OfferStatus.ACCEPTED
    from datetime import datetime
    offer.updated_at = datetime.utcnow().isoformat()

    db.update_application_status(offer.application_id, ApplicationStatus.OFFER_ACCEPTED, "HR接受还价，Offer确认")
    return offer


@router.post("/{offer_id}/counter/reject", response_model=Offer)
def reject_counter_offer(offer_id: str):
    offer = db.get_offer(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer不存在")
    if offer.status != OfferStatus.COUNTER_OFFER:
        raise HTTPException(status_code=400, detail="只有还价状态的Offer可以拒绝还价")

    offer.counter_offer = None
    offer.status = OfferStatus.SENT
    from datetime import datetime
    offer.updated_at = datetime.utcnow().isoformat()

    return offer


@router.post("/{offer_id}/lock", response_model=Offer)
def lock_offer(offer_id: str):
    offer = db.get_offer(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer不存在")
    if offer.status != OfferStatus.ACCEPTED:
        raise HTTPException(status_code=400, detail="只有已接受的Offer可以锁定")

    offer = db.update_offer_status(offer_id, OfferStatus.LOCKED)
    return offer
