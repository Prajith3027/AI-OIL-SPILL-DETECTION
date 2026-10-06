import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FilePlus2,
  MapPin,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { citizenApi } from "../../services/citizenApi";
import type {
  CitizenDashboardSummary,
  CitizenReportItem,
  PublicAlertItem,
} from "../../types/auth";
import { MarineLoader } from "../../components/ui/MarineLoader";

export default function CitizenDashboard() {
  const [summary, setSummary] = useState<CitizenDashboardSummary | null>(null);
  const [recentReports, setRecentReports] = useState<CitizenReportItem[]>([]);
  const [alerts, setAlerts] = useState<PublicAlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, repsRes, alertsRes] = await Promise.all([
          citizenApi.getSummary(),
          citizenApi.getMyReports(),
          citizenApi.getAlerts(),
        ]);
        setSummary(sumRes);
        setRecentReports(repsRes.slice(0, 5));
        setAlerts(alertsRes.filter((a) => a.status === "ACTIVE").slice(0, 4));
      } catch (err) {
        console.error("Failed to load citizen dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <MarineLoader text="Loading Citizen Dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#004e8c] via-[#0066b2] to-[#0099cc] text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="badge badge-info bg-white/20 text-white border-white/30 text-[10px]">
            PUBLIC MARITIME SURVEILLANCE
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Citizen Maritime Reporting Desk
          </h1>
          <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
            Report surface hydrocarbon sheens, tar balls, and vessel discharges. Your field
            observations assist environmental authorities in safeguarding coastal ecosystems.
          </p>
        </div>
        <Link
          to="/citizen/report"
          className="flex items-center gap-2 py-3 px-5 rounded-xl bg-white text-[#004e8c] font-black text-xs uppercase tracking-wider shadow-md hover:bg-blue-50 transition transform hover:-translate-y-0.5 shrink-0"
        >
          <FilePlus2 className="w-4 h-4" />
          <span>Report Oil Spill</span>
        </Link>
      </div>

      {/* 4 Dashboard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EAF6FF] dark:bg-[#12385c] text-[#0066b2] dark:text-[#00f3ff] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Reports Submitted</p>
            <p className="text-2xl font-black text-[#17324D] dark:text-white mt-0.5">
              {summary?.reports_submitted ?? 0}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFF8E8] dark:bg-[#332508] text-[#A86A00] dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Under Review</p>
            <p className="text-2xl font-black text-[#17324D] dark:text-white mt-0.5">
              {summary?.reports_under_review ?? 0}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EAF8F4] dark:bg-[#062920] text-[#087F68] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verified Incidents</p>
            <p className="text-2xl font-black text-[#17324D] dark:text-white mt-0.5">
              {summary?.verified_incidents ?? 0}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFF1F2] dark:bg-[#330f14] text-[#C6283D] dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Spill Alerts</p>
            <p className="text-2xl font-black text-[#17324D] dark:text-white mt-0.5">
              {summary?.active_alerts ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Reports & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Recent Reports */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0066b2] dark:text-[#00f3ff]" />
              <h2 className="text-sm font-bold text-[#17324D] dark:text-white">
                My Recent Reports
              </h2>
            </div>
            <Link
              to="/citizen/my-reports"
              className="text-xs text-[#0066b2] dark:text-[#00f3ff] hover:underline font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#F0F7FC] dark:bg-[#0e2740] border border-dashed border-[#D9E8F2] dark:border-[#1f4263] space-y-3">
              <FileText className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You haven't submitted any oil spill observations yet.
              </p>
              <Link
                to="/citizen/report"
                className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-[#0066b2] text-white text-xs font-bold shadow"
              >
                <FilePlus2 className="w-4 h-4" />
                <span>Submit Your First Report</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Report ID</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentReports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-[#0066b2] dark:text-[#00f3ff]">
                        {r.report_code}
                      </td>
                      <td className="py-3 px-3 truncate max-w-[160px]">
                        {r.location_description || `${r.latitude.toFixed(2)}°, ${r.longitude.toFixed(2)}°`}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`badge text-[9px] ${
                            r.severity === "CRITICAL"
                              ? "badge-danger"
                              : r.severity === "HIGH"
                              ? "badge-warning"
                              : "badge-info"
                          }`}
                        >
                          {r.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === "VERIFIED"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              : r.status === "SUBMITTED"
                              ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {r.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Active Public Alerts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <h2 className="text-sm font-bold text-[#17324D] dark:text-white">Active Alerts</h2>
            </div>
            <Link
              to="/citizen/alerts"
              className="text-xs text-[#0066b2] dark:text-[#00f3ff] hover:underline font-semibold"
            >
              All Alerts
            </Link>
          </div>

          {alerts.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
              No active coastal emergency alerts at this time.
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#17324D] dark:text-white truncate">
                      {a.title}
                    </span>
                    <span className="badge badge-danger text-[9px] px-1.5 py-0.2 shrink-0">
                      {a.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                    {a.description}
                  </p>
                  {a.location && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3 h-3" />
                      <span>{a.location}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
