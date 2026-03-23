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

<div class="flex h-screen bg-[var(--bg)] text-[var(--text)] overflow-hidden">
  <!-- Sidebar -->
  <Sidebar {currentPage} onNavigate={navigate} />

  <!-- Main content -->
  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <!-- Top bar -->
    <header class="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
      <h1 class="text-sm font-semibold text-[var(--text)]">
        {pageTitles[currentPage] ?? currentPage}
      </h1>

      <div class="flex items-center gap-4">
        <!-- Uptime -->
        <span class="text-xs font-mono text-[var(--dim)]">{uptime}</span>

        <!-- LIVE indicator -->
        <div class="flex items-center gap-1.5">
          <span
            class="w-1.5 h-1.5 rounded-full
              {$connected ? 'bg-[var(--green)] shadow-[0_0_5px_var(--green)]' : 'bg-[var(--red)]'}"
          ></span>
          <span
            class="text-[10px] font-semibold uppercase tracking-widest
              {$connected ? 'text-[var(--green)]' : 'text-[var(--red)]'}"
          >
            {$connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    </header>

    <!-- Page area -->
    <main class="flex-1 overflow-y-auto">
      <div class="p-6">
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
        {:else}
          <h2 class="text-lg font-semibold capitalize text-[var(--text)]">{currentPage}</h2>
        {/if}
      </div>
    </main>
  </div>
</div>
