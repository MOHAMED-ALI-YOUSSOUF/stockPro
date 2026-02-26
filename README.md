# StockPro - Système de Gestion de Stock & POS

StockPro est une application web moderne et performante (PWA) conçue pour la gestion d'inventaire, le suivi des mouvements de stock et les opérations de point de vente (POS). Elle fonctionne en mode **hors-ligne** et se synchronise automatiquement avec **Supabase** dès que la connexion est rétablie.

## 🚀 Fonctionnalités Clés

- **📦 Gestion d'Inventaire** : Ajoutez, modifiez et suivez vos produits avec des catégories et unités personnalisables.
- **🛒 Point de Vente (POS)** : Interface de vente rapide avec gestion des remises, de la TVA et de multiples modes de paiement (Cash, D-Money, WAAFI, etc.).
- **📊 Tableau de Bord Dynamique** : Visualisez vos ventes mensuelles, la valeur totale de votre stock et soyez alerté des ruptures de stock.
- **📱 PWA (Progressive Web App)** : Installable sur mobile et bureau. Fonctionne parfaitement sans connexion internet.
- **🔄 Synchronisation Automatique** : Les transactions effectuées hors-ligne sont mises en file d'attente et synchronisées dès le retour du réseau.
- **🏷️ Système de Codes-barres** : Génération et scan de codes-barres pour une gestion fluide.
- **📜 Historique & Rapports** : Suivez chaque vente et mouvement de stock avec précision.

## 🛠️ Stack Technique

- **Frontend** : [Next.js 15](https://nextjs.org/) (App Router), [React](https://react.dev/)
- **Style** : [Tailwind CSS](https://tailwindcss.com/), [ShadCN UI](https://ui.shadcn.com/)
- **État Global** : [Zustand](https://zustand-demo.pmnd.rs/) (avec persistance locale)
- **Base de données & Auth** : [Supabase](https://supabase.com/)
- **PWA** : [@ducanh2912/next-pwa](https://github.com/ducanh2912/next-pwa)
- **Icônes** : [Lucide React](https://lucide.dev/)

## 📦 Installation & Configuration

1. **Cloner le repository** :
   ```bash
   git clone [votre-repo]
   cd stock-pro
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Variables d'environnement** :
   Créez un fichier `.env.local` à la racine et ajoutez vos clés Supabase :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
   ```

4. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```

## 📶 Mode Hors-ligne & PWA

StockPro utilise un Service Worker pour mettre en cache les ressources critiques. 
- **Stockage Local** : Toutes vos données sont sauvegardées localement via Zustand et `localStorage`.
- **File d'attente (Sync Queue)** : En cas d'action (vente, mise à jour stock) effectuée hors-ligne, elle est enregistrée dans une file d'attente locale.
- **Auto-Sync** : L'application détecte le retour d'internet et traite la file d'attente automatiquement pour mettre à jour Supabase.

## 🏗️ Structure du Projet

- `/src/app` : Routes et pages Next.js
- `/src/components` : Composants UI et écrans métier (POS, Products, Dashboard...)
- `/src/store` : État global Zustand et logique de synchronisation
- `/src/lib` : Services Supabase et utilitaires offline
- `/public` : Actifs statiques, manifest PWA et icônes

## 📄 Licence

MIT
