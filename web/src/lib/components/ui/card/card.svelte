<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	class={cn(
		"bg-card text-card-foreground rounded-xl border border-border backdrop-blur-sm transition-all duration-200 hover:border-[hsla(225,8%,50%,0.14)]",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
