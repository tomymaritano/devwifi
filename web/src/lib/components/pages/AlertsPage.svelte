<script lang="ts">
  import { onMount } from 'svelte';
  import { Card } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Switch } from '$lib/components/ui/switch';
  import * as Table from '$lib/components/ui/table';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Badge } from '$lib/components/ui/badge';
  import Skeleton from '$lib/components/ui/skeleton.svelte';
  import SectionHeader from '$lib/components/shared/SectionHeader.svelte';
  import EmptyState from '$lib/components/shared/EmptyState.svelte';
  import PageTransition from '$lib/components/shared/PageTransition.svelte';
  import { alertRules, alertEvents, loadAlertRules, addRule, toggleRule, deleteRule, loadAlertLog } from '$lib/stores/alerts';
  import { alertLog as sseAlertLog } from '$lib/stores/sse';
  import { Bell, Trash2, Plus, AlertTriangle, Activity, Shield } from 'lucide-svelte';
  import type { AlertEvent } from '$lib/types';

  // Form state
  let metric = $state('latency');
  let condition = $state('above');
  let threshold = $state('');
  let webhookUrl = $state('');
  let adding = $state(false);
  let rulesLoading = $state(true);
  let logLoading = $state(true);

  // Delete confirmation
  let deleteOpen = $state(false);
  let deleteTargetId = $state('');

  // Validation
  let thresholdError = $state('');

  const METRIC_LABELS: Record<string, string> = {
    latency: 'Latency ms',
    download: 'Download Mbps',
    upload: 'Upload Mbps',
  };

  const CONDITION_LABELS: Record<string, string> = {
    above: 'Above',
    below: 'Below',
  };

  function validateThreshold(val: string): string {
    if (!val) return '';
    const n = parseFloat(val);
    if (isNaN(n)) return 'Must be a number';
    if (n < 0) return 'Must be positive';
    return '';
  }

  $effect(() => {
    thresholdError = validateThreshold(threshold);
  });

  async function handleAddRule() {
    const t = parseFloat(threshold);
    if (!threshold || isNaN(t)) return;
    if (thresholdError) return;
    adding = true;
    try {
      await addRule({
        metric,
        condition,
        threshold: t,
        webhookUrl: webhookUrl.trim() || undefined,
      });
      threshold = '';
      webhookUrl = '';
    } finally {
      adding = false;
    }
  }

  async function handleToggle(id: string, checked: boolean) {
    await toggleRule(id, checked);
  }

  function requestDelete(id: string) {
    deleteTargetId = id;
    deleteOpen = true;
  }

  async function confirmDelete() {
    if (deleteTargetId) {
      await deleteRule(deleteTargetId);
      deleteOpen = false;
      deleteTargetId = '';
    }
  }

  // Merge SSE real-time log with store
  let mergedLog: AlertEvent[] = $derived.by(() => {
    const base = $alertEvents ?? [];
    const live = $sseAlertLog ?? [];
    const all = [...base, ...live];
    const seen = new Set<string>();
    const unique = all.filter((e) => {
      const key = `${e.timestamp}-${e.rule?.id ?? ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return unique.sort((a, b) => b.timestamp - a.timestamp);
  });

  function formatTs(ts: number): string {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  onMount(async () => {
    await Promise.all([
      loadAlertRules().finally(() => { rulesLoading = false; }),
      loadAlertLog().finally(() => { logLoading = false; }),
    ]);
  });
</script>

<PageTransition>
  <div class="space-y-3">
    <!-- Add Rule Form -->
    <Card style="animation: fadeUp 0.4s 0ms both cubic-bezier(0.16,1,0.3,1)">
      <div class="px-4 pt-3.5 pb-1">
        <SectionHeader icon={Plus} label="Add Alert Rule" />
      </div>
      <div class="px-4 pb-3.5 pt-2">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
          <!-- Metric -->
          <div>
            <label class="block text-[10px] text-muted-foreground uppercase tracking-[0.08em] font-semibold mb-1.5" for="alert-metric">
              Metric
            </label>
            <select
              id="alert-metric"
              bind:value={metric}
              class="w-full h-8 rounded-md border border-border bg-background px-3 text-[11px] text-foreground
                     focus:outline-none focus:ring-1 focus:ring-foreground/40 transition-shadow"
            >
              <option value="latency">Latency ms</option>
              <option value="download">Download Mbps</option>
              <option value="upload">Upload Mbps</option>
            </select>
          </div>

          <!-- Condition -->
          <div>
            <label class="block text-[10px] text-muted-foreground uppercase tracking-[0.08em] font-semibold mb-1.5" for="alert-condition">
              Condition
            </label>
            <select
              id="alert-condition"
              bind:value={condition}
              class="w-full h-8 rounded-md border border-border bg-background px-3 text-[11px] text-foreground
                     focus:outline-none focus:ring-1 focus:ring-foreground/40 transition-shadow"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>

          <!-- Threshold -->
          <div>
            <label class="block text-[10px] text-muted-foreground uppercase tracking-[0.08em] font-semibold mb-1.5" for="alert-threshold">
              Threshold
            </label>
            <Input
              id="alert-threshold"
              type="number"
              placeholder="e.g. 100"
              bind:value={threshold}
              class="h-8 text-[11px] bg-background border-border text-foreground placeholder:text-muted-foreground font-mono {thresholdError ? 'border-red-500/50' : ''}"
            />
            {#if thresholdError}
              <p class="text-[9px] text-red-400 mt-1 validation-error">{thresholdError}</p>
            {/if}
          </div>

          <!-- Webhook -->
          <div>
            <label class="block text-[10px] text-muted-foreground uppercase tracking-[0.08em] font-semibold mb-1.5" for="alert-webhook">
              Webhook URL <span class="normal-case text-muted-foreground/60 font-normal">(optional)</span>
            </label>
            <Input
              id="alert-webhook"
              type="text"
              placeholder="https://..."
              bind:value={webhookUrl}
              class="h-8 text-[11px] bg-background border-border text-foreground placeholder:text-muted-foreground font-mono"
            />
          </div>
        </div>

        <Button
          onclick={handleAddRule}
          disabled={adding || !threshold || !!thresholdError}
          variant="default"
          size="sm"
          class="h-8 text-[11px] gap-1.5"
        >
          <Plus size={12} />
          {adding ? 'Adding...' : 'Add Rule'}
        </Button>
      </div>
    </Card>

    <!-- Rules Table -->
    <Card style="animation: fadeUp 0.4s 80ms both cubic-bezier(0.16,1,0.3,1)">
      <div class="px-4 pt-3.5 pb-1">
        <div class="flex items-center gap-2">
          <SectionHeader icon={Shield} label="Active Rules" />
          {#if $alertRules.length > 0}
            <Badge variant="outline" class="text-[9px] px-1.5 py-0 border-border text-muted-foreground font-mono tabular-nums">
              {$alertRules.length}
            </Badge>
          {/if}
        </div>
      </div>
      <div class="px-0 pb-0 pt-1">
        <Table.Root>
          <Table.Header>
            <Table.Row class="border-border hover:bg-transparent">
              <Table.Head class="text-muted-foreground text-[10px] uppercase tracking-[0.08em] pl-4">Metric</Table.Head>
              <Table.Head class="text-muted-foreground text-[10px] uppercase tracking-[0.08em]">Condition</Table.Head>
              <Table.Head class="text-muted-foreground text-[10px] uppercase tracking-[0.08em]">Threshold</Table.Head>
              <Table.Head class="text-muted-foreground text-[10px] uppercase tracking-[0.08em]">Webhook</Table.Head>
              <Table.Head class="text-muted-foreground text-[10px] uppercase tracking-[0.08em]">Enabled</Table.Head>
              <Table.Head class="text-muted-foreground text-[10px] uppercase tracking-[0.08em] pr-4 text-right">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#if rulesLoading}
              {#each Array(3) as _}
                <Table.Row class="border-border">
                  <Table.Cell class="pl-4"><Skeleton class="h-5 w-20 rounded-full" /></Table.Cell>
                  <Table.Cell><Skeleton class="h-4 w-12" /></Table.Cell>
                  <Table.Cell><Skeleton class="h-4 w-10" /></Table.Cell>
                  <Table.Cell><Skeleton class="h-4 w-28" /></Table.Cell>
                  <Table.Cell><Skeleton class="h-5 w-9 rounded-full" /></Table.Cell>
                  <Table.Cell class="pr-4"><Skeleton class="h-6 w-6 ml-auto rounded" /></Table.Cell>
                </Table.Row>
              {/each}
            {:else if $alertRules.length === 0}
              <Table.Row class="border-border hover:bg-transparent">
                <Table.Cell colspan={6} class="p-0">
                  <EmptyState icon={Shield} title="No alert rules configured" description="Add a rule above to get notified when metrics cross thresholds" />
                </Table.Cell>
              </Table.Row>
            {:else}
              {#each $alertRules as rule, i (rule.id)}
                <Table.Row class="border-border hover:bg-muted/50 transition-colors duration-150" style="animation: fadeUp 0.3s {i * 30}ms both cubic-bezier(0.16,1,0.3,1)">
                  <Table.Cell class="pl-4">
                    <Badge variant="outline" class="text-[9px] px-2 py-0.5 border-border text-foreground font-medium">
                      {METRIC_LABELS[rule.metric] ?? rule.metric}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell class="text-[11px] text-muted-foreground">
                    {CONDITION_LABELS[rule.condition] ?? rule.condition}
                  </Table.Cell>
                  <Table.Cell class="text-[11px] font-mono text-foreground tabular-nums">
                    {rule.threshold}
                  </Table.Cell>
                  <Table.Cell class="text-muted-foreground max-w-[180px] truncate">
                    {#if rule.webhookUrl}
                      <span class="font-mono text-[10px]" title={rule.webhookUrl}>{rule.webhookUrl}</span>
                    {:else}
                      <span class="text-[11px]">&mdash;</span>
                    {/if}
                  </Table.Cell>
                  <Table.Cell>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => handleToggle(rule.id, checked)}
                    />
                  </Table.Cell>
                  <Table.Cell class="pr-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={() => requestDelete(rule.id)}
                      class="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-950/30"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </Table.Cell>
                </Table.Row>
              {/each}
            {/if}
          </Table.Body>
        </Table.Root>
      </div>
    </Card>

    <!-- Alert Log -->
    <Card style="animation: fadeUp 0.4s 160ms both cubic-bezier(0.16,1,0.3,1)">
      <div class="px-4 pt-3.5 pb-1">
        <div class="flex items-center gap-2">
          <SectionHeader icon={Activity} label="Alert Log" />
          {#if mergedLog.length > 0}
            <Badge variant="outline" class="text-[9px] px-1.5 py-0 border-border text-muted-foreground font-mono tabular-nums">
              {mergedLog.length}
            </Badge>
          {/if}
        </div>
      </div>
      <div class="px-4 pb-3.5 pt-2">
        {#if logLoading}
          <div class="space-y-3">
            {#each Array(4) as _}
              <div class="flex items-start gap-3">
                <Skeleton class="w-2 h-2 rounded-full mt-1.5 shrink-0" />
                <div class="flex-1 space-y-1">
                  <Skeleton class="h-3.5 w-3/4" />
                  <Skeleton class="h-2.5 w-28" />
                </div>
              </div>
            {/each}
          </div>
        {:else if mergedLog.length === 0}
          <EmptyState icon={Bell} title="No alert events yet" description="Events will appear here when rules are triggered" />
        {:else}
          <div class="relative">
            <!-- Timeline vertical line -->
            <div class="absolute left-[3px] top-3 bottom-3 w-px bg-border"></div>

            <div class="space-y-0">
              {#each mergedLog as event, i (event.timestamp + (event.rule?.id ?? ''))}
                <div class="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0 alert-entry" style="animation: slideIn 0.3s {i * 40}ms both cubic-bezier(0.16,1,0.3,1)">
                  <div class="mt-1 shrink-0 relative z-10">
                    <span class="block w-[7px] h-[7px] rounded-full bg-amber-400 shadow-[0_0_6px_theme(colors.amber.400/50)] ring-2 ring-card"></span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[11px] text-foreground/90 leading-relaxed">{event.message}</p>
                    <p class="text-[10px] text-muted-foreground mt-0.5 font-mono tabular-nums">{formatTs(event.timestamp)}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </Card>
  </div>
</PageTransition>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={deleteOpen}>
  <Dialog.Content class="bg-card border-border sm:max-w-xs">
    <Dialog.Header>
      <Dialog.Title class="text-[13px] font-semibold text-foreground">Delete alert rule?</Dialog.Title>
      <Dialog.Description class="text-[11px] text-muted-foreground">
        This action cannot be undone. The rule will be permanently removed.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="gap-2">
      <Button variant="outline" size="sm" class="h-8 text-[11px]" onclick={() => { deleteOpen = false; }}>Cancel</Button>
      <Button variant="destructive" size="sm" class="h-8 text-[11px]" onclick={confirmDelete}>Delete</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-4px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .validation-error {
    animation: fadeIn 0.2s ease both;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
