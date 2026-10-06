import { useEffect, useState } from "react";
import {
  RotateCcw,
  Wind,
  Ship,
  ChevronRight,
} from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, Polyline } from "react-leaflet";
import { adminApi, type IncidentBrief } from "../../services/adminApi";
import type { HindcastResponse } from "../../types/auth";
import { MarineLoader } from "../../components/ui/MarineLoader";

export default function AdminHindcastingPage() {
  const [incidents, setIncidents] = useState<IncidentBrief[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("");
  const [hindcastData, setHindcastData] = useState<HindcastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [durationHours, setDurationHours] = useState(24);
  const [basemap, setBasemap] = useState<"dark" | "satellite" | "osm">("dark");

  useEffect(() => {
    async function init() {
      try {
        const incs = await adminApi.getIncidents();
        setIncidents(incs);
        if (incs.length > 0) {
          setSelectedIncidentId(incs[0].id);
        }
      } catch (err) {
        console.error("Failed to load incidents for hindcasting", err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedIncidentId) return;
    async function loadHindcast() {
      try {
        setLoading(true);
        const data = await adminApi.getHindcast(selectedIncidentId);
        setHindcastData(data);
      } catch (err) {
        console.error("Failed to load hindcast data", err);
      } finally {
        setLoading(false);
      }
    }
    loadHindcast();
  }, [selectedIncidentId]);

  const mapCenter: [number, number] = hindcastData
    ? [hindcastData.incident.latitude, hindcastData.incident.longitude]
    : [13.1500, 80.4500];

  const originCenter: [number, number] = hindcastData?.probable_origin
    ? [hindcastData.probable_origin.latitude, hindcastData.probable_origin.longitude]
    : mapCenter;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-info text-[10px] font-mono">
              LAGRANGIAN HYDRODYNAMIC ENGINE
            </span>
            <span className="badge badge-warning text-[10px] font-mono">
              SIMULATION DATA
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17324D] dark:text-white mt-1">
            Lagrangian Reverse-Drift Hindcasting
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Inverting surface ocean currents, Coriolis deflection, and windage drift vectors to
            reconstruct the exact time-space point of illicit discharge.
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

      {/* 6-Stage Process Pipeline Breadcrumb */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#10273d] border border-slate-200 dark:border-[#1c3e5e] overflow-x-auto">
        <div className="flex items-center justify-between min-w-[720px] text-xs font-bold">
          {(hindcastData?.flow || [
            "Current Spill",
            "Ocean Current + Wind",
            "Backward Drift",
            "Probable Origin",
            "AIS Correlation",
            "Candidate Vessels",
          ]).map((step, idx, arr) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 ${
                  idx === 0
                    ? "text-[#1268B3] dark:text-[#00f3ff]"
                    : idx === 3
                    ? "text-red-600 dark:text-red-400"
                    : idx === 5
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px]">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
              {idx < arr.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <MarineLoader text="Simulating Backward Lagrangian Trajectory..." />
        </div>
      ) : !hindcastData ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] text-slate-400">
          No hindcast trajectory available.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-8 bg-white dark:bg-[#0c1f33] rounded-2xl border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm overflow-hidden flex flex-col h-[560px]">
            <div className="p-3 bg-slate-50 dark:bg-[#10273d] border-b border-[#D9E8F2] dark:border-[#1a3854] flex items-center justify-between text-xs font-bold text-[#17324D] dark:text-white">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#1268B3]" />
                <span>Backward Drift Trajectory &amp; Origin Confidence Zone</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-mono">
                  Duration: -{durationHours} Hours Reconstructed
                </span>
                <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setBasemap("dark")}
                    className={`px-2 py-0.5 text-[10px] rounded font-semibold transition ${
                      basemap === "dark"
                        ? "bg-[#1268B3] text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasemap("satellite")}
                    className={`px-2 py-0.5 text-[10px] rounded font-semibold transition ${
                      basemap === "satellite"
                        ? "bg-[#1268B3] text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    Satellite
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasemap("osm")}
                    className={`px-2 py-0.5 text-[10px] rounded font-semibold transition ${
                      basemap === "osm"
                        ? "bg-[#1268B3] text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    OSM
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 relative z-0">
              <MapContainer
                center={mapCenter}
                zoom={10}
                className="w-full h-full"
                scrollWheelZoom={true}
              >
                {/* Basemap Tiles (100% Free, No Watermarks, No API Key Required) */}
                {basemap === "satellite" ? (
                  <>
                    <TileLayer
                      attribution='&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={18}
                    />
                    <TileLayer
                      attribution=""
                      url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={18}
                      opacity={0.7}
                    />
                  </>
                ) : basemap === "osm" ? (
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                  />
                ) : (
                  <>
                    <TileLayer
                      attribution='&copy; <a href="https://www.esri.com/">Esri</a>, DeLorme, NAVTEQ'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={16}
                    />
                    <TileLayer
                      attribution=""
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={16}
                      opacity={0.8}
                    />
                  </>
                )}

                {/* Detected Spill Location (Present) */}
                <CircleMarker
                  center={mapCenter}
                  radius={8}
                  pathOptions={{ color: "#dc2626", fillColor: "#ef4444", fillOpacity: 0.9 }}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <strong>Current Slick Position (T = 0)</strong>
                      <p>
                        {mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>

                {/* Trajectory Polyline */}
                {hindcastData.backward_path && hindcastData.backward_path.length > 0 && (
                  <Polyline
                    positions={[
                      mapCenter,
                      ...hindcastData.backward_path.map(
                        (p: { latitude: number; longitude: number }) =>
                          [p.latitude, p.longitude] as [number, number]
                      ),
                      originCenter,
                    ]}
                    pathOptions={{
                      color: "#f59e0b",
                      weight: 3,
                      dashArray: "5, 8",
                    }}
                  />
                )}

                {/* Trajectory Steps */}
                {hindcastData.backward_path.map((pt, i) => (
                  <CircleMarker
                    key={i}
                    center={[pt.latitude, pt.longitude]}
                    radius={4}
                    pathOptions={{ color: "#d97706", fillColor: "#fbbf24", fillOpacity: 0.8 }}
                  >
                    <Popup>
                      <div className="text-xs">
                        <strong>T - {pt.hours_prior}h</strong>
                        <p>
                          {pt.latitude.toFixed(4)}, {pt.longitude.toFixed(4)}
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}

                {/* Estimated Discharge Origin (Past) */}
                {hindcastData.probable_origin && (
                  <Circle
                    center={originCenter}
                    radius={hindcastData.probable_origin.uncertainty_radius_km * 1000 || 4500}
                    pathOptions={{
                      color: "#dc2626",
                      fillColor: "#dc2626",
                      fillOpacity: 0.2,
                      dashArray: "4, 6",
                    }}
                  >
                    <Popup>
                      <div className="text-xs space-y-1">
                        <strong className="text-red-700">Estimated Discharge Locus</strong>
                        <p>Locus: {hindcastData.probable_origin.name}</p>
                        <p>
                          Release Window: {hindcastData.estimated_release_window.start} -{" "}
                          {hindcastData.estimated_release_window.end}
                        </p>
                        <p>
                          Uncertainty Radius:{" "}
                          {hindcastData.probable_origin.uncertainty_radius_km} km
                        </p>
                      </div>
                    </Popup>
                  </Circle>
                )}
                <CircleMarker
                  center={originCenter}
                  radius={9}
                  pathOptions={{ color: "#7f1d1d", fillColor: "#991b1b", fillOpacity: 1 }}
                />
              </MapContainer>
            </div>
          </div>

          {/* Right Parameters & Candidate Suspects */}
          <div className="lg:col-span-4 space-y-4">
            {/* Metocean Environmental Parameters */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-[#17324D] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-[#1268B3]" />
                <span>Metocean Drift Vectors</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#10273d]">
                  <span className="text-slate-500">Surface Ocean Current</span>
                  <span className="font-mono font-bold text-[#17324D] dark:text-white">
                    1.3 kts @ 65° ENE
                  </span>
                </div>

                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#10273d]">
                  <span className="text-slate-500">Surface Wind Vector</span>
                  <span className="font-mono font-bold text-[#17324D] dark:text-white">
                    12.8 kts @ 210° SSW
                  </span>
                </div>

                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#10273d]">
                  <span className="text-slate-500">Confidence Score</span>
                  <span className="font-mono font-bold text-[#1268B3]">
                    {hindcastData.overall_confidence_pct.toFixed(1)}%
                  </span>
                </div>

                {hindcastData.probable_origin && (
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#10273d]">
                    <span className="text-slate-500">Uncertainty Radius</span>
                    <span className="font-mono font-bold text-red-600">
                      ±{hindcastData.probable_origin.uncertainty_radius_km} km
                    </span>
                  </div>
                )}
              </div>

              {/* Simulation Duration Selector */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Hindcast Horizon:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[6, 12, 24, 48].map((h) => (
                    <button
                      key={h}
                      onClick={() => setDurationHours(h)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                        durationHours === h
                          ? "bg-[#1268B3] text-white border-[#1268B3]"
                          : "bg-white dark:bg-[#10273d] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#1c3e5e]"
                      }`}
                    >
                      -{h}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Candidate Suspect Vessels at Origin */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-[#17324D] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Ship className="w-4 h-4 text-[#1268B3]" />
                <span>Intersecting Vessels at Discharge Locus</span>
              </h3>

              <div className="space-y-2">
                {hindcastData.candidate_vessels.map((v) => (
                  <div
                    key={v.mmsi}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#10273d] border border-slate-200 dark:border-[#1c3e5e] text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-[#17324D] dark:text-white">{v.vessel_name}</span>
                      <span className="badge badge-warning text-[9px]">
                        Rank #{v.rank}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>MMSI: {v.mmsi}</span>
                      <span className="font-mono text-red-600 font-bold">
                        {v.investigation_score.toFixed(0)}% Match
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <a
                href={`/admin/investigation?incident_id=${selectedIncidentId}`}
                className="w-full py-2.5 rounded-xl bg-[#1268B3] hover:bg-[#0e528e] text-white font-bold text-xs shadow text-center block transition"
              >
                Inspect Vessel Explanations →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
