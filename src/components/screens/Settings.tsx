import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { Package, Palette, Bell, Database, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const Settings = () => {
  const { user, fullName, role, signOut } = useAuth();
  const { isLoading, isSyncing, lastSyncAt, loadData } = useStore();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(fullName || '');

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: newName.trim() })
      .eq('id', user?.id);
    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success("Nom mis à jour");
      setEditingName(false);
    }
  };

  const handleRefreshData = async () => {
    await loadData();
    toast.success("Données rafraîchies");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground mt-1">Configuration de l'application</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Profil</h2>
              <p className="text-sm text-muted-foreground">Vos informations personnelles</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Nom</p>
                {editingName ? (
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="h-8 w-48"
                    />
                    <Button size="sm" onClick={handleUpdateName}>Enregistrer</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>Annuler</Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{fullName || 'Non défini'}</p>
                )}
              </div>
              {!editingName && (
                <Button variant="outline" size="sm" onClick={() => { setNewName(fullName || ''); setEditingName(true); }}>
                  Modifier
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Rôle</p>
                <p className="text-sm text-muted-foreground capitalize">{role || 'Non défini'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium capitalize">{role || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* General */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="font-semibold">Configuration Boutique</h2>
              <p className="text-sm text-muted-foreground">Paramètres de vente</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Taux de TVA (%)</p>
                <p className="text-sm text-muted-foreground">Appliqué par défaut sur les ventes</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-24 text-right"
                  min="0"
                  max="100"
                  value={useStore((state: any) => state.vatRate || 0)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      useStore.getState().updateVatRate(val);
                    }
                  }}
                />
                <span className="text-sm font-medium">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {/* <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="font-semibold">Notifications</h2>
              <p className="text-sm text-muted-foreground">Gérez vos alertes</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Alerte stock faible</p>
                <p className="text-sm text-muted-foreground">Notification quand le stock est bas</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Nouvelles ventes</p>
                <p className="text-sm text-muted-foreground">Notification à chaque vente</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div> */}

        {/* Data & Sync */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-semibold">Données & Synchronisation</h2>
              <p className="text-sm text-muted-foreground">Gestion des données</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-dashed border-border">
              <p className="text-sm text-muted-foreground mb-1">
                Dernière synchronisation:{' '}
                {lastSyncAt
                  ? new Date(lastSyncAt).toLocaleString('fr-FR')
                  : 'Jamais'}
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                {isSyncing
                  ? 'Synchronisation en cours...'
                  : 'Les données sont stockées en ligne et disponibles hors ligne.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                disabled={isLoading}
              >
                Rafraîchir les données
              </Button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-card rounded-2xl border border-destructive/20 p-6">
          <h2 className="font-semibold text-destructive mb-4">Zone de danger</h2>
          <Button variant="destructive" onClick={signOut}>
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
