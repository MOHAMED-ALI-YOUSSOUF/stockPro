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
    isLoading,
  } = useStore();

  const lowStockProducts = getLowStockProducts();
  const inventoryValue = getTotalInventoryValue();
  const todaySales = getTodaySales();
  const recentMovements = getRecentMovements(5);

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
    <div className="lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble de votre inventaire</p>
      </div>

      {/* KPI GRID COMPACT */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border bg-card shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <CardContent className="p-4 lg:p-8">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("h-4 lg:h-10 lg:w-10 w-4", stat.color)} />
                </div>

                <div>
                  <p className="text-xs lg:text-lg uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xs lg:text-2xl font-semibold leading-tight">
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
            <CardTitle className="text-sm lg:text-lg flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4 lg:h-10 lg:w-10" />
              Stock Bas ({lowStockProducts.length})
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-0 space-y-2">
            {lowStockProducts.slice(0, 5).map((product) => (
              <div
                key={product.id}
                className="flex justify-between items-center text-sm lg:text-lg"
              >
                <span className="truncate flex-1 text-foreground">
                  {product.name}
                </span>
                <span className="text-destructive font-medium ml-2 text-xs lg:text-lg">
                  {product.quantity} / {product.minStock}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* RECENT MOVEMENTS */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm lg:text-xl flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary lg:h-10 lg:w-10" />
            Mouvements récents
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {recentMovements.length === 0 ? (
            <p className="text-xs lg:text-lg text-muted-foreground">
              Aucun mouvement récent
            </p>
          ) : (
            recentMovements.map((movement) => (
              <div
                key={movement.id}
                className="flex items-center justify-between text-sm lg:text-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-7 h-7 lg:w-10 lg:h-10 rounded-md flex items-center justify-center",
                      movement.type === "in"
                        ? "bg-green-500/10"
                        : "bg-red-500/10"
                    )}
                  >
                    {movement.type === "in" ? (
                      <ArrowDownRight className="h-4 w-4 lg:h-10 lg:w-10 text-green-500" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 lg:h-10 lg:w-10 text-red-500" />
                    )}
                  </div>

                  <div>
                    <p className="text-sm lg:text-lg font-medium leading-tight">
                      {movement.productName}
                    </p>
                    <p className="text-[10px] lg:text-lg text-muted-foreground">
                      {formatDistanceToNow(new Date(movement.date), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    "font-semibold text-xs lg:text-lg",
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
              <CardContent className="p-4 lg:p-8 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <action.icon className="h-4 w-4 lg:h-10 lg:w-10 text-primary" />
                </div>
                <p className="text-sm lg:text-xl font-medium">{action.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
