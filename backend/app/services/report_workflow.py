"""
Report workflow helpers shared by citizen and admin routers:
status vocabulary, public-safe serialisation, timeline events, media validation.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.citizen_report import CitizenReport
from app.models.user import CitizenReportEvent

REPORT_STATUSES = {
    "SUBMITTED", "UNDER_REVIEW", "AI_ASSISTED_VERIFICATION", "VERIFIED",
    "REJECTED", "INVESTIGATION_STARTED", "RESOLVED",
}
SEVERITIES = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}

DEFAULT_PUBLIC_NOTES = {
    "SUBMITTED": "Report submitted.",
    "UNDER_REVIEW": "Report is being reviewed by the authorities.",
    "VERIFIED": "Report verified by the authorities.",
    "REJECTED": "Report could not be verified.",
    "INVESTIGATION_STARTED": "An official investigation has started.",
    "RESOLVED": "Incident resolved.",
}

VIDEO_MIME = {"video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov"}
UPLOAD_DIR = Path("uploads/reports")


def add_event(db: Session, report_id: str, status_: str, note: Optional[str],
              actor_id: Optional[str] = None, is_public: bool = True) -> CitizenReportEvent:
    ev = CitizenReportEvent(
        id=str(uuid.uuid4()), report_id=report_id, status=status_,
        note=note, is_public=is_public, actor_id=actor_id,
    )
    db.add(ev)
    return ev


def _looks_like_video(head: bytes, ctype: str) -> bool:
    if ctype == "video/webm":
        return head[:4] == b"\x1a\x45\xdf\xa3"
    return head[4:8] == b"ftyp"  # mp4 / mov


async def save_video(file: UploadFile) -> str:
    """Validate (type, magic bytes, size) and store; returns the public relative URL."""
    ctype = (file.content_type or "").lower()
    if ctype not in VIDEO_MIME:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unsupported video type. Allowed: MP4, WEBM, MOV.")
    limit = get_settings().max_video_bytes
    content = await file.read(limit + 1)
    if len(content) > limit:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            f"Video exceeds the {limit // (1024 * 1024)}MB limit.")
    if len(content) < 100 or not _looks_like_video(content[:16], ctype):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Uploaded video is empty or not a valid video file.")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    name = f"vid_{datetime.now(timezone.utc).strftime('%Y%m%d')}_{uuid.uuid4().hex[:12]}{VIDEO_MIME[ctype]}"
    (UPLOAD_DIR / name).write_bytes(content)
    return f"/uploads/reports/{name}"


def citizen_report_view(db: Session, r: CitizenReport) -> dict:
    """Public-safe projection for the owning citizen. Excludes AI notes, internal notes, incident link."""
    events = db.execute(
        select(CitizenReportEvent)
        .where(CitizenReportEvent.report_id == r.id, CitizenReportEvent.is_public == True)  # noqa: E712
        .order_by(CitizenReportEvent.created_at)
    ).scalars().all()
    return {
        "id": r.id,
        "report_code": r.report_code,
        "latitude": r.latitude,
        "longitude": r.longitude,
        "location_description": r.location_description,
        "description": r.description,
        "incident_category": r.incident_category,
        "severity": r.severity,
        "observed_at": r.observed_at,
        "status": r.status,
        "photo_url": r.photo_url,
        "video_url": r.video_url,
        "public_remarks": r.public_remarks,
        "created_at": r.created_at,
        "timeline": [
            {"status": e.status, "note": e.note, "at": e.created_at} for e in events
        ],
    }


def admin_report_view(db: Session, r: CitizenReport, reporter_name: Optional[str] = None) -> dict:
    data = citizen_report_view(db, r)
    data.update({
        "citizen": reporter_name or r.reporter_name,
        "reporter_contact": r.reporter_contact,
        "user_id": r.user_id,
        "verification_confidence": r.verification_confidence,
        "ai_analysis_notes": r.ai_analysis_notes,
        "review_notes": r.review_notes,
        "reviewed_by": r.reviewed_by,
        "reviewed_at": r.reviewed_at,
        "linked_incident_id": r.linked_incident_id,
    })
    return data
