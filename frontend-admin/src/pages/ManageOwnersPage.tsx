import { useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  AlertTriangle,
  Users,
  UserPlus,
  Mail,
  Lock,
  Phone,
  Check,
  Trash2,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import StatusBadge from "../components/ui/StatusBadge";
import { useOwnerStore } from "../stores/owner.store";

export default function ManageOwnersPage() {
  const {
    owners,
    isLoading,
    isSubmitting,
    isDeleting,
    error,
    getOwnersAction,
    createOwnerAction,
    deleteOwnerAction,
    clearError,
  } = useOwnerStore();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    _id: string;
    name: string;
  } | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  useEffect(() => {
    getOwnersAction();
  }, [getOwnersAction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOwnerAction({
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

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (error) clearError();
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setAdminPassword("");
    clearError();
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;
    try {
      await deleteOwnerAction(deleteTarget._id, adminPassword);
      setDeleteTarget(null);
      setAdminPassword("");
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1">
            Network
          </p>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wide">
            Cinema Owners
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {owners.length} registered cinema owner
            {owners.length !== 1 ? "s" : ""}. Owners onboard cinemas and manage
            their operations from the partner portal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Add Owner
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
          <p className="text-sm">Loading owners...</p>
        </div>
      ) : owners.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-60" />
          <h3 className="font-display font-bold text-lg text-white mb-1 uppercase tracking-wide">
            No owners yet
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Create your first cinema owner account. They will sign in to the
            partner portal to onboard their cinemas.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-[11px] font-bold uppercase tracking-widest border-b border-slate-800">
                  <th className="px-5 py-3.5">Owner</th>
                  <th className="px-5 py-3.5 hidden sm:table-cell">Contact</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5 hidden lg:table-cell">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {owners.map((owner) => (
                  <tr key={owner._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-slate-900 flex items-center justify-center text-white font-display font-black uppercase shrink-0">
                          {owner.name[0] ?? "O"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-[220px]">
                            {owner.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[220px]">
                            ID: {owner._id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <p className="text-slate-300 truncate max-w-[220px]">
                        {owner.email}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-[220px]">
                        {owner.phone || "No phone"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label="cinema_owner" />
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border text-emerald-400 bg-emerald-950/40 border-emerald-600/40">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({ _id: owner._id, name: owner.name })
                          }
                          title="Delete owner"
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
          title="Add Cinema Owner"
          subtitle="Create an account the owner can use to sign into the partner portal."
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
                placeholder="e.g. Jane Doe"
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
                  placeholder="owner@cinema.com"
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
                Create Owner
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          title="Delete Cinema Owner"
          subtitle={`Permanently remove "${deleteTarget.name}" and all associated data.`}
          onClose={closeDeleteModal}
          maxWidth="max-w-md"
        >
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-950/20 border border-red-600/30 mb-5">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300 leading-relaxed">
              This will permanently delete{" "}
              <span className="font-semibold text-white">
                {deleteTarget.name}
              </span>{" "}
              and their cinemas, templates, screenings, and bookings. This
              action cannot be undone.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleDelete} className="flex flex-col gap-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                Admin Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => {
                    if (error) clearError();
                    setAdminPassword(e.target.value);
                  }}
                  placeholder="Enter your admin password"
                  autoFocus
                  required
                  disabled={isDeleting}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Re-enter your password to confirm you are authorized to delete
                this owner.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDeleting || !adminPassword}
                className="bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Owner
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
