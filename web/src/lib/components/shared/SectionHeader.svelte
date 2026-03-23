<script lang="ts">
  import type { Component } from 'svelte';

  let {
    icon,
    label,
  }: {
    icon?: Component<{ size?: number; class?: string }>;
    label: string;
  } = $props();
</script>

<div class="flex items-center gap-1.5">
  {#if icon}
    {@const Icon = icon}
    <Icon class="text-muted-foreground" size={11} />
  {/if}
  <span class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
</div>
