<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { BandwidthPoint } from '$lib/types';
  import { chartTheme } from '$lib/config/chartTheme';

  declare const Chart: any;

  interface Props {
    data: BandwidthPoint[];
  }

  let { data }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: any = null;

  // Downsample data for performance and readability
  function downsample(points: BandwidthPoint[], maxPoints = 120): BandwidthPoint[] {
    if (points.length <= maxPoints) return points;
    const step = Math.ceil(points.length / maxPoints);
    const result: BandwidthPoint[] = [];
    for (let i = 0; i < points.length; i += step) {
      // Take the max value in each bucket (LTTB-like)
      const bucket = points.slice(i, i + step);
      const maxDl = bucket.reduce((a, b) => a.downloadMbps > b.downloadMbps ? a : b);
      result.push(maxDl);
    }
    return result;
  }

  function createChart() {
    if (!canvas || typeof Chart === 'undefined') return;

    // Crosshair plugin
    const crosshairPlugin = {
      id: 'crosshair',
      afterDraw(chart: any) {
        if (chart.tooltip?._active?.length) {
          const x = chart.tooltip._active[0].element.x;
          const yAxis = chart.scales.y;
          const ctx = chart.ctx;
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([3, 3]);
          ctx.moveTo(x, yAxis.top);
          ctx.lineTo(x, yAxis.bottom);
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.stroke();
          ctx.restore();
        }
      }
    };

    chart = new Chart(canvas, {
      type: 'line',
      plugins: [crosshairPlugin],
      data: {
        datasets: [
          {
            label: 'Download',
            data: [],
            borderColor: chartTheme.download,
            backgroundColor: createGradient(canvas, chartTheme.download),
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: chartTheme.download,
            pointHoverBorderColor: chartTheme.tooltip.bg,
            pointHoverBorderWidth: 2,
            tension: 0.4,
            borderWidth: 1.5,
          },
          {
            label: 'Upload',
            data: [],
            borderColor: chartTheme.upload,
            backgroundColor: createGradient(canvas, chartTheme.upload),
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: chartTheme.upload,
            pointHoverBorderColor: chartTheme.tooltip.bg,
            pointHoverBorderWidth: 2,
            tension: 0.4,
            borderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        layout: {
          padding: { left: 0, right: 8, top: 4, bottom: 0 },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: chartTheme.tooltip.bg,
            borderColor: chartTheme.tooltip.border,
            borderWidth: 1,
            titleColor: 'rgba(255,255,255,0.5)',
            bodyColor: chartTheme.tooltip.text,
            padding: { top: 8, bottom: 8, left: 12, right: 12 },
            cornerRadius: 8,
            titleFont: { size: 10, family: 'Geist Mono, monospace' },
            bodyFont: { size: 11, family: 'Inter', weight: '500' },
            bodySpacing: 4,
            displayColors: true,
            boxWidth: 6,
            boxHeight: 6,
            boxPadding: 4,
            callbacks: {
              title: (items: any[]) => {
                if (!items.length) return '';
                return new Date(items[0].parsed.x).toLocaleTimeString();
              },
              label: (ctx: any) => ` ${ctx.dataset.label}  ${ctx.parsed.y.toFixed(1)} Mbps`,
            },
          },
        },
        scales: {
          x: {
            type: 'time',
            time: { unit: 'minute', displayFormats: { minute: 'HH:mm' } },
            grid: { color: chartTheme.grid, drawTicks: false },
            ticks: {
              color: chartTheme.tick,
              font: { size: 9, family: 'Geist Mono, monospace' },
              maxTicksLimit: 6,
              padding: 8,
            },
            border: { display: false },
          },
          y: {
            grid: { color: chartTheme.grid, drawTicks: false },
            ticks: {
              color: chartTheme.tick,
              font: { size: 9, family: 'Geist Mono, monospace' },
              padding: 8,
              maxTicksLimit: 5,
              callback: (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}G` : `${v}`,
            },
            border: { display: false },
            beginAtZero: true,
          },
        },
      },
    });
  }

  function createGradient(canvas: HTMLCanvasElement, color: string) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return `${color}15`;
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.parentElement?.clientHeight ?? 300);
    gradient.addColorStop(0, `${color}20`);
    gradient.addColorStop(0.7, `${color}05`);
    gradient.addColorStop(1, `${color}00`);
    return gradient;
  }

  function updateChart(points: BandwidthPoint[]) {
    if (!chart) return;
    const sampled = downsample(points);
    chart.data.datasets[0].data = sampled.map((p) => ({ x: p.timestamp, y: p.downloadMbps }));
    chart.data.datasets[1].data = sampled.map((p) => ({ x: p.timestamp, y: p.uploadMbps }));
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

<div class="w-full h-full">
  <canvas bind:this={canvas}></canvas>
</div>
