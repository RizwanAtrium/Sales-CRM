"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Clock3, DollarSign, Target, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const icons = [DollarSign, Clock3, Trophy, Target];

export function MetricCard({ item, index }: { item: { label: string; value: string; change: string; trend: string; tone: string }; index: number }) {
  const Icon = icons[index] ?? Target;
  const alert = item.trend === "alert";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileHover={{ y: -3 }}
    >
      <Card className="metric-glow relative overflow-hidden border-border/70 bg-card/90">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight">{item.value}</p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            {alert ? <ArrowDownRight className="size-3.5 text-amber-500" /> : <ArrowUpRight className="size-3.5 text-emerald-500" />}
            <span className={alert ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>{item.change}</span>
            <span className="text-muted-foreground">vs last period</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
