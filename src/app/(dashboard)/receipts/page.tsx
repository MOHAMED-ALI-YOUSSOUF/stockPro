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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Receipt, Search, Eye, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function ReceiptsPage() {
    const { sales, isLoading } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const filteredSales = sales.filter(sale =>
        sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading && sales.length === 0) {
        return <div className="p-8 text-center">Chargement des reçus...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Tickets de Caisse</h1>
                <p className="text-muted-foreground mt-1">Recherchez et réimprimez vos tickets</p>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Rechercher par ID de ticket..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl"
                />
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Numéro Ticket</TableHead>
                            <TableHead>Date / Heure</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Paiement</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSales.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                    {searchQuery ? 'Aucun ticket ne correspond à votre recherche' : 'Aucun ticket disponible'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSales.map((sale) => (
                                <TableRow key={sale.id} className="group">
                                    <TableCell className="font-mono text-sm uppercase">
                                        #{sale.id.slice(0, 8)}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(sale.date).toLocaleString('fr-FR')}
                                    </TableCell>
                                    <TableCell className="font-bold text-primary">
                                        {(sale.totalFinal || sale.total).toFixed(0)} FDJ
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="capitalize font-normal text-[10px]">
                                            {sale.paymentMethod.replace('-', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => router.push(`/receipt/${sale.id}`)}
                                            className="rounded-lg hover:bg-primary hover:text-primary-foreground group-hover:border-primary transition-all"
                                        >
                                            <Eye className="w-4 h-4 mr-2" /> Voir
                                            <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
