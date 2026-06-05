# 📱 PreConsult IA — Guide de mise en ligne (débutant total)

Ce guide t'amène d'un dossier de code à une **vraie application installable sur ton téléphone**, avec une icône sur l'écran d'accueil. Aucune expérience requise. Tout est gratuit.

Compte environ **30 à 45 minutes** la première fois.

À la fin tu auras :
- une adresse web du type `https://preconsult-ia.vercel.app`
- l'app installée sur ton iPhone ou Android, comme une vraie app
- les 4 agents IA qui fonctionnent, avec ta clé API protégée

---

## 🗺️ Vue d'ensemble (les 4 grandes étapes)

1. **GitHub** — déposer le code en ligne (ton « casier » de code)
2. **Anthropic** — récupérer ta clé API (le « mot de passe » pour parler à l'IA)
3. **Vercel** — mettre l'app en ligne et y brancher ta clé
4. **Ton téléphone** — installer l'app sur l'écran d'accueil

On y va doucement, une étape à la fois.

---

## ✅ Avant de commencer

Tu as besoin de :
- une adresse email
- un navigateur (Chrome, Safari, Edge…)
- le dossier `preconsult-pwa` (celui qui contient ce guide)

Tu n'as **PAS** besoin d'installer de logiciel ni d'ouvrir un terminal.

---

## ÉTAPE 1 — Déposer le code sur GitHub

GitHub est un site gratuit où l'on stocke du code. Vercel ira y chercher ton app.

### 1.1 Créer un compte
1. Va sur **https://github.com**
2. Clique **Sign up** (s'inscrire)
3. Suis les étapes (email, mot de passe, nom d'utilisateur)
4. Valide ton email

### 1.2 Créer un dépôt (un « projet »)
1. En haut à droite, clique le **+** puis **New repository**
2. **Repository name** : tape `preconsult-ia`
3. Laisse sur **Public** (ou Private, peu importe)
4. Ne coche rien d'autre
5. Clique **Create repository**

### 1.3 Envoyer les fichiers
Tu arrives sur une page avec du texte technique. Ignore-le.
1. Clique le lien **« uploading an existing file »** (au milieu de la page)
   - ou va sur `Add file` → `Upload files`
2. Ouvre le dossier `preconsult-pwa` sur ton ordinateur
3. **Sélectionne tout ce qu'il y a dedans** (les fichiers ET les dossiers `src`, `api`, `public`)
   - ⚠️ Si tu vois un dossier `node_modules`, **ne l'envoie pas** (il est inutile et trop lourd)
4. Glisse-dépose le tout dans la zone du navigateur
5. Attends que tout se charge (la barre du bas)
6. En bas, clique le bouton vert **Commit changes**

✅ Ton code est en ligne. Bravo, le plus « technique » est fait.

---

## ÉTAPE 2 — Récupérer ta clé API Anthropic

C'est ce qui fait fonctionner les agents IA. La clé est **secrète** : on ne la met jamais dans le code, seulement dans Vercel (étape 3).

1. Va sur **https://console.anthropic.com**
2. Crée un compte / connecte-toi
3. Pour utiliser l'IA, il faut **ajouter du crédit** : menu **Billing** → ajoute un petit montant (5 € suffisent largement pour tester ; chaque résumé coûte quelques centimes)
4. Va dans le menu **API Keys**
5. Clique **Create Key**, donne-lui un nom (ex. `preconsult`)
6. **Copie la clé tout de suite** (elle commence par `sk-ant-...`) et colle-la dans une note temporaire. Tu ne pourras plus la revoir ensuite.

🔒 Ne partage cette clé avec personne et ne l'écris jamais dans le code.

---

## ÉTAPE 3 — Mettre l'app en ligne avec Vercel

Vercel transforme ton code en site web, gratuitement.

### 3.1 Créer un compte
1. Va sur **https://vercel.com**
2. Clique **Sign Up**
3. Choisis **Continue with GitHub** (le plus simple : ça relie les deux)
4. Autorise la connexion

### 3.2 Importer ton projet
1. Sur le tableau de bord Vercel, clique **Add New…** → **Project**
2. Tu vois la liste de tes dépôts GitHub → trouve **preconsult-ia** → clique **Import**
3. Une page de configuration s'ouvre. **Ne touche à rien** pour l'instant (Vercel détecte tout seul que c'est un projet Vite).

### 3.3 ⚠️ Brancher ta clé API (étape la plus importante)
Avant de cliquer Deploy :
1. Déplie la section **Environment Variables** (Variables d'environnement)
2. Dans **Name** (Nom), tape exactement : `ANTHROPIC_API_KEY`
3. Dans **Value** (Valeur), colle ta clé `sk-ant-...`
4. Clique **Add**

> C'est ce qui garde ta clé secrète : elle vit sur le serveur Vercel, jamais sur les téléphones des utilisateurs.

### 3.4 Lancer
1. Clique le gros bouton **Deploy**
2. Attends 1 à 2 minutes (animation de construction)
3. 🎉 Quand c'est fini, tu vois « Congratulations ». Clique **Continue to Dashboard** ou **Visit**.
4. Ton adresse apparaît, du type **`https://preconsult-ia.vercel.app`**

**Ouvre cette adresse : ton app est en ligne !** Teste le bouton « Essayer avec un exemple fictif » pour vérifier que les agents IA répondent.

---

## ÉTAPE 4 — Installer l'app sur ton téléphone

Ouvre ton adresse Vercel **sur le navigateur de ton téléphone**.

### 📱 Sur iPhone (Safari)
1. Ouvre l'adresse dans **Safari** (important : pas Chrome sur iPhone)
2. Touche le bouton **Partager** (le carré avec une flèche vers le haut, en bas)
3. Fais défiler et touche **« Sur l'écran d'accueil »**
4. Touche **Ajouter** en haut à droite

### 🤖 Sur Android (Chrome)
1. Ouvre l'adresse dans **Chrome**
2. Touche le menu **⋮** (trois points, en haut à droite)
3. Touche **« Installer l'application »** ou **« Ajouter à l'écran d'accueil »**
4. Confirme

✅ L'icône PreConsult apparaît sur ton écran d'accueil. Tu la touches → l'app s'ouvre en plein écran, sans barre de navigateur. Personne ne voit la différence avec une vraie app de store.

---

## 🔄 Comment modifier l'app plus tard ?

Tu changes un fichier → tu le ré-uploades sur GitHub (Add file → Upload files) → **Vercel met l'app à jour tout seul** en 1-2 minutes. Rien d'autre à faire.

---

## ❓ Problèmes fréquents

**« Les agents IA ne répondent pas / erreur »**
→ Vérifie l'étape 3.3 : le nom doit être EXACTEMENT `ANTHROPIC_API_KEY`. Si tu l'as ajoutée après le déploiement, va dans Vercel → ton projet → **Settings → Environment Variables**, vérifie, puis **Deployments → … → Redeploy**.

**« Insufficient credit » ou erreur de facturation**
→ Étape 2.3 : ajoute du crédit sur console.anthropic.com (Billing).

**« Je ne vois pas Installer sur iPhone »**
→ Tu dois être dans **Safari**, pas Chrome. Sur iPhone seul Safari sait installer une PWA.

**« Le build a échoué sur Vercel »**
→ Vérifie que tu as bien envoyé TOUS les dossiers (`src`, `api`, `public`) et les fichiers `package.json`, `vite.config.js`, `index.html` à la racine.

---

## ⚠️ Important avant un vrai usage médical

Ce projet est un **POC (preuve de concept)**. Avant de le proposer à de vrais patients :
- Les données de santé sont **sensibles** (RGPD). En France, héberger de vraies données de santé impose un hébergeur certifié **HDS**. Vercel ne l'est pas.
- Garde les données **fictives et non nominatives** tant que tu es en phase de test, exactement comme c'est conçu aujourd'hui.
- Pour un lancement public réel, fais-toi accompagner sur les aspects juridiques et d'hébergement.

Pour montrer, tester, démontrer à des médecins ou des partenaires : c'est parfait tel quel.

Bon déploiement ! 🚀
