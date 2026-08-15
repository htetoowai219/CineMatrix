import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Loader2,
  AlertCircle,
  Building2,
  Plus,
  Trash2,
  MapPin,
  MonitorPlay,
  ArrowRight,
  Eye,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import StatusBadge from "../components/ui/StatusBadge";
import ImageUpload from "../components/ui/ImageUpload";
import SeatLayoutBuilder from "../components/ui/SeatLayoutBuilder";
import MapPicker, { type MapLocation } from "../components/ui/MapPicker";
import { makeGrid } from "../utils/seatLayout";
import { useCinemaStore } from "../stores/cinema.store";
import { useUserStore } from "../stores/user.store";
import { CURRENCIES } from "../utils/currency";
import type {
  ICinemaRoom,
  SeatCellType,
  CreateCinemaPayload,
} from "../types/cinema.type";

interface RoomDraft {
  key: number;
  name: string;
  rows: number;
  cols: number;
  grid: SeatCellType[][];
}

const EMPTY_ROOM = (): RoomDraft => ({
  key: Date.now() + Math.random(),
  name: "",
  rows: 6,
  cols: 12,
  grid: [],
});

export default function MyCinemasPage() {
  const navigate = useNavigate();
  const { role } = useUserStore();
  const {
    myCinemas,
    isLoading,
    isSubmitting,
    error,
    getMyCinemasAction,
    createCinemaAction,
    clearError,
  } = useCinemaStore();

  const [showCreate, setShowCreate] = useState(false);
  const [rooms, setRooms] = useState<RoomDraft[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [allowPayInPerson, setAllowPayInPerson] = useState(true);
  const [currency, setCurrency] = useState<string>("USD");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [website, setWebsite] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [gallery, setGallery] = useState<File[]>([]);
  const [localError, setErrorLocal] = useState<string | null>(null);

  const isOwner = role === "cinema_owner";

  useEffect(() => {
    getMyCinemasAction();
  }, [getMyCinemasAction]);

  const totalRooms = useMemo(
    () => myCinemas.reduce((acc, c) => acc + (c.rooms?.length ?? 0), 0),
    [myCinemas],
  );

  const openCreate = () => {
    setRooms([EMPTY_ROOM()]);
    setShowCreate(true);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setRooms([]);
    setName("");
    setDescription("");
    setPhone("");
    setEmail("");
    setAllowPayInPerson(true);
    setCurrency("USD");
    setStreet("");
    setCity("");
    setState("");
    setCountry("");
    setLocation(null);
    setWebsite("");
    setImages([]);
    setGallery([]);
    if (error) clearError();
  };

  const updateRoom = (key: number, patch: Partial<RoomDraft>) => {
    setRooms((prev) =>
      prev.map((room) => (room.key === key ? { ...room, ...patch } : room)),
    );
  };

  const resizeRoom = (key: number, rows: number, cols: number) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.key !== key) return room;
        const grid = makeGrid(rows, cols);
        return { ...room, rows, cols, grid };
      }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRooms: ICinemaRoom[] = rooms
      .filter((room) => room.name.trim())
      .map((room) => ({
        name: room.name.trim(),
        rows: room.rows,
        cols: room.cols,
        grid: room.grid,
      }));
    if (validRooms.length === 0) {
      setErrorLocal("Add at least one room with a name before saving.");
      return;
    }

    const payload: CreateCinemaPayload = {
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
      ...(location ? { location } : {}),
      ...(website.trim() ? { socials: { website: website.trim() } } : {}),
      imageFiles: images,
      galleryFiles: gallery,
      rooms: validRooms,
      allowPayInPerson,
      currency,
    };

    try {
      await createCinemaAction(payload);
      closeCreate();
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1">
            Partner Portal
          </p>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wide">
            My Cinemas
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {myCinemas.length} cinema{myCinemas.length !== 1 ? "s" : ""} on
            your account · {totalRooms} room{totalRooms !== 1 ? "s" : ""} total.
            Cinemas stay pending until the admin approves them.
          </p>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Cinema
          </button>
        )}
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
          <p className="text-sm">Loading your cinemas...</p>
        </div>
      ) : myCinemas.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-60" />
          <h3 className="font-display font-bold text-lg text-white mb-1 uppercase tracking-wide">
            No cinemas yet
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            {isOwner
              ? "Add your first cinema, build its room layouts, and submit it for admin approval."
              : "Ask your cinema owner to add cinemas to this account."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {myCinemas.map((cinema) => (
            <div
              key={String(cinema._id)}
              className="group bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700 transition-colors"
            >
              <div className="relative h-40">
                {cinema.images && cinema.images.length > 0 ? (
                  <img
                    src={cinema.images[0]}
                    alt={cinema.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-slate-600" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <StatusBadge label={cinema.status} />
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide mb-1">
                  {cinema.name}
                </h3>
                <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  {cinema.address.city}, {cinema.address.country}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                  <MonitorPlay className="w-3.5 h-3.5 text-red-500" />
                  {cinema.rooms?.length ?? 0} room
                  {(cinema.rooms?.length ?? 0) !== 1 ? "s" : ""}
                  {cinema.allowPayInPerson && " · Pay in person"}
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/cinemas/${String(cinema._id)}`)
                    }
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-xs py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20"
                  >
                    <Eye className="w-4 h-4" />
                    Open Workspace
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal
          title="Add Cinema"
          subtitle="Register a cinema and design its room layouts. It will require admin approval before going live."
          onClose={closeCreate}
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {(error || localError) && (
              <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg flex items-start gap-2 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span className="flex-1">{localError ?? error}</span>
                <button
                  type="button"
                  onClick={() => setErrorLocal(null)}
                  className="text-red-400 hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Basics */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                Basic details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                    Cinema Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Starlight Cineplex"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of the cinema..."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all resize-none disabled:opacity-50"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@cinema.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <label className="sm:col-span-2 flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowPayInPerson}
                    onChange={(e) => setAllowPayInPerson(e.target.checked)}
                    disabled={isSubmitting}
                    className="accent-red-600 w-4 h-4"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      Allow pay-in-person bookings
                    </span>
                    <span className="block text-xs text-slate-500">
                      Customers can book without uploading a payment screenshot.
                    </span>
                  </span>
                </label>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                    Ticket Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50"
                  >
                    {CURRENCIES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                Address & location
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                    Street <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="123 Main Street"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Los Angeles"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all"
                    required
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
                    placeholder="California"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="United States"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all"
                    required
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

            {/* Images */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <ImageUpload
                label="Main Image"
                hint="Square landscape poster for the cinema card."
                files={images}
                onChange={setImages}
                previewClassName="w-28 h-20"
              />
              <ImageUpload
                label="Gallery"
                hint="Extra interior/exterior photos."
                multiple
                files={gallery}
                onChange={setGallery}
                previewClassName="w-28 h-20"
              />
            </div>

            {/* Socials */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                Website
              </p>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://cinema.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all"
              />
            </div>

            {/* Rooms */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Room layouts
                </p>
                <button
                  type="button"
                  onClick={() => setRooms((prev) => [...prev, EMPTY_ROOM()])}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Room
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {rooms.map((room) => (
                  <div
                    key={room.key}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="text"
                        value={room.name}
                        onChange={(e) =>
                          updateRoom(room.key, { name: e.target.value })
                        }
                        placeholder={`Room ${rooms.indexOf(room) + 1} name (e.g. Screen 1)`}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setRooms((prev) =>
                            prev.filter((r) => r.key !== room.key),
                          )
                        }
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-950/40 transition-colors"
                        title="Remove room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <SeatLayoutBuilder
                      rows={room.rows}
                      cols={room.cols}
                      grid={room.grid}
                      onChangeGrid={(grid) => updateRoom(room.key, { grid })}
                      onChangeRows={(rows) => resizeRoom(room.key, rows, room.cols)}
                      onChangeCols={(cols) => resizeRoom(room.key, room.rows, cols)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={closeCreate}
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
                Submit for Approval
                {!isSubmitting && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
