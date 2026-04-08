"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Area,
  AreaChart
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { MetricDataPoint } from "@/types";

interface MetricChartProps {
  title: string;
  data: MetricDataPoint[];
  color?: string;
  unit?: string;
  type?: "line" | "area";
}

export function MetricChart({ 
  title, 
  data, 
  color = "#06b6d4",
  unit = "%",
  type = "area"
}: MetricChartProps) {
  const [chartSize, setChartSize] = useState({ width: 0, height: 200 });
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth;
      if (width > 0) {
        setChartSize({ width, height: 200 });
      }
    }
  }, []);

  useEffect(() => {
    // Initial size calculation with delay to ensure DOM is ready
    const initialTimer = setTimeout(updateSize, 50);
    const secondTimer = setTimeout(updateSize, 200);
    
    // Listen for resize events
    window.addEventListener('resize', updateSize);
    
    // Use ResizeObserver for more reliable size updates
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(secondTimer);
      window.removeEventListener('resize', updateSize);
      resizeObserver.disconnect();
    };
  }, [updateSize]);

  const chartData = data.map((point) => ({
    time: format(new Date(point.timestamp), "HH:mm"),
    value: point.value,
    fullTime: format(new Date(point.timestamp), "HH:mm:ss"),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-lg">
          <p className="text-xs text-zinc-400">{payload[0]?.payload?.fullTime}</p>
          <p className="text-lg font-bold text-white">
            {payload[0]?.value?.toFixed(2)}{unit}
          </p>
        </div>
      );
    }
    return null;
  };

  // Only render chart when we have valid dimensions
  const canRenderChart = chartSize.width > 50 && chartData.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef} 
          className="w-full" 
          style={{ height: '200px', minWidth: '100px' }}
        >
          {canRenderChart ? (
            type === "area" ? (
              <AreaChart 
                width={chartSize.width} 
                height={chartSize.height} 
                data={chartData} 
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis 
                  dataKey="time" 
                  stroke="#71717a" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}${unit}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#gradient-${title.replace(/\s+/g, '-')})`}
                />
              </AreaChart>
            ) : (
              <LineChart 
                width={chartSize.width} 
                height={chartSize.height} 
                data={chartData} 
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis 
                  dataKey="time" 
                  stroke="#71717a" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            )
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500">
              {chartData.length === 0 ? "No data available" : "Loading chart..."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
