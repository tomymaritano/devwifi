<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Switch } from '$lib/components/ui/switch';
  import * as Table from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';
  import { alertRules, alertEvents, loadAlertRules, addRule, toggleRule, deleteRule, loadAlertLog } from '$lib/stores/alerts';
  import { alertLog as sseAlertLog } from '$lib/stores/sse';
  import { Bell, Trash2, Plus, AlertTriangle } from 'lucide-svelte';
  import type { AlertEvent } from '$lib/types';

  // Form state
  let metric = $state('latency');
  let condition = $state('above');
  let threshold = $state('');
  let webhookUrl = $state('');
  let adding = $state(false);

  const METRIC_LABELS: Record<string, string> = {
    latency: 'Latency ms',
    download: 'Download Mbps',
    upload: 'Upload Mbps',
  };

  const CONDITION_LABELS: Record<string, string> = {
    above: 'Above',
    below: 'Below',
  };

  async function handleAddRule() {
    const t = parseFloat(threshold);
    if (!threshold || isNaN(t)) return;
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

  async function handleDelete(id: string) {
    await deleteRule(id);
  }

  // Merge SSE real-time log with store
  let mergedLog: AlertEvent[] = $derived.by(() => {
    const base = $alertEvents ?? [];
    const live = $sseAlertLog ?? [];
    // Combine and deduplicate by timestamp+rule.id, sort descending
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

  onMount(() => {
    loadAlertRules();
    loadAlertLog();
  });
</script>

<div class="space-y-8">
  <!-- Add Rule Form -->
  <div>
    <h2 class="text-xs font-semibold uppercase tracking-wider text-[var(--dim)] mb-3">Add Alert Rule</h2>
    <Card class="bg-[var(--surface)] border-[var(--border)]">
      <CardContent class="px-4 py-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <!-- Metric -->
          <div>
            <label class="block text-[10px] text-[var(--dim)] uppercase tracking-wider mb-1.5" for="alert-metric">
              Metric
            </label>
            <select
              id="alert-metric"
              bind:value={metric}
              class="w-full h-9 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]
                     focus:outline-none focus:ring-1 focus:ring-[var(--text)]/40 transition-shadow"
            >
              <option value="latency">Latency ms</option>
              <option value="download">Download Mbps</option>
              <option value="upload">Upload Mbps</option>
            </select>
          </div>

          <!-- Condition -->
          <div>
            <label class="block text-[10px] text-[var(--dim)] uppercase tracking-wider mb-1.5" for="alert-condition">
              Condition
            </label>
            <select
              id="alert-condition"
              bind:value={condition}
              class="w-full h-9 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]
                     focus:outline-none focus:ring-1 focus:ring-[var(--text)]/40 transition-shadow"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>

          <!-- Threshold -->
          <div>
            <label class="block text-[10px] text-[var(--dim)] uppercase tracking-wider mb-1.5" for="alert-threshold">
              Threshold
            </label>
            <Input
              id="alert-threshold"
              type="number"
              placeholder="e.g. 100"
              bind:value={threshold}
              class="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--dim)] h-9"
            />
          </div>

          <!-- Webhook -->
          <div>
            <label class="block text-[10px] text-[var(--dim)] uppercase tracking-wider mb-1.5" for="alert-webhook">
              Webhook URL <span class="normal-case text-[var(--dim)]">(optional)</span>
            </label>
            <Input
              id="alert-webhook"
              type="text"
              placeholder="https://..."
              bind:value={webhookUrl}
              class="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--dim)] h-9"
            />
          </div>
        </div>

        <Button
          onclick={handleAddRule}
          disabled={adding || !threshold}
          class="bg-[var(--text)] text-[var(--bg)] hover:opacity-90 text-xs font-medium h-8 px-4 gap-2"
        >
          <Plus size={13} />
          {adding ? 'Adding...' : 'Add Rule'}
        </Button>
      </CardContent>
    </Card>
  </div>

  <!-- Rules Table -->
  <div>
    <div class="flex items-center gap-3 mb-3">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-[var(--dim)]">Active Rules</h2>
      {#if $alertRules.length > 0}
        <Badge variant="outline" class="text-[10px] px-2 py-0 border-[var(--border)] text-[var(--dim)]">
          {$alertRules.length}
        </Badge>
      {/if}
    </div>
    <Card class="bg-[var(--surface)] border-[var(--border)]">
      <CardContent class="px-0 pb-0 pt-0">
        <Table.Root>
          <Table.Header>
            <Table.Row class="border-[var(--border)] hover:bg-transparent">
              <Table.Head class="text-[var(--dim)] pl-4">Metric</Table.Head>
              <Table.Head class="text-[var(--dim)]">Condition</Table.Head>
              <Table.Head class="text-[var(--dim)]">Threshold</Table.Head>
              <Table.Head class="text-[var(--dim)]">Webhook</Table.Head>
              <Table.Head class="text-[var(--dim)]">Enabled</Table.Head>
              <Table.Head class="text-[var(--dim)] pr-4 text-right">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#if $alertRules.length === 0}
              <Table.Row class="border-[var(--border)]">
                <Table.Cell colspan={6} class="text-center py-8 text-xs text-[var(--dim)]">
                  No alert rules configured
                </Table.Cell>
              </Table.Row>
            {:else}
              {#each $alertRules as rule (rule.id)}
                <Table.Row class="border-[var(--border)] hover:bg-[var(--surface2,var(--surface))]">
                  <Table.Cell class="pl-4">
                    <Badge variant="outline" class="text-[10px] px-2 py-0 border-[var(--border)] text-[var(--text)]">
                      {METRIC_LABELS[rule.metric] ?? rule.metric}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell class="text-xs text-[var(--dim)]">
                    {CONDITION_LABELS[rule.condition] ?? rule.condition}
                  </Table.Cell>
                  <Table.Cell class="text-xs font-mono text-[var(--text)]">
                    {rule.threshold}
                  </Table.Cell>
                  <Table.Cell class="text-xs text-[var(--dim)] max-w-[180px] truncate">
                    {#if rule.webhookUrl}
                      <span class="font-mono text-[10px]" title={rule.webhookUrl}>{rule.webhookUrl}</span>
                    {:else}
                      —
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
                      onclick={() => handleDelete(rule.id)}
                      class="h-7 w-7 p-0 text-[var(--dim)] hover:text-red-400 hover:bg-red-950/30"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </Table.Cell>
                </Table.Row>
              {/each}
            {/if}
          </Table.Body>
        </Table.Root>
      </CardContent>
    </Card>
  </div>

  <!-- Alert Log -->
  <div>
    <div class="flex items-center gap-3 mb-3">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-[var(--dim)]">Alert Log</h2>
      {#if mergedLog.length > 0}
        <Badge variant="outline" class="text-[10px] px-2 py-0 border-[var(--border)] text-[var(--dim)]">
          {mergedLog.length}
        </Badge>
      {/if}
    </div>
    <Card class="bg-[var(--surface)] border-[var(--border)]">
      <CardContent class="px-4 py-4">
        {#if mergedLog.length === 0}
          <div class="flex flex-col items-center gap-3 py-8 text-[var(--dim)]">
            <Bell size={20} class="opacity-40" />
            <span class="text-xs">No alert events yet</span>
          </div>
        {:else}
          <div class="space-y-0 divide-y divide-[var(--border)]">
            {#each mergedLog as event (event.timestamp + (event.rule?.id ?? ''))}
              <div class="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div class="mt-1 shrink-0">
                  <span class="block w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_5px_theme(colors.yellow.400)]"></span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-[var(--text)] leading-relaxed">{event.message}</p>
                  <p class="text-[10px] text-[var(--dim)] mt-0.5">{formatTs(event.timestamp)}</p>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  </div>
</div>
