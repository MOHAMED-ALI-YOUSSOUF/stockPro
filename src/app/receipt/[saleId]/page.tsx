'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { Sale } from '@/types/models';
import { Loader2 } from 'lucide-react';

export default function ReceiptPage() {
    const { saleId } = useParams();
    const router = useRouter();
    const { sales, loadData, isLoading } = useStore();
    const [sale, setSale] = useState<Sale | null>(null);

    useEffect(() => {
        if (sales.length === 0) {
            loadData();
        }
    }, [sales.length, loadData]);

    useEffect(() => {
        if (saleId && sales.length > 0) {
            const foundSale = sales.find((s) => s.id === saleId);
            if (foundSale) {
                setSale(foundSale);
            }
        }
    }, [saleId, sales]);

    if (isLoading && !sale) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!sale) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-muted-foreground">Vente non trouvée</p>
                <Button variant="outline" onClick={() => router.back()}>
                    Retour
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
            {/* Actions (Hidden on Print) */}
            <div className="w-full max-w-[80mm] mb-6 flex gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                </Button>
                <Button size="sm" className="flex-1" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" /> Imprimer
                </Button>
            </div>

            {/* Ticket Wrapper - 80mm */}
            <div className="w-[80mm] bg-white p-4 shadow-lg print:shadow-none print:w-[80mm] print:p-0 text-black">
                {/* Header */}
                <div className="text-center mb-4 border-b border-black pb-2 border-dashed">
                    <h1 className="font-bold text-lg uppercase">Boutique Locale</h1>
                    <p className="text-xs">Djibouti</p>
                    <p className="text-xs mt-1">
                        {new Date(sale.date).toLocaleString('fr-FR')}
                    </p>
                    <p className="text-xs">Ticket: #{sale.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs">Vendeur: {sale.userId ? 'Défini' : 'Vendeur'}</p>
                </div>

                {/* Items */}
                <div className="mb-4 text-xs font-mono">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-black border-dashed">
                                <th className="pb-1">Art</th>
                                <th className="pb-1 text-center">Qté</th>
                                <th className="pb-1 text-right">Tot</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-1 pr-1 truncate max-w-[40mm]">
                                        {item.product.name} <br />
                                        <span className="text-[10px] text-gray-500">{item.product.price}</span>
                                    </td>
                                    <td className="py-1 text-center align-top">{item.quantity}</td>
                                    <td className="py-1 text-right align-top">
                                        {(item.product.price * item.quantity).toFixed(0)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="border-t border-black border-dashed pt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span>Total Brut</span>
                        <span>{(sale.totalBrut || sale.total).toFixed(0)}</span>
                    </div>
                    {(sale.vatRate || 0) > 0 && (
                        <div className="flex justify-between">
                            <span>TVA ({(sale.vatRate || 0)}%)</span>
                            <span>{(sale.vatTotal || 0).toFixed(0)}</span>
                        </div>
                    )}
                    {(sale.discount || 0) > 0 && (
                        <div className="flex justify-between">
                            <span>Remise</span>
                            <span>-{(sale.discount || 0).toFixed(0)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-sm border-t border-black border-dashed pt-1 mt-1">
                        <span>NET A PAYER</span>
                        <span>{(sale.totalFinal || sale.total).toFixed(0)} FDJ</span>
                    </div>
                </div>

                {/* Payment & Change */}
                <div className="mt-4 border-t border-black border-dashed pt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span>Espèces/Mode</span>
                        <span className="uppercase">{sale.paymentMethod.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Reçu</span>
                        <span>{(sale.amountGiven || 0).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Rendu</span>
                        <span>{(sale.change || 0).toFixed(0)}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-[10px]">
                    <p>Merci de votre visite !</p>
                    <p>Gardez ce ticket pour toute réclamation.</p>
                </div>
            </div>

            {/* Print CSS */}
            <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body {
            background: white;
          }
          .print\\:hidden {
            display: none;
          }
          .print\\:shadow-none {
            box-shadow: none;
          }
        }
      `}</style>
        </div>
    );
}
