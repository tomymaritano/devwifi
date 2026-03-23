<script lang="ts">
  import { onMount } from 'svelte';
  import { Card } from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import BandwidthChart from '$lib/components/charts/BandwidthChart.svelte';
  import LatencyChart from '$lib/components/charts/LatencyChart.svelte';
  import Skeleton from '$lib/components/ui/skeleton.svelte';
  import StatCard from '$lib/components/shared/StatCard.svelte';
  import SectionHeader from '$lib/components/shared/SectionHeader.svelte';
  import EmptyState from '$lib/components/shared/EmptyState.svelte';
  import PageTransition from '$lib/components/shared/PageTransition.svelte';
  import { Download, Upload, Gauge, ArrowUpDown, FileDown, FileJson, Clock, BarChart3 } from 'lucide-svelte';
  import type { BandwidthPoint, LatencyPoint } from '$lib/types';

  const ranges = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
  ];

  let selectedRange = $state('24h');
  let bandwidthData: BandwidthPoint[] = $state([]);
  let latencyData: LatencyPoint[] = $state([]);
  let loading = $state(false);
  let initialLoad = $state(true);

  let avgDownload = $derived(
    bandwidthData.length > 0
      ? bandwidthData.reduce((s, p) => s + p.downloadMbps, 0) / bandwidthData.length
      : 0
  );

  let avgUpload = $derived(
    bandwidthData.length > 0
      ? bandwidthData.reduce((s, p) => s + p.uploadMbps, 0) / bandwidthData.length
      : 0
  );

  let avgLatency = $derived(
    latencyData.length > 0
      ? latencyData.filter((p) => p.ms >= 0).reduce((s, p) => s + p.ms, 0) /
        latencyData.filter((p) => p.ms >= 0).length
      : 0
  );

  let totalTransferMb = $derived(
    bandwidthData.length > 0
      ? bandwidthData.reduce((s, p) => s + p.downloadMbps + p.uploadMbps, 0) *
        (getIntervalSeconds(selectedRange) / bandwidthData.length / 8)
      : 0
  );

  function getIntervalSeconds(range: string): number {
    switch (range) {
      case '1h': return 3600;
      case '6h': return 21600;
      case '24h': return 86400;
      case '7d': return 604800;
      default: return 86400;
    }
  }

  function formatTransfer(mb: number): string {
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  }

  async function fetchHistory(range: string) {
    loading = true;
    try {
      const res = await fetch(`/api/history?range=${range}`);
      const data = await res.json();
      bandwidthData = data.bandwidth ?? [];
      latencyData = data.latency ?? [];
    } catch {
      bandwidthData = [];
      latencyData = [];
    } finally {
      loading = false;
      initialLoad = false;
    }
  }

  function exportCSV() {
    const rows = ['timestamp,downloadMbps,uploadMbps,latencyMs'];
    const latMap = new Map(latencyData.map((l) => [l.timestamp, l.ms]));
    for (const bw of bandwidthData) {
      const lat = latMap.get(bw.timestamp) ?? '';
      rows.push(`${bw.timestamp},${bw.downloadMbps},${bw.uploadMbps},${lat}`);
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    downloadBlob(blob, `devwifi-history-${selectedRange}.csv`);
  }

  function exportJSON() {
    const payload = { range: selectedRange, bandwidth: bandwidthData, latency: latencyData };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `devwifi-history-${selectedRange}.json`);
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onRangeChange(val: string | undefined) {
    if (val) {
      selectedRange = val;
      fetchHistory(val);
    }
  }

  onMount(() => {
    fetchHistory(selectedRange);
  });
</script>

<PageTransition>
  <div class="space-y-3">
    <!-- Header Row -->
    <div class="flex items-center justify-between gap-4 flex-wrap" style="animation: fadeUp 0.4s 0ms both cubic-bezier(0.16,1,0.3,1)">
      <div class="flex items-center gap-3">
        <Clock class="text-muted-foreground opacity-50" size={13} />
        <Select.Root type="single" value={selectedRange} onValueChange={onRangeChange}>
          <Select.Trigger class="w-[140px] h-8 text-[11px] bg-card border-border text-foreground">
            {ranges.find((r) => r.value === selectedRange)?.label ?? selectedRange}
          </Select.Trigger>
          <Select.Content>
            {#each ranges as range}
              <Select.Item value={range.value} label={range.label} class="text-foreground text-[11px]">
                {range.label}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" onclick={exportCSV} class="h-8 text-[11px] border-border text-muted-foreground hover:text-foreground gap-1.5">
          <FileDown size={12} />
          CSV
        </Button>
        <Button variant="outline" size="sm" onclick={exportJSON} class="h-8 text-[11px] border-border text-muted-foreground hover:text-foreground gap-1.5">
          <FileJson size={12} />
          JSON
        </Button>
      </div>
    </div>

    <!-- Stat Cards -->
    {#if initialLoad}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {#each Array(4) as _, i}
          <Card class="overflow-hidden">
            <div class="px-4 py-3.5 space-y-2">
              <Skeleton class="h-3 w-16" />
              <Skeleton class="h-7 w-20" />
              <Skeleton class="h-2.5 w-10" />
            </div>
          </Card>
        {/each}
      </div>
    {:else}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <StatCard label="Avg Download" value={avgDownload.toFixed(1)} unit="Mbps" color="text-blue-400" icon={Download} delay={60} />
        <StatCard label="Avg Upload" value={avgUpload.toFixed(1)} unit="Mbps" color="text-purple-400" icon={Upload} delay={120} />
        <StatCard label="Avg Latency" value={avgLatency.toFixed(1)} unit="ms" color="text-green-400" icon={Gauge} delay={180} />
        <StatCard label="Total Transfer" value={formatTransfer(totalTransferMb)} unit="estimated" color="text-foreground" icon={ArrowUpDown} delay={240} />
      </div>
    {/if}

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
      <Card style="animation: fadeUp 0.4s 300ms both cubic-bezier(0.16,1,0.3,1)">
        <div class="px-4 pt-3.5 pb-1">
          <SectionHeader icon={BarChart3} label="Bandwidth" />
        </div>
        <div class="px-4 pb-3 h-[240px]">
          {#if loading || initialLoad}
            <div class="flex flex-col items-center justify-center h-full gap-3">
              <Skeleton class="w-full h-full rounded-lg" />
            </div>
          {:else if bandwidthData.length === 0}
            <EmptyState icon={BarChart3} title="No bandwidth data" description="Data will appear once monitoring begins" />
          {:else}
            <div class="chart-enter">
              <BandwidthChart data={bandwidthData} />
            </div>
          {/if}
        </div>
      </Card>

      <Card style="animation: fadeUp 0.4s 360ms both cubic-bezier(0.16,1,0.3,1)">
        <div class="px-4 pt-3.5 pb-1">
          <SectionHeader icon={Gauge} label="Latency" />
        </div>
        <div class="px-4 pb-3 h-[240px]">
          {#if loading || initialLoad}
            <div class="flex flex-col items-center justify-center h-full gap-3">
              <Skeleton class="w-full h-full rounded-lg" />
            </div>
          {:else if latencyData.length === 0}
            <EmptyState icon={Gauge} title="No latency data" description="Data will appear once monitoring begins" />
          {:else}
            <div class="chart-enter">
              <LatencyChart data={latencyData} />
            </div>
          {/if}
        </div>
      </Card>
    </div>
  </div>
</PageTransition>

<style>
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .chart-enter {
    animation: chartFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes chartFade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
