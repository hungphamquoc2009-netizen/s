"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const chartData = [
  { month: "Jan", balance: 80000000, expected: 82000000 },
  { month: "Feb", balance: 92000000, expected: 90000000 },
  { month: "Mar", balance: 105000000, expected: 100000000 },
  { month: "Apr", balance: 115000000, expected: 112000000 },
  { month: "May", balance: 130000000, expected: 125000000 },
  { month: "Jun", balance: 142000000, expected: 140000000 },
  { month: "Jul", balance: 157000000, expected: 155000000 },
]

const chartConfig = {
  balance: {
    label: "Balance Growth",
    color: "var(--chart-1)",
  },
  expected: {
    label: "Expected Returns",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function BalanceChart() {
  const formatVND = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(0) + "M"
    }
    return value.toString()
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Balance Growth</CardTitle>
            <CardDescription>Track your investment performance over time</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-chart-1" />
              <span className="text-muted-foreground">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-chart-2" />
              <span className="text-muted-foreground">Expected</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-[16/9] w-full sm:aspect-[2/1]">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 0,
              right: 12,
              top: 12,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatVND}
              className="text-xs text-muted-foreground"
              width={50}
            />
            <ChartTooltip 
              cursor={false} 
              content={
                <ChartTooltipContent 
                  formatter={(value) => new Intl.NumberFormat('vi-VN').format(Number(value)) + ' VNĐ'}
                />
              } 
            />
            <defs>
              <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillExpected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-expected)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-expected)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area
              dataKey="expected"
              type="monotone"
              fill="url(#fillExpected)"
              fillOpacity={1}
              stroke="var(--color-expected)"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <Area
              dataKey="balance"
              type="monotone"
              fill="url(#fillBalance)"
              fillOpacity={1}
              stroke="var(--color-balance)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
