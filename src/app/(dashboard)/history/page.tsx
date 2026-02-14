'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, History as HistoryIcon, ArrowUpRight, ArrowDownLeft, ShoppingCart, Receipt } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
    const { sales, movements, isLoading } = useStore();
    const router = useRouter();

    if (isLoading && sales.length === 0) {
        return <div className="p-8 text-center">Chargement de l'historique...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold">Historique</h1>
                    <p className="text-muted-foreground mt-1">Traçabilité complète des ventes et mouvements</p>
                </div>
            </div>

            <Tabs defaultValue="sales" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-4">
                    <TabsTrigger value="sales" className="flex items-center gap-2">
                        <Receipt className="w-4 h-4" /> Ventes
                    </TabsTrigger>
                    <TabsTrigger value="movements" className="flex items-center gap-2">
                        <HistoryIcon className="w-4 h-4" /> Mouvements
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sales" className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID / Date</TableHead>
                                <TableHead>Total (FDJ)</TableHead>
                                <TableHead>Paiement</TableHead>
                                <TableHead>Articles</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Aucune vente enregistrée
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sales.map((sale) => (
                                    <TableRow key={sale.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted-foreground">#{sale.id.slice(0, 8).toUpperCase()}</span>
                                                <span>{new Date(sale.date).toLocaleString('fr-FR')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {(sale.totalFinal || sale.total).toFixed(0)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "capitalize",
                                                    sale.paymentMethod === 'cash' && "bg-green-100 text-green-700 border-green-200",
                                                    sale.paymentMethod === 'd-money' && "bg-orange-100 text-orange-700 border-orange-200",
                                                    sale.paymentMethod === 'waafi' && "bg-purple-100 text-purple-700 border-purple-200",
                                                    sale.paymentMethod === 'cac-pay' && "bg-blue-100 text-blue-700 border-blue-200",
                                                    sale.paymentMethod === 'saba-pay' && "bg-indigo-100 text-indigo-700 border-indigo-200",
                                                    sale.paymentMethod === 'card' && "bg-gray-100 text-gray-700 border-gray-200"
                                                )}
                                            >
                                                {sale.paymentMethod.replace('-', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {sale.items.reduce((acc, item) => acc + item.quantity, 0)} arts
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/receipt/${sale.id}`)}
                                                className="text-primary hover:text-primary hover:bg-primary/10"
                                            >
                                                <Eye className="w-4 h-4 mr-2" /> Voir ticket
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>

                <TabsContent value="movements" className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Produit</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Qté</TableHead>
                                <TableHead>Note</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {movements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Aucun mouvement enregistré
                                    </TableCell>
                                </TableRow>
                            ) : (
                                movements.map((movement) => (
                                    <TableRow key={movement.id}>
                                        <TableCell className="text-xs">
                                            {new Date(movement.date).toLocaleString('fr-FR')}
                                        </TableCell>
                                        <TableCell className="font-medium">{movement.productName}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                {movement.type === 'in' && <ArrowDownLeft className="w-4 h-4 text-green-500" />}
                                                {movement.type === 'out' && <ArrowUpRight className="w-4 h-4 text-red-500" />}
                                                {movement.type === 'sale' && <ShoppingCart className="w-4 h-4 text-blue-500" />}
                                                <span className={cn(
                                                    "text-xs font-medium capitalize",
                                                    movement.type === 'in' && "text-green-600",
                                                    movement.type === 'out' && "text-red-600",
                                                    movement.type === 'sale' && "text-blue-600"
                                                )}>
                                                    {movement.type === 'in' ? 'Entrée' : movement.type === 'out' ? 'Sortie' : 'Vente'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {movement.type === 'out' || movement.type === 'sale' ? '-' : '+'}{movement.quantity}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs italic">
                                            <div className="flex flex-col">
                                                <span>{movement.note || '-'}</span>
                                                {movement.paymentMethod && (
                                                    <span className="text-[10px] uppercase font-bold text-primary/70">
                                                        Via {movement.paymentMethod}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>
            </Tabs>
        </div>
    );
}
