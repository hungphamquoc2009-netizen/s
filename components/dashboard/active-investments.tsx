"use client"

import { Clock, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const investments = [
  {
    id: 1,
    name: "Premium Growth",
    amount: 50000000,
    returnRate: 15,
    duration: 180,
    daysRemaining: 65,
    status: "active",
  },
  {
    id: 2,
    name: "Stable Income",
    amount: 30000000,
    returnRate: 8,
    duration: 90,
    daysRemaining: 28,
    status: "active",
  },
  {
    id: 3,
    name: "VIP Elite",
    amount: 100000000,
    returnRate: 22,
    duration: 365,
    daysRemaining: 240,
    status: "active",
  },
]

export function ActiveInvestments() {
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ'
  }

  const getProgress = (duration: number, remaining: number) => {
    return ((duration - remaining) / duration) * 100
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Active Investments</CardTitle>
        <CardDescription>Your current investment packages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {investments.map((investment) => (
          <div
            key={investment.id}
            className="group relative rounded-xl border border-border/50 bg-muted/30 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-muted/50 hover:shadow-md"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">{investment.name}</h4>
                  <Badge 
                    variant="secondary" 
                    className="bg-accent/20 text-accent font-semibold"
                  >
                    +{investment.returnRate}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Invested: <span className="font-medium text-foreground">{formatVND(investment.amount)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{investment.daysRemaining} days remaining</span>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">
                  {Math.round(getProgress(investment.duration, investment.daysRemaining))}%
                </span>
              </div>
              <Progress 
                value={getProgress(investment.duration, investment.daysRemaining)} 
                className="h-2 bg-primary/10"
              />
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-sm text-accent">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">
                Expected return: {formatVND(investment.amount * (1 + investment.returnRate / 100))}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
