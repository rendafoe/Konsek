"use client";

import { useMemo } from "react";

interface FantasyRouteMapProps {
  polyline: string;
  activityName?: string;
  className?: string;
}

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

function coordinatesToSvgPath(
  coordinates: [number, number][],
  width: number,
  height: number,
  padding: number = 40
): { path: string; start: { x: number; y: number }; end: { x: number; y: number } } {
  if (coordinates.length === 0) return { path: "", start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };

  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  for (const [lat, lng] of coordinates) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  const scale = Math.min(innerWidth / lngRange, innerHeight / latRange);

  const xOffset = padding + (innerWidth - lngRange * scale) / 2;
  const yOffset = padding + (innerHeight - latRange * scale) / 2;

  const svgPoints = coordinates.map(([lat, lng]) => {
    const x = xOffset + (lng - minLng) * scale;
    const y = yOffset + (maxLat - lat) * scale;
    return { x: +x.toFixed(1), y: +y.toFixed(1) };
  });

  const pathStr = svgPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return {
    path: pathStr,
    start: svgPoints[0],
    end: svgPoints[svgPoints.length - 1],
  };
}

/** Find which corner of the viewBox is farthest from the route for compass placement */
function bestCompassCorner(
  start: { x: number; y: number },
  end: { x: number; y: number },
  width: number,
  height: number
): { x: number; y: number } {
  const corners = [
    { x: 36, y: 50 },               // top-left
    { x: width - 36, y: 50 },       // top-right
    { x: 36, y: height - 36 },      // bottom-left
    { x: width - 36, y: height - 36 }, // bottom-right
  ];

  let best = corners[3]; // default bottom-right
  let bestDist = 0;

  for (const c of corners) {
    const dStart = Math.hypot(c.x - start.x, c.y - start.y);
    const dEnd = Math.hypot(c.x - end.x, c.y - end.y);
    const minDist = Math.min(dStart, dEnd);
    if (minDist > bestDist) {
      bestDist = minDist;
      best = c;
    }
  }

  return best;
}

/** Generate a few tree positions scattered in empty areas */
function generateTrees(
  start: { x: number; y: number },
  end: { x: number; y: number },
  compassPos: { x: number; y: number },
  width: number,
  height: number
): { x: number; y: number; scale: number }[] {
  // Use deterministic positions based on route
  const seed = Math.abs(start.x * 7 + start.y * 13 + end.x * 19 + end.y * 23);
  const trees: { x: number; y: number; scale: number }[] = [];

  const candidates = [
    { x: 28, y: height - 30 },
    { x: width - 28, y: height - 30 },
    { x: 24, y: 70 },
    { x: width - 24, y: 70 },
    { x: width / 2 - 40, y: height - 25 },
    { x: width / 2 + 40, y: height - 25 },
  ];

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const dStart = Math.hypot(c.x - start.x, c.y - start.y);
    const dEnd = Math.hypot(c.x - end.x, c.y - end.y);
    const dCompass = Math.hypot(c.x - compassPos.x, c.y - compassPos.y);

    if (dStart > 40 && dEnd > 40 && dCompass > 35) {
      const scale = 0.6 + ((seed + i * 17) % 5) / 10;
      trees.push({ ...c, scale });
      if (trees.length >= 4) break;
    }
  }

  return trees;
}

function PineTree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity={0.3}>
      <polygon points="0,-12 -5,0 5,0" fill="#5a6e3a" />
      <polygon points="0,-8 -4,0 4,0" fill="#6b8042" transform="translate(0, -4)" />
      <rect x={-1} y={0} width={2} height={4} fill="#7a5c3a" />
    </g>
  );
}

