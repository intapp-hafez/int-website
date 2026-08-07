import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type Props = {
  lat: number;
  lng: number;
  onChange: (pos: { lat: number; lng: number }) => void;
  className?: string;
};

export function LocationPickerMap({ lat, lng, onChange, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !ref.current) return;
    let cancelled = false;
    
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;
      
      if (!mapRef.current) {
        const map = L.map(ref.current, { scrollWheelZoom: false }).setView([lat, lng], 13);
        mapRef.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const icon = L.icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          tooltipAnchor: [16, -28],
          shadowSize: [41, 41]
        });

        const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
        markerRef.current = marker;

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onChange({ lat: pos.lat, lng: pos.lng });
        });

        map.on("click", (e: any) => {
          marker.setLatLng(e.latlng);
          onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng]);
    }
  }, [lat, lng]);

  return <div ref={ref} className={className} />;
}
