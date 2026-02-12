import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Scan,
  Search,
  Camera,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { toast } from 'sonner';

const POS = () => {
  const {
    products,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    completeSale,
    getProductByBarcode,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaleTotal, setLastSaleTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const cartTotal = getCartTotal();
  const taxRate = 0
  const taxAmount = cartTotal * taxRate;
  const totalWithTax = cartTotal + taxAmount;

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput) {
      const product = getProductByBarcode(barcodeInput);
      if (product) {
        if (product.quantity > 0) {
          addToCart(product);
          toast.success(`${product.name} ajouté au panier`);
        } else {
          toast.error('Produit en rupture de stock');
        }
      } else {
        toast.error('Produit non trouvé');
      }
      setBarcodeInput('');
    }
  };

  const handleScan = (barcode: string) => {
    const product = getProductByBarcode(barcode);
    if (product) {
      if (product.quantity > 0) {
        addToCart(product);
        toast.success(`${product.name} ajouté au panier`);
      } else {
        toast.error('Produit en rupture de stock');
      }
    } else {
      toast.error('Produit non trouvé');
    }
    setShowScanner(false);
  };

  const handleCompleteSale = async (paymentMethod: 'cash' | 'card') => {
    setIsProcessing(true);
    try {
      const sale = await completeSale(paymentMethod);
      if (sale) {
        setLastSaleTotal(sale.total);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch {
      toast.error('Erreur lors de la vente');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      if (product.quantity > 0) {
        addToCart(product);
      } else {
        toast.error('Produit en rupture de stock');
      }
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 animate-fade-in">
      {/* Products Section */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex gap-3 mb-6">
          <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
            <Scan className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={barcodeInputRef}
              placeholder="Scanner ou entrer le code barre..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
               className="pl-10 h-11 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/40"
     />
          </form>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 shrink-0"
            onClick={() => setShowScanner(true)}
          >
            <Camera className="w-5 h-5" />
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
             className="pl-10 h-11 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/40"
   
          />
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleAddProduct(product.id)}
                disabled={product.quantity <= 0}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all duration-200',
                  product.quantity <= 0
                    ? 'bg-muted border-border opacity-50 cursor-not-allowed'
                    : 'bg-card border-border hover:border-primary hover:shadow-lg active:scale-95'
                )}
              >
                <p className="font-medium line-clamp-2 mb-2">{product.name}</p>
                <p className="text-lg font-bold text-primary">{product.price.toFixed(2)} FDJ</p>
                <p
                  className={cn(
                    'text-xs mt-1',
                    product.quantity <= product.minStock
                      ? 'text-orange-500'
                      : 'text-muted-foreground'
                  )}
                >
                  Stock: {product.quantity}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-full lg:w-96 flex flex-col bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Panier</h2>
            {cart.length > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-50" />
              <p>Panier vide</p>
              <p className="text-sm">Scannez ou sélectionnez un produit</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-clamp-1">{item.product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.product.price.toFixed(2)} × {item.quantity} 
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.quantity}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <p className="font-bold w-20 text-right">
                  {(item.product.price * item.quantity).toFixed(2)} 
                </p>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t border-border space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{cartTotal.toFixed(2)} FDJ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA (0%)</span>
                <span>{taxAmount.toFixed(2)} FDJ</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{totalWithTax.toFixed(2)} FDJ</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleCompleteSale('cash')}
                className="h-14 text-lg"
                variant="outline"
                disabled={isProcessing}
              >
                <Banknote className="w-5 h-5 mr-2" />
                Espèces
              </Button>
              <Button
                onClick={() => handleCompleteSale('card')}
                className="h-14 text-lg btn-primary-gradient"
                disabled={isProcessing}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Carte
              </Button>
            </div>
          </div>
        )}
      </div>

      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-8 text-center animate-scale-in max-w-sm w-full">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Paiement réussi !</h3>
            <p className="text-muted-foreground mb-4">
              Total: €{(lastSaleTotal * 1.2).toFixed(2)}
            </p>
            <Button onClick={() => setShowSuccess(false)} className="w-full">
              Nouvelle vente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
