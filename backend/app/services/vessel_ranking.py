"""
Explainable vessel-ranking ("Investigation Priority") service.

IMPORTANT: Scores rank vessels for *investigative follow-up only*. They never establish
that a vessel caused a spill. AIS inputs currently come from the project's AIS simulator
(app.gis.vessel_service) and are labelled as Simulation Data.

Weights:
    Distance Score       30%
    Time Correlation     25%
    Trajectory Match     25%
    Behaviour Anomaly    10%
    Other Evidence       10%
"""
from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any, Optional

from app.gis.vessel_service import VesselService, _haversine_km
from app.models.incident import Incident

WEIGHTS = {
    "distance": 0.30,
    "time_correlation": 0.25,
    "trajectory_match": 0.25,
    "behaviour_anomaly": 0.10,
    "other_evidence": 0.10,
}
FACTOR_LABELS = {
    "distance": "Distance Score",
    "time_correlation": "Time Correlation",
    "trajectory_match": "Trajectory Match",
    "behaviour_anomaly": "Behaviour Anomaly",
    "other_evidence": "Other Evidence",
}
AIS_DATA_ORIGIN = "SIMULATION"
AIS_DATA_NOTE = "Simulation Data — no live AIS feed is connected. Do not treat as real-world vessel positions."
DISCLAIMER = (
    "Investigation scores prioritise vessels for further inquiry. They are advisory, explainable "
    "heuristics and do not prove responsibility or establish legal liability."
)


def _parse(ts: str) -> datetime:
    dt = datetime.fromisoformat(ts)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _label(rank: int, score: float) -> str:
    if rank == 1 and score >= 50:
        return "Most Likely Associated Vessel"
    if score >= 60:
        return "High-Priority Investigation Candidate"
    if score >= 35:
        return "Secondary Investigation Candidate"
    return "Low Priority — Contextual Only"


def rank_vessels(incident: Incident, db, hindcast: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    resp = VesselService.get_suspect_vessels_for_incident(incident, db)
    detected = _parse(resp.detection_time) if resp.detection_time else datetime.now(timezone.utc)

    # Reference geometry: hindcast backward path when available, otherwise the spill centroid.
    ref_points: list[tuple[float, float]] = [(resp.incident_latitude, resp.incident_longitude)]
    win_start = win_end = None
    if hindcast:
        ref_points += [(p["latitude"], p["longitude"]) for p in hindcast.get("reverse_trajectory", [])]
        try:
            win_start = _parse(hindcast["estimated_discharge_time_start"])
            win_end = _parse(hindcast["estimated_discharge_time_end"])
        except (KeyError, ValueError, TypeError):
            win_start = win_end = None
    if win_start is None:
        from datetime import timedelta
        win_start, win_end = detected - timedelta(hours=12), detected

    ranked: list[dict[str, Any]] = []
    for v in resp.suspects:
        reasons: dict[str, str] = {}

        # 1. Distance
        d = v.closest_approach_km
        s_dist = math.exp(-d / 8.0)
        reasons["distance"] = f"Closest approach to the spill was {d:.2f} km."

        # 2. Time correlation
        t = _parse(v.closest_approach_time)
        if win_start <= t <= win_end:
            s_time = 1.0
            reasons["time_correlation"] = "Closest approach falls inside the estimated release window."
        else:
            gap = (win_start - t).total_seconds() / 3600 if t < win_start else (t - win_end).total_seconds() / 3600
            s_time = math.exp(-gap / 6.0)
            reasons["time_correlation"] = f"Closest approach was {gap:.1f} h outside the estimated release window."

        # 3. Trajectory match
        dmin = min(
            _haversine_km(w.latitude, w.longitude, rlat, rlon)
            for w in v.trajectory for (rlat, rlon) in ref_points
        )
        s_traj = math.exp(-dmin / 10.0)
        reasons["trajectory_match"] = (
            f"AIS track passes within {dmin:.1f} km of the "
            f"{'hindcast backward path / origin' if hindcast else 'spill centroid'}."
        )

        # 4. Behaviour anomaly (speed change near the spill)
        speeds = [w.speed_knots for w in v.trajectory] or [v.speed_at_incident]
        vmax, vmin = max(speeds), min(speeds)
        drop = (vmax - vmin) / vmax if vmax > 0 else 0.0
        s_beh = min(1.0, drop * 1.5)
        reasons["behaviour_anomaly"] = (
            f"Speed varied from {vmax:.1f} kn to {vmin:.1f} kn along the track "
            f"({drop * 100:.0f}% change)."
            if drop > 0.05 else "Steady speed; no manoeuvring anomaly recorded."
        )

        # 5. Other evidence
        vt = v.vessel_type.lower()
        cargo = v.cargo_type.lower()
        cargo_risk = 0.6 if ("tanker" in vt or "chemical" in vt) else (0.3 if "fuel oil" in cargo else 0.05)
        jitter = any("jitter" in a.lower() for a in v.anomaly_indicators)
        s_other = min(1.0, cargo_risk + (0.3 if jitter else 0.0))
        bits = [f"vessel class: {v.vessel_type}"]
        if jitter:
            bits.append("AIS signal irregularity during passage window")
        reasons["other_evidence"] = "; ".join(bits).capitalize() + "."

        sub = {
            "distance": s_dist, "time_correlation": s_time, "trajectory_match": s_traj,
            "behaviour_anomaly": s_beh, "other_evidence": s_other,
        }
        total = round(sum(WEIGHTS[k] * sub[k] for k in WEIGHTS) * 100, 1)
        ranked.append({
            "mmsi": v.mmsi,
            "vessel_name": v.name,
            "vessel_type": v.vessel_type,
            "flag": v.flag,
            "destination": v.destination,
            "investigation_score": total,
            "breakdown": [
                {
                    "factor": FACTOR_LABELS[k],
                    "weight_pct": int(WEIGHTS[k] * 100),
                    "factor_score_pct": round(sub[k] * 100, 1),
                    "contribution_pts": round(WEIGHTS[k] * sub[k] * 100, 1),
                    "explanation": reasons[k],
                }
                for k in WEIGHTS
            ],
            "trajectory": [[w.latitude, w.longitude] for w in v.trajectory],
        })

    ranked.sort(key=lambda r: r["investigation_score"], reverse=True)
    for i, r in enumerate(ranked, 1):
        r["rank"] = i
        r["classification"] = _label(i, r["investigation_score"])

    return {
        "incident_id": incident.id,
        "incident_code": incident.incident_code,
        "incident_latitude": resp.incident_latitude,
        "incident_longitude": resp.incident_longitude,
        "weights": {FACTOR_LABELS[k]: int(w * 100) for k, w in WEIGHTS.items()},
        "vessels": ranked,
        "data_origin": AIS_DATA_ORIGIN,
        "data_note": AIS_DATA_NOTE,
        "hindcast_used": bool(hindcast),
        "disclaimer": DISCLAIMER,
    }
