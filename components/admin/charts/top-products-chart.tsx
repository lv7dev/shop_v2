"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  data: { name: string; sold: number }[];
};

export function TopProductsChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No sales data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 40)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
      >
        <XAxis
          type="number"
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          width={150}
          tickFormatter={(value: string) =>
            value.length > 20 ? value.slice(0, 18) + "..." : value
          }
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: any) => [value, "Units Sold"]) as any}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        <Bar
          dataKey="sold"
          fill="hsl(var(--primary))"
          radius={[0, 4, 4, 0]}
          maxBarSize={30}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
