# Instructions Manuelles pour Corriger les Problèmes

## Problèmes Identifiés

1. **Tables manquantes** : `workspaces`, `workspace_members`, `invites`
2. **Bucket de stockage manquant** : `files`
3. **Fonctions Edge non déployées** : `send-invite`, `accept-invite`, `create-default-workspace`

## Solutions à Appliquer

### 1. Créer les Tables Manquantes

1. Connectez-vous à votre dashboard Supabase : https://supabase.com/dashboard
2. Allez dans votre projet
3. Cliquez sur "SQL Editor" dans le menu de gauche
4. Copiez et collez le contenu du fichier `create-missing-tables.sql`
5. Cliquez sur "Run" pour exécuter le script

### 2. Créer le Bucket de Stockage

**Option A : Via l'interface Supabase (Recommandé)**
1. Dans votre dashboard Supabase, allez dans "Storage"
2. Cliquez sur "Create bucket"
3. Nom du bucket : `files`
4. Public : **Non** (décoché)
5. File size limit : `50 MB`
6. Allowed MIME types : Ajoutez les types suivants :
   - `image/jpeg`
   - `image/png`
   - `image/gif`
   - `image/webp`
   - `image/svg+xml`
   - `application/pdf`
   - `text/plain`
   - `text/csv`
   - `application/msword`
   - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
   - `application/vnd.ms-excel`
   - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
   - `application/zip`
   - `video/mp4`
   - `audio/mpeg`

**Option B : Via SQL**
1. Dans le SQL Editor, copiez et collez le contenu du fichier `create-storage-bucket-manual.sql`
2. Exécutez le script

### 3. Déployer les Fonctions Edge

Les fonctions Edge doivent être déployées via Supabase CLI :

1. **Installer Supabase CLI** (si pas déjà fait) :
   ```bash
   npm install -g supabase
   ```

2. **Se connecter à Supabase** :
   ```bash
   supabase login
   ```

3. **Lier le projet** :
   ```bash
   supabase link --project-ref qyrrwjneeolzcayqdsur
   ```

4. **Déployer les fonctions** :
   ```bash
   supabase functions deploy send-invite
   supabase functions deploy accept-invite
   supabase functions deploy create-default-workspace
   ```

### 4. Vérification

Après avoir appliqué ces corrections :

1. **Tester les tables** :
   ```bash
   node test-supabase-connection.js
   ```

2. **Tester le stockage** :
   ```bash
   node create-storage-bucket.js
   ```

3. **Tester les fonctions Edge** :
   ```bash
   node test-edge-functions.js
   ```

## Ordre d'Exécution Recommandé

1. Créer les tables manquantes (étape 1)
2. Créer le bucket de stockage (étape 2)
3. Déployer les fonctions Edge (étape 3)
4. Tester toutes les fonctionnalités (étape 4)

## Notes Importantes

- Assurez-vous d'être connecté avec un compte ayant les permissions d'administration sur le projet Supabase
- Les fonctions Edge nécessitent Supabase CLI pour être déployées
- Après chaque étape, vérifiez que les changements ont été appliqués correctement
- Si vous rencontrez des erreurs, vérifiez les logs dans le dashboard Supabase

## Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs d'erreur dans le dashboard Supabase
2. Assurez-vous que toutes les dépendances sont installées
3. Vérifiez que les variables d'environnement sont correctement configurées dans `.env.local`