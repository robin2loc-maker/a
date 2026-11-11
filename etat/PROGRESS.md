# Avancement

Une entrée par tâche terminée : numéro, ce qui a été fait (2 à 3 lignes), preuve (tests, fichiers).

## Démarrage (tâche 0.1)

- **Début de session** : 2026-11-03 à 22:04 UTC (`date` : Tue Nov 3 22:04:49 UTC 2026). Inventaire terminé à 22:15 UTC.
- **Outils** (`check-tools` et commandes directes) :
  - Node v22.23.4, npm 10.9.9, pnpm 10.28.0, yarn 1.22.22, eslint 10.1.0, prettier 3.8.1 ;
  - Python 3.13.18, pip 24.0, uv 0.11.32, poetry 2.4.3, ruff 0.16.9, pytest 9.1.1 ; bibliothèques : pandas, openpyxl, pdfplumber, pypdf, markitdown, docx ;
  - PostgreSQL 16.15 : `service postgresql start` fonctionne (16/main, port 5432, en ligne) ;
  - Chrome : `CHROME_PATH=/usr/bin/google-chrome` (Google Chrome for Testing 153.0.8010.12) ; navigateurs Playwright dans `/opt/pw-browsers` (chromium-1243, chromium_headless_shell-1243, ffmpeg-1011) ; ChromeDriver 147 ;
  - aussi : git 2.43, gh 2.89, jq 1.7, curl 8.5, docker 29.9, Java 21, Go 1.24, Rust 1.97.
- **Réseau** : HTTPS via le proxy de session (CA `/root/.ccr/ca-bundle.crt`), vérification TLS active. Tests faits avec `curl` (client par défaut), réessais avec pause de 2 s.

