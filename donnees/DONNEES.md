# Données : pistes de sources à vérifier

**Attention** : ces pistes viennent d'une recherche rapide. Ne les tiens pas pour acquises. Vérifie chaque source (URL, licence, millésime, champs disponibles) et consigne le résultat dans `data/SOURCES.md`. Si une source est introuvable ou inaccessible, note-le dans `docs/BLOCKERS.md` et passe à la suivante.

Préfère toujours un **jeu de données téléchargeable** (CSV, XLSX, JSON) à du scraping. Le scraping de pages officielles n'est acceptable qu'en secours, de façon raisonnable (quelques requêtes par seconde au maximum), en citant l'URL de chaque valeur.

**Constaté le 3 novembre 2026** : le site onisep.fr a renvoyé une erreur 403 à une lecture automatique de ses fiches métiers, alors que cidj.com répondait normalement. Pour l'Onisep, vise ses fichiers open data plutôt que ses pages.

**Salaires** : suivre l'ordre de préférence de `CLAUDE.md` §5. Le niveau « famille de métiers » (DARES, par FAP) sert de filet de sécurité, pour que l'exigence « salaire connu » ne réduise pas la base à presque rien.

## Besoins et sources candidates

| Besoin | Sources candidates | Remarques |
|---|---|---|
| Liste des métiers, définitions, contextes de travail, savoir-être, compétences, accès, métiers proches | **ROME 4.0** de France Travail : jeu de données sur data.gouv.fr (« Répertoire Opérationnel des Métiers et des Emplois ») ; API ROME 4.0 sur francetravail.io | L'API demande une inscription (impossible cette nuit) : vise les fichiers open data. La page de vente parle de « plus de 1 900 métiers » (environ 1 923 fiches) |
| Recrutement par métier | **Enquête BMO 2026**, France Travail, sur data.gouv.fr : https://www.data.gouv.fr/datasets/enquete-besoins-en-main-doeuvre-bmo | Les métiers BMO suivent une nomenclature propre (familles professionnelles, FAP). Il faut une table de passage ROME ↔ FAP (DARES) : documente la correspondance et son taux de couverture |
| Formations post-bac, liens vers les fiches | **Parcoursup open data**, plateforme data.enseignementsup-recherche.gouv.fr : cartographie des formations Parcoursup, et le jeu « vœux et admissions » de la dernière session | Plus de 25 000 formations en 2026, dont environ 11 000 en apprentissage. Récupère l'intitulé, le type (BTS, BUT, licence, DE…), l'établissement, la ville, le département, l'apprentissage et le lien de la fiche |
| Lien métier ↔ formations | **Onisep open data** (opendata.onisep.fr, ou data.gouv.fr « Idéo-Fiches métiers » et « Idéo-Formations initiales ») ; section « accès » des fiches ROME | Onisep relie souvent métiers et formations. En secours, rapprochement par intitulé de diplôme cité dans les fiches |
| Niveau d'études minimum | Onisep (« niveau minimum d'accès ») ; fiches ROME | |
| Salaire de début de carrière | Onisep (« salaire débutant », s'il est présent dans les données) ; CIDJ (fiches métiers) ; DARES « Portraits statistiques des métiers » (salaires par FAP) ; API « Marché du travail » de France Travail (inscription requise : à mettre dans `BLOCKERS.md` pour la V2) | Ne jamais estimer un salaire. Indique le type de chiffre : brut ou net, débutant ou médian, et l'année. Mesure le taux de couverture |
| Exposition à l'IA | **OIT/ILO 2025**, « Generative AI and jobs: a refined global index of occupational exposure », scores par code ISCO-08 à 4 chiffres ; correspondance ROME → ISCO via ESCO (France Travail publie une correspondance ROME ↔ ESCO) | « Exposition » ne veut pas dire « disparition » : formule-le honnêtement. Affiche le niveau (faible, modérée, élevée) et la source |

## Chiffres déjà vérifiés (utilisés par la page de vente)

- **Exemple « Conducteur de travaux »** (CIDJ, fiche métier) :
  - salaire brut mensuel débutant de 2 200 à 2 700 € ;
  - accès par BTS Bâtiment, BTS Travaux publics (bac + 2) ou BUT Génie civil – construction durable (bac + 3).
  - Source : https://www.cidj.com/metiers/conducteur-conductrice-de-travaux
- **Recrutement, BMO 2026** (France Travail, données ouvertes, via un site agrégateur) : 6 872 projets de recrutement pour « conducteurs de travaux et chefs de chantier (non cadres) », dont 71 % jugés difficiles. **À recouper sur la source officielle.**
- **Onisep** : manipulateur d'électroradiologie, salaire débutant à partir de 1 890 € brut dans la fonction publique hospitalière. C'est un exemple de salaire de début bas : le filtre « paie mal » doit pouvoir le traiter.

## Règles de traitement

- Les scripts sont idempotents et relançables (`npm run data` ou `python scripts/data/run_all.py`).
- Les téléchargements bruts vont dans `data/raw/` (ignoré par git) ; les sorties traitées dans `data/processed/` (versionnées).
- **`docs/DATA_REPORT.md`** :
  - nombre de métiers ;
  - taux de couverture par champ (salaire, BMO, formations, IA, études) ;
  - nombre de métiers éligibles ;
  - 10 exemples complets ;
  - limites connues.
- **Seuil minimal** : au moins 300 métiers éligibles et variés, pour que les recommandations restent pertinentes. En dessous, documente-le et complète en priorité les familles de métiers manquantes.
