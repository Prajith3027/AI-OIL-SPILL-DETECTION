import { useEffect, useState } from "react";
import {
  Ship,
  Scale,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { adminApi, type IncidentBrief } from "../../services/adminApi";
import type { VesselRankingResponse, RankedVessel } from "../../types/auth";
import { MarineLoader } from "../../components/ui/MarineLoader";

export default function AdminVesselInvestigationPage() {
  const [incidents, setIncidents] = useState<IncidentBrief[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("");
  const [rankingData, setRankingData] = useState<VesselRankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [invLoading, setInvLoading] = useState<string | null>(null);
  const [invSuccess, setInvSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const incs = await adminApi.getIncidents();
        setIncidents(incs);
        if (incs.length > 0) {
          const urlParams = new URLSearchParams(window.location.search);
          const incParam = urlParams.get("incident_id");
          const target = incParam && incs.some((i) => i.id === incParam) ? incParam : incs[0].id;
          setSelectedIncidentId(target);
        }
      } catch (err) {
        console.error("Failed to load incidents for ranking", err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedIncidentId) return;
    async function loadRanking() {
      try {
        setLoading(true);
        setInvSuccess(null);
        const data = await adminApi.getVesselRanking(selectedIncidentId);
        setRankingData(data);
      } catch (err) {
        console.error("Failed to load vessel ranking", err);
      } finally {
        setLoading(false);
      }
    }
    loadRanking();
  }, [selectedIncidentId]);

  const handleOpenInvestigation = async (vessel: RankedVessel) => {
    try {
      setInvLoading(vessel.mmsi);
      setInvSuccess(null);
      await adminApi.createInvestigation({
        incident_id: selectedIncidentId,
        title: `Official Inquiry: Potential Association of ${vessel.vessel_name} (MMSI: ${vessel.mmsi})`,
        notes: `Automated investigation initiated based on explainable ranking score of ${vessel.investigation_score.toFixed(
          1
        )}%. Classification: ${vessel.classification}.`,
      });
      setInvSuccess(`Official inquiry opened for ${vessel.vessel_name} (MMSI: ${vessel.mmsi})`);
    } catch (err: any) {
      alert("Failed to initiate inquiry: " + (err?.message || "Error"));
    } finally {
      setInvLoading(null);
    }
  };

  const getRankBadge = (rank: number, classification: string) => {
    if (rank === 1) {
      return (
        <span className="badge badge-critical text-[10px] font-mono px-2 py-0.5">
          {classification.toUpperCase()}
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="badge badge-warning text-[10px] font-mono px-2 py-0.5">
          {classification.toUpperCase()}
        </span>
      );
    }
    return (
      <span className="badge badge-info text-[10px] font-mono px-2 py-0.5">
        {classification.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-info text-[10px] font-mono">
              EXPLAINABLE AI ENGINE
            </span>
            <span className="badge badge-warning text-[10px] font-mono">
              SIMULATION DATA
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17324D] dark:text-white mt-1">
            Vessel Attribution &amp; Responsibility Ranking
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Multi-factor probabilistic correlation modeling based on Lagrangian backward drift,
            spatial-temporal intersection, and transponder kinematic behavior.
          </p>
        </div>

        {/* Incident Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
            Target Incident:
          </label>
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="w-full md:w-64 p-2 rounded-xl text-xs border border-[#D9E8F2] dark:border-[#1a3854] bg-white dark:bg-[#0c1f33] text-[#17324D] dark:text-white font-bold"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.incident_code} ({inc.severity})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mandatory Statutory Legal Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-[#2b1f09] border border-amber-200 dark:border-[#523d14] flex items-start gap-3">
        <Scale className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <p className="font-bold">Statutory &amp; Evidentiary Advisory Notice:</p>
          <p className="leading-relaxed">
            {rankingData?.disclaimer ||
              "Identification is based on multi-parameter probabilistic modeling (Distance 30%, Time 25%, Trajectory 25%, Behaviour 10%, Other 10%). Vessel correlation constitutes an investigative lead for maritime authorities and does not constitute a judicial finding of guilt or liability."}
          </p>
        </div>
      </div>

      {invSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{invSuccess}</span>
        </div>
      )}

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <MarineLoader text="Computing 5-Factor Probabilistic Responsibility Matrix..." />
        </div>
      ) : !rankingData || rankingData.vessels.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] text-slate-400">
          <Ship className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="font-semibold text-sm">No vessels tracked within the incident corridor.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
            <span>
              Showing {rankingData.vessels.length} candidate vessels in order of correlation
            </span>
            <a
              href={`/admin/evidence?incident_id=${selectedIncidentId}`}
              className="text-[#1268B3] dark:text-[#00f3ff] hover:underline flex items-center gap-1"
            >
              <span>Compile Full Evidentiary Dossier</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Vessel Cards */}
          <div className="grid grid-cols-1 gap-4">
            {rankingData.vessels.map((v: RankedVessel, idx: number) => {
              const scorePercent = v.investigation_score.toFixed(1);
              return (
                <div
                  key={v.mmsi}
                  className={`p-5 rounded-2xl bg-white dark:bg-[#0c1f33] border transition shadow-sm ${
                    idx === 0
                      ? "border-red-300 dark:border-red-800/60 ring-2 ring-red-500/20"
                      : "border-[#D9E8F2] dark:border-[#1a3854]"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#16334d]">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          RANK #{v.rank}
                        </span>
                        {getRankBadge(v.rank, v.classification)}
                        <span className="text-xs font-mono text-slate-400">
                          MMSI: <strong className="text-slate-700 dark:text-slate-200">{v.mmsi}</strong>
                        </span>
                        {v.destination && (
                          <span className="text-xs font-mono text-slate-400">
                            Dest: <strong className="text-slate-700 dark:text-slate-200">{v.destination}</strong>
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-[#17324D] dark:text-white flex items-center gap-2">
                        <Ship className="w-5 h-5 text-[#1268B3]" />
                        <span>{v.vessel_name}</span>
                        <span className="text-xs font-normal text-slate-400">
                          ({v.vessel_type} • Flag: {v.flag || "Unknown"})
                        </span>
                      </h3>
                    </div>

                    {/* Overall Score Badge */}
                    <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Associated Probability
                        </span>
                        <div className="text-3xl font-black text-red-600 dark:text-red-400">
                          {scorePercent}%
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenInvestigation(v)}
                        disabled={invLoading === v.mmsi}
                        className="py-2.5 px-4 rounded-xl bg-[#1268B3] hover:bg-[#0e528e] text-white font-bold text-xs shadow-sm transition whitespace-nowrap"
                      >
                        {invLoading === v.mmsi ? "Initiating..." : "Open Investigation"}
                      </button>
                    </div>
                  </div>

                  {/* 5-Factor Score Breakdown */}
                  <div className="pt-4 space-y-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                      Explainable 5-Factor Weight Breakdown
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                      {v.breakdown.map((bf) => (
                        <div
                          key={bf.factor}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-[#10273d] border border-slate-200 dark:border-[#1c3e5e] space-y-1.5"
                        >
                          <div className="flex justify-between font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                            <span>
                              {bf.factor} ({bf.weight_pct}%)
                            </span>
                            <span className="text-[#1268B3]">{bf.factor_score_pct.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#1268B3] h-full rounded-full"
                              style={{ width: `${Math.min(100, bf.factor_score_pct)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {bf.explanation}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
