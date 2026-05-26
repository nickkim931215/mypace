import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect
          x="2"
          y="2"
          width="28"
          height="28"
          rx="9"
          fill="var(--accent)"
        />
        <path
          d="M9 21V11l4 6 3-4 3 4 4-6v10"
          stroke="#0a0a0b"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span className="font-display text-[15px] font-semibold tracking-tight">
        MyPace
      </span>
    </div>
  );
}
