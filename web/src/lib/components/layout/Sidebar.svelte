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

<aside class="flex flex-col w-56 h-screen bg-[var(--surface)] border-r border-[var(--border)] shrink-0">
  <!-- Brand -->
  <div class="flex items-center gap-2.5 px-4 py-4 border-b border-[var(--border)]">
    <span class="w-2 h-2 rounded-full bg-[var(--green)] shadow-[0_0_6px_var(--green)]"></span>
    <span class="text-sm font-semibold tracking-tight text-[var(--text)]">devwifi</span>
  </div>

  <!-- Nav -->
  <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-4">
    {#each navSections as section}
      <div>
        <p class="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--dim)]">
          {section.label}
        </p>
        <ul class="space-y-0.5">
          {#each section.items as item}
            {@const active = currentPage === item.id}
            <li>
              <button
                onclick={() => onNavigate(item.id)}
                class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors
                  {active
                    ? 'bg-zinc-800 text-[var(--text)]'
                    : 'text-[var(--dim)] hover:bg-zinc-900 hover:text-[var(--text)]'}"
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
  <div class="px-4 py-3 border-t border-[var(--border)]">
    <p class="text-[10px] text-[var(--dim)] uppercase tracking-widest mb-0.5">Uptime</p>
    <p class="text-xs font-mono text-[var(--text)]">{uptime}</p>
  </div>
</aside>
