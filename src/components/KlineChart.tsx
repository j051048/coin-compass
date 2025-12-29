import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts';
import { Kline } from '@/types/trading';
import { getIndicatorSeries } from '@/lib/indicators';

// Colors in hex format (lightweight-charts doesn't support HSL)
const COLORS = {
  bull: '#22c55e',      // green
  bear: '#ef4444',      // red
  grid: '#1e293b',      // slate
  text: '#64748b',      // muted
  accent: '#eab308',    // yellow/gold
  border: '#334155',
  ma7: '#0ea5e9',       // sky blue
  ma21: '#a855f7',      // purple
  ma50: '#eab308',      // yellow
};

interface KlineChartProps {
  klines: Kline[];
  showMA: boolean;
  showBB: boolean;
}

export function KlineChart({ klines, showMA, showBB }: KlineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const maSeriesRefs = useRef<ISeriesApi<'Line'>[]>([]);
  const bbSeriesRefs = useRef<ISeriesApi<'Line'>[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: COLORS.text,
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { color: COLORS.grid },
        horzLines: { color: COLORS.grid },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: COLORS.accent,
          width: 1,
          style: 2,
        },
        horzLine: {
          color: COLORS.accent,
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: COLORS.border,
      },
      timeScale: {
        borderColor: COLORS.border,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: COLORS.bull,
      downColor: COLORS.bear,
      borderUpColor: COLORS.bull,
      borderDownColor: COLORS.bear,
      wickUpColor: COLORS.bull,
      wickDownColor: COLORS.bear,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    
    if (!chart || !candleSeries || klines.length === 0) return;

    const candleData: CandlestickData[] = klines.map((k) => ({
      time: k.time as any,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }));

    candleSeries.setData(candleData);

    // Clear existing indicator series safely
    maSeriesRefs.current.forEach((s) => {
      try { chart.removeSeries(s); } catch (e) { /* series already removed */ }
    });
    bbSeriesRefs.current.forEach((s) => {
      try { chart.removeSeries(s); } catch (e) { /* series already removed */ }
    });
    maSeriesRefs.current = [];
    bbSeriesRefs.current = [];

    const indicators = getIndicatorSeries(klines);

    if (showMA) {
      const maConfigs = [
        { data: indicators.ma7, color: COLORS.ma7, title: 'MA7' },
        { data: indicators.ma21, color: COLORS.ma21, title: 'MA21' },
        { data: indicators.ma50, color: COLORS.ma50, title: 'MA50' },
      ];

      maConfigs.forEach(({ data, color, title }) => {
        const series = chartRef.current!.addLineSeries({
          color,
          lineWidth: 1,
          title,
          priceLineVisible: false,
          lastValueVisible: false,
        });

        const lineData: LineData[] = klines
          .map((k, i) => ({
            time: k.time as any,
            value: data[i],
          }))
          .filter((d) => d.value !== null) as LineData[];

        series.setData(lineData);
        maSeriesRefs.current.push(series);
      });
    }

    if (showBB) {
      const bbConfigs = [
        { key: 'upper' as const, color: COLORS.ma21, title: 'BB上轨' },
        { key: 'middle' as const, color: COLORS.ma50, title: 'BB中轨' },
        { key: 'lower' as const, color: COLORS.ma21, title: 'BB下轨' },
      ];

      bbConfigs.forEach(({ key, color, title }) => {
        const series = chartRef.current!.addLineSeries({
          color,
          lineWidth: 1,
          lineStyle: key === 'middle' ? 0 : 2,
          title,
          priceLineVisible: false,
          lastValueVisible: false,
        });

        const lineData: LineData[] = klines
          .map((k, i) => ({
            time: k.time as any,
            value: indicators.bollingerBands[i]?.[key],
          }))
          .filter((d) => d.value !== null) as LineData[];

        series.setData(lineData);
        bbSeriesRefs.current.push(series);
      });
    }

    chartRef.current.timeScale().fitContent();
  }, [klines, showMA, showBB]);

  return (
    <div className="chart-container w-full h-full min-h-[400px]">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
