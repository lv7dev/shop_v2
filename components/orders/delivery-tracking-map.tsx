"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { toast } from "sonner";
import {
  Truck,
  ArrowLeft,
  Loader2,
  Play,
  Pause,
  CheckCircle,
  MapPin,
  Clock,
  Route,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markOrderDelivered } from "@/actions/delivery";

const DeliveryTrackingMapInner = dynamic(
  () =>
    import("./delivery-tracking-map-inner").then(
      (m) => m.DeliveryTrackingMapInner
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[450px] w-full items-center justify-center rounded-lg border bg-muted md:h-[500px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    ),
  }
);

type RouteData = {
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
};

type DeliveryTrackingMapProps = {
  orderId: string;
  hqLat: number;
  hqLng: number;
  hqAddress: string;
  destLat: number;
  destLng: number;
  simulationDurationMinutes: number;
  orderNumber: string;
  alreadyDelivered?: boolean;
};

export function DeliveryTrackingMap({
  orderId,
  hqLat,
  hqLng,
  hqAddress,
  destLat,
  destLng,
  simulationDurationMinutes,
  orderNumber,
  alreadyDelivered = false,
}: DeliveryTrackingMapProps) {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(alreadyDelivered ? 1 : 0);
  const [distanceRemaining, setDistanceRemaining] = useState(0);
  const [isDelivered, setIsDelivered] = useState(alreadyDelivered);
  const hasStartedRef = useRef(alreadyDelivered);

  // Fetch route from OSRM
  useEffect(() => {
    async function fetchRoute() {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${hqLng},${hqLat};${destLng},${destLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);

        if (!res.ok) throw new Error("OSRM request failed");

        const data = await res.json();
        if (!data.routes || data.routes.length === 0) {
          throw new Error("No route found");
        }

        const route = data.routes[0];
        setRouteData({
          coordinates: route.geometry.coordinates as [number, number][],
          distanceKm: route.distance / 1000,
          durationMin: route.duration / 60,
        });
        setDistanceRemaining(alreadyDelivered ? 0 : route.distance / 1000);
        setLoading(false);

        // Auto-start animation after a short delay (only if not already delivered)
        if (!alreadyDelivered) {
          setTimeout(() => {
            setIsRunning(true);
            hasStartedRef.current = true;
          }, 1500);
        }
      } catch (err) {
        console.error("Route fetch error:", err);
        setError(
          "Could not load the delivery route. The routing service may be temporarily unavailable."
        );
        setLoading(false);
      }
    }

    fetchRoute();
  }, [hqLat, hqLng, destLat, destLng, alreadyDelivered]);

  const handleProgress = useCallback(
    (p: number, dist: number) => {
      setProgress(p);
      setDistanceRemaining(dist);
    },
    []
  );

  const handleComplete = useCallback(async () => {
    setIsRunning(false);
    setIsDelivered(true);
    setProgress(1);
    setDistanceRemaining(0);

    const result = await markOrderDelivered(orderId);
    if (result.success) {
      toast.success("Order has been delivered!", {
        description: `Order #${orderNumber.slice(-8).toUpperCase()} arrived at the destination.`,
      });
    }
  }, [orderId, orderNumber]);

  const simulationDurationMs = simulationDurationMinutes * 60 * 1000;
  const etaMinutes = Math.max(
    0,
    simulationDurationMinutes * (1 - progress)
  );

  function getStatusText() {
    if (isDelivered) return "Delivered!";
    if (!hasStartedRef.current) return "Preparing...";
    if (!isRunning) return "Paused";
    if (progress > 0.9) return "Almost there!";
    if (progress > 0.5) return "On the way";
    return "En route";
  }

  function getStatusColor() {
    if (isDelivered) return "bg-green-100 text-green-800";
    if (!isRunning) return "bg-yellow-100 text-yellow-800";
    return "bg-purple-100 text-purple-800";
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href={`/orders/${orderId}`}>
              <ArrowLeft className="mr-1 size-4" />
              Back to Order
            </Link>
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Truck className="size-6" />
            Delivery Tracking
          </h1>
          <p className="text-sm text-muted-foreground">
            Order #{orderNumber.slice(-8).toUpperCase()}
          </p>
        </div>
        <Badge className={`${getStatusColor()} border-0 text-sm`}>
          {getStatusText()}
        </Badge>
      </div>

      {/* Map */}
      {loading ? (
        <div className="flex h-[450px] items-center justify-center rounded-lg border bg-muted md:h-[500px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-purple-600" />
            <p className="text-sm text-muted-foreground">
              Calculating delivery route...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex h-[300px] flex-col items-center justify-center gap-3 rounded-lg border bg-muted">
          <AlertTriangle className="size-10 text-amber-500" />
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {error}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      ) : routeData ? (
        <DeliveryTrackingMapInner
          routeCoords={routeData.coordinates}
          hqLat={hqLat}
          hqLng={hqLng}
          destLat={destLat}
          destLng={destLng}
          hqAddress={hqAddress}
          simulationDurationMs={simulationDurationMs}
          isRunning={isRunning}
          onProgress={handleProgress}
          onComplete={handleComplete}
        />
      ) : null}

      {/* Info Panel */}
      {routeData && (
        <div className="rounded-lg border p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery Progress</span>
              <span className="font-medium">
                {Math.round(progress * 100)}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isDelivered
                    ? "bg-green-500"
                    : "bg-purple-500"
                }`}
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg bg-muted/50 p-3">
              <Route className="mx-auto mb-1 size-5 text-muted-foreground" />
              <p className="text-lg font-semibold">
                {distanceRemaining < 1
                  ? `${Math.round(distanceRemaining * 1000)}m`
                  : `${distanceRemaining.toFixed(1)}km`}
              </p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <Clock className="mx-auto mb-1 size-5 text-muted-foreground" />
              <p className="text-lg font-semibold">
                {isDelivered
                  ? "0:00"
                  : etaMinutes < 1
                    ? `${Math.round(etaMinutes * 60)}s`
                    : `${Math.floor(etaMinutes)}:${String(
                        Math.round((etaMinutes % 1) * 60)
                      ).padStart(2, "0")}`}
              </p>
              <p className="text-xs text-muted-foreground">ETA</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <MapPin className="mx-auto mb-1 size-5 text-muted-foreground" />
              <p className="text-lg font-semibold">
                {routeData.distanceKm.toFixed(1)}km
              </p>
              <p className="text-xs text-muted-foreground">Total Distance</p>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-3">
            {isDelivered ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="size-5" />
                  <span className="font-medium">
                    Order delivered successfully!
                  </span>
                </div>
                <Button asChild>
                  <Link href={`/orders/${orderId}`}>View Order Details</Link>
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRunning((r) => !r)}
                disabled={!hasStartedRef.current && !isRunning}
              >
                {isRunning ? (
                  <>
                    <Pause className="mr-1 size-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-1 size-4" />
                    Resume
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
