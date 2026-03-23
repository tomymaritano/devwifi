<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import * as Table from '$lib/components/ui/table';
  import { Monitor, Smartphone, Router, Tv, HelpCircle, Wifi, Loader, ScanLine } from 'lucide-svelte';
  import type { NetworkDevice } from '$lib/types';

  let devices: NetworkDevice[] = $state([]);
  let scanning = $state(false);
  let hasScanned = $state(false);

  // Vendor color map for badges
  function vendorBadgeClass(type: string): string {
    const t = type?.toLowerCase() ?? '';
    if (t.includes('apple') || t.includes('mac'))    return 'bg-zinc-700 text-zinc-200 border-zinc-600';
    if (t.includes('samsung') || t.includes('android')) return 'bg-blue-900/60 text-blue-300 border-blue-700';
    if (t.includes('intel') || t.includes('windows') || t.includes('pc')) return 'bg-sky-900/60 text-sky-300 border-sky-700';
    if (t.includes('router') || t.includes('gateway') || t.includes('cisco')) return 'bg-orange-900/60 text-orange-300 border-orange-700';
    if (t.includes('raspberry') || t.includes('linux')) return 'bg-red-900/50 text-red-300 border-red-700';
    if (t.includes('google') || t.includes('chromecast')) return 'bg-green-900/50 text-green-300 border-green-700';
    if (t.includes('sony') || t.includes('lg') || t.includes('tv')) return 'bg-purple-900/50 text-purple-300 border-purple-700';
    return 'bg-[var(--bg)] text-[var(--dim)] border-[var(--border)]';
  }

  async function scanDevices() {
    scanning = true;
    try {
      const res = await fetch('/api/devices');
      const data = await res.json();
      devices = Array.isArray(data) ? data : [];
    } catch {
      devices = [];
    } finally {
      scanning = false;
      hasScanned = true;
    }
  }
</script>

<div class="space-y-6">
  <!-- Header row -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <h2 class="text-sm font-semibold text-[var(--text)]">Network Devices</h2>
      {#if hasScanned}
        <Badge
          variant="outline"
          class="text-[10px] px-2 py-0 border-[var(--border)] text-[var(--dim)]"
        >
          {devices.length} {devices.length === 1 ? 'device' : 'devices'}
        </Badge>
      {/if}
    </div>
    <Button
      onclick={scanDevices}
      disabled={scanning}
      class="bg-[var(--text)] text-[var(--bg)] hover:opacity-90 text-xs font-medium h-8 px-4 gap-2"
    >
      {#if scanning}
        <Loader size={13} class="animate-spin" />
        Scanning...
      {:else}
        <ScanLine size={13} />
        Scan Network
      {/if}
    </Button>
  </div>

  <!-- Table / Empty state -->
  <Card class="bg-[var(--surface)] border-[var(--border)]">
    <CardContent class="px-0 pb-0 pt-0">
      <Table.Root>
        <Table.Header>
          <Table.Row class="border-[var(--border)] hover:bg-transparent">
            <Table.Head class="text-[var(--dim)] pl-4">IP Address</Table.Head>
            <Table.Head class="text-[var(--dim)]">MAC Address</Table.Head>
            <Table.Head class="text-[var(--dim)]">Hostname</Table.Head>
            <Table.Head class="text-[var(--dim)] pr-4">Vendor / Type</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#if scanning}
            <Table.Row class="border-[var(--border)]">
              <Table.Cell colspan={4} class="text-center py-12">
                <div class="flex flex-col items-center gap-3 text-[var(--dim)]">
                  <Loader size={20} class="animate-spin" />
                  <span class="text-xs">Scanning network for devices...</span>
                </div>
              </Table.Cell>
            </Table.Row>
          {:else if !hasScanned}
            <Table.Row class="border-[var(--border)]">
              <Table.Cell colspan={4} class="text-center py-12">
                <div class="flex flex-col items-center gap-3 text-[var(--dim)]">
                  <Wifi size={24} class="opacity-40" />
                  <span class="text-xs">Click Scan Network to discover devices</span>
                </div>
              </Table.Cell>
            </Table.Row>
          {:else if devices.length === 0}
            <Table.Row class="border-[var(--border)]">
              <Table.Cell colspan={4} class="text-center py-12">
                <div class="flex flex-col items-center gap-3 text-[var(--dim)]">
                  <HelpCircle size={20} class="opacity-40" />
                  <span class="text-xs">No devices found on the network</span>
                </div>
              </Table.Cell>
            </Table.Row>
          {:else}
            {#each devices as device}
              <Table.Row class="border-[var(--border)] hover:bg-[var(--surface2,var(--surface))]">
                <Table.Cell class="pl-4 font-mono text-xs text-[var(--text)]">
                  {device.ip}
                </Table.Cell>
                <Table.Cell class="font-mono text-xs text-[var(--dim)]">
                  {device.mac}
                </Table.Cell>
                <Table.Cell class="text-xs text-[var(--text)]">
                  {#if device.hostname}
                    {device.hostname}
                  {:else}
                    <span class="text-[var(--dim)]">—</span>
                  {/if}
                </Table.Cell>
                <Table.Cell class="pr-4">
                  {#if device.type}
                    <Badge
                      variant="outline"
                      class="text-[10px] px-2 py-0 font-medium border {vendorBadgeClass(device.type)}"
                    >
                      {device.type}
                    </Badge>
                  {:else}
                    <span class="text-xs text-[var(--dim)]">—</span>
                  {/if}
                </Table.Cell>
              </Table.Row>
            {/each}
          {/if}
        </Table.Body>
      </Table.Root>
    </CardContent>
  </Card>
</div>
