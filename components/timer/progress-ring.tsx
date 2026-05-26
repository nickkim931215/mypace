"use client";

interface Props {
  progress: number; // 0..1 of round elapsed
  color?: string;
  trackColor?: string;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  color = "var(--accent)",
  trackColor = "var(--surface-2)",
  size = 320,
  strokeWidth = 8,
  children,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * Math.min(1, Math.max(0, progress));

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{
            transition: "stroke-dasharray 80ms linear",
            filter: "drop-shadow(0 0 12px rgba(212,255,63,0.35))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
