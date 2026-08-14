import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

export interface MapLocation {
  lat: number;
  lng: number;
}

interface MapPickerProps {
  value: MapLocation | null;
  onChange: (loc: MapLocation) => void;
}

const DEFAULT_CENTER: [number, number] = [16.8409, 96.1735];
const DEFAULT_ZOOM = 11;

const PIN_ICON = L.divIcon({
  className: "",
  html: '<div style="font-size:30px;line-height:1;transform:translateY(-100%);filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6))">&#128205;</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

export default function MapPicker({ value, onChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Guard against legacy location shapes (e.g. {type, coordinates}) or any
  // value without finite lat/lng numbers.
  const safeValue: MapLocation | null =
    value && Number.isFinite(value.lat) && Number.isFinite(value.lng)
      ? value
      : null;

  const setMarker = (loc: MapLocation) => {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([loc.lat, loc.lng]);
    } else {
      markerRef.current = L.marker([loc.lat, loc.lng], {
        icon: PIN_ICON,
      }).addTo(map);
    }
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: safeValue ? [safeValue.lat, safeValue.lng] : DEFAULT_CENTER,
      zoom: safeValue ? 15 : DEFAULT_ZOOM,
      scrollWheelZoom: false,
    });

    map.addLayer(
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }),
    );

    map.on("click", (e: L.LeafletMouseEvent) => {
      const loc = { lat: e.latlng.lat, lng: e.latlng.lng };
      setMarker(loc);
      onChangeRef.current(loc);
    });

    if (safeValue) setMarker(safeValue);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!safeValue || !mapRef.current) return;
    setMarker(safeValue);
    mapRef.current.setView([safeValue.lat, safeValue.lng], 15);
  }, [safeValue]);

  return (
    <div>
      <div
        ref={containerRef}
        className="w-full h-64 rounded-xl border border-slate-800 z-0"
      />
      <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        {safeValue
          ? `Pinned at ${safeValue.lat.toFixed(5)}, ${safeValue.lng.toFixed(5)}`
          : "Click on the map to pin your cinema's location."}
      </p>
    </div>
  );
}
