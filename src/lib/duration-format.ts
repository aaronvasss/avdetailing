/** Format elapsed milliseconds as H:MM:SS stopwatch (e.g. "1:23:45" or "0:05:12"). */
export function formatStopwatch(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** Format minutes as compact "Xh Ym" (e.g. "2h 15m" or "45m"). */
export function formatHm(totalMinutes: number | null | undefined): string {
  if (totalMinutes == null || isNaN(totalMinutes)) return "—";
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${mm}m`;
  if (mm === 0) return `${h}h`;
  return `${h}h ${mm}m`;
}
