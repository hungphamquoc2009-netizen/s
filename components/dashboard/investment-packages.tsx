"use client"

import { Check, Star, Zap, Crown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const packages = [
  {
    id: 1,
    name: "Basic",
    icon: Zap,
    description: "Perfect for beginners",
    minInvestment: 1000000,
    maxInvestment: 20000000,
    duration: "30-90 days",
    returnRate: "5-8%",
    features: [
      "Low minimum investment",
      "Flexible duration",
      "24/7 support",
      "Weekly reports",
    ],
    popular: false,
    color: "from-slate-500/10 to-slate-600/5",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  {
    id: 2,
    name: "Advanced",
    icon: Star,
    description: "Most popular choice",
    minInvestment: 20000000,
    maxInvestment: 100000000,
    duration: "60-180 days",
    returnRate: "10-15%",
    features: [
      "Higher returns",
      "Priority support",
      "Daily reports",
      "Risk management",
      "Auto-reinvest option",
    ],
    popular: true,
    color: "from-primary/10 to-primary/5",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    id: 3,
    name: "VIP",
    icon: Crown,
    description: "Maximum returns",
    minInvestment: 100000000,
    maxInvestment: 1000000000,
    duration: "180-365 days",
    returnRate: "18-25%",
    features: [
      "Highest returns",
      "Personal advisor",
      "Real-time reports",
      "Premium risk management",
      "Exclusive opportunities",
      "Insurance protection",
    ],
    popular: false,
    color: "from-amber-500/10 to-amber-600/5",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
]

export function InvestmentPackages() {
  const formatVND = (amount: number) => {
    if (amount >= 1000000000) {
      return (amount / 1000000000) + 'B VNĐ'
    }
    if (amount >= 1000000) {
      return (amount / 1000000) + 'M VNĐ'
    }
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ'
  }

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Available Packages</h2>
        <p className="text-sm text-muted-foreground">Choose the perfect investment plan for your goals</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className={cn(
              "group relative overflow-hidden transition-all duration-300 hover:shadow-xl",
              pkg.popular && "ring-2 ring-primary shadow-lg scale-[1.02]"
            )}
          >
            {pkg.popular && (
              <div className="absolute -right-12 top-6 rotate-45 bg-primary px-12 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                POPULAR
              </div>
            )}
            
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", pkg.color)} />
            
            <CardHeader className="relative">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", pkg.iconBg)}>
                  <pkg.icon className={cn("h-6 w-6", pkg.iconColor)} />
                </div>
                <div>
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative space-y-6">
              <div className="space-y-3">
                <div className="flex items-baseline justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">Return Rate</span>
                  <span className="text-2xl font-bold text-accent">{pkg.returnRate}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <p className="text-xs text-muted-foreground">Min Investment</p>
                    <p className="font-semibold">{formatVND(pkg.minInvestment)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold">{pkg.duration}</p>
                  </div>
                </div>
              </div>
              
              <ul className="space-y-2.5">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10">
                      <Check className="h-3 w-3 text-accent" />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={cn(
                  "w-full transition-all",
                  pkg.popular 
                    ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" 
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
                size="lg"
              >
                {pkg.popular ? "Get Started" : "Learn More"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
