<script lang="ts">
  import { Card } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import * as Table from '$lib/components/ui/table';
  import Skeleton from '$lib/components/ui/skeleton.svelte';
  import SectionHeader from '$lib/components/shared/SectionHeader.svelte';
  import EmptyState from '$lib/components/shared/EmptyState.svelte';
  import PageTransition from '$lib/components/shared/PageTransition.svelte';
  import { Monitor, Wifi, Loader, ScanLine, HelpCircle, Router } from 'lucide-svelte';
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
    return 'bg-background text-muted-foreground border-border';
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

<PageTransition>
  <div class="space-y-3">
    <!-- Header row -->
    <div class="flex items-center justify-between" style="animation: fadeUp 0.4s 0ms both cubic-bezier(0.16,1,0.3,1)">
      <div class="flex items-center gap-2.5">
        <SectionHeader icon={Monitor} label="Network Devices" />
        {#if hasScanned}
          <Badge
            variant="outline"
            class="text-[9px] px-1.5 py-0 border-border text-muted-foreground font-mono tabular-nums"
          >
            {devices.length} {devices.length === 1 ? 'device' : 'devices'}
          </Badge>
        {/if}
      </div>
      <Button
        onclick={scanDevices}
        disabled={scanning}
        variant="default"
        size="sm"
        class="h-8 text-[11px] gap-1.5"
      >
        {#if scanning}
          <Loader size={12} class="animate-spin" />
          Scanning...
        {:else}
          <ScanLine size={12} />
          Scan Network
        {/if}
      </Button>
    </div>

    <!-- Table / Empty state -->
    <Card style="animation: fadeUp 0.4s 80ms both cubic-bezier(0.16,1,0.3,1)">
      <div class="px-0 pb-0 pt-0">
        <Table.Root>
          <Table.Header>
            <Table.Row class="border-border hover:bg-transparent">
              <Table.Head class="text-muted-foreground text-[10px] uppercase tracking-[0.08em] pl-4">IP Address</Table.Head>
              <Table.Head class="text-muted-foreground text-[10px] uppercase tracking-[0.08em]">MAC Address</Table.Head>
              <Table.Head class="text-muted-foreground text-[10px] uppercase tracking-[0.08em]">Hostname</Table.Head>
              <Table.Head class="text-muted-foreground text-[10px] uppercase tracking-[0.08em] pr-4">Vendor / Type</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#if scanning}
              {#each Array(6) as _, i}
                <Table.Row class="border-border">
                  <Table.Cell class="pl-4"><Skeleton class="h-4 w-24" /></Table.Cell>
                  <Table.Cell><Skeleton class="h-4 w-28" /></Table.Cell>
                  <Table.Cell><Skeleton class="h-4 w-20" /></Table.Cell>
                  <Table.Cell class="pr-4"><Skeleton class="h-5 w-16 rounded-full" /></Table.Cell>
                </Table.Row>
              {/each}
            {:else if !hasScanned}
              <Table.Row class="border-border hover:bg-transparent">
                <Table.Cell colspan={4} class="p-0">
                  <EmptyState icon={Wifi} title="Discover connected devices" description="Click Scan Network to find all devices on your network" />
                </Table.Cell>
              </Table.Row>
            {:else if devices.length === 0}
              <Table.Row class="border-border hover:bg-transparent">
                <Table.Cell colspan={4} class="p-0">
                  <EmptyState icon={HelpCircle} title="No devices found" description="Try scanning again — some devices may take time to respond" />
                </Table.Cell>
              </Table.Row>
            {:else}
              {#each devices as device, i}
                <Table.Row class="border-border hover:bg-muted/50 transition-colors duration-150 device-row" style="animation: fadeUp 0.3s {i * 30}ms both cubic-bezier(0.16,1,0.3,1)">
                  <Table.Cell class="pl-4 font-mono text-[11px] text-foreground tabular-nums">
                    {device.ip}
                  </Table.Cell>
                  <Table.Cell class="font-mono text-[11px] text-muted-foreground tabular-nums">
                    {device.mac}
                  </Table.Cell>
                  <Table.Cell class="text-[11px] text-foreground">
                    {#if device.hostname}
                      {device.hostname}
                    {:else}
                      <span class="text-muted-foreground">&mdash;</span>
                    {/if}
                  </Table.Cell>
                  <Table.Cell class="pr-4">
                    {#if device.type}
                      <Badge
                        variant="outline"
                        class="text-[9px] px-2 py-0.5 font-medium border {vendorBadgeClass(device.type)}"
                      >
                        {device.type}
                      </Badge>
                    {:else}
                      <span class="text-[11px] text-muted-foreground">&mdash;</span>
                    {/if}
                  </Table.Cell>
                </Table.Row>
              {/each}
            {/if}
          </Table.Body>
        </Table.Root>
      </div>
    </Card>
  </div>
</PageTransition>

<style>
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
