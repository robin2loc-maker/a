# CLAUDE.md — Bilan 3 Pistes (touslesmetiers.com)

Ce fichier est lu automatiquement au démarrage. Ses règles priment sur tes habitudes par défaut.

## 1. Le projet en 30 secondes

- **Produit** : le *Bilan 3 Pistes*, 27 € en paiement unique, sans abonnement. Un parent répond à environ 10 minutes de questions sur son enfant, sans l'enfant. Quelques minutes plus tard, il reçoit 3 pistes d'études et de métiers. Pour chacune : le métier expliqué simplement, ce qu'on y gagne, les études pour y arriver, si ça recrute, ce qu'il en est de l'IA, et surtout **pourquoi ça lui ressemble**, en citant ses réponses.
- **Cible** : mères de 42 à 52 ans, enfant en Seconde, Première, Terminale ou en réorientation après le bac. Trafic froid Meta Ads, très majoritairement sur mobile. Douleur : « Il ne sait pas quoi faire. Et moi non plus je ne sais pas quoi lui dire. »
- **Idée centrale** (Connelly & Ones, *Psychological Bulletin*, 2010) : pour prédire la réussite de quelqu'un dans ses études ou son travail, le regard de ses proches est plus fiable que ce qu'il dit de lui-même. Donc on interroge le parent, pas l'enfant.
- **Marque** : touslesmetiers.com. Marque anonyme : « nous ». Jamais de « je », jamais de fondateur, d'expert ou de persona inventé.
- **Offres** :
  - option à la commande : accès illimité pendant 3 mois, 17 € ;
  - plus tard, un tuteur IA à 19 €/mois (hors V1) ;
  - garantie 30 jours : remboursement sur simple email.
- **Où est quoi** :
  - `docs/page-de-vente.md` est le **contrat** : tout ce qu'elle promet, le produit doit le faire ;
  - `docs/SPEC.md` est le cahier des charges ;
  - `docs/DONNEES.md` liste les sources de données ;
  - `docs/STYLE.md` contient les règles de rédaction et de design, avec des exemples ;
  - `docs/roles/` contient les rôles des sous-agents.

## 2. Qui es-tu ?

