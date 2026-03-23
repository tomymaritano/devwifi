const DOWNLOAD_URL = 'https://speed.cloudflare.com/__down?bytes=10000000';
const UPLOAD_URL = 'https://speed.cloudflare.com/__up';

export interface SpeedResult {
  download: number; // Mbps
  upload: number;   // Mbps
  latency: number;  // ms
}

async function measureDownload(): Promise<number> {
  const start = performance.now();

  const response = await fetch(DOWNLOAD_URL);
  if (!response.ok || !response.body) return 0;

  let bytes = 0;
  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
  }

  const elapsed = (performance.now() - start) / 1000;
  const bits = bytes * 8;
  return Math.round((bits / elapsed) / 1_000_000 * 100) / 100;
}

async function measureUpload(): Promise<number> {
  const payload = new Uint8Array(2_000_000);
  const start = performance.now();

  try {
    await fetch(UPLOAD_URL, {
      method: 'POST',
      body: payload,
    });

    const elapsed = (performance.now() - start) / 1000;
    const bits = payload.byteLength * 8;
    return Math.round((bits / elapsed) / 1_000_000 * 100) / 100;
  } catch {
    return 0;
  }
}

async function measureLatency(): Promise<number> {
  const start = performance.now();
  try {
    await fetch('https://1.1.1.1/cdn-cgi/trace', { method: 'HEAD' });
    return Math.round(performance.now() - start);
  } catch {
    return -1;
  }
}

export async function runSpeedTest(): Promise<SpeedResult> {
  const latency = await measureLatency();
  const download = await measureDownload();
  const upload = await measureUpload();

  return { download, upload, latency };
}
