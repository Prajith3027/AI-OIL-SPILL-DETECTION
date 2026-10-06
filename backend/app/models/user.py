"""
Authentication & RBAC models.

users                 - citizen / admin accounts (bcrypt password hash only)
citizen_report_events - public-safe status timeline for citizen reports
public_alerts         - authority-issued, public-safe emergency alerts
investigations        - admin vessel investigations opened from an incident/report
vessel_scores         - persisted explainable vessel-ranking results
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Float, DateTime, Text, Boolean, ForeignKey, JSON, Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.session import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


ROLE_CITIZEN = "citizen"
ROLE_ADMIN = "admin"
VALID_ROLES = {ROLE_CITIZEN, ROLE_ADMIN}


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(128), nullable=False)
    email = Column(String(254), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(16), nullable=False, default=ROLE_CITIZEN, index=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    last_login_at = Column(DateTime(timezone=True), nullable=True)


class CitizenReportEvent(Base):
    """Timeline entry for a citizen report. Only is_public entries are shown to citizens."""
    __tablename__ = "citizen_report_events"

    id = Column(String(36), primary_key=True, default=_uuid)
    report_id = Column(
        UUID(as_uuid=False),
        ForeignKey("citizen_reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(String(64), nullable=False)
    note = Column(Text, nullable=True)
    is_public = Column(Boolean, nullable=False, default=True)
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)


class PublicAlert(Base):
    __tablename__ = "public_alerts"

    id = Column(String(36), primary_key=True, default=_uuid)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=True)
    alert_type = Column(String(32), nullable=False, default="ENVIRONMENTAL_ALERT")
    severity = Column(String(16), nullable=False, default="LOW")      # LOW|MEDIUM|HIGH|CRITICAL
    status = Column(String(16), nullable=False, default="ACTIVE", index=True)  # ACTIVE|RESOLVED|DRAFT
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(36), primary_key=True, default=_uuid)
    incident_id = Column(
        UUID(as_uuid=False), ForeignKey("incidents.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    report_id = Column(
        UUID(as_uuid=False), ForeignKey("citizen_reports.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    title = Column(String(200), nullable=False)
    status = Column(String(24), nullable=False, default="OPEN")  # OPEN|IN_PROGRESS|CLOSED
    notes = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)

    scores = relationship("VesselScore", back_populates="investigation", cascade="all, delete-orphan")


class VesselScore(Base):
    __tablename__ = "vessel_scores"
    __table_args__ = (Index("ix_vessel_scores_inv_rank", "investigation_id", "rank"),)

    id = Column(String(36), primary_key=True, default=_uuid)
    investigation_id = Column(
        String(36), ForeignKey("investigations.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    mmsi = Column(String(16), nullable=False)
    vessel_name = Column(String(128), nullable=False)
    rank = Column(Float, nullable=False)
    investigation_score = Column(Float, nullable=False)   # 0-100
    breakdown = Column(JSON, nullable=True)               # per-factor score + reasons
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)

    investigation = relationship("Investigation", back_populates="scores")
