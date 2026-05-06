import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { IncidentStatus, IncidentSeverity, IncidentResponse } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==================== TIME FORMATTING ====================

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "min" : "mins"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ==================== INCIDENT STYLING ====================

export function getIncidentStatusColor(status: IncidentStatus): string {
  const colors = {
    [IncidentStatus.Open]: "bg-red-500/20 text-red-400 border-red-500/50",
    [IncidentStatus.Assigned]: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    [IncidentStatus.InProgress]: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    [IncidentStatus.Resolved]: "bg-green-500/20 text-green-400 border-green-500/50",
    [IncidentStatus.Closed]: "bg-gray-500/20 text-gray-400 border-gray-500/50",
  };
  return colors[status] || colors[IncidentStatus.Open];
}

export function getIncidentSeverityColor(severity: IncidentSeverity): string {
  const colors = {
    [IncidentSeverity.Low]: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    [IncidentSeverity.Medium]: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    [IncidentSeverity.High]: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    [IncidentSeverity.Critical]: "bg-red-500/20 text-red-400 border-red-500/50",
  };
  return colors[severity] || colors[IncidentSeverity.Low];
}

export function getIncidentStatusLabel(status: IncidentStatus): string {
  const labels = {
    [IncidentStatus.Open]: "Open",
    [IncidentStatus.Assigned]: "Assigned",
    [IncidentStatus.InProgress]: "In Progress",
    [IncidentStatus.Resolved]: "Resolved",
    [IncidentStatus.Closed]: "Closed",
  };
  return labels[status] || "Unknown";
}

export function getIncidentSeverityLabel(severity: IncidentSeverity): string {
  const labels = {
    [IncidentSeverity.Low]: "Low",
    [IncidentSeverity.Medium]: "Medium",
    [IncidentSeverity.High]: "High",
    [IncidentSeverity.Critical]: "Critical",
  };
  return labels[severity] || "Unknown";
}

export function exportIncidentsToCSV(incidents: IncidentResponse[]): void {
  const headers = [
    "ID",
    "Title",
    "Description",
    "Type",
    "Severity",
    "Status",
    "Source",
    "Timestamp",
    "Resolved At",
    "Resolution Time (seconds)",
  ];

  const rows = incidents.map((i) => [
    i.id,
    i.title,
    i.description || "",
    i.type,
    i.severity,
    i.status,
    i.source,
    i.timestamp,
    i.resolvedAt || "",
    i.resolvedAt
      ? (Date.parse(i.resolvedAt) - Date.parse(i.timestamp)) / 1000
      : "",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `incidents-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}



// ==================== NUMBER FORMATTING ====================

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  }).format(num);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// ==================== VALIDATION ====================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ==================== STRING MANIPULATION ====================

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ==================== ARRAY UTILITIES ====================

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function sortBy<T>(array: T[], key: keyof T, order: "asc" | "desc" = "asc"): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === "asc" ? -1 : 1;
    if (aVal > bVal) return order === "asc" ? 1 : -1;
    return 0;
  });
}

// ==================== DEBOUNCE & THROTTLE ====================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ==================== COLOR UTILITIES ====================

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function getContrastColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return "#000000";
  
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128 ? "#000000" : "#ffffff";
}

// ==================== CAMERA STATUS ====================

export function getCameraStatusColor(status: "active" | "offline" | "error"): string {
  const colors = {
    active: "text-green-500 border-green-500",
    offline: "text-red-500 border-red-500",
    error: "text-orange-500 border-orange-500",
  };
  return colors[status] || colors.offline;
}

export function getCameraStatusBadge(status: "active" | "offline" | "error"): string {
  const badges = {
    active: "bg-green-500/20 text-green-400 border-green-500/50",
    offline: "bg-red-500/20 text-red-400 border-red-500/50",
    error: "bg-orange-500/20 text-orange-400 border-orange-500/50",
  };
  return badges[status] || badges.offline;
}

// ==================== LOCAL STORAGE ====================

export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

export function removeFromStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error("Error removing from localStorage:", error);
  }
}

// ==================== PERFORMANCE ====================

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// ==================== API ERROR HANDLING ====================

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}

export function isApiError(error: unknown): error is { message: string; status?: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as any).message === "string"
  );
}


export function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function fmtMs(v?: number) {
  if (v == null) return "--";
  return `${Math.round(v)}ms`;
}

export function fmtUptime(seconds?: number) {
  if (seconds == null) return "--";
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${h}h ${m}m ${ss}s`;
}

export function secondsAgo(iso?: string) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return (Date.now() - t) / 1000;
}
