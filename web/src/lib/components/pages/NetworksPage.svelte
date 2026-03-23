<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Table from '$lib/components/ui/table';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Wifi, Search, Eye, EyeOff, Copy, QrCode, Check } from 'lucide-svelte';
  import QRCode from 'qrcode';
  import type { SavedNetwork } from '$lib/types';

  let networks: SavedNetwork[] = $state([]);
  let search = $state('');
  let loading = $state(false);

  // Track password visibility per network
  let passwords: Record<string, string> = $state({});
  let visible: Record<string, boolean> = $state({});
  let copied: Record<string, boolean> = $state({});
  let fetching: Record<string, boolean> = $state({});

  // QR dialog state
  let qrOpen = $state(false);
  let qrNetwork = $state('');
  let qrDataUrl = $state('');
  let qrLoading = $state(false);

  let filtered = $derived(
    networks.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()))
  );

  async function fetchNetworks() {
    loading = true;
    try {
      const res = await fetch('/api/networks');
      const data = await res.json();
      networks = data.networks ?? data ?? [];
    } catch {
      networks = [];
    } finally {
      loading = false;
    }
  }

  async function fetchPassword(name: string): Promise<string> {
    if (passwords[name]) return passwords[name];
    fetching[name] = true;
    try {
      const res = await fetch(`/api/password/${encodeURIComponent(name)}`);
      const data = await res.json();
      const pw = data.password ?? '';
      passwords[name] = pw;
      return pw;
    } catch {
      return '';
    } finally {
      fetching[name] = false;
    }
  }

  async function toggleVisibility(name: string) {
    if (visible[name]) {
      visible[name] = false;
      return;
    }
    await fetchPassword(name);
    visible[name] = true;
  }

  async function copyPassword(name: string) {
    const pw = await fetchPassword(name);
    if (pw) {
      await navigator.clipboard.writeText(pw);
      copied[name] = true;
      setTimeout(() => {
        copied[name] = false;
      }, 2000);
    }
  }

  async function showQR(name: string) {
    qrNetwork = name;
    qrLoading = true;
    qrOpen = true;
    qrDataUrl = '';
    const pw = await fetchPassword(name);
    if (pw) {
      const wifiString = `WIFI:T:WPA;S:${name};P:${pw};;`;
      try {
        qrDataUrl = await QRCode.toDataURL(wifiString, {
          width: 280,
          margin: 2,
          color: { dark: '#fafafa', light: '#09090b' },
        });
      } catch {
        qrDataUrl = '';
      }
    }
    qrLoading = false;
  }

  onMount(() => {
    fetchNetworks();
  });
</script>

<div class="space-y-6">
  <!-- Search -->
  <div class="flex items-center gap-3">
    <div class="relative flex-1 max-w-sm">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
      <Input
        type="text"
        placeholder="Search networks..."
        bind:value={search}
        class="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
      />
    </div>
    <span class="text-xs text-muted-foreground">
      {filtered.length} network{filtered.length !== 1 ? 's' : ''}
    </span>
  </div>

  <!-- Table -->
  <Card class="bg-card border-border">
    <CardContent class="px-0 pb-0 pt-0">
      <Table.Root>
        <Table.Header>
          <Table.Row class="border-border hover:bg-transparent">
            <Table.Head class="text-muted-foreground w-12">#</Table.Head>
            <Table.Head class="text-muted-foreground">Name</Table.Head>
            <Table.Head class="text-muted-foreground">Password</Table.Head>
            <Table.Head class="text-muted-foreground text-right">Actions</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#if loading}
            <Table.Row class="border-border">
              <Table.Cell colspan={4} class="text-center text-xs text-muted-foreground py-8">
                Loading networks...
              </Table.Cell>
            </Table.Row>
          {:else if filtered.length === 0}
            <Table.Row class="border-border">
              <Table.Cell colspan={4} class="text-center text-xs text-muted-foreground py-8">
                {search ? 'No matching networks' : 'No saved networks found'}
              </Table.Cell>
            </Table.Row>
          {:else}
            {#each filtered as network, i}
              <Table.Row class="border-border hover:bg-muted">
                <Table.Cell class="text-xs text-muted-foreground tabular-nums">{i + 1}</Table.Cell>
                <Table.Cell>
                  <div class="flex items-center gap-2">
                    <Wifi class="text-muted-foreground" size={14} />
                    <span class="text-sm text-foreground">{network.name}</span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <span class="text-sm font-mono text-muted-foreground">
                    {#if visible[network.name] && passwords[network.name]}
                      {passwords[network.name]}
                    {:else}
                      {'••••••••'}
                    {/if}
                  </span>
                </Table.Cell>
                <Table.Cell class="text-right">
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onclick={() => toggleVisibility(network.name)}
                      disabled={fetching[network.name]}
                      class="text-muted-foreground hover:text-foreground"
                    >
                      {#if visible[network.name]}
                        <EyeOff size={14} />
                      {:else}
                        <Eye size={14} />
                      {/if}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onclick={() => copyPassword(network.name)}
                      disabled={fetching[network.name]}
                      class="text-muted-foreground hover:text-foreground"
                    >
                      {#if copied[network.name]}
                        <Check size={14} class="text-green-500" />
                      {:else}
                        <Copy size={14} />
                      {/if}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onclick={() => showQR(network.name)}
                      disabled={fetching[network.name]}
                      class="text-muted-foreground hover:text-foreground"
                    >
                      <QrCode size={14} />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            {/each}
          {/if}
        </Table.Body>
      </Table.Root>
    </CardContent>
  </Card>
</div>

<!-- QR Dialog -->
<Dialog.Root bind:open={qrOpen}>
  <Dialog.Content class="bg-card border-border sm:max-w-sm">
    <Dialog.Header>
      <Dialog.Title class="text-foreground">Wi-Fi QR Code</Dialog.Title>
      <Dialog.Description class="text-muted-foreground">
        Scan to connect to <span class="font-mono font-semibold text-foreground">{qrNetwork}</span>
      </Dialog.Description>
    </Dialog.Header>
    <div class="flex items-center justify-center py-4">
      {#if qrLoading}
        <div class="w-[280px] h-[280px] flex items-center justify-center">
          <span class="text-xs text-muted-foreground">Generating...</span>
        </div>
      {:else if qrDataUrl}
        <img src={qrDataUrl} alt="Wi-Fi QR Code for {qrNetwork}" class="rounded-lg" width="280" height="280" />
      {:else}
        <div class="w-[280px] h-[280px] flex items-center justify-center">
          <span class="text-xs text-destructive">Failed to generate QR code</span>
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
