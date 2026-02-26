'use client'
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Printer,
  Package,
  Filter,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductModal } from '@/components/ProductModal';
import { BarcodeSticker } from '@/components/BarcodeSticker';
import type { Product } from '@/types/models';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Products = () => {
  const { products, deleteProduct, categories } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [printingProduct, setPrintingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery);
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Produits</h1>
          <p className="text-muted-foreground mt-1">{products.length} produits au total</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="btn-primary-gradient">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Produit
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

          <Input
            placeholder="Rechercher par nom ou code barre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48 input-modern">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun produit trouvé</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || categoryFilter !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Commencez par ajouter votre premier produit'}
          </p>
          {!searchQuery && categoryFilter === 'all' && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un produit
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="bg-card rounded-2xl border border-border p-5 card-hover animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium',
                    product.quantity <= product.minStock
                      ? 'bg-orange-500/10 text-orange-500'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  {product.category}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(product)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPrintingProduct(product)}>
                      <Printer className="w-4 h-4 mr-2" />
                      Imprimer étiquette
                    </DropdownMenuItem>
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Supprimer le produit ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Le produit
                          <span className="font-semibold"> {product.name} </span>
                          sera définitivement supprimé.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteProduct(product.id)}
                          className="bg-destructive text-white hover:bg-destructive/90"
                        >
                          Supprimer définitivement
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 font-mono">{product.barcode}</p>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">{product.price.toFixed(0)} FDJ</p>
                  <p className="text-xs text-muted-foreground">Coût: {product.cost.toFixed(0)} FDJ</p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'text-lg font-bold',
                      product.quantity <= product.minStock
                        ? product.quantity === 0
                          ? 'text-destructive'
                          : 'text-orange-500'
                        : 'text-foreground'
                    )}
                  >
                    {product.quantity}
                  </p>
                  <p className="text-xs text-muted-foreground">{product.unit}</p>
                </div>
              </div>

              {product.quantity <= product.minStock && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p
                    className={cn(
                      'text-xs flex items-center gap-1',
                      product.quantity === 0 ? 'text-destructive' : 'text-orange-500'
                    )}
                  >
                    {product.quantity === 0 ? '⚠️ Rupture de stock' : '⚠️ Stock faible'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ProductModal isOpen={isModalOpen} onClose={handleCloseModal} product={editingProduct} />

      {printingProduct && (
        <BarcodeSticker product={printingProduct} onClose={() => setPrintingProduct(null)} />
      )}
    </div>
  );
};

export default Products;
