import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, HistogramData } from 'lightweight-charts';
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
  kLine: '#eab308',     // K line yellow
  dLine: '#0ea5e9',     // D line blue
  jLine: '#a855f7',     // J line purple
  rsi13: '#f97316',     // RSI(13) orange - 4h level
  rsi42: '#06b6d4',     // RSI(42) cyan - daily level
};

interface KlineChartProps {
  klines: Kline[];
  showMA: boolean;
  showVOL?: boolean;
  showBB: boolean;
  showMACD?: boolean;
  showRSI?: boolean;
  showKDJ?: boolean;
  showWR?: boolean;
}

const createSubChart = (container: HTMLDivElement, height: number) => {
  return createChart(container, {
    height,
    layout: {
      background: { color: 'transparent' },
      textColor: COLORS.text,
      fontFamily: 'JetBrains Mono, monospace',
    },
    grid: {
      vertLines: { color: COLORS.grid },
      horzLines: { color: COLORS.grid },
    },
    rightPriceScale: {
      borderColor: COLORS.border,
    },
    timeScale: {
      borderColor: COLORS.border,
      timeVisible: true,
      secondsVisible: false,
      visible: false,
    },
    handleScale: {
      axisPressedMouseMove: true,
    },
    handleScroll: {
      vertTouchDrag: false,
    },
  });
};

// Store series refs for proper cleanup
interface SubChartSeries {
  series: ISeriesApi<any>[];
}

