import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Circle } from "react-leaflet";
import { MapPin } from "lucide-react";
import { citizenApi } from "../../services/citizenApi";
import type { PublicSpillsResponse } from "../../types/auth";
import { MarineLoader } from "../../components/ui/MarineLoader";

export default function CitizenMapPage() {
  const [data, setData] = useState<PublicSpillsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Layers toggle
  const [showSpills, setShowSpills] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [basemap, setBasemap] = useState<"dark" | "satellite" | "osm">("dark");

  useEffect(() => {
    async function loadPublicSpills() {
      try {
        const res = await citizenApi.getPublicSpills();
        setData(res);
      } catch (err) {
        console.error("Failed to load public spills map data", err);
      } finally {
        setLoading(false);
      }
    }
    loadPublicSpills();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <MarineLoader text="Rendering Public GIS Layers..." />
      </div>
    );
  }

  const defaultCenter: [number, number] = [13.1500, 80.4500]; // Offshore Chennai / Bay of Bengal marine corridor

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col animate-fade-in">
      {/* Top Banner & Layer Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-black text-[#17324D] dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#0066b2] dark:text-[#00f3ff]" />
            <span>Public Maritime Safety Map</span>
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Displays verified spill coordinates and official emergency containment zones.
            Confidential tactical AIS trajectories are excluded for security.
          </p>
        </div>

        {/* Filter toggles */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowSpills(!showSpills)}
            className={`px-3 py-1.5 rounded-lg font-bold border transition ${
              showSpills
                ? "bg-red-500/20 border-red-500 text-red-700 dark:text-red-300"
                : "border-slate-300 dark:border-slate-700 text-slate-400"
            }`}
          >
            Spills ({data?.spills.length || 0})
          </button>
          <button
            onClick={() => setShowReports(!showReports)}
            className={`px-3 py-1.5 rounded-lg font-bold border transition ${
              showReports
                ? "bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300"
                : "border-slate-300 dark:border-slate-700 text-slate-400"
            }`}
          >
            Citizen Reports ({data?.citizen_reports.length || 0})
          </button>
          <button
            onClick={() => setShowZones(!showZones)}
            className={`px-3 py-1.5 rounded-lg font-bold border transition ${
              showZones
                ? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300"
                : "border-slate-300 dark:border-slate-700 text-slate-400"
            }`}
          >
            Emergency Zones ({data?.emergency_zones.length || 0})
          </button>
        </div>

        {/* Basemap Switcher (100% Free, No Watermarks, No API Key Required) */}
        <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setBasemap("dark")}
            className={`px-2 py-1 rounded font-semibold transition ${
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
            className={`px-2 py-1 rounded font-semibold transition ${
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
            className={`px-2 py-1 rounded font-semibold transition ${
              basemap === "osm"
                ? "bg-[#1268B3] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
            }`}
          >
            OSM
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-[#D9E8F2] dark:border-[#1a3854] shadow-md relative">
        <MapContainer
          center={defaultCenter}
          zoom={8}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%", minHeight: "450px" }}
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

          {/* Emergency Zones */}
          {showZones &&
            data?.emergency_zones.map((zone) => (
              <Circle
                key={zone.id}
                center={[zone.latitude, zone.longitude]}
                radius={zone.radius_km * 1000}
                pathOptions={{
                  color: "#ef4444",
                  fillColor: "#ef4444",
                  fillOpacity: 0.15,
                  dashArray: "4, 6",
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div className="text-xs p-1 space-y-1">
                    <p className="font-bold text-red-600">PUBLIC EMERGENCY ZONE</p>
                    <p className="font-semibold text-slate-800">{zone.title}</p>
                    <p className="text-[10px] text-slate-500">Radius: {zone.radius_km} km</p>
                  </div>
                </Popup>
              </Circle>
            ))}

          {/* Verified Spills */}
          {showSpills &&
            data?.spills.map((spill) => (
              <CircleMarker
                key={spill.id}
                center={[spill.latitude, spill.longitude]}
                radius={9}
                pathOptions={{
                  color: "#ffffff",
                  fillColor: "#dc2626",
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-xs p-1 space-y-1">
                    <span className="badge badge-danger text-[9px]">Verified Oil Spill</span>
                    <p className="font-mono font-bold text-slate-900 mt-1">{spill.id}</p>
                    <p className="text-slate-600">Severity: {spill.severity}</p>
                    {spill.area_km2 && <p className="text-slate-600">Spread: {spill.area_km2} km²</p>}
                    <p className="text-[10px] text-slate-400">
                      Coords: {spill.latitude.toFixed(2)}°, {spill.longitude.toFixed(2)}°
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

          {/* Citizen Reports */}
          {showReports &&
            data?.citizen_reports.map((rep) => (
              <CircleMarker
                key={rep.id}
                center={[rep.latitude, rep.longitude]}
                radius={7}
                pathOptions={{
                  color: "#ffffff",
                  fillColor: "#0284c7",
                  fillOpacity: 0.85,
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div className="text-xs p-1 space-y-1">
                    <span className="badge badge-info text-[9px]">Verified Citizen Report</span>
                    <p className="font-mono font-bold text-slate-900 mt-1">{rep.id}</p>
                    <p className="text-slate-600">Category: {rep.category.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-slate-400">
                      Coords: {rep.latitude.toFixed(2)}°, {rep.longitude.toFixed(2)}°
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
        </MapContainer>

        {/* Floating Legend */}
        <div className="absolute bottom-4 right-4 z-[400] p-3 rounded-xl bg-white/95 dark:bg-[#0c1f33]/95 border border-[#D9E8F2] dark:border-[#1a3854] shadow-xl text-xs space-y-2 backdrop-blur-md">
          <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block">
            Public Safety Legend
          </span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 border border-white" />
            <span>Verified Active Spill</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-600 border border-white" />
            <span>Verified Citizen Report</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500 border-dashed" />
            <span>Emergency Containment Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
}
