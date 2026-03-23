<script lang="ts">
  import { onMount } from 'svelte';
  import { Card } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import * as Dialog from '$lib/components/ui/dialog';
  import Skeleton from '$lib/components/ui/skeleton.svelte';
  import SectionHeader from '$lib/components/shared/SectionHeader.svelte';
  import EmptyState from '$lib/components/shared/EmptyState.svelte';
  import PageTransition from '$lib/components/shared/PageTransition.svelte';
  import { Globe, Check, X, Loader, Shield, Zap, Eye, Lock } from 'lucide-svelte';

  interface DnsServer {
    address: string;
    provider: string;
  }

  const PRESETS = [
    {
      name: 'Cloudflare',
      primary: '1.1.1.1',
      secondary: '1.0.0.1',
      description: 'Privacy-first, fastest DNS',
      color: 'text-orange-400',
      dot: 'bg-orange-400',
      borderGlow: 'hover:border-orange-400/20',
      icon: Zap,
    },
    {
      name: 'Google',
      primary: '8.8.8.8',
      secondary: '8.8.4.4',
      description: 'Reliable & widely used',
      color: 'text-blue-400',
      dot: 'bg-blue-400',
      borderGlow: 'hover:border-blue-400/20',
      icon: Globe,
    },
    {
      name: 'Quad9',
      primary: '9.9.9.9',
      secondary: '149.112.112.112',
      description: 'Security-focused, blocks malware',
      color: 'text-purple-400',
      dot: 'bg-purple-400',
      borderGlow: 'hover:border-purple-400/20',
      icon: Shield,
    },
    {
      name: 'OpenDNS',
      primary: '208.67.222.222',
      secondary: '208.67.220.220',
      description: 'Content filtering & protection',
      color: 'text-green-400',
      dot: 'bg-green-400',
      borderGlow: 'hover:border-green-400/20',
      icon: Eye,
    },
  ];

  let currentServers: DnsServer[] = $state([]);
  let loadingCurrent = $state(true);

  let customPrimary = $state('');
  let customSecondary = $state('');
  let applying = $state(false);

  type FeedbackStatus = 'success' | 'error' | null;
  let feedbackStatus: FeedbackStatus = $state(null);
  let feedbackMessage = $state('');

  // Confirmation dialog state
  let confirmOpen = $state(false);
  let confirmPreset: (typeof PRESETS)[number] | null = $state(null);

  function showFeedback(status: 'success' | 'error', message: string) {
    feedbackStatus = status;
    feedbackMessage = message;
    setTimeout(() => {
      feedbackStatus = null;
      feedbackMessage = '';
    }, 4000);
  }

  async function fetchCurrentDns() {
    loadingCurrent = true;
    try {
      const res = await fetch('/api/dns');
      const data = await res.json();
      currentServers = data.servers ?? [];
    } catch {
      currentServers = [];
    } finally {
      loadingCurrent = false;
    }
  }

  async function applyDns(primary: string, secondary: string) {
    applying = true;
    try {
      const res = await fetch('/api/dns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primary, secondary }),
      });
      const data = await res.json();
      if (data.ok) {
        showFeedback('success', `DNS updated to ${primary} / ${secondary}`);
        await fetchCurrentDns();
      } else {
        showFeedback('error', data.error ?? 'Failed to update DNS');
      }
    } catch {
      showFeedback('error', 'Network error — could not reach server');
    } finally {
      applying = false;
    }
  }

  function handlePresetClick(preset: (typeof PRESETS)[number]) {
    confirmPreset = preset;
    confirmOpen = true;
  }

  function handleConfirmApply() {
    if (confirmPreset) {
      applyDns(confirmPreset.primary, confirmPreset.secondary);
      confirmOpen = false;
      confirmPreset = null;
    }
  }

  async function handleCustomApply() {
    if (!customPrimary.trim()) return;
    await applyDns(customPrimary.trim(), customSecondary.trim());
  }

  onMount(() => {
    fetchCurrentDns();
  });
</script>

