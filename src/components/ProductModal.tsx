'use client'
import { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Wand2, Camera } from 'lucide-react';
import { generateBarcode } from '@/types/models';
import type { Product } from '@/types/models';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { BarcodeScanner } from './BarcodeScanner';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export const ProductModal = ({ isOpen, onClose, product }: ProductModalProps) => {
  const { addProduct, updateProduct } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lecture des catégories et unités depuis le store
  const rawCategories = useStore((s) => s.categories);
  const rawUnits = useStore((s) => s.units);

  // ── STABILISATION : useMemo garantit la même référence tant que le contenu
  // ne change pas, empêchant les re-renders inutiles du Select Radix ──
  const safeCategories = useMemo<string[]>(
    () => (Array.isArray(rawCategories) ? rawCategories : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(rawCategories)]
  );
  const safeUnits = useMemo<string[]>(
    () => (Array.isArray(rawUnits) ? rawUnits : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(rawUnits)]
  );

  // Refs pour accéder aux dernières valeurs dans l'effet sans les ajouter
  // comme dépendances (évite la boucle infinie useEffect → setState → re-render)
  const categoriesRef = useRef(safeCategories);
  const unitsRef = useRef(safeUnits);
  useEffect(() => { categoriesRef.current = safeCategories; }, [safeCategories]);
  useEffect(() => { unitsRef.current = safeUnits; }, [safeUnits]);

  const firstOf = (arr: string[]): string => (arr.length > 0 ? arr[0] : '');

  const getInitialForm = () => ({
    name: '',
    category: firstOf(categoriesRef.current),
    price: '',
    cost: '',
    quantity: '',
    minStock: '5',
    unit: firstOf(unitsRef.current),
    barcode: '',
  });

  const [formData, setFormData] = useState(getInitialForm);
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = (barcode: string) => {
    setFormData((prev) => ({ ...prev, barcode: barcode.trim() }));
    setShowScanner(false);
  };

  // ── Pré-remplit le formulaire quand la modal s'ouvre ou le produit change ──
  // Dépend UNIQUEMENT de `product` et `isOpen` (pas des tableaux de catégories/unités)
  useEffect(() => {
    if (!isOpen) return;

    if (product) {
      // Mode édition : pré-remplit avec les données du produit existant
      setFormData({
        name: product.name,
        category: product.category || firstOf(categoriesRef.current),
        price: product.price.toString(),
        cost: product.cost.toString(),
        quantity: product.quantity.toString(),
        minStock: product.minStock.toString(),
        unit: product.unit || firstOf(unitsRef.current),
        barcode: product.barcode,
      });
    } else {
      // Mode création : reset avec valeurs par défaut sûres
      setFormData(getInitialForm());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, isOpen]);

  // ── Quand les catégories/unités arrivent du store (async), met à jour
  // les valeurs vides du formulaire pour choisir un défaut correct ──
  useEffect(() => {
    setFormData((prev) => {
      const updates: Partial<typeof prev> = {};
      if (!prev.category && safeCategories.length > 0) {
        updates.category = safeCategories[0];
      }
      if (!prev.unit && safeUnits.length > 0) {
        updates.unit = safeUnits[0];
      }
      // Ne pas setState si rien ne change (évite re-render inutile)
      if (Object.keys(updates).length === 0) return prev;
      return { ...prev, ...updates };
    });
  }, [safeCategories, safeUnits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.cost) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);

    const productData = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      quantity: parseInt(formData.quantity) || 0,
      minStock: parseInt(formData.minStock) || 5,
      unit: formData.unit,
      barcode: formData.barcode || generateBarcode(),
    };

    try {
      if (product) {
        await updateProduct(product.id, productData);
        toast.success('Produit mis à jour');
      } else {
        const newProduct = await addProduct(productData);
        toast.success(`Produit créé — code barre: ${newProduct.barcode}`);
      }
      onClose();
    } catch (error) {
      toast.error('Une erreur est survenue');
      console.error('[ProductModal] handleSubmit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">
            {product ? 'Modifier le produit' : 'Nouveau produit'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom du produit *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="input-modern"
              placeholder="Ex: iPhone 15 Pro"
            />
          </div>

          {/* Catégorie + Unité */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              {safeCategories.length > 0 ? (
                <Select
                  value={formData.category || undefined}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger className="input-modern">
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {safeCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={formData.category || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="input-modern"
                  placeholder="Ex: Électronique"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unité</Label>
              {safeUnits.length > 0 ? (
                <Select
                  value={formData.unit || undefined}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, unit: value }))
                  }
                >
                  <SelectTrigger className="input-modern">
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {safeUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={formData.unit || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                  className="input-modern"
                  placeholder="Ex: pièce"
                />
              )}
            </div>
          </div>

          {/* Prix */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Prix de vente (FDJ) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                className="input-modern"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Prix d&apos;achat (FDJ) *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData((prev) => ({ ...prev, cost: e.target.value }))}
                className="input-modern"
                placeholder="0"
              />
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité initiale</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                className="input-modern"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Stock minimum</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData((prev) => ({ ...prev, minStock: e.target.value }))}
                className="input-modern"
                placeholder="5"
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1 btn-primary-gradient" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : product ? 'Enregistrer' : 'Créer le produit'}
            </Button>
          </div>

          {/* Code-barres */}
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="barcode">Code-barres (laisser vide pour auto-générer)</Label>
            <div className="flex gap-2">
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
                className="input-modern flex-1"
                placeholder="Scanner ou saisir manuellement"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData((prev) => ({ ...prev, barcode: generateBarcode() }))}
                title="Générer un code-barres"
              >
                <Wand2 className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowScanner(true)}
                title="Scanner avec la caméra"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>

        {/* Scanner caméra */}
        {showScanner && (
          <BarcodeScanner
            onScan={handleScan}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>
    </div>
  );
};
