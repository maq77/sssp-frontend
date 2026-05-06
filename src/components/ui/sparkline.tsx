import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  showTooltip?: boolean;
  className?: string;
  strokeWidth?: number;
}

export function Sparkline({
  data,
  color = "#60a5fa",
  height = 32,
  showTooltip = false,
  className,
  strokeWidth = 1.5,
}: SparklineProps) {
  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={strokeWidth}
            dot={false}
            isAnimationActive={false}
          />
          {showTooltip && (
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                return (
                  <div className="glass rounded-lg px-2 py-1 text-xs font-mono text-foreground">
                    {payload[0].value}
                  </div>
                );
              }}
              cursor={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
