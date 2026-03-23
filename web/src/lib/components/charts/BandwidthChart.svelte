<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { BandwidthPoint } from '$lib/types';

  declare const Chart: any;

  interface Props {
    data: BandwidthPoint[];
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
            label: 'Download',
            data: [],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            pointRadius: 0,
            tension: 0.3,
            borderWidth: 1.5,
          },
          {
            label: 'Upload',
            data: [],
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
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
              color: '#71717a',
              boxWidth: 12,
              boxHeight: 2,
              padding: 16,
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: '#18181b',
            borderColor: '#27272a',
            borderWidth: 1,
            titleColor: '#fafafa',
            bodyColor: '#a1a1aa',
            padding: 8,
            titleFont: { size: 11 },
            bodyFont: { size: 11 },
            callbacks: {
              label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} Mbps`,
            },
          },
        },
        scales: {
          x: {
            type: 'time',
            grid: { color: '#1a1a1f' },
            ticks: { color: '#52525b', font: { size: 10 }, maxTicksLimit: 8 },
            border: { color: '#27272a' },
          },
          y: {
            grid: { color: '#1a1a1f' },
            ticks: {
              color: '#52525b',
              font: { size: 10 },
              callback: (v: number) => `${v} Mbps`,
            },
            border: { color: '#27272a' },
            beginAtZero: true,
          },
        },
      },
    });
  }

  function updateChart(points: BandwidthPoint[]) {
    if (!chart) return;
    chart.data.datasets[0].data = points.map((p) => ({ x: p.timestamp, y: p.downloadMbps }));
    chart.data.datasets[1].data = points.map((p) => ({ x: p.timestamp, y: p.uploadMbps }));
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
