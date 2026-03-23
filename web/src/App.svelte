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
    <header class="flex items-center justify-between px-6 h-14 border-b border-border bg-card shrink-0">
      <h1 class="text-sm font-semibold">
        {pageTitles[currentPage] ?? currentPage}
      </h1>

      <div class="flex items-center gap-4">
        <span class="text-xs font-mono tabular-nums text-muted-foreground">{uptime}</span>

        <div class="flex items-center gap-1.5">
          <span
            class="w-1.5 h-1.5 rounded-full {$connected ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-red-500'}"
          ></span>
          <span
            class="text-[10px] font-semibold uppercase tracking-[0.1em] {$connected ? 'text-green-500' : 'text-red-500'}"
          >
            {$connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto">
      <div class="p-5">
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
