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
  Smartphone,
  Receipt,
  AlertCircle,
  Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Espèces', icon: Banknote, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  { id: 'd-money', label: 'D-Money', icon: Smartphone, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  { id: 'waafi', label: 'WAAFI', icon: Smartphone, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  { id: 'cac-pay', label: 'CAC PAY', icon: Smartphone, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { id: 'saba-pay', label: 'SABA PAY', icon: Smartphone, color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
  { id: 'card', label: 'Carte', icon: CreditCard, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
] as const;

const POS = () => {
  const router = useRouter();
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
    vatRate
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // New State for Advanced Cart
  const [discount, setDiscount] = useState<string>(''); // as string for input handling
  const [amountGiven, setAmountGiven] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Calculations
  const totalBrut = getCartTotal();
  const vatAmount = totalBrut * (vatRate / 100);
  const totalWithTax = totalBrut + vatAmount;
  const discountValues = parseFloat(discount) || 0;
  const totalFinal = Math.max(0, totalWithTax - discountValues);
  const amountGivenValue = parseFloat(amountGiven) || 0;
  const change = Math.max(0, amountGivenValue - totalFinal);
  const isAmountValid = amountGivenValue >= totalFinal;

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

  const handleInitiateSale = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    // Auto-fill amount given if not set (for exact change scenario convenience)
    if (!amountGiven) {
      setAmountGiven(totalFinal.toString());
    }
    setShowConfirmation(true);
  };

  const handleConfirmSale = async () => {
    if (!selectedPaymentMethod) return;
    if (amountGivenValue < totalFinal) {
      toast.error("Montant donné insuffisant");
      return;
    }

    setIsProcessing(true);
    try {
      const sale = await completeSale(
        selectedPaymentMethod as any,
        discountValues,
        amountGivenValue
      );
      if (sale) {
        setShowConfirmation(false);
        setDiscount('');
        setAmountGiven('');
        setSelectedPaymentMethod(null);
        toast.success("Vente enregistrée avec succès");
        // Redirect to receipt
        router.push(`/receipt/${sale.id}`);
      }
    } catch (e) {
      toast.error('Erreur lors de la vente');
      console.error(e);
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

  const QuickAmountButton = ({ value }: { value: number }) => (
    <Button
      variant="outline"
      size="sm"
      className="h-8 text-xs"
      onClick={() => setAmountGiven(value.toString())}
    >
      {value}
    </Button>
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 animate-fade-in overflow-hidden">
      {/* Products Section */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Search Bar */}
        <div className="flex gap-3 mb-4 bg-background z-10">
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
            className="h-11 w-11 shrink-0 bg-background"
            onClick={() => setShowScanner(true)}
          >
            <Camera className="w-5 h-5" />
          </Button>
        </div>

        <div className="relative mb-4 bg-background z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Scrollable Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2 pb-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleAddProduct(product.id)}
                disabled={product.quantity <= 0}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all duration-200 flex flex-col h-full',
                  product.quantity <= 0
                    ? 'bg-muted border-border opacity-50 cursor-not-allowed'
                    : 'bg-card border-border hover:border-primary hover:shadow-lg active:scale-95'
                )}
              >
                <div className="flex-1">
                  <p className="font-medium line-clamp-2 mb-2 text-sm">{product.name}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary">{product.price.toFixed(0)} <span className="text-xs font-normal text-muted-foreground">FDJ</span></p>
                  <div className="flex justify-between items-center mt-2">
                    <p className={cn(
                      'text-xs',
                      product.quantity <= product.minStock
                        ? 'text-orange-500 font-medium'
                        : 'text-muted-foreground'
                    )}>
                      Stock: {product.quantity}
                    </p>
                    <span className="text-xs bg-muted px-2 py-1 rounded-md">{product.category}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section - Fixed Width */}
      <div className="w-full lg:w-[400px] flex flex-col bg-card rounded-2xl border border-border shadow-md h-full overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-card z-10">
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
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive h-8 px-2">
              <Trash2 className="w-4 h-4 mr-1" /> Vider
            </Button>
          )}
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <ShoppingCart className="w-16 h-16 mb-4 stroke-1" />
              <p className="font-medium">Votre panier est vide</p>
              <p className="text-sm">Ajoutez des produits pour commencer</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex flex-col p-3 bg-muted/30 rounded-xl border border-border/50">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-sm line-clamp-2 pr-2">{item.product.name}</p>
                  <p className="font-bold whitespace-nowrap">
                    {(item.product.price * item.quantity).toFixed(0)} FDJ
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {item.product.price} × {item.quantity}
                  </p>
                  <div className="flex items-center gap-2 bg-background rounded-lg border border-border p-0.5 shadow-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md hover:bg-muted"
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md hover:bg-muted"
                      onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.quantity}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sticky Cart Footer - Totals & Actions */}
        {cart.length > 0 && (
          <div className="bg-card border-t border-border p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
            {/* Discount & Calculations */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Brut</span>
                <span>{totalBrut.toFixed(0)} FDJ</span>
              </div>
              {vatRate > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">TVA ({vatRate}%)</span>
                  <span>{vatAmount.toFixed(0)} FDJ</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">remise (FDJ)</span>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="h-7 w-24 text-right text-sm"
                  placeholder="0"
                />
              </div>
              <div className="flex justify-between items-center text-xl font-bold pt-2 border-t border-dashed">
                <span>A Payer</span>
                <span className="text-primary">{totalFinal.toFixed(0)} FDJ</span>
              </div>

              {/* Montant Donné Input */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-muted-foreground">Montant Reçu</label>
                  <div className="flex gap-1">
                    <QuickAmountButton value={Math.ceil(totalFinal / 500) * 500} />
                    <QuickAmountButton value={Math.ceil(totalFinal / 1000) * 1000} />
                    <QuickAmountButton value={totalFinal} />
                  </div>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    value={amountGiven}
                    onChange={(e) => setAmountGiven(e.target.value)}
                    className={cn(
                      "pl-8 font-bold text-lg",
                      !isAmountValid && amountGiven ? "border-destructive focus-visible:ring-destructive" : ""
                    )}
                    placeholder="Montant donné par le client"
                  />
                  <Banknote className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                {amountGivenValue > 0 && (
                  <div className="flex justify-between items-center mt-2 px-1">
                    <span className="text-sm font-medium">Reste à rendre</span>
                    <span className={cn(
                      "font-bold text-lg",
                      change > 0 ? "text-green-600" : "text-muted-foreground"
                    )}>{change.toFixed(0)} FDJ</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Methods Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {PAYMENT_METHODS.map((method) => (
                <Button
                  key={method.id}
                  variant="outline"
                  className={cn(
                    "h-12 justify-start px-3 py-2 border-2",
                    method.color,
                    "border-transparent hover:border-current"
                  )}
                  onClick={() => handleInitiateSale(method.id)}
                  disabled={!isAmountValid || isProcessing}
                >
                  <method.icon className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate text-xs font-semibold">{method.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {/* Confirmation Modal */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la vente</DialogTitle>
            <DialogDescription>Vérifiez les détails avant de valider.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total produits</span>
                <span className="font-medium">{cart.reduce((acc, i) => acc + i.quantity, 0)} articles</span>
              </div>
              <div className="flex justify-between">
                <span>Total Brut</span>
                <span>{totalBrut.toFixed(0)} FDJ</span>
              </div>
              <div className="flex justify-between">
                <span>TVA ({vatRate}%)</span>
                <span>{vatAmount.toFixed(0)} FDJ</span>
              </div>
              {discountValues > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Remise</span>
                  <span>-{discountValues.toFixed(0)} FDJ</span>
                </div>
              )}
              <div className="border-t border-dashed pt-2 flex justify-between font-bold text-lg">
                <span>Total à Payer</span>
                <span>{totalFinal.toFixed(0)} FDJ</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Mode de paiement</p>
                <p className="font-semibold flex items-center gap-2">
                  {PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod)?.label}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Reste à rendre</p>
                <p className="font-semibold text-green-600">{change.toFixed(0)} FDJ</p>
              </div>
            </div>

            {amountGivenValue < totalFinal && (
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4" />
                Attention: Montant donné insuffisant
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>Annuler</Button>
            <Button
              onClick={handleConfirmSale}
              className="btn-primary-gradient w-full sm:w-auto"
              disabled={amountGivenValue < totalFinal || isProcessing}
            >
              {isProcessing ? 'Validation...' : 'Confirmer et Imprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POS;
