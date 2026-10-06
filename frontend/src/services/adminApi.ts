import { request } from "./http";
import type {
  AdminDashboardSummary,
  AdminCitizenReport,
  AisTrackingResponse,
  VesselRankingResponse,
  HindcastResponse,
  DriftResponse,
  PublicAlertItem,
  User,
  EvidenceReportResponse,
} from "../types/auth";
import type { DetectionAnalyzeResponse } from "../types";

export interface IncidentBrief {
  id: string;
  incident_code: string;
  latitude: number;
  longitude: number;
  severity: string;
  status: string;
  spill_area_km2?: number | null;
  risk_score?: number | null;
  detection_confidence?: number | null;
  detected_at?: string | null;
}

export const adminApi = {
  getDashboard(): Promise<AdminDashboardSummary> {
    return request<AdminDashboardSummary>("/api/admin/dashboard");
  },

  getIncidents(): Promise<IncidentBrief[]> {
    return request<IncidentBrief[]>("/api/admin/incidents");
  },

  getReports(status?: string): Promise<AdminCitizenReport[]> {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return request<AdminCitizenReport[]>(`/api/admin/reports${q}`);
  },

  getReport(id: string): Promise<AdminCitizenReport> {
    return request<AdminCitizenReport>(`/api/admin/reports/${id}`);
  },

  reportAction(
    id: string,
    payload: {
      action: "review" | "verify" | "reject" | "start_investigation" | "resolve";
      notes?: string;
      public_remarks?: string;
      run_ai_check?: boolean;
      create_incident?: boolean;
    }
  ): Promise<AdminCitizenReport> {
    return request<AdminCitizenReport>(`/api/admin/reports/${id}/action`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  runDetection(formData: FormData): Promise<DetectionAnalyzeResponse> {
    return request<DetectionAnalyzeResponse>("/api/admin/detection", {
      method: "POST",
      body: formData,
    });
  },

  getAis(incidentId?: string): Promise<AisTrackingResponse> {
    const q = incidentId ? `?incident_id=${encodeURIComponent(incidentId)}` : "";
    return request<AisTrackingResponse>(`/api/admin/ais${q}`);
  },

  getVesselRanking(incidentId?: string): Promise<VesselRankingResponse> {
    const q = incidentId ? `?incident_id=${encodeURIComponent(incidentId)}` : "";
    return request<VesselRankingResponse>(`/api/admin/vessel-ranking${q}`);
  },

  createInvestigation(payload: {
    incident_id: string;
    report_id?: string | null;
    title?: string;
    notes?: string;
  }): Promise<{ id: string; title: string; status: string }> {
    return request("/api/admin/investigation", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getHindcast(incidentId?: string): Promise<HindcastResponse> {
    const q = incidentId ? `?incident_id=${encodeURIComponent(incidentId)}` : "";
    return request<HindcastResponse>(`/api/admin/hindcast${q}`);
  },

  getDrift(incidentId?: string): Promise<DriftResponse> {
    const q = incidentId ? `?incident_id=${encodeURIComponent(incidentId)}` : "";
    return request<DriftResponse>(`/api/admin/drift${q}`);
  },

  getAlerts(): Promise<PublicAlertItem[]> {
    return request<PublicAlertItem[]>("/api/admin/alerts");
  },

  createAlert(payload: {
    title: string;
    description: string;
    location?: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    status: "ACTIVE" | "RESOLVED" | "DRAFT";
    alert_type: string;
    latitude?: number;
    longitude?: number;
  }): Promise<PublicAlertItem> {
    return request<PublicAlertItem>("/api/admin/alerts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateAlert(
    id: string,
    payload: {
      title?: string;
      description?: string;
      severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      status?: "ACTIVE" | "RESOLVED" | "DRAFT";
    }
  ): Promise<PublicAlertItem> {
    return request<PublicAlertItem>(`/api/admin/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  getUsers(): Promise<User[]> {
    return request<User[]>("/api/admin/users");
  },

  updateUserStatus(id: string, isActive: boolean): Promise<{ id: string; is_active: boolean }> {
    return request<{ id: string; is_active: boolean }>(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    });
  },

  getUserReports(userId: string): Promise<AdminCitizenReport[]> {
    return request<AdminCitizenReport[]>(`/api/admin/users/${userId}/reports`);
  },

  getEvidence(incidentId?: string): Promise<EvidenceReportResponse> {
    const q = incidentId ? `?incident_id=${encodeURIComponent(incidentId)}` : "";
    return request<EvidenceReportResponse>(`/api/admin/evidence${q}`);
  },
};
