<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import BandwidthChart from '$lib/components/charts/BandwidthChart.svelte';
  import LatencyChart from '$lib/components/charts/LatencyChart.svelte';
  import { bandwidthHistory, latencyHistory, peakDownload, totalRx, totalTx } from '$lib/stores/network';
  import { lastTick, info, alertLog } from '$lib/stores/sse';
  import { latencyColor } from '$lib/utils/colors';
  import { Download, Upload, Gauge, HardDrive, ArrowUpFromLine, Zap, Globe, AlertTriangle } from 'lucide-svelte';

  let dl = $derived($lastTick?.bw.downloadMbps ?? 0);
  let ul = $derived($lastTick?.bw.uploadMbps ?? 0);
  let lat = $derived($lastTick?.lat.ms ?? 0);
  let latClass = $derived(latencyColor(lat));
  let alerts = $derived(($alertLog ?? []).slice(-5).reverse());
</script>

<div class="space-y-4">
  <!-- Stats -->
  <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
    {#each [
      { label: 'Download', value: `${dl.toFixed(1)}`, unit: 'Mbps', color: 'text-blue-500', icon: Download },
      { label: 'Upload', value: `${ul.toFixed(1)}`, unit: 'Mbps', color: 'text-purple-500', icon: Upload },
      { label: 'Latency', value: lat < 0 ? '—' : `${lat.toFixed(0)}`, unit: lat < 0 ? 'timeout' : 'ms', color: latClass, icon: Gauge },
      { label: 'Downloaded', value: $totalRx, unit: 'received', color: '', icon: HardDrive },
      { label: 'Uploaded', value: $totalTx, unit: 'sent', color: '', icon: ArrowUpFromLine },
      { label: 'Peak', value: `${$peakDownload.toFixed(1)}`, unit: 'Mbps', color: 'text-yellow-500', icon: Zap },
    ] as stat}
      <Card>
        <CardHeader class="pb-0">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</span>
            <stat.icon class="{stat.color || 'text-muted-foreground'} opacity-60" size={13} />
          </div>
        </CardHeader>
        <CardContent class="pt-1">
          <p class="text-lg font-semibold {stat.color} tracking-tight tabular-nums leading-none">{stat.value}</p>
          <p class="text-[10px] text-muted-foreground mt-1">{stat.unit}</p>
        </CardContent>
      </Card>
    {/each}
  </div>

  <!-- Charts -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
    <Card>
      <CardHeader class="pb-1">
        <CardTitle class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bandwidth</CardTitle>
      </CardHeader>
      <CardContent class="h-[240px]">
        <BandwidthChart data={$bandwidthHistory} />
      </CardContent>
    </Card>
    <Card>
      <CardHeader class="pb-1">
        <CardTitle class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Latency</CardTitle>
      </CardHeader>
      <CardContent class="h-[240px]">
        <LatencyChart data={$latencyHistory} />
      </CardContent>
    </Card>
  </div>

  <!-- Info -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
    <Card>
      <CardHeader class="pb-1">
        <div class="flex items-center gap-1.5">
          <Globe class="text-muted-foreground" size={13} />
          <CardTitle class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Network</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {#if $info}
          <div class="space-y-2">
            {#each [
              { label: 'Local IP', value: $info.localIP },
              { label: 'Gateway', value: $info.gateway },
              ...($info.dns ?? []).map((d, i) => ({ label: `DNS ${i + 1}`, value: d.address, badge: d.provider }))
            ] as row}
              <div class="flex items-center justify-between text-xs">
                <span class="text-muted-foreground">{row.label}</span>
                <div class="flex items-center gap-1.5">
                  <code class="text-foreground">{row.value}</code>
                  {#if row.badge}
                    <Badge variant="secondary" class="text-[9px] h-4 px-1.5">{row.badge}</Badge>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-xs text-muted-foreground">Waiting for data…</p>
        {/if}
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="pb-1">
        <div class="flex items-center gap-1.5">
          <AlertTriangle class="text-muted-foreground" size={13} />
          <CardTitle class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent Alerts</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {#if alerts.length > 0}
          <div class="space-y-2">
            {#each alerts as alert}
              <div class="flex items-start gap-2">
                <div class="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1 shrink-0"></div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs truncate">{alert.message}</p>
                  <p class="text-[10px] text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-xs text-muted-foreground">No recent alerts</p>
        {/if}
      </CardContent>
    </Card>
  </div>
</div>
