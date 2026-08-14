import { useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  UserCog,
  UserPlus,
  Mail,
  Lock,
  Phone,
  Trash2,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import StatusBadge from "../components/ui/StatusBadge";
import { useStaffStore } from "../stores/staff.store";
import { useUserStore } from "../stores/user.store";

export default function StaffPage() {
  const { role } = useUserStore();
  const {
    staff,
    isLoading,
    isSubmitting,
    error,
    getStaffAction,
    createStaffAction,
    deleteStaffAction,
    clearError,
  } = useStaffStore();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ _id: string; name: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  useEffect(() => {
    getStaffAction();
  }, [getStaffAction]);

  const isOwner = role === "cinema_owner";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createStaffAction({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      setForm({ name: "", email: "", password: "", phone: "" });
      setShowCreate(false);
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStaffAction(deleteTarget._id);
      setDeleteTarget(null);
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (error) clearError();
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  if (!isOwner) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-24 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
          <UserCog className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-60" />
          <h3 className="font-display font-bold text-lg text-white mb-1 uppercase tracking-wide">
            Access restricted
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Only cinema owners can manage staff members.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1">
            Partner Portal
          </p>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wide">
            Staff
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Invite team members to help manage your cinemas. Staff can update
            details, templates, screenings, and bookings — but not room layouts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-950/50 border border-red-800 rounded-lg flex items-center justify-between text-red-200 text-sm">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            {error}
          </span>
          <button
            type="button"
            onClick={clearError}
            className="text-xs bg-red-900 hover:bg-red-800 px-3 py-1 rounded transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
          <p className="text-sm">Loading staff...</p>
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
          <UserCog className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-60" />
          <h3 className="font-display font-bold text-lg text-white mb-1 uppercase tracking-wide">
            No staff yet
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Add your first staff member to delegate cinema operations.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-[11px] font-bold uppercase tracking-widest border-b border-slate-800">
                  <th className="px-5 py-3.5">Staff Member</th>
                  <th className="px-5 py-3.5 hidden sm:table-cell">Contact</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {staff.map((member) => (
                  <tr key={member._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-600 to-slate-900 flex items-center justify-center text-white font-display font-black uppercase shrink-0">
                          {member.name[0] ?? "S"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-[200px]">
                            {member.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">
                            ID: {member._id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <p className="text-slate-300 truncate max-w-[200px]">
                        {member.email}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">
                        {member.phone || "No phone"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label="cinema_staff" />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({ _id: member._id, name: member.name })
                          }
                          title="Remove staff"
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <Modal
          title="Add Staff Member"
          subtitle="Create an account your staff can use to sign into the partner portal."
          onClose={() => setShowCreate(false)}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={update("name")}
                placeholder="e.g. Alex Rivera"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50"
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder="staff@cinema.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={form.password}
                  onChange={update("password")}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="+1 555 123 4567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 flex items-center gap-2"
              >
                {isSubmitting && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Add Staff
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Remove Staff Member"
          message={`Remove "${deleteTarget.name}" from your team? They will lose access to the partner portal.`}
          isSubmitting={isSubmitting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
