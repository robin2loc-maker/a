# Sources de données

Vérification faite le 3 novembre 2026 (tâche 1.1), téléchargements réels dans `data/raw/` (ignoré par git) avec `scripts/data/telecharger.py`. Chaque fichier téléchargé a, à côté de lui, un `.meta.json` (URL, date, taille, SHA-256).

Rappel (`CLAUDE.md` §5) : tout chiffre affiché vient d'une de ces sources, avec son nom, son URL et son millésime. Les champs « retenus » ci-dessous sont ceux que les tâches 1.2 à 1.7 doivent extraire.

## Synthèse

| # | Source | Besoin | Statut |
|---|---|---|---|
| 1 | ROME 4.0, export complet (France Travail) | métiers, définitions, contextes, savoir-être, compétences, accès, mobilités | ✅ OK |
| 2 | Enquête BMO 2026 (France Travail) | recrutement | ✅ OK |
| 3 | Nomenclature FAP 2021 (DARES), hiérarchie | familles de métiers | ✅ OK |
| 4 | Table de passage FAP 2021 / PCS / ROME (DARES) | ROME ↔ FAP | ✅ OK (PDF officiel diffusé par France Travail, trouvé en tâche 1.5) |
| 5 | Parcoursup, cartographie des formations | formations post-bac | ✅ OK |
| 6 | Parcoursup 2025, vœux et admissions | sélectivité, effectifs | ✅ OK |
| 7 | Onisep Idéo (métiers, fiches métiers, fiches formations, formations initiales) | lien métier ↔ formations, niveau d'accès, salaire débutant | ❌ inaccessible (403) |
| 8 | CIDJ, fiches métiers (pages web) | salaire de début de carrière | ⚠️ secours par pages (OK, page par page) |
| 9 | INSEE, salaires du privé par profession détaillée (PCS), 2024 | salaire par profession | ✅ OK (exploitable seulement avec une table ROME ↔ PCS, voir 4) |
| 10 | DARES, portraits statistiques des métiers (salaires par FAP) | salaire de la famille de métiers | ❌ inaccessible |
| 11 | OIT/ILO 2025, index d'exposition à l'IA générative (WP 140, annexe A1) | exposition à l'IA par ISCO-08 | ✅ OK (tableau HTML officiel ; 85 % des fiches, tâche 1.7) |
| 12 | ESCO ↔ ROME (table EURES France) et API ESCO | ROME → ISCO-08 | ✅ OK (couverture 86 % des fiches, tâche 1.7) |
| 13 | API « Marché du travail » et API ROME (francetravail.io) | salaires, tensions | 🔒 inaccessible (inscription) |
| 14 | INSEE, matrice PCS 2020 ↔ ISCO-08 | secours indirect ROME → PCS (via 12) | ✅ OK (secours partiel, voir 4) |
| 15 | Service-public.gouv.fr, montant du Smic | montant affiché quand le CIDJ écrit « smic » | ✅ OK (tâche 1.6) |
| 15 | RNCP, export CSV (France compétences) | lien certification ↔ code ROME, niveau des diplômes | ✅ OK (tâche 1.4) |
| 16 | France Travail, Métierscope : salaires des offres d'emploi par code ROME | salaire du métier (niveau 2, fourchette de 80 % des offres) | ✅ OK (tâche 1.6, à valider) |
| 18 | Onisep, pages web (filières et formations post-bac) | durée des formations (filtre de Q23) | ✅ OK (tâche 2.2, page par page) |

---

## 1. ROME 4.0, export complet — ✅ OK

- **Producteur** : France Travail. Jeu data.gouv.fr : https://www.data.gouv.fr/datasets/58da857388ee384902e505f5/
- **URL de téléchargement** (sans authentification, malgré le nom de l'hôte) :
  - JSON : https://api.francetravail.fr/api-nomenclatureemploi/v1/open-data/json (ZIP, 5,5 Mo ; 45 Mo décompressé) → `data/raw/rome/rome_open_data_json.zip`
  - CSV : https://api.francetravail.fr/api-nomenclatureemploi/v1/open-data/csv (ZIP, 4,6 Mo, 30 fichiers UTF-8) → `data/raw/rome/rome_open_data_csv.zip`
  - aussi disponibles : `/xml` (6,1 Mo) et `/pdf` (75 Mo, une fiche PDF par métier, inutile ici).
- **Licence** : Licence Ouverte Etalab (`fr-lo` sur data.gouv.fr).
- **Millésime** : ROME 4.0 version 62 (« 26M10 »), publiée le 19/10/2026 (`version.txt`). **1 923 fiches métiers**, 14 330 appellations.
- **Attention encodage** : les fichiers JSON sont en **ISO-8859-15** malgré l'extension (lire en `latin-1`/`iso-8859-15`) ; les CSV sont en UTF-8.
- **Fichier principal** : `unix_fiche_emploi_metier_v462.json` (liste de 1 923 fiches). Champs retenus :

| Champ | Rôle |
|---|---|
| `rome.code_rome`, `rome.intitule` | identifiant et libellé du métier |
| `appellations[].libelle`, `.code_ogr` | noms courants du métier (recherche, affichage) ; `code_ogr` sert de clé vers ESCO (source 12) |
| `definition` | définition du métier (texte officiel à reformuler) |
| `acces_metier` | texte d'accès : diplômes cités, niveau (secours pour le lien métier ↔ formations et le niveau d'études) |
| `competences.savoir_faire.enjeux[].items[]` | compétences, regroupées par enjeu |
| `competences.savoir_etre_professionnel.enjeux[].items[]` | savoir-être |
| `competences.savoirs.categories[].items[]` | savoirs |
| `contextes_travail[].libelle` / `.items[].libelle` | contextes (horaires, lieux, conditions, risques) : correspondance avec les réponses du parent |
| `secteurs_activite[]` (`code`, `libelle`, `principal`) | secteurs |
| `mobilites[]` (`rome_cible`, `ordre_mobilite`) | métiers proches |

