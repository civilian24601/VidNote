import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format seconds into MM:SS format
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Get initials from name
export function getInitials(name: string): string {
  if (!name) return "";
  
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Format date to readable string
export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  
  const d = typeof date === "string" ? new Date(date) : date;
  
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// Format date to date and time
export function formatDateTime(date: Date | string | null): string {
  if (!date) return "";
  
  const d = typeof date === "string" ? new Date(date) : date;
  
  return `${formatDate(d)} · ${d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  })}`;
}

// Calculate position for comment markers on timeline
export function calculateMarkerPosition(timestamp: number, duration: number): string {
  if (!duration || duration <= 0) return "0%";
  const position = (timestamp / duration) * 100;
  return `${Math.min(Math.max(position, 0), 100)}%`;
}

// Generate random avatar color
export const AVATAR_COLORS = [
  "bg-primary-500",
  "bg-secondary-500",
  "bg-accent-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-blue-500",
  "bg-emerald-500"
];

export function getAvatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}
