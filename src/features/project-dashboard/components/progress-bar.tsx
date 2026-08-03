import { cn } from "@/lib/utils/cn";
import type { Tone } from "@/features/project-dashboard/lib/status-styles";

const TONE_FILL: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  muted: "bg-muted",
};

export interface ProgressBarProps {
  percent: number;
  tone?: Tone;
  label?: string;
  className?: string;
}

/** Plain CSS progress bar — no charting library, per FM-0025's scope. */
export function ProgressBar({ percent, tone = "info", label, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label ? (
        <div className="text-muted flex items-center justify-between text-xs">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? `${clamped}% complete`}
        className="bg-border/60 h-2 w-full overflow-hidden rounded-full"
      >
        <div
          className={cn("h-full rounded-full transition-[width]", TONE_FILL[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