| Hôte | Résultat | Détail |
|---|---|---|
| www.data.gouv.fr | ⚠️ OK par intermittence | Environ 8 connexions sur 10 coupées dès la poignée de main TLS (`Connection reset`, relevé par le proxy : `tunnel closed 1006`). Avec réessais, l'API répond : `/api/1/datasets/?q=rome` → 200 (jeu « ROME » trouvé), fiche du jeu ROME → 200 (liste des ressources). Prévoir 10 à 12 réessais par appel. |
| francetravail.org (fichiers ROME référencés par data.gouv.fr) | ✅ OK | Téléchargement réel de `261014-rome_arboprincipale-octobre-2026.xlsx` : 200, 612 776 octets, fichier OOXML valide. Millésime ROME : octobre 2026. |
| data.enseignementsup-recherche.gouv.fr | ⚠️ OK par intermittence | Même symptôme, pire : 1 succès sur 10. Avec réessais, l'API explore v2.1 répond : recherche « parcoursup » → 200 (13 jeux), `fr-esr-cartographie_formations_parcoursup/records` → 200. |
| opendata.onisep.fr | ✅ site / ❌ téléchargements | Pages du portail → 200. Mais `api.opendata.onisep.fr` (API `/api/1.0/dataset/…/search` et `/downloads/5fe0808a2da6f/5fe0808a2da6f.zip`, lien « Idéo-Fiches métiers » donné par data.gouv.fr) → **403 Forbidden renvoyé par le serveur Apache de l'Onisep** (le tunnel du proxy est bien établi). |
| www.onisep.fr | ✅ OK | Fiche « conducteur de travaux » → 200 (184 Ko) avec le client curl par défaut. |
| www.cidj.com | ✅ OK | Fiche « conducteur de travaux » → 200, salaires lisibles dans le HTML. |
| www.ilo.org | ✅ OK | Accueil et `/publications` → 200. API ILOSTAT `rplumber.ilo.org/data/indicator/?…&format=.csv` → 200, CSV de 352 Ko. |
| francetravail.io / api.francetravail.io | ✅ joignable, 🔒 API fermée | Portail → 200. API ROME → 401 (jeton OAuth exigé, inscription impossible cette nuit, comme prévu par `docs/DONNEES.md`). |
| www.francetravail.fr | ✅ OK | Accueil → 200. |
| dares.travail-emploi.gouv.fr | ✅ OK | Accueil et publication « Les métiers en 2030 » → 200. Une URL inexistante (`/donnees/les-familles-professionnelles`) renvoie une page « Request Rejected » du pare-feu applicatif : viser des URL exactes. |
| www.insee.fr | ✅ OK | Accueil → 200. `api.insee.fr` : réponse vide (non nécessaire pour l'instant). |
| registry.npmjs.org | ✅ OK | `/next` → 200 (hors proxy, accès direct). |
| pypi.org | ✅ OK | `/simple/pandas/` → 200 (hors proxy, accès direct). |

Conséquences pour la phase 1 : les fichiers ROME se téléchargent directement depuis francetravail.org ; data.gouv.fr et data.enseignementsup-recherche.gouv.fr exigent des scripts avec réessais ; l'open data Onisep est à récupérer autrement (voir `docs/BLOCKERS.md`).

## 0.1 Lecture et inventaire — fait
- Outils inventoriés (Node 22, Python 3.13, PostgreSQL 16, Chrome), tests réseau consignés ci-dessus. data.gouv.fr et l'ESR coupent par intermittence (réessais nécessaires) ; api.opendata.onisep.fr renvoie 403 (voir BLOCKERS.md).
- Vérifié : CONFORME (commit 2d962b3).

## 0.2 Squelette de l'application — fait
- Next 16 (App Router), TypeScript strict, Tailwind 4, ESLint + Prettier, Vitest, Playwright (Chrome préinstallé), Drizzle + PostgreSQL local, CI, `npm run screenshots`, `content/` avec typographie française et détecteur de tics d'IA.
- Vérifié : CONFORME. `npm run check` vert (20 tests, 1 ignoré sans DATABASE_URL), `npm run e2e` vert (commit 12f2f32).

## 0.3 Configuration et mode démo — fait
- Configuration zod unique (src/lib/config.ts), .env.example commenté ; jeton compressé et signé (HMAC) pour le mode URL ; stockage PostgreSQL ou URL derrière une même interface.
- Vérifié : CONFORME. 52 tests sans base, 60 avec PostgreSQL ; démarrage sans variable HTTP 200 (commits 23b55f1, 58ee873).

## Phase 1 — début à 22:42 UTC (limite 3 h 30)

## 1.1 Recherche et vérification des sources — fait
- data/SOURCES.md : 14 sources testées par téléchargement réel. OK : ROME 4.0 v62 (1 923 fiches), BMO 2026, Parcoursup 2026 (25 793 formations) et vœux 2025, OIT 2025, ESCO ↔ ROME, INSEE PCS ↔ ISCO. KO : Onisep (403), table ROME ↔ FAP de la DARES (anti-robot) ; CIDJ lisible fiche par fiche.
- Vérifié : CONFORME (commits 85c7f34, 446b9ae).

## 1.2 Import ROME — fait
- `scripts/data/import_rome.py` (via `npm run data`) : 1 923 fiches ROME 4.0 v62, 14 330 appellations, dans data/processed/metiers.json et metiers_competences.json (découpé, 23,5 Mo au total). Sources stockées, script idempotent.
- Vérifié : CONFORME, textes identiques à l'export brut ; test de schéma zod 7/7 (commit c6e9f40).

## 1.3 Import des formations Parcoursup — fait
- `scripts/data/import_formations.py` : 25 793 formations 2026 (21 types, 43,6 % en apprentissage) dans formations.json, et capacité, taux d'accès 2025 dans formations_admission.json (52,5 % des formations).
- Vérifié : CONFORME, 25 793 lignes identiques au brut, liens de fiche HTTP 200 (commits 61ba3cf, 60bcadf).

## 1.5 Recrutement (BMO) par métier — fait
- Table officielle DARES FAP / PCS / ROME trouvée en PDF chez France Travail : ROME 4.0 → ROME parent → FAP. 1 818 fiches sur 1 923 ont un nombre de projets 2026 (94,5 %), précision 27/30 sur échantillon. Exemple de la page de vente retrouvé (6 872 projets, 71 % difficiles).
- Vérifié : CONFORME, 5 chaînes refaites à la main (commits 09e8bc4, e53988c, 7c12803, be86d32).

## 1.7 Exposition à l'IA par métier — fait
- ROME → ESCO → ISCO-08 (table officielle + API ESCO) : 1 661 fiches avec un ISCO (86,4 %). Score OIT 2025 pour 1 635 fiches (85 %) ; niveaux faible / modérée / élevée repris des qualificatifs de l'OIT (tableau 5). 190 fiches discordantes signalées.
- Vérifié : CONFORME, 5 chaînes refaites et comparées à la page OIT (commits 3e1e466, 1956f9a).

## 1.4 Lien métier ↔ formations et niveau d'études — fait
- Texte « accès » du ROME + RNCP (France compétences) + quelques règles manuelles sourcées : niveau minimum connu pour 89,5 % des fiches, au moins une formation Parcoursup pour 52,9 % (77 % des métiers post-bac). 20 vérifications : 16 correctes, 4 partielles, 0 fausse ; 5 contre-vérifications correctes.
- Vérifié : CONFORME avec réserves (commits 3201f0a, 40d1009).

## 1.6 Salaire par métier — fait
- Niveau 1 : salaire débutant CIDJ, 394 fiches (montant lu tel quel, Smic officiel quand la fiche dit « smic ») ; niveau 2 : fourchette des offres France Travail (Métierscope, type `offres`, jamais présenté comme un médian), 623 fiches ; niveau 3 (FAP) : aucune source accessible. 52,9 % des fiches ont un salaire.
- Intersection salaire + niveau d'études + formation : 545 métiers (179 avant la seconde passe). Vérifié : CONFORME, 8 fiches recontrôlées (commits cc3936b, 2bb2f59, a57b9a5, 7fc967a, 965510f).

## 1.8 ★ Grille des dimensions et vecteurs des métiers — fait (avec réserve)
- Conception v2.1 (2 tours de critique, VALIDÉE avec réserves R1-R6 traitées), `scripts/data/dimensions.py` + `grille_dimensions.toml` : 21 dimensions pour les 1 923 fiches, vecteur complet pour les 545 métiers éligibles ; 72 tests bloquants (références, pièges, faux amis).
- Accord mesuré sur 30 fiches par deux juges à l'aveugle : juges entre eux α = 0,952 ; grille contre juges α = 0,698 (seuil 0,80 non atteint, écarts d'un niveau dans 95 % des cas). Règle provisoire : poids divisé par deux pour les 12 dimensions sous le seuil. Recalibrage prévu en B0. Commits aeed529…86b872f, 766c584, e24d09c, daf0401.