export function KlineChart({ klines, showMA, showVOL = false, showBB, showMACD = false, showRSI = false, showKDJ = false, showWR = false }: KlineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const volContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const kdjContainerRef = useRef<HTMLDivElement>(null);
  const wrContainerRef = useRef<HTMLDivElement>(null);
  
  const chartRef = useRef<IChartApi | null>(null);
  const volChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const kdjChartRef = useRef<IChartApi | null>(null);
  const wrChartRef = useRef<IChartApi | null>(null);
  
  // Series refs for cleanup
  const volSeriesRef = useRef<SubChartSeries>({ series: [] });
  const macdSeriesRef = useRef<SubChartSeries>({ series: [] });
  const rsiSeriesRef = useRef<SubChartSeries>({ series: [] });
  const kdjSeriesRef = useRef<SubChartSeries>({ series: [] });
  const wrSeriesRef = useRef<SubChartSeries>({ series: [] });
  
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const maSeriesRefs = useRef<ISeriesApi<'Line'>[]>([]);
  const bbSeriesRefs = useRef<ISeriesApi<'Line'>[]>([]);

  // Fixed heights - no compression, use scrolling instead
  const mainChartHeight = 350;
  const subChartHeight = 100; // Fixed height for each sub-chart

  useEffect(() => {
    if (!mainContainerRef.current) return;

    const chart = createChart(mainContainerRef.current, {
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
        vertLine: { color: COLORS.accent, width: 1, style: 2 },
        horzLine: { color: COLORS.accent, width: 1, style: 2 },
      },
      rightPriceScale: { borderColor: COLORS.border },
      timeScale: { borderColor: COLORS.border, timeVisible: true, secondsVisible: false },
      handleScale: { axisPressedMouseMove: true },
      handleScroll: { vertTouchDrag: false },
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
      if (mainContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: mainContainerRef.current.clientWidth,
          height: mainChartHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [mainChartHeight]);

  // VOL sub-chart
  useEffect(() => {
    if (!showVOL || !volContainerRef.current) {
      if (volChartRef.current) {
        volChartRef.current.remove();
        volChartRef.current = null;
      }
      return;
    }

    const chart = createSubChart(volContainerRef.current, subChartHeight);
    volChartRef.current = chart;

    return () => {
      chart.remove();
      volChartRef.current = null;
    };
  }, [showVOL, subChartHeight]);

  // MACD sub-chart
  useEffect(() => {
    if (!showMACD || !macdContainerRef.current) {
      if (macdChartRef.current) {
        macdChartRef.current.remove();
        macdChartRef.current = null;
      }
      return;
    }

    const chart = createSubChart(macdContainerRef.current, subChartHeight);
    macdChartRef.current = chart;

    return () => {
      chart.remove();
      macdChartRef.current = null;
    };
  }, [showMACD, subChartHeight]);

  // RSI sub-chart
  useEffect(() => {
    if (!showRSI || !rsiContainerRef.current) {
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
      return;
    }

    const chart = createSubChart(rsiContainerRef.current, subChartHeight);
    rsiChartRef.current = chart;

    return () => {
      chart.remove();
      rsiChartRef.current = null;
    };
  }, [showRSI, subChartHeight]);

  // KDJ sub-chart
  useEffect(() => {
    if (!showKDJ || !kdjContainerRef.current) {
      if (kdjChartRef.current) {
        kdjChartRef.current.remove();
        kdjChartRef.current = null;
      }
      return;
    }

    const chart = createSubChart(kdjContainerRef.current, subChartHeight);
    kdjChartRef.current = chart;

    return () => {
      chart.remove();
      kdjChartRef.current = null;
    };
  }, [showKDJ, subChartHeight]);

  // W%R sub-chart
  useEffect(() => {
    if (!showWR || !wrContainerRef.current) {
      if (wrChartRef.current) {
        wrChartRef.current.remove();
        wrChartRef.current = null;
      }
      return;
    }

    const chart = createSubChart(wrContainerRef.current, subChartHeight);
    wrChartRef.current = chart;

    return () => {
      chart.remove();
      wrChartRef.current = null;
    };
  }, [showWR, subChartHeight]);

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
        const series = chart.addLineSeries({
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
        const series = chart.addLineSeries({
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

    // VOL data
    if (showVOL && volChartRef.current) {
      const volChart = volChartRef.current;
      
      // Clear previous series
      volSeriesRef.current.series.forEach(s => {
        try { volChart.removeSeries(s); } catch (e) { /* ignore */ }
      });
      volSeriesRef.current.series = [];
      
      const volSeries = volChart.addHistogramSeries({
        priceLineVisible: false,
        lastValueVisible: false,
      });

      const volData: HistogramData[] = klines.map((k, i) => {
        const prevClose = i > 0 ? klines[i - 1].close : k.open;
        const isUp = k.close >= prevClose;
        return {
          time: k.time as any,
          value: k.volume,
          color: isUp ? COLORS.bull : COLORS.bear,
        };
      });

      volSeries.setData(volData);
      volSeriesRef.current.series.push(volSeries);
      volChart.timeScale().fitContent();
    }

    // MACD data
    if (showMACD && macdChartRef.current) {
      const macdChart = macdChartRef.current;
      
      // Clear previous series
      macdSeriesRef.current.series.forEach(s => {
        try { macdChart.removeSeries(s); } catch (e) { /* ignore */ }
      });
      macdSeriesRef.current.series = [];
      
      const histogramSeries = macdChart.addHistogramSeries({
        priceLineVisible: false,
        lastValueVisible: false,
      });

      const histogramData: HistogramData[] = klines
        .map((k, i) => {
          const val = indicators.macd[i]?.histogram;
          return {
            time: k.time as any,
            value: val ?? 0,
            color: (val ?? 0) >= 0 ? COLORS.bull : COLORS.bear,
          };
        })
        .filter((d) => d.value !== 0);

      histogramSeries.setData(histogramData);

      const macdLineSeries = macdChart.addLineSeries({
        color: COLORS.ma7,
        lineWidth: 1,
        title: 'DIF',
        priceLineVisible: false,
        lastValueVisible: false,
      });

      const macdLineData: LineData[] = klines
        .map((k, i) => ({ time: k.time as any, value: indicators.macd[i]?.macd }))
        .filter((d) => d.value !== null) as LineData[];

      macdLineSeries.setData(macdLineData);

      const signalSeries = macdChart.addLineSeries({
        color: COLORS.ma50,
        lineWidth: 1,
        title: 'DEA',
        priceLineVisible: false,
        lastValueVisible: false,
      });

      const signalData: LineData[] = klines
        .map((k, i) => ({ time: k.time as any, value: indicators.macd[i]?.signal }))
        .filter((d) => d.value !== null) as LineData[];

      signalSeries.setData(signalData);
      macdSeriesRef.current.series.push(histogramSeries, macdLineSeries, signalSeries);
      macdChart.timeScale().fitContent();
    }

    // RSI data - dual RSI (13 and 42)
    if (showRSI && rsiChartRef.current) {
      const rsiChart = rsiChartRef.current;
      
      // Clear previous series
      rsiSeriesRef.current.series.forEach(s => {
        try { rsiChart.removeSeries(s); } catch (e) { /* ignore */ }
      });
      rsiSeriesRef.current.series = [];
      
      // RSI(13) - 4h level
      const rsi13Series = rsiChart.addLineSeries({
        color: COLORS.rsi13,
        lineWidth: 1,
        title: 'RSI(13)',
        priceLineVisible: false,
        lastValueVisible: false,
      });

      const rsi13Data: LineData[] = klines
        .map((k, i) => ({ time: k.time as any, value: indicators.rsi13[i] }))
        .filter((d) => d.value !== null) as LineData[];

      rsi13Series.setData(rsi13Data);

      // RSI(42) - daily level
      const rsi42Series = rsiChart.addLineSeries({
        color: COLORS.rsi42,
        lineWidth: 1,
        title: 'RSI(42)',
        priceLineVisible: false,
        lastValueVisible: false,
      });

      const rsi42Data: LineData[] = klines
        .map((k, i) => ({ time: k.time as any, value: indicators.rsi42[i] }))
        .filter((d) => d.value !== null) as LineData[];

      rsi42Series.setData(rsi42Data);
      rsiSeriesRef.current.series.push(rsi13Series, rsi42Series);

      rsiChart.timeScale().fitContent();
    }

    // KDJ data
    if (showKDJ && kdjChartRef.current) {
      const kdjChart = kdjChartRef.current;
      
      // Clear previous series
      kdjSeriesRef.current.series.forEach(s => {
        try { kdjChart.removeSeries(s); } catch (e) { /* ignore */ }
      });
      kdjSeriesRef.current.series = [];
      
      const kSeries = kdjChart.addLineSeries({
        color: COLORS.kLine,
        lineWidth: 1,
        title: 'K',
        priceLineVisible: false,
        lastValueVisible: false,
      });

      const dSeries = kdjChart.addLineSeries({
        color: COLORS.dLine,
        lineWidth: 1,
        title: 'D',
        priceLineVisible: false,
        lastValueVisible: false,
      });

      const jSeries = kdjChart.addLineSeries({
        color: COLORS.jLine,
        lineWidth: 1,
        title: 'J',
        priceLineVisible: false,
        lastValueVisible: false,
      });

      const kData: LineData[] = klines
        .map((k, i) => ({ time: k.time as any, value: indicators.kdj[i]?.k }))
        .filter((d) => d.value !== null) as LineData[];

      const dData: LineData[] = klines
        .map((k, i) => ({ time: k.time as any, value: indicators.kdj[i]?.d }))
        .filter((d) => d.value !== null) as LineData[];

      const jData: LineData[] = klines
        .map((k, i) => ({ time: k.time as any, value: indicators.kdj[i]?.j }))
        .filter((d) => d.value !== null) as LineData[];

      kSeries.setData(kData);
      dSeries.setData(dData);
      jSeries.setData(jData);
      kdjSeriesRef.current.series.push(kSeries, dSeries, jSeries);
      kdjChart.timeScale().fitContent();
    }

    // W%R data
    if (showWR && wrChartRef.current) {
      const wrChart = wrChartRef.current;
      
      // Clear previous series
      wrSeriesRef.current.series.forEach(s => {
        try { wrChart.removeSeries(s); } catch (e) { /* ignore */ }
      });
      wrSeriesRef.current.series = [];
      
      const wrSeries = wrChart.addLineSeries({
        color: COLORS.ma7,
        lineWidth: 1,
        title: 'W%R',
        priceLineVisible: false,
        lastValueVisible: false,
      });

      const wrData: LineData[] = klines
        .map((k, i) => ({ time: k.time as any, value: indicators.williamsR[i] }))
        .filter((d) => d.value !== null) as LineData[];

      wrSeries.setData(wrData);
      wrSeriesRef.current.series.push(wrSeries);
      wrChart.timeScale().fitContent();
    }

    chart.timeScale().fitContent();
  }, [klines, showMA, showVOL, showBB, showMACD, showRSI, showKDJ, showWR]);

  return (
    <div ref={containerRef} className="chart-container w-full h-full overflow-y-auto scrollbar-custom">
      <div className="min-h-full">
        <div ref={mainContainerRef} className="w-full" style={{ height: mainChartHeight }} />
        {showVOL && (
          <div className="border-t border-border/50">
            <div className="text-[10px] text-muted-foreground px-2 py-1">VOL</div>
            <div ref={volContainerRef} className="w-full" style={{ height: subChartHeight }} />
          </div>
        )}
        {showMACD && (
          <div className="border-t border-border/50">
            <div className="text-[10px] text-muted-foreground px-2 py-1">MACD</div>
            <div ref={macdContainerRef} className="w-full" style={{ height: subChartHeight }} />
          </div>
        )}
        {showRSI && (
          <div className="border-t border-border/50">
            <div className="text-[10px] text-muted-foreground px-2 py-1">RSI (13/42)</div>
            <div ref={rsiContainerRef} className="w-full" style={{ height: subChartHeight }} />
          </div>
        )}
        {showKDJ && (
          <div className="border-t border-border/50">
            <div className="text-[10px] text-muted-foreground px-2 py-1">KDJ</div>
            <div ref={kdjContainerRef} className="w-full" style={{ height: subChartHeight }} />
          </div>
        )}
        {showWR && (
          <div className="border-t border-border/50">
            <div className="text-[10px] text-muted-foreground px-2 py-1">W%R (14)</div>
            <div ref={wrContainerRef} className="w-full" style={{ height: subChartHeight }} />
          </div>
        )}
      </div>
    </div>
  );
}
