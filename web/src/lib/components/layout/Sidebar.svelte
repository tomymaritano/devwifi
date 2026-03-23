<script lang="ts">
  import { LayoutDashboard, Activity, Wifi, Globe, Monitor, Bell } from 'lucide-svelte';
  import { Separator } from '$lib/components/ui/separator';
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

<aside class="flex flex-col w-56 h-screen bg-card border-r border-border shrink-0">
  <!-- Brand -->
  <div class="flex items-center gap-2.5 px-5 h-14 border-b border-border">
    <span class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
    <span class="text-[15px] font-semibold tracking-tight">devwifi</span>
  </div>

  <!-- Nav -->
  <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-5">
    {#each navSections as section}
      <div>
        <p class="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {section.label}
        </p>
        <ul class="space-y-0.5">
          {#each section.items as item}
            {@const active = currentPage === item.id}
            <li>
              <button
                onclick={() => onNavigate(item.id)}
                class="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-colors
                  {active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}"
              >
                <item.icon size={15} strokeWidth={active ? 2 : 1.5} />
                <span>{item.label}</span>
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </nav>

  <!-- Footer -->
  <div class="px-5 py-3 border-t border-border">
    <p class="text-[10px] text-muted-foreground uppercase tracking-[0.1em] mb-0.5">Uptime</p>
    <p class="text-xs font-mono tabular-nums">{uptime}</p>
  </div>
</aside>
