import { useEffect, useState } from "react";
import {
  Bell,
  Plus,
  CheckCircle2,
  X,
  Radio,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import type { PublicAlertItem } from "../../types/auth";
import { MarineLoader } from "../../components/ui/MarineLoader";

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<PublicAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");
  const [status, setStatus] = useState<"ACTIVE" | "RESOLVED" | "DRAFT">("ACTIVE");
  const [alertType, setAlertType] = useState("COASTAL_HAZARD");
  const [latitude, setLatitude] = useState<number | undefined>(13.1500);
  const [longitude, setLongitude] = useState<number | undefined>(80.4500);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error("Failed to load alerts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminApi.createAlert({
        title,
        description,
        location,
        severity,
        status,
        alert_type: alertType,
        latitude,
        longitude,
      });
      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      setLocation("");
      setSuccessMsg("Public coastal emergency alert broadcasted successfully.");
      await loadAlerts();
    } catch (err: any) {
      alert("Failed to broadcast alert: " + (err?.message || "Error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleResolve = async (alertItem: PublicAlertItem) => {
    try {
      const nextStatus = alertItem.status === "ACTIVE" ? "RESOLVED" : "ACTIVE";
      await adminApi.updateAlert(alertItem.id, { status: nextStatus });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertItem.id ? { ...a, status: nextStatus } : a))
      );
    } catch (err: any) {
      alert("Failed to update alert: " + (err?.message || "Error"));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-critical text-[10px] font-mono">
              PUBLIC BROADCAST GATEWAY
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              NDMA / COAST GUARD COMPLIANT
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17324D] dark:text-white mt-1">
            Coastal Emergency Alerts &amp; Advisories
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Broadcast geotargeted public advisories, fishing bans, beach closures, and port
            navigation restrictions directly to citizen dashboards and coastal mobile devices.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary text-xs flex items-center gap-2 py-2.5 px-4 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Broadcast New Alert</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Alerts Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <MarineLoader text="Loading Coastal Emergency Alerts..." />
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] text-slate-400">
          <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="font-semibold text-sm">No active emergency alerts recorded.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0c1f33] rounded-2xl border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#10273d] text-slate-500 dark:text-slate-400 font-bold border-b border-[#D9E8F2] dark:border-[#1a3854]">
                <tr>
                  <th className="py-3 px-4">Title / Advisory</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Location Sector</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Broadcast Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#16334d]">
                {alerts.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#122b42] transition"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#17324D] dark:text-white">{a.title}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-sm">
                        {a.description}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge badge-info text-[9px] font-mono">
                        {a.alert_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {a.location || "Coastal Sector"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`badge text-[9px] ${
                          a.severity === "CRITICAL"
                            ? "badge-critical"
                            : a.severity === "HIGH"
                            ? "badge-warning"
                            : "badge-info"
                        }`}
                      >
                        {a.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {a.status === "ACTIVE" ? (
                        <span className="badge badge-critical text-[9px] flex items-center gap-1 w-fit">
                          <Radio className="w-2.5 h-2.5 animate-pulse" />
                          <span>BROADCASTING</span>
                        </span>
                      ) : (
                        <span className="badge text-[9px] bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          RESOLVED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[10px]">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString() : "Live"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleResolve(a)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition shadow-sm ${
                          a.status === "ACTIVE"
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : "bg-amber-600 hover:bg-amber-500 text-white"
                        }`}
                      >
                        {a.status === "ACTIVE" ? "Mark Resolved" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Broadcast Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#00172e]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0c1f33] rounded-2xl max-w-lg w-full border border-[#D9E8F2] dark:border-[#1a3854] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#16334d]">
              <div>
                <span className="badge badge-critical text-[9px] font-mono">EMERGENCY DISPATCH</span>
                <h3 className="text-base font-black text-[#17324D] dark:text-white mt-0.5">
                  Broadcast Public Coastal Alert
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-[#143049] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Advisory Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urgent Fishing Ban & Beach Closure: Marina Beach Sector"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#D9E8F2] dark:border-[#1a3854] bg-white dark:bg-[#0c1f33] text-[#17324D] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Advisory Text &amp; Safety Instructions *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail water contact hazards, prohibited coordinates, and emergency contact numbers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#D9E8F2] dark:border-[#1a3854] bg-white dark:bg-[#0c1f33] text-[#17324D] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Location / Sector
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ennore Port to Marina"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#D9E8F2] dark:border-[#1a3854] bg-white dark:bg-[#0c1f33] text-[#17324D] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Alert Category
                  </label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#D9E8F2] dark:border-[#1a3854] bg-white dark:bg-[#0c1f33] text-[#17324D] dark:text-white font-bold"
                  >
                    <option value="FISHING_BAN">FISHING_BAN</option>
                    <option value="BEACH_CLOSURE">BEACH_CLOSURE</option>
                    <option value="PORT_ADVISORY">PORT_ADVISORY</option>
                    <option value="COASTAL_HAZARD">COASTAL_HAZARD</option>
                    <option value="EVACUATION_WARNING">EVACUATION_WARNING</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-[#D9E8F2] dark:border-[#1a3854] bg-white dark:bg-[#0c1f33] text-[#17324D] dark:text-white font-bold"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Publish Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-[#D9E8F2] dark:border-[#1a3854] bg-white dark:bg-[#0c1f33] text-[#17324D] dark:text-white font-bold"
                  >
                    <option value="ACTIVE">ACTIVE (Live Now)</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude ?? ""}
                    onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full p-2 rounded-lg border border-[#D9E8F2] dark:border-[#1a3854] bg-white dark:bg-[#0c1f33] text-[#17324D] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude ?? ""}
                    onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full p-2 rounded-lg border border-[#D9E8F2] dark:border-[#1a3854] bg-white dark:bg-[#0c1f33] text-[#17324D] dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#16334d]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#143049] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2 px-4 shadow-sm"
                >
                  {submitting ? "Publishing..." : "Transmit Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
