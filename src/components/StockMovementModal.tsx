import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StockMovementModalProps {
  type: 'in' | 'out';
  productId?: string | null;
  onClose: () => void;
}

export const StockMovementModal = ({ type, productId, onClose }: StockMovementModalProps) => {
  const { products, addMovement } = useStore();
  const [selectedProduct, setSelectedProduct] = useState(productId || '');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productId) {
      setSelectedProduct(productId);
    }
  }, [productId]);

  const selectedProductData = products.find((p) => p.id === selectedProduct);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct || !quantity) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const qty = parseInt(quantity);

    if (type === 'out' && selectedProductData && qty > selectedProductData.quantity) {
      toast.error('Quantité insuffisante en stock');
      return;
    }

    setIsSubmitting(true);
    try {
      await addMovement({
        productId: selectedProduct,
        productName: selectedProductData?.name || '',
        type,
        quantity: qty,
        note: note || undefined,
      });

      toast.success(
        type === 'in' ? 'Entrée de stock enregistrée' : 'Sortie de stock enregistrée'
      );
      onClose();
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                type === 'in' ? 'bg-green-500/10' : 'bg-red-500/10'
              )}
            >
              {type === 'in' ? (
                <ArrowDownRight className="w-5 h-5 text-green-500" />
              ) : (
                <ArrowUpRight className="w-5 h-5 text-red-500" />
              )}
            </div>
            <h2 className="text-xl font-semibold">
              {type === 'in' ? 'Entrée de stock' : 'Sortie de stock'}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Produit *</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="input-modern">
                <SelectValue placeholder="Sélectionner un produit" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center justify-between gap-4">
                      <span>{product.name}</span>
                      <span className="text-muted-foreground text-sm">
                        Stock: {product.quantity}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProductData && (
            <div className="p-3 rounded-xl bg-muted/50 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stock actuel:</span>
                <span className="font-medium">
                  {selectedProductData.quantity} {selectedProductData.unit}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Code barre:</span>
                <span className="font-mono">{selectedProductData.barcode}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantité *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input-modern"
              placeholder="Entrez la quantité"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optionnel)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Raison du mouvement..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'flex-1',
                type === 'in' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
              )}
            >
              {type === 'in' ? "Enregistrer l'entrée" : 'Enregistrer la sortie'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
