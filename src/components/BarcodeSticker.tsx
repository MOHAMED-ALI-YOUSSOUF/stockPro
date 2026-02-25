'use client'
import { useRef } from 'react';
import Barcode from 'react-barcode';
import { Button } from '@/components/ui/button';
import { X, Download, Printer } from 'lucide-react';
import type { Product } from '@/types/models';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface BarcodeStickerProps {
  product: Product;
  onClose: () => void;
}

export const BarcodeSticker = ({ product, onClose }: BarcodeStickerProps) => {
  const stickerRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!stickerRef.current) return;

    const canvas = await html2canvas(stickerRef.current, {
      scale: 3,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [60, 40],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, 60, 40);
    pdf.save(`etiquette-${product.barcode}.pdf`);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !stickerRef.current) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Étiquette - ${product.name}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .sticker { padding: 16px; border: 2px dashed #e5e7eb; border-radius: 8px; text-align: center; background: white; }
            .product-name { font-size: 14px; font-weight: 600; margin-bottom: 8px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .product-price { font-size: 18px; font-weight: 700; color: #10b981; margin-top: 8px; }
            @media print { body { padding: 0; } .sticker { border: none; } }
          </style>
        </head>
        <body>
          <div class="sticker">
            <div class="product-name">${product.name}</div>
            ${stickerRef.current.querySelector('svg')?.outerHTML}
            <div class="product-price">€${product.price.toFixed(2)}</div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Étiquette Code Barre</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          <div className="mb-6 flex justify-center">
            <div ref={stickerRef} className="barcode-sticker text-center p-6 bg-white inline-block">
              <p className="font-semibold text-lg mb-3 text-black max-w-[200px] truncate">
                {product.name}
              </p>
              <Barcode
                value={product.barcode}
                format="CODE128"
                width={2}
                height={60}
                displayValue={true}
                fontSize={14}
                margin={0}
              />
              <p className="text-2xl font-bold text-green-600 mt-3">
                €{product.price.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-muted/50 text-sm">
              <p className="font-medium mb-1">Informations du produit</p>
              <p className="text-muted-foreground">
                Code: <span className="font-mono">{product.barcode}</span>
              </p>
              <p className="text-muted-foreground">Catégorie: {product.category}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleDownloadPDF} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Télécharger PDF
              </Button>
              <Button onClick={handlePrint} className="flex-1 btn-primary-gradient">
                <Printer className="w-4 h-4 mr-2" />
                Imprimer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
