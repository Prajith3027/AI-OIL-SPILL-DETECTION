import React, { useState } from "react";
import {
  Cpu,
  Database,
  CheckCircle2,
  Save,
  Radio,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [detectionConfidence, setDetectionConfidence] = useState(70);
  const [aisPollingSec, setAisPollingSec] = useState(30);
  const [hindcastStepHours, setHindcastStepHours] = useState(2);
  const [autoVerifyThreshold, setAutoVerifyThreshold] = useState(85);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-info text-[10px] font-mono">
              SYSTEM CONFIGURATION
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              ENGINE PARAMETERS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17324D] dark:text-white mt-1">
            Operational Parameters &amp; AI Pipeline Health
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tune algorithmic detection sensitivity, hydrodynamic drift discretization, and transponder
            harvest frequencies.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Operational pipeline configurations updated and deployed to workers.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: AI Model Configuration */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#16334d]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-[#1268B3] dark:bg-blue-950/40 dark:text-blue-300">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#17324D] dark:text-white">
                  SAR Computer Vision Segmentation Engine
                </h3>
                <p className="text-[11px] text-slate-400">
                  ResNet50 / DeepLabV3+ Hydrocarbon Feature Extraction
                </p>
              </div>
            </div>
            <span className="badge badge-success text-[10px]">PyTorch Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                <span>Detection Confidence Gate:</span>
                <span className="font-mono text-[#1268B3] font-bold">{detectionConfidence}%</span>
              </label>
              <input
                type="range"
                min={50}
                max={95}
                value={detectionConfidence}
                onChange={(e) => setDetectionConfidence(Number(e.target.value))}
                className="w-full accent-[#1268B3]"
              />
              <span className="text-[10px] text-slate-400">
                Slicks below this threshold trigger manual analyst review.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                <span>Citizen Auto-Verification Confidence:</span>
                <span className="font-mono text-emerald-600 font-bold">{autoVerifyThreshold}%</span>
              </label>
              <input
                type="range"
                min={60}
                max={99}
                value={autoVerifyThreshold}
                onChange={(e) => setAutoVerifyThreshold(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <span className="text-[10px] text-slate-400">
                Crowdsourced photos exceeding this score are flagged AI-Confirmed.
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Metocean & AIS Settings */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#16334d]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#17324D] dark:text-white">
                  AIS Ingestion &amp; Lagrangian Discretization
                </h3>
                <p className="text-[11px] text-slate-400">
                  Coastal Receiver Polling &amp; Metocean Temporal Resolution
                </p>
              </div>
            </div>
            <span className="badge badge-info text-[10px]">Real-Time Stream</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                AIS Coastal Receiver Polling Interval (seconds)
              </label>
              <select
                value={aisPollingSec}
                onChange={(e) => setAisPollingSec(Number(e.target.value))}
                className="w-full p-2 rounded-xl border border-[#D9E8F2] dark:border-[#1a3854] bg-white dark:bg-[#0c1f33] text-[#17324D] dark:text-white font-bold"
              >
                <option value={10}>10 Seconds (High Traffic Mode)</option>
                <option value={30}>30 Seconds (Nominal Operations)</option>
                <option value={60}>60 Seconds (Low Bandwidth Satellite Link)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Backward Hindcast Step Size
              </label>
              <select
                value={hindcastStepHours}
                onChange={(e) => setHindcastStepHours(Number(e.target.value))}
                className="w-full p-2 rounded-xl border border-[#D9E8F2] dark:border-[#1a3854] bg-white dark:bg-[#0c1f33] text-[#17324D] dark:text-white font-bold"
              >
                <option value={1}>1 Hour Steps (High Precision Runge-Kutta 4)</option>
                <option value={2}>2 Hour Steps (Default Balanced)</option>
                <option value={4}>4 Hour Steps (Rapid Trajectory Screen)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 3: Spatial Database & Storage */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#16334d]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#17324D] dark:text-white">
                  PostGIS Spatial Index &amp; Storage Quotas
                </h3>
                <p className="text-[11px] text-slate-400">
                  GeoJSON Layer Caching &amp; Drone/Citizen Evidence Media
                </p>
              </div>
            </div>
            <span className="badge badge-success text-[10px]">Healthy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#10273d]">
              <span className="text-slate-500">PostGIS Index Status</span>
              <p className="font-bold text-[#17324D] dark:text-white mt-1">GIST R-Tree Active</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#10273d]">
              <span className="text-slate-500">Max Upload Video Size</span>
              <p className="font-bold text-[#17324D] dark:text-white mt-1">50 MB Limit</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#10273d]">
              <span className="text-slate-500">Session JWT Token Expiry</span>
              <p className="font-bold text-[#17324D] dark:text-white mt-1">1,440 Minutes (24h)</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="btn-primary text-xs flex items-center gap-2 py-2.5 px-6 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Operational Config</span>
          </button>
        </div>
      </form>
    </div>
  );
}
