<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { LatencyPoint } from '$lib/types';
  import { chartTheme } from '$lib/config/chartTheme';

  declare const Chart: any;

  interface Props {
    data: LatencyPoint[];
  }

  let { data }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: any = null;

  function createChart() {
    if (!canvas || typeof Chart === 'undefined') return;

    chart = new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Latency',
            data: [],
            borderColor: chartTheme.latency,
            backgroundColor: `${chartTheme.latency}1a`,
            fill: true,
            pointRadius: 0,
            tension: 0.3,
            borderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: chartTheme.tick,
              boxWidth: 12,
              boxHeight: 2,
              padding: 16,
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: chartTheme.tooltip.bg,
            borderColor: chartTheme.tooltip.border,
            borderWidth: 1,
            titleColor: chartTheme.tooltip.text,
            bodyColor: '#a1a1aa',
            padding: 8,
            titleFont: { size: 11 },
            bodyFont: { size: 11 },
            callbacks: {
              label: (ctx: any) => `Latency: ${ctx.parsed.y.toFixed(1)} ms`,
            },
          },
        },
        scales: {
          x: {
            type: 'time',
            grid: { color: chartTheme.grid },
            ticks: { color: chartTheme.tick, font: { size: 10 }, maxTicksLimit: 8 },
            border: { color: chartTheme.tooltip.border },
          },
          y: {
            grid: { color: chartTheme.grid },
            ticks: {
              color: chartTheme.tick,
              font: { size: 10 },
              callback: (v: number) => `${v} ms`,
            },
            border: { color: chartTheme.tooltip.border },
            beginAtZero: true,
          },
        },
      },
    });
  }

  function updateChart(points: LatencyPoint[]) {
    if (!chart) return;
    const filtered = points.filter((p) => p.ms >= 0);
    chart.data.datasets[0].data = filtered.map((p) => ({ x: p.timestamp, y: p.ms }));
    chart.update('none');
  }

  $effect(() => {
    updateChart(data);
  });

  onMount(() => {
    createChart();
    updateChart(data);
  });

  onDestroy(() => {
    chart?.destroy();
  });
</script>

<div class="w-full h-full min-h-[250px]">
  <canvas bind:this={canvas}></canvas>
</div>
