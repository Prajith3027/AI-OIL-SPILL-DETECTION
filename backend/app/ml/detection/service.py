"""
DetectionService — orchestrates ML model inference, database persistence,
file validation, and automatic incident escalation.
"""
from __future__ import annotations
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.incident_event import IncidentEvent
from app.models.detection import DetectionResult
from app.models.environmental_zone import EnvironmentalZone
from app.models.enums import IncidentStatus, IncidentSeverity, ZoneType
from app.gis.spatial_service import haversine_km
from app.ml.detection.real_model import RealModelAdapter
from app.ml.detection.demo_detector import DemoDetector
from app.schemas.detection import DetectionAnalyzeResponse
from app.schemas.risk import RiskCalculateRequest
from app.services.risk_engine import RiskEngine
from app.services.priority_engine import PriorityEngine

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB limit


def _calculate_severity(area_km2: float) -> IncidentSeverity:
    """Classify incident severity based on detected surface area."""
    if area_km2 >= 30.0:
        return IncidentSeverity.CRITICAL
    elif area_km2 >= 10.0:
        return IncidentSeverity.HIGH
    elif area_km2 >= 2.0:
        return IncidentSeverity.MODERATE
    else:
        return IncidentSeverity.LOW


def _calculate_risk_score(area_km2: float, confidence: float) -> float:
    """Calculate preliminary risk score based on spill area and model confidence."""
    base = confidence * 50.0
    area_contrib = min(area_km2, 100.0) * 0.48
    score = round(min(98.5, max(14.0, base + area_contrib)), 1)
    return score


class DetectionService:
    _real_model = RealModelAdapter()
    _demo_detector = DemoDetector()

    @classmethod
    def get_active_model(cls, is_file_upload: bool = False, demo_preset: Optional[str] = None):
        """
        Returns RealModelAdapter when real weights are available and:
          1) A custom file is uploaded, OR
          2) No explicit demo preset simulation is requested.
        Preserves DemoDetector for preset demonstrations.
        """
        if cls._real_model.is_available():
            if is_file_upload or not demo_preset:
                return cls._real_model
        return cls._demo_detector

    @classmethod
    async def analyze_image(
        cls,
        db: Session,
        file: Optional[UploadFile],
        latitude: float = 10.85,
        longitude: float = 79.90,
        timestamp: Optional[datetime] = None,
        demo_preset: Optional[str] = None,
    ) -> DetectionAnalyzeResponse:
        """
        Validates the incoming image file, runs inference via the active model,
        persists DetectionResult, and creates an Incident if oil spill is detected.
        """
        det_time = timestamp or datetime.now(timezone.utc)
        image_bytes: bytes = b""
        filename: str = "demo_capture.png"

        # 1. Handle file upload if provided
        if file is not None:
            filename = file.filename or "upload.png"
            # Validate extension
            import os
            ext = os.path.splitext(filename)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported image format '{ext}'. Supported formats: PNG, JPG, JPEG.",
                )

            # Read and validate size
            image_bytes = await file.read()
            if len(image_bytes) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded image file is empty (0 bytes).",
                )
            if len(image_bytes) > MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024*1024)} MB.",
                )
        else:
            # If no file uploaded, demo preset must be specified
            if not demo_preset:
                demo_preset = "sentinel_sar_slick"
            filename = f"{demo_preset}.png"
            image_bytes = demo_preset.encode("utf-8")

        # 2. Run inference using active detector
        model = cls.get_active_model(is_file_upload=(file is not None), demo_preset=demo_preset)
        prediction = model.predict(
            image_bytes=image_bytes,
            filename=filename,
            latitude=latitude,
            longitude=longitude,
            demo_preset=demo_preset,
        )

        incident_id: Optional[str] = None
        incident_code: Optional[str] = None
        severity_str: Optional[str] = None
        risk_score: Optional[float] = None
        priority_score: Optional[float] = None
        urgency_level: Optional[str] = None
        coastline_eta_hours: Optional[float] = None
        nearby_zones_count: int = 0

        # 3. If spill detected -> Orchestrate full Tier-1 pipeline: Detect -> Create -> GIS -> Risk -> Priority -> Timeline
        if prediction.detected:
            severity = _calculate_severity(prediction.spill_area_km2)
            severity_str = severity.value

            # Generate unique code
            rand_suffix = uuid.uuid4().hex[:6].upper()
            incident_code = f"DET-{det_time.strftime('%Y%m%d')}-{rand_suffix}"

            # Location point GeoJSON
            pt_geojson = json.dumps({"type": "Point", "coordinates": [longitude, latitude]})

            incident = Incident(
                id=str(uuid.uuid4()),
                incident_code=incident_code,
                status=IncidentStatus.DETECTED,
                severity=severity,
                risk_score=50.0,
                detection_confidence=prediction.confidence,
                spill_area_km2=prediction.spill_area_km2,
                latitude=latitude,
                longitude=longitude,
                location_geojson=pt_geojson,
                spill_geometry_geojson=prediction.geometry_geojson,
                description=f"[{prediction.model_name}] Automated detection ({prediction.confidence*100:.1f}% confidence, ~{prediction.spill_area_km2} km²).",
                source=prediction.details.get("sensor_type", "AI SATELLITE DETECTION"),
                detected_at=det_time,
            )
            db.add(incident)
            db.flush()
            incident_id = incident.id

            # Timeline Event 1: Detection
            event1 = IncidentEvent(
                id=str(uuid.uuid4()),
                incident_id=incident.id,
                event_type="SPILL_DETECTED_BY_AI",
                description=(
                    f"Spill detected by {prediction.model_name} with {prediction.confidence*100:.1f}% confidence. "
                    f"Surface slick area ~{prediction.spill_area_km2} km²."
                ),
                created_by="detection_service",
            )
            db.add(event1)

            # Spatial Analysis (Coastline & Environmental Zones)
            dist_coast = PriorityEngine.calculate_distance_to_coastline(latitude, longitude)
            coastline_eta_hours = PriorityEngine.calculate_coastline_eta_hours(dist_coast)

            zones = db.execute(select(EnvironmentalZone)).scalars().all()
            dist_prot = None
            dist_fish = None
            nearby_count = 0
            for z in zones:
                if z.latitude and z.longitude:
                    d = haversine_km(latitude, longitude, z.latitude, z.longitude)
                    if d <= 50.0:
                        nearby_count += 1
                    if z.zone_type == ZoneType.PROTECTED_AREA:
                        dist_prot = d if dist_prot is None else min(dist_prot, d)
                    elif z.zone_type == ZoneType.FISHING_ZONE:
                        dist_fish = d if dist_fish is None else min(dist_fish, d)

            nearby_zones_count = nearby_count

            # Timeline Event 2: GIS Spatial Proximity Analysis
            event2 = IncidentEvent(
                id=str(uuid.uuid4()),
                incident_id=incident.id,
                event_type="GIS_SPATIAL_ANALYSIS_COMPLETED",
                description=(
                    f"Spatial analysis completed: Distance to coastline is {dist_coast:.1f} km "
                    f"(estimated arrival ETA ~{coastline_eta_hours:.1f}h). Found {nearby_count} marine/coastal zones within 50 km."
                ),
                created_by="gis_engine",
            )
            db.add(event2)

            # Risk Engine Calculation
            risk_assessment = RiskEngine.calculate(
                db,
                RiskCalculateRequest(
                    incident_id=incident.id,
                    spill_area_km2=prediction.spill_area_km2,
                    latitude=latitude,
                    longitude=longitude,
                    detection_confidence=prediction.confidence,
                    spread_severity=severity.value,
                    distance_coastline_km=dist_coast,
                    distance_protected_area_km=dist_prot,
                    distance_fishing_zone_km=dist_fish,
                ),
            )
            risk_score = risk_assessment.risk_score
            severity_str = risk_assessment.severity.value
            incident.risk_score = risk_score
            incident.severity = risk_assessment.severity

            # Timeline Event 3: Risk Assessment
            top_reason = risk_assessment.factors[0].reason if risk_assessment.factors else "Multi-factor assessment"
            event3 = IncidentEvent(
                id=str(uuid.uuid4()),
                incident_id=incident.id,
                event_type="RISK_ASSESSMENT_COMPUTED",
                description=(
                    f"Risk score evaluated at {risk_score:.1f}/100 ({severity_str} severity). "
                    f"Top attribution factor: {top_reason}."
                ),
                created_by="risk_engine",
            )
            db.add(event3)

            # Priority Engine Evaluation
            p_score, p_factors, u_level, p_reason = PriorityEngine.evaluate_priority(
                risk_score=risk_score,
                severity=risk_assessment.severity,
                status=IncidentStatus.DETECTED,
                spill_area_km2=prediction.spill_area_km2,
                distance_coastline_km=dist_coast,
                distance_protected_km=dist_prot,
                distance_fishing_km=dist_fish,
            )
            priority_score = p_score
            urgency_level = u_level

            # Timeline Event 4: Priority Ranking
            event4 = IncidentEvent(
                id=str(uuid.uuid4()),
                incident_id=incident.id,
                event_type="PRIORITY_QUEUE_RANKED",
                description=(
                    f"Assigned priority dispatch score {priority_score:.1f}/100 ({urgency_level}). {p_reason}"
                ),
                created_by="priority_engine",
            )
            db.add(event4)
            db.flush()

        # 4. Save DetectionResult record in database
        detection_rec = DetectionResult(
            id=str(uuid.uuid4()),
            incident_id=incident_id,
            detected=prediction.detected,
            confidence=prediction.confidence,
            spill_area_km2=prediction.spill_area_km2,
            model_name=prediction.model_name,
            processing_time_ms=prediction.processing_time_ms,
            potential_false_positive=prediction.potential_false_positive,
            latitude=latitude,
            longitude=longitude,
            geometry_geojson=prediction.geometry_geojson,
            image_reference=filename,
            notes=json.dumps(prediction.details),
        )
        db.add(detection_rec)
        db.commit()
        db.refresh(detection_rec)

        return DetectionAnalyzeResponse(
            detected=prediction.detected,
            confidence=prediction.confidence,
            spill_area_km2=prediction.spill_area_km2,
            geometry_geojson=prediction.geometry_geojson,
            mask_base64=prediction.mask_base64,
            model_name=prediction.model_name,
            processing_time_ms=prediction.processing_time_ms,
            potential_false_positive=prediction.potential_false_positive,
            is_demo_model=prediction.is_demo_model,
            latitude=latitude,
            longitude=longitude,
            timestamp=det_time,
            incident_id=incident_id,
            incident_code=incident_code,
            severity=severity_str,
            risk_score=risk_score,
            priority_score=priority_score,
            urgency_level=urgency_level,
            coastline_eta_hours=coastline_eta_hours,
            nearby_zones_count=nearby_zones_count,
            detection_id=detection_rec.id,
            details=prediction.details,
        )
