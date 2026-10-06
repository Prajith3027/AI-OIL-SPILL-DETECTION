import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FilePlus2,
  MapPin,
  Calendar,
  AlertTriangle,
  Upload,
  Video,
  CheckCircle2,
  Compass,
  ArrowLeft,
} from "lucide-react";
import { citizenApi } from "../../services/citizenApi";

export default function CitizenReportPage() {
  const navigate = useNavigate();

  const now = new Date();
  const defaultDate = now.toISOString().split("T")[0];
  const defaultTime = now.toTimeString().slice(0, 5);

  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState<string>("13.0827");
  const [longitude, setLongitude] = useState<string>("80.2707");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [incidentCategory, setIncidentCategory] = useState("SURFACE_SHEEN");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setImageFile(f);
      setImagePreview(URL.createObjectURL(f));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleGetGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(6));
          setLongitude(pos.coords.longitude.toFixed(6));
        },
        (err) => {
          console.warn("Geolocation failed", err);
          setError("Unable to obtain GPS coordinates. Please enter manually.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("location", locationName || "Coastal Marine Area");
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append("date", date);
      formData.append("time", time);
      formData.append("description", description);
      formData.append("severity", severity);
      formData.append("incident_category", incidentCategory);

      if (imageFile) {
        formData.append("image", imageFile);
      }
      if (videoFile) {
        formData.append("video", videoFile);
      }

      const res = await citizenApi.submitReport(formData);
      setSuccessCode(res.report_code);
    } catch (err: unknown) {
      const errObj = err as { detail?: string; message?: string };
      setError(errObj.detail || errObj.message || "Failed to submit oil spill report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (successCode) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#17324D] dark:text-white">
            Report Submitted Successfully
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your tracking ID has been generated:
          </p>
          <p className="text-xl font-mono font-black text-[#0066b2] dark:text-[#00f3ff] pt-1">
            {successCode}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#F0F7FC] dark:bg-[#0e2740] border border-[#D9E8F2] dark:border-[#1f4263] text-xs text-slate-600 dark:text-slate-300 text-left space-y-1.5">
          <div className="font-bold text-[#17324D] dark:text-white flex items-center justify-between">
            <span>Status:</span>
            <span className="badge badge-info text-[10px]">SUBMITTED</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Your report is queued for Coast Guard MRCC and environmental authority triage. You can
            track its verification progress anytime under <strong>My Reports</strong>.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate("/citizen/my-reports")}
            className="btn-primary text-xs py-2 px-5 font-bold"
          >
            View My Reports
          </button>
          <button
            onClick={() => {
              setSuccessCode(null);
              setDescription("");
              setImageFile(null);
              setImagePreview(null);
              setVideoFile(null);
            }}
            className="btn-secondary text-xs py-2 px-4 font-semibold"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17324D] dark:text-white flex items-center gap-2">
            <FilePlus2 className="w-6 h-6 text-[#0066b2] dark:text-[#00f3ff]" />
            <span>Report Marine Oil Spill</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Provide precise coordinates and visual evidence for verified authority investigation.
          </p>
        </div>
        <button
          onClick={() => navigate("/citizen/dashboard")}
          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-900 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm space-y-5"
      >
        {/* Section 1: Location & Coordinates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0066b2] dark:text-[#00f3ff] flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>1. Location &amp; Coordinates</span>
            </h2>
            <button
              type="button"
              onClick={handleGetGPS}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0066b2] dark:text-[#00f3ff] hover:underline"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Use My Device GPS</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Coastal Area / Landmark Description
            </label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Marina Beach North Jetty / Ennore Port Outer Fairway"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F9FD] dark:bg-[#071521] border border-[#D9E8F2] dark:border-[#1a3854] text-xs focus:outline-none focus:border-[#0066b2]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Latitude (-90 to 90)</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="13.0827"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F9FD] dark:bg-[#071521] border border-[#D9E8F2] dark:border-[#1a3854] text-xs font-mono focus:outline-none focus:border-[#0066b2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Longitude (-180 to 180)</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="80.2707"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F9FD] dark:bg-[#071521] border border-[#D9E8F2] dark:border-[#1a3854] text-xs font-mono focus:outline-none focus:border-[#0066b2]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Date, Time & Observation Details */}
        <div className="space-y-3">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0066b2] dark:text-[#00f3ff] flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>2. Observation Details</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Date Observed</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F4F9FD] dark:bg-[#071521] border border-[#D9E8F2] dark:border-[#1a3854] text-xs focus:outline-none focus:border-[#0066b2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Time Observed</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F4F9FD] dark:bg-[#071521] border border-[#D9E8F2] dark:border-[#1a3854] text-xs focus:outline-none focus:border-[#0066b2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Severity Rating</label>
              <select
                value={severity}
                onChange={(e) =>
                  setSeverity(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#F4F9FD] dark:bg-[#071521] border border-[#D9E8F2] dark:border-[#1a3854] text-xs font-semibold focus:outline-none focus:border-[#0066b2]"
              >
                <option value="LOW">LOW — Thin Sheen / Odor</option>
                <option value="MEDIUM">MEDIUM — Visible Patches</option>
                <option value="HIGH">HIGH — Dense Black Oil</option>
                <option value="CRITICAL">CRITICAL — Spreading Shoreline Impact</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Incident Category</label>
              <select
                value={incidentCategory}
                onChange={(e) => setIncidentCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F4F9FD] dark:bg-[#071521] border border-[#D9E8F2] dark:border-[#1a3854] text-xs focus:outline-none focus:border-[#0066b2]"
              >
                <option value="SURFACE_SHEEN">Surface Hydrocarbon Sheen</option>
                <option value="TAR_BALLS">Tar Balls / Sticky Residue</option>
                <option value="HEAVY_BLACK_OIL">Heavy Crude / Black Sludge</option>
                <option value="VESSEL_DISCHARGE">Vessel Bilge / Ballast Discharge</option>
                <option value="SHORELINE_COATING">Shoreline / Rock Oiling</option>
                <option value="OTHER">Other Marine Anomaly</option>
              </select>
            </div>
            <div />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Description &amp; Environmental Observations
            </label>
            <textarea
              required
              rows={4}
              minLength={5}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe color, smell, approximate visible spread, whether wildlife or shoreline is affected, and any nearby vessel activity..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F9FD] dark:bg-[#071521] border border-[#D9E8F2] dark:border-[#1a3854] text-xs leading-relaxed focus:outline-none focus:border-[#0066b2]"
            />
          </div>
        </div>

        {/* Section 3: Photographic & Video Evidence */}
        <div className="space-y-3">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0066b2] dark:text-[#00f3ff] flex items-center gap-1.5">
              <Upload className="w-4 h-4" />
              <span>3. Media Evidence (Image &amp; Optional Video)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Image Upload */}
            <div className="p-4 rounded-xl border border-dashed border-[#D9E8F2] dark:border-[#1a3854] bg-[#F4F9FD]/50 dark:bg-[#071521]/50 space-y-2 text-center">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0066b2] dark:text-[#00f3ff] flex items-center justify-center mx-auto">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold">Upload Incident Photo</p>
              <p className="text-[10px] text-slate-500">JPG, PNG, WEBP (Max 10MB)</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0066b2] file:text-white"
              />
              {imagePreview && (
                <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 h-28 flex items-center justify-center bg-black">
                  <img src={imagePreview} alt="Preview" className="h-full object-cover" />
                </div>
              )}
            </div>

            {/* Video Upload */}
            <div className="p-4 rounded-xl border border-dashed border-[#D9E8F2] dark:border-[#1a3854] bg-[#F4F9FD]/50 dark:bg-[#071521]/50 space-y-2 text-center">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                <Video className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold">Optional Video Evidence</p>
              <p className="text-[10px] text-slate-500">MP4, WEBM, MOV (Max 50MB)</p>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoChange}
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white"
              />
              {videoFile && (
                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                  Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)}MB)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#0066b2] hover:bg-[#004e8c] text-white font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>SUBMITTING REPORT...</span>
              </>
            ) : (
              <>
                <FilePlus2 className="w-4 h-4" />
                <span>SUBMIT OIL SPILL REPORT</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
