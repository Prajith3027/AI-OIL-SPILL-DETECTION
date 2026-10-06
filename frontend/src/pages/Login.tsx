import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Waves,
  Shield,
  User as UserIcon,
  Satellite,
  Radar,
  Radio,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  HelpCircle,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/authApi";
import { MarineSurveillanceCanvas } from "../components/auth/MarineSurveillanceCanvas";
import type { UserRole } from "../types/auth";

type LoginPhase = "IDLE" | "AUTHENTICATING" | "VERIFYING_ROLE" | "ACCESS_GRANTED" | "FAILED";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<UserRole>("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginPhase, setLoginPhase] = useState<LoginPhase>("IDLE");
  const [grantedText, setGrantedText] = useState("");

  // Modals
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);

  const handleRoleSwitch = (role: UserRole) => {
    setActiveTab(role);
    setErrorMessage(null);
    setLoginPhase("IDLE");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setErrorMessage(null);
    setLoginPhase("AUTHENTICATING");

    try {
      // Step 1: Authenticating
      await new Promise((r) => setTimeout(r, 600));
      setLoginPhase("VERIFYING_ROLE");

      // Step 2: Role Verification & Token Grant
      const user = await login(email, password, activeTab);

      // Step 3: Access Granted
      await new Promise((r) => setTimeout(r, 600));
      setLoginPhase("ACCESS_GRANTED");
      const granted =
        user.role === "admin" ? "AUTHORIZED ADMIN ACCESS GRANTED" : "CITIZEN ACCESS GRANTED";
      setGrantedText(granted);

      // Navigate smoothly after display
      setTimeout(() => {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
        if (from && !from.includes("/login")) {
          navigate(from, { replace: true });
        } else {
          navigate(user.role === "admin" ? "/admin/dashboard" : "/citizen/dashboard", {
            replace: true,
          });
        }
      }, 900);
    } catch (err: unknown) {
      setLoginPhase("FAILED");
      const errObj = err as { detail?: string; message?: string };
      const rawDetail = errObj.detail || errObj.message || "Invalid credentials";
      if (rawDetail.includes("role") || rawDetail.includes("Unauthorized role")) {
        setErrorMessage("Unauthorized role. Please use the correct login option.");
      } else if (rawDetail.includes("inactive")) {
        setErrorMessage("Account is deactivated. Contact port state authorities.");
      } else {
        setErrorMessage("Invalid credentials");
      }
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    try {
      const res = await authApi.forgotPassword(forgotEmail);
      setForgotMsg(res.message);
    } catch {
      setForgotMsg("If an account exists for this email, the administrator has been notified.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegLoading(true);
    try {
      await register(regName, regEmail, regPassword);
      setRegSuccess(true);
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegSuccess(false);
        setEmail(regEmail);
        setActiveTab("citizen");
      }, 1500);
    } catch (err: unknown) {
      const errObj = err as { detail?: string; message?: string };
      setRegError(errObj.detail || errObj.message || "Unable to register citizen account.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#000b1a] text-[#EAF6FF]">
      {/* ── Dynamic Marine Surveillance & GIS Canvas Background ────────────── */}
      <MarineSurveillanceCanvas role={activeTab} />

      {/* ── Top Surveillance Status Bar ───────────────────────────────────── */}
      <header className="relative z-10 w-full px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between border-b border-[#00f3ff]/15 bg-[#001428]/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#002f5c] border border-[#00f3ff]/40 flex items-center justify-center text-[#00f3ff] shadow-[0_0_12px_rgba(0,243,255,0.4)]">
            <Waves className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black tracking-widest text-[#EAF6FF] uppercase">
              SIH26143 • MARINE GUARDIAN
            </span>
            <div className="text-[10px] text-[#00f3ff] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#087F68] animate-pulse" />
              <span>INDIAN MARITIME SURVEILLANCE &amp; EMERGENCY COMMAND</span>
            </div>
          </div>
        </div>

        {/* System telemetry indicators */}
        <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <Satellite className="w-3.5 h-3.5 text-[#00f3ff]" />
            <span>SAT SCAN:</span>
            <span className="text-[#087F68] font-bold">ONLINE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#00f3ff]" />
            <span>AI ENGINE:</span>
            <span className="text-[#087F68] font-bold">READY</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radar className="w-3.5 h-3.5 text-[#00f3ff]" />
            <span>AIS CORRELATION:</span>
            <span className="text-[#087F68] font-bold">READY</span>
          </div>
        </div>
      </header>

      {/* ── Center Stage: Login Card & Mode Description ───────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Header Callout */}
          <div className="text-center mb-5 space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#001e3d]/80 border border-[#00f3ff]/30 text-[11px] font-mono text-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.2)]">
              <Shield className="w-3.5 h-3.5 text-[#00f3ff]" />
              <span>OPERATIONAL ACCESS CONTROL • RBAC SECURED</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1 drop-shadow-md">
              MARINE GUARDIAN
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              AI Marine Monitoring &amp; Spill Emergency Response System
            </p>
          </div>

          {/* Mode Switch Tabs: [ CITIZEN ] [ ADMIN ] */}
          <div
            className="grid grid-cols-2 p-1 mb-3 rounded-xl bg-[#00172d]/90 border border-[#00f3ff]/25 shadow-lg backdrop-blur-md"
            role="tablist"
            aria-label="Login Mode Selection"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "citizen"}
              onClick={() => handleRoleSwitch("citizen")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-300 ${
                activeTab === "citizen"
                  ? "bg-gradient-to-r from-[#005599] to-[#0077cc] text-white shadow-[0_0_15px_rgba(0,180,255,0.4)] border border-[#00f3ff]/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>CITIZEN LOGIN</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "admin"}
              onClick={() => handleRoleSwitch("admin")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-300 ${
                activeTab === "admin"
                  ? "bg-gradient-to-r from-[#8b1527] to-[#b91c1c] text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-[#f87171]/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>ADMIN LOGIN</span>
            </button>
          </div>

          {/* Mode Context Description Banner */}
          <div
            className={`p-2.5 mb-3.5 rounded-lg border text-[11px] leading-relaxed transition-all duration-300 ${
              activeTab === "citizen"
                ? "bg-[#002447]/60 border-[#00b4d8]/40 text-cyan-200"
                : "bg-[#2a0e14]/60 border-[#ef4444]/40 text-rose-200"
            }`}
          >
            {activeTab === "citizen" ? (
              <div className="flex items-start gap-2">
                <span className="badge badge-success text-[9px] px-1.5 py-0.5 shrink-0">PUBLIC</span>
                <span>
                  <strong>Report &amp; Alert:</strong> Citizens and coastal fishermen can report
                  hydrocarbon anomalies and receive public coastal safety warnings.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <span className="badge badge-critical text-[9px] px-1.5 py-0.5 shrink-0">COMMAND</span>
                <span>
                  <strong>Monitor &amp; Investigate:</strong> Coast Guard MRCC, port authorities, and
                  analysts investigate spills, inspect AIS ship trajectories, and evaluate hindcasting.
                </span>
              </div>
            )}
          </div>

          {/* Login Card */}
          <div className="p-6 rounded-2xl bg-[#00172e]/85 border border-[#00f3ff]/30 shadow-[0_8px_32px_rgba(0,10,30,0.85)] backdrop-blur-xl">
            {errorMessage && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center gap-2.5 text-xs text-red-200 animate-shake"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quick Demo Credentials Auto-Fill Pill */}
            <div className="mb-4 p-2.5 rounded-xl bg-[#001024]/90 border border-[#00f3ff]/20 flex items-center justify-between gap-2">
              <div className="text-[11px] font-mono leading-tight">
                <span className="text-slate-400">Demo {activeTab === "admin" ? "Admin" : "Citizen"}: </span>
                <span className={activeTab === "admin" ? "text-rose-300 font-bold" : "text-cyan-300 font-bold"}>
                  {activeTab === "admin" ? "admin@maritime.gov.in" : "citizen@marine.org"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (activeTab === "admin") {
                    setEmail("admin@maritime.gov.in");
                    setPassword("Admin@Maritime2026");
                  } else {
                    setEmail("citizen@marine.org");
                    setPassword("Citizen@2026");
                  }
                  setErrorMessage(null);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase transition border cursor-pointer ${
                  activeTab === "admin"
                    ? "bg-rose-950/60 border-rose-500/50 text-rose-300 hover:bg-rose-900/80 hover:text-white"
                    : "bg-cyan-950/60 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/80 hover:text-white"
                }`}
              >
                Auto-Fill
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      activeTab === "admin" ? "admin@command.navy.gov.in" : "citizen@marine.org"
                    }
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#000e1f] border border-[#00f3ff]/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f3ff] focus:ring-1 focus:ring-[#00f3ff] transition font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-[#00f3ff] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#000e1f] border border-[#00f3ff]/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f3ff] focus:ring-1 focus:ring-[#00f3ff] transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Login Action Button with Sequential Animation */}
              <button
                type="submit"
                disabled={loginPhase !== "IDLE" && loginPhase !== "FAILED"}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  activeTab === "admin"
                    ? "bg-gradient-to-r from-[#b91c1c] via-[#dc2626] to-[#ef4444] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] text-white"
                    : "bg-gradient-to-r from-[#0066b2] via-[#0088dd] to-[#00f3ff] text-[#00172e] hover:shadow-[0_0_20px_rgba(0,243,255,0.5)]"
                } disabled:opacity-80`}
              >
                {loginPhase === "AUTHENTICATING" && (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                )}
                {loginPhase === "VERIFYING_ROLE" && (
                  <>
                    <Radar className="w-4 h-4 animate-spin text-current" />
                    <span>VERIFYING ROLE...</span>
                  </>
                )}
                {loginPhase === "ACCESS_GRANTED" && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 font-extrabold">{grantedText}</span>
                  </>
                )}
                {(loginPhase === "IDLE" || loginPhase === "FAILED") && (
                  <>
                    <span>{activeTab === "admin" ? "ACCESS COMMAND CENTER" : "LOGIN AS CITIZEN"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Citizen self-service register link */}
            {activeTab === "citizen" && (
              <div className="mt-4 pt-3.5 border-t border-slate-700/60 text-center">
                <p className="text-xs text-slate-300">
                  New coastal reporter or fisherman?{" "}
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(true)}
                    className="text-[#00f3ff] hover:underline font-bold"
                  >
                    Register Account
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Bottom Surveillance Telemetry Strip ───────────────────────────── */}
      <footer className="relative z-10 w-full px-4 sm:px-8 py-2.5 border-t border-[#00f3ff]/15 bg-[#001428]/70 backdrop-blur-md flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="text-[#00f3ff] font-bold">SURVEILLANCE SUBSYSTEMS:</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> SATELLITE SCAN
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> AI DETECTION
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> AIS TRACKING
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> HINDCASTING
          </span>
        </div>
        <div className="text-slate-400">
          Smart India Hackathon 2026 • SIH26143 Emergency Response Framework
        </div>
      </footer>

      {/* ── Forgot Password Modal ─────────────────────────────────────────── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#00172e] border border-[#00f3ff]/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-base font-bold text-white">
              <HelpCircle className="w-5 h-5 text-[#00f3ff]" />
              <span>Password Recovery</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enter your registered maritime or citizen email address. Password reset instructions
              will be dispatched securely.
            </p>
            {forgotMsg ? (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-200">
                {forgotMsg}
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#000e1f] border border-[#00f3ff]/30 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f3ff]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#00f3ff] text-[#00172e] font-bold text-xs uppercase tracking-wider hover:bg-[#38f8ff]"
                >
                  Send Reset Request
                </button>
              </form>
            )}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotMsg(null);
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Citizen Register Modal ────────────────────────────────────────── */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#00172e] border border-[#00f3ff]/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-base font-bold text-white">
              <UserPlus className="w-5 h-5 text-[#00f3ff]" />
              <span>Citizen Registration</span>
            </div>
            <p className="text-xs text-slate-300">
              Register as a coastal citizen or fisherman to submit field oil-spill observations.
            </p>

            {regError && (
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-xs text-red-200">
                {regError}
              </div>
            )}
            {regSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Account created! Redirecting to login...</span>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="R. Murugan"
                    className="w-full px-3 py-2 rounded-xl bg-[#000e1f] border border-[#00f3ff]/30 text-sm text-white focus:outline-none focus:border-[#00f3ff]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="murugan@fishermen.org"
                    className="w-full px-3 py-2 rounded-xl bg-[#000e1f] border border-[#00f3ff]/30 text-sm text-white focus:outline-none focus:border-[#00f3ff]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Password (min 8 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-[#000e1f] border border-[#00f3ff]/30 text-sm text-white focus:outline-none focus:border-[#00f3ff]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-2.5 rounded-xl bg-[#00f3ff] text-[#00172e] font-bold text-xs uppercase tracking-wider hover:bg-[#38f8ff] disabled:opacity-60"
                >
                  {regLoading ? "Registering..." : "Create Citizen Account"}
                </button>
              </form>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
