'use client';
import { ShoppingCart, Package, BarChart3, RefreshCw, WifiOff, Shield, CheckCircle } from 'lucide-react';

const FlowStep = ({ num, label, sub, color = 'bg-primary' }: { num: string; label: string; sub?: string; color?: string }) => (
  <div className="flex flex-col items-center text-center gap-1 min-w-[80px]">
    <div className={`w-10 h-10 rounded-full ${color} text-white flex items-center justify-center font-bold text-sm shadow`}>{num}</div>
    <p className="text-xs font-semibold leading-tight">{label}</p>
    {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
  </div>
);

const Arrow = () => <div className="text-gray-300 text-xl self-center pb-4">→</div>;

export default function ExplainScreen() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/90 to-primary text-white p-8 shadow-lg">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Comment fonctionne StockPro ?</h1>
        <p className="text-white/80 text-lg">Tout ce que vous devez savoir en quelques minutes, sans termes techniques.</p>
      </div>

      {/* Analogy */}
      <section className="bg-white rounded-2xl border shadow-sm p-6 space-y-3">
        <h2 className="text-xl font-bold">🏪 Imaginez votre boutique idéale…</h2>
        <p className="text-gray-600">
          StockPro, c'est comme avoir un <strong>assistant de confiance</strong> qui travaille avec vous 24h/24.
          Il note chaque vente, suit votre stock, calcule vos bénéfices et vous alerte quand un produit manque — le tout automatiquement.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">📔</div>
            <p className="font-semibold text-sm">Avant StockPro</p>
            <p className="text-xs text-gray-500 mt-1">Cahier papier, calculs manuels, erreurs fréquentes, perte de données</p>
          </div>
          <div className="flex items-center justify-center text-3xl text-gray-300">→</div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">📱</div>
            <p className="font-semibold text-sm">Avec StockPro</p>
            <p className="text-xs text-gray-500 mt-1">Tout automatique, rapports en 1 clic, accessible partout</p>
          </div>
        </div>
      </section>

      {/* The 3 pillars */}
      <section className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold">🔑 Les 3 choses que fait StockPro pour vous</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border p-4 space-y-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-purple-600" /></div>
            <p className="font-semibold">1. Encaisser les ventes</p>
            <p className="text-sm text-gray-500">Comme une caisse enregistreuse, mais en mieux : il calcule automatiquement la monnaie, la TVA et imprime le reçu.</p>
          </div>
          <div className="rounded-xl border p-4 space-y-2">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center"><Package className="w-5 h-5 text-orange-600" /></div>
            <p className="font-semibold">2. Suivre votre stock</p>
            <p className="text-sm text-gray-500">Chaque vente retire automatiquement du stock. Vous savez toujours ce qu'il vous reste, et vous êtes alerté quand c'est bas.</p>
          </div>
          <div className="rounded-xl border p-4 space-y-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><BarChart3 className="w-5 h-5 text-indigo-600" /></div>
            <p className="font-semibold">3. Calculer vos gains</p>
            <p className="text-sm text-gray-500">Il calcule votre chiffre d'affaires, votre bénéfice et vos marges — sans que vous fassiez un seul calcul.</p>
          </div>
        </div>
      </section>

      {/* Sale flow */}
      <section className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold">🛒 Comment se passe une vente ?</h2>
        <p className="text-gray-500 text-sm">Du moment où le client arrive jusqu'au reçu — voici ce qui se passe :</p>
        <div className="overflow-x-auto">
          <div className="flex gap-2 items-start min-w-max py-2">
            <FlowStep num="1" label="Client arrive" sub="Vous ouvrez le POS" color="bg-purple-500" />
            <Arrow />
            <FlowStep num="2" label="Scan ou recherche" sub="Par nom ou code-barres" color="bg-blue-500" />
            <Arrow />
            <FlowStep num="3" label="Ajout panier" sub="Quantités ajustables" color="bg-cyan-500" />
            <Arrow />
            <FlowStep num="4" label="Calcul auto" sub="TVA + remise" color="bg-teal-500" />
            <Arrow />
            <FlowStep num="5" label="Paiement" sub="6 modes disponibles" color="bg-green-500" />
            <Arrow />
            <FlowStep num="6" label="Reçu imprimé" sub="+ Stock mis à jour" color="bg-primary" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
          ✅ <strong>Résultat :</strong> La vente est enregistrée, le stock est déduit, le reçu est prêt — tout ça en moins de 30 secondes.
        </div>
      </section>

      {/* Data flow simple */}
      <section className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold">☁️ Où sont stockées vos données ?</h2>
        <p className="text-gray-500 text-sm">Vos données vivent à deux endroits :</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <p className="font-semibold text-blue-700">📱 Sur votre appareil</p>
            <p className="text-sm text-gray-600">Une copie locale pour que l'application soit ultra-rapide et fonctionne <strong>même sans internet</strong>.</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
            <p className="font-semibold text-indigo-700">🌐 Dans le cloud (Supabase)</p>
            <p className="text-sm text-gray-600">La vraie base de données sécurisée. Accessible depuis <strong>n'importe quel appareil</strong> connecté à votre compte.</p>
          </div>
        </div>
        <div className="bg-gray-50 border rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Ce qui se passe quand vous faites une vente :</p>
          <div className="space-y-2 text-sm">
            {[
              { icon: '⚡', label: 'Instantané', desc: 'L\'affichage se met à jour immédiatement sur votre écran' },
              { icon: '📤', label: 'En arrière-plan', desc: 'La vente est envoyée automatiquement vers le cloud' },
              { icon: '🔒', label: 'Sécurisé', desc: 'Une transaction protège toutes les données : impossible d\'enregistrer à moitié' },
            ].map(s => (
              <div key={s.label} className="flex gap-3">
                <span className="text-lg">{s.icon}</span>
                <div><span className="font-medium">{s.label} : </span><span className="text-gray-600">{s.desc}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offline */}
      <section className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2"><WifiOff className="w-5 h-5 text-orange-500" /> Et si vous perdez internet ?</h2>
        <p className="text-gray-600 text-sm">Pas de panique ! StockPro continue de fonctionner normalement.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-green-700 mb-2">Ce que vous pouvez faire :</p>
            <ul className="text-sm space-y-1 text-gray-600">
              {['Faire des ventes', 'Chercher des produits', 'Gérer le stock', 'Consulter les rapports'].map(i => (
                <li key={i} className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />{i}</li>
              ))}
            </ul>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-orange-700 mb-1">🔄 Au retour de la connexion :</p>
            <p className="text-sm text-gray-600">Toutes les opérations faites hors-ligne sont automatiquement envoyées au cloud. Vous ne perdez rien.</p>
          </div>
        </div>
      </section>

      {/* Returns */}
      <section className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2"><RefreshCw className="w-5 h-5 text-rose-500" /> Les retours clients</h2>
        <p className="text-gray-600 text-sm">Un client rapporte un produit ? StockPro gère tout :</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-sm">
          <div className="bg-gray-50 border rounded-xl p-4">
            <div className="text-2xl mb-2">🔍</div>
            <p className="font-semibold">1. Retrouver la vente</p>
            <p className="text-gray-500 text-xs mt-1">Via le numéro du ticket (8 premiers caractères)</p>
          </div>
          <div className="bg-gray-50 border rounded-xl p-4">
            <div className="text-2xl mb-2">✅</div>
            <p className="font-semibold">2. Valider le retour</p>
            <p className="text-gray-500 text-xs mt-1">Quantité retournée et produit sélectionné</p>
          </div>
          <div className="bg-gray-50 border rounded-xl p-4">
            <div className="text-2xl mb-2">⚙️</div>
            <p className="font-semibold">3. Tout automatique</p>
            <p className="text-gray-500 text-xs mt-1">Stock remis + CA déduit + ticket de retour créé</p>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-red-500" /> La protection du propriétaire</h2>
        <p className="text-gray-600 text-sm">Vous pouvez protéger vos <strong>rapports financiers</strong> avec un code PIN de 4 à 6 chiffres.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
            <p className="font-semibold text-red-700 mb-1">🔐 Avec PIN actif :</p>
            <p className="text-gray-600">Seul le propriétaire peut voir le chiffre d'affaires, les bénéfices et les marges. Les vendeurs ne peuvent pas accéder à ces données.</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm">
            <p className="font-semibold text-green-700 mb-1">☁️ PIN synchronisé :</p>
            <p className="text-gray-600">Le PIN est sauvegardé dans le cloud. Il fonctionne sur tous vos appareils (téléphone, tablette, PC).</p>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold">👥 Les rôles dans la boutique</h2>
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-gray-100"><th className="text-left p-3 rounded-l">Rôle</th><th className="text-left p-3">Ce qu'il peut faire</th><th className="text-left p-3 rounded-r">Ce qu'il ne peut pas faire</th></tr></thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="p-3 font-semibold text-primary">Propriétaire (Admin)</td>
              <td className="p-3 text-gray-600">Tout : ventes, stock, produits, rapports, paramètres, PIN</td>
              <td className="p-3 text-gray-400">—</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-gray-600">Vendeur</td>
              <td className="p-3 text-gray-600">Ventes, stock, produits, historique</td>
              <td className="p-3 text-gray-500">Rapports financiers (si PIN actif)</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Summary */}
      <section className="rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-white p-6 space-y-4">
        <h2 className="text-xl font-bold">📌 En résumé</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { icon: '🚀', t: 'Ultra-rapide', d: 'L\'affichage est instantané, pas besoin d\'attendre le serveur' },
            { icon: '🔒', t: 'Sécurisé', d: 'Données protégées dans le cloud, PIN pour les données sensibles' },
            { icon: '📶', t: 'Offline', d: 'Fonctionne sans internet, synchronisation automatique au retour' },
            { icon: '📊', t: 'Précis', d: 'Bénéfices, marges, TVA calculés automatiquement et exacts' },
            { icon: '🖨️', t: 'Reçus', d: 'Ticket imprimable pour chaque vente et chaque retour' },
            { icon: '📱', t: 'Partout', d: 'PC, tablette, téléphone — même compte, même données' },
          ].map(f => (
            <div key={f.t} className="flex gap-3 bg-white/10 rounded-xl p-3">
              <span className="text-2xl">{f.icon}</span>
              <div><p className="font-semibold">{f.t}</p><p className="text-white/70 text-xs">{f.d}</p></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