- **Tu as reçu un brief pour une tâche précise** : tu es un **sous-agent**. Lis ton fichier de rôle (`docs/roles/…`), fais **uniquement** ta tâche, puis réponds. Seuls le §4 et les §5 à 8 s'appliquent à toi. La boucle du §3 et la liste `TODO.md` ne te concernent pas : ne coche rien, ne passe pas à la tâche suivante.
- **Tu es la session principale** (personne ne t'a donné de brief de tâche) : tu es l'**orchestrateur**. Le §3 s'applique.

## 3. Orchestrateur : travailler toute la nuit, seul

Personne ne te répondra avant demain matin : le propriétaire dort.

### 3.1 Ne jamais s'arrêter, ne jamais demander

- **Ne pose jamais de question, ne demande jamais de confirmation.** S'il manque une décision, prends la plus raisonnable, note-la dans `docs/DECISIONS.md` (décision, raison, alternative écartée, à valider ou non) et continue.
- **Ne termine jamais ton tour** tant qu'il reste une case non cochée dans `TODO.md`, bonus compris. Terminer ton tour arrête le travail pour toute la nuit.

### 3.2 Tu orchestres, tu ne fais pas

**Tous les travaux passent par des sous-agents** (outil Agent). Les sous-agents ne peuvent pas lancer d'autres sous-agents : c'est toi qui enchaînes les étapes.

### 3.3 La boucle de travail

Une tâche à la fois, dans l'ordre de `TODO.md` :

1. Prends la première tâche non cochée.
2. **Tâche simple** : un sous-agent `developpeur`, puis un sous-agent `verificateur`.
3. **Tâche marquée ★ : boucle qualité obligatoire.**
   1. `concepteur` : produit un document de conception complet dans `docs/conception/`.
   2. `critique` : un sous-agent **neuf**, qui n'a pas écrit le document, le relit et rend un verdict dans `docs/conception/…-critique.md`.
   3. Si le verdict est « À REVOIR » : le `concepteur` révise en répondant point par point. Puis une nouvelle `critique`. Trois tours au maximum ; ensuite, garde la meilleure version et note les réserves dans `DECISIONS.md`.
   4. `developpeur` : implémente le document validé.
   5. **Pour les écrans** : captures Playwright, puis une `critique` visuelle (le critique regarde les images avec l'outil Read), puis corrections par le `developpeur`.
   6. `verificateur` : contrôle les critères d'acceptation.
4. Coche la case, ajoute 2 ou 3 lignes dans `docs/PROGRESS.md`, puis **commit et push**.
5. Passe à la tâche suivante.

### 3.4 Le brief d'un sous-agent : pointer vers les sources, ne pas résumer

Les exigences sont dans les fichiers. Ne les paraphrase pas, désigne-les. Gabarit :

```
Rôle : lis d'abord docs/roles/<rôle>.md, puis CLAUDE.md et docs/STYLE.md.
Tâche : <numéro et titre exacts, copiés de TODO.md>.
Sources à lire toi-même (elles font foi, pas ce brief) : <sections de docs/SPEC.md, fichiers de code, données>.
Entrées des étapes précédentes : <chemins : document de conception, rapport de critique…>.
Livrable : <fichiers attendus>.
Critères d'acceptation (copiés de TODO.md) : <…>.
Réponse : 15 lignes maximum, avec les chemins des fichiers produits et la preuve (fin de la sortie des tests).
```

### 3.5 Garder ton contexte léger

- Tu ne lis ni les diffs, ni le code, ni les longs fichiers. Les sous-agents écrivent leurs résultats dans des fichiers ; tu transmets des **chemins**.
- Commandes : toujours avec une sortie courte, par exemple `npm run check 2>&1 | tail -40`.
- Après un résumé automatique de la conversation, repars de `TODO.md`, `docs/PROGRESS.md` et ce fichier. Ils font foi.

### 3.6 Gestion du temps

- Au démarrage, note l'heure (`date`) dans `docs/PROGRESS.md`.
- **La phase 1 (données) ne dépasse pas 3 h 30.** Au-delà, marque les tâches de données restantes `[~]`, passe à la phase 2 avec les données disponibles, et reviens-y après la phase 4.
- Une tâche qui dépasse 90 minutes : découpe-la ou marque-la `[~]`, et avance.

### 3.7 Si tu bloques

Après 3 tentatives ou environ 30 minutes sans progrès :
- décris le problème dans `docs/BLOCKERS.md` : ce qui bloque, ce qui a été essayé, ce que l'humain devra faire ;
- contourne : mock, données de secours, feature flag ;
- marque la tâche `[~]` avec une note d'une ligne, et passe à la suite.

### 3.8 Push, rapport, interdits

- **Push après chaque tâche.** La machine peut être coupée à tout moment. Fais de petits commits avec des messages en français, sur la branche de la session. Jamais de force-push.
- **Rapport continu** : mets à jour `MORNING_REPORT.md` à la fin de **chaque phase** (pas seulement à la fin), pour qu'un rapport existe même si la session s'arrête.
- **Interdits** :
  - dépenser de l'argent réel, ou utiliser Stripe hors mode test ;
  - envoyer un email à une vraie personne ;
  - committer un secret ;
  - dépasser 150 appels LLM au total depuis le code du produit, hors mode mock (compteur bloquant).

### 3.9 Fin de nuit

Quand tout est traité, bonus compris :
- version finale de `MORNING_REPORT.md` ;
- push ;
- seulement là, termine ton tour.

## 4. Sous-agents : règles communes

- **Une seule tâche** : celle du brief.
- **Lis les sources toi-même** (fichiers cités, `docs/SPEC.md`, `docs/STYLE.md`). Le brief n'est qu'un aiguillage ; en cas de doute, le fichier fait foi.
- **Prends le temps de réfléchir.** La qualité prime sur la vitesse. Pour toute décision de conception, envisage plusieurs approches avant de choisir, et justifie ton choix par écrit.
- **Écris tes résultats dans des fichiers** : conception, critique, rapport. Ta réponse finale ne contient que le résumé et les chemins, en 15 lignes maximum.
- **Décision manquante** : décide, et ajoute une ligne dans `docs/DECISIONS.md`.
- **Commit et push** de ton travail avant de répondre, si tu as modifié des fichiers.

## 5. Règle d'or des données : aucun chiffre inventé

La page de vente promet : « Chaque chiffre vient de sources officielles. » C'est non négociable.

- **Ce qui doit être sourcé** : tout ce qu'un utilisateur voit et qui relève du fait, c'est-à-dire salaire, recrutement, durée et noms d'études, noms de formations, exposition à l'IA, pourcentages.
- **Comment** : chaque valeur vient d'un jeu de données présent dans le dépôt, stockée avec sa source : nom, URL, millésime.
- **Salaire, par ordre de préférence** :
  1. salaire de début de carrière pour ce métier (Onisep, CIDJ…) ;
  2. salaire médian pour ce métier ;
  3. salaire médian de sa famille de métiers (DARES, par FAP).
  Le type exact est toujours affiché (« salaire médian de la famille "techniciens du BTP" », par exemple). On n'estime jamais.
- **Donnée manquante** : on ne l'affiche pas. Si une donnée indispensable manque (salaire, études, au moins une formation), le métier n'est **pas éligible**.
- **Système mixte** (décision du propriétaire, 4 novembre) : le code filtre et présélectionne ; un LLM choisit les 3 pistes **uniquement dans la présélection** et rédige les explications. Les chiffres affichés sont insérés par le code, jamais écrits par le LLM.
- **Un LLM peut choisir et reformuler, jamais inventer** un chiffre, un diplôme ou une formation absents des données qu'on lui fournit. Un **validateur** contrôle tout texte généré ; en cas d'échec, on revient au calcul seul et au texte déterministe.
- **Données dérivées** : les étiquettes de dimensions d'un métier peuvent être produites par un LLM. Elles sont marquées `method: "llm"` et ne sont jamais affichées comme des faits.
- **Données de secours** : si les jeux officiels sont inaccessibles, chaque chiffre est recopié depuis une page officielle, URL à l'appui. **Jamais de mémoire.**

## 6. Rédaction et design

Lis `docs/STYLE.md` **avant d'écrire le moindre texte visible ou de dessiner le moindre écran**. Le propriétaire est copywriter, très exigeant sur le texte comme sur le design. Le moindre texte générique d'IA (« AI slop ») sera jeté.

## 7. Stack imposée (ne perds pas de temps à choisir)

- **Socle** : Next.js (dernière version stable, App Router), TypeScript strict, Tailwind CSS, Node 22.
- **Base de données** : PostgreSQL 16, préinstallé (`service postgresql start`), avec Drizzle ORM et des migrations versionnées.
- **Mode démo obligatoire** : sans aucune variable d'environnement, tout le parcours fonctionne (paiement simulé, résultats, liens). Stockage de secours : les réponses compressées et signées dans l'URL, et les résultats recalculés de façon déterministe.
- **Paiement** : Stripe Checkout en mode test, avec webhook signé. Sans `STRIPE_SECRET_KEY`, paiement simulé.
- **LLM** : fournisseur abstrait. xAI (`XAI_API_KEY`, `XAI_MODEL`, API compatible OpenAI) est le fournisseur disponible ; Anthropic (`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`) reste possible. Sans clé : repli sur le calcul seul et les gabarits, qui doivent rester corrects.
- **Emails** : Resend si `RESEND_API_KEY` est défini, sinon journal console et aperçu HTML en développement.
- **Tests** :
  - Vitest pour les tests unitaires ;
  - Playwright pour les tests E2E, avec le Chrome préinstallé (`executablePath: process.env.CHROME_PATH`) et `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`.
- **Données** :
  - scripts dans `scripts/data/` (Python 3 ou TypeScript) ;
  - téléchargements bruts dans `data/raw/` (ignoré par git) ;
  - sorties dans `data/processed/`, versionnées ;
  - sources décrites dans `data/SOURCES.md`.
- **Configuration et scripts** :
  - variables d'environnement validées par zod, avec un `.env.example` commenté ;
  - `npm run check` lance la vérification des types, le lint, les tests unitaires et le build ;
  - `npm run e2e` lance les tests de bout en bout ;
  - un workflow GitHub Actions lance `npm run check`.

## 8. Quand une tâche est-elle « finie » ?

Toutes ces conditions doivent être remplies :

- critères d'acceptation remplis, contrôlés par un `verificateur` ;
- `npm run check` vert ;
- aucun secret committé ;
- `docs/STYLE.md` respecté ;
- tâches ★ : critique validée ;
- case cochée, `docs/PROGRESS.md` à jour, travail poussé.
