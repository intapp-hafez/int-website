import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type Props = { lat: number; lng: number; label: string; className?: string };

export function ContactMap({ lat, lng, label, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !ref.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;
      const map = L.map(ref.current, { scrollWheelZoom: false }).setView([lat, lng], 14);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      const icon = L.divIcon({
        className: "custom-pin",
        html: `<div class="pin-wrap"><div class="pin"></div><div class="pulse"></div></div>`,
        iconSize: [40, 50],
        iconAnchor: [20, 46],
        popupAnchor: [0, -40],
      });
      L.marker([lat, lng], { icon }).addTo(map).bindPopup(`<strong>${label}</strong>`).openPopup();
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [lat, lng, label]);

  return <div ref={ref} className={className} />;
}
