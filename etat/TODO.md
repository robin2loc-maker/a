# TODO — V1 du Bilan 3 Pistes

Pour l'orchestrateur. Traite les tâches **dans l'ordre, une à la fois**, via des sous-agents (`CLAUDE.md` §3).

- **★** : boucle qualité obligatoire (concepteur → critique → révision → développeur → [captures + critique visuelle] → vérificateur).
- **Sans ★** : développeur → vérificateur.
- `[x]` : fait et vérifié. `[~]` : partiel ou contourné, avec une note d'une ligne et un renvoi vers `docs/BLOCKERS.md`.

Après chaque tâche : coche, mets à jour `docs/PROGRESS.md`, commit, push. À la fin de chaque phase : mets à jour `MORNING_REPORT.md`.

## Phase 0 — Mise en place

- [x] **0.1 Lecture et inventaire.**
  - Note l'heure de début.
  - Lance `check-tools`.
  - Teste l'accès réseau à data.gouv.fr, data.enseignementsup-recherche.gouv.fr, opendata.onisep.fr, cidj.com et ilo.org.
  - *Accepté si* : `docs/PROGRESS.md` contient l'heure, les outils et le résultat des tests réseau.
- [x] **0.2 Squelette de l'application.**
  - Next.js, TypeScript strict, Tailwind, ESLint et Prettier, Vitest, Playwright (Chrome préinstallé), Drizzle et PostgreSQL local.
  - Scripts `check` et `e2e`. Workflow GitHub Actions. Script de captures d'écran réutilisable (`npm run screenshots`).
  - Dossier `content/` pour tous les textes visibles, avec :
    - un utilitaire de typographie française appliqué au rendu ;
    - un test qui détecte les tics d'IA listés dans `docs/STYLE.md`.
  - *Accepté si* : `npm run check` est vert, et un test unitaire et un test E2E triviaux passent.
- [x] **0.3 Configuration et mode démo.**
  - Configuration validée par zod, `.env.example` commenté.
  - Mode démo sans aucune variable d'environnement : réponses compressées et signées dans l'URL, résultats recalculés.
  - *Accepté si* : l'application démarre sans variable, et les deux modes sont testés.

## Phase 1 — Données (3 h 30 maximum au total, voir `CLAUDE.md` §3.6)

- [x] **1.1 Recherche et vérification des sources.**
  - Pour chaque piste de `docs/DONNEES.md` : URL de téléchargement réelle, licence, millésime, champs.
  - *Accepté si* : `data/SOURCES.md` liste chaque source avec son statut (OK, inaccessible, inexploitable) et les champs retenus.
- [x] **1.2 Import ROME.**
  - Sortie `data/processed/metiers.json` : code, libellé, appellations, définition, contextes de travail, savoir-être, compétences, accès, métiers proches.
  - *Accepté si* : plus de 1 500 métiers, script relançable, test de schéma.
- [x] **1.3 Import des formations Parcoursup.**
  - Sortie `data/processed/formations.json` : intitulé, type, établissement, ville, département, apprentissage, lien de la fiche.
  - *Accepté si* : plus de 20 000 formations, test de schéma.
- [x] **1.4 Lien métier ↔ formations et niveau d'études minimum.**
  - *Accepté si* : méthode documentée, couverture mesurée, 20 vérifications manuelles par échantillonnage consignées dans `docs/DATA_REPORT.md`.
- [x] **1.5 Recrutement (BMO) par métier**, avec la table de passage documentée.
  - *Accepté si* : couverture mesurée, source stockée avec chaque valeur.
- [x] **1.6 Salaire par métier**, selon l'ordre de préférence de `CLAUDE.md` §5.
  - *Accepté si* : aucune valeur estimée, type de chiffre et année stockés, couverture mesurée par niveau de préférence.
- [x] **1.7 Exposition à l'IA par métier** (OIT et correspondance ISCO).
  - *Accepté si* : couverture mesurée, niveaux définis, source stockée.
