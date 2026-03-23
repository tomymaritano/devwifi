<script lang="ts">
  import type { Component } from 'svelte';

  let {
    icon,
    title,
    description = '',
  }: {
    icon?: Component<{ size?: number; class?: string }>;
    title: string;
    description?: string;
  } = $props();
</script>

<div class="flex flex-col items-center justify-center gap-3 py-12 empty-state">
  {#if icon}
    {@const Icon = icon}
    <div class="rounded-xl bg-muted/30 p-3">
      <Icon class="text-muted-foreground opacity-50" size={24} />
    </div>
  {/if}
  <div class="text-center space-y-1">
    <p class="text-[13px] font-medium text-muted-foreground">{title}</p>
    {#if description}
      <p class="text-[11px] text-muted-foreground/60 max-w-[240px]">{description}</p>
    {/if}
  </div>
</div>

<style>
  .empty-state {
    animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
