import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  Building2,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import StatusBadge from "../components/ui/StatusBadge";
import { Field, TextInput, TextArea } from "../components/ui/form";
import { useCinemaStore } from "../stores/cinema.store";
import {
  type ICinema,
  type CreateCinemaPayload,
} from "../types/cinema.type";

interface CinemaFormState {
  name: string;
  ownerId: string;
  description: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
  totalScreens: string;
  openingHours: string;
  amenities: string;
  images: string;
  latitude: string;
  longitude: string;
  isActive: boolean;
}

const emptyForm: CinemaFormState = {
  name: "",
  ownerId: "",
  description: "",
  street: "",
  city: "",
  state: "",
  country: "",
  zipCode: "",
  phone: "",
  email: "",
  totalScreens: "1",
  openingHours: "10:00 AM - 11:30 PM",
  amenities: "",
  images: "",
  latitude: "",
  longitude: "",
  isActive: true,
};

const splitList = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const buildPayload = (form: CinemaFormState): CreateCinemaPayload => {
  const hasCoords =
    form.latitude.trim() !== "" && form.longitude.trim() !== "";
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);

  return {
    name: form.name.trim(),
    ownerId: form.ownerId.trim(),
    description: form.description.trim() || undefined,
    address: {
      street: form.street.trim(),
      city: form.city.trim(),
      state: form.state.trim() || undefined,
      country: form.country.trim(),
      zipCode: form.zipCode.trim() || undefined,
    },
    phone: form.phone.trim(),
    email: form.email.trim(),
    totalScreens: Number(form.totalScreens),
    openingHours: form.openingHours.trim() || undefined,
    amenities: splitList(form.amenities),
    images: splitList(form.images),
    isActive: form.isActive,
    location:
      hasCoords && Number.isFinite(latitude) && Number.isFinite(longitude)
        ? { type: "Point", coordinates: [longitude, latitude] }
        : undefined,
  };
};

const toForm = (cinema: ICinema): CinemaFormState => ({
  name: cinema.name,
  ownerId: cinema.ownerId ?? "",
  description: cinema.description ?? "",
  street: cinema.address?.street ?? "",
  city: cinema.address?.city ?? "",
  state: cinema.address?.state ?? "",
  country: cinema.address?.country ?? "",
  zipCode: cinema.address?.zipCode ?? "",
  phone: cinema.phone ?? "",
  email: cinema.email ?? "",
  totalScreens: cinema.totalScreens ? String(cinema.totalScreens) : "1",
  openingHours: cinema.openingHours ?? "",
  amenities: (cinema.amenities ?? []).join(", "),
  images: (cinema.images ?? []).join(", "),
  latitude: cinema.location?.coordinates?.[1] != null ? String(cinema.location.coordinates[1]) : "",
  longitude: cinema.location?.coordinates?.[0] != null ? String(cinema.location.coordinates[0]) : "",
  isActive: cinema.isActive ?? true,
});

