// src/types/index.ts

export interface TrackingPixel {
  trackingId: string;
  label: string;
  recipient?: string;
  subject?: string;
  created: Date | string;
  sentAt?: number; // Add this field to store when the email was sent
}

export interface OpenEvent {
  trackingId: string;
  timestamp: Date | string;
  ip: string;
  userAgent: string;
  referrer?: string;
  isInitialLoad?: boolean; // Flag to mark Gmail's initial loads
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
    totalRealOpens?: number; // New field to track only genuine opens
  };
  opens: {
    timestamp: Date | string;
    ip: string;
    userAgent: string;
    isInitialLoad?: boolean; // Include this in the opens array
  }[];
}

export interface AnalyticsData {
  totalEmails: number;
  openedEmails: number;
  openRate: string;
  opensByDay: number[];
  dayNames: string[];
  opensByHour: number[];
  topEmails: {
    trackingId: string;
    label: string;
    count: number;
  }[];
  browserData: {
    browser: string;
    count: number;
  }[];
  deviceData: {
    device: string;
    count: number;
  }[];
  opensOverTime: {
    date: string;
    count: number;
  }[];
}