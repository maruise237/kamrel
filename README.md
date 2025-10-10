# 🚀 KAMREL - Plateforme de Gestion de Projets SaaS

![KAMREL Banner](https://img.shields.io/badge/KAMREL-SaaS%20Platform-blue?style=for-the-badge&logo=react)
![Version](https://img.shields.io/badge/version-0.1.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)

**KAMREL** est une plateforme SaaS moderne de gestion de projets construite avec Next.js 15, React 19, et TypeScript. Elle offre une expérience utilisateur fluide avec des animations KAMREL personnalisées, une authentification sécurisée, et une interface utilisateur élégante.

## 🌟 Aperçu du Projet

KAMREL combine les meilleures technologies modernes pour créer une solution complète de gestion de projets :
- **Interface moderne** avec animations fluides
- **Collaboration en temps réel** avec chat intégré
- **Gestion multi-tenant** avec espaces de travail isolés
- **Suivi avancé** du temps et des performances
- **Sécurité renforcée** avec authentification robuste

## ✨ Fonctionnalités Principales

### 🎯 Gestion de Projets
- **Tableau de bord intuitif** avec vue d'ensemble des projets
- **Création et gestion de projets** avec interface drag-and-drop
- **Diagramme de Gantt** pour la planification temporelle
- **Suivi du temps** intégré pour chaque projet
- **Gestion d'équipe** avec attribution de rôles

### 🎨 Interface Utilisateur
- **Design moderne** avec Tailwind CSS 4.1.9
- **Animations KAMREL** personnalisées pour une expérience fluide
- **Mode sombre/clair** avec next-themes
- **Interface responsive** adaptée à tous les appareils
- **Composants UI réutilisables** basés sur Radix UI

### 🔐 Authentification & Sécurité
- **Authentification sécurisée** avec Stack Auth
- **Gestion des sessions** automatique
- **Protection des routes** côté client et serveur
- **Variables d'environnement** sécurisées

### 💾 Base de Données
- **Supabase** comme backend-as-a-service
- **Migrations automatiques** avec schémas SQL
- **API REST** générée automatiquement
- **Temps réel** pour les mises à jour collaboratives

## 🛠️ Technologies Utilisées

### Frontend
- **Next.js 15.2.4** - Framework React full-stack
- **React 19** - Bibliothèque UI avec les dernières fonctionnalités
- **TypeScript 5** - Typage statique pour une meilleure DX
- **Tailwind CSS 4.1.9** - Framework CSS utilitaire
- **Framer Motion** - Animations fluides et performantes

### UI Components
- **Radix UI** - Composants accessibles et personnalisables
- **Lucide React** - Icônes modernes et cohérentes
- **Recharts** - Graphiques et visualisations de données
- **Sonner** - Notifications toast élégantes

### Backend & Services
- **Supabase** - Base de données PostgreSQL et authentification
- **Stack Auth** - Solution d'authentification moderne
- **Vercel** - Déploiement et hébergement

### Outils de Développement
- **ESLint** - Linting et qualité du code
- **PostCSS** - Traitement CSS avancé
- **React Hook Form** - Gestion des formulaires
- **Zod** - Validation de schémas TypeScript

## 🚀 Installation et Configuration

### Prérequis
- Node.js 18+ (recommandé: Node.js 20+)
- npm, yarn, ou pnpm
- Compte Supabase
- Compte Stack Auth

### Installation

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/kamrel-saas-platform.git
cd kamrel-saas-platform
```

2. **Installer les dépendances**
```bash
npm install --legacy-peer-deps
# ou
yarn install
# ou
pnpm install
```

3. **Configuration des variables d'environnement**

Créez un fichier `.env.local` à la racine du projet :

```env
# Stack Auth Configuration
STACK_PROJECT_ID=your_stack_project_id
STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_key
STACK_SECRET_SERVER_KEY=your_stack_secret_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Environment
NODE_ENV=development
```

4. **Configuration de la base de données**

Exécutez les migrations Supabase :
```bash
# Connectez-vous à Supabase
npx supabase login

# Liez votre projet
npx supabase link --project-ref your-project-ref

# Appliquez les migrations
npx supabase db push
```

5. **Lancer le serveur de développement**
```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📁 Structure du Projet

```
kamrel-saas-platform/
├── app/                          # App Router Next.js 15
│   ├── dashboard/               # Pages du tableau de bord
│   │   ├── chat/               # Module de chat
│   │   ├── files/              # Gestion de fichiers
│   │   ├── gantt/              # Diagramme de Gantt
│   │   ├── projects/           # Gestion des projets
│   │   ├── settings/           # Paramètres utilisateur
│   │   ├── team/               # Gestion d'équipe
│   │   └── time-tracking/      # Suivi du temps
│   ├── login/                  # Page de connexion
│   ├── signup/                 # Page d'inscription
│   └── handler/                # Gestionnaires Stack Auth
├── components/                  # Composants réutilisables
│   ├── ui/                     # Composants UI de base
│   ├── dashboard/              # Composants spécifiques au dashboard
│   ├── layout/                 # Composants de mise en page
│   └── [feature]/              # Composants par fonctionnalité
├── lib/                        # Utilitaires et configurations
├── hooks/                      # Hooks React personnalisés
├── styles/                     # Styles globaux
├── public/                     # Assets statiques
├── supabase/                   # Migrations et schémas
└── stack/                      # Configuration Stack Auth
```

## 🎨 Système d'Animation KAMREL

KAMREL intègre un système d'animation personnalisé pour une expérience utilisateur fluide :

### Composants d'Animation
- **KamrelLoader** - Loader principal avec animation de rotation
- **KamrelFullScreenLoader** - Loader plein écran avec texte personnalisable
- **KamrelSkeleton** - Skeleton loading pour le contenu
- **KamrelCardSkeleton** - Skeleton spécifique aux cartes
- **KamrelListSkeleton** - Skeleton pour les listes

### Utilisation
```tsx
import { KamrelFullScreenLoader } from '@/components/ui/kamrel-loader'

<KamrelFullScreenLoader 
  isLoading={isLoading}
  text="Chargement KAMREL"
  subText="Préparation de votre espace..."
/>
```

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev          # Lance le serveur de développement

# Production
npm run build        # Build de production
npm run start        # Lance le serveur de production

# Qualité du code
npm run lint         # Vérifie le code avec ESLint
```

## 🚀 Déploiement

### Déploiement sur Vercel (Recommandé)

1. **Via l'interface Vercel**
   - Connectez votre repository GitHub
   - Configurez les variables d'environnement
   - Déployez automatiquement

2. **Via CLI**
```bash
npm install -g vercel
vercel --prod
```

### Variables d'environnement de production
Assurez-vous de configurer toutes les variables d'environnement dans votre plateforme de déploiement.

## 📋 Instructions pour GitHub

### Initialiser le repository Git

1. **Initialiser Git dans votre projet**
```bash
git init
git add .
git commit -m "Initial commit: KAMREL SaaS Platform"
```

2. **Créer un nouveau repository sur GitHub**
   - Allez sur [GitHub](https://github.com)
   - Cliquez sur "New repository"
   - Nommez-le `kamrel-saas-platform`
   - Laissez-le vide (pas de README, .gitignore, ou licence)

3. **Connecter votre projet local à GitHub**
```bash
git remote add origin https://github.com/VOTRE-USERNAME/kamrel-saas-platform.git
git branch -M main
git push -u origin main
```

### Variables d'environnement pour GitHub

Assurez-vous de configurer les secrets GitHub Actions si vous utilisez CI/CD :
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STACK_PROJECT_ID`
- `STACK_PUBLISHABLE_CLIENT_KEY`
- `STACK_SECRET_SERVER_KEY`

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- [Next.js](https://nextjs.org/) pour le framework React
- [Supabase](https://supabase.com/) pour la base de données et l'authentification
- [Stack Auth](https://stack-auth.com/) pour l'authentification avancée
- [Tailwind CSS](https://tailwindcss.com/) pour le styling
- [Radix UI](https://www.radix-ui.com/) pour les composants accessibles

## 🆘 Support

Si vous rencontrez des problèmes ou avez des questions :

1. **Issues GitHub** - Pour les bugs et demandes de fonctionnalités
2. **Discussions** - Pour les questions générales
3. **Documentation** - Consultez le guide de déploiement dans `DEPLOYMENT_GUIDE.md`

---

<div align="center">
  <p>Fait avec ❤️ par l'équipe KAMREL</p>
  <p>
    <a href="https://github.com/votre-username/kamrel-saas-platform/issues">Signaler un Bug</a>
    ·
    <a href="https://github.com/votre-username/kamrel-saas-platform/issues">Demander une Fonctionnalité</a>
  </p>
</div>

## 🔄 Changelog

### Version 0.1.0 (Actuelle)
- ✅ Interface utilisateur moderne avec Tailwind CSS
- ✅ Authentification sécurisée avec Stack Auth
- ✅ Gestion de projets avec tableaux Kanban
- ✅ Chat en temps réel intégré
- ✅ Suivi du temps et rapports
- ✅ Gestion d'équipe et permissions
- ✅ Diagrammes de Gantt interactifs
- ✅ Gestion de fichiers
- ✅ Architecture multi-tenant
- ✅ Base de données Supabase avec RLS

### Prochaines versions
- 🔄 Notifications push
- 🔄 API REST complète
- 🔄 Application mobile
- 🔄 Intégrations tierces (Slack, GitHub, etc.)
- 🔄 Rapports avancés et analytics

## 🎯 Roadmap

### Version 0.2.0 (À venir)
- [ ] Notifications push
- [ ] Intégration calendrier
- [ ] Export de données
- [ ] API publique
- [ ] Application mobile

### Version 0.3.0 (Futur)
- [ ] Intégrations tierces (Slack, Discord)
- [ ] Rapports avancés
- [ ] Automatisations
- [ ] Multi-tenant

---

**Développé avec ❤️ par l'équipe KAMREL**

![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.9-38B2AC?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=flat-square&logo=supabase)