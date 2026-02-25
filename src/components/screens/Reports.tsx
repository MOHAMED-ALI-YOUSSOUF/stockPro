'use client'
import { useStore } from '@/store/useStore';
import {
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  Calendar,
  ArrowUpRight,
  Banknote,
  ReceiptText,
  PiggyBank,
  Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ─── Mini stat card ───────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;         // Tailwind bg class for icon shell
  iconColor: string;      // Tailwind text class for icon
  highlight?: boolean;    // Slightly stronger border/bg
  badge?: string;
}

const StatCard = ({ label, value, sub, icon, accent, iconColor, highlight, badge }: StatCardProps) => (
  <div
    className={cn(
      'relative flex flex-col gap-3 rounded-2xl border p-5 bg-card overflow-hidden transition-shadow hover:shadow-md',
      highlight ? 'border-primary/40' : 'border-border',
    )}
  >
    {/* subtle top-left glow */}
    {highlight && (
      <div className="pointer-events-none absolute -top-6 -left-6 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
    )}

    {/* Header row */}
    <div className="flex items-center justify-between">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', accent)}>
        <span className={cn('w-5 h-5', iconColor)}>{icon}</span>
      </div>
      {badge && (
        <span className={cn(
          'text-xs font-semibold px-2 py-0.5 rounded-full',
          highlight ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}>
          {badge}
        </span>
      )}
    </div>

    {/* Value */}
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={cn('text-2xl font-bold leading-none', highlight ? 'text-primary' : 'text-foreground')}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
    </div>
  </div>
);

// ─── Divider card (CA HT + TVA together) ─────────────────────────────────────
const RevenueBreakdownCard = ({
  ht, tva, ttc,
}: { ht: number; tva: number; ttc: number }) => (
  <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-card rounded-2xl border border-border p-5 space-y-3 hover:shadow-md transition-shadow">
    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Chiffre d'Affaires</p>

    {/* TTC — primary */}
    <div className="flex items-end justify-between">
      <span className="text-sm font-semibold text-foreground">TTC</span>
      <span className="text-3xl font-extrabold text-primary leading-none">{ttc.toLocaleString('fr-FR')} <span className="text-base font-semibold">FDJ</span></span>
    </div>

    <div className="h-px bg-border" />

    {/* HT + TVA row */}
    <div className="grid grid-cols-2 gap-2">
      <div className="bg-muted/50 rounded-xl p-3">
        <p className="text-xs text-muted-foreground mb-0.5">Hors taxe (HT)</p>
        <p className="text-base font-bold">{ht.toLocaleString('fr-FR')} <span className="text-xs font-medium text-muted-foreground">FDJ</span></p>
      </div>
      <div className="bg-purple-500/10 rounded-xl p-3">
        <p className="text-xs text-purple-600 mb-0.5">TVA collectée</p>
        <p className="text-base font-bold text-purple-700">{tva.toLocaleString('fr-FR')} <span className="text-xs font-medium">FDJ</span></p>
      </div>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const Reports = () => {
  const { products, sales } = useStore();

  let totalRevenueHT = 0;
  let totalRevenueTTC = 0;
  let totalTVA = 0;
  let totalCost = 0;

  for (const sale of sales) {
    const saleTTC = sale.totalFinal || 0;
    const vatRate = sale.vatRate || 0;
    const saleHT =
      sale.totalBrut ??
      (vatRate > 0 ? saleTTC / (1 + vatRate / 100) : saleTTC);
    const saleTVA =
      sale.vatTotal ??
      (vatRate > 0 ? saleTTC - saleHT : 0);

    totalRevenueTTC += Math.max(0, saleTTC);
    totalRevenueHT += Math.max(0, saleHT);
    totalTVA += Math.max(0, saleTVA);

    for (const item of sale.items || []) {
      const quantity = Math.max(0, item.quantity || 0);
      const unitCost = item.unitCost ?? item.product?.cost ?? 0;
      totalCost += unitCost * quantity;
    }
  }

  const profit = Math.max(0, totalRevenueHT - totalCost);
  const marginHT = totalRevenueHT > 0 ? (profit / totalRevenueHT) * 100 : 0;

  const categoryData = products
    .reduce((acc, product) => {
      const safeQty = Math.max(0, product.quantity);
      if (safeQty <= 0) return acc;
      const existing = acc.find((c) => c.name === product.category);
      if (existing) existing.value += safeQty;
      else acc.push({ name: product.category, value: safeQty });
      return acc;
    }, [] as { name: string; value: number }[])
    .filter((c) => c.value > 0);

  const salesByDay = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const daySales = sales
      .filter((s) => {
        const saleDate = new Date(s.date);
        return saleDate >= dayStart && saleDate <= dayEnd;
      })
      .reduce((acc, s) => acc + s.total, 0);
    return { day: format(date, 'EEE', { locale: fr }), ventes: daySales };
  });

  const productSales = sales.flatMap((s) => s.items).reduce(
    (acc, item) => {
      const existing = acc.find((p) => p.id === item.product.id);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.product.price * item.quantity;
      } else {
        acc.push({ id: item.product.id, name: item.product.name, quantity: item.quantity, revenue: item.product.price * item.quantity });
      }
      return acc;
    },
    [] as { id: string; name: string; quantity: number; revenue: number }[]
  );

  const topProducts = productSales.sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Rapports</h1>
        <p className="text-muted-foreground mt-1">Analyse de vos performances</p>
      </div>

      {/* ── KPI GRID ── */}
      {/*
        Mobile  : 2 cols
        Tablet+ : 4 cols (CA breakdown spans 2, then bénéfice + marge)
      */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* CA breakdown card — spans full width on mobile, 2 cols on lg */}
        <div className="col-span-2 bg-card rounded-2xl border border-primary/30 p-5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/8 blur-3xl" />

          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Chiffre d'Affaires</p>

          {/* TTC big number */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-extrabold text-primary">
              {totalRevenueTTC.toLocaleString('fr-FR')}
            </span>
            <span className="text-base font-semibold text-muted-foreground">FDJ TTC</span>
          </div>

          {/* HT + TVA pills */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/60 rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Hors Taxe</p>
              <p className="text-lg font-bold leading-none">
                {totalRevenueHT.toLocaleString('fr-FR')}
                <span className="text-xs font-normal text-muted-foreground ml-1">FDJ</span>
              </p>
            </div>
            <div className="bg-purple-500/10 rounded-xl px-4 py-3">
              <p className="text-xs text-purple-500 mb-1 font-medium">TVA collectée</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-400 leading-none">
                {totalTVA.toLocaleString('fr-FR')}
                <span className="text-xs font-normal ml-1">FDJ</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bénéfice Net */}
        <StatCard
          label="Bénéfice Net"
          value={`${profit.toLocaleString('fr-FR')} FDJ`}
          sub="Calculé sur le CA HT"
          icon={<PiggyBank className="w-5 h-5" />}
          accent="bg-emerald-500/10"
          iconColor="text-emerald-600"
          highlight={false}
          badge="Sur HT"
        />

        {/* Marge */}
        <StatCard
          label="Marge bénéficiaire"
          value={`${marginHT.toFixed(1)} %`}
          sub={marginHT < 10 ? '⚠ Marge faible' : '✓ Marge correcte'}
          icon={<Percent className="w-5 h-5" />}
          accent={marginHT < 10 ? 'bg-orange-500/10' : 'bg-emerald-500/10'}
          iconColor={marginHT < 10 ? 'text-orange-500' : 'text-emerald-500'}
          highlight={false}
        />
      </div>

      {/* ── CHARTS ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Ventes des 7 derniers jours
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                  }}
                  formatter={(value: number) => [`${value.toFixed(0)} FDJ`, 'Ventes']}
                />
                <Bar dataKey="ventes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Répartition par catégorie
          </h2>
          <div className="h-64 flex items-center">
            {categoryData.length === 0 ? (
              <div className="w-full text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun produit</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 min-w-max">
                  {categoryData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── TOP PRODUCTS ── */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Produits les plus vendus
        </h2>
        {topProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune vente enregistrée</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.quantity} vendus</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-primary">{product.revenue.toLocaleString('fr-FR')} FDJ</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;