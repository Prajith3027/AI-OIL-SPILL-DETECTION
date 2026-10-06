import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  FileText,
  Search,
  Ship,
  AlertTriangle,
  CheckCircle2,
  ScanSearch,
  Waves,
  Compass,
  Radar,
} from "lucide-react";
import { adminApi, type IncidentBrief } from "../../services/adminApi";
import type { AdminDashboardSummary } from "../../types/auth";
import { MarineLoader } from "../../components/ui/MarineLoader";

export default function AdminDashboard() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [incidents, setIncidents] = useState<IncidentBrief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, incRes] = await Promise.all([
          adminApi.getDashboard(),
          adminApi.getIncidents(),
        ]);
        setSummary(sumRes);
        setIncidents(incRes.slice(0, 6));
      } catch (err) {
        console.error("Failed to load admin dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <MarineLoader text="Connecting to Maritime Operations Command Center..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#00172e] via-[#002f5c] to-[#005599] text-white border border-[#00f3ff]/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="badge badge-critical text-[10px] font-mono">
              COMMAND COMMANDER ACTIVE
            </span>
            <span className="text-[10px] font-mono text-[#00f3ff]">
              MRCC CHENNAI &amp; BAY OF BENGAL SECTOR
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Maritime Emergency Response Command Center
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Multi-spectral synthetic aperture radar (SAR) surveillance, automated hydrocarbon
            segmentation, Lagrangian reverse-drift hindcasting, and explainable AIS suspect vessel
            attribution.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/admin/detection"
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-[#00f3ff] text-[#00172e] font-black text-xs uppercase tracking-wider shadow hover:bg-[#48f7ff] transition"
          >
            <ScanSearch className="w-4 h-4" />
            <span>AI Detect</span>
          </Link>
          <Link
            to="/admin/investigation"
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow transition"
          >
            <Ship className="w-4 h-4" />
            <span>Vessel Investigate</span>
          </Link>
        </div>
      </div>

      {/* 6 Required Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Active Oil Spills</span>
            <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#17324D] dark:text-white mt-1">
            {summary?.active_oil_spills ?? 0}
          </p>
          <span className="text-[10px] text-red-500 font-mono font-semibold">Real-time GIS</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Reports Received</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#17324D] dark:text-white mt-1">
            {summary?.reports_received ?? 0}
          </p>
          <span className="text-[10px] text-blue-500 font-mono font-semibold">Crowd-sourced</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Under Investigation</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#17324D] dark:text-white mt-1">
            {summary?.reports_under_investigation ?? 0}
          </p>
          <span className="text-[10px] text-amber-500 font-mono font-semibold">Active dossiers</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Candidate Vessels</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#17324D] dark:text-white mt-1">
            {summary?.candidate_vessels ?? 0}
          </p>
          <span className="text-[10px] text-purple-500 font-mono font-semibold">AIS correlated</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">High-Risk Incidents</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#17324D] dark:text-white mt-1">
            {summary?.high_risk_incidents ?? 0}
          </p>
          <span className="text-[10px] text-rose-500 font-mono font-semibold">Immediate response</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Resolved Incidents</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#17324D] dark:text-white mt-1">
            {summary?.resolved_incidents ?? 0}
          </p>
          <span className="text-[10px] text-emerald-500 font-mono font-semibold">Contained/Closed</span>
        </div>
      </div>

      {/* Operational Module Quick Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/hindcasting"
          className="p-4 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm hover:border-[#0066b2] dark:hover:border-[#00f3ff] transition space-y-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0066b2] dark:text-[#00f3ff] flex items-center justify-center group-hover:scale-105 transition">
            <Compass className="w-5 h-5" />
          </div>
          <h2 className="text-xs font-bold text-[#17324D] dark:text-white">
            Reverse Drift Hindcasting
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Backward Lagrangian drift to identify probable release origin &amp; candidate shipping lanes.
          </p>
        </Link>

        <Link
          to="/admin/ais"
          className="p-4 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm hover:border-[#0066b2] dark:hover:border-[#00f3ff] transition space-y-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition">
            <Radar className="w-5 h-5" />
          </div>
          <h2 className="text-xs font-bold text-[#17324D] dark:text-white">
            AIS Vessel Tracking &amp; Correlation
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Monitor real-time commercial ship transits and historical track intersections.
          </p>
        </Link>

        <Link
          to="/admin/investigation"
          className="p-4 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm hover:border-[#0066b2] dark:hover:border-[#00f3ff] transition space-y-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-105 transition">
            <Ship className="w-5 h-5" />
          </div>
          <h2 className="text-xs font-bold text-[#17324D] dark:text-white">
            Responsible Vessel Analysis
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Explainable 5-factor scoring engine for prioritizing investigation candidates.
          </p>
        </Link>

        <Link
          to="/admin/drift"
          className="p-4 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm hover:border-[#0066b2] dark:hover:border-[#00f3ff] transition space-y-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
            <Waves className="w-5 h-5" />
          </div>
          <h2 className="text-xs font-bold text-[#17324D] dark:text-white">
            Future Drift Trajectory (+24h)
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Forecast forward spill advection milestones: +6h, +12h, and +24h shoreline arrival.
          </p>
        </Link>
      </div>

      {/* Active Incidents Dossier Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#17324D] dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>Active Incident Command Queue</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select an incident to view its AIS correlation, satellite segmentation, or hindcast origin.
            </p>
          </div>
          <Link
            to="/incidents"
            className="text-xs text-[#0066b2] dark:text-[#00f3ff] hover:underline font-bold flex items-center gap-1"
          >
            <span>Open Incident Operations &rarr;</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Incident Code</th>
                <th className="py-2.5 px-3">Location (Lat, Lon)</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Spill Area</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-mono font-bold text-[#0066b2] dark:text-[#00f3ff]">
                    {inc.incident_code}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {inc.latitude.toFixed(3)}°N, {inc.longitude.toFixed(3)}°E
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`badge text-[9px] ${
                        inc.severity === "CRITICAL"
                          ? "badge-danger"
                          : inc.severity === "HIGH"
                          ? "badge-warning"
                          : "badge-info"
                      }`}
                    >
                      {inc.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {inc.spill_area_km2 ? `${inc.spill_area_km2.toFixed(1)} km²` : "N/A"}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    {inc.risk_score ? inc.risk_score.toFixed(1) : "N/A"}
                  </td>
                  <td className="py-3 px-3">
                    <span className="badge badge-active text-[9px]">{inc.status}</span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-1.5">
                    <Link
                      to={`/admin/hindcasting?incident=${inc.incident_code}`}
                      className="inline-block px-2 py-1 rounded bg-[#EAF6FF] dark:bg-[#12385c] text-[#0066b2] dark:text-[#00f3ff] hover:bg-[#0066b2] hover:text-white transition text-[10px] font-semibold"
                    >
                      Hindcast
                    </Link>
                    <Link
                      to={`/admin/investigation?incident=${inc.incident_code}`}
                      className="inline-block px-2 py-1 rounded bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition text-[10px] font-semibold"
                    >
                      Vessels
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