## 1.9 Éligibilité et rapport — fait
- `scripts/data/catalogue.py` → data/processed/catalogue.json : 545 métiers éligibles sur 1 923 (14 grands domaines, 91 domaines sur 110), chaque valeur sourcée ; module typé src/lib/donnees/catalogue.ts. docs/DATA_REPORT.md finalisé (synthèse, 10 exemples, limites, plan pour transport, arts, spectacle).
- Vérifié : CONFORME après corrections (audioprothésiste bac + 3 ; salaire affiché France Travail quand le CIDJ porte sur une autre appellation). Commits 4dbbe8a, 9b96029, 71a6a30.

## Phase 1 — terminée à 01:49 UTC (budget respecté)

## 2.1 ★ Questionnaire — fait
- Conception v2 (critique À REVOIR, simulation de 3 parents, révision, critique 2 VALIDÉE avec réserves R1-R9 traitées). 30 questions (29 en Seconde), 10 min 52 s à 11 min 34 s ; les 3 questions de la page de vente mot pour mot (testé depuis docs/page-de-vente.md).
- Textes dans content/questionnaire.ts, définition typée dans src/lib/questionnaire/, docs/QUESTIONNAIRE.md généré et testé. Vérifié : CONFORME (commits 2bb1eff, d771227).

## 2.2 ★ Moteur de score — terminé (13:39 UTC)
- `src/lib/moteur/` (commit 46ce32f) : profil, filtres, score, aimants, trio, écartés, `preselectionner()` (20 candidats, ≤ 4 par grand domaine, sans encadrement ni expérience) ; 349 tests verts.
- Vérification CONFORME (docs/verification/2.2-moteur.md) ; μ des aimants porté à 0,2, marge mince selon la graine (à surveiller en 2.6). Sources études/formations à joindre à chaque carte en 2.4.

