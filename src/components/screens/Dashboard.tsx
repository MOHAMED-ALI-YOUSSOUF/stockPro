"use client";

import { useStore } from "@/store/useStore";
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Dashboard() {
  const {
    products,
    getLowStockProducts,
    getTotalInventoryValue,
    getTodaySales,
    getRecentMovements,
    getMonthlySales,
    storeName,
    isLoading,
  } = useStore();

  const lowStockProducts = getLowStockProducts();
  const inventoryValue = getTotalInventoryValue();
  const todaySales = getTodaySales();
  const recentMovements = getRecentMovements(5);
  const monthlySales = getMonthlySales();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    {
      label: "Produits",
      value: products.length,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Valeur Stock",
      value: ` ${inventoryValue.toLocaleString("fr-FR")} FDJ`,
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Ventes Jour",
      value: ` ${todaySales.toLocaleString("fr-FR")} FDJ`,
      icon: TrendingUp,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Stock Bas",
      value: lowStockProducts.length,
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {storeName || "Tableau de bord"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {storeName ? "Tableau de bord - Vue d'ensemble" : "Vue d'ensemble de votre inventaire"}
        </p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border bg-card shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <CardContent className="p-4 lg:p-5">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4 lg:h-5 lg:w-5", stat.color)} />
                </div>

                <div>
                  <p className="text-[11px] lg:text-xs uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-sm lg:text-base font-semibold leading-tight">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* LOW STOCK */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/40 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              Stock Bas ({lowStockProducts.length})
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-0 space-y-2">
            {lowStockProducts.slice(0, 5).map((product) => (
              <div
                key={product.id}
                className="flex justify-between items-center text-sm"
              >
                <span className="truncate flex-1 text-foreground">
                  {product.name}
                </span>
                <span className="text-destructive font-medium ml-2 text-xs">
                  {product.quantity} / {product.minStock}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* MONTHLY REVENUE CHART */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm lg:text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Ventes Mensuelles (HT)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[260px] lg:h-[320px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 12 }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                cursor={{ fill: '#F1F5F9' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar
                dataKey="value"
                name="Ventes (FDJ)"
                radius={[6, 6, 0, 0]}
              >
                {monthlySales.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === monthlySales.length - 1 ? '#3B82F6' : '#94A3B8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* RECENT MOVEMENTS */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm lg:text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Mouvements récents
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {recentMovements.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Aucun mouvement récent
            </p>
          ) : (
            recentMovements.map((movement) => (
              <div
                key={movement.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-md flex items-center justify-center",
                      movement.type === "in"
                        ? "bg-green-500/10"
                        : "bg-red-500/10"
                    )}
                  >
                    {movement.type === "in" ? (
                      <ArrowDownRight className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium leading-tight">
                      {movement.productName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(movement.date), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    "font-semibold text-xs",
                    movement.type === "in"
                      ? "text-green-500"
                      : "text-red-500"
                  )}
                >
                  {movement.type === "in" ? "+" : "-"}
                  {movement.quantity}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: "/pos", label: "Nouvelle Vente", icon: Package },
          { href: "/products", label: "Ajouter Produit", icon: Package },
          { href: "/stock", label: "Entrée Stock", icon: ArrowDownRight },
          { href: "/stock", label: "Sortie Stock", icon: ArrowUpRight },
        ].map((action) => (
          <Link key={action.label} href={action.href}>
            <Card className="cursor-pointer shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <action.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-medium">{action.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
