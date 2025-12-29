import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts';
import { Kline } from '@/types/trading';
import { getIndicatorSeries } from '@/lib/indicators';

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
        textColor: 'hsl(215, 20%, 55%)',
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { color: 'hsl(222, 30%, 15%)' },
        horzLines: { color: 'hsl(222, 30%, 15%)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'hsl(45, 93%, 58%)',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: 'hsl(45, 93%, 58%)',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: 'hsl(222, 30%, 18%)',
      },
      timeScale: {
        borderColor: 'hsl(222, 30%, 18%)',
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
      upColor: 'hsl(142, 76%, 45%)',
      downColor: 'hsl(0, 72%, 51%)',
      borderUpColor: 'hsl(142, 76%, 45%)',
      borderDownColor: 'hsl(0, 72%, 51%)',
      wickUpColor: 'hsl(142, 76%, 45%)',
      wickDownColor: 'hsl(0, 72%, 51%)',
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
    if (!chartRef.current || !candleSeriesRef.current || klines.length === 0) return;

    const candleData: CandlestickData[] = klines.map((k) => ({
      time: k.time as any,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }));

    candleSeriesRef.current.setData(candleData);

    // Clear existing indicator series
    maSeriesRefs.current.forEach((s) => chartRef.current?.removeSeries(s));
    bbSeriesRefs.current.forEach((s) => chartRef.current?.removeSeries(s));
    maSeriesRefs.current = [];
    bbSeriesRefs.current = [];

    const indicators = getIndicatorSeries(klines);

    if (showMA) {
      const maConfigs = [
        { data: indicators.ma7, color: 'hsl(199, 89%, 48%)', title: 'MA7' },
        { data: indicators.ma21, color: 'hsl(280, 87%, 65%)', title: 'MA21' },
        { data: indicators.ma50, color: 'hsl(45, 93%, 58%)', title: 'MA50' },
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
        { key: 'upper' as const, color: 'hsl(280, 87%, 65%)', title: 'BB上轨' },
        { key: 'middle' as const, color: 'hsl(45, 93%, 58%)', title: 'BB中轨' },
        { key: 'lower' as const, color: 'hsl(280, 87%, 65%)', title: 'BB下轨' },
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
