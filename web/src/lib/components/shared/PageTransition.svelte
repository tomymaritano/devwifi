<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children, class: className = '' }: { children: Snippet; class?: string } = $props();
</script>

<div class="page-transition {className}">
  {@render children()}
</div>

<style>
  .page-transition {
    animation: pageIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes pageIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
