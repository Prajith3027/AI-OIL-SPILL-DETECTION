"""
Pydantic schemas for Module 19: Citizen / Fisherman Reporting Application.
Defines public input, public response (privacy-masked), admin response, and status/verify workflows.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict


class CitizenReportBase(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Observation latitude (-90 to 90)")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Observation longitude (-180 to 180)")
    description: str = Field(..., min_length=5, max_length=2000, description="Detailed description of the observation")
    incident_category: str = Field(
        default="SURFACE_SHEEN",
        description="Category: SURFACE_SHEEN, TAR_BALLS, HEAVY_BLACK_OIL, VESSEL_DISCHARGE, SHORELINE_COATING, OTHER",
    )
    location_description: Optional[str] = Field(None, max_length=255, description="General coastal location name or landmark")
    estimated_spill_size: Optional[str] = Field(None, max_length=64, description="Approximate visible spread")
    reporter_name: Optional[str] = Field(None, max_length=128, description="Optional reporter name")
    reporter_affiliation: Optional[str] = Field("CITIZEN", max_length=64, description="CITIZEN, FISHERMAN, PORT_STAFF, TOURIST")
    observed_at: Optional[datetime] = Field(None, description="Time of observation (defaults to current UTC)")

    @field_validator("incident_category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        valid = {"SURFACE_SHEEN", "TAR_BALLS", "HEAVY_BLACK_OIL", "VESSEL_DISCHARGE", "SHORELINE_COATING", "OTHER"}
        upper = v.upper()
        if upper not in valid:
            return "OTHER"
        return upper


class CitizenReportCreate(CitizenReportBase):
    """Payload for submitting a report via JSON or parsed form."""
    reporter_contact: Optional[str] = Field(None, max_length=128, description="Optional private phone number or email")
    photo_url: Optional[str] = Field(None, max_length=512, description="Uploaded photo URL or reference path")


class CitizenReportPublicResponse(BaseModel):
    """
    Public response schema.
    CRITICAL PRIVACY REQUIREMENT: reporter_contact is completely excluded or masked to protect private citizens.
    """
    id: str
    report_code: str
    latitude: float
    longitude: float
    location_description: Optional[str] = None
    photo_url: Optional[str] = None
    description: str
    incident_category: str
    estimated_spill_size: Optional[str] = None
    observed_at: datetime
    reporter_name: Optional[str] = None
    reporter_affiliation: Optional[str] = None
    status: str
    verification_confidence: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CitizenReportAdminResponse(BaseModel):
    """
    Detailed command operator / admin review schema.
    Includes private contact details, review history, and AI analysis notes.
    """
    id: str
    report_code: str
    latitude: float
    longitude: float
    location_description: Optional[str] = None
    photo_url: Optional[str] = None
    photo_filename: Optional[str] = None
    photo_content_type: Optional[str] = None
    photo_file_size_bytes: Optional[float] = None
    description: str
    incident_category: str
    estimated_spill_size: Optional[str] = None
    observed_at: datetime
    reporter_name: Optional[str] = None
    reporter_contact: Optional[str] = None
    reporter_affiliation: Optional[str] = None
    status: str
    verification_confidence: float
    ai_analysis_notes: Optional[str] = None
    linked_incident_id: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CitizenReportStatusUpdate(BaseModel):
    """Workflow state transition payload."""
    status: str = Field(..., description="Target status: SUBMITTED, UNDER_REVIEW, AI_ASSISTED_VERIFICATION, VERIFIED, REJECTED")
    reviewed_by: Optional[str] = Field("Command Operator", max_length=128)
    review_notes: Optional[str] = Field(None, max_length=1000)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid = {"SUBMITTED", "UNDER_REVIEW", "AI_ASSISTED_VERIFICATION", "VERIFIED", "REJECTED",
                 "INVESTIGATION_STARTED", "RESOLVED"}
        upper = v.upper()
        if upper not in valid:
            raise ValueError(f"Invalid status '{v}'. Must be one of {valid}")
        return upper


class CitizenReportVerifyRequest(BaseModel):
    """Trigger AI and contextual verification."""
    auto_create_incident: bool = Field(False, description="If true and report is verified, automatically creates an active Incident")
    link_incident_id: Optional[str] = Field(None, description="Optional existing incident ID to link this verified report to")
    operator_name: Optional[str] = Field("AI Automated Verifier", description="Authorizing operator or verifier")


class CitizenReportListResponse(BaseModel):
    items: list[CitizenReportAdminResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
