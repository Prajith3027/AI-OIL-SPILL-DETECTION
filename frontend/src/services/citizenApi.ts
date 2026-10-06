import { request } from "./http";
import type {
  CitizenReportItem,
  CitizenDashboardSummary,
  PublicAlertItem,
  PublicSpillsResponse,
} from "../types/auth";

export const citizenApi = {
  submitReport(formData: FormData): Promise<CitizenReportItem> {
    return request<CitizenReportItem>("/api/citizen/reports", {
      method: "POST",
      body: formData,
    });
  },

  getMyReports(): Promise<CitizenReportItem[]> {
    return request<CitizenReportItem[]>("/api/citizen/reports");
  },

  getMyReport(id: string): Promise<CitizenReportItem> {
    return request<CitizenReportItem>(`/api/citizen/reports/${id}`);
  },

  getSummary(): Promise<CitizenDashboardSummary> {
    return request<CitizenDashboardSummary>("/api/citizen/summary");
  },

  getAlerts(): Promise<PublicAlertItem[]> {
    return request<PublicAlertItem[]>("/api/citizen/alerts");
  },

  getPublicSpills(): Promise<PublicSpillsResponse> {
    return request<PublicSpillsResponse>("/api/public/spills");
  },
};
