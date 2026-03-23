<script lang="ts">
  import { Card } from '$lib/components/ui/card';
  import type { Component } from 'svelte';

  let {
    label,
    value,
    unit = '',
    color = 'text-foreground',
    icon,
    delay = 0,
  }: {
    label: string;
    value: string;
    unit?: string;
    color?: string;
    icon?: Component<{ size?: number; class?: string }>;
    delay?: number;
  } = $props();
</script>

<Card class="group relative overflow-hidden" style="animation: fadeUp 0.4s {delay}ms both cubic-bezier(0.16,1,0.3,1)">
  <div class="px-4 py-3.5">
    <div class="flex items-center justify-between mb-2">
      <span class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
      {#if icon}
        {@const Icon = icon}
        <Icon class="{color} opacity-40 group-hover:opacity-70 transition-opacity duration-300" size={12} />
      {/if}
    </div>
    <p class="text-[22px] font-semibold {color} tracking-tight tabular-nums leading-none font-mono">{value}</p>
    {#if unit}
      <p class="text-[10px] text-muted-foreground mt-1 font-medium">{unit}</p>
    {/if}
  </div>
  <!-- Subtle gradient glow on hover -->
  <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
       style="background: radial-gradient(ellipse at 50% 0%, hsla(217,92%,60%,0.03) 0%, transparent 70%)"></div>
</Card>

<style>
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
