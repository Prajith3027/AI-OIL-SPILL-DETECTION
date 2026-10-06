import { useEffect, useState } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import type { User, AdminCitizenReport } from "../../types/auth";
import { MarineLoader } from "../../components/ui/MarineLoader";

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userReports, setUserReports] = useState<AdminCitizenReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (user: User) => {
    const nextStatus = !user.is_active;
    try {
      await adminApi.updateUserStatus(user.id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: nextStatus } : u))
      );
    } catch (err: any) {
      alert("Failed to update status: " + (err?.message || "Error"));
    }
  };

  const handleViewReports = async (user: User) => {
    setSelectedUser(user);
    setShowReportsModal(true);
    try {
      setReportsLoading(true);
      const data = await adminApi.getUserReports(user.id);
      setUserReports(data);
    } catch (err) {
      console.error("Failed to load user reports", err);
    } finally {
      setReportsLoading(false);
    }
  };

  const filtered = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-info text-[10px] font-mono">
              SECURITY ACCESS CONTROL
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              RBAC TIER-1 ADMIN
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17324D] dark:text-white mt-1">
            User Accounts &amp; Access Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Audit registered citizen reporters and administrative personnel, monitor account
            activity, review individual reporting history, and enforce security policies.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#D9E8F2] dark:border-[#1a3854] bg-white dark:bg-[#0c1f33] text-[#17324D] dark:text-white"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <MarineLoader text="Auditing User Directory..." />
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0c1f33] rounded-2xl border border-[#D9E8F2] dark:border-[#1a3854] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#10273d] text-slate-500 dark:text-slate-400 font-bold border-b border-[#D9E8F2] dark:border-[#1a3854]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#16334d]">
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#122b42] transition"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            u.role === "admin"
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                              : "bg-blue-100 text-[#1268B3] dark:bg-blue-900/40 dark:text-blue-300"
                          }`}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-[#17324D] dark:text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono">
                      {u.email}
                    </td>
                    <td className="py-3 px-4">
                      {u.role === "admin" ? (
                        <span className="badge badge-critical text-[9px] font-mono">
                          ADMIN AUTHORITY
                        </span>
                      ) : (
                        <span className="badge badge-info text-[9px] font-mono">
                          CITIZEN USER
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.is_active ? (
                        <span className="badge badge-success text-[9px] flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="badge text-[9px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" />
                          <span>Deactivated</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[10px]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "Recent"}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[10px]">
                      {u.last_login_at
                        ? new Date(u.last_login_at).toLocaleString()
                        : "Never logged in"}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {u.role === "citizen" && (
                        <button
                          onClick={() => handleViewReports(u)}
                          className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#143049] text-slate-700 dark:text-slate-200 text-[11px] font-bold"
                        >
                          Reports
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`py-1 px-2.5 rounded-lg text-[11px] font-bold transition ${
                          u.is_active
                            ? "bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }`}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Reports Modal */}
      {showReportsModal && selectedUser && (
        <div className="fixed inset-0 bg-[#00172e]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0c1f33] rounded-2xl max-w-2xl w-full border border-[#D9E8F2] dark:border-[#1a3854] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#16334d]">
              <div>
                <span className="badge badge-info text-[9px] font-mono">SUBMISSION AUDIT</span>
                <h3 className="text-base font-black text-[#17324D] dark:text-white mt-0.5">
                  Reports Submitted by {selectedUser.name}
                </h3>
              </div>
              <button
                onClick={() => setShowReportsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-[#143049] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportsLoading ? (
              <div className="h-48 flex items-center justify-center">
                <MarineLoader text="Fetching User Incident History..." />
              </div>
            ) : userReports.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                This citizen user has not submitted any reports yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {userReports.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#10273d] border border-slate-200 dark:border-[#1c3e5e] text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-[#1268B3]">Report #{r.report_code || r.id.slice(0, 8)}</span>
                      <span className="badge badge-info text-[9px]">{r.status}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{r.description}</p>
                    <div className="text-[10px] text-slate-400 flex justify-between pt-1">
                      <span>{r.location_description || "Offshore"}</span>
                      <span>{r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-[#16334d] flex justify-end">
              <button
                onClick={() => setShowReportsModal(false)}
                className="btn-secondary text-xs py-1.5 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