## Pause demandée par le propriétaire (13:53 UTC)
- 2.3 ★ : conception écrite (docs/conception/questions-ouvertes.md, ff00ca7) ; prochaine étape : critique neuve.
- 2.4 ★ : conception (docs/conception/conseiller-ia.md, 2c776da) ; critique 1 « À REVOIR », 6 bloquants B1–B6 (docs/conception/conseiller-ia-critique.md, d4ba1cb) ; prochaine étape : révision par le concepteur, en y intégrant les deux ajouts demandés par 2.3.
- Budget LLM consommé : 3 appels xAI (conception 2.4).

## 2.3 ★ Questions ouvertes — implémentation (questionnaire v3)
- Trois phrases libres (Q5 `temps_libre_precis`, Q6 `aide_exemple` masqué si « Pas une chose plus qu'une autre », Q20 `fierte_recit`), Q7 et Q14 retirées : 28 questions (27 en Seconde), 11 min 00 s à 11 min 42 s. `textes-libres.ts` (santé, non-réponses), `amorceDe`, `VERSION_MOTEUR` 2.3.0, `scripts/data/migrer-v3.ts`.
- Attendus de référence régénérés (panel migré, pas retiré). Pistes qui changent : `theo` E1210 Web designer → E1205 Designer graphique (piste 1) ; `kevin` I1325 Technicien-cuisiniste → I1316 Technicien de maintenance CVC (piste 3) ; `chloe` K1104 Psychologue → K1210 Éducateur PJJ (piste 3). Les 5 autres gardent leurs pistes (rangs et écartés bougent un peu) ; SPEC §5.9 : F1135 toujours piste 1.

## 2.3 ★ Questions ouvertes — terminé (22:09 UTC)
- Questionnaire v3 (0bec9c6) : 3 champs libres (sous Q5, Q6, Q20), Q7 et Q14 retirées, 28 questions, 11 min 00 à 11 min 42 ; filtre santé et nettoyage côté serveur ; 432 tests verts.
- Conception validée au tour 2 avec réserves R1–R4, toutes appliquées ; vérification CONFORME (docs/verification/2.3-questions-ouvertes.md). Restent pour 3.3 : nettoyage dans le navigateur, mention « facultatif ».

## 2.4 ★ Conseiller IA — terminé avec réserves (21:43 UTC)
- src/lib/conseiller/ (5710412, 84cad09) : fournisseurs xAI/Anthropic/mock, validateur, relance, replis, compteur 150 (LLM_REEL=1) ; 565 tests verts. Essai réel : 8 appels, 0,23 $, aucun fait inventé dans la sortie finale.
- Vérification CONFORME avec réserves (docs/verification/2.4-conseiller-ia.md) : taux de repli trop élevé (2 replis totaux sur 5). Passe qualité hors ligne lancée avant 2.5/2.6.
- Passe qualité 2.4 (22:18 UTC, 6557e24) : réparation par le code, trio partiel, relance ciblée, conditions de travail ROME ; rejeu hors ligne : « pourquoi » au gabarit 11/24 → 2/24, repli total 1 → 0 (docs/essais/2.4-passe-qualite.md). Prompt v4 à mesurer en 2.6.

## 2.5 Étiquetage IA des traits — terminé (22:45 UTC)
- 545 métiers (+20 fiches juges) × 21 dimensions, method "llm" (603bbc0) ; 29 appels, 1,27 $ ; compteur 37/150. α global 0,813 → 0,822 ; deplacements au LLM ; trous comblés par le LLM ; moteur 2.4.0, §5.9 passe.
- Vérification CONFORME avec réserves de méthode (docs/verification/2.5-etiquetage.md) : gain mesuré sur l'échantillon de choix ; contrôle humain de 10 fiches à faire.
