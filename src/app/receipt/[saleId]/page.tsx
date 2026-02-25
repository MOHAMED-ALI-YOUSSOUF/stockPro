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

    // Récupération des données de vente + infos boutique depuis le store
    const { sales, loadData, isLoading, storeName, address, phone } = useStore();
    const [sale, setSale] = useState<Sale | null>(null);

    // Charge les données si le store est vide (ex: accès direct à l'URL)
    useEffect(() => {
        if (sales.length === 0) {
            loadData();
        }
    }, [sales.length, loadData]);

    // Recherche la vente par son ID
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
                <Button variant="outline" onClick={() => router.back()}>Retour</Button>
            </div>
        );
    }

    // Nom de la boutique : priorité sale.storeName > store.storeName > fallback
    const displayStoreName = sale.storeName || storeName || 'Boutique Locale';
    // Adresse et téléphone viennent du store courant (toujours à jour)
    const displayAddress = address || '';
    const displayPhone = phone || '';

    return (
        <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
            {/* Boutons Retour / Imprimer (masqués à l'impression) */}
            <div className="w-full max-w-[80mm] mb-6 flex gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                </Button>
                <Button size="sm" className="flex-1" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" /> Imprimer
                </Button>
            </div>

            {/* Ticket 80mm */}
            <div className="w-[80mm] bg-white p-4 shadow-lg print:shadow-none print:w-[80mm] print:p-0 text-black font-mono">

                {/* ── En-tête boutique ─────────────────────────────────────── */}
                <div className="text-center mb-4 border-b border-dashed border-black pb-3">
                    <h1 className="font-bold text-lg uppercase tracking-wide">{displayStoreName}</h1>

                    {/* Adresse — affichée uniquement si renseignée */}
                    {displayAddress && (
                        <p className="text-xs mt-1">{displayAddress}</p>
                    )}

                    {/* Téléphone — affiché uniquement si renseigné */}
                    {displayPhone && (
                        <p className="text-xs">Tél: {displayPhone}</p>
                    )}

                    <p className="text-xs mt-2">
                        {new Date(sale.date).toLocaleString('fr-FR')}
                    </p>
                    <p className="text-xs">Ticket: #{sale.id.slice(0, 8).toUpperCase()}</p>
                </div>

                {/* ── Articles ──────────────────────────────────────────────── */}
                <div className="mb-4 text-xs">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-dashed border-black">
                                <th className="pb-1">Article</th>
                                <th className="pb-1 text-center">Qté</th>
                                <th className="pb-1 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(sale.items || []).map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-1 pr-1 truncate max-w-[40mm]">
                                        {item.product?.name ?? 'Article inconnu'}
                                        <br />
                                        <span className="text-[10px] text-gray-500">
                                            {(item.product?.price ?? 0).toFixed(0)} FDJ
                                        </span>
                                    </td>
                                    <td className="py-1 text-center align-top">{item.quantity}</td>
                                    <td className="py-1 text-right align-top">
                                        {((item.product?.price ?? 0) * item.quantity).toFixed(0)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── Totaux ──────────────────────────────────────────────── */}
                <div className="border-t border-dashed border-black pt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span>Total Brut</span>
                        <span>{(sale.totalBrut || sale.total || 0).toFixed(0)} FDJ</span>
                    </div>

                    {(sale.vatRate || 0) > 0 && (
                        <div className="flex justify-between">
                            <span>TVA ({sale.vatRate || 0}%)</span>
                            <span>{(sale.vatTotal || 0).toFixed(0)} FDJ</span>
                        </div>
                    )}

                    {(sale.discount || 0) > 0 && (
                        <div className="flex justify-between">
                            <span>Remise</span>
                            <span>-{(sale.discount || 0).toFixed(0)} FDJ</span>
                        </div>
                    )}

                    <div className="flex justify-between font-bold text-sm border-t border-dashed border-black pt-1 mt-1">
                        <span>NET À PAYER</span>
                        <span>{(sale.totalFinal || sale.total || 0).toFixed(0)} FDJ</span>
                    </div>
                </div>

                {/* ── Paiement & Monnaie ──────────────────────────────────── */}
                <div className="mt-3 border-t border-dashed border-black pt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span>Mode de paiement</span>
                        <span className="uppercase font-medium">
                            {(sale.paymentMethod || '').replace('-', ' ')}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Reçu</span>
                        <span>{(sale.amountGiven || 0).toFixed(0)} FDJ</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Rendu</span>
                        <span>{(sale.change || 0).toFixed(0)} FDJ</span>
                    </div>
                </div>

                {/* ── Pied de page ────────────────────────────────────────── */}
                <div className="text-center mt-6 text-[10px] border-t border-dashed border-black pt-3">
                    <p className="font-semibold">Merci de votre visite !</p>
                    <p>Gardez ce ticket pour toute réclamation.</p>
                    {displayPhone && <p className="mt-1">{displayPhone}</p>}
                </div>
            </div>

            {/* CSS d'impression */}
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
                        display: none !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
