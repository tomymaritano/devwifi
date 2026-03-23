<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import DashboardPage from '$lib/components/pages/DashboardPage.svelte';
  import HistoryPage from '$lib/components/pages/HistoryPage.svelte';
  import NetworksPage from '$lib/components/pages/NetworksPage.svelte';
  import DnsPage from '$lib/components/pages/DnsPage.svelte';
  import DevicesPage from '$lib/components/pages/DevicesPage.svelte';
  import AlertsPage from '$lib/components/pages/AlertsPage.svelte';
  import { connectSSE, connected, info } from '$lib/stores/sse';
  import { formatUptime } from '$lib/utils/format';

  const pageTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    history: 'History',
    networks: 'Networks',
    dns: 'DNS',
    devices: 'Devices',
    alerts: 'Alerts',
  };

  let currentPage = $state('dashboard');

  function navigate(page: string) {
    currentPage = page;
  }

  let uptime = $derived($info ? formatUptime($info.startedAt) : '--:--:--');

  onMount(() => {
    connectSSE();
  });
</script>

<div class="flex h-screen overflow-hidden">
  <Sidebar {currentPage} onNavigate={navigate} />

  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <!-- Top bar -->
    <header class="flex items-center justify-between px-5 h-12 border-b border-border bg-card/30 backdrop-blur-md shrink-0">
      <h1 class="text-[13px] font-semibold tracking-[-0.01em]">
        {pageTitles[currentPage] ?? currentPage}
      </h1>

      <div class="flex items-center gap-3">
        <span class="text-[11px] font-mono tabular-nums text-muted-foreground/60">{uptime}</span>

        <div class="flex items-center gap-1.5 pl-3 border-l border-border">
          <div class="relative">
            <span
              class="block w-[6px] h-[6px] rounded-full {$connected ? 'bg-emerald-400' : 'bg-red-400'}"
            ></span>
            {#if $connected}
              <span class="absolute inset-0 w-[6px] h-[6px] rounded-full bg-emerald-400 animate-ping opacity-30"></span>
            {/if}
          </div>
          <span
            class="text-[10px] font-semibold uppercase tracking-[0.08em] {$connected ? 'text-emerald-400' : 'text-red-400'}"
          >
            {$connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto">
      <div class="p-4 max-w-[1600px]">
        {#if currentPage === 'dashboard'}
          <DashboardPage />
        {:else if currentPage === 'history'}
          <HistoryPage />
        {:else if currentPage === 'networks'}
          <NetworksPage />
        {:else if currentPage === 'dns'}
          <DnsPage />
        {:else if currentPage === 'devices'}
          <DevicesPage />
        {:else if currentPage === 'alerts'}
          <AlertsPage />
        {/if}
      </div>
    </main>
  </div>
</div>