export default function ManageCinemasPage() {
  const {
    cinemas,
    count,
    isLoading,
    isSubmitting,
    error,
    getAllCinemasAction,
    createCinemaAction,
    updateCinemaAction,
    deleteCinemaAction,
    clearError,
  } = useCinemaStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "active" | "inactive">("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCinema, setEditingCinema] = useState<ICinema | null>(null);
  const [form, setForm] = useState<CinemaFormState>(emptyForm);

  const [deleteTarget, setDeleteTarget] = useState<ICinema | null>(null);

  useEffect(() => {
    getAllCinemasAction();
  }, [getAllCinemasAction]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cinemas.filter((cinema) => {
      const matchSearch =
        !term ||
        cinema.name.toLowerCase().includes(term) ||
        cinema.address.city.toLowerCase().includes(term) ||
        cinema.address.country.toLowerCase().includes(term) ||
        cinema.email.toLowerCase().includes(term);
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "active" && cinema.isActive) ||
        (statusFilter === "inactive" && !cinema.isActive);
      return matchSearch && matchStatus;
    });
  }, [cinemas, search, statusFilter]);

  const openCreate = () => {
    clearError();
    setEditingCinema(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (cinema: ICinema) => {
    clearError();
    setEditingCinema(cinema);
    setForm(toForm(cinema));
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCinema?._id) {
        await updateCinemaAction(String(editingCinema._id), buildPayload(form));
      } else {
        await createCinemaAction(buildPayload(form));
      }
      setModalOpen(false);
      setEditingCinema(null);
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      await deleteCinemaAction(String(deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  const update = (patch: Partial<CinemaFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1">
            Network
          </p>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wide">
            Manage Cinemas
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {count} registered cinema{count !== 1 ? "s" : ""}.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-all shadow-lg shadow-red-600/25 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Cinema
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city, or email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600/60 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(["ALL", "active", "inactive"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`text-xs px-3.5 py-2 rounded-full border transition-all whitespace-nowrap shrink-0 ${
                statusFilter === status
                  ? "bg-red-600 border-red-600 text-white font-bold"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
              }`}
            >
              {status === "ALL" ? "All" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
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

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
          <p className="text-sm">Loading cinemas...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-60" />
          <h3 className="font-display font-bold text-lg text-white mb-1 uppercase tracking-wide">
            No cinemas found
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Register your first cinema or adjust your search filters.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all"
          >
            Add Cinema
          </button>
        </div>
      ) : (
        /* Table */
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-[11px] font-bold uppercase tracking-widest border-b border-slate-800">
                  <th className="px-5 py-3.5">Cinema</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">Location</th>
                  <th className="px-5 py-3.5 hidden lg:table-cell">Screens</th>
                  <th className="px-5 py-3.5 hidden sm:table-cell">Contact</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((cinema) => (
                  <tr key={String(cinema._id)} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {cinema.images && cinema.images.length > 0 ? (
                          <img
                            src={cinema.images[0]}
                            alt={cinema.name}
                            className="w-12 h-9 object-cover rounded-md bg-slate-800 border border-slate-800 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-9 rounded-md bg-slate-800 border border-slate-800 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-[220px]">
                            {cinema.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[220px]">
                            Owner: {cinema.ownerId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-300">
                      <p className="truncate max-w-[180px]">
                        {cinema.address.city}, {cinema.address.country}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-slate-300">
                      {cinema.totalScreens}
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <p className="text-slate-300 truncate max-w-[180px]">
                        {cinema.email}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-[180px]">
                        {cinema.phone}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={cinema.isActive ? "active" : "inactive"} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(cinema)}
                          title="Edit cinema"
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(cinema)}
                          title="Delete cinema"
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

      {/* Create / Edit modal */}
      {modalOpen && (
        <Modal
          title={editingCinema ? "Edit Cinema" : "Add Cinema"}
          subtitle={
            editingCinema
              ? `Updating "${editingCinema.name}"`
              : "Register a new cinema venue in the network."
          }
          onClose={() => {
            if (!isSubmitting) {
              setModalOpen(false);
              setEditingCinema(null);
            }
          }}
          maxWidth="max-w-3xl"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-600/50 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Cinema Name" required>
                  <TextInput
                    type="text"
                    value={form.name}
                    onChange={(e) => update({ name: e.target.value })}
                    placeholder="CineMatrix Downtown"
                    required
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field
                  label="Owner User ID"
                  required
                  hint="ObjectId of the cinema_owner user. Run `npm run seed:admin` to create a demo owner and get its ID."
                >
                  <TextInput
                    type="text"
                    value={form.ownerId}
                    onChange={(e) => update({ ownerId: e.target.value })}
                    placeholder="User ObjectId"
                    required
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Description">
                  <TextArea
                    rows={3}
                    value={form.description}
                    onChange={(e) => update({ description: e.target.value })}
                    placeholder="Short description of the venue..."
                  />
                </Field>
              </div>

              <Field label="Street" required>
                <TextInput
                  type="text"
                  value={form.street}
                  onChange={(e) => update({ street: e.target.value })}
                  placeholder="777 Grand Ave"
                  required
                />
              </Field>

              <Field label="City" required>
                <TextInput
                  type="text"
                  value={form.city}
                  onChange={(e) => update({ city: e.target.value })}
                  placeholder="New York"
                  required
                />
              </Field>

              <Field label="State / Province">
                <TextInput
                  type="text"
                  value={form.state}
                  onChange={(e) => update({ state: e.target.value })}
                  placeholder="NY"
                />
              </Field>

              <Field label="Country" required>
                <TextInput
                  type="text"
                  value={form.country}
                  onChange={(e) => update({ country: e.target.value })}
                  placeholder="USA"
                  required
                />
              </Field>

              <Field label="Zip Code">
                <TextInput
                  type="text"
                  value={form.zipCode}
                  onChange={(e) => update({ zipCode: e.target.value })}
                  placeholder="10018"
                />
              </Field>

              <Field label="Phone" required>
                <TextInput
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </Field>

              <Field label="Email" required>
                <TextInput
                  type="email"
                  value={form.email}
                  onChange={(e) => update({ email: e.target.value })}
                  placeholder="hello@cinematrix.com"
                  required
                />
              </Field>

              <Field label="Total Screens" required>
                <TextInput
                  type="number"
                  min={1}
                  value={form.totalScreens}
                  onChange={(e) => update({ totalScreens: e.target.value })}
                  placeholder="12"
                  required
                />
              </Field>

              <Field label="Opening Hours">
                <TextInput
                  type="text"
                  value={form.openingHours}
                  onChange={(e) => update({ openingHours: e.target.value })}
                  placeholder="10:00 AM - 11:30 PM"
                />
              </Field>

              <Field label="Amenities" hint="Comma-separated, e.g. IMAX, Dolby Atmos">
                <TextInput
                  type="text"
                  value={form.amenities}
                  onChange={(e) => update({ amenities: e.target.value })}
                  placeholder="IMAX, Dolby Atmos, VIP Lounge"
                />
              </Field>

              <Field label="Images" hint="Comma-separated image URLs.">
                <TextInput
                  type="text"
                  value={form.images}
                  onChange={(e) => update({ images: e.target.value })}
                  placeholder="https://.../photo.jpg"
                />
              </Field>

              <Field label="Latitude" hint="Optional geo coordinates.">
                <TextInput
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => update({ latitude: e.target.value })}
                  placeholder="40.7614"
                />
              </Field>

              <Field label="Longitude" hint="Optional geo coordinates.">
                <TextInput
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => update({ longitude: e.target.value })}
                  placeholder="-73.9776"
                />
              </Field>

              <div className="sm:col-span-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={form.isActive}
                    onClick={() => update({ isActive: !form.isActive })}
                    className={`w-4 h-4 rounded border transition-all flex items-center justify-center shrink-0 ${
                      form.isActive
                        ? "bg-red-600 border-red-600"
                        : "border-slate-700 bg-slate-950"
                    }`}
                  >
                    {form.isActive && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                  <span className="text-sm font-semibold text-slate-300">
                    Active venue (visible to moviegoers)
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingCinema(null);
                }}
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
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingCinema ? "Save Changes" : "Create Cinema"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Cinema"
          message={`Are you sure you want to permanently delete "${deleteTarget.name}"? This action cannot be undone.`}
          isSubmitting={isSubmitting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
