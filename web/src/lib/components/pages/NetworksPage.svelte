<script lang="ts">
  import { onMount } from 'svelte';
  import { Card } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Table from '$lib/components/ui/table';
  import * as Dialog from '$lib/components/ui/dialog';
  import Skeleton from '$lib/components/ui/skeleton.svelte';
  import SectionHeader from '$lib/components/shared/SectionHeader.svelte';
  import EmptyState from '$lib/components/shared/EmptyState.svelte';
  import PageTransition from '$lib/components/shared/PageTransition.svelte';
  import { Wifi, Search, Eye, EyeOff, Copy, QrCode, Check, WifiOff } from 'lucide-svelte';
  import { debounce } from '$lib/utils/debounce';
  import QRCode from 'qrcode';
  import type { SavedNetwork } from '$lib/types';

  let networks: SavedNetwork[] = $state([]);
  let search = $state('');
  let debouncedSearch = $state('');
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

  const updateSearch = debounce((val: string) => {
    debouncedSearch = val;
  }, 300);

  // React to search input changes
  $effect(() => {
    updateSearch(search);
  });

  let filtered = $derived(
    networks.filter((n) => n.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
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

<PageTransition>
  <div class="space-y-3">
    <!-- Search -->
    <div class="flex items-center gap-3" style="animation: fadeUp 0.4s 0ms both cubic-bezier(0.16,1,0.3,1)">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" size={13} />
        <Input
          type="text"
          placeholder="Search networks..."
          bind:value={search}
          class="pl-9 h-8 text-[11px] bg-card border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>
      <span class="text-[10px] text-muted-foreground font-mono tabular-nums">
        {filtered.length} network{filtered.length !== 1 ? 's' : ''}
      </span>
    </div>

    <!-- Table -->
    <Card style="animation: fadeUp 0.4s 80ms both cubic-bezier(0.16,1,0.3,1)">
      <div class="px-4 pt-3.5 pb-1">
        <SectionHeader icon={Wifi} label="Saved Networks" />
      </div>
      <div class="px-0 pb-0 pt-1">
        <Table.Root>
          <Table.Header>
            <Table.Row class="border-border hover:bg-transparent">
              <Table.Head class="text-muted-foreground text-[10px] uppercase tracking-[0.08em] w-12 pl-4">#</Table.Head>
              <Table.Head class="text-muted-foreground text-[10px] uppercase tracking-[0.08em]">Name</Table.Head>
              <Table.Head class="text-muted-foreground text-[10px] uppercase tracking-[0.08em]">Password</Table.Head>
              <Table.Head class="text-muted-foreground text-[10px] uppercase tracking-[0.08em] text-right pr-4">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#if loading}
              {#each Array(5) as _, i}
                <Table.Row class="border-border">
                  <Table.Cell class="pl-4"><Skeleton class="h-4 w-6" /></Table.Cell>
                  <Table.Cell><Skeleton class="h-4 w-32" /></Table.Cell>
                  <Table.Cell><Skeleton class="h-4 w-20" /></Table.Cell>
                  <Table.Cell class="text-right pr-4"><Skeleton class="h-4 w-24 ml-auto" /></Table.Cell>
                </Table.Row>
              {/each}
            {:else if filtered.length === 0}
              <Table.Row class="border-border hover:bg-transparent">
                <Table.Cell colspan={4} class="p-0">
                  {#if search}
                    <EmptyState icon={Search} title="No matching networks" description="Try a different search term" />
                  {:else}
                    <EmptyState icon={WifiOff} title="No saved networks found" description="Connect to a Wi-Fi network to see it listed here" />
                  {/if}
                </Table.Cell>
              </Table.Row>
            {:else}
              {#each filtered as network, i}
                <Table.Row class="border-border hover:bg-muted/50 transition-colors duration-150 network-row" style="animation: fadeUp 0.3s {i * 30}ms both cubic-bezier(0.16,1,0.3,1)">
                  <Table.Cell class="text-[11px] text-muted-foreground tabular-nums font-mono pl-4">{i + 1}</Table.Cell>
                  <Table.Cell>
                    <div class="flex items-center gap-2">
                      <Wifi class="text-muted-foreground opacity-40" size={12} />
                      <span class="text-[13px] text-foreground">{network.name}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span class="text-[11px] font-mono text-muted-foreground password-cell">
                      {#if visible[network.name] && passwords[network.name]}
                        <span class="password-visible">{passwords[network.name]}</span>
                      {:else}
                        {'••••••••'}
                      {/if}
                    </span>
                  </Table.Cell>
                  <Table.Cell class="text-right pr-4">
                    <div class="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onclick={() => toggleVisibility(network.name)}
                        disabled={fetching[network.name]}
                        class="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        {#if visible[network.name]}
                          <EyeOff size={13} />
                        {:else}
                          <Eye size={13} />
                        {/if}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onclick={() => copyPassword(network.name)}
                        disabled={fetching[network.name]}
                        class="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        {#if copied[network.name]}
                          <Check size={13} class="text-green-400" />
                        {:else}
                          <Copy size={13} />
                        {/if}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onclick={() => showQR(network.name)}
                        disabled={fetching[network.name]}
                        class="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <QrCode size={13} />
                      </Button>
                    </div>
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

<!-- QR Dialog -->
<Dialog.Root bind:open={qrOpen}>
  <Dialog.Content class="bg-card border-border sm:max-w-sm">
    <Dialog.Header>
      <Dialog.Title class="text-[13px] font-semibold text-foreground">Wi-Fi QR Code</Dialog.Title>
      <Dialog.Description class="text-[11px] text-muted-foreground">
        Scan to connect to <span class="font-mono font-semibold text-foreground">{qrNetwork}</span>
      </Dialog.Description>
    </Dialog.Header>
    <div class="flex items-center justify-center py-4">
      {#if qrLoading}
        <div class="w-[280px] h-[280px] flex items-center justify-center">
          <div class="space-y-3 text-center">
            <Skeleton class="w-[200px] h-[200px] mx-auto rounded-lg" />
            <p class="text-[10px] text-muted-foreground">Generating...</p>
          </div>
        </div>
      {:else if qrDataUrl}
        <div class="qr-enter">
          <img src={qrDataUrl} alt="Wi-Fi QR Code for {qrNetwork}" class="rounded-lg" width="280" height="280" />
        </div>
      {:else}
        <div class="w-[280px] h-[280px] flex items-center justify-center">
          <span class="text-[11px] text-destructive">Failed to generate QR code</span>
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>

<style>
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .qr-enter {
    animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .password-visible {
    animation: fadeIn 0.2s ease both;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
