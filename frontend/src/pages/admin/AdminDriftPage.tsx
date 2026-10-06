import React, { useEffect, useState } from "react";
import {
  Waves,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, Polyline } from "react-leaflet";
import { adminApi, type IncidentBrief } from "../../services/adminApi";
import type { DriftResponse } from "../../types/auth";
import { MarineLoader } from "../../components/ui/MarineLoader";

export default function AdminDriftPage() {
  const [incidents, setIncidents] = useState<IncidentBrief[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("");
  const [driftData, setDriftData] = useState<DriftResponse | null>(null);
  const [loading, setLoading] = useState(true);
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
        console.error("Failed to load incidents for drift", err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedIncidentId) return;
    async function loadDrift() {
      try {
        setLoading(true);
        const data = await adminApi.getDrift(selectedIncidentId);
        setDriftData(data);
      } catch (err) {
        console.error("Failed to load drift data", err);
      } finally {
        setLoading(false);
      }
    }
    loadDrift();
  }, [selectedIncidentId]);

  const mapCenter: [number, number] = driftData
    ? [driftData.current.latitude, driftData.current.longitude]
    : [13.1500, 80.4500];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-critical text-[10px] font-mono">
              PREDICTIVE DRIFT DISPATCH
            </span>
            <span className="badge badge-warning text-[10px] font-mono">
              SIMULATION DATA
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17324D] dark:text-white mt-1">
            Forward Drift Trajectory &amp; Shoreline Impact Forecast
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Simulating +6h, +12h, +24h, and +48h hydrocarbon dispersion, weathering evaporation,
            and vulnerable ecological shoreline interception.
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

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <MarineLoader text="Running Hydrodynamic Forward Dispersion Engine..." />
        </div>
      ) : !driftData ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] text-slate-400">
          No forward drift forecast available for this incident.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map */}
          <div className="lg:col-span-8 bg-white dark:bg-[#0c1f33] rounded-2xl border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm overflow-hidden flex flex-col h-[560px]">
            <div className="p-3 bg-slate-50 dark:bg-[#10273d] border-b border-[#D9E8F2] dark:border-[#1a3854] flex items-center justify-between text-xs font-bold text-[#17324D] dark:text-white">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-[#1268B3]" />
                <span>Forward Drift Path &amp; Expanding Containment Corridor</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-red-600 font-mono font-bold">
                  Forecast Confidence: {(driftData.confidence * 100).toFixed(0)}%
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

                {/* Present Spill Location */}
                <CircleMarker
                  center={mapCenter}
                  radius={8}
                  pathOptions={{ color: "#dc2626", fillColor: "#ef4444", fillOpacity: 0.9 }}
                >
                  <Popup>
                    <div className="text-xs">
                      <strong>Current Slick (T = 0)</strong>
                      <p>Area: {driftData.current.area_km2 || 12.4} km²</p>
                    </div>
                  </Popup>
                </CircleMarker>

                {/* Forward Forecast Trajectory */}
                {driftData.forecast && (
                  <Polyline
                    positions={[
                      mapCenter,
                      ...driftData.forecast.map(
                        (p) => [p.latitude, p.longitude] as [number, number]
                      ),
                    ]}
                    pathOptions={{ color: "#dc2626", weight: 3, dashArray: "6, 6" }}
                  />
                )}

                {/* Forecast Points with expanding circles */}
                {driftData.forecast.map((pt, i) => (
                  <React.Fragment key={i}>
                    <Circle
                      center={[pt.latitude, pt.longitude]}
                      radius={(i + 1) * 1400}
                      pathOptions={{
                        color: "#f87171",
                        fillColor: "#ef4444",
                        fillOpacity: 0.15,
                        dashArray: "3, 6",
                      }}
                    />
                    <CircleMarker
                      center={[pt.latitude, pt.longitude]}
                      radius={5}
                      pathOptions={{ color: "#b91c1c", fillColor: "#dc2626", fillOpacity: 0.9 }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1">
                          <strong>Forecast T + {pt.horizon_hours}h</strong>
                          <p>Estimated Area: {pt.estimated_area_km2} km²</p>
                          <p>Bearing: {pt.bearing_cardinal} ({pt.bearing_deg.toFixed(0)}°)</p>
                          <p>Arrival Time: {pt.arrival_time}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  </React.Fragment>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Right: Tactical Intervention Recommendations */}
          <div className="lg:col-span-4 space-y-4">
            {/* Impact Threat Summary */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-[#17324D] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Vulnerable Coastal Assets</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-red-50 dark:bg-[#2b1016] border border-red-200 dark:border-[#521b25]">
                  <div className="flex justify-between font-bold text-red-900 dark:text-red-200">
                    <span>Pulicat Marine Sanctuary</span>
                    <span className="badge badge-critical text-[9px]">CRITICAL</span>
                  </div>
                  <p className="text-[11px] text-red-700 dark:text-red-300 mt-1">
                    Mangrove nesting grounds 14 NM down-current. Interception window within 24 hours.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-[#2b1f09] border border-amber-200 dark:border-[#523d14]">
                  <div className="flex justify-between font-bold text-amber-900 dark:text-amber-200">
                    <span>Kamarajar Port Anchorage</span>
                    <span className="badge badge-warning text-[9px]">HIGH RISK</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                    Commercial shipping lane navigation hazard and intake water cooling channels.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-[#0f2840] border border-blue-200 dark:border-[#1a446c]">
                  <div className="flex justify-between font-bold text-blue-900 dark:text-blue-200">
                    <span>Ennore Estuary Fisheries</span>
                    <span className="badge badge-info text-[9px]">MODERATE</span>
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-1">
                    Artisanal coastal trawling zone. Recommended preemptive fishing ban advisory.
                  </p>
                </div>
              </div>
            </div>

            {/* Tactical Deployment Directives */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-[#17324D] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#087F68]" />
                <span>Recommended Response Barriers</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#10273d] flex justify-between items-center">
                  <span className="font-bold text-[#17324D] dark:text-white">Containment Booms</span>
                  <span className="font-mono text-[#1268B3] font-bold">2,400 meters required</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#10273d] flex justify-between items-center">
                  <span className="font-bold text-[#17324D] dark:text-white">Skimmer Units</span>
                  <span className="font-mono text-[#1268B3] font-bold">3 High-Capacity V-Types</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#10273d] flex justify-between items-center">
                  <span className="font-bold text-[#17324D] dark:text-white">Dispersant Application</span>
                  <span className="badge badge-warning text-[9px]">RESTRICTED (Near Coast)</span>
                </div>
              </div>

              <a
                href="/resources"
                className="w-full py-2.5 rounded-xl bg-[#087F68] hover:bg-[#066452] text-white font-bold text-xs shadow text-center block transition"
              >
                Dispatch Resources via Asset Hub →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
