import { User, Mail, Shield, Calendar, CheckCircle2, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CitizenProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#17324D] dark:text-white flex items-center gap-2">
          <User className="w-6 h-6 text-[#0066b2] dark:text-[#00f3ff]" />
          <span>Citizen Account Profile</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your verified coastal observer credentials.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-[#0066b2] text-white flex items-center justify-center font-black text-2xl shadow-md">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "CZ"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#17324D] dark:text-white">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge badge-info text-[10px]">CITIZEN OBSERVER</span>
              <span className="badge badge-success text-[10px]">ACTIVE ACCOUNT</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#0066b2] dark:text-[#00f3ff]" />
              <span>Email Address</span>
            </span>
            <span className="font-mono font-semibold text-[#17324D] dark:text-white">
              {user?.email}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0066b2] dark:text-[#00f3ff]" />
              <span>Assigned Role</span>
            </span>
            <span className="font-mono font-bold uppercase text-[#0066b2] dark:text-[#00f3ff]">
              {user?.role}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#087F68]" />
              <span>Account Status</span>
            </span>
            <span className="font-semibold text-[#087F68]">Active &amp; Verified</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0066b2] dark:text-[#00f3ff]" />
              <span>Registration Date</span>
            </span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Active"}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
