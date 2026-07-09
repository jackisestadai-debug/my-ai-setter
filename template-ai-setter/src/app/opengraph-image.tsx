import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Rekvo Partners";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #0f1623 0%, #111b2e 50%, #162032 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Logo text */}
        <div
          style={{
            fontSize: "120px",
            fontWeight: "700",
            color: "#f1f5f9",
            letterSpacing: "-3px",
            lineHeight: 1,
          }}
        >
          Rekvo
        </div>

        {/* Gradient line */}
        <div
          style={{
            width: "300px",
            height: "3px",
            background: "linear-gradient(90deg, #3b82f6, #818cf8)",
            borderRadius: "2px",
            marginTop: "16px",
            marginBottom: "16px",
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: "22px",
            fontWeight: "500",
            color: "#60a5fa",
            letterSpacing: "10px",
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
          }}
        >
          PARTNERS
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "18px",
            color: "#334155",
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            letterSpacing: "2px",
          }}
        >
          rekvo.se
        </div>
      </div>
    ),
    { ...size }
  );
}
