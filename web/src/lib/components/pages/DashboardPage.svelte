<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import BandwidthChart from '$lib/components/charts/BandwidthChart.svelte';
  import LatencyChart from '$lib/components/charts/LatencyChart.svelte';
  import { bandwidthHistory, latencyHistory, peakDownload, totalRx, totalTx } from '$lib/stores/network';
  import { lastTick, info, alertLog } from '$lib/stores/sse';
  import { latencyColor } from '$lib/utils/colors';
  import { Download, Upload, Gauge, HardDrive, ArrowUpFromLine, Zap, Globe, AlertTriangle } from 'lucide-svelte';

  let currentDownload = $derived($lastTick?.bw.downloadMbps ?? 0);
  let currentUpload = $derived($lastTick?.bw.uploadMbps ?? 0);
  let currentLatency = $derived($lastTick?.lat.ms ?? 0);
  let latColorClass = $derived(latencyColor(currentLatency));
  let recentAlerts = $derived(($alertLog ?? []).slice(-5).reverse());
</script>

<div class="space-y-5">
  <!-- Stat Cards -->
  <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
    <Card>
      <CardHeader class="pb-1">
        <div class="flex items-center justify-between">
          <CardTitle class="text-xs font-medium text-muted-foreground">Download</CardTitle>
          <Download class="text-blue-500 opacity-70" size={14} />
        </div>
      </CardHeader>
      <CardContent>
        <p class="text-2xl font-bold text-blue-500 tracking-tight tabular-nums">{currentDownload.toFixed(1)}</p>
        <p class="text-[11px] text-muted-foreground">Mbps</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="pb-1">
        <div class="flex items-center justify-between">
          <CardTitle class="text-xs font-medium text-muted-foreground">Upload</CardTitle>
          <Upload class="text-purple-500 opacity-70" size={14} />
        </div>
      </CardHeader>
      <CardContent>
        <p class="text-2xl font-bold text-purple-500 tracking-tight tabular-nums">{currentUpload.toFixed(1)}</p>
        <p class="text-[11px] text-muted-foreground">Mbps</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="pb-1">
        <div class="flex items-center justify-between">
          <CardTitle class="text-xs font-medium text-muted-foreground">Latency</CardTitle>
          <Gauge class="{latColorClass} opacity-70" size={14} />
        </div>
      </CardHeader>
      <CardContent>
        <p class="text-2xl font-bold {latColorClass} tracking-tight tabular-nums">
          {currentLatency < 0 ? '—' : currentLatency.toFixed(0)}
        </p>
        <p class="text-[11px] text-muted-foreground">{currentLatency < 0 ? 'timeout' : 'ms'}</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="pb-1">
        <div class="flex items-center justify-between">
          <CardTitle class="text-xs font-medium text-muted-foreground">Downloaded</CardTitle>
          <HardDrive class="text-muted-foreground" size={14} />
        </div>
      </CardHeader>
      <CardContent>
        <p class="text-xl font-semibold tracking-tight tabular-nums">{$totalRx}</p>
        <p class="text-[11px] text-muted-foreground">total received</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="pb-1">
        <div class="flex items-center justify-between">
          <CardTitle class="text-xs font-medium text-muted-foreground">Uploaded</CardTitle>
          <ArrowUpFromLine class="text-muted-foreground" size={14} />
        </div>
      </CardHeader>
      <CardContent>
        <p class="text-xl font-semibold tracking-tight tabular-nums">{$totalTx}</p>
        <p class="text-[11px] text-muted-foreground">total sent</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="pb-1">
        <div class="flex items-center justify-between">
          <CardTitle class="text-xs font-medium text-muted-foreground">Peak</CardTitle>
          <Zap class="text-yellow-500 opacity-70" size={14} />
        </div>
      </CardHeader>
      <CardContent>
        <p class="text-2xl font-bold text-yellow-500 tracking-tight tabular-nums">{$peakDownload.toFixed(1)}</p>
        <p class="text-[11px] text-muted-foreground">Mbps</p>
      </CardContent>
    </Card>
  </div>

  <!-- Charts -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-sm">Bandwidth</CardTitle>
      </CardHeader>
      <CardContent class="h-[260px]">
        <BandwidthChart data={$bandwidthHistory} />
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-sm">Latency</CardTitle>
      </CardHeader>
      <CardContent class="h-[260px]">
        <LatencyChart data={$latencyHistory} />
      </CardContent>
    </Card>
  </div>

  <!-- Info Cards -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
    <Card>
      <CardHeader class="pb-2">
        <div class="flex items-center gap-2">
          <Globe class="text-muted-foreground" size={14} />
          <CardTitle class="text-sm">Network</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {#if $info}
          <div class="space-y-2.5">
            {#each [
              { label: 'Local IP', value: $info.localIP },
              { label: 'Gateway', value: $info.gateway },
              ...($info.dns ?? []).map((d, i) => ({ label: `DNS ${i + 1}`, value: d.address, badge: d.provider }))
            ] as row}
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted-foreground">{row.label}</span>
                <div class="flex items-center gap-2">
                  <code class="text-xs">{row.value}</code>
                  {#if row.badge}
                    <Badge variant="secondary" class="text-[10px] h-5">{row.badge}</Badge>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-sm text-muted-foreground">Waiting for data…</p>
        {/if}
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="pb-2">
        <div class="flex items-center gap-2">
          <AlertTriangle class="text-muted-foreground" size={14} />
          <CardTitle class="text-sm">Recent Alerts</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {#if recentAlerts.length > 0}
          <div class="space-y-2">
            {#each recentAlerts as alert}
              <div class="flex items-start gap-2.5">
                <div class="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0"></div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs truncate">{alert.message}</p>
                  <p class="text-[10px] text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-sm text-muted-foreground">No recent alerts</p>
        {/if}
      </CardContent>
    </Card>
  </div>
</div>
