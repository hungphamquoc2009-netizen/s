"use client"

import { ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function AccountOverview() {
  const [showBalance, setShowBalance] = useState(true)
  const balance = 157430000
  const profitAmount = 27430000
  const profitPercentage = 21.1

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ'
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-primary-foreground shadow-xl sm:p-8">
      {/* Background decoration */}
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/70">Available Balance</p>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  {showBalance ? formatVND(balance) : "••••••••••"}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => setShowBalance(!showBalance)}
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
            <TrendingUp className="h-4 w-4 text-emerald-300" />
            <span className="text-sm font-semibold text-emerald-300">+{profitPercentage}%</span>
          </div>
          <span className="text-sm text-white/70">
            +{formatVND(profitAmount)} this month
          </span>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button 
            className="flex-1 gap-2 bg-white text-primary shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
            size="lg"
          >
            <ArrowDownLeft className="h-5 w-5" />
            Deposit
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 gap-2 border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
            size="lg"
          >
            <ArrowUpRight className="h-5 w-5" />
            Withdraw
          </Button>
        </div>
      </div>
    </div>
  )
}
