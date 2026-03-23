<script lang="ts">
  import { LayoutDashboard, Activity, Wifi, Globe, Monitor, Bell } from 'lucide-svelte';
  import { info } from '$lib/stores/sse';
  import { formatUptime } from '$lib/utils/format';

  interface Props {
    currentPage: string;
    onNavigate: (page: string) => void;
  }

  let { currentPage, onNavigate }: Props = $props();

  const navSections = [
    {
      label: 'Monitor',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'history', label: 'History', icon: Activity },
      ],
    },
    {
      label: 'Manage',
      items: [
        { id: 'networks', label: 'Networks', icon: Wifi },
        { id: 'dns', label: 'DNS', icon: Globe },
        { id: 'devices', label: 'Devices', icon: Monitor },
      ],
    },
    {
      label: 'Settings',
      items: [
        { id: 'alerts', label: 'Alerts', icon: Bell },
      ],
    },
  ];

  let uptime = $derived($info ? formatUptime($info.startedAt) : '--:--:--');
</script>

<aside class="flex flex-col w-[200px] h-screen bg-card/40 backdrop-blur-md border-r border-border shrink-0">
  <!-- Brand -->
  <div class="flex items-center gap-2 px-4 h-12">
    <div class="relative">
      <span class="block w-[7px] h-[7px] rounded-full bg-emerald-400"></span>
      <span class="absolute inset-0 w-[7px] h-[7px] rounded-full bg-emerald-400 animate-ping opacity-30"></span>
    </div>
    <span class="text-[13px] font-semibold tracking-[-0.02em]">devwifi</span>
  </div>

  <!-- Nav -->
  <nav class="flex-1 overflow-y-auto px-2 pt-2 space-y-4">
    {#each navSections as section}
      <div>
        <p class="px-2.5 mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
          {section.label}
        </p>
        <ul class="space-y-px">
          {#each section.items as item}
            {@const active = currentPage === item.id}
            <li>
              <button
                onclick={() => onNavigate(item.id)}
                class="w-full flex items-center gap-2 px-2.5 py-[6px] rounded-lg text-[12px] font-medium transition-all duration-150
                  {active
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground/80 hover:bg-accent/40'}"
              >
                <item.icon size={14} strokeWidth={active ? 2 : 1.5} class="transition-all duration-150 {active ? 'opacity-100' : 'opacity-50'}" />
                <span>{item.label}</span>
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </nav>

  <!-- Footer -->
  <div class="px-4 py-3 border-t border-border">
    <p class="text-[9px] text-muted-foreground/50 uppercase tracking-[0.12em] font-medium">Uptime</p>
    <p class="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5">{uptime}</p>
  </div>
</aside>
