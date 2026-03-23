<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import BandwidthChart from '$lib/components/charts/BandwidthChart.svelte';
  import LatencyChart from '$lib/components/charts/LatencyChart.svelte';
  import { bandwidthHistory, latencyHistory, peakDownload, totalRx, totalTx } from '$lib/stores/network';
  import { lastTick, info, alertLog } from '$lib/stores/sse';
  import { latencyColor } from '$lib/utils/colors';
  import { Download, Upload, Gauge, HardDrive, ArrowUpFromLine, Zap, Globe, AlertTriangle } from 'lucide-svelte';

  let currentDownload = $derived($lastTick?.bw.downloadMbps ?? 0);
  let currentUpload = $derived($lastTick?.bw.uploadMbps ?? 0);
  let currentLatency = $derived($lastTick?.lat.ms ?? 0);
  let latencyColorClass = $derived(latencyColor(currentLatency));
  let recentAlerts = $derived(($alertLog ?? []).slice(-5).reverse());
</script>

<div class="space-y-6">
  <!-- Stat Cards -->
  <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
    <!-- Download -->
    <Card class="bg-[var(--surface)] border-[var(--border)]">
      <CardHeader class="pb-2 pt-4 px-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-[var(--dim)]">Download</span>
          <Download class="text-blue-500" size={14} />
        </div>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0">
        <p class="text-2xl font-bold text-blue-500 tabular-nums">
          {currentDownload.toFixed(1)}
        </p>
        <p class="text-[10px] text-[var(--dim)]">Mbps</p>
      </CardContent>
    </Card>

    <!-- Upload -->
    <Card class="bg-[var(--surface)] border-[var(--border)]">
      <CardHeader class="pb-2 pt-4 px-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-[var(--dim)]">Upload</span>
          <Upload class="text-purple-500" size={14} />
        </div>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0">
        <p class="text-2xl font-bold text-purple-500 tabular-nums">
          {currentUpload.toFixed(1)}
        </p>
        <p class="text-[10px] text-[var(--dim)]">Mbps</p>
      </CardContent>
    </Card>

    <!-- Latency -->
    <Card class="bg-[var(--surface)] border-[var(--border)]">
      <CardHeader class="pb-2 pt-4 px-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-[var(--dim)]">Latency</span>
          <Gauge class={latencyColorClass} size={14} />
        </div>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0">
        <p class="text-2xl font-bold {latencyColorClass} tabular-nums">
          {currentLatency < 0 ? 'Timeout' : currentLatency.toFixed(0)}
        </p>
        <p class="text-[10px] text-[var(--dim)]">{currentLatency < 0 ? '' : 'ms'}</p>
      </CardContent>
    </Card>

    <!-- Total Downloaded -->
    <Card class="bg-[var(--surface)] border-[var(--border)]">
      <CardHeader class="pb-2 pt-4 px-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-[var(--dim)]">Total Down</span>
          <HardDrive class="text-[var(--dim)]" size={14} />
        </div>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0">
        <p class="text-2xl font-bold text-[var(--text)] tabular-nums">
          {$totalRx}
        </p>
        <p class="text-[10px] text-[var(--dim)]">received</p>
      </CardContent>
    </Card>

    <!-- Total Uploaded -->
    <Card class="bg-[var(--surface)] border-[var(--border)]">
      <CardHeader class="pb-2 pt-4 px-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-[var(--dim)]">Total Up</span>
          <ArrowUpFromLine class="text-[var(--dim)]" size={14} />
        </div>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0">
        <p class="text-2xl font-bold text-[var(--text)] tabular-nums">
          {$totalTx}
        </p>
        <p class="text-[10px] text-[var(--dim)]">sent</p>
      </CardContent>
    </Card>

    <!-- Peak Download -->
    <Card class="bg-[var(--surface)] border-[var(--border)]">
      <CardHeader class="pb-2 pt-4 px-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-[var(--dim)]">Peak Down</span>
          <Zap class="text-yellow-500" size={14} />
        </div>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0">
        <p class="text-2xl font-bold text-yellow-500 tabular-nums">
          {$peakDownload.toFixed(1)}
        </p>
        <p class="text-[10px] text-[var(--dim)]">Mbps</p>
      </CardContent>
    </Card>
  </div>

  <!-- Charts Row -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card class="bg-[var(--surface)] border-[var(--border)]">
      <CardHeader class="pb-2 pt-4 px-4">
        <CardTitle class="text-sm font-medium text-[var(--text)]">Bandwidth</CardTitle>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0 h-[280px]">
        <BandwidthChart data={$bandwidthHistory} />
      </CardContent>
    </Card>

    <Card class="bg-[var(--surface)] border-[var(--border)]">
      <CardHeader class="pb-2 pt-4 px-4">
        <CardTitle class="text-sm font-medium text-[var(--text)]">Latency</CardTitle>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0 h-[280px]">
        <LatencyChart data={$latencyHistory} />
      </CardContent>
    </Card>
  </div>

  <!-- Info Row -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <!-- Network Info -->
    <Card class="bg-[var(--surface)] border-[var(--border)]">
      <CardHeader class="pb-2 pt-4 px-4">
        <div class="flex items-center gap-2">
          <Globe class="text-[var(--dim)]" size={14} />
          <CardTitle class="text-sm font-medium text-[var(--text)]">Network Info</CardTitle>
        </div>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0">
        {#if $info}
          <div class="space-y-3">
            <div class="flex items-center justify-between py-1.5 border-b border-[var(--border)]">
              <span class="text-xs text-[var(--dim)]">Local IP</span>
              <span class="text-xs font-mono text-[var(--text)]">{$info.localIP}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-[var(--border)]">
              <span class="text-xs text-[var(--dim)]">Gateway</span>
              <span class="text-xs font-mono text-[var(--text)]">{$info.gateway}</span>
            </div>
            {#each $info.dns as dns, i}
              <div class="flex items-center justify-between py-1.5 {i < $info.dns.length - 1 ? 'border-b border-[var(--border)]' : ''}">
                <span class="text-xs text-[var(--dim)]">DNS {i + 1}</span>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono text-[var(--text)]">{dns.address}</span>
                  {#if dns.provider}
                    <Badge variant="outline" class="text-[10px] px-1.5 py-0">{dns.provider}</Badge>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-xs text-[var(--dim)]">Waiting for data...</p>
        {/if}
      </CardContent>
    </Card>

    <!-- Recent Alerts -->
    <Card class="bg-[var(--surface)] border-[var(--border)]">
      <CardHeader class="pb-2 pt-4 px-4">
        <div class="flex items-center gap-2">
          <AlertTriangle class="text-[var(--dim)]" size={14} />
          <CardTitle class="text-sm font-medium text-[var(--text)]">Recent Alerts</CardTitle>
        </div>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0">
        {#if recentAlerts.length > 0}
          <div class="space-y-2">
            {#each recentAlerts as alert}
              <div class="flex items-start gap-3 py-2 border-b border-[var(--border)] last:border-0">
                <div class="w-1.5 h-1.5 rounded-full bg-[var(--red)] mt-1.5 shrink-0"></div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-[var(--text)] truncate">{alert.message}</p>
                  <p class="text-[10px] text-[var(--dim)]">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-xs text-[var(--dim)]">No recent alerts</p>
        {/if}
      </CardContent>
    </Card>
  </div>
</div>
