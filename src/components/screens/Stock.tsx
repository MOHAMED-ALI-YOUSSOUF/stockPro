import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Package,
  Calendar,
  Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StockMovementModal } from '@/components/StockMovementModal';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { toast } from 'sonner';

const Stock = () => {
  const { movements, products, getProductByBarcode } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [movementType, setMovementType] = useState<'in' | 'out' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanType, setScanType] = useState<'in' | 'out'>('in');

  const filteredMovements = movements.filter((movement) =>
    movement.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (type: 'in' | 'out', productId?: string) => {
    setMovementType(type);
    setSelectedProduct(productId || null);
  };

  const handleCloseModal = () => {
    setMovementType(null);
    setSelectedProduct(null);
  };

  const handleScan = (barcode: string) => {
    const product = getProductByBarcode(barcode);
    if (product) {
      handleOpenModal(scanType, product.id);
    } else {
      toast.error('Produit non trouvé');
    }
    setShowScanner(false);
  };

  const handleScanClick = (type: 'in' | 'out') => {
    setScanType(type);
    setShowScanner(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Gestion du Stock</h1>
          <p className="text-muted-foreground mt-1">Entrées et sorties de stock</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleScanClick('in')} className="gap-2">
            <Camera className="w-4 h-4" />
            Scanner
          </Button>
          <Button onClick={() => handleOpenModal('in')} className="gap-2 bg-green-500 hover:bg-green-600">
            <ArrowDownRight className="w-4 h-4" />
            Entrée
          </Button>
          <Button onClick={() => handleOpenModal('out')} variant="destructive" className="gap-2">
            <ArrowUpRight className="w-4 h-4" />
            Sortie
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <ArrowDownRight className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entrées ce mois</p>
              <p className="text-2xl font-bold">
                {movements.filter((m) => m.type === 'in').reduce((acc, m) => acc + m.quantity, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sorties ce mois</p>
              <p className="text-2xl font-bold">
                {movements
                  .filter((m) => m.type === 'out' || m.type === 'sale')
                  .reduce((acc, m) => acc + m.quantity, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total mouvements</p>
              <p className="text-2xl font-bold">{movements.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
          placeholder="Rechercher un mouvement..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/40"
         />  
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Produit</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Quantité</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Note</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun mouvement trouvé</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => (
                  <tr
                    key={movement.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="p-4">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center',
                          movement.type === 'in' ? 'bg-green-500/10' : 'bg-red-500/10'
                        )}
                      >
                        {movement.type === 'in' ? (
                          <ArrowDownRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{movement.productName}</p>
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          'font-bold',
                          movement.type === 'in' ? 'text-green-500' : 'text-red-500'
                        )}
                      >
                        {movement.type === 'in' ? '+' : '-'}
                        {movement.quantity}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(movement.date), 'dd MMM yyyy, HH:mm', { locale: fr })}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{movement.note || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {movementType && (
        <StockMovementModal
          type={movementType}
          productId={selectedProduct}
          onClose={handleCloseModal}
        />
      )}

      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
};

export default Stock;
