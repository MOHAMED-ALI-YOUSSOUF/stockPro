'use client';
import { useRef } from 'react';
import { Download, BookOpen, Shield, WifiOff, RotateCcw, Package, ShoppingCart, BarChart3, Settings, Scan, AlertTriangle } from 'lucide-react';

const sections = [
  {
    id: 'overview', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50',
    title: '1. Vue d\'ensemble',
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">StockPro est une application complète de gestion de boutique. Elle vous permet de vendre, gérer votre stock, analyser vos finances et travailler même sans internet.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { icon: '🛒', label: 'Caisse (POS)', desc: 'Ventes rapides avec scan code-barres' },
            { icon: '📦', label: 'Stock', desc: 'Entrées, sorties, alertes automatiques' },
            { icon: '📊', label: 'Rapports', desc: 'CA, TVA, bénéfice, marges' },
            { icon: '🔄', label: 'Retours', desc: 'Remboursement & restitution stock' },
            { icon: '📱', label: 'Offline', desc: 'Fonctionne sans connexion' },
            { icon: '🔐', label: 'Sécurité', desc: 'PIN propriétaire pour données sensibles' },
          ].map(f => (
            <div key={f.label} className="bg-gray-50 rounded-xl p-3 border">
              <div className="text-2xl mb-1">{f.icon}</div>
              <p className="font-semibold text-sm">{f.label}</p>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'start', icon: Package, color: 'text-green-600', bg: 'bg-green-50',
    title: '2. Par où commencer ?',
    content: (
      <div className="space-y-3">
        {[
          { step: '1', title: 'Configurer la boutique', desc: 'Paramètres → Nom, adresse, téléphone, TVA, catégories, unités. Ces infos apparaissent sur vos reçus.' },
          { step: '2', title: 'Définir un code PIN', desc: 'Paramètres → Sécurité → "Définir un code PIN" (4 à 6 chiffres). Protège vos rapports financiers.' },
          { step: '3', title: 'Ajouter vos produits', desc: 'Produits → Ajouter. Saisissez : nom, catégorie, prix de vente, prix d\'achat, quantité, seuil d\'alerte.' },
          { step: '4', title: 'Commencer à vendre', desc: 'Allez dans POS → ajoutez des produits au panier → choisissez le paiement → confirmez.' },
        ].map(s => (
          <div key={s.step} className="flex gap-4 p-4 bg-gray-50 rounded-xl border">
            <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shrink-0">{s.step}</div>
            <div>
              <p className="font-semibold">{s.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          ⚠️ <strong>Important :</strong> Remplissez toujours le <strong>prix d'achat</strong> de chaque produit. Sans lui, vos bénéfices seront incorrects dans les rapports.
        </div>
      </div>
    ),
  },
  {
    id: 'pos', icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50',
    title: '3. Point de Vente (POS)',
    content: (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 border">
          <p className="font-semibold mb-3">Flux d'une vente :</p>
          <div className="flex flex-wrap gap-2 items-center text-sm">
            {['Chercher un produit', 'Cliquer pour ajouter', 'Ajuster quantité', 'Saisir remise (optionnel)', 'Entrer montant reçu', 'Choisir paiement', 'Confirmer → Reçu'].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-2">
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">{s}</span>
                {i < arr.length - 1 && <span className="text-gray-400">→</span>}
              </span>
            ))}
          </div>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-gray-100"><th className="text-left p-2 rounded-l">Champ</th><th className="text-left p-2 rounded-r">Description</th></tr></thead>
          <tbody>
            {[
              ['Total Brut', 'Somme prix × quantités avant TVA'],
              ['TVA (x%)', 'Calculée automatiquement selon votre taux'],
              ['Remise', 'Réduction accordée au client (en FDJ)'],
              ['À Payer', '(Brut + TVA) − Remise'],
              ['Montant Reçu', 'Ce que le client vous donne'],
              ['Reste à rendre', 'Monnaie = Reçu − À Payer'],
            ].map(([f, d]) => (
              <tr key={f} className="border-b border-gray-100">
                <td className="p-2 font-medium">{f}</td>
                <td className="p-2 text-gray-600">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {[
            { id: 'cash', label: '💵 Espèces' },
            { id: 'd-money', label: '📱 D-Money' },
            { id: 'waafi', label: '📱 WAAFI' },
            { id: 'cac-pay', label: '📱 CAC PAY' },
            { id: 'saba-pay', label: '📱 SABA PAY' },
            { id: 'card', label: '💳 Carte' },
          ].map(m => (
            <div key={m.id} className="bg-gray-50 border rounded-lg px-3 py-2 text-center font-medium">{m.label}</div>
          ))}
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
          💡 <strong>Astuce :</strong> Utilisez le scanner caméra (icône 📷 dans le POS) ou un pistolet USB pour ajouter des produits instantanément par code-barres.
        </div>
      </div>
    ),
  },
  {
    id: 'products', icon: Package, color: 'text-orange-600', bg: 'bg-orange-50',
    title: '4. Gestion des Produits',
    content: (
      <div className="space-y-4">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-gray-100"><th className="text-left p-2">Champ</th><th className="text-left p-2">Obligatoire</th><th className="text-left p-2">Description</th></tr></thead>
          <tbody>
            {[
              ['Nom', '✅', 'Affiché partout dans l\'app'],
              ['Code-barres', '❌', 'Généré auto si vide'],
              ['Catégorie', '✅', 'Parmi vos catégories paramétrées'],
              ['Unité', '✅', 'Pièce, kg, litre…'],
              ['Prix de vente', '✅', 'Ce que paye le client'],
              ['Prix d\'achat', '✅', 'Coût fournisseur — crucial pour les rapports'],
              ['Quantité initiale', '✅', 'Stock de départ'],
              ['Seuil minimum', '✅', 'Déclenche l\'alerte stock bas'],
            ].map(([f, r, d]) => (
              <tr key={f} className="border-b border-gray-100">
                <td className="p-2 font-medium">{f}</td>
                <td className="p-2">{r}</td>
                <td className="p-2 text-gray-600">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
          🚫 <strong>Attention :</strong> Ne supprimez pas un produit qui a des ventes. Mettez sa quantité à 0 à la place pour conserver l'historique.
        </div>
      </div>
    ),
  },
  {
    id: 'stock', icon: Package, color: 'text-teal-600', bg: 'bg-teal-50',
    title: '5. Mouvements de Stock',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="font-semibold text-green-700 mb-2">📥 Entrée (IN)</p>
            <p className="text-sm text-gray-600">Réapprovisionnement fournisseur, correction positive de stock.</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="font-semibold text-red-700 mb-2">📤 Sortie (OUT)</p>
            <p className="text-sm text-gray-600">Perte, casse, vol, don, usage interne.</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
          ℹ️ Les ventes POS <strong>ne passent pas</strong> par ce module. Ce module est uniquement pour les ajustements manuels.
        </div>
      </div>
    ),
  },
  {
    id: 'reports', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50',
    title: '6. Rapports Financiers',
    content: (
      <div className="space-y-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-sm text-indigo-800 mb-2">
          🔐 Page protégée par le <strong>code PIN propriétaire</strong>. Seul le propriétaire peut y accéder.
        </div>
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-gray-100"><th className="text-left p-2">Indicateur</th><th className="text-left p-2">Formule</th></tr></thead>
          <tbody>
            {[
              ['CA TTC', 'Total encaissé par les clients'],
              ['CA HT', 'CA brut − remises (avant TVA)'],
              ['TVA collectée', 'CA HT × taux TVA → à reverser aux impôts'],
              ['Bénéfice net', 'CA HT net − coût d\'achat net'],
              ['Marge %', 'Bénéfice / CA HT × 100'],
            ].map(([f, d]) => (
              <tr key={f} className="border-b border-gray-100">
                <td className="p-2 font-semibold">{f}</td>
                <td className="p-2 text-gray-600">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="font-bold text-red-600">&lt; 10%</p><p className="text-gray-600 text-xs mt-1">⚠️ Marge faible</p></div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3"><p className="font-bold text-yellow-600">10–30%</p><p className="text-gray-600 text-xs mt-1">✓ Correcte</p></div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3"><p className="font-bold text-green-600">&gt; 30%</p><p className="text-gray-600 text-xs mt-1">🟢 Excellente</p></div>
        </div>
        <p className="text-xs text-gray-500">* Tous les chiffres sont <strong>après déduction des retours clients</strong>.</p>
      </div>
    ),
  },
  {
    id: 'returns', icon: RotateCcw, color: 'text-rose-600', bg: 'bg-rose-50',
    title: '7. Retours Clients',
    content: (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center text-sm">
          {['POS ou Historique', 'Section "Retour client"', 'ID du ticket (8 premiers caractères)', 'Sélectionner le produit', 'Saisir la quantité', 'Valider'].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-2">
              <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-lg">{s}</span>
              {i < arr.length - 1 && <span className="text-gray-400">→</span>}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gray-50 border rounded-xl p-3 text-sm">
            <p className="font-semibold mb-2">Ce qui se passe automatiquement :</p>
            <ul className="space-y-1 text-gray-600">
              <li>✅ Stock du produit : +quantité retournée</li>
              <li>✅ Statistiques de vente : −montant remboursé</li>
              <li>✅ Rapport CA : recalculé automatiquement</li>
              <li>✅ Ticket de retour créé (traçabilité)</li>
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            <p className="font-semibold mb-1">⚠️ Règles :</p>
            <ul className="space-y-1">
              <li>• Quantité retournée ≤ quantité achetée</li>
              <li>• Remboursement = même mode de paiement</li>
              <li>• Irréversible une fois validé</li>
              <li>• Toujours remettre un reçu au client</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'offline', icon: WifiOff, color: 'text-gray-600', bg: 'bg-gray-50',
    title: '8. Mode Hors-ligne',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold text-green-700 mb-2">✅ Possible hors-ligne</p>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Chercher et voir les produits</li>
              <li>• Faire des ventes</li>
              <li>• Entrées/sorties de stock</li>
              <li>• Voir les rapports (données en cache)</li>
              <li>• Historique des ventes</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-orange-700 mb-2">⚠️ Différent hors-ligne</p>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Données = dernière synchronisation</li>
              <li>• Ventes synchronisées en lot au retour</li>
              <li>• 2 appareils offline = décalages possibles</li>
            </ul>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
          💡 Pour forcer une synchronisation : rechargez la page une fois reconnecté à internet.
        </div>
      </div>
    ),
  },
  {
    id: 'security', icon: Shield, color: 'text-red-600', bg: 'bg-red-50',
    title: '9. Sécurité & PIN',
    content: (
      <div className="space-y-4">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-gray-100"><th className="text-left p-2">Action</th><th className="text-left p-2">Comment</th></tr></thead>
          <tbody>
            {[
              ['Créer un PIN', 'Paramètres → Sécurité → "Définir un code PIN"'],
              ['Modifier le PIN', 'Vérification du PIN actuel obligatoire'],
              ['Désactiver le PIN', 'Confirmer le PIN actuel → Désactiver'],
            ].map(([a, c]) => (
              <tr key={a} className="border-b border-gray-100">
                <td className="p-2 font-medium">{a}</td>
                <td className="p-2 text-gray-600">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
          🚫 <strong>Ne partagez jamais votre PIN avec vos vendeurs.</strong> Si vous l'oubliez, vous perdez l'accès aux rapports. Notez-le dans un endroit sûr.
        </div>
      </div>
    ),
  },
  {
    id: 'donts', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50',
    title: '10. Ce qu\'il ne faut jamais faire',
    content: (
      <div className="space-y-3">
        {[
          { action: 'Supprimer un produit avec des ventes', risk: 'Perte de l\'historique', alt: 'Mettre quantité à 0' },
          { action: 'Partager le PIN avec les vendeurs', risk: 'Accès aux données financières', alt: 'Garder le PIN secret' },
          { action: 'Laisser une vente à moitié faite', risk: 'Données incohérentes', alt: 'Finaliser ou vider le panier' },
          { action: 'Mettre le prix d\'achat à 0', risk: 'Bénéfices gonflés artificiellement', alt: 'Toujours saisir le vrai coût' },
          { action: 'Ne pas configurer le seuil minimum', risk: 'Jamais d\'alerte stock bas', alt: 'Définir un seuil réaliste' },
          { action: 'Fermer le navigateur pendant une vente', risk: 'Transaction incomplète', alt: 'Attendre "Vente enregistrée"' },
        ].map(r => (
          <div key={r.action} className="flex gap-3 p-3 bg-gray-50 rounded-xl border text-sm">
            <span className="text-red-500 text-lg shrink-0">❌</span>
            <div className="flex-1">
              <p className="font-semibold">{r.action}</p>
              <p className="text-gray-500">Risque : {r.risk}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-green-700 text-xs bg-green-50 border border-green-200 px-2 py-1 rounded-lg">✓ {r.alt}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'settings', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-100',
    title: '11. Paramètres',
    content: (
      <div className="space-y-3 text-sm">
        {[
          { name: 'Informations boutique', desc: 'Nom, adresse, téléphone → apparaissent sur tous les reçus.' },
          { name: 'Catégories produits', desc: 'Vos catégories personnalisées utilisées comme filtres.' },
          { name: 'Unités de mesure', desc: 'Pièce, kg, litre… disponibles dans les formulaires produits.' },
          { name: 'Fiscalité (TVA)', desc: 'Taux par défaut appliqué à chaque vente. Les anciennes ventes conservent leur taux d\'origine.' },
          { name: 'Sécurité (PIN)', desc: 'Code propriétaire pour protéger l\'accès aux rapports.' },
        ].map(s => (
          <div key={s.name} className="flex gap-3 p-3 bg-gray-50 rounded-xl border">
            <div className="w-2 bg-gray-400 rounded-full shrink-0" />
            <div>
              <p className="font-semibold">{s.name}</p>
              <p className="text-gray-500">{s.desc}</p>
            </div>
          </div>
        ))}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800">
          ⚠️ Cliquez toujours sur <strong>"Sauvegarder les modifications"</strong> après avoir changé vos paramètres.
        </div>
      </div>
    ),
  },
  {
    id: 'barcode', icon: Scan, color: 'text-cyan-600', bg: 'bg-cyan-50',
    title: '12. Codes-barres & Scanner',
    content: (
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 border rounded-xl p-4">
            <p className="font-semibold mb-2">📷 Scanner avec caméra</p>
            <ol className="space-y-1 text-gray-600 list-decimal list-inside">
              <li>Dans le POS, cliquer sur l'icône caméra</li>
              <li>Pointer la caméra vers le code-barres</li>
              <li>Produit ajouté automatiquement</li>
            </ol>
          </div>
          <div className="bg-gray-50 border rounded-xl p-4">
            <p className="font-semibold mb-2">🔫 Pistolet USB / Bluetooth</p>
            <ol className="space-y-1 text-gray-600 list-decimal list-inside">
              <li>Cliquer dans le champ code-barres du POS</li>
              <li>Scanner le produit</li>
              <li>Appuyer sur Entrée → produit ajouté</li>
            </ol>
          </div>
        </div>
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-cyan-800">
          💡 Si vous ne renseignez pas de code-barres lors de la création d'un produit, l'application en génère un automatiquement au format EAN-13.
        </div>
      </div>
    ),
  },
];

export default function GuideScreen() {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" />
            Guide Complet StockPro
          </h1>
          <p className="text-muted-foreground mt-1">Documentation complète — Architecture, fonctionnalités & bonnes pratiques</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow hover:shadow-md shrink-0 print:hidden"
        >
          <Download className="w-4 h-4" />
          Télécharger PDF
        </button>
      </div>

      {/* TOC */}
      <nav className="bg-gray-50 border rounded-2xl p-5 print:hidden">
        <p className="text-sm font-semibold text-gray-700 mb-3">Table des matières</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {sections.map(s => (
            <a key={s.id} href={`#${s.id}`} className="text-sm text-primary hover:underline truncate">
              {s.title}
            </a>
          ))}
        </div>
      </nav>

      {/* Sections */}
      <div ref={contentRef} className="space-y-6">
        {sections.map(s => (
          <section key={s.id} id={s.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className={`flex items-center gap-3 p-5 border-b ${s.bg}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/70`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">{s.title}</h2>
            </div>
            <div className="p-5">{s.content}</div>
          </section>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pb-4 print:mt-8">
        StockPro Guide v1.0 · Mai 2026
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          aside, header, nav { display: none !important; }
          main { padding: 0 !important; }
          .print\\:hidden { display: none !important; }
          section { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
