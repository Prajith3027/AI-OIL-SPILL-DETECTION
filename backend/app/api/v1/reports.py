"""
REST API endpoints for Module 19: Citizen / Fisherman Reporting Application.
Routes:
  POST  /api/v1/reports              - Submit a new citizen report (multipart with photo or form)
  POST  /api/v1/reports/submit       - JSON submission fallback
  GET   /api/v1/reports              - List and filter reports for admin review
  GET   /api/v1/reports/{id}         - Retrieve single report details
  PATCH /api/v1/reports/{id}/status  - Update review status workflow
  POST  /api/v1/reports/{id}/verify  - Trigger AI-assisted verification & incident linkage
"""
from __future__ import annotations
import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
    Query,
    status,
    HTTPException,
    Body,
)
from sqlalchemy.orm import Session

from app.core.auth import require_admin, require_citizen_or_admin
from app.database.session import get_db
from app.schemas.citizen_report import (
    CitizenReportCreate,
    CitizenReportAdminResponse,
    CitizenReportPublicResponse,
    CitizenReportStatusUpdate,
    CitizenReportVerifyRequest,
    CitizenReportListResponse,
)
from app.services.citizen_reporting.service import CitizenReportingService

router = APIRouter(prefix="/reports", tags=["Citizen Reporting"])


@router.post(
    "",
    response_model=CitizenReportPublicResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit citizen or fisherman oil spill report (with optional photo)",
    description=(
        "Accepts mobile/browser field reports. Validates photo file type (JPEG, PNG, WEBP), "
        "enforces 10MB file limit, records GPS coordinates, and assigns unique tracking code."
    ),
)
async def submit_citizen_report(
    latitude: float = Form(..., ge=-90.0, le=90.0, description="Observation latitude"),
    longitude: float = Form(..., ge=-180.0, le=180.0, description="Observation longitude"),
    description: str = Form(..., min_length=5, max_length=2000, description="Detailed description of visible spill/sheen"),
    incident_category: str = Form("SURFACE_SHEEN", description="Observation category"),
    location_description: Optional[str] = Form(None, description="Nearby landmark or coastal port"),
    estimated_spill_size: Optional[str] = Form(None, description="Estimated spread"),
    reporter_name: Optional[str] = Form(None, description="Optional reporter name"),
    reporter_contact: Optional[str] = Form(None, description="Optional private phone or email"),
    reporter_affiliation: Optional[str] = Form("CITIZEN", description="CITIZEN, FISHERMAN, etc."),
    photo: Optional[UploadFile] = File(None, description="Optional uploaded image evidence (JPG, PNG, WEBP)"),
    db: Session = Depends(get_db),
    _user=Depends(require_citizen_or_admin),
):
    photo_meta = None
    if photo and photo.filename:
        photo_meta = await CitizenReportingService.save_uploaded_photo(photo)

    payload = CitizenReportCreate(
        latitude=latitude,
        longitude=longitude,
        description=description,
        incident_category=incident_category,
        location_description=location_description,
        estimated_spill_size=estimated_spill_size,
        reporter_name=reporter_name,
        reporter_contact=reporter_contact,
        reporter_affiliation=reporter_affiliation,
        observed_at=datetime.now(timezone.utc),
    )

    report = CitizenReportingService.create_report(db, payload, photo_meta=photo_meta)
    return CitizenReportPublicResponse.model_validate(report)


@router.post(
    "/submit-json",
    response_model=CitizenReportPublicResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit citizen report via JSON payload (e.g. without binary multipart upload)",
)
def submit_citizen_report_json(
    payload: CitizenReportCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_citizen_or_admin),
):
    report = CitizenReportingService.create_report(db, payload, photo_meta=None)
    return CitizenReportPublicResponse.model_validate(report)


@router.get(
    "",
    response_model=CitizenReportListResponse,
    summary="List citizen reports for commander admin review",
    description="Returns reports sorted by creation date with status and category filtering.",
)
def list_citizen_reports(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (SUBMITTED, UNDER_REVIEW, VERIFIED, REJECTED, ALL)"),
    category_filter: Optional[str] = Query(None, alias="category", description="Filter by category"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=100.0, description="Filter minimum confidence"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    return CitizenReportingService.list_reports(
        db=db,
        status_filter=status_filter,
        category_filter=category_filter,
        min_confidence=min_confidence,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{id}",
    response_model=CitizenReportAdminResponse,
    summary="Get citizen report by ID",
)
def get_citizen_report(
    id: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    report = CitizenReportingService.get_report(db, id)
    return CitizenReportAdminResponse.model_validate(report)


@router.patch(
    "/{id}/status",
    response_model=CitizenReportAdminResponse,
    summary="Update report review status workflow",
    description="Transitions status: SUBMITTED -> UNDER_REVIEW -> AI_ASSISTED_VERIFICATION -> VERIFIED / REJECTED",
)
def update_report_status(
    id: str,
    payload: CitizenReportStatusUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    report = CitizenReportingService.update_status(db, id, payload)
    return CitizenReportAdminResponse.model_validate(report)


@router.post(
    "/{id}/verify",
    response_model=CitizenReportAdminResponse,
    summary="Trigger AI-assisted verification & incident integration",
    description=(
        "Executes multi-factor heuristic verification using keyword analysis, category index, "
        "photographic presence, and active incident proximity. "
        "If verified and auto_create_incident=True, automatically creates an active Incident "
        "and injects citizen report evidence into Multi-Source Verification (Module 17)."
    ),
)
def verify_report(
    id: str,
    payload: CitizenReportVerifyRequest = Body(default_factory=CitizenReportVerifyRequest),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    report = CitizenReportingService.verify_report(db, id, payload)
    return CitizenReportAdminResponse.model_validate(report)
