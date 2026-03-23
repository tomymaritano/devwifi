<script lang="ts">
  import { cn } from '$lib/utils.js';
  let { class: className, ...rest }: { class?: string; [key: string]: unknown } = $props();
</script>

<div class={cn("animate-pulse rounded-md bg-muted/50", className)} {...rest}></div>
