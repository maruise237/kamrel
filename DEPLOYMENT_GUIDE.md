# Guide de Déploiement Vercel

## Prérequis
- Compte Vercel (https://vercel.com)
- Application Next.js prête pour la production

## Étapes de Déploiement

### 1. Préparation du Projet

#### Variables d'Environnement
Configurer les variables suivantes dans Vercel :

```
NODE_ENV=production
STACK_PROJECT_ID=votre_stack_project_id
NEXT_PUBLIC_STACK_PROJECT_ID=votre_stack_project_id
STACK_CLIENT_APP_ID=votre_stack_client_app_id
NEXT_PUBLIC_STACK_CLIENT_APP_ID=votre_stack_client_app_id
STACK_CLIENT_PUBLISHABLE_KEY=votre_stack_publishable_key
NEXT_PUBLIC_STACK_PUBLISHABLE_KEY=votre_stack_publishable_key
STACK_SECRET_SERVER_KEY=votre_stack_secret_key
NEXT_PUBLIC_SUPABASE_URL=votre_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_supabase_anon_key
```

### 2. Déploiement via Interface Web Vercel

1. **Connecter le Repository**
   - Aller sur https://vercel.com/dashboard
   - Cliquer sur "New Project"
   - Importer depuis GitHub/GitLab/Bitbucket
   - Sélectionner votre repository

2. **Configuration du Build**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Variables d'Environnement**
   - Dans les paramètres du projet
   - Ajouter toutes les variables listées ci-dessus
   - Copier les valeurs depuis `.env.local`

4. **Déploiement**
   - Cliquer sur "Deploy"
   - Attendre la fin du build
   - Votre application sera disponible sur l'URL fournie

### 3. Déploiement via CLI (Alternative)

Si les problèmes de réseau sont résolus :

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

### 4. Vérifications Post-Déploiement

- [ ] Application accessible
- [ ] Authentification Stack Auth fonctionnelle
- [ ] Base de données Supabase connectée
- [ ] Toutes les pages se chargent correctement
- [ ] Animations KAMREL fonctionnent

### 5. Domaine Personnalisé (Optionnel)

1. Dans les paramètres Vercel
2. Aller dans "Domains"
3. Ajouter votre domaine
4. Configurer les DNS selon les instructions

## Résolution des Problèmes

### Erreurs de Build
- Vérifier que toutes les dépendances sont installées
- S'assurer que les variables d'environnement sont correctes
- Vérifier les erreurs TypeScript/ESLint

### Erreurs de Runtime
- Vérifier les logs Vercel
- S'assurer que les API externes sont accessibles
- Vérifier la configuration des CORS

## Support

- Documentation Vercel: https://vercel.com/docs
- Support Vercel: https://vercel.com/support
- Documentation Next.js: https://nextjs.org/docs