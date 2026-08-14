import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Loader2,
  AlertCircle,
  Building2,
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Save,
  Ticket,
  CalendarClock,
  Clapperboard,
} from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import ImageUpload from "../components/ui/ImageUpload";
import SeatLayoutBuilder from "../components/ui/SeatLayoutBuilder";
import MapPicker, { type MapLocation } from "../components/ui/MapPicker";
import { makeGrid } from "../utils/seatLayout";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useCinemaStore } from "../stores/cinema.store";
import { useUserStore } from "../stores/user.store";
import type {
  ICinema,
  ICinemaAnnouncement,
  SeatCellType,
  UpdateCinemaPayload,
} from "../types/cinema.type";

type TabKey = "details" | "announcements" | "rooms";

const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "announcements", label: "Announcements" },
  { key: "rooms", label: "Rooms & Layout" },
];

const MiniGrid = ({ grid }: { grid: SeatCellType[][] }) => {
  const cellClass: Record<SeatCellType, string> = {
    seat: "bg-red-600/70",
    double: "bg-rose-600/70",
    walkway: "bg-slate-700/40",
    stairs: "bg-amber-500/60",
    empty: "bg-slate-900",
  };
  return (
    <div className="flex flex-col gap-0.5">
      {grid.map((rowArr, r) => (
        <div key={r} className="flex gap-0.5">
          {rowArr.map((cell, c) => (
            <span
              key={c}
              className={`w-2 h-2 rounded-[2px] ${cellClass[cell]}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default function CinemaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useUserStore();
  const {
    selectedCinema,
    isLoading,
    isSubmitting,
    error,
    getCinemaByIdAction,
    updateCinemaAction,
    clearError,
  } = useCinemaStore();

  const [tab, setTab] = useState<TabKey>("details");

  useEffect(() => {
    if (id) getCinemaByIdAction(id);
  }, [id, getCinemaByIdAction]);

  const isOwner = role === "cinema_owner";

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate("/my-cinemas")}
        className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Cinemas
      </button>

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
          <p className="text-sm">Loading cinema workspace...</p>
        </div>
      ) : !selectedCinema ? (
        <div className="text-center py-24 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-60" />
          <h3 className="font-display font-bold text-lg text-white mb-1 uppercase tracking-wide">
            Cinema not found
          </h3>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              {selectedCinema.images && selectedCinema.images.length > 0 ? (
                <img
                  src={selectedCinema.images[0]}
                  alt={selectedCinema.name}
                  className="w-20 h-14 object-cover rounded-xl border border-slate-800"
                />
              ) : (
                <div className="w-20 h-14 rounded-xl bg-slate-800 border border-slate-800 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-slate-500" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h1 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-wide">
                    {selectedCinema.name}
                  </h1>
                  <StatusBadge label={selectedCinema.status} />
                </div>
                <p className="text-slate-400 text-sm">
                  {selectedCinema.address.city}, {selectedCinema.address.country}{" "}
                  · {selectedCinema.rooms?.length ?? 0} room
                  {(selectedCinema.rooms?.length ?? 0) !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedCinema.status !== "active" && (
                <span className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-600/40 rounded-lg px-3 py-1.5 font-semibold">
                  Waiting for admin approval before go-live
                </span>
              )}
              <button
                type="button"
                onClick={() =>
                  navigate(`/cinemas/${String(selectedCinema._id)}/screenings`)
                }
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-lg transition-colors"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                Screenings
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(`/cinemas/${String(selectedCinema._id)}/bookings`)
                }
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-lg transition-colors"
              >
                <Ticket className="w-3.5 h-3.5" />
                Bookings
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`text-xs px-4 py-2.5 rounded-lg border transition-all whitespace-nowrap shrink-0 font-semibold ${
                  tab === key
                    ? "bg-red-600 border-red-600 text-white"
                    : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "details" && (
            <DetailsTab
              cinema={selectedCinema}
              isSubmitting={isSubmitting}
              onSave={updateCinemaAction}
            />
          )}
          {tab === "announcements" && (
            <AnnouncementsTab
              cinema={selectedCinema}
              isSubmitting={isSubmitting}
              onSave={updateCinemaAction}
            />
          )}
          {tab === "rooms" && (
            <RoomsTab
              cinema={selectedCinema}
              isOwner={isOwner}
              isSubmitting={isSubmitting}
              onSave={updateCinemaAction}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Details tab                                                          */
/* ------------------------------------------------------------------ */

function DetailsTab({
  cinema,
  isSubmitting,
  onSave,
}: {
  cinema: ICinema;
  isSubmitting: boolean;
  onSave: (id: string, payload: UpdateCinemaPayload) => Promise<void>;
}) {
  const [name, setName] = useState(cinema.name);
  const [description, setDescription] = useState(cinema.description ?? "");
  const [phone, setPhone] = useState(cinema.phone);
  const [email, setEmail] = useState(cinema.email);
  const [street, setStreet] = useState(cinema.address.street);
  const [city, setCity] = useState(cinema.address.city);
  const [state, setState] = useState(cinema.address.state ?? "");
  const [country, setCountry] = useState(cinema.address.country);
  const [location, setLocation] = useState<MapLocation | null>(
    cinema.location &&
      Number.isFinite(cinema.location.lat) &&
      Number.isFinite(cinema.location.lng)
      ? cinema.location
      : null,
  );
  const [website, setWebsite] = useState(cinema.socials?.website ?? "");
  const [allowPayInPerson, setAllowPayInPerson] = useState(
    cinema.allowPayInPerson,
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(String(cinema._id), {
        name: name.trim(),
        description: description.trim() || undefined,
        phone: phone.trim(),
        email: email.trim(),
        address: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim() || undefined,
          country: country.trim(),
        },
        location: location ?? undefined,
        socials: website.trim() ? { website: website.trim() } : undefined,
        allowPayInPerson,
        imageFiles,
      });
    } catch {
      // Error is stored in the Zustand store state
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
          Basic details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
              Cinema Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/60 transition-all"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/60 transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/60 transition-all"
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/60 transition-all"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/60 transition-all"
            />
          </div>
          <label className="sm:col-span-2 flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={allowPayInPerson}
              onChange={(e) => setAllowPayInPerson(e.target.checked)}
              className="accent-red-600 w-4 h-4"
            />
            <span className="text-sm font-semibold text-white">
              Allow pay-in-person bookings
            </span>
          </label>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
          Address
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
              Street
            </label>
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/60 transition-all"
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/60 transition-all"
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
              State
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/60 transition-all"
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
              Country
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/60 transition-all"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
              Pin your location on the map
            </label>
            <MapPicker value={location} onChange={setLocation} />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
          Main image
        </p>
        <ImageUpload
          label="Replace image"
          hint="Uploading a new image replaces the current one."
          currentSrc={cinema.images?.[0]}
          files={imageFiles}
          onChange={setImageFiles}
          previewClassName="w-40 h-24"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting || saving}
          className="bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 flex items-center gap-2"
        >
          {(isSubmitting || saving) && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}
          <Save className="w-3.5 h-3.5" />
          Save Changes
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Announcements tab                                                    */
/* ------------------------------------------------------------------ */

function AnnouncementsTab({
  cinema,
  isSubmitting,
  onSave,
}: {
  cinema: ICinema;
  isSubmitting: boolean;
  onSave: (id: string, payload: UpdateCinemaPayload) => Promise<void>;
}) {
  const [items, setItems] = useState<ICinemaAnnouncement[]>(
    cinema.announcements?.length ? cinema.announcements : [],
  );
  const [saving, setSaving] = useState(false);

  const updateItem = (index: number, patch: Partial<ICinemaAnnouncement>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => setItems((prev) => [...prev, { title: "", body: "" }]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const announcements = items
        .filter((item) => item.title?.trim() || item.body?.trim())
        .map((item) => ({
          title: item.title?.trim(),
          body: item.body?.trim(),
          imageUrl: item.imageUrl?.trim() || undefined,
        }));
      await onSave(String(cinema._id), { announcements });
    } catch {
      // Error is stored in the Zustand store state
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide">
            Announcements
          </h3>
          <p className="text-slate-400 text-sm">
            Shown to customers on the cinema page.
          </p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Announcement
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
          <Clapperboard className="w-10 h-10 mx-auto mb-3 text-slate-600 opacity-60" />
          <p className="text-slate-400 text-sm">
            No announcements yet. Add one to share news with your audience.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex gap-4"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title || "Announcement"}
                  className="w-24 h-16 object-cover rounded-lg border border-slate-800 shrink-0"
                />
              ) : null}
              <div className="flex-1 min-w-0 space-y-3">
                <input
                  type="text"
                  value={item.title ?? ""}
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                  placeholder="Announcement title"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all"
                />
                <textarea
                  value={item.body ?? ""}
                  onChange={(e) => updateItem(index, { body: e.target.value })}
                  placeholder="Announcement details..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all resize-none"
                />
                <input
                  type="url"
                  value={item.imageUrl ?? ""}
                  onChange={(e) =>
                    updateItem(index, { imageUrl: e.target.value })
                  }
                  placeholder="Image URL (optional)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                className="self-start p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-950/40 transition-colors"
                title="Remove announcement"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting || saving}
          className="bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 flex items-center gap-2"
        >
          {(isSubmitting || saving) && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}
          <Save className="w-3.5 h-3.5" />
          Save Announcements
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rooms tab                                                           */
/* ------------------------------------------------------------------ */

interface RoomEditDraft {
  name: string;
  rows: number;
  cols: number;
  grid: SeatCellType[][];
}

function RoomsTab({
  cinema,
  isOwner,
  isSubmitting,
  onSave,
}: {
  cinema: ICinema;
  isOwner: boolean;
  isSubmitting: boolean;
  onSave: (id: string, payload: UpdateCinemaPayload) => Promise<void>;
}) {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<RoomEditDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);

  const rooms = cinema.rooms ?? [];

  const startEdit = (index: number) => {
    const room = rooms[index];
    setEditIndex(index);
    setDraft({
      name: room.name,
      rows: room.rows,
      cols: room.cols,
      grid: room.grid.map((r) => [...r]),
    });
  };

  const handleAdd = async () => {
    if (!draft || !draft.name.trim()) return;
    setSaving(true);
    try {
      const nextRooms = [...rooms];
      if (editIndex !== null) {
        nextRooms[editIndex] = {
          name: draft.name.trim(),
          rows: draft.rows,
          cols: draft.cols,
          grid: draft.grid,
        };
      } else {
        nextRooms.push({
          name: draft.name.trim(),
          rows: draft.rows,
          cols: draft.cols,
          grid: draft.grid,
        });
      }
      await onSave(String(cinema._id), { rooms: nextRooms });
      setEditIndex(null);
      setDraft(null);
    } catch {
      // Error is stored in the Zustand store state
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (removeIndex === null) return;
    setSaving(true);
    try {
      const nextRooms = rooms.filter((_, i) => i !== removeIndex);
      await onSave(String(cinema._id), { rooms: nextRooms });
      setRemoveIndex(null);
    } catch {
      // Error is stored in the Zustand store state
    } finally {
      setSaving(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="text-center py-12 bg-slate-900/30 border border-slate-800/50 rounded-2xl mb-6">
        <p className="text-slate-400 text-sm">
          Room layouts are managed by the cinema owner.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide">
            Room layouts
          </h3>
          <p className="text-slate-400 text-sm">
            Design each screening room's seat grid. Templates later reference
            these rooms by name.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditIndex(null);
            setDraft({ name: "", rows: 6, cols: 12, grid: [] });
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rooms.map((room, index) => (
          <div
            key={`${room.name}-${index}`}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex gap-5"
          >
            <MiniGrid grid={room.grid} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">{room.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {room.rows} rows × {room.cols} cols
              </p>
              <button
                type="button"
                onClick={() => startEdit(index)}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit layout
              </button>
            </div>
            <button
              type="button"
              onClick={() => setRemoveIndex(index)}
              className="self-start p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-950/40 transition-colors"
              title="Remove room"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {draft && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <h4 className="font-display font-bold text-white uppercase tracking-wide">
              {editIndex !== null ? "Edit Room" : "New Room"}
            </h4>
            <input
              type="text"
              value={draft.name}
              onChange={(e) =>
                setDraft((prev) => prev && { ...prev, name: e.target.value })
              }
              placeholder="Room name (e.g. Screen 2)"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all"
            />
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <SeatLayoutBuilder
            rows={draft.rows}
            cols={draft.cols}
            grid={draft.grid}
            onChangeGrid={(grid) =>
              setDraft((prev) => prev && { ...prev, grid })
            }
            onChangeRows={(rows) =>
              setDraft((prev) =>
                prev
                  ? { ...prev, rows, grid: makeGrid(rows, prev.cols) }
                  : prev,
              )
            }
            onChangeCols={(cols) =>
              setDraft((prev) =>
                prev
                  ? { ...prev, cols, grid: makeGrid(prev.rows, cols) }
                  : prev,
              )
            }
          />
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-4">
            <button
              type="button"
              onClick={() => setDraft(null)}
              disabled={isSubmitting || saving}
              className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isSubmitting || saving || !draft.name.trim()}
              className="bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 flex items-center gap-2"
            >
              {(isSubmitting || saving) && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              <Check className="w-3.5 h-3.5" />
              {editIndex !== null ? "Save Room" : "Add Room"}
            </button>
          </div>
        </div>
      )}

      {removeIndex !== null && (
        <ConfirmDialog
          title="Remove Room"
          message={`Are you sure you want to remove "${rooms[removeIndex]?.name}"? Templates using this room will stop working.`}
          isSubmitting={isSubmitting || saving}
          onConfirm={handleRemove}
          onCancel={() => setRemoveIndex(null)}
        />
      )}
    </div>
  );
}
