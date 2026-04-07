"use client"

import { ArrowDownLeft, ArrowUpRight, Bot, Gift, Sparkles, Clock, TrendingUp, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const transactions = [
  {
    id: 1,
    type: "deposit",
    amount: 10000000,
    date: "Today, 10:30 AM",
    status: "completed",
  },
  {
    id: 2,
    type: "profit",
    amount: 1250000,
    date: "Yesterday, 6:00 PM",
    status: "completed",
  },
  {
    id: 3,
    type: "withdraw",
    amount: 5000000,
    date: "Mar 28, 2:15 PM",
    status: "completed",
  },
  {
    id: 4,
    type: "deposit",
    amount: 25000000,
    date: "Mar 25, 11:00 AM",
    status: "completed",
  },
]

const notifications = [
  {
    id: 1,
    type: "welcome",
    icon: Gift,
    title: "Welcome Bonus",
    message: "Account Created - 30,000 VNĐ Welcome Bonus Added!",
    time: "Just now",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    id: 2,
    type: "ai",
    icon: Bot,
    title: "AI Recommendation",
    message: "Based on current market trends, the Advanced package offers the best risk-adjusted returns for your profile.",
    time: "2 hours ago",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: 3,
    type: "alert",
    icon: AlertCircle,
    title: "Investment Maturing",
    message: "Your Stable Income investment will mature in 28 days. Consider reinvesting for continued growth.",
    time: "5 hours ago",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
]

export function SidebarPanel() {
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ'
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-accent" />
      case "withdraw":
        return <ArrowUpRight className="h-4 w-4 text-destructive" />
      case "profit":
        return <TrendingUp className="h-4 w-4 text-accent" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "deposit":
      case "profit":
        return "text-accent"
      case "withdraw":
        return "text-foreground"
      default:
        return "text-foreground"
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Card */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 shadow-lg">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-card/80 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <Bot className="mt-0.5 h-5 w-5 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Market Analysis</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Current market conditions favor medium-term investments. We recommend the <span className="font-semibold text-primary">Advanced package</span> for optimal returns with balanced risk.
                </p>
              </div>
            </div>
          </div>
          <Button className="w-full gap-2" size="sm">
            <TrendingUp className="h-4 w-4" />
            View Full Analysis
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Notifications</CardTitle>
            <Badge variant="secondary" className="text-xs">3 new</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="group rounded-xl border border-border/50 bg-muted/30 p-3 transition-all hover:border-border hover:bg-muted/50"
                >
                  <div className="flex gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${notification.bgColor}`}>
                      <notification.icon className={`h-4 w-4 ${notification.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{notification.title}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-primary">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize text-foreground">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${getTransactionColor(tx.type)}`}>
                  {tx.type === "withdraw" ? "-" : "+"}{formatVND(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
