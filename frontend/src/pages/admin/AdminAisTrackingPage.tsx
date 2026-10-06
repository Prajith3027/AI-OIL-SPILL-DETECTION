import React, { useEffect, useState } from "react";
import {
  Ship,
  Compass,
  Radio,
  Layers,
  Search,
} from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, Polyline } from "react-leaflet";
import { adminApi, type IncidentBrief } from "../../services/adminApi";
import type { AisTrackingResponse, AisVesselData } from "../../types/auth";
import { MarineLoader } from "../../components/ui/MarineLoader";

export default function AdminAisTrackingPage() {
  const [incidents, setIncidents] = useState<IncidentBrief[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("");
  const [aisData, setAisData] = useState<AisTrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState<AisVesselData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
        console.error("Failed to load incidents for AIS", err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedIncidentId) return;
    async function loadAis() {
      try {
        setLoading(true);
        const data = await adminApi.getAis(selectedIncidentId);
        setAisData(data);
        if (data.vessels.length > 0) {
          setSelectedVessel(data.vessels[0]);
        }
      } catch (err) {
        console.error("Failed to load AIS data", err);
      } finally {
        setLoading(false);
      }
    }
    loadAis();
  }, [selectedIncidentId]);

  const [filterCategory, setFilterCategory] = useState<"ALL" | "SUSPECTS" | "RESPONDERS" | "COMMERCIAL">("ALL");

  const mapCenter: [number, number] = aisData
    ? [aisData.incident.latitude, aisData.incident.longitude]
    : [13.1500, 80.4500];

  const getVesselCategory = (v: AisVesselData) => {
    if (v.vessel_type.includes("Coast Guard") || v.classification?.includes("Official")) return "RESPONDERS";
    if ((v.investigation_score || 0) >= 35 || v.anomaly_indicators.length > 0) return "SUSPECTS";
    return "COMMERCIAL";
  };

  const getVesselColor = (v: AisVesselData, isSelected: boolean) => {
    if (isSelected) return "#00f3ff"; // Electric cyan
    if (v.vessel_type.includes("Coast Guard") || v.classification?.includes("Official")) return "#10b981"; // Emerald green
    if (v.classification?.includes("Most Likely") || (v.investigation_score || 0) >= 80) return "#ef4444"; // Crimson red
    if ((v.investigation_score || 0) >= 40 || v.anomaly_indicators.length > 0) return "#f59e0b"; // Warning amber
    return "#38bdf8"; // Light marine blue
  };

  const filteredVessels = (aisData?.vessels || []).filter((v) => {
    if (filterCategory !== "ALL" && getVesselCategory(v) !== filterCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.mmsi.toLowerCase().includes(q) ||
      v.vessel_type.toLowerCase().includes(q) ||
      (v.flag && v.flag.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-info text-[10px] font-mono">
              AIS MARITIME SURVEILLANCE
            </span>
            <span className="badge badge-warning text-[10px] font-mono">
              SIMULATION DATA
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17324D] dark:text-white mt-1">
            Real-Time Vessel Traffic &amp; Trajectory Correlator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Live AIS transponder feed, speed-heading kinematic anomalies, and spatial-temporal
            correlations against detected hydrocarbon slick perimeters.
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
          <MarineLoader text="Querying AIS Maritime Transponder Network..." />
        </div>
      ) : !aisData ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] text-slate-400">
          No AIS data available for this incident.
        </div>
      ) : (
        <>
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500">Tracked Vessels in Sector</span>
              <div className="text-2xl font-black text-[#17324D] dark:text-white mt-1">
                {aisData.vessels.length}
              </div>
              <span className="text-[10px] text-slate-400">50 NM radius buffer</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500">Kinematic Anomalies</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {aisData.vessels.filter((v) => v.anomaly_indicators.length > 0).length}
              </div>
              <span className="text-[10px] text-slate-400">Speed / heading deviations</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500">Closest Approach</span>
              <div className="text-2xl font-black text-red-600 mt-1">
                {Math.min(...aisData.vessels.map((v) => v.distance_from_origin_km || 999)).toFixed(1)}{" "}
                <span className="text-sm font-medium">km</span>
              </div>
              <span className="text-[10px] text-slate-400">From estimated discharge locus</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500">AIS Feed Health</span>
              <div className="text-2xl font-black text-[#087F68] mt-1 flex items-center gap-1.5">
                <Radio className="w-5 h-5 animate-pulse text-[#087F68]" />
                <span>ONLINE</span>
              </div>
              <span className="text-[10px] text-slate-400">Coastal receiver latency &lt; 2s</span>
            </div>
          </div>

          {/* Map & Detail Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: GIS Map */}
            <div className="lg:col-span-7 bg-white dark:bg-[#0c1f33] rounded-2xl border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm overflow-hidden flex flex-col h-[520px]">
              <div className="p-3 bg-slate-50 dark:bg-[#10273d] border-b border-[#D9E8F2] dark:border-[#1a3854] flex items-center justify-between text-xs font-bold text-[#17324D] dark:text-white">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#1268B3]" />
                  <span>Geospatial Radar &amp; Trajectory Overlay</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Locus: {mapCenter[0].toFixed(3)}, {mapCenter[1].toFixed(3)}
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

              {/* Trajectory Category Filter Sub-Bar */}
              <div className="px-3 py-1.5 bg-slate-100 dark:bg-[#081827] border-b border-[#D9E8F2] dark:border-[#1a3854] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Tracks:</span>
                  <button
                    type="button"
                    onClick={() => setFilterCategory("ALL")}
                    className={`px-2 py-0.5 rounded-full font-bold transition text-[10px] ${
                      filterCategory === "ALL"
                        ? "bg-[#1268B3] text-white shadow-sm"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white"
                    }`}
                  >
                    All Traffic ({aisData?.vessels.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory("SUSPECTS")}
                    className={`px-2 py-0.5 rounded-full font-bold transition text-[10px] flex items-center gap-1 ${
                      filterCategory === "SUSPECTS"
                        ? "bg-red-600 text-white shadow-sm"
                        : "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Suspect Tankers ({(aisData?.vessels || []).filter(v => getVesselCategory(v) === "SUSPECTS").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory("RESPONDERS")}
                    className={`px-2 py-0.5 rounded-full font-bold transition text-[10px] flex items-center gap-1 ${
                      filterCategory === "RESPONDERS"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Coast Guard ({(aisData?.vessels || []).filter(v => getVesselCategory(v) === "RESPONDERS").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory("COMMERCIAL")}
                    className={`px-2 py-0.5 rounded-full font-bold transition text-[10px] flex items-center gap-1 ${
                      filterCategory === "COMMERCIAL"
                        ? "bg-cyan-600 text-white shadow-sm"
                        : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Cargo / Transit ({(aisData?.vessels || []).filter(v => getVesselCategory(v) === "COMMERCIAL").length})
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Showing <strong>{filteredVessels.length}</strong> active tracks
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

                  {/* Confirmed Oil Spill Slick Perimeter Polygon */}
                  <Circle
                    center={mapCenter}
                    radius={3200}
                    pathOptions={{
                      color: "#ef4444",
                      fillColor: "#ef4444",
                      fillOpacity: 0.28,
                      weight: 2,
                      dashArray: "4, 6",
                    }}
                  >
                    <Popup>
                      <div className="text-xs space-y-1 p-1">
                        <strong className="text-red-600 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                          Confirmed Oil Slick Centroid
                        </strong>
                        <p className="text-slate-600 dark:text-slate-300">
                          Incident: <strong>{aisData.incident.incident_code}</strong>
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                          Estimated Area: <strong>{aisData.incident.spill_area_km2 || 14.8} km²</strong>
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Offshore Bay of Bengal: {mapCenter[0].toFixed(4)}°N, {mapCenter[1].toFixed(4)}°E
                        </p>
                      </div>
                    </Popup>
                  </Circle>

                  {/* Discharge Locus Crosshair Target */}
                  <CircleMarker
                    center={mapCenter}
                    radius={6}
                    pathOptions={{
                      color: "#ffffff",
                      fillColor: "#dc2626",
                      fillOpacity: 1,
                      weight: 2,
                    }}
                  />

                  {/* Multi-Vessel Trajectories & Real-Time Position Markers */}
                  {filteredVessels.map((v) => {
                    const isSelected = selectedVessel?.mmsi === v.mmsi;
                    const trackColor = getVesselColor(v, isSelected);
                    const isCoastGuard = v.vessel_type.includes("Coast Guard");
                    const isPrimary = (v.investigation_score || 0) >= 80 || v.classification?.includes("Most Likely");

                    return (
                      <React.Fragment key={v.mmsi}>
                        {/* Trajectory Polyline */}
                        {v.history && v.history.length > 1 && (
                          <Polyline
                            positions={v.history.map((pt) => [pt.latitude, pt.longitude])}
                            pathOptions={{
                              color: trackColor,
                              weight: isSelected ? 4.5 : isPrimary ? 3.5 : isCoastGuard ? 2.8 : 2,
                              opacity: isSelected ? 1 : isPrimary ? 0.95 : 0.8,
                              dashArray: isCoastGuard ? "6, 4" : (isPrimary && !isSelected) ? undefined : isSelected ? undefined : "4, 4",
                            }}
                            eventHandlers={{
                              click: () => setSelectedVessel(v),
                            }}
                          />
                        )}

                        {/* Intermediate Historical Track Breadcrumbs */}
                        {(isSelected || isPrimary) && v.history && v.history.map((pt, pIdx) => (
                          <CircleMarker
                            key={`${v.mmsi}-pt-${pIdx}`}
                            center={[pt.latitude, pt.longitude]}
                            radius={pIdx === 0 || pIdx === v.history.length - 1 ? 4 : 2.5}
                            pathOptions={{
                              color: trackColor,
                              fillColor: trackColor,
                              fillOpacity: 0.85,
                              weight: 1,
                            }}
                          >
                            <Popup>
                              <div className="text-[11px] font-mono space-y-0.5 p-0.5">
                                <div className="font-bold text-slate-800 dark:text-white">{v.name} Ping #{pIdx + 1}</div>
                                <div>Time: {new Date(pt.timestamp).toLocaleTimeString()}</div>
                                <div>Speed: <strong className={pt.speed_knots < 5 ? "text-red-600" : ""}>{pt.speed_knots} kts</strong> | Course: {pt.course_deg}°</div>
                                <div>Coords: {pt.latitude.toFixed(3)}°N, {pt.longitude.toFixed(3)}°E</div>
                              </div>
                            </Popup>
                          </CircleMarker>
                        ))}

                        {/* Current Vessel Position Marker */}
                        <CircleMarker
                          center={[v.latitude, v.longitude]}
                          radius={isSelected ? 10 : isPrimary ? 8 : 6}
                          pathOptions={{
                            color: isSelected ? "#ffffff" : trackColor,
                            fillColor: trackColor,
                            fillOpacity: 0.95,
                            weight: isSelected ? 3 : 2,
                          }}
                          eventHandlers={{
                            click: () => setSelectedVessel(v),
                          }}
                        >
                          <Popup>
                            <div className="text-xs space-y-1.5 p-1 min-w-[210px]">
                              <div className="flex items-center justify-between">
                                <strong className="font-bold text-slate-900">{v.name}</strong>
                                <span className="text-[10px] font-mono">{v.flag}</span>
                              </div>
                              <div className="text-[11px] text-slate-600 space-y-0.5">
                                <div>MMSI: <span className="font-mono">{v.mmsi}</span></div>
                                <div>Type: {v.vessel_type}</div>
                                <div>Speed: <strong className={v.speed_knots < 5 ? "text-red-600" : ""}>{v.speed_knots} kts</strong> | Heading: {v.course_deg}°</div>
                                <div>Distance to Slick: <strong>{v.distance_from_origin_km.toFixed(1)} km</strong></div>
                                {v.investigation_score !== undefined && (
                                  <div>AI Attribution: <strong className={v.investigation_score >= 80 ? "text-red-600 font-bold" : v.investigation_score >= 40 ? "text-amber-600 font-bold" : "text-slate-600"}>{v.investigation_score}%</strong></div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedVessel(v)}
                                className="w-full mt-1 py-1 rounded bg-[#1268B3] text-white text-[10px] font-bold uppercase tracking-wider"
                              >
                                View Forensic Dossier
                              </button>
                            </div>
                          </Popup>
                        </CircleMarker>
                      </React.Fragment>
                    );
                  })}
                </MapContainer>

                {/* Floating Map Radar Legend Overlay */}
                <div className="absolute bottom-3 left-3 z-[1000] p-2.5 rounded-xl bg-white/95 dark:bg-[#0c1f33]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-[10px] shadow-lg space-y-1 font-mono pointer-events-auto">
                  <div className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[9px] mb-1">
                    Radar AIS Legend
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-1 bg-red-500 rounded-full" />
                    <span className="text-slate-600 dark:text-slate-300">Primary Suspect (Direct Spill Crossing)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-1 bg-amber-500 rounded-full" />
                    <span className="text-slate-600 dark:text-slate-300">Secondary Tanker Candidates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-1 bg-emerald-500 rounded-full" />
                    <span className="text-slate-600 dark:text-slate-300">Coast Guard Response (CG-201)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-1 bg-cyan-400 rounded-full" />
                    <span className="text-slate-600 dark:text-slate-300">Commercial Cargo / Bulk / LNG</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full border border-red-500 bg-red-500/30" />
                    <span className="text-slate-600 dark:text-slate-300">Oil Spill Perimeter (14.8 km²)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Selected Vessel Dossier */}
            <div className="lg:col-span-5 bg-white dark:bg-[#0c1f33] rounded-2xl border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm p-5 flex flex-col justify-between space-y-4">
              {selectedVessel ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#16334d]">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400">SELECTED VESSEL</span>
                      <h3 className="text-base font-black text-[#17324D] dark:text-white">
                        {selectedVessel.name}
                      </h3>
                    </div>
                    {selectedVessel.anomaly_indicators.length > 0 && (
                      <span className="badge badge-warning text-[10px]">ANOMALY DETECTED</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#10273d]">
                      <span className="text-slate-400 text-[10px]">MMSI Code</span>
                      <p className="font-mono font-bold text-[#17324D] dark:text-white">
                        {selectedVessel.mmsi}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#10273d]">
                      <span className="text-slate-400 text-[10px]">Classification</span>
                      <p className="font-bold text-[#17324D] dark:text-white">
                        {selectedVessel.classification}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#10273d]">
                      <span className="text-slate-400 text-[10px]">Vessel Type</span>
                      <p className="font-bold text-[#17324D] dark:text-white">
                        {selectedVessel.vessel_type}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#10273d]">
                      <span className="text-slate-400 text-[10px]">Country Flag</span>
                      <p className="font-bold text-[#17324D] dark:text-white">
                        {selectedVessel.flag || "Panama"}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#10273d]">
                      <span className="text-slate-400 text-[10px]">Speed Over Ground</span>
                      <p className="font-mono font-bold text-[#1268B3] dark:text-[#00f3ff]">
                        {selectedVessel.speed_knots} kts
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#10273d]">
                      <span className="text-slate-400 text-[10px]">Course Vector</span>
                      <p className="font-mono font-bold text-[#17324D] dark:text-white">
                        {selectedVessel.course_deg}°
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-[#0f2840] border border-blue-100 dark:border-[#1a446c] text-xs space-y-1">
                    <div className="font-bold text-[#1268B3] dark:text-[#00f3ff] flex items-center gap-1.5">
                      <Compass className="w-4 h-4" />
                      <span>Spatial Proximity to Spill</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      Calculated distance:{" "}
                      <strong>{selectedVessel.distance_from_origin_km.toFixed(2)} km</strong>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Correlation score:{" "}
                      <strong>{selectedVessel.investigation_score.toFixed(1)}%</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 text-slate-400 text-xs">
                  Select a vessel from the table or map to inspect transponder details.
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-[#16334d]">
                <a
                  href={`/admin/investigation?incident_id=${selectedIncidentId}`}
                  className="w-full py-2.5 rounded-xl bg-[#1268B3] hover:bg-[#0f5492] text-white font-bold text-xs shadow text-center block transition"
                >
                  Analyze in Vessel Ranking Engine →
                </a>
              </div>
            </div>
          </div>

          {/* Vessels Table */}
          <div className="bg-white dark:bg-[#0c1f33] rounded-2xl border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#D9E8F2] dark:border-[#1a3854] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Ship className="w-5 h-5 text-[#1268B3]" />
                <h3 className="font-bold text-sm text-[#17324D] dark:text-white">
                  AIS Vessel Radar Roster
                </h3>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter vessels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#D9E8F2] dark:border-[#1a3854] bg-white dark:bg-[#0c1f33] text-[#17324D] dark:text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#10273d] text-slate-500 font-bold border-b border-[#D9E8F2] dark:border-[#1a3854]">
                  <tr>
                    <th className="py-2.5 px-4">Vessel Name</th>
                    <th className="py-2.5 px-4">MMSI</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Flag</th>
                    <th className="py-2.5 px-4">Speed</th>
                    <th className="py-2.5 px-4">Course</th>
                    <th className="py-2.5 px-4">Distance to Spill</th>
                    <th className="py-2.5 px-4">Score</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#16334d]">
                  {filteredVessels.map((v) => {
                    const isSelected = selectedVessel?.mmsi === v.mmsi;
                    return (
                      <tr
                        key={v.mmsi}
                        className={`hover:bg-slate-50/70 dark:hover:bg-[#122b42] transition cursor-pointer ${
                          isSelected ? "bg-blue-50/50 dark:bg-[#0f2c4a]" : ""
                        }`}
                        onClick={() => setSelectedVessel(v)}
                      >
                        <td className="py-2.5 px-4 font-bold text-[#17324D] dark:text-white">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: getVesselColor(v, false) }}
                            />
                            <span>{v.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">{v.mmsi}</td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                          {v.vessel_type}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                          {v.flag || "Panama"}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-[#1268B3]">
                          {v.speed_knots} kts
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">{v.course_deg}°</td>
                        <td className="py-2.5 px-4 font-bold text-slate-700 dark:text-slate-200">
                          {v.distance_from_origin_km.toFixed(2)} km
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`badge text-[9px] ${
                              v.investigation_score > 70
                                ? "badge-critical"
                                : v.investigation_score > 40
                                ? "badge-warning"
                                : "badge-info"
                            }`}
                          >
                            {v.investigation_score.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVessel(v);
                            }}
                            className="py-1 px-2.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-[#173855] text-slate-700 dark:text-slate-200 text-[11px] font-bold"
                          >
                            Track
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
