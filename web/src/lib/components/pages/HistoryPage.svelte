<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import BandwidthChart from '$lib/components/charts/BandwidthChart.svelte';
  import LatencyChart from '$lib/components/charts/LatencyChart.svelte';
  import { Download, FileDown, FileJson, Clock } from 'lucide-svelte';
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

<div class="space-y-6">
  <!-- Header Row -->
  <div class="flex items-center justify-between gap-4 flex-wrap">
    <div class="flex items-center gap-3">
      <Clock class="text-muted-foreground" size={16} />
      <Select.Root type="single" value={selectedRange} onValueChange={onRangeChange}>
        <Select.Trigger class="w-[140px] bg-card border-border text-foreground">
          {ranges.find((r) => r.value === selectedRange)?.label ?? selectedRange}
        </Select.Trigger>
        <Select.Content >
          {#each ranges as range}
            <Select.Item value={range.value} label={range.label} class="text-foreground">
              {range.label}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" onclick={exportCSV} class="border-border text-muted-foreground hover:text-foreground">
        <FileDown size={14} />
        Export CSV
      </Button>
      <Button variant="outline" size="sm" onclick={exportJSON} class="border-border text-muted-foreground hover:text-foreground">
        <FileJson size={14} />
        Export JSON
      </Button>
    </div>
  </div>

  <!-- Summary Stats -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <Card >
      <CardHeader class="pb-2 pt-4 px-4">
        <span class="text-xs font-medium text-muted-foreground">Avg Download</span>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0">
        <p class="text-2xl font-bold text-blue-500 tabular-nums">{avgDownload.toFixed(1)}</p>
        <p class="text-[10px] text-muted-foreground">Mbps</p>
      </CardContent>
    </Card>

    <Card >
      <CardHeader class="pb-2 pt-4 px-4">
        <span class="text-xs font-medium text-muted-foreground">Avg Upload</span>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0">
        <p class="text-2xl font-bold text-purple-500 tabular-nums">{avgUpload.toFixed(1)}</p>
        <p class="text-[10px] text-muted-foreground">Mbps</p>
      </CardContent>
    </Card>

    <Card >
      <CardHeader class="pb-2 pt-4 px-4">
        <span class="text-xs font-medium text-muted-foreground">Avg Latency</span>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0">
        <p class="text-2xl font-bold text-green-500 tabular-nums">{avgLatency.toFixed(1)}</p>
        <p class="text-[10px] text-muted-foreground">ms</p>
      </CardContent>
    </Card>

    <Card >
      <CardHeader class="pb-2 pt-4 px-4">
        <span class="text-xs font-medium text-muted-foreground">Total Transfer</span>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0">
        <p class="text-2xl font-bold text-foreground tabular-nums">{formatTransfer(totalTransferMb)}</p>
        <p class="text-[10px] text-muted-foreground">estimated</p>
      </CardContent>
    </Card>
  </div>

  <!-- Charts -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card >
      <CardHeader class="pb-2 pt-4 px-4">
        <CardTitle class="text-sm font-medium text-foreground">Bandwidth</CardTitle>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0 h-[300px]">
        {#if loading}
          <div class="flex items-center justify-center h-full">
            <span class="text-xs text-muted-foreground">Loading...</span>
          </div>
        {:else}
          <BandwidthChart data={bandwidthData} />
        {/if}
      </CardContent>
    </Card>

    <Card >
      <CardHeader class="pb-2 pt-4 px-4">
        <CardTitle class="text-sm font-medium text-foreground">Latency</CardTitle>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0 h-[300px]">
        {#if loading}
          <div class="flex items-center justify-center h-full">
            <span class="text-xs text-muted-foreground">Loading...</span>
          </div>
        {:else}
          <LatencyChart data={latencyData} />
        {/if}
      </CardContent>
    </Card>
  </div>
</div>
