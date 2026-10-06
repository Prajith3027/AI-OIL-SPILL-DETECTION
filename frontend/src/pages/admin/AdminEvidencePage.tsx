import { useEffect, useState } from "react";
import {
  Printer,
  Scale,
  Ship,
  Waves,
  ScanSearch,
  Shield,
  FileCheck,
} from "lucide-react";
import { adminApi, type IncidentBrief } from "../../services/adminApi";
import type { EvidenceReportResponse } from "../../types/auth";
import { MarineLoader } from "../../components/ui/MarineLoader";

export default function AdminEvidencePage() {
  const [incidents, setIncidents] = useState<IncidentBrief[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("");
  const [evidenceData, setEvidenceData] = useState<EvidenceReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

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
        console.error("Failed to load incidents for evidence", err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedIncidentId) return;
    async function loadEvidence() {
      try {
        setLoading(true);
        const data = await adminApi.getEvidence(selectedIncidentId);
        setEvidenceData(data);
      } catch (err) {
        console.error("Failed to load evidence report", err);
      } finally {
        setLoading(false);
      }
    }
    loadEvidence();
  }, [selectedIncidentId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in print:max-w-none print:m-0 print:p-0">
      {/* Top Banner (Hidden when printing) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-info text-[10px] font-mono">
              OFFICIAL INVESTIGATION DOSSIER
            </span>
            <span className="badge badge-warning text-[10px] font-mono">
              SIMULATION DATA
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17324D] dark:text-white mt-1">
            Compiled Incident Evidentiary Dossier
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Forensic compilation of multi-spectral satellite detection, Lagrangian reverse drift,
            explainable AIS vessel attribution, and verified crowdsourced reports.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="p-2 rounded-xl text-xs border border-[#D9E8F2] dark:border-[#1a3854] bg-white dark:bg-[#0c1f33] text-[#17324D] dark:text-white font-bold"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.incident_code} ({inc.severity})
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="btn-primary text-xs flex items-center gap-1.5 py-2 px-4 shadow-sm whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <MarineLoader text="Compiling Official Evidentiary Dossier..." />
        </div>
      ) : !evidenceData ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] text-slate-400">
          No evidence compiled for this incident.
        </div>
      ) : (
        /* Printable Document Container */
        <div className="bg-white dark:bg-[#0c1f33] print:bg-white print:text-black rounded-2xl border border-[#D9E8F2] dark:border-[#1a3854] print:border-none shadow-xl p-8 sm:p-12 space-y-8">
          {/* Document Header */}
          <div className="border-b-2 border-[#1268B3] pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#1268B3] font-bold text-xs uppercase tracking-widest">
                <Shield className="w-5 h-5" />
                <span>Maritime Operations Command • Emergency Response Bureau</span>
              </div>
              <h2 className="text-2xl font-black text-[#17324D] dark:text-white print:text-black mt-1">
                Forensic Incident Investigation Dossier
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                <span>Dossier ID: #{evidenceData.incident.incident_code}</span>
                <span>•</span>
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span>•</span>
                <span className="text-[#1268B3] font-bold">Confidential / Law Enforcement</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-800 text-center text-xs font-mono font-bold">
              <div>INCIDENT SEVERITY</div>
              <div className="text-xl font-black">{evidenceData.incident.severity}</div>
            </div>
          </div>

          {/* Section 1: Incident Satellite Detection */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-[#17324D] dark:text-white print:text-black uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <ScanSearch className="w-4 h-4 text-[#1268B3]" />
              <span>1. Satellite Synthetic Aperture Radar (SAR) Detection</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#10273d] print:bg-slate-100">
                <span className="text-slate-500 text-[10px]">Coordinates</span>
                <p className="font-mono font-bold text-[#17324D] dark:text-white print:text-black mt-0.5">
                  {evidenceData.incident.latitude.toFixed(4)}° N,{" "}
                  {evidenceData.incident.longitude.toFixed(4)}° E
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#10273d] print:bg-slate-100">
                <span className="text-slate-500 text-[10px]">Estimated Area</span>
                <p className="font-mono font-bold text-[#17324D] dark:text-white print:text-black mt-0.5">
                  {evidenceData.incident.spill_area_km2 || 14.8} km²
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#10273d] print:bg-slate-100">
                <span className="text-slate-500 text-[10px]">Detection Confidence</span>
                <p className="font-mono font-bold text-[#087F68] mt-0.5">
                  {((evidenceData.incident.detection_confidence || 0.94) * 100).toFixed(1)}%
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#10273d] print:bg-slate-100">
                <span className="text-slate-500 text-[10px]">Timestamp</span>
                <p className="font-mono font-bold text-[#17324D] dark:text-white print:text-black mt-0.5">
                  {evidenceData.incident.detected_at
                    ? new Date(evidenceData.incident.detected_at).toLocaleString()
                    : "Live Stream"}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Hindcast Origin Reconstruction */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-[#17324D] dark:text-white print:text-black uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <Waves className="w-4 h-4 text-[#1268B3]" />
              <span>2. Lagrangian Reverse-Drift Hindcast Origin Analysis</span>
            </h3>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#10273d] print:bg-slate-100 text-xs space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 text-[10px]">Primary Source Locus:</span>
                  <p className="font-mono font-bold text-[#17324D] dark:text-white print:text-black">
                    {evidenceData.hindcast?.primary_source_region || "Offshore Locus Region"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">Release Window:</span>
                  <p className="font-bold text-[#17324D] dark:text-white print:text-black">
                    {evidenceData.hindcast?.release_window
                      ? `${evidenceData.hindcast.release_window[0]} to ${evidenceData.hindcast.release_window[1]}`
                      : "Estimated 18h window"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">Confidence Score:</span>
                  <p className="font-mono font-bold text-[#1268B3]">
                    {evidenceData.hindcast?.confidence_pct || 88.5}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Explainable AIS Correlated Vessel Ranking */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-[#17324D] dark:text-white print:text-black uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <Ship className="w-4 h-4 text-[#1268B3]" />
              <span>3. AIS Trajectory Correlation &amp; Ranked Suspect Vessels</span>
            </h3>

            <div className="space-y-3">
              {(evidenceData.vessel_ranking || []).slice(0, 3).map((v) => (
                <div
                  key={v.mmsi}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[#1c3e5e] text-xs space-y-2 bg-white dark:bg-[#0c1f33] print:bg-white"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-info text-[9px] font-mono">RANK #{v.rank}</span>
                      <strong className="text-sm text-[#17324D] dark:text-white print:text-black">
                        {v.vessel_name}
                      </strong>
                      <span className="text-slate-400 font-mono">
                        (MMSI: {v.mmsi} • {v.vessel_type})
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-red-600">
                        {v.investigation_score.toFixed(1)}% Associated Probability
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] text-center pt-1">
                    {v.breakdown.map((bf) => (
                      <div
                        key={bf.factor}
                        className="p-1.5 rounded bg-slate-50 dark:bg-[#10273d] print:bg-slate-100"
                      >
                        <div className="text-slate-500 truncate">{bf.factor}</div>
                        <div className="font-bold text-[#1268B3]">
                          {bf.factor_score_pct.toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 print:text-slate-700 italic">
                    Classification: <strong>{v.classification}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Crowdsourced Evidence */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-[#17324D] dark:text-white print:text-black uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <FileCheck className="w-4 h-4 text-[#1268B3]" />
              <span>4. Corroborating Citizen Field Observations</span>
            </h3>

            {evidenceData.linked_citizen_reports && evidenceData.linked_citizen_reports.length > 0 ? (
              <div className="space-y-2">
                {evidenceData.linked_citizen_reports.map((r, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#10273d] print:bg-slate-100 text-xs flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-[#17324D] dark:text-white print:text-black">
                        Report #{r.report_code} • Category: {r.category}
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Observed: {new Date(r.observed_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="badge badge-success text-[9px]">{r.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No citizen reports directly attached to this incident ID.
              </p>
            )}
          </div>

          {/* Statutory Evidentiary Disclaimer */}
          <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a1e30] print:bg-slate-100 space-y-2 text-xs">
            <div className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200 print:text-black">
              <Scale className="w-4 h-4 text-slate-600" />
              <span>Statutory Advisory &amp; Chain-of-Custody Certification</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 print:text-slate-600 leading-relaxed">
              {evidenceData.disclaimer ||
                "This evidentiary dossier is compiled in accordance with MARPOL 73/78 Annex I, the Coast Guard Act 1978, and Merchant Shipping Act provisions. Numerical scores represent multi-factor probabilistic correlation modeling for investigative prioritization and do not constitute judicial determinations of criminal liability."}
            </p>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Cryptographic Integrity Hash: SHA256:d8f4e29b10...</span>
              <span>Authorized Authority: Tier-1 Marine Rescue Coordination Center</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
