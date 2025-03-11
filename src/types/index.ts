// src/types/index.ts

export interface TrackingPixel {
  trackingId: string;
  label: string;
  recipient?: string;
  subject?: string;
  created: Date | string;
}

export interface OpenEvent {
  trackingId: string;
  timestamp: Date | string;
  ip: string;
  userAgent: string;
  referrer?: string;
}

export interface EmailStats {
  trackingId: string;
  label: string;
  created: Date | string;
  recipient?: string;
  subject?: string;
  stats: {
    totalOpens: number;
    uniqueOpens: number;
    firstOpen: Date | string | null;
    lastOpen: Date | string | null;
  };
  opens: {
    timestamp: Date | string;
    ip: string;
    userAgent: string;
  }[];
}