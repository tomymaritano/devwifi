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

  const stats = $derived([
    { label: 'Download', value: dl.toFixed(1), unit: 'Mbps', color: 'text-blue-400', glow: 'glow-blue', icon: Download },
    { label: 'Upload', value: ul.toFixed(1), unit: 'Mbps', color: 'text-purple-400', glow: 'glow-purple', icon: Upload },
    { label: 'Latency', value: lat < 0 ? '—' : lat.toFixed(0), unit: lat < 0 ? 'timeout' : 'ms', color: latClass, glow: '', icon: Gauge },
    { label: 'Downloaded', value: $totalRx, unit: 'total', color: 'text-foreground', glow: '', icon: HardDrive },
    { label: 'Uploaded', value: $totalTx, unit: 'total', color: 'text-foreground', glow: '', icon: ArrowUpFromLine },
    { label: 'Peak', value: $peakDownload.toFixed(1), unit: 'Mbps', color: 'text-amber-400', glow: 'glow-yellow', icon: Zap },
  ]);
</script>

<div class="space-y-3">
  <!-- Stat Cards -->
  <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
    {#each stats as stat, i}
      <Card class="group relative overflow-hidden" style="animation: fadeUp 0.4s {i * 60}ms both cubic-bezier(0.16,1,0.3,1)">
        <div class="px-4 py-3.5">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{stat.label}</span>
            <stat.icon class="{stat.color} opacity-40 group-hover:opacity-70 transition-opacity duration-300" size={12} />
          </div>
          <p class="text-[22px] font-semibold {stat.color} tracking-tight tabular-nums leading-none">{stat.value}</p>
          <p class="text-[10px] text-muted-foreground mt-1 font-medium">{stat.unit}</p>
        </div>
        <!-- Subtle gradient glow on hover -->
        <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
             style="background: radial-gradient(ellipse at 50% 0%, hsla(217,92%,60%,0.03) 0%, transparent 70%)"></div>
      </Card>
    {/each}
  </div>

  <!-- Charts -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
    {#each [
      { title: 'Bandwidth', component: BandwidthChart, data: $bandwidthHistory },
      { title: 'Latency', component: LatencyChart, data: $latencyHistory },
    ] as chart, i}
      <Card style="animation: fadeUp 0.4s {(6 + i) * 60}ms both cubic-bezier(0.16,1,0.3,1)">
        <div class="px-4 pt-3.5 pb-1">
          <span class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{chart.title}</span>
        </div>
        <div class="px-4 pb-3 h-[220px]">
          {#if chart.title === 'Bandwidth'}
            <BandwidthChart data={chart.data} />
          {:else}
            <LatencyChart data={chart.data} />
          {/if}
        </div>
      </Card>
    {/each}
  </div>

  <!-- Info Row -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
    <Card style="animation: fadeUp 0.4s 500ms both cubic-bezier(0.16,1,0.3,1)">
      <div class="px-4 pt-3.5 pb-1">
        <div class="flex items-center gap-1.5">
          <Globe class="text-muted-foreground" size={11} />
          <span class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Network</span>
        </div>
      </div>
      <div class="px-4 pb-3.5">
        {#if $info}
          <div class="space-y-1.5">
            {#each [
              { label: 'Local IP', value: $info.localIP },
              { label: 'Gateway', value: $info.gateway },
              ...($info.dns ?? []).map((d, i) => ({ label: `DNS ${i + 1}`, value: d.address, badge: d.provider }))
            ] as row}
              <div class="flex items-center justify-between py-1">
                <span class="text-[11px] text-muted-foreground">{row.label}</span>
                <div class="flex items-center gap-1.5">
                  <code class="text-[11px] font-mono text-foreground/80">{row.value}</code>
                  {#if row.badge}
                    <span class="text-[9px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">{row.badge}</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-[11px] text-muted-foreground py-2">Waiting for data…</p>
        {/if}
      </div>
    </Card>

    <Card style="animation: fadeUp 0.4s 560ms both cubic-bezier(0.16,1,0.3,1)">
      <div class="px-4 pt-3.5 pb-1">
        <div class="flex items-center gap-1.5">
          <AlertTriangle class="text-muted-foreground" size={11} />
          <span class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Recent Alerts</span>
        </div>
      </div>
      <div class="px-4 pb-3.5">
        {#if alerts.length > 0}
          <div class="space-y-1.5">
            {#each alerts as alert}
              <div class="flex items-start gap-2 py-1">
                <div class="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0 glow-yellow"></div>
                <div class="flex-1 min-w-0">
                  <p class="text-[11px] truncate text-foreground/80">{alert.message}</p>
                  <p class="text-[10px] text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-[11px] text-muted-foreground py-2">No recent alerts</p>
        {/if}
      </div>
    </Card>
  </div>
</div>

<style>
  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