<PageTransition>
  <div class="space-y-3">
    <!-- Current DNS -->
    <Card style="animation: fadeUp 0.4s 0ms both cubic-bezier(0.16,1,0.3,1)">
      <div class="px-4 pt-3.5 pb-1">
        <SectionHeader icon={Globe} label="Current DNS Servers" />
      </div>
      <div class="px-4 pb-3.5 pt-2">
        {#if loadingCurrent}
          <div class="flex flex-wrap gap-2.5">
            {#each Array(2) as _}
              <div class="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2">
                <Skeleton class="h-3 w-14" />
                <Skeleton class="h-3.5 w-24" />
              </div>
            {/each}
          </div>
        {:else if currentServers.length === 0}
          <p class="text-[11px] text-muted-foreground py-1">No DNS servers detected</p>
        {:else}
          <div class="flex flex-wrap gap-2.5">
            {#each currentServers as server, i}
              <div class="flex items-center gap-2.5 bg-background border border-border rounded-md px-3 py-2 dns-server-badge" style="animation: fadeUp 0.3s {i * 60}ms both cubic-bezier(0.16,1,0.3,1)">
                <span class="text-[10px] text-muted-foreground uppercase tracking-[0.08em] font-semibold shrink-0">{i === 0 ? 'Primary' : 'Secondary'}</span>
                <span class="text-[11px] font-mono text-foreground tabular-nums">{server.address}</span>
                {#if server.provider}
                  <Badge variant="outline" class="text-[9px] px-1.5 py-0 border-border">{server.provider}</Badge>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </Card>

    <!-- Feedback Banner -->
    {#if feedbackStatus}
      <div
        class="flex items-center gap-3 px-4 py-2.5 rounded-lg border text-[11px] feedback-slide
          {feedbackStatus === 'success'
            ? 'bg-green-950/40 border-green-800/50 text-green-400'
            : 'bg-red-950/40 border-red-800/50 text-red-400'}"
      >
        {#if feedbackStatus === 'success'}
          <Check size={12} />
        {:else}
          <X size={12} />
        {/if}
        <span class="font-mono">{feedbackMessage}</span>
      </div>
    {/if}

    <!-- Preset Cards -->
    <div style="animation: fadeUp 0.4s 80ms both cubic-bezier(0.16,1,0.3,1)">
      <div class="mb-2">
        <SectionHeader icon={Zap} label="Quick Presets" />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {#each PRESETS as preset, i}
          <button
            onclick={() => handlePresetClick(preset)}
            disabled={applying}
            class="group text-left bg-card border border-border rounded-xl px-4 py-3.5
                   {preset.borderGlow}
                   transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40
                   hover:bg-card/80 preset-card"
            style="animation: fadeUp 0.4s {120 + i * 60}ms both cubic-bezier(0.16,1,0.3,1)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0 {preset.dot}"></span>
                  <span class="text-[13px] font-semibold {preset.color}">{preset.name}</span>
                </div>
                <p class="text-[10px] text-muted-foreground mb-2.5">{preset.description}</p>
                <div class="space-y-0.5">
                  <p class="text-[11px] font-mono text-foreground/80">
                    <span class="text-[10px] text-muted-foreground uppercase tracking-[0.08em] inline-block w-[70px]">Primary</span>{preset.primary}
                  </p>
                  <p class="text-[11px] font-mono text-foreground/80">
                    <span class="text-[10px] text-muted-foreground uppercase tracking-[0.08em] inline-block w-[70px]">Secondary</span>{preset.secondary}
                  </p>
                </div>
              </div>
              <span class="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-0.5">
                Apply &rarr;
              </span>
            </div>
            <!-- Subtle glow on hover -->
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"
                 style="background: radial-gradient(ellipse at 50% 0%, hsla(217,92%,60%,0.02) 0%, transparent 70%)"></div>
          </button>
        {/each}
      </div>
    </div>

    <!-- Custom DNS -->
    <div style="animation: fadeUp 0.4s 400ms both cubic-bezier(0.16,1,0.3,1)">
      <div class="mb-2">
        <SectionHeader icon={Lock} label="Custom DNS" />
      </div>
      <Card>
        <div class="px-4 py-3.5">
          <div class="flex flex-col sm:flex-row gap-2.5">
            <div class="flex-1">
              <label class="block text-[10px] text-muted-foreground uppercase tracking-[0.08em] font-semibold mb-1.5" for="dns-primary">
                Primary DNS
              </label>
              <Input
                id="dns-primary"
                type="text"
                placeholder="e.g. 1.1.1.1"
                bind:value={customPrimary}
                class="h-8 text-[11px] bg-background border-border text-foreground placeholder:text-muted-foreground font-mono"
              />
            </div>
            <div class="flex-1">
              <label class="block text-[10px] text-muted-foreground uppercase tracking-[0.08em] font-semibold mb-1.5" for="dns-secondary">
                Secondary DNS <span class="normal-case text-muted-foreground/60 font-normal">(optional)</span>
              </label>
              <Input
                id="dns-secondary"
                type="text"
                placeholder="e.g. 1.0.0.1"
                bind:value={customSecondary}
                class="h-8 text-[11px] bg-background border-border text-foreground placeholder:text-muted-foreground font-mono"
              />
            </div>
            <div class="flex items-end">
              <Button
                onclick={handleCustomApply}
                disabled={applying || !customPrimary.trim()}
                variant="default"
                size="sm"
                class="h-8 text-[11px] whitespace-nowrap gap-1.5"
              >
                {#if applying}
                  <Loader size={11} class="animate-spin" />
                  Applying...
                {:else}
                  Apply
                {/if}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</PageTransition>

<!-- Confirm Dialog -->
<Dialog.Root bind:open={confirmOpen}>
  <Dialog.Content class="bg-card border-border sm:max-w-sm">
    <Dialog.Header>
      <Dialog.Title class="text-[13px] font-semibold text-foreground">Apply {confirmPreset?.name} DNS?</Dialog.Title>
      <Dialog.Description class="text-[11px] text-muted-foreground">
        This will change your system DNS servers.
      </Dialog.Description>
    </Dialog.Header>
    {#if confirmPreset}
      <div class="space-y-1.5 py-3">
        <div class="flex items-center gap-2.5 bg-background border border-border rounded-md px-3 py-2">
          <span class="text-[10px] text-muted-foreground uppercase tracking-[0.08em] font-semibold w-[70px]">Primary</span>
          <span class="text-[11px] font-mono text-foreground">{confirmPreset.primary}</span>
        </div>
        <div class="flex items-center gap-2.5 bg-background border border-border rounded-md px-3 py-2">
          <span class="text-[10px] text-muted-foreground uppercase tracking-[0.08em] font-semibold w-[70px]">Secondary</span>
          <span class="text-[11px] font-mono text-foreground">{confirmPreset.secondary}</span>
        </div>
      </div>
    {/if}
    <Dialog.Footer class="gap-2">
      <Button variant="outline" size="sm" class="h-8 text-[11px]" onclick={() => { confirmOpen = false; }}>Cancel</Button>
      <Button variant="default" size="sm" class="h-8 text-[11px]" onclick={handleConfirmApply} disabled={applying}>
        {#if applying}
          <Loader size={11} class="animate-spin" />
          Applying...
        {:else}
          Confirm
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .feedback-slide {
    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .preset-card {
    position: relative;
    overflow: hidden;
  }
</style>
