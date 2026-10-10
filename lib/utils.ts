import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    // If it's a simple YYYY-MM-DD string, parse parts directly to avoid UTC timezone offset shifts
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
    }
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatTime(timeStr?: string | null): string {
  // Handles 24h "17:00" to "5:00 PM"
  if (!timeStr) return "";
  if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
  const [hoursStr, minutesStr] = timeStr.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || "00";
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

/** Split a YYYY-MM-DD string into display parts without any timezone shift. */
export function eventDateParts(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const f = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", opts).format(date);
  return {
    day: String(day),
    month: f({ month: "short" }),
    monthLong: f({ month: "long" }),
    weekday: f({ weekday: "short" }),
    weekdayLong: f({ weekday: "long" }),
    year,
  };
}

export function formatLongDate(dateStr: string): string {
  const p = eventDateParts(dateStr);
  return `${p.weekdayLong}, ${p.monthLong} ${p.day}`;
}

export function toDateKey(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}
