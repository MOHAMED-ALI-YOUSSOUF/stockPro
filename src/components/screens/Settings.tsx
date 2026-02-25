"use client";

import { useStore } from "@/store/useStore";
import { useState, useEffect } from "react";
import {
  Store,
  Percent,
  Save,
  ShieldCheck,
  Smartphone,
  Phone,
  MapPin,
  Tag,
  Ruler,
  Trash2,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Settings() {
  const {
    storeName,
    vatRate,
    address,
    phone,
    categories,
    units,
    updateStoreSettings,
    isLoading,
  } = useStore();

  // ── State local pour le formulaire ────────────────────────────────────────
  const [name, setName] = useState(storeName ?? "");
  const [rate, setRate] = useState((vatRate ?? 0).toString());
  const [storeAddress, setStoreAddress] = useState(address ?? "");
  const [storePhone, setStorePhone] = useState(phone ?? "");

  // Protection : s'assure que categories et units sont toujours des tableaux
  const [storeCategories, setStoreCategories] = useState<string[]>(
    Array.isArray(categories) ? categories : []
  );
  const [storeUnits, setStoreUnits] = useState<string[]>(
    Array.isArray(units) ? units : []
  );

  const [isSaving, setIsSaving] = useState(false);

  // ── Synchronise le formulaire quand le store est mis à jour (ex. loadData) ─
  useEffect(() => {
    setName(storeName ?? "");
    setRate((vatRate ?? 0).toString());
    setStoreAddress(address ?? "");
    setStorePhone(phone ?? "");
    // Toujours un tableau, même si la valeur venant du store est null/undefined
    setStoreCategories(Array.isArray(categories) ? categories : []);
    setStoreUnits(Array.isArray(units) ? units : []);
  }, [storeName, vatRate, address, phone, categories, units]);

  // ── Sauvegarde — envoie TOUS les champs à updateStoreSettings ────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateStoreSettings({
        name,
        rate: parseFloat(rate) || 0,
        address: storeAddress,
        phone: storePhone,
        // Filtre les entrées vides avant de sauvegarder
        categories: storeCategories.filter((c) => c.trim() !== ""),
        units: storeUnits.filter((u) => u.trim() !== ""),
      });
      toast.success("Paramètres enregistrés !");
    } catch (error) {
      console.error("[Settings] handleSave error:", error);
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Helpers catégories ────────────────────────────────────────────────────
  const addCategory = () => setStoreCategories((prev) => [...prev, ""]);
  const updateCategory = (index: number, value: string) =>
    setStoreCategories((prev) =>
      prev.map((cat, i) => (i === index ? value : cat))
    );
  const removeCategory = (index: number) =>
    setStoreCategories((prev) => prev.filter((_, i) => i !== index));

  // ── Helpers unités ────────────────────────────────────────────────────────
  const addUnit = () => setStoreUnits((prev) => [...prev, ""]);
  const updateUnit = (index: number, value: string) =>
    setStoreUnits((prev) => prev.map((u, i) => (i === index ? value : u)));
  const removeUnit = (index: number) =>
    setStoreUnits((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Paramètres
        </h1>
        <p className="text-muted-foreground">
          Gérez les informations de votre boutique et vos préférences
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── Informations boutique ─────────────────────────────────────── */}
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/50 border-b">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Informations de la Boutique</CardTitle>
                <CardDescription>
                  Ces informations apparaîtront sur vos reçus de vente
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="storeName" className="text-sm font-semibold">
                Nom de la Boutique
              </Label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="storeName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ma Super Boutique"
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Adresse */}
            <div className="space-y-2">
              <Label htmlFor="storeAddress" className="text-sm font-semibold">
                Adresse
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="storeAddress"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  placeholder="Ex: Rue de la Paix, Djibouti-Ville"
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="storePhone" className="text-sm font-semibold">
                Téléphone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="storePhone"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="+253 XX XX XX XX"
                  className="pl-10 h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Catégories produit ────────────────────────────────────────── */}
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/50 border-b">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Catégories Produits</CardTitle>
                <CardDescription>
                  Utilisées dans le formulaire produit et les filtres
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {storeCategories.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Aucune catégorie. Cliquez sur &quot;Ajouter&quot; pour en créer une.
              </p>
            )}
            {storeCategories.map((cat, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={cat}
                  onChange={(e) => updateCategory(index, e.target.value)}
                  placeholder={`Catégorie ${index + 1}`}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeCategory(index)}
                  title="Supprimer cette catégorie"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCategory}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter une catégorie
            </Button>
          </CardContent>
        </Card>

        {/* ── Unités de mesure ──────────────────────────────────────────── */}
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/50 border-b">
            <div className="flex items-center gap-2">
              <Ruler className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Unités de Mesure</CardTitle>
                <CardDescription>
                  Unités disponibles dans le formulaire produit
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {storeUnits.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Aucune unité. Cliquez sur &quot;Ajouter&quot; pour en créer une.
              </p>
            )}
            {storeUnits.map((unit, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={unit}
                  onChange={(e) => updateUnit(index, e.target.value)}
                  placeholder={`Ex: pièce, kg, litre…`}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeUnit(index)}
                  title="Supprimer cette unité"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addUnit}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter une unité
            </Button>
          </CardContent>
        </Card>

        {/* ── Fiscalité (TVA) ───────────────────────────────────────────── */}
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/50 border-b">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-blue-500" />
              <div>
                <CardTitle className="text-lg">Fiscalité</CardTitle>
                <CardDescription>
                  Configurez votre taux de TVA par défaut
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2 max-w-[200px]">
              <Label htmlFor="vatRate" className="text-sm font-semibold">
                Taux de TVA par défaut (%)
              </Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="vatRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Appliqué automatiquement à chaque nouvelle vente.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Info cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 flex gap-4">
              <div className="p-2 bg-primary/10 rounded-lg h-fit">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Données sécurisées</p>
                <p className="text-xs text-muted-foreground">
                  Vos paramètres sont synchronisés avec votre compte Supabase.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-4 flex gap-4">
              <div className="p-2 bg-blue-100 rounded-lg h-fit">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-blue-700">Mode Hors-ligne</p>
                <p className="text-xs text-blue-600/80">
                  Les modifications sont enregistrées localement si vous perdez la connexion.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Bouton Sauvegarder ────────────────────────────────────────── */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={isSaving || isLoading}
            className="w-full md:w-auto px-8 py-6 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
          >
            {isSaving ? (
              "Enregistrement..."
            ) : (
              <>
                <Save className="w-5 h-5" />
                Sauvegarder les modifications
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
