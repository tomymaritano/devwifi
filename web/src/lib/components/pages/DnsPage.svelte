<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import { Globe, Check, X, Loader } from 'lucide-svelte';

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
    },
    {
      name: 'Google',
      primary: '8.8.8.8',
      secondary: '8.8.4.4',
      description: 'Reliable & widely used',
      color: 'text-blue-400',
      dot: 'bg-blue-400',
    },
    {
      name: 'Quad9',
      primary: '9.9.9.9',
      secondary: '149.112.112.112',
      description: 'Security-focused, blocks malware',
      color: 'text-purple-400',
      dot: 'bg-purple-400',
    },
    {
      name: 'OpenDNS',
      primary: '208.67.222.222',
      secondary: '208.67.220.220',
      description: 'Content filtering & protection',
      color: 'text-green-400',
      dot: 'bg-green-400',
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
    const confirmed = confirm(
      `Apply ${preset.name} DNS?\n\nPrimary:   ${preset.primary}\nSecondary: ${preset.secondary}`
    );
    if (confirmed) {
      applyDns(preset.primary, preset.secondary);
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

<div class="space-y-8">
  <!-- Current DNS -->
  <Card >
    <CardHeader class="pb-2 pt-4 px-4">
      <div class="flex items-center gap-2">
        <Globe class="text-muted-foreground" size={14} />
        <CardTitle class="text-sm font-medium text-foreground">Current DNS Servers</CardTitle>
      </div>
    </CardHeader>
    <CardContent class="px-4 pb-4 pt-0">
      {#if loadingCurrent}
        <p class="text-xs text-muted-foreground">Loading...</p>
      {:else if currentServers.length === 0}
        <p class="text-xs text-muted-foreground">No DNS servers detected</p>
      {:else}
        <div class="flex flex-wrap gap-3">
          {#each currentServers as server, i}
            <div class="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2">
              <span class="text-[10px] text-muted-foreground uppercase tracking-wider">{i === 0 ? 'Primary' : 'Secondary'}</span>
              <span class="text-xs font-mono text-foreground">{server.address}</span>
              {#if server.provider}
                <Badge variant="outline" class="text-[10px] px-1.5 py-0">{server.provider}</Badge>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>

  <!-- Feedback Banner -->
  {#if feedbackStatus}
    <div
      class="flex items-center gap-3 px-4 py-3 rounded-lg border text-sm
        {feedbackStatus === 'success'
          ? 'bg-green-950/40 border-green-800/50 text-green-400'
          : 'bg-red-950/40 border-red-800/50 text-red-400'}"
    >
      {#if feedbackStatus === 'success'}
        <Check size={14} />
      {:else}
        <X size={14} />
      {/if}
      {feedbackMessage}
    </div>
  {/if}

  <!-- Preset Cards -->
  <div>
    <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick Presets</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each PRESETS as preset}
        <button
          onclick={() => handlePresetClick(preset)}
          disabled={applying}
          class="group text-left bg-card border border-border rounded-lg px-4 py-4
                 hover:border-foreground/30 hover:bg-muted
                 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
                 focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="w-2 h-2 rounded-full shrink-0 {preset.dot}"></span>
                <span class="text-sm font-semibold {preset.color}">{preset.name}</span>
              </div>
              <p class="text-[11px] text-muted-foreground mb-2">{preset.description}</p>
              <div class="space-y-0.5">
                <p class="text-[11px] font-mono text-foreground">
                  <span class="text-muted-foreground mr-2">Primary</span>{preset.primary}
                </p>
                <p class="text-[11px] font-mono text-foreground">
                  <span class="text-muted-foreground mr-2">Secondary</span>{preset.secondary}
                </p>
              </div>
            </div>
            <span class="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-0.5">
              Apply →
            </span>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Custom DNS -->
  <div>
    <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Custom DNS</h2>
    <Card >
      <CardContent class="px-4 py-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1">
            <label class="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5" for="dns-primary">
              Primary DNS
            </label>
            <Input
              id="dns-primary"
              type="text"
              placeholder="e.g. 1.1.1.1"
              bind:value={customPrimary}
              class="bg-background border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
            />
          </div>
          <div class="flex-1">
            <label class="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5" for="dns-secondary">
              Secondary DNS <span class="normal-case text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="dns-secondary"
              type="text"
              placeholder="e.g. 1.0.0.1"
              bind:value={customSecondary}
              class="bg-background border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
            />
          </div>
          <div class="flex items-end">
            <Button
              onclick={handleCustomApply}
              disabled={applying || !customPrimary.trim()}
              variant="default"
              size="sm"
              class="whitespace-nowrap"
            >
              {#if applying}
                <Loader size={12} class="animate-spin mr-1.5" />
                Applying...
              {:else}
                Apply
              {/if}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</div>
