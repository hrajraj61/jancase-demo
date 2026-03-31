export type SentimentLabel = "angry" | "neutral" | "happy";

export type AIAnalysis = {
  category: string;
  severity: number;
  sentimentLabel: SentimentLabel;
  sentimentScore: number;
};

export type ReportPayload = {
  imageUrl?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type HeatmapPoint = [number, number, number];

export type DashboardReport = {
  id: string;
  createdAt: string;
  imageUrl: string | null;
  description: string | null;
  category: string | null;
  severity: number | null;
  latitude: number | null;
  longitude: number | null;
  wardNumber: number | null;
  sentimentScore: number | null;
  sentimentLabel: string | null;
  status: string;
};

export type DashboardStats = {
  totalReports: number;
  pendingReports: number;
  reportsPerCategory: Array<{ category: string; count: number }>;
  wardSentiment: Array<{ wardNumber: number; averageSentiment: number; reportCount: number }>;
  heatmap: HeatmapPoint[];
};

export type DashboardResponse = {
  reports: DashboardReport[];
  stats: DashboardStats;
};

export type ReportDetail = DashboardReport & {
  googleMapsUrl: string | null;
  hasLocation: boolean;
  hasImage: boolean;
};
