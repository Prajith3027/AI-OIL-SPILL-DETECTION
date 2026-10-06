"""
API v1 router — aggregates all v1 sub-routers.
"""
from fastapi import APIRouter

from app.api.v1.incidents import router as incidents_router
from app.api.v1.map import router as map_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.health import router as health_router
from app.api.v1.detection import router as detection_router
from app.api.v1.risk import router as risk_router
from app.api.v1.priority import router as priority_router
from app.api.v1.vessels import router as vessels_router
from app.api.v1.movement import router as movement_router
from app.api.v1.ecosystem import incident_router as ecosystem_incident_router
from app.api.v1.ecosystem import zone_router as ecosystem_zone_router
from app.api.v1.coastal_impact import router as coastal_impact_router
from app.api.v1.route_optimizer import (
    incident_router as route_optimizer_incident_router,
    vessel_router as route_optimizer_vessel_router,
)
from app.api.v1.cleanup_planner import router as cleanup_planner_router
from app.api.v1.resource_allocation import router as resource_allocation_router
from app.api.v1.verification import router as verification_router
from app.api.v1.source_analysis import router as source_analysis_router
from app.api.v1.reports import router as reports_router
from app.api.v1.simulations import router as simulations_router
from app.api.v1.economic_impact import (
    incident_router as economic_incident_router,
    assumptions_router as economic_assumptions_router,
)
from app.api.v1.environmental_recovery import (
    incident_router as recovery_incident_router,
    factors_router as recovery_factors_router,
)
from app.api.v1.alerts import (
    router as alerts_router,
    incident_alerts_router,
)
from app.api.v1.assistant import router as assistant_router
from fastapi import Depends
from app.core.auth import require_admin

router = APIRouter()

# RBAC: every pre-existing operational API is admin-only on the backend.
# (health is open for liveness probes; reports enforces roles per endpoint.)
_admin = [Depends(require_admin)]

# Mount all specialized sub-routers BEFORE generic incidents router
router.include_router(assistant_router, dependencies=_admin)
router.include_router(alerts_router, dependencies=_admin)
router.include_router(incident_alerts_router, dependencies=_admin)
router.include_router(simulations_router, dependencies=_admin)
router.include_router(economic_incident_router, dependencies=_admin)
router.include_router(economic_assumptions_router, dependencies=_admin)
router.include_router(recovery_incident_router, dependencies=_admin)
router.include_router(recovery_factors_router, dependencies=_admin)
router.include_router(priority_router, dependencies=_admin)
router.include_router(movement_router, dependencies=_admin)
router.include_router(ecosystem_incident_router, dependencies=_admin)
router.include_router(coastal_impact_router, dependencies=_admin)
router.include_router(route_optimizer_incident_router, dependencies=_admin)
router.include_router(cleanup_planner_router, dependencies=_admin)
router.include_router(resource_allocation_router, dependencies=_admin)
router.include_router(verification_router, dependencies=_admin)
router.include_router(source_analysis_router, dependencies=_admin)
router.include_router(reports_router)
router.include_router(incidents_router, dependencies=_admin)
router.include_router(ecosystem_zone_router, dependencies=_admin)
router.include_router(map_router, dependencies=_admin)
router.include_router(dashboard_router, dependencies=_admin)
router.include_router(health_router)
router.include_router(detection_router, dependencies=_admin)
router.include_router(risk_router, dependencies=_admin)
router.include_router(route_optimizer_vessel_router, dependencies=_admin)
router.include_router(vessels_router, dependencies=_admin)


@router.get("/", tags=["v1"], summary="API v1 root")
async def v1_root():
    """Lists all available API v1 endpoint groups."""
    return {
        "version": "v1",
        "endpoints": {
            "health":              "/api/v1/health",
            "detection":           "/api/v1/detection/analyze",
            "incidents":           "/api/v1/incidents",
            "map":                 "/api/v1/map/incidents",
            "dashboard":           "/api/v1/dashboard/summary",
            "priority":            "/api/v1/incidents/priority",
            "movement":            "/api/v1/incidents/{id}/movement",
            "ecosystem_risk":      "/api/v1/incidents/{id}/ecosystem-risk",
            "ecosystem_zones":     "/api/v1/ecosystem-zones/nearby",
            "coastal_impact":      "/api/v1/incidents/{id}/coastal-impact",
            "time_to_impact":      "/api/v1/incidents/{id}/time-to-impact",
            "available_vessels":   "/api/v1/vessels/available",
            "recommended_vessels": "/api/v1/incidents/{id}/recommended-vessels",
            "optimize_route":      "/api/v1/incidents/{id}/optimize-route",
            "vessel_route":        "/api/v1/vessels/{vessel_id}/route",
            "cleanup_plan":        "/api/v1/incidents/{id}/cleanup-plan",
            "resources":           "/api/v1/resources",
            "available_resources": "/api/v1/resources/available",
            "incident_resources":  "/api/v1/incidents/{id}/resources",
            "verify_incident":     "/api/v1/incidents/{id}/verify",
            "incident_verification":"/api/v1/incidents/{id}/verification",
            "source_analysis":     "/api/v1/incidents/{id}/source-analysis",
            "citizen_reports":     "/api/v1/reports",
            "simulations":         "/api/v1/simulations",
            "economic_impact":     "/api/v1/incidents/{id}/economic-impact",
            "economic_assumptions":"/api/v1/economic-impact/assumptions",
            "environmental_recovery": "/api/v1/incidents/{id}/recovery",
            "alerts":              "/api/v1/alerts",
            "assistant":           "/api/v1/assistant/chat",
        },
    }

