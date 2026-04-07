"use client";

import { useEffect, useState, useRef } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
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
  const [mounted, setMounted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    // Get container dimensions after mount
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setDimensions({ width: offsetWidth, height: offsetHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    // Small delay to ensure container is properly sized
    const timeout = setTimeout(updateDimensions, 100);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timeout);
    };
  }, []);

  const chartData = data.map((point) => ({
    time: format(new Date(point.timestamp), "HH:mm"),
    value: point.value,
    fullTime: format(new Date(point.timestamp), "HH:mm:ss"),
  }));

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-zinc-500">
            Loading chart...
          </div>
        </CardContent>
      </Card>
    );
  }

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

  // Don't render chart if no data or dimensions not ready
  const hasValidDimensions = dimensions.width > 0;
  const hasData = chartData.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="h-[200px] w-full" style={{ minHeight: '200px', minWidth: '100px' }}>
          {hasValidDimensions && hasData ? (
            <ResponsiveContainer width="100%" height={200}>
              {type === "area" ? (
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500">
              {!hasData ? "No data available" : "Loading..."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
