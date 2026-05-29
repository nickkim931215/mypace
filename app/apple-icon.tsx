import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 50% 40%, #1b2406 0%, #0a0a0b 70%)",
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M150 340 L150 178 L256 292 L362 178 L362 340"
            fill="none"
            stroke="#d4ff3f"
            strokeWidth="46"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="256" cy="372" r="15" fill="#d4ff3f" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
