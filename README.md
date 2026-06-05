# PreConsult IA

Application de **préparation de consultation médicale** (POC). Ne pose aucun diagnostic, ne recommande aucun traitement : génère un résumé pré-consultation à partir d'un questionnaire, validé par le patient.

## 👉 Pour mettre l'app en ligne sur ton téléphone

**Lis le fichier `GUIDE-DEPLOIEMENT.md`** — il t'explique tout, pas à pas, pour débutant total.

## Stack
- Frontend : React + Vite, installable (PWA)
- Backend : fonction serverless (`api/agent.js`) qui protège la clé API Anthropic
- 4 agents IA : questionnaire, résumé, vérification, rendez-vous

## Pour développeurs (optionnel)
```bash
npm install
npm run dev      # développement local
npm run build    # build de production
```
Variable d'environnement requise : `ANTHROPIC_API_KEY`.

## ⚠️ POC uniquement
Données fictives et non nominatives. Pas d'hébergement HDS : ne pas utiliser avec de vraies données de santé en production.
