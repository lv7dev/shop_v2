"use client";

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon paths in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

const hqIcon = L.divIcon({
  className: "",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:#16a34a;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const destIcon = L.divIcon({
  className: "",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:#dc2626;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const truckIcon = L.divIcon({
  className: "",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:#7c3aed;border-radius:50%;border:3px solid white;box-shadow:0 2px 12px rgba(124,58,237,0.5)">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 3h15v13H1z"></path>
      <path d="M16 8h4l3 3v5h-7V8z"></path>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const deliveredIcon = L.divIcon({
  className: "",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;background:#16a34a;border-radius:50%;border:3px solid white;box-shadow:0 2px 12px rgba(22,163,74,0.5)">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

type RouteCoord = [number, number]; // [lng, lat] from OSRM

type DeliveryTrackingMapInnerProps = {
  routeCoords: RouteCoord[];
  hqLat: number;
  hqLng: number;
  destLat: number;
  destLng: number;
  hqAddress: string;
  simulationDurationMs: number;
  isRunning: boolean;
  onProgress: (progress: number, distanceRemaining: number) => void;
  onComplete: () => void;
};

function computeCumulativeDistances(coords: RouteCoord[]): number[] {
  const distances = [0];
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    const dx = lng2 - lng1;
    const dy = lat2 - lat1;
    distances.push(distances[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  return distances;
}

function interpolatePosition(
  coords: RouteCoord[],
  cumDist: number[],
  fraction: number
): [number, number] {
  const totalDist = cumDist[cumDist.length - 1];
  const targetDist = fraction * totalDist;

  // Binary search for the segment
  let lo = 0;
  let hi = cumDist.length - 1;
  while (lo < hi - 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (cumDist[mid] <= targetDist) lo = mid;
    else hi = mid;
  }

  const segStart = cumDist[lo];
  const segEnd = cumDist[hi];
  const segLen = segEnd - segStart;
  const t = segLen > 0 ? (targetDist - segStart) / segLen : 0;

  const [lng1, lat1] = coords[lo];
  const [lng2, lat2] = coords[hi];

  return [lat1 + t * (lat2 - lat1), lng1 + t * (lng2 - lng1)];
}

export function DeliveryTrackingMapInner({
  routeCoords,
  hqLat,
  hqLng,
  destLat,
  destLng,
  hqAddress,
  simulationDurationMs,
  isRunning,
  onProgress,
  onComplete,
}: DeliveryTrackingMapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const completedRef = useRef(false);

  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const cumDistRef = useRef<number[]>([]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Draw route polyline
    const latLngs = routeCoords.map(
      ([lng, lat]) => [lat, lng] as [number, number]
    );
    const polyline = L.polyline(latLngs, {
      color: "#7c3aed",
      weight: 4,
      opacity: 0.7,
    }).addTo(map);

    // Fit bounds to route
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    // HQ marker
    L.marker([hqLat, hqLng], { icon: hqIcon })
      .bindTooltip(hqAddress, {
        permanent: false,
        direction: "top",
        offset: [0, -20],
      })
      .addTo(map);

    // Destination marker
    L.marker([destLat, destLng], { icon: destIcon })
      .bindTooltip("Delivery Address", {
        permanent: false,
        direction: "top",
        offset: [0, -20],
      })
      .addTo(map);

    // Truck marker at start
    const truck = L.marker([hqLat, hqLng], { icon: truckIcon, zIndexOffset: 1000 }).addTo(map);
    truckMarkerRef.current = truck;

    // Pre-compute distances
    cumDistRef.current = computeCumulativeDistances(routeCoords);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.remove();
      mapRef.current = null;
      truckMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    if (!truckMarkerRef.current || completedRef.current) return;

    const elapsed = performance.now() - startTimeRef.current;
    const progress = Math.min(elapsed / simulationDurationMs, 1);

    const [lat, lng] = interpolatePosition(
      routeCoords,
      cumDistRef.current,
      progress
    );
    truckMarkerRef.current.setLatLng([lat, lng]);

    // Calculate distance remaining (approx km)
    const totalDistDeg = cumDistRef.current[cumDistRef.current.length - 1];
    // Rough conversion: 1 degree ≈ 111 km
    const totalDistKm = totalDistDeg * 111;
    const distRemaining = totalDistKm * (1 - progress);

    onProgressRef.current(progress, distRemaining);

    if (progress >= 1) {
      completedRef.current = true;
      truckMarkerRef.current.setIcon(deliveredIcon);
      onCompleteRef.current();
      return;
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [routeCoords, simulationDurationMs]);

  // Start/pause animation
  useEffect(() => {
    if (completedRef.current) return;

    if (isRunning) {
      if (pausedAtRef.current > 0) {
        // Resume: adjust start time to account for paused duration
        const elapsed = pausedAtRef.current - startTimeRef.current;
        startTimeRef.current = performance.now() - elapsed;
        pausedAtRef.current = 0;
      } else if (startTimeRef.current === 0) {
        startTimeRef.current = performance.now();
      }
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }
      if (startTimeRef.current > 0) {
        pausedAtRef.current = performance.now();
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }
    };
  }, [isRunning, animate]);

  return (
    <div
      ref={containerRef}
      className="h-[450px] w-full rounded-lg border md:h-[500px]"
      style={{ zIndex: 0 }}
    />
  );
}
