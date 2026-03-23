export interface BandwidthPoint {
  timestamp: number;
  downloadMbps: number;
  uploadMbps: number;
}

export interface LatencyPoint {
  timestamp: number;
  ms: number;
}

export interface TickEvent {
  bw: BandwidthPoint;
  lat: LatencyPoint;
  totalRx: string;
  totalTx: string;
}

export interface InfoEvent {
  localIP: string;
  gateway: string;
  dns: { address: string; provider: string }[];
  startedAt: number;
}

export interface AlertEvent {
  rule: { id: string; metric: string; condition: string; threshold: number };
  value: number;
  message: string;
  timestamp: number;
}

export interface NetworkDevice {
  ip: string;
  mac: string;
  hostname: string;
  type: string;
}

export interface SavedNetwork {
  name: string;
}

export interface AlertRule {
  id: string;
  enabled: boolean;
  metric: string;
  condition: string;
  threshold: number;
  webhookUrl?: string;
}