- [x] **1.8 ★ Grille des dimensions et vecteurs des métiers.**
  - **Conception** (`docs/conception/dimensions.md`) : la liste finale des dimensions, partant de `SPEC.md` §5 et ajustée à ce que les données ROME permettent vraiment de mesurer, avec la correspondance déterministe des contextes, savoir-être et compétences du ROME vers chaque dimension, et la grille d'étiquetage LLM pour les trous.
  - **Critique** sous l'angle « Moteur et dimensions ».
  - **Implémentation**, puis contrôle de cohérence : 30 métiers ré-étiquetés, accord mesuré.
  - *Accepté si* : chaque métier éligible a un vecteur complet, et l'accord est mesuré et documenté.
- [x] **1.9 Éligibilité et rapport.**
  - Règle : définition + études + salaire + au moins une formation.
  - Rédige `docs/DATA_REPORT.md`.
  - *Accepté si* : au moins 300 métiers éligibles et variés, ou un écart documenté avec un plan pour le combler.

## Phase 2 — Moteur

- [x] **2.1 ★ Questionnaire.**
  - **Conception** (`docs/conception/questionnaire.md`) : toutes les questions et options mot pour mot, les accords il / elle, les dimensions et poids de chaque option, la raison d'être de chaque question, l'ordre, la durée estimée. S'appuyer sur `SPEC.md` §4, la grille 1.8 et l'idée centrale (observation par un proche).
  - **Critique** sous l'angle « Questionnaire ».
  - **Simulation** : un sous-agent `critique` joue 3 parents très différents. Par exemple : une mère d'un garçon de Seconde discret, une mère d'une fille de Terminale très scolaire, un père d'un fils en réorientation après une L1 abandonnée. Il répond à tout le questionnaire et note chaque hésitation, incompréhension ou option manquante dans `docs/conception/questionnaire-simulation.md`. Le concepteur corrige.
  - **Implémentation** : définition typée, plus `docs/QUESTIONNAIRE.md`.
  - *Accepté si* : critique VALIDÉE, simulation traitée, 25 à 32 questions, durée estimée de 8 à 12 minutes, les 3 questions de la page de vente présentes mot pour mot.
- [x] **2.2 ★ Moteur de score.**
  - **Conception** (`docs/conception/moteur.md`) : profil, filtres durs, score, pénalités, diversité, bonus « méconnu », métiers écartés et leurs raisons.
  - **Critique**, puis **implémentation** en fonctions pures, avec tests.
  - *Accepté si* : critique VALIDÉE, tests unitaires, résultat reproductible.
> **Réorientation du 4 novembre (décision du propriétaire)** : système mixte. Le code filtre et présélectionne ; un LLM, dans un cadre vérifié, choisit les 3 pistes **dans la présélection** et rédige les explications ; un validateur contrôle tout ; repli automatique sur le calcul seul. Ajout de questions ouvertes. Fournisseur LLM disponible : xAI (clé dans `.env.local`, jamais committée). La page de vente n'est plus à coder par nous. Priorité : questionnaire + sélection + explication, puis les écrans du produit.

- [x] **2.3 ★ Questions ouvertes.**
  - **Conception** (`docs/conception/questions-ouvertes.md`) : 2 à 4 questions ouvertes (observation par le parent, réponses courtes sur mobile), leur place dans le parcours, ce que le LLM en tire, l'impact sur la durée. Critique sous l'angle « Questionnaire ».
  - **Implémentation** dans `content/questionnaire.ts` et `src/lib/questionnaire/`, `docs/QUESTIONNAIRE.md` régénéré.
  - *Accepté si* : critique VALIDÉE, durée de 8 à 12 minutes, 25 à 32 questions, les 3 questions de la page de vente intactes, tests verts.
- [x] **2.4 ★ Conseiller IA : sélection et explications.**
  - **Conception** (`docs/conception/conseiller-ia.md`) : fournisseur abstrait (xAI par l'API compatible OpenAI, Anthropic en option, mock sans clé), modèle par variable d'environnement ; entrée : réponses brutes + présélection de `preselectionner()` avec fiches sourcées ; prompt complet ; schéma JSON de sortie (3 pistes choisies par code ROME parmi la présélection, « Pourquoi ça lui ressemble » version parent et version enfant, « Le métier, simplement », raisons des écartés) ; validateur (code dans la liste, citations présentes dans les réponses, aucun chiffre, diplôme ni formation absents des données, règles de `docs/STYLE.md`) ; relance unique puis repli sur le calcul seul et les gabarits ; budget et compteur d'appels ; journal sans donnée personnelle.
  - **Critique** sous les angles « Textes » et « Pistes proposées ».
  - **Implémentation** avec tests : un chiffre, un diplôme, un métier ou une citation inventés sont rejetés ; le repli fonctionne sans clé.
  - *Accepté si* : critique VALIDÉE, tests du validateur verts, un bilan réel produit avec le LLM sur l'exemple de la page de vente.
- [x] **2.5 Étiquetage IA des traits des métiers.**
  - Les 545 métiers éligibles notés sur les 21 dimensions par le LLM (par lots, grille de `docs/conception/dimensions.md` §4), marqués `method: "llm"`, comparés aux juges de `docs/conception/accord/`. On garde la meilleure source par dimension.
  - *Accepté si* : accord mesuré avant/après dans `docs/DATA_REPORT.md`, budget d'appels respecté.
- [ ] **2.6 ★ Évaluation.**
  - 20 profils réalistes + l'exemple de la page de vente, passés dans le pipeline complet (avec LLM et en repli). `docs/EVAL.md` : pistes, écartés, explications, contrôles automatiques, comparaison calcul seul / mixte.
  - **Critique** en conseiller d'orientation, réglages, 2 tours au maximum.
  - *Accepté si* : SPEC §5.9 passe, aucune piste incompatible avec les contraintes, critique VALIDÉE.

## Phase 3 — Parcours client

> Priorité après la réorientation : 3.3 (questionnaire), 3.4 (génération), 3.5 (résultats parent), 3.6 (page enfant). Les autres tâches de la phase 3 passent après.

- [-] **3.1 ★ Page de vente `/`** — *retirée le 4 novembre : codée par le propriétaire ; `docs/conception/design.md` reste disponible comme système visuel.*, fidèle mot pour mot à `docs/page-de-vente.md` (`SPEC.md` §2), avec le vrai composant carte pour l'exemple.
  - **Conception visuelle** (`docs/conception/design.md`) : typographie, couleurs, grille, composants. Ce système sert ensuite à toutes les pages.
  - **Critique**, puis implémentation, captures, **critique visuelle**, corrections.
  - *Accepté si* : texte identique, lisible à 360 px, critique visuelle VALIDÉE.
- [ ] **3.2 Commande.**
  - Case d'option, case de renonciation, Stripe Checkout en test, webhook signé, paiement simulé en mode démo, création du bilan et de son jeton.
  - *Accepté si* : test E2E commande → merci en mode démo, et un webhook à signature invalide est rejeté.
- [ ] **3.3 ★ Questionnaire (écrans).**
  - Mobile, une question par écran, progression, retour, passage, sauvegarde automatique et reprise.
  - Captures, puis critique visuelle.
  - *Accepté si* : test E2E complet sur mobile, reprise après rechargement, critique VALIDÉE.
- [ ] **3.4 Génération.**
  - Écran d'attente honnête, calcul en moins de 60 secondes, stockage, jetons parent et enfant.
  - *Accepté si* : test E2E questionnaire → résultats.
- [ ] **3.5 ★ Page résultats parent** (`SPEC.md` §6), au format de la carte modèle.
  - Captures pour 3 profils différents, puis critique visuelle et critique des textes.
  - *Accepté si* : 3 cartes complètes avec leurs sources, écartés et partage présents, critiques VALIDÉES.
- [ ] **3.6 ★ Page enfant** (`SPEC.md` §7).
  - *Accepté si* : tutoiement, aucun trait négatif, aucune réponse brute, critique VALIDÉE.
- [ ] **3.7 ★ Guide « Comment lui en parler »** (`SPEC.md` §8).
  - Conception du texte complet, critique « Textes », implémentation imprimable.
  - *Accepté si* : critique VALIDÉE.
- [ ] **3.8 ★ Emails transactionnels** (`SPEC.md` §10).
  - Textes conçus et critiqués, puis gabarits avec aperçu en développement.
  - *Accepté si* : 4 gabarits rendus et testés, critique VALIDÉE.
- [ ] **3.9 Option accès illimité 3 mois** (`SPEC.md` §9).
  - *Accepté si* : test E2E commande avec option → espace → nouveau bilan.
- [ ] **3.10 Légal, cookies, pied de page** (`SPEC.md` §13 et §12).
  - *Accepté si* : pages présentes avec la mention « À FAIRE VALIDER », et « Refuser » au même niveau qu'« Accepter ».
- [ ] **3.11 Tracking et admin.**
  - Pixel Meta après consentement, API Conversions pour `Purchase` avec `event_id`, événements internes, `/admin` (entonnoir, abandon par question, option).
  - *Accepté si* : tests des événements, `/admin` protégé.

## Phase 4 — Qualité

- [ ] **4.1 Parcours complet E2E** en mode démo, sur mobile, pour un élève de Terminale et un étudiant en réorientation.
  - *Accepté si* : `npm run e2e` est vert.
- [ ] **4.2 Revue de rédaction globale.**
  - Une `critique` relit **tous** les textes visibles (questions, résultats de 5 profils, guide, emails, interface, messages d'erreur). Un `developpeur` corrige.
  - *Accepté si* : tout est consigné dans `docs/REVUE-REDACTION.md`.
- [ ] **4.3 Revue de sécurité.**
  - Jetons non devinables, admin protégé, webhooks signés, limitation de débit sur la génération, aucune donnée personnelle dans les logs, aucun secret, en-têtes de sécurité.
  - *Accepté si* : consigné dans `docs/SECURITE.md`, avec les corrections faites.
- [ ] **4.4 Accessibilité et performance** (Lighthouse via Chrome headless si possible).
  - *Accepté si* : résultats et corrections consignés.
- [ ] **4.5 Captures finales** (390 × 844) de toutes les pages et de chaque étape du questionnaire dans `docs/screenshots/`, avec un index `docs/screenshots/README.md` qui affiche les images.
- [ ] **4.6 README et guide de déploiement**, pas à pas, compréhensible par une personne non développeuse. Chaque variable d'environnement est expliquée.

## Bonus (à traiter aussi, dans l'ordre)

- [ ] **B0** Reprendre les tâches marquées `[~]`, en particulier celles de données.
- [ ] **B1** `FUNNEL_MODE=quiz_first` : questionnaire avant paiement, début de la première piste visible, paiement, puis déblocage.
- [ ] **B2** Page d'offre factice « tuteur IA 19 €/mois » après l'achat, derrière un flag désactivé. Texte marqué « À RÉÉCRIRE ».
- [ ] **B3** Export PDF des résultats.
- [ ] **B4 ★** Passer de 20 à 50 profils d'évaluation, avec une nouvelle critique en conseiller d'orientation et un nouveau réglage.
- [ ] **B5** Export CSV anonymisé dans `/admin`.
- [ ] **B6** Variantes de titre de la page de vente (A/B par paramètre d'URL), mesurées dans l'admin.

## Fin

- [ ] **Z. Version finale de `MORNING_REPORT.md`** (en français, clair pour une personne non développeuse) :
  1. Ce qui marche, avec les captures.
  2. Comment voir le produit.
  3. Ce qui est partiel ou bloqué, et ce que l'humain doit faire.
  4. Les décisions à valider.
  5. Les chiffres clés des données.
  6. Les 10 prochaines étapes recommandées.
  Puis push final.
