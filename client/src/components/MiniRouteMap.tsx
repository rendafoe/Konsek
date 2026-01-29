import { useMemo } from "react";

interface MiniRouteMapProps {
  polyline: string | null | undefined;
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  className?: string;
}

/**
 * Decode a polyline encoded string into an array of [lat, lng] coordinates
 * Based on the Google Polyline Algorithm
 */
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

/**
 * Convert lat/lng coordinates to SVG path coordinates
 */
function coordinatesToSvgPath(
  coordinates: [number, number][],
  width: number,
  height: number,
  padding: number = 4
): string {
  if (coordinates.length === 0) return "";

  // Find bounds
  let minLat = Infinity,
    maxLat = -Infinity;
  let minLng = Infinity,
    maxLng = -Infinity;

  for (const [lat, lng] of coordinates) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  // Calculate scale (with padding)
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  const scale = Math.min(innerWidth / lngRange, innerHeight / latRange);

  // Center offset
  const xOffset = padding + (innerWidth - lngRange * scale) / 2;
  const yOffset = padding + (innerHeight - latRange * scale) / 2;

  // Convert to SVG coordinates
  const svgPoints = coordinates.map(([lat, lng]) => {
    const x = xOffset + (lng - minLng) * scale;
    const y = yOffset + (maxLat - lat) * scale; // Flip Y axis
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `M${svgPoints.join(" L")}`;
}

export function MiniRouteMap({
  polyline,
  width = 60,
  height = 40,
  strokeColor = "currentColor",
  strokeWidth = 1.5,
  className = "",
}: MiniRouteMapProps) {
  const svgPath = useMemo(() => {
    if (!polyline) return null;
    try {
      const coordinates = decodePolyline(polyline);
      if (coordinates.length < 2) return null;
      return coordinatesToSvgPath(coordinates, width, height);
    } catch {
      return null;
    }
  }, [polyline, width, height]);

  if (!svgPath) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/50 rounded text-muted-foreground text-xs ${className}`}
        style={{ width, height }}
      >
        -
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={`bg-muted/50 rounded ${className}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={svgPath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />
    </svg>
  );
}