function CompassRose({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`} opacity={0.5}>
      {/* Outer ring */}
      <circle cx={0} cy={0} r={16} fill="none" stroke="#8b6914" strokeWidth={0.5} />
      {/* Cardinal lines */}
      <line x1={0} y1={-14} x2={0} y2={14} stroke="#8b6914" strokeWidth={0.5} />
      <line x1={-14} y1={0} x2={14} y2={0} stroke="#8b6914" strokeWidth={0.5} />
      {/* Diamond center */}
      <polygon points="0,-5 3,0 0,5 -3,0" fill="#8b6914" opacity={0.6} />
      {/* N pointer */}
      <polygon points="0,-14 -2,-8 2,-8" fill="#8b3a14" />
      {/* Labels */}
      <text x={0} y={-16} textAnchor="middle" fontSize={5} fontFamily="'Press Start 2P', monospace" fill="#8b6914">N</text>
      <text x={0} y={20} textAnchor="middle" fontSize={4} fontFamily="'Press Start 2P', monospace" fill="#8b6914">S</text>
      <text x={18} y={1.5} textAnchor="middle" fontSize={4} fontFamily="'Press Start 2P', monospace" fill="#8b6914">E</text>
      <text x={-18} y={1.5} textAnchor="middle" fontSize={4} fontFamily="'Press Start 2P', monospace" fill="#8b6914">W</text>
    </g>
  );
}

function StartMarker({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Flag pole */}
      <line x1={0} y1={0} x2={0} y2={-16} stroke="#3d5a1e" strokeWidth={1.2} />
      {/* Flag */}
      <polygon points="0,-16 10,-13 0,-10" fill="#4a8c1c" />
      {/* Base dot */}
      <circle cx={0} cy={0} r={2.5} fill="#4a8c1c" stroke="#3d5a1e" strokeWidth={0.8} />
      {/* Label */}
      <text x={0} y={9} textAnchor="middle" fontSize={5} fontFamily="'Press Start 2P', monospace" fill="#3d5a1e">Start</text>
    </g>
  );
}

function EndMarker({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* X marks the spot */}
      <line x1={-5} y1={-5} x2={5} y2={5} stroke="#8b1a1a" strokeWidth={2} strokeLinecap="round" />
      <line x1={5} y1={-5} x2={-5} y2={5} stroke="#8b1a1a" strokeWidth={2} strokeLinecap="round" />
      {/* Outer ring */}
      <circle cx={0} cy={0} r={7} fill="none" stroke="#8b1a1a" strokeWidth={0.8} />
      {/* Label */}
      <text x={0} y={14} textAnchor="middle" fontSize={5} fontFamily="'Press Start 2P', monospace" fill="#8b1a1a">End</text>
    </g>
  );
}

export function FantasyRouteMap({ polyline, activityName, className = "" }: FantasyRouteMapProps) {
  const W = 400;
  const H = 320;

  const mapData = useMemo(() => {
    try {
      const coordinates = decodePolyline(polyline);
      if (coordinates.length < 2) return null;
      const result = coordinatesToSvgPath(coordinates, W, H);
      if (!result.path) return null;

      const compass = bestCompassCorner(result.start, result.end, W, H);
      const trees = generateTrees(result.start, result.end, compass, W, H);

      return { ...result, compass, trees };
    } catch {
      return null;
    }
  }, [polyline]);

  if (!mapData) {
    return (
      <div className={`flex items-center justify-center text-muted-foreground text-sm h-48 ${className}`}>
        No route data available
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`w-full max-w-[400px] ${className}`}
      style={{ fontSmooth: "never", WebkitFontSmoothing: "none" } as React.CSSProperties}
    >
      <defs>
        {/* Parchment noise texture */}
        <filter id="parchment-noise" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="2" result="noise" />
          <feColorMatrix
            type="matrix"
            in="noise"
            values="0 0 0 0 0.85
                    0 0 0 0 0.78
                    0 0 0 0 0.6
                    0 0 0 0.08 0"
            result="coloredNoise"
          />
          <feComposite in="SourceGraphic" in2="coloredNoise" operator="over" />
        </filter>
        {/* Trail glow */}
        <filter id="trail-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Parchment background */}
      <rect x={0} y={0} width={W} height={H} rx={8} fill="url(#parchment-gradient)" filter="url(#parchment-noise)" />
      <defs>
        <linearGradient id="parchment-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4e4c1" />
          <stop offset="50%" stopColor="#eedcab" />
          <stop offset="100%" stopColor="#e8d5a3" />
        </linearGradient>
      </defs>

      {/* Decorative double border */}
      <rect x={6} y={6} width={W - 12} height={H - 12} rx={4} fill="none" stroke="#b89a5a" strokeWidth={1.5} />
      <rect x={10} y={10} width={W - 20} height={H - 20} rx={3} fill="none" stroke="#b89a5a" strokeWidth={0.5} opacity={0.6} />

      {/* Corner flourishes */}
      {[
        { x: 6, y: 6, sx: 1, sy: 1 },
        { x: W - 6, y: 6, sx: -1, sy: 1 },
        { x: 6, y: H - 6, sx: 1, sy: -1 },
        { x: W - 6, y: H - 6, sx: -1, sy: -1 },
      ].map((corner, i) => (
        <g key={i} transform={`translate(${corner.x}, ${corner.y}) scale(${corner.sx}, ${corner.sy})`} opacity={0.5}>
          <path d="M0,0 L18,0" stroke="#8b6914" strokeWidth={1.5} fill="none" />
          <path d="M0,0 L0,18" stroke="#8b6914" strokeWidth={1.5} fill="none" />
          <circle cx={2} cy={2} r={1.5} fill="#8b6914" />
        </g>
      ))}

      {/* Title cartouche */}
      {activityName && (
        <g>
          <rect x={W / 2 - 80} y={14} width={160} height={18} rx={3} fill="#e8d5a3" stroke="#b89a5a" strokeWidth={0.5} />
          <text
            x={W / 2}
            y={26}
            textAnchor="middle"
            fontSize={6}
            fontFamily="'Press Start 2P', monospace"
            fill="#6b4c1e"
          >
            {activityName.length > 24 ? activityName.slice(0, 22) + "…" : activityName}
          </text>
        </g>
      )}

      {/* Decorative trees */}
      {mapData.trees.map((tree, i) => (
        <PineTree key={i} x={tree.x} y={tree.y} scale={tree.scale} />
      ))}

      {/* Compass rose */}
      <CompassRose x={mapData.compass.x} y={mapData.compass.y} />

      {/* Route trail shadow */}
      <path
        d={mapData.path}
        fill="none"
        stroke="#6b4c1e"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.15}
      />

      {/* Route trail */}
      <path
        d={mapData.path}
        fill="none"
        stroke="#7a2e1e"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="8 4"
        filter="url(#trail-glow)"
      />

      {/* Start & End markers */}
      <StartMarker x={mapData.start.x} y={mapData.start.y} />
      <EndMarker x={mapData.end.x} y={mapData.end.y} />
    </svg>
  );
}
