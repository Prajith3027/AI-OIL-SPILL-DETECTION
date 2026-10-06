import { useEffect, useState } from "react";
import {
  Bell,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { citizenApi } from "../../services/citizenApi";
import type { PublicAlertItem } from "../../types/auth";
import { MarineLoader } from "../../components/ui/MarineLoader";

export default function CitizenAlertsPage() {
  const [alerts, setAlerts] = useState<PublicAlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await citizenApi.getAlerts();
        setAlerts(res);
      } catch (err) {
        console.error("Failed to load alerts", err);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <MarineLoader text="Connecting to Coastal Emergency Alerts Broadcast..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#17324D] dark:text-white flex items-center gap-2">
          <Bell className="w-6 h-6 text-[#0066b2] dark:text-[#00f3ff]" />
          <span>Coastal Safety &amp; Emergency Alerts</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Official public notifications issued by maritime emergency response authorities and
          harbour command.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-sm font-bold text-[#17324D] dark:text-white">All Clear</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            There are currently no active public alerts, coastal restrictions, or ecological
            emergency warnings.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const isCritical = alert.severity === "CRITICAL";
            const isHigh = alert.severity === "HIGH";
            return (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border transition shadow-sm ${
                  isCritical
                    ? "bg-red-50/80 dark:bg-red-950/20 border-red-300 dark:border-red-900/60"
                    : isHigh
                    ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60"
                    : "bg-white dark:bg-[#0c1f33] border-[#D9E8F2] dark:border-[#1a3854]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`badge text-[9px] ${
                          isCritical
                            ? "badge-danger"
                            : isHigh
                            ? "badge-warning"
                            : "badge-info"
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="badge text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700">
                        {alert.alert_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-[#17324D] dark:text-white">
                      {alert.title}
                    </h2>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(alert.created_at).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-2.5">
                  {alert.description}
                </p>

                {alert.location && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>{alert.location}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      OFFICIAL ADVISORY
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
