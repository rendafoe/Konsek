import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";

export const alt = "Konsek - Your running companion for consistency";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Load Esko sprite as base64
  const eskoBuffer = await readFile(
    join(process.cwd(), "public/esko/esko-child.png")
  );
  const eskoBase64 = `data:image/png;base64,${eskoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #1a2e1a 0%, #0d1f0d 40%, #1a3328 100%)",
          position: "relative",
        }}
      >
        {/* Subtle forest pattern overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at 20% 80%, rgba(64, 145, 108, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(124, 185, 139, 0.1) 0%, transparent 50%)",
            display: "flex",
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, transparent, #40916c, #7cb98b, #40916c, transparent)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {/* Esko sprite */}
          <img
            src={eskoBase64}
            width={140}
            height={140}
            style={{ objectFit: "contain" }}
          />

          {/* App name */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 300,
              color: "#e8efe5",
              letterSpacing: "-0.02em",
              display: "flex",
            }}
          >
            Konsek
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 24,
              color: "#7cb98b",
              fontWeight: 400,
              letterSpacing: "0.05em",
              display: "flex",
            }}
          >
            Your running companion for consistency
          </div>

          {/* Divider */}
          <div
            style={{
              width: 80,
              height: 1,
              background: "linear-gradient(90deg, transparent, #40916c, transparent)",
              marginTop: 8,
              display: "flex",
            }}
          />

          {/* Strava connection note */}
          <div
            style={{
              fontSize: 16,
              color: "#c5d4c2",
              fontWeight: 300,
              letterSpacing: "0.15em",
              textTransform: "uppercase" as const,
              marginTop: 4,
              display: "flex",
            }}
          >
            Powered by Strava
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