- **Fichiers CSV complémentaires utiles** :
  - `unix_referentiel_code_rome_v462_utf8.csv` : `code_rome`, `libelle_rome`, `transition_eco`, `transition_num`, `transition_demo`, `emploi_reglemente`, `emploi_cadre` (étiquettes officielles : métier réglementé, cadre, transition) ;
  - `unix_referentiel_code_rome_riasec_v462_utf8.csv` : `riasec_majeur`, `riasec_mineur` pour les 1 923 fiches (profil d'intérêts RIASEC officiel : précieux pour relier les réponses du parent au métier) ;
  - `unix_rubrique_mobilite_v462_utf8.csv` : mobilités (`code_rome`, `code_rome_cible`, `numero_ordre`) ;
  - `unix_referentiel_contexte_travail_v462_utf8.csv` : 194 contextes typés (`code_type_cont_trav`, `libelle_type_cont_trav`) ;
  - `unix_texte_v462_utf8.csv` : définition et accès phrase par phrase ;
  - `unix_arborescence_centre_interet_v462_utf8.csv`, `unix_centre_interet_v462_utf8.csv` : centres d'intérêt rattachés aux métiers.
- **Remarques** : aucune correspondance FAP, PCS, ESCO ni ISCO dans l'export ROME (vérifié par recherche dans tous les fichiers).
- **Import (tâche 1.2)** : le 03/11/2026, version 62, par `scripts/data/import_rome.py` (`npm run data`). Sorties : `data/processed/metiers.json` (1 923 fiches, 11,2 Mo : libellé, appellations complètes du CSV, définition et accès en texte intégral et en phrases, savoir-être, contextes, secteurs, centres d'intérêt, mobilités, domaines, RIASEC, emploi réglementé, cadre, transitions) et `data/processed/metiers_competences.json` (savoir-faire par enjeu et savoirs par catégorie, 12,3 Mo). Chaque fichier porte sa source (nom, URL, licence, version, date de publication, URL et SHA-256 des archives). Schéma : `src/lib/donnees/schema-rome.ts`, test `tests/donnees-rome.test.ts`.
- **Constats à l'import** : le JSON omet l'appellation principale et les appellations « peu usitées » (11 932 appellations au lieu de 14 330 ; 308 fiches sans aucune), d'où l'usage de `unix_referentiel_appellation` (CSV) ; dans `unix_texte`, les apostrophes sont doublées (`''`, artefact d'échappement) ; une fois corrigées, les phrases recomposent mot pour mot la définition et l'accès du JSON (contrôle bloquant dans le script).

## 2. Enquête BMO 2026 — ✅ OK

- **Producteur** : France Travail. Jeu data.gouv.fr : https://www.data.gouv.fr/datasets/enquete-besoins-en-main-doeuvre-bmo
- **URL de téléchargement** : https://www.francetravail.org/files/live/sites/peorg/files/documents/Statistiques-et-analyses/Open-data/BMO/Base-open-data-BMO-2026.xlsx (3,6 Mo) → `data/raw/bmo/Base-open-data-BMO-2026.xlsx`
- **Licence** : Licence Ouverte Etalab (`fr-lo`). **Millésime** : enquête 2026 (publiée en avril 2026). Méthode : https://statistiques.francetravail.org/bmo/static/methode_2026
- **Contenu** : feuille `BMO_2026_open_data`, 53 786 lignes (métier × bassin d'emploi), **217 métiers BMO** (codes FAP 2021 à 5 caractères, ex. `B6X74`), 406 bassins.

| Champ | Rôle |
|---|---|
| `Code métier BMO`, `Nom métier BMO` | métier BMO (code FAP 2021), clé de jointure avec la table ROME ↔ FAP |
| `Famille_met`, `Lbl_fam_met` | grande famille BMO |
| `REG`, `NOM_REG`, `Dept`, `NomDept`, `BE26`, `NOMBE26` | géographie (on agrège au niveau national) |
| `met` | nombre de projets de recrutement |
| `xmet` | dont projets jugés difficiles |
| `smet` | dont projets saisonniers |

- **Vérification** : « Conducteurs de travaux et chefs de chantier non cadres » (`B6X74`) : 6 872 projets, dont 4 847 difficiles, soit 70,5 % → 71 %. **Le chiffre de la page de vente est confirmé sur la source officielle.**
- **Remarques** : des cellules sont masquées par le secret statistique (`*`, 13 039 lignes sur 53 786) ; le total national se calcule en sommant les bassins non masqués (le total du conducteur de travaux tombe juste). Mode de calcul : `docs/DATA_REPORT.md`, section « Recrutement ».
- **Import (tâche 1.5)** : `scripts/data/import_bmo.py` (`npm run data`) → `data/processed/recrutement.json` (par fiche ROME : projets 2026 France entière, part difficile, part saisonnière, métier BMO, méthode et confiance du lien, source de chaque valeur). Table de passage : source 4.

## 3. Nomenclature FAP 2021, hiérarchie — ✅ OK

- **Producteur** : DARES. Jeu data.gouv.fr : https://www.data.gouv.fr/datasets/la-nomenclature-des-familles-professionnelles-2021
- **URL de téléchargement** : https://data.dares.travail-emploi.gouv.fr/api/explore/v2.1/catalog/datasets/dares_nomenclature_fap2021/exports/csv?use_labels=true (68 Ko, séparateur `;`) → `data/raw/fap/dares_nomenclature_fap2021.csv`. Hôte instable : 11 essais nécessaires.
- **Licence** : non précisée sur data.gouv.fr (`notspecified`) ; les données de la DARES sont publiées sous Licence Ouverte en règle générale. À confirmer (voir `DECISIONS.md`).
- **Millésime** : FAP 2021 (mise à jour du jeu : 30/04/2024). 341 lignes.

| Champ | Rôle |
|---|---|
| `Code FAP 22`, `Intitulé FAP 22` | domaine (22 postes) |
| `Code FAP 86`, `Intitulé FAP 86` | famille (86 postes) |
| `Code FAP 228`, `Intitulé FAP 228` | famille détaillée : niveau des métiers BMO et des libellés « famille de métiers » affichés |
| `Code FAP 341`, `Intitulé FAP 341` | niveau le plus fin |

- **Remarques** : **ne contient ni ROME ni PCS.** Seulement la hiérarchie et les libellés.

## 4. Table de passage FAP 2021 / PCS / ROME — ✅ OK (tâche 1.5, copie officielle sur le site BMO)

- **Producteur** : DARES. Page : https://dares.travail-emploi.gouv.fr/donnees/la-nomenclature-des-familles-professionnelles-2021 (citée par le jeu ROME de data.gouv.fr comme « tables de correspondance FAP / PCS / ROME ») ; document identifié : https://dares.travail-emploi.gouv.fr/sites/default/files/7ee92d53dcc3dd755c63cfe1b1bd429a/Dares_Nomenclature_FAP2021_descriptif.pdf
- **Constat** : tout le site dares.travail-emploi.gouv.fr (pages et fichiers) renvoie une page de défi JavaScript anti-robot (F5 « TSPD ») au lieu du contenu. **Non contourné**, conformément aux règles. Le portail open data `data.dares.travail-emploi.gouv.fr` ne publie sur data.gouv.fr que la hiérarchie FAP (source 3) ; son catalogue complet (export https://data.dares.travail-emploi.gouv.fr/api/explore/v2.1/catalog/exports/csv?delimiter=%3B, 15 essais, `data/raw/dares/catalogue_data_dares.csv`) compte 33 jeux et **aucun** ne contient ROME, PCS ou salaires : seule la hiérarchie FAP y est.
- **Conséquence (constat de la tâche 1.1, levé en tâche 1.5, voir plus bas)** : sans cette table, BMO (217 métiers FAP) et salaires par FAP/PCS ne se relient pas directement aux fiches ROME.
- **Contournement** (prévu en 1.1, devenu inutile) : voir `docs/BLOCKERS.md`.
- **Recherche complémentaire (vérification 1.1)** : data.gouv.fr (recherche « fap », « pcs rome », « rome »), jeux DARES et France Travail associés, méthode BMO 2026, pages PCS 2020 de l'INSEE : **aucune table ROME ↔ FAP ni ROME ↔ PCS publiée hors du site DARES bloqué**. Seul chemin officiel indirect trouvé : ROME → ESCO → ISCO-08 (source 12) → PCS 2020 (source 14). Il ne donne pas de code FAP (donc pas de BMO) et ses correspondances sont statistiques (plusieurs PCS par ISCO, pondérées).

- **Trouvée en tâche 1.5 (03/11/2026)** : la page « Méthode » de l'enquête BMO (https://statistiques.francetravail.org/bmo/static/methode_2026, lien « en savoir plus sur la nomenclature des Familles professionnelles ») diffuse le document DARES complet : **« FAP-2021. La nomenclature des familles professionnelles, version 2021. Table de correspondance FAP / Libellés PCS / Rome »**, PDF de 1,4 Mo, 3 875 lignes de texte.
  - URL : https://statistiques.francetravail.org/bmo/Handlers/HTFile.ashx?MEDIAID=183148 (`Nomenclature_des_familles_professionnelles_2021.pdf`) → `data/raw/fap/Nomenclature_des_familles_professionnelles_2021.pdf`. Téléchargement direct, sans défi anti-robot.
  - **Producteur** : DARES ; **diffuseur** : France Travail. **Millésime** : FAP 2021, PCS 2020, **ROME V3** (532 fiches). Licence : celle des publications DARES (voir `DECISIONS.md`, licence FAP).
  - **Contenu** : pour chaque FAP (niveau 228 ou 341), les libellés PCS, puis chaque code ROME V3 avec, le cas échéant, les qualifications concernées (`Q_0123456` : qualifications 0, 1, 2, 3, 5, 6 ; sans mention : toutes). 1 011 couples FAP × ROME, **les 532 codes ROME V3** et 226 des 228 FAP (seules X0X00 et X0X01, politique et clergé, n'ont aucun ROME). Les « * » et « ** » après un intitulé ROME renvoient à des notes de bas de page.
  - **Lecture** : `pdftotext -layout`, puis repérage du code FAP en début de ligne et des codes ROME dans la colonne de droite (`scripts/data/import_bmo.py`). Contrôles bloquants : les 532 codes ROME V3 du ROME 4.0 (`code_rome_parent`) sont tous trouvés, plus de 1 000 couples, chaque FAP existe dans la hiérarchie (source 3).
  - **Passage au ROME 4.0** : chaque fiche ROME 4.0 porte le code de sa fiche ROME V3 (`code_rome_parent`, champ officiel de l'export, source 1) ; la fiche hérite des FAP de ce code. Choix du métier BMO quand il y en a plusieurs (selon la qualification) et mesure de précision : `docs/DATA_REPORT.md`, section « Recrutement ». Sortie : `data/processed/passage_rome_fap.json`.

## 5. Parcoursup, cartographie des formations — ✅ OK

- **Producteur** : ministère de l'Enseignement supérieur (MESR). Jeu : https://www.data.gouv.fr/datasets/cartographie-des-formations-parcoursup (et `fr-esr-cartographie_formations_parcoursup` sur data.enseignementsup-recherche.gouv.fr)
- **URL de téléchargement** : https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-cartographie_formations_parcoursup/exports/csv?use_labels=true&delimiter=%3B (86 Mo) → `data/raw/parcoursup/cartographie_formations_parcoursup.csv`. Hôte instable : prévoir jusqu'à 40 essais.
- **Licence** : Licence Ouverte v2.0 (`lov2`). **Millésime** : session 2026 (le fichier contient aussi 2020 à 2025 : filtrer `Session = 2026`).
- **Contenu 2026** : **25 793 formations**, dont **11 251 en apprentissage** ; 25 colonnes. Types les plus fréquents : BTS-BTSA-BTSM (13 966), licence (2 157), BUT (953), CPGE (981), écoles d'ingénieurs (699)…

| Champ | Rôle |
|---|---|
| `Session` | millésime (filtre) |
| `Code interne Parcoursup de la formation` | identifiant unique (clé) |
| `Nom long de la formation`, `Nom court de la formation`, `Mentions/Spécialités` | intitulé affiché ; sert au rapprochement avec les diplômes cités par ROME |
| `Types de formation` | type (BTS, BUT, licence, DE…) ; parfois plusieurs valeurs séparées par des virgules |
| `Nom de l'établissement`, `Identifiant de l'établissement` (UAI), `Types d'établissement` | établissement |
| `Commune`, `Département`, `Région`, `Localisation` (lat., long.) | lieu |
| `Formations en apprentissage` | apprentissage (valeur non vide = oui) |
| `Lien vers la fiche formation` | lien vers la fiche Parcoursup |
| `Internat`, `Aménagement`, `Informations complémentaires` | facultatif |

- **Import (tâche 1.3)** : le 03/11/2026, session 2026, par `scripts/data/import_formations.py` (`npm run data`). Sortie : `data/processed/formations.json` (**25 793 formations**, 18,5 Mo, une par ligne) : code Parcoursup (clé), intitulé, mentions, `code_formation` (mention commune aux établissements), type normalisé (`type`, 21 valeurs décrites dans l'en-tête) et catégories d'origine (`types_parcoursup`), filière, établissement, UAI, statut (public, privé sous contrat ou consulaire, privé), commune, département (code et nom), académie, région, apprentissage, internat, lien de la fiche, GPS. Le fichier porte ses sources (nom, URL, licence, millésime, URL et SHA-256 du CSV). Schéma : `src/lib/donnees/schema-formations.ts`, test `tests/donnees-formations.test.ts`.
- **Répartition par type** : BTS 14 635, licence 4 051, certificat de spécialisation ou FCIL 1 182, CPGE 1 015, diplôme d'État 990, BUT 960, école d'ingénieurs 705, formation professionnelle 647, DN MADE 330, école de commerce 286, DCG 195, DEUST 160, BPJEPS 139, année préparatoire 131, école d'art 111, diplôme d'établissement 106, IEP 49, architecture 46, licence professionnelle 29, école hôtelière 20, vétérinaire 6 ; « autre » : 0.
- **Couverture des champs** : intitulé, mentions, type, établissement, UAI, statut, apprentissage, lien et GPS 100 % ; commune 99,5 % ; département, académie et région 99,8 % (les 53 manquants : campus à l'étranger, Polynésie et quelques CFA dont la source laisse le département vide ; leurs coordonnées GPS sont présentes) ; filière 94,7 % (52,5 % lue dans les vœux 2025, 42,2 % reprise d'une mention identique) ; apprentissage 11 251 (43,6 %) ; internat 771 (3,0 %).
- **Code du département** : la cartographie ne donne que le nom ; le code et l'académie viennent de la table nom → code → académie des vœux 2025 (section 6), comparée sans accents ni casse (« Puy-de-dôme » = « Puy-de-Dôme »). Contrôle bloquant : chaque nom trouve un code unique.

## 6. Parcoursup 2025, vœux et admissions — ✅ OK

- **Producteur** : MESR. Jeu : https://www.data.gouv.fr/datasets/5da141da06e3e726b029a305/ (`fr-esr-parcoursup`)
- **URL de téléchargement** : https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-parcoursup/exports/csv?use_labels=true&delimiter=%3B (13 Mo) → `data/raw/parcoursup/voeux_admissions_parcoursup.csv`
- **Licence** : Licence Ouverte v2.0. **Millésime** : session 2025 (dernière session complète ; 14 252 lignes, 118 colonnes). Méthode : `Methodologie_Opendata_2025.pdf` (pièce jointe du jeu).
- **Champs retenus** : `cod_aff_form` (clé, = code interne Parcoursup de la formation), `Sélectivité`, `Capacité de l’établissement par formation`, `Effectif total des candidats pour une formation`, `Filière de formation très agrégée` / `détaillée`, `Lien de la formation sur la plateforme Parcoursup`. Facultatif pour la V1 (enrichissement : « formation sélective », nombre de places).
- **Import (tâche 1.3)** : jointure par `cod_aff_form` = code Parcoursup, dans `data/processed/formations_admission.json` (1,1 Mo, source et millésime propres) : `capacite`, `candidats`, `taux_acces` (%, tel que publié), `selective`. **13 536 formations 2026 jointes sur 25 793 (52,5 %)**, soit 93 % des formations hors apprentissage (13 536 sur 14 542) : les formations en apprentissage ne figurent pas dans ce jeu, ni celles ouvertes en 2026 ; 716 lignes 2025 n'ont plus de formation 2026. Taux d'accès publié pour 13 524 d'entre elles (12 vides) ; 10 589 sélectives. La filière (seconde colonne `Filière de formation`, ex. « BTS - Services ») alimente aussi `formations.json`. Attention : l'export a deux colonnes nommées `Filière de formation` (la première répète l'intitulé).

## 7. Onisep Idéo — ❌ inaccessible (403)

- **Jeux data.gouv.fr** (licence ODbL, mis à jour le 29/10/2026) :
  - Idéo-Métiers Onisep : https://www.data.gouv.fr/datasets/5fa5e38978ad06b169de1e1d/ → https://api.opendata.onisep.fr/downloads/5fa5949243f97/5fa5949243f97.csv (aussi `.xlsx`, `.json`, `.xml`, `.ods`)
  - Idéo-Fiches métiers : https://www.data.gouv.fr/datasets/65f4e1142b6f0e75cc7cd1aa/ → https://api.opendata.onisep.fr/downloads/5fe0808a2da6f/5fe0808a2da6f.zip
  - Idéo-Fiches formations : https://www.data.gouv.fr/datasets/65f4e107bc456c48c0e09b75/ → https://api.opendata.onisep.fr/downloads/5fe07a9ecc960/5fe07a9ecc960.zip
  - Idéo-Formations initiales en France : https://www.data.gouv.fr/datasets/68b0df7b5fc04a2f363846bb/ → https://api.opendata.onisep.fr/downloads/5fa591127f501/5fa591127f501.csv
- **Constat** : toutes ces URL renvoient **403 Forbidden** (serveur de l'Onisep). data.gouv.fr ne fait que pointer vers elles : **pas de miroir**. Non contourné (pas de changement de User-Agent).
- **Champs attendus si l'humain dépose les fichiers** (d'après la documentation du portail, à vérifier à l'ouverture) : libellé métier, code ROME associé, niveau minimum d'accès, salaire débutant, formations menant au métier, lien de la fiche onisep.fr.
- **Contournement** : `docs/BLOCKERS.md`.

## 8. CIDJ, fiches métiers — ⚠️ secours par pages

- **URL** : https://www.cidj.com/metiers/<slug>, redirigée vers https://www.cidj.com/s-orienter/metiers/<slug> (200, HTML lisible).
- **Exemple vérifié** : https://www.cidj.com/s-orienter/metiers/conducteur-conductrice-de-travaux : « Salaire brut mensuel débutant : de 2 200 à 2 700 €. Confirmé : de 3 100 à 3 200 €. » (identique à `docs/DONNEES.md`).
- **robots.txt** : `/s-orienter/metiers/` n'est pas interdit (interdits : `/admin/`, `/search/`, `/user/…`).
- **Licence** : aucune licence ouverte affichée ; reprise de faits ponctuels (salaire) avec citation de l'URL. **À valider par l'humain** (voir `DECISIONS.md`).
- **Champs retenus** : salaire brut mensuel débutant (fourchette), salaire confirmé, URL de la fiche, date de lecture. Pas de jeu téléchargeable ; pas de code ROME dans la page (rapprochement par intitulé à documenter).
- **Contraintes** : au plus 1 requête/s, client par défaut, cache local dans `data/raw/cidj/`, chaque valeur stockée avec son URL.
- **Utilisé en tâche 1.6 (salaires)** : liste des fiches prise dans le plan du site officiel https://www.cidj.com/sitemap_metiers/sitemap.xml (1 251 pages `s-orienter/metiers/`, dont 1 221 fiches métiers ; les pages de secteur sont écartées), lues par `scripts/data/recuperer_cidj.py` (au plus 1 requête/s, cache `data/raw/cidj/pages/`, `.meta.json` par page). Champs lus : titre (`h1`), date « Publié le » (millésime de la valeur), phrase « Salaire … débutant : … » de la rubrique « Quel salaire ? ». Rapprochement avec le ROME par l'intitulé et extraction : `scripts/data/import_salaires.py` → `data/processed/salaires.json` ; règles, couverture et limites : `docs/DATA_REPORT.md`, section « Salaires ».

## 17. Montant du Smic (Service-public.gouv.fr) — ✅ OK (tâche 1.6)

- **Producteur** : DILA (Premier ministre), fiche « Smic » : https://www.service-public.gouv.fr/particuliers/vosdroits/F2300 (« Vérifié le 01 juin 2026 ») → `data/raw/service-public/smic_F2300.html`.
- **Usage** : quand une fiche CIDJ écrit « Salaire brut mensuel débutant : smic », le montant affichable est le Smic mensuel brut (ou net) lu sur cette page (tableau « Montants du Smic », salarié majeur, métropole), jamais un chiffre de mémoire. Valeur marquée `montant_issu_du_smic: true` avec cette source à part (`sources.smic` de `salaires.json`).
- **Licence** : informations publiques de Service-public.gouv.fr, réutilisables avec mention de la source.

## 9. INSEE, salaires du privé par profession détaillée — ✅ OK (dépend de la source 4)

- **Producteur** : INSEE. Jeu data.gouv.fr : https://www.data.gouv.fr/datasets/67f85d13377ef83a019ac73f/ (« Salaires dans le secteur privé par catégorie socioprofessionnelle détaillée »)
- **URL de téléchargement** : https://api.insee.fr/melodi/file/DS_DERA_PRIVE_ANNUEL/DS_DERA_PRIVE_ANNUEL_2024_CSV_FR (ZIP, 375 Ko : données + métadonnées) → `data/raw/insee/DS_DERA_PRIVE_ANNUEL_2024_CSV_FR.zip`. L'URL sans millésime citée par data.gouv.fr renvoie 400.
- **Licence** : Licence Ouverte v2.0. **Millésime** : 2024.
- **Champs** : `PCS_ESE` (profession, 361 codes à 4 caractères, ex. `481A`), `AGE` (dont `Y_LT30` = moins de 30 ans), `SEX`, `ACTIVITY`, `WKTIME`, `NUMBER_EMPL`, `DERA_MEASURE` (`SALAIRE_NET_EQTP_MENSUEL_MOYENNE`, `EFFECTIFS_EQTP`), `OBS_VALUE`.
- **Remarques** : **moyenne** (pas de médiane : `QUANTILE` vaut toujours `_T`), salaire **net** en équivalent temps plein, **privé seulement** (hors agriculture et particuliers employeurs). 325 professions ont une valeur « moins de 30 ans ». Ce type de chiffre n'est pas dans la liste de `CLAUDE.md` §5 : son usage est une décision à valider (voir `DECISIONS.md`). Inutilisable tant qu'on n'a pas de table ROME ↔ PCS (source 4).

## 10. DARES, portraits statistiques des métiers — ❌ inaccessible

- Les jeux présents sur data.gouv.fr datent de 2011 (« Les portraits statistiques des métiers de 1982 à 2011 ») : **inexploitables** (anciennes nomenclatures, chiffres périmés).
- La version récente (FAP 2021) est sur dares.travail-emploi.gouv.fr, bloqué par le défi anti-robot (voir source 4).
- **Contournement** : `docs/BLOCKERS.md`.

## 11. OIT/ILO 2025, exposition à l'IA générative — ✅ OK

- **Référence** : Gmyrek P., Berg J., Kamiński K. et al., *Generative AI and Jobs: A Refined Global Index of Occupational Exposure*, ILO Working Paper 140, mai 2025, DOI 10.54394/HETP0387.
- **URL de téléchargement** : version web officielle https://webapps.ilo.org/static/english/intserv/working-papers/wp140/index.html (594 Ko) → `data/raw/ilo/wp140_index.html`. **L'annexe « Table A1. Exposure by 4-digit ISCO-08 occupation » y figure en tableau HTML** (6ᵉ tableau de la page) : **427 professions ISCO-08 à 4 chiffres**. Pas de fichier XLSX officiel trouvé. Scores par tâche : https://pgmyrek.github.io/2025_GenAI_scores_ISCO08/ (site de l'auteur, non retenu).
- **Licence** : Creative Commons Attribution 4.0 International (mention « Copyright » de la page), citation obligatoire.
- **Champs retenus** : `4-digit code` (ISCO-08), `Occupation Name`, `Mean` (score moyen d'exposition des tâches, 0 à 1), `SD` (écart type), `Exposure` : « Not Exposed » (231), « Minimal Exposure » (84), « Gradient 1 » (17), « Gradient 2 » (44), « Gradient 3 » (38), « Gradient 4 » (13). Exemples : 2512 Software Developers, gradient 3, 0,53 ; 3112 Civil Engineering Technicians, non exposé, 0,28.
- **Remarques** : les gradients combinent moyenne et écart type (tableau 5 du document : gradient 4 si μ ≥ 0,6 et μ − σ ≥ 0,5, etc.). « Exposition » ≠ « disparition ».
- **Import (tâche 1.7)** : `scripts/data/import_exposition_ia.py` (`npm run data`, après `import_isco.py`). Sortie : `data/processed/exposition_ia.json` : par fiche ROME, ISCO utilisé, intitulé OIT, score moyen, écart type, catégorie OIT, niveau affiché, autres ISCO et concordance ; la table A1 complète (427 lignes) y est recopiée ; source (nom, URL, DOI, millésime 2025, licence CC BY 4.0, SHA-256 de la page). **Niveau affiché repris des qualificatifs de l'OIT** (tableau 5) : « Not Exposed », « Minimal Exposure », « Gradient 1 » (*low exposure*) → faible ; « Gradient 2 » (*moderate*) → modérée ; « Gradient 3 » (*significant*) et « Gradient 4 » (*highest*) → élevée. Contrôle bloquant : chaque catégorie est cohérente avec les seuils du tableau 5 (tolérance d'arrondi 0,01). **1 635 fiches sur 1 923 (85,0 %)**. Schéma : `src/lib/donnees/schema-ia.ts`, test `tests/donnees-ia.test.ts`. Détails : `docs/DATA_REPORT.md`, « Exposition à l'IA ».

## 12. Correspondance ROME ↔ ESCO ↔ ISCO-08 — ✅ OK (couverture partielle)

- **Table ESCO ↔ ROME** (publiée par la Commission européenne, auteur Pôle emploi) : https://esco.ec.europa.eu/system/files/2024-10/EURESmapping_occs_FR_v1.1.csv (2,1 Mo) → `data/raw/esco/EURESmapping_occs_FR_v1.1.csv`. Page : https://esco.ec.europa.eu/en/use-esco/eures-countries-mapping-tables
  - Version du projet V1.4 (13/07/2022) ; ESCO v1.1 ↔ ROME V3. 17 lignes d'en-tête descriptif, puis le tableau.
  - Champs : `classification 1 ID` (URI de la profession ESCO), `classification 1 prefered label`, `classification 2 ID` (**code OGR de l'appellation ROME**), `classification 2 prefered label`, `mapping relation` (`skos:exactMatch` 1 144, `closeMatch` 4 597, `broadMatch` 5 086, `narrowMatch` 291).
  - 11 118 lignes, 1 915 professions ESCO. Les codes OGR d'appellation sont conservés en ROME 4.0 : 11 106 des 14 330 appellations actuelles s'y retrouvent, et **1 373 des 1 923 fiches ROME 4.0 (71 %)** ont au moins une appellation reliée.
- **ESCO → ISCO-08** : API publique ESCO, sans clé : `https://ec.europa.eu/esco/api/resource/occupation?uri=<URI>&language=fr` → champ `_links.broaderIscoGroup[].code` (ISCO à 4 chiffres). Testé : 200 (conducteur d'engins agricoles → 8341). Environ 1 915 appels à prévoir (au plus 2/s, mis en cache dans `data/raw/esco/`). Alternative : export complet ESCO (formulaire sur https://esco.ec.europa.eu/en/use-esco/download, non automatisable).
- **Licence** : contenu ESCO réutilisable gratuitement (décision 2011/833/UE de la Commission), citation de la source.
- **Remarques** : correspondance faite sur ROME V3 ; les fiches sans lien n'ont pas d'exposition IA (donnée non affichée, pas d'estimation).
- **Import (tâche 1.7)** : `scripts/data/import_isco.py` (`npm run data`). Appellation ROME 4.0 (code OGR, toutes les appellations du CSV) → profession ESCO (table) → ISCO-08 (API ESCO v1.1.1, appel léger `https://ec.europa.eu/esco/api/resource/related?uri=<URI>&relation=broaderIscoGroup&language=fr&selectedVersion=v1.1.1`, au plus 2 requêtes/s ; pour les 660 professions ESCO rattachées à une autre profession, sans groupe ISCO direct : 4 premiers chiffres du code ESCO, méthode `code_esco`). Cache réduit : `data/raw/esco/api_isco_cache.json` (consulté le 03/11/2026). Sortie : `data/processed/passage_rome_isco.json` (5,1 Mo, générique, sert aussi aux salaires ISCO → PCS) : par fiche, tous les ISCO (nombre d'appellations, liens forts, relations), chaque lien (appellation, profession ESCO, relation, méthode) et l'ISCO principal avec sa règle : lien le plus fort de l'appellation principale (1 247 fiches), sinon majorité des appellations par liens forts (324), sinon par tous les liens (90). **1 661 fiches sur 1 923 (86,4 %)**, 405 codes ISCO, 705 fiches à plusieurs ISCO. Le chiffre de 71 % ci-dessus (vérification 1.1) ne comptait que les appellations de l'export JSON, qui en omet 2 398.

## 14. INSEE, matrice PCS 2020 ↔ ISCO-08 — ✅ OK (secours partiel)

- **Producteur** : INSEE. Page : https://www.insee.fr/fr/information/8292892 (« Télécharger les tables de correspondance entre la PCS 2020 et ISCO »)
- **URL de téléchargement** : https://www.insee.fr/fr/statistiques/fichier/8292892/Matrice_PCS_ISCO_pour_programmes.csv (42 Ko, `;`, ASCII) → `data/raw/insee/Matrice_PCS_ISCO_pour_programmes.csv` ; version lisible : `Matrice_PCS_ISCO_pour_visualisation.xlsx` (même page).
- **Licence** : Licence Ouverte (conditions générales de réutilisation de l'INSEE). **Millésime** : PCS 2020, ISCO-08 (matrice de codification publiée par l'INSEE).
- **Contenu** : 1 785 lignes, 311 professions PCS 2020 (codes `10A1`, `38A1`…), 393 codes ISCO-08 à 4 chiffres.

| Champ | Rôle |
|---|---|
| `PCS4` | profession PCS 2020 (niveau 4) |
| `ISCO4` | profession ISCO-08 à 4 chiffres (clé avec les sources 11 et 12) |
| `PCT` | part (en %) des personnes de la PCS codées dans cet ISCO |

- **Usage possible** : inverser la matrice pour passer d'un ISCO (obtenu par la source 12) aux PCS 2020 les plus fréquentes. **Ne donne pas de FAP** (aucun lien vers BMO) ; liens statistiques, à marquer `method: "isco-pcs"` avec leur poids.
- **Limite** : les salaires INSEE (source 9) sont codés en **PCS-ESE 2017** (`233A`, `481A`…), pas en PCS 2020 (aucun code commun) ; il faudrait en plus la table de passage PCS 2020 ↔ PCS 2003 de l'INSEE (https://www.insee.fr/fr/information/6205275, `table_passage_2020_2003.xlsx`, non téléchargée). Chaîne longue et approximative : à n'utiliser qu'après validation humaine (voir `DECISIONS.md`, INSEE 2024).

## 13. API France Travail (ROME, Marché du travail) — 🔒 inaccessible

- https://francetravail.io : API ROME 4.0 → 401 (jeton OAuth) ; API « Marché du travail » (salaires, tensions par ROME) → inscription requise. Inutile pour le ROME (export ouvert, source 1). Pour les salaires par ROME, la page publique du Métierscope donne une fourchette des offres sans inscription : source 16.

## 16. France Travail, Métierscope : salaires des offres d'emploi — ✅ OK (tâche 1.6, à valider)

- **Producteur** : France Travail. Page publique de chaque fiche métier : https://candidat.francetravail.fr/metierscope/fiche-metier/<code ROME> (ex. https://candidat.francetravail.fr/metierscope/fiche-metier/F1201), encadré « Salaires des offres d'emploi ». Codes ROME 4.0 (les fiches créées en 4.0, comme M1806, ont leurs propres valeurs, distinctes de celles de leur fiche parente).
- **Texte affiché** : « 80 % des offres proposent un salaire brut mensuel compris entre X € et Y € » ; bulle d'aide : « Salaires bruts mensuels issus des offres récoltées par France Travail au cours des 12 derniers mois. » Territoire « France » (la page propose aussi les régions, non utilisées).
- **Données** : la page (application Angular) lit ces valeurs sur son propre service, sans authentification : `https://candidat.francetravail.fr/gw-metierscope/job/<code ROME>/labourMarket?territory=FR` (JSON : `salary.minSalary`, `salary.maxSalary`, `salary.libelleTerritoire`, `salary.libellePeriode`, ex. « 2ème trimestre 2026 » ; aussi demandeurs, offres, tension, types de contrat). Le chemin n'est pas interdit par https://candidat.francetravail.fr/robots.txt. Testé sur F1201 (1 820 à 3 333 €), M1805 (1 833 à 4 167 €), J1506 (2 083 à 3 000 €) avant généralisation.
- **Lecture** : `scripts/data/recuperer_francetravail_salaires.py`, 1 923 codes, au plus 1 requête/s, client par défaut (curl), cache `data/raw/francetravail/marche_travail/<code>.json` avec `.meta.json` (URL, date, empreinte). Lu le 4 novembre 2026.
- **Nature exacte** : fourchette interdécile (10 % des offres en dessous, 10 % au-dessus) des salaires **proposés dans les offres**, tous niveaux d'expérience, brut mensuel ; **ni un salaire de début de carrière, ni un médian**. Rangé au niveau 2 de `CLAUDE.md` §5 avec un type distinct (`offres`), seulement pour les fiches sans salaire CIDJ : voir `DECISIONS.md` (à valider).
- **Contrôles** : valeur publiée seulement pour une partie des codes (« pas de salaire publié » sinon) ; rejet si un montant sort des bornes mensuelles 1 000 à 20 000 € (bornes hautes de 22 000 à 30 000 € par exemple, manifestement des offres annuelles mêlées aux mensuelles), si la borne haute dépasse 5 fois la borne basse (même cause : 1 815 à 10 536 € pour M1810) ou si le territoire n'est pas « France ».
- **Licence** : informations publiques de France Travail ; aucune licence ouverte affichée sur la page : reprise de faits ponctuels avec l'URL de chaque fiche, à valider.

## 15. RNCP, export CSV — ✅ OK (tâche 1.4)

- **Producteur** : France compétences. Jeu data.gouv.fr « Répertoire national des certifications professionnelles et répertoire spécifique » : https://www.data.gouv.fr/datasets/5eebbc067a14b6fecc9c9976/ (export publié chaque nuit).
- **URL de téléchargement** : ressource `export-fiches-csv-AAAA-MM-JJ.zip` du jeu (9,7 Mo ; 10 CSV UTF-8, séparateur `;`). Le script prend la dernière via l'API data.gouv.fr (`/api/1/datasets/5eebbc067a14b6fecc9c9976/`) ; export utilisé : https://static.data.gouv.fr/resources/repertoire-national-des-certifications-professionnelles-et-repertoire-specifique/20261103-020002/export-fiches-csv-2026-11-03.zip → `data/raw/rncp/`.
- **Licence** : Licence Ouverte (Etalab). **Millésime** : export du 3 novembre 2026.
- **Champs retenus** : `export_fiches_CSV_Standard` (`Numero_Fiche`, `Intitule`, `Abrege_Libelle` = type : BTS, BUT, DE, CAP…, `Nomenclature_Europe_Niveau` NIV3 à NIV8, `Actif`) et `export_fiches_CSV_Rome` (`Numero_Fiche`, `Codes_Rome_Code`). 6 558 fiches actives, 14 303 liens fiche active ↔ ROME.
- **Attention** : les codes ROME du RNCP sont ceux du **ROME V3** (532 codes), c'est-à-dire les codes « parents » du ROME 4.0 (`code_rome_parent` dans `metiers.json`) : un lien RNCP vaut pour un groupe de fiches, pas pour une fiche précise. Chaque certification déclare jusqu'à 5 codes ROME (déclaratif, parfois large). Niveaux européens convertis : NIV3 → CAP (avant le bac), NIV4 → bac, NIV5 → bac + 2, NIV6 → bac + 3, NIV7 → bac + 5, NIV8 → bac + 8 ; les diplômes de docteur en santé (NIV7) ne servent pas au niveau d'études.
- **Import (tâche 1.4)** : `scripts/data/import_metier_formations.py` (`npm run data`), avec `metiers.json` et `formations.json`. Sortie : `data/processed/metier_formations.json` (≈ 2,5 Mo) : par code ROME, niveau d'études minimum, diplômes d'accès (méthode `texte_rome` ou `rncp`, numéro RNCP), mentions Parcoursup reliées (méthode, confiance, preuve) et nombre de formations ; les codes Parcoursup de chaque mention sont rangés une fois dans `mentions_parcoursup`. Schéma : `src/lib/donnees/schema-metier-formations.ts`, test `tests/donnees-metier-formations.test.ts`. Méthode et contrôles : `docs/DATA_REPORT.md`, « Lien métier ↔ formations ».

---

## 18. Onisep, pages web : durée des formations — ✅ OK (tâche 2.2)

- **Usage** : durée des formations en années après le bac, pour le filtre de Q23 (moteur, §2.3). Une ligne par type de formation, et par mention pour les diplômes d'État.
- **Pages** : filières d'études supérieures (`/formation/apres-le-bac-les-etudes-superieures/les-principales-filieres-d-etudes-superieures/…` : BTS, DEUST, BUT, licence, DN MADE), fiches formations post-bac (`/ressources/univers-formation/formations/post-bac/…` : DCG et 12 diplômes d'État, « Durée de la formation : N ans »), fiche BPJEPS, page « Après un bac professionnel » (CS et FCIL), fiche métier orthophoniste (5 ans). Lues le 4 novembre 2026. Les fichiers open data Idéo restent inaccessibles (source 7) ; les pages web, elles, répondent.
- **Méthode** : `scripts/data/durees_formations.py` télécharge chaque page (cache dans `data/raw/onisep/durees/`), vérifie que la phrase qui donne la durée y figure et la garde comme extrait, avec l'URL et la date de publication. Phrase introuvable : durée « inconnue », jamais de mémoire.
- **Écoles d'ingénieurs, de commerce, titres professionnels, architecture, vétérinaire** : N de « Bac + N » dans l'intitulé Parcoursup (source 5).
- **Sortie** : `data/processed/durees_formations.json` (21 lignes sourcées). Types absents (CPGE, licence pro, IEP…) : durée inconnue ; aucun métier éligible n'en dépend seul.

## Fichiers dérivés du moteur (tâche 2.2)

- `data/processed/acces_metiers.json` (`scripts/data/acces_metiers.py`) : postes d'expérience (13, phrase ROME citée) et d'encadrement (95), condition d'expérience citée (13) ou simple atout (41), borne haute des études, table des 14 330 appellations ROME (OGR → ROME). Dérivé du ROME 4.0 (source 1), par expressions régulières relues.
- `data/processed/conditions_travail.json` (`scripts/data/conditions_travail.py`, passe qualité du conseiller IA, 2.4) : pour les 545 métiers éligibles, les contextes de travail ROME des catégories « Conditions de travail et risques professionnels » et « Horaires et durée du travail », libellés officiels tels quels (2 763 en tout). Dérivé du ROME 4.0 (source 1). Le conseiller les envoie au LLM comme fait « c » de chaque candidat, contrôle qu'un lieu, un véhicule, une posture ou un horaire écrit par le LLM s'y lit (règle T31), et en dérive le drapeau `terrain` (seul à rendre « il n'aime pas rester assis » citable).
- `data/processed/panel_moteur.json` (`scripts/data/panel_moteur.ts`) : 200 jeux de réponses tirés à graine fixe (2026), pour la pénalité des métiers aimants. Aucune donnée externe.

## Étiquettes LLM des dimensions (tâche 2.5) — donnée dérivée, jamais affichée

- **Nature** : étiquettes de classement produites par un LLM (`method: "llm"`, CLAUDE.md §5, « Données dérivées »). Aucun chiffre affiché n'en vient ; une case `llm` n'a pas de preuve et n'est jamais citée.
- **Producteur** : xAI, modèle `grok-4.20-0309-non-reasoning`, température 0, par l'API compatible OpenAI (fournisseur du conseiller, `src/lib/conseiller/fournisseurs/xai.ts`). Étiqueté le 5 novembre 2026, prompt version 1, grille 2.1.
- **Entrée** : textes officiels du ROME 4.0 (source 1) de 565 fiches (545 métiers éligibles du catalogue et 20 fiches de l'échantillon du contrôle), extraits par `python3 scripts/data/dimensions.py --extraire-llm`, sans RIASEC ni valeur calculée ; consigne et échelle ancrée des juges (`scripts/data/accord_dimensions.py`, `docs/conception/dimensions.md` §4.4 et §4.5).
- **Script** : `npx tsx scripts/data/etiqueter_dimensions.ts` (fonctions pures et tests : `scripts/data/etiquetage.ts`, `etiquetage.test.ts`), à la main, hors `npm run data` ; compteur bloquant `.llm/compteur.json`, motif `etiquetage`, 40 appels au plus : 29 utilisés (1,27 $).
- **Sortie** : `data/processed/dimensions_llm.json` (11 865 étiquettes : niveau 0 à 4, valeur = niveau / 4, justification de 200 caractères au plus pour l'audit, modèle, date ; journal des 29 appels). Puis `python3 scripts/data/sources_dimensions.py` choisit la source de chaque dimension contre les juges → `data/processed/dimensions_sources.json`, relu par `dimensions.py`. Mesures : `docs/DATA_REPORT.md`, « Étiquetage LLM et source retenue par dimension ».

## Outil de téléchargement

`scripts/data/telecharger.py` :
- `telecharger(url, "sous/dossier/fichier")` écrit dans `data/raw/`, jusqu'à 12 essais (paramétrable) avec pause croissante, au plus 2 requêtes/s par hôte, écriture atomique, `.meta.json` de traçabilité, idempotent (`force=True` pour retélécharger) ;
- ne retente pas un 400/401/403/404/410 ; refuse une page HTML reçue à la place d'un fichier (défi anti-robot) sans chercher à la contourner ;
- `lire_json(url)` : appel d'API JSON avec les mêmes réessais ;
- en ligne de commande : `python3 scripts/data/telecharger.py URL chemin/dans/data/raw [--force]`.
