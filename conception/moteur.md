# Moteur de score

Tâche 2.2 ★, étape conception, **version 2** (révision après `docs/conception/moteur-critique.md`, commit 38c1f72 ; réponses point par point au §13). Document de référence pour l'implémentation (`src/lib/moteur/`, fonctions pures), les explications (2.3) et l'évaluation (2.4).

Sources lues : `TODO.md` (2.2, 2.4), `docs/SPEC.md` §5 et §6, `docs/page-de-vente.md`, `CLAUDE.md` §1, §5, §7, `docs/STYLE.md`, `docs/conception/dimensions.md` (v2.1), `docs/DATA_REPORT.md`, `data/processed/catalogue.json`, `metiers.json` (`acces_metier`), `formations.json`, `formations_admission.json`, `dimensions_controle.json`, `docs/conception/questionnaire.md` (v2), `questionnaire-critique-2.md` (réserves R1 à R10), `moteur-critique.md`, et **l'implémentation du questionnaire** (`src/lib/questionnaire/types.ts`, `definition.ts`, `reponses.ts`, commit 2bb1eff).

**Mesures.** Toutes les mesures viennent d'un prototype jetable (Python, hors dépôt) qui lit la **vraie définition du questionnaire** (exportée de `definition.ts` en JSON) et les réponses au format de `reponses.ts`. Les profils de référence sont donc rejouables tels quels (§10.4). Sans les corrections de cette version, le prototype redonne exactement les chiffres de la version 1 (F1135 4ᵉ, F1201 9ᵉ, F1137 13ᵉ, F1202 24ᵉ), ceux que la critique a aussi retrouvés.

---

## 0. En bref

- **Contrat avec le questionnaire** : le moteur lit les types de `src/lib/questionnaire/types.ts` tels quels (`Effet`, `Reponses`, `DIMENSIONS_REPLI_COEUR`, `PLAFOND_CONFIANCE_DIRIGER`). Il ne connaît aucune question par son texte (§1).
- **Filtres durs** (métiers **et** formations montrées) : durée d'études, refus, privé, et, nouveau, **postes d'expérience et d'encadrement** : 13 métiers dont la fiche ROME dit qu'une expérience est requise, et 95 postes d'encadrement repérés par leur intitulé et la case `diriger`. Ils ne sont jamais proposés à un lycéen (réserve R10) (§2).
- **Score** = affinité − pénalités + bonus. L'affinité est une moyenne pondérée de similarités. Nouveau : une case mal connue du métier n'est plus « neutre » ; sa similarité est rapprochée de celle d'un métier typique (moyenne de la dimension sur les 545 éligibles). Le poids du terme ne change pas (§3.3).
- **Métiers « aimants »** : une pénalité légère pour les métiers qui sortent dans le haut du classement de trop de profils d'un panel fixe (§3.6). Sur 150 profils aléatoires, le métier le plus fréquent passe de 74 trios à 28, et le nombre de métiers distincts de 95 à 101. Le seuil de 10 % proposé par la critique n'est pas atteint : on l'explique et on borne à 20 %.
- **Diversité** inchangée : trois domaines professionnels, jamais deux métiers proches ou du même métier BMO, au plus deux par grand domaine. La règle de cœur est un critère, pas un bonus (§5).
- **« Méconnu »** : la liste des métiers connus passe de 21 à 49, selon le critère écrit appliqué à tous les éligibles. Elle vaut un malus `connu` de 0,01 (§6).
- **Écartés** : une raison est toujours définie, et toujours vraie. Les raisons de marché ne valent qu'à partir de la moitié de la pénalité maximale. La raison du privé reprend le texte de R2 (§7).
- **Test SPEC §5.9** : avec les quatre réponses de l'exemple, **F1135 Chargé d'affaires BTP est 2ᵉ, F1137 3ᵉ et F1201 8ᵉ**. Dans les six variantes mesurées, un « très proche » reste 1ᵉʳ ou 2ᵉ (§10.4).
- **Postes d'encadrement ou d'expérience dans les trios** : 66 sur 150 profils aléatoires avant correction, **0** après.

---

## 1. Le profil

### 1.1 Le contrat : les types du questionnaire

Le moteur importe `Effet`, `Reponses`, `QUESTIONS`, `DIMENSIONS_REPLI_COEUR`, `PLAFOND_CONFIANCE_DIRIGER`, `champsParCle` depuis `src/lib/questionnaire/`, sans les redéfinir. Pour mémoire, l'union des effets (`types.ts`) et ce que le moteur en fait :

| `Effet["type"]` | Champs | Usage par le moteur |
|---|---|---|
| `cible` | `dim`, `valeur`, `poids` | terme de cible (§3.1) |
| `seuil` | `dim`, `valeur`, `poids` | terme à sens unique, pénalise sous `valeur` |
| `plafond` | `dim`, `valeur`, `poids` | terme à sens unique, pénalise au-dessus |
| `coeur` | `dim` (`DimensionCoeur`) | dimension de cœur (fierté, Q20) |
| `filtre_drapeau` | `drapeau` | filtre dur (Q28) |
| `etudes` | `maxAnnees` : 2, 3, 5 ou `null` | filtre dur, métiers et formations (Q23) |
| `prive` | `regle` : `tout`, `public_et_6_types`, `plus_apprentissage`, `public_d_abord` | filtre et ordre des formations (Q25) |
| `bonus_metier`, `malus_metier` | `critere` (`CritereMetier`), `poids` | bonus ou malus de score : **`poids` × 0,1 point** |
| `penalite_moteur` | `penalite` : `salaire_debut_bas` ou `recrute_peu`, `facteur` | multiplie une pénalité de marché (Q29) |
| `ordre_formations` | `regle` | ordre des formations montrées (§8.3) ; aucun effet sur le score |
| `rayon` | `rayon` : `departement_et_voisins`, `region`, `france` | ordre des formations ; critère `aucune_formation_dans_la_region` |
| `contexte` | `cle` | ignoré par le score ; `departement` et `metiers_evoques` sont lus dans les réponses (ci-dessous) |

Le moteur ne lit des `Reponses` que les identifiants d'options (choix uniques ou multiples), `departement` (code) et `metier_evoque_appellations` (codes OGR, convertis en codes ROME par la table `appellations` que `catalogue.py` ajoute au catalogue, §12). Il ne lit jamais `prenom`, `genre`, `fierte_recit` ni le texte saisi en Q30. La réponse à `scolarite` n'a plus aucun effet sur le score, seulement sur l'ordre des formations (réserve R3, déjà appliquée dans `definition.ts`). Le bonus de Q12 a été retiré par la réserve R7 ; il n'existe plus.

**Variantes.** Pour une question à plusieurs variantes, on lit les options de la variante affichée (`parcours.ts`). Les effets d'une même option sont identiques d'une variante à l'autre, vérifié sur la définition actuelle. Un test de couverture le garantit (§10.1).

### 1.2 Le type du profil

```ts
// src/lib/moteur/types.ts
import type { Dimension, DimensionCoeur, Drapeau, CritereMetier, EffetOrdreFormations, EffetRayon, EffetPrive } from "@/lib/questionnaire/types";

export type RefReponse = { cle: string; option: string };   // ex. { cle: "fierte", option: "organise" }

export type Profil = {
  version: 2;
  cibles: Partial<Record<Dimension, { valeur: number; poids: number; sommePoids: number; sources: (RefReponse & { valeur: number; poids: number })[] }>>;
  seuils: Partial<Record<Dimension, { valeur: number; poids: number; source: RefReponse }>>;
  plafonds: Partial<Record<Dimension, { valeur: number; poids: number; source: RefReponse }>>;
  coeur: { dim: Dimension; origine: "fierte" | "repli" } | null;
  interetsSecondaires: Dimension[];                    // 2 au plus (§5.2)
  filtres: { etudesMax: 2 | 3 | 5 | null; refus: Drapeau[]; prive: EffetPrive["regle"] };
  bonusMalus: { sens: "bonus" | "malus"; critere: CritereMetier; points: number; source: RefReponse }[];
  facteurs: { salaire_debut_bas: number; recrute_peu: number };   // 1 par défaut
  formations: { ordre: EffetOrdreFormations["regle"][]; rayon: EffetRayon["rayon"]; departement: string | null };
  metiersEvoques: string[];                            // codes ROME, 2 au plus
  qualite: { dimensionsDecrites: number; reponsesObservation: number; insuffisant: boolean };
  refs: Partial<Record<"etudes" | "prive" | Drapeau, RefReponse>>;  // pour les raisons d'écart
};
```

### 1.3 Construction : `construireProfil(reponses: Reponses): Profil`

1. **Parcours des réponses** par clé (ordre alphabétique des clés), puis par identifiant d'option (ordre alphabétique) : l'ordre de saisie n'a aucun effet. Une option inconnue lève une erreur.
2. **Cibles** : `valeur = Σ w·v / Σ w` ; **`poids = min(Σ w ; 3)`**. `sommePoids` garde Σ w avant plafond.
3. **`diriger`** (`PLAFOND_CONFIANCE_DIRIGER`) : la confiance du questionnaire vaut `Σw / 1,5`. Plafonner la confiance à 0,5 revient à plafonner le **poids à 0,75** (0,5 × 1,5), sauf quand la condition `saufSi` est vraie (Q10 « prend en main » et Q20 « responsabilité »).
4. **Seuils, plafonds** : pour une dimension, on garde celui de plus fort poids. À égalité, le plus exigeant (seuil le plus haut, plafond le plus bas).
5. **Cœur** : effet `coeur` de Q20 ; sinon **repli** parmi `DIMENSIONS_REPLI_COEUR`, dans son ordre : la cible de valeur ≥ 0,6 et de `sommePoids` ≥ 1 qui maximise `sommePoids × (valeur − 0,5)`. À égalité, la première dans l'ordre de la constante. Sinon `null`.
6. **Intérêts secondaires** : parmi `DIMENSIONS_REPLI_COEUR` hors cœur, les cibles de valeur ≥ 0,65 et de **`sommePoids` ≥ 0,8 (avant plafond)**, triées par `sommePoids × (valeur − 0,5)` décroissant, puis par l'ordre de la constante. On garde les deux premières.
7. **Filtres** : `etudes.maxAnnees` (absent si Q23 n'est pas répondue : la question est obligatoire, `null` par prudence) ; `filtre_drapeau` ; `prive.regle` (défaut `public_d_abord`).
8. **Bonus et malus** : chaque `bonus_metier` ou `malus_metier` devient `{ points: poids × 0,1 }`. Exemples : « alternance idéale » (×0,3) vaut +0,03 ; « le moins possible » sans formation d'un an vaut −0,015.
9. **Qualité** : `insuffisant = dimensionsDecrites < 6` (v2 §6).

Arrondi (§8.1) : chaque valeur calculée est arrondie à 10⁻⁶ avant d'être stockée dans le profil.

---

## 2. Filtres durs

`filtrer(profil, metier, index) → { exclusions: Exclusion[]; formations: FormationCompatible[] }`. Un métier est candidat si `exclusions` est vide. Toutes les raisons sont calculées, dans l'ordre ci-dessous.

### 2.1 Les filtres

1. **Niveau du métier** : `etudes.bac_plus > etudesMax` → `etudes_niveau`. Un métier accessible avant le bac passe toujours.
2. **Refus** : `dimensions.drapeaux[d]` pour chaque drapeau refusé → `refus`.
3. **Poste d'expérience (nouveau, A1)** : `acces.experience === "texte"` → `experience`.
4. **Poste d'encadrement (nouveau, A1)** : `acces.experience === "intitule"` → `encadrement`.
5. **Formations** : aucune formation compatible (§2.3) → `formations`.

### 2.2 Postes d'expérience et d'encadrement : l'attribut `acces`

Calculé par `scripts/data/catalogue.py` (nouveau champ du catalogue, avec sa méthode), jamais affiché comme un fait, sauf la phrase ROME citée :

```ts
acces: { experience: "texte" | "intitule" | null; preuve: string | null; source: Source | null; method: "texte_rome" | "intitule_et_diriger" | null }
```

- **`"texte"`** : une phrase de `acces_metier` (fiche ROME 4.0, France Travail) qui contient « expérience », **et** une formule d'exigence (`requise`, `exigée`, `demandée`, `nécessaire`, `obligatoire`, `minimum`, `au moins`, « N ans d'expérience », « plusieurs/quelques années », « expérience confirmée/significative/antérieure confirmée »), **et aucune** formule d'alternative ou de simple atout (`également`, `atout`, `appréci`, `valoris`, `peut `, `peuvent`, `utile`, `facilite`, `recommandée`, `privilégi`, `souhaitable`, `selon`, `parfois`, « accessible aux jeunes diplômés / débutants », « mais reste accessible », « ou avec / ou un / ou une / ou le / ou la / ou par / ou sans »). `preuve` = la phrase.
  Résultat sur les 545 éligibles : **13 métiers**. C1505 Responsable d'agence immobilière, E1105 Éditeur, F1114 Conseiller en rénovation énergétique, F1202 Chef de chantier bâtiment, G1241 Directeur de centre de séjour de vacances, I1105 Responsable de maintenance et d'exploitation, K1425 Délégué de l'Assurance Maladie, K2102 Coordinateur pédagogique, L1512 Régisseur de spectacles, M1301 Dirigeant d'entreprise, M1503 DRH, M1812 RSSI, N1201 Affréteur.
  La règle « ou avec » garde à dessein **F1201** : « accessible avec un diplôme de niveau Bac + 5 … ou avec une formation de niveau Bac + 2 et une expérience ». Il existe une voie sans expérience.
- **`"intitule"`** : l'intitulé ROME commence par `Directeur`, `Directrice`, `Responsable`, `Chef`, `Cheffe`, `Manager`, `Coordinateur`, `Coordinatrice`, `Coordonnateur`, `Coordonnatrice`, `Gérant`, `Gérante`, `Superviseur`, `Superviseuse`, `Encadrant`, `Encadrante`, `Dirigeant`, `Dirigeante`, ou contient `coordonnateur`, `coordinateur`, `manager`. Il faut en plus que la case `diriger` vaille ≥ 0,6 avec `method: "rome"`, et que le métier ne soit pas dans les **exceptions** (postes de début de carrière malgré le mot) : E1124 Social media manager, E1127 Brand content manager, F1125 BIM manager, G1302 Yield manager.
  Résultat : **95 métiers** (dont J1510 IDEC, G1404 Responsable de restauration collective, I1103 Chef d'atelier après-vente).
- **Pourquoi un filtre, et pas la pénalité de 0,05 proposée par la critique** : mesuré, la pénalité laisse deux postes d'encadrement dans le trio de Maxime (chef d'atelier après-vente, responsable de restauration collective), parce que son profil est très marqué « meneur ». La réserve R10 est un critère absolu (« aucun poste d'encadrement réservé à l'expérience dans les 3 pistes »). Seul un filtre la tient.
- Ces métiers peuvent devenir des **écartés** (§7). Pour `"texte"`, la raison cite la phrase ROME. Pour `"intitule"`, elle ne dit que ce que le ROME dit : on y encadre une équipe, avec la preuve de la case `diriger`. On ne dit jamais « après expérience », faute de source. Un écarté de ce type au plus par résultat : la raison est moins instructive que les autres.

### 2.3 Formations compatibles

Les formations d'un métier sont lues dans `catalogue.mentions_parcoursup[…].codes` → `formations.json`. Une formation est incompatible :
- **durée** : `etudesMax !== null` et `duree(f) > etudesMax`, ou `duree(f)` inconnue et `etudesMax ≤ 3`. `duree(f)` vient de `data/processed/durees_formations.json`, **une ligne par type, et par mention pour les diplômes d'État** (D3), chacune avec URL et millésime :

| Clé | Durée |
|---|---:|
| BTS, DEUST, CPGE | 2 |
| BUT, LICENCE, DN_MADE, DCG | 3 |
| CS_FCIL, BPJEPS | 1 |
| ARCHITECTURE | 5 |
| VETERINAIRE | 6 |
| FORMATION_PRO, ECOLE_INGENIEUR, ECOLE_COMMERCE | N lu dans « Bac + N » de l'intitulé |
| DE, par mention : D.E Orthophoniste 5 ; infirmier, éducateur spécialisé, assistant de service social, et chaque autre mention reliée | 3 (une ligne et une source par mention) |
| DE JEPS (DEJEPS), et toute ligne sans source | **inconnue** |

- **privé** (`prive.regle`) : `public_et_6_types` → une formation non publique n'est gardée que si `statut = "prive_sous_contrat"` et que son type est dans {BTS, BUT, CPGE, CS_FCIL, DN_MADE, DE} ; `plus_apprentissage` → même règle, plus toute formation privée en apprentissage ; `tout`, `public_d_abord` → toutes.

### 2.4 Le type des exclusions

```ts
export type Exclusion =
  | { code: "etudes_niveau"; bacPlusMetier: number; etudesMax: 2 | 3 | 5; reponse: RefReponse }
  | { code: "refus"; drapeau: Drapeau; reponse: RefReponse }
  | { code: "experience"; preuve: string; source: Source }                        // phrase ROME
  | { code: "encadrement"; preuvesDiriger: string[] }                              // preuves citables de la case diriger
  | { code: "formations"; parDuree: number; parPrive: number; dureeMin: number | null; reponseEtudes?: RefReponse; reponsePrive?: RefReponse };
```

Phrases, à finaliser en 2.3 (toujours vraies, sans chiffre non sourcé) :
- `etudes_niveau` : « Il faut au moins {n} ans d'études après le bac, et vous avez répondu « {réponse} ». » (« Je ne sais pas » vaut 5 ans pour le filtre ; la phrase devient alors « …et vous n'avez pas encore fixé de durée »)
- `formations`, cause durée : « Les formations qui y mènent durent au moins {dureeMin} ans, et vous avez répondu « {réponse} ». » (R9) ; cause privé : **« On ne s'y forme que dans des établissements privés, et vous avez écarté le privé payant. »** (R2) ;
- `refus` : gabarits de v2 §5.4 ;
- `experience` : « La fiche officielle du métier le dit : « {preuve} » (France Travail). » ;
- `encadrement` : « On y dirige une équipe ({preuve}). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas. » (réserve R3 : la phrase dit notre choix, pas un fait sur le métier)

### 2.5 Proximité

Inchangé : centre d'un département = moyenne des coordonnées de ses formations dans `formations.json` ; « département et voisins » = même département ou à moins de 60 km du centre ; « région » = même région. La proximité ne sert qu'à l'ordre des formations et au critère `aucune_formation_dans_la_region`.

Mesures : avec Q23 « 3 ans » et rien d'autre, 356 candidats, contre 435 avant les filtres A1. Avec « 2 ans », 280 → 233 (tableau complet au §10.4).

---

## 3. Le score

### 3.1 Formule

```
score(m) = A(m) − Σ pénalités(m) + Σ bonus(m)
A(m)     = Σₜ wₜ · sₜ(m) / Σₜ wₜ                     (moyenne sur les termes du profil)
wₜ       = Wₜ × k(dₜ)                                (ne dépend plus du métier)
sₜ(m)    = q · sim(t, v) + (1 − q) · sim(t, v̄_d)      (q = confiance de la case du métier)
```

| Terme | `Wₜ` | `sim(t, x)` |
|---|---|---|
| cible `p` | `poids` (≤ 3 ; `diriger` ≤ 0,75 sauf concordance) | `1 − |p − x|` |
| seuil `θ` | `poids` | `1 − max(0, θ − x) / θ` |
| plafond `θ` | `poids` | `1 − max(0, x − θ) / (1 − θ)` |

`v` = valeur du métier sur la dimension ; `v̄_d` = moyenne de la dimension sur les métiers **éligibles** du catalogue, calculée au chargement (aujourd'hui : `aider` 0,170, `vivant` 0,075, `dehors` 0,171, `creer` 0,195, `organiser` 0,589, `variete` 0,651…). Profil sans terme : `A = 0,5`.

### 3.2 Fiabilité de la dimension `k(d)`

`k(d) = 0,5` si `d` est **réduite**, sinon 1. Un seul facteur, jamais deux. La liste est calculée au chargement depuis `data/processed/dimensions_controle.json` (règle recopiée de la v1, réserve R2) :

- `d` est réduite si, sur le contrôle B, `B[d].cases ≥ 5` et `B[d].alpha < 0,667` ;
- ou si `B[d].cases ≥ 5`, que les paires divergent (`|B_D_J1[d].alpha − B_D_J2[d].alpha| > 0,15`) et que la plus basse des deux est sous 0,667 ;
- ou si elle est **peu discriminante** (dimensions.md §3.6) : `precision`, `variete`, `equipe`.

Résultat (vérifié par un test) : **12 dimensions réduites**, `comprendre`, `convaincre`, `creer`, `deplacements`, `ecrit`, `equipe`, `horaires`, `numerique`, `parole`, `precision`, `stress`, `variete`. `vivant` (3 cases) n'est pas mesurable et garde son poids.

### 3.3 Confiance de la case `q` : corrigée (A2)

`q` : `rome` forte 1 ; `rome` moyenne 0,8 ; `rome_absence` 0,7 (0,3 pour les 6 dimensions en échec sur l'absence informative) ; `llm` 0,6 ; `domaine` 0,3.

« En échec sur l'absence informative » (règle recopiée de la v1, réserve R2) : `C[d].cases ≥ 5` et `C[d].part_jugee_au_plus_1 < 0,8` dans `dimensions_controle.json`. Résultat (vérifié par un test) : `aider`, `chiffres`, `deplacements`, `ecrit`, `organiser`, `physique`.

**Ce qui change.** En version 1, `q` multipliait le poids du terme, et la moyenne était normalisée métier par métier. La critique a raison : une case incertaine sur la dimension la plus forte de l'enfant n'était pas neutre. Son terme, souvent mauvais, pesait moins, et la moyenne se faisait sur les autres. La phrase « n'avantage ni ne désavantage » de la version 1 était fausse ; elle est retirée.

**Maintenant**, le poids ne dépend plus du métier. Une case incertaine voit sa **similarité** tirée vers celle d'un métier typique. Un trou sur `aider` vaut donc « probablement peu d'aide » (moyenne 0,17), ce qui est le cas le plus fréquent. Cette approche n'est pas celle que la version 1 écartait (tirer vers 0,5) : `v̄_d` est une donnée, basse sur les dimensions rares.

Mesures (prototype, réponses exactes du §10.4 ; tout le reste de la version 2 identique, seule la formule de `q` change) :

| Profil, métier suivi | Formule v1 | Formule v2 |
|---|---:|---:|
| Inès, infirmière en soins généraux (J1506) | 8ᵉ | **4ᵉ** |
| Inès, médecin généraliste (J1102) | 12ᵉ | **6ᵉ** |
| Chloé, éducatrice spécialisée (K1207) | 94ᵉ | **40ᵉ** |
| Chloé, assistante sociale (K1201) | 30ᵉ | **22ᵉ** |
| Exemple, F1135 / F1201 | 2ᵉ / 13ᵉ | 2ᵉ / **8ᵉ** |

(Les rangs « v1 » ne sont pas ceux de la critique : son Inès n'est pas exactement la nôtre, ce qui est le défaut G4. Le sens de l'effet est le même.)

### 3.4 Pénalités de marché

Inchangées dans leur calcul. Une donnée absente ne donne aucune pénalité.

| Pénalité | Fraction `f` (0 à 1) | Maximum | Multipliée par |
|---|---|---:|---|
| `recrutement` | projets BMO ≤ 500 → 1 ; ≥ 2 000 → 0 ; linéaire | 0,06 | `facteurs.recrute_peu` (Q29 « emploi stable » : 2) |
| `salaire` | repère ≤ 1,05 × Smic → 1 ; ≥ 1,20 × Smic → 0 ; linéaire | 0,05 | `facteurs.salaire_debut_bas` (Q29 « bien gagner sa vie » : 2) |
| `ia` | `élevée` 1 ; `modérée` 1/3 ; `faible` 0 ; × 0,5 si `concordance: false` | 0,06 | — |

Le repère de salaire est interne et jamais affiché : milieu de la fourchette affichée, ou la valeur seule, ou le montant du Smic joint. Le Smic de référence est `salaire.smic.montant_mensuel_brut`, sinon 1 867,02 €.

### 3.5 Bonus et malus du questionnaire, malus `connu`

- `bonus_metier` / `malus_metier` : `poids × 0,1` point si le critère est vrai pour le métier. Critères (`CritereMetier`) : `independant_possible`, `secteur_public` (attributs du catalogue) ; `formation_en_apprentissage`, `formations_toutes_en_apprentissage`, `aucune_formation_un_an_au_plus` (sur les **formations compatibles**) ; `etudes_au_dela_de_3_ans` (`etudes.bac_plus > 3`) ; `aucune_formation_dans_la_region` (aucune formation compatible dans la région du département de Q26 ; faux si Q26 est passée).
- **Aucun malus lié à Q22** (G1, R3). `selectives_apres` ne touche que l'ordre des formations.
- `connu` : −0,01 pour un métier de la liste du §6.

### 3.6 Métiers « aimants » (nouveau, A3)

**Le défaut mesuré.** Sur 150 profils aléatoires (méthode de la critique : chaque question passée avec une probabilité de 0,1, sinon une option tirée au hasard, de 1 à 3 pour les choix multiples, filtres compris ; graine 7), le moteur de la version 1 met F1201 dans **74 trios** et H1205 Modéliste industriel dans 47. Il n'y a que 95 métiers distincts. Les profils tirés au hasard ont des cibles hautes un peu partout, et une similarité en `1 − |p − v|` récompense les métiers moyens-hauts partout.

**Correction retenue : pénalité de fréquence sur un panel fixe.**

```
f(m)        = part des profils du panel où m est dans les 10 premiers par affinité A (tous les éligibles, sans filtre)
pénalité    = aimant(m) = 0,15 × max(0 ; f(m) − 0,05)
```

- **Panel** : 200 profils générés par la même méthode, **sans** Q23 à Q29 (seule l'affinité compte), graine 2026. Ils sont écrits une fois dans `data/processed/panel_moteur.json` par `scripts/data/panel_moteur.py`. Le moteur lit le fichier ; il ne tire jamais d'aléa. Il recalcule `f(m)` au chargement, avec sa propre formule d'affinité : la correction suit toute modification du score.
- Aujourd'hui, 55 métiers ont `f > 0,05`. Les plus fréquents : préparateur en pharmacie 0,42 (pénalité 0,056), conducteur de travaux du bâtiment 0,31 (0,039), modéliste industriel 0,285, concepteur agencement 0,255.
- **Test sur un autre panel** (graine 7, 150 profils, filtres compris) : métier le plus fréquent **F1201, 28 trios sur 150 (18,7 %)**, puis A1213 22, K1807 20, H1206 20 ; **101 métiers distincts**. Les postes d'encadrement ou d'expérience passent de 66 trios à **0**.

**Ce qu'on a essayé avant, et pourquoi on ne va pas plus loin.**

| Correction (avec A1 et A2) | Fréquence maximale sur 150 | Métiers distincts | Exemple : F1135 / F1201 |
|---|---:|---:|---|
| aucune | F1201 70 | 81 | 2ᵉ / 4ᵉ |
| CSLS, `A − λ(Ā(m) − Ā)`, λ = 0,4 (critique) | F1201 50 | 108 | 1ᵉʳ / 7ᵉ ; Léa : « chargée de mission RH » en tête |
| CSLS, λ = 0,7 | F1201 30 | 112 | 1ᵉʳ / 5ᵉ ; le profil vide et Léa se dégradent |
| similarité asymétrique (0,5) + CSLS 0,4 | F1201 41 | 95 | 2ᵉ / 5ᵉ |
| **fréquence, μ = 0,15, f₀ = 0,05** (retenue) | **F1201 28** | **101** | **2ᵉ / 8ᵉ** |
| fréquence, μ = 0,3, f₀ = 0,10 | K2136 27 | 104 | 2ᵉ / **23ᵉ** |

Pourquoi pas 10 % : chaque fois qu'on pousse plus fort, **l'aimant change de nom** (le professeur d'enseignement artistique ou le conducteur de travaux forestiers prennent la place), et F1201 sort des dix premiers pour l'exemple même de la page de vente. Le conducteur de travaux n'est pas un artefact. Organiser, être en groupe, bouger, encadrer un peu : c'est un profil très répandu, et c'est pour cela que la page de vente l'a choisi. Les profils aléatoires sont aussi plus « moyens » que de vrais parents. On borne donc par un test (§10.2 : aucun métier dans plus de 20 % des trios, au moins 100 métiers distincts sur ce panel), et l'évaluation (2.4) refera la mesure sur ses 20 profils réalistes.

---

## 4. Ce que les pénalités ne font pas

Elles ne filtrent pas. Elles sont nommées une à une dans le résultat (`penalites: Record<string, number>` : `recrutement`, `salaire`, `ia`, `aimant`, `connu`, et chaque `malus_metier` par son critère). Seules les trois pénalités de marché peuvent devenir une raison d'écart (§7).

---

## 5. Les trois pistes

### 5.1 Compatibilité (inchangée)

Domaines professionnels différents ; aucun dans les `proches` de l'autre (relation rendue symétrique) ; métiers BMO différents. Trio : au plus deux par grand domaine ; au moins un hors liste des connus.

### 5.2 Choix du trio (précisé, D1)

- **Piste 1** = premier candidat (clé du §8.2), toujours.
- **Vivier des pistes 2 et 3** = candidats des **rangs 2 à K**, à au plus `marge` du score du premier. Paliers : (K = 30, 0,08, grand domaine strict) ; (60, 0,15, strict) ; (tous, sans marge, strict) ; (tous, sans marge, grand domaine relâché).
- Toutes les paires `(i, j)`, `i < j`, du vivier. Clé, la plus grande gagne : règle de cœur satisfaite, puis `arrondi(s_i + s_j + 0,02 × intérêts secondaires couverts à ≥ 0,6)`, puis `−i`, puis `−j`.
- On retient le premier palier **parmi 1 et 2** qui satisfait la règle de cœur. Sinon, le premier palier qui donne un trio, et `regleCoeur = "tombee"`.
- **Aucun trio au palier 4** (moins de trois domaines compatibles après des filtres très serrés) : le résultat a **deux pistes, ou une**, avec `pistesManquantes: n`. La page dit qu'avec ces contraintes, il n'en reste pas davantage (texte en 2.3). Rien n'est inventé.
- **LLM** (`validerTrio`) : le LLM peut **reformuler et réordonner**, mais le trio doit contenir le premier candidat, respecter le §5.1 et la règle de cœur, et ne contenir aucun métier hors des 15 candidats transmis. Sinon, trio déterministe.

Mesuré (150 profils, graine 7) : palier 1 dans 145 cas, palier 2 dans 5 ; règle de cœur satisfaite 150 fois sur 150 ; rang le plus bas d'une piste : médiane 4, 90ᵉ centile 8, maximum 28.

---

## 6. « Méconnu » (révisé, D4)

Aucune donnée du dépôt ne mesure la notoriété ; le rapport OCDE est inaccessible d'ici (403). La liste `METIERS_CONNUS` (`src/lib/moteur/metiers-connus.ts`, `method: "manuel"`, à valider) applique maintenant le critère écrit à **tous** les éligibles : *un métier qu'un enfant de 15 ans a déjà vu exercer, comme patient, élève, client ou usager, ou qui revient dans « tu pourrais être… »*. **49 métiers** :

A1407 Éleveur de bovins · A1416 Exploitant agricole · A1504 Vétérinaire · B1805 Styliste · C1206 Conseiller de clientèle bancaire · C1504 Conseiller immobilier · D1202 Coiffeur · D1208 Esthéticien · D1212 Vendeur en équipement de la maison · D1402 Commercial · E1106 Journaliste · E1108 Traducteur · E1201 Photographe · E1205 Designer graphique · F1101 Architecte du bâtiment · F1102 Architecte d'intérieur · G1201 Guide-accompagnateur · G1203 Animateur jeunesse · G1204 Éducateur sportif · G1235 Animateur de séjour de vacances · G1601 Chef de cuisine · H2206 Menuisier · I1309 Électricien de maintenance · I1604 Mécanicien automobile · J1102 Médecin généraliste · J1103 Dentiste · J1107 Médecin scolaire · J1202 Pharmacien · J1307 Préparateur en pharmacie · J1402 Diététicien · J1405 Opticien · J1406 Orthophoniste · J1506 Infirmier · K1104 Psychologue · K1201 Assistant de service social · K1202 Éducateur de jeunes enfants · K1207 Éducateur spécialisé · K1603 Bibliothécaire · K1901 Notaire · K1903 Juriste · K2105 Professeur de musique · K2106 Professeur des écoles · K2136 Professeur d'enseignement artistique · L1203 Comédien · M1203 Comptable · M1608 Secrétaire comptable · M1805 Développeur informatique · M1855 Développeur web · M1861 Développeur logiciel.

Policier, militaire, kiné, sage-femme, avocat, plombier ne sont pas éligibles (aucune formation Parcoursup ou aucun salaire publié), donc absents. Usage : malus `connu` de 0,01, et au moins une piste hors liste. **2.3 n'écrit jamais « un métier auquel il n'a peut-être jamais pensé » pour un métier de la liste, ni pour un métier évoqué en Q30.**

---

## 7. Les métiers écartés (révisé, G6)

### 7.1 Le type

```ts
export type RaisonEcart =
  | Exclusion                                                       // §2.4
  | { code: "recrutement"; projets: number; metierBmo: string; source: Source }
  | { code: "salaire"; salaire: SalaireAffiche }                    // le salaire affiché, avec sa source
  | { code: "ia"; niveau: "élevée"; source: Source }
  | { code: "variante"; de: string };
export type Ecarte = { code_rome: string; affinite: number; raison: RaisonEcart; autresRaisons: RaisonEcart[]; evoque: boolean };
```

### 7.2 Règles

- **Une raison de marché n'existe que si sa fraction `f` atteint 0,5, avant tout facteur** : `projets ≤ 1 250` ; repère de salaire ≤ 1,125 × Smic ; IA `élevée` (une IA « modérée » ou non concordante ne suffit jamais). Le métier doit en plus être sorti des pistes à cause des pénalités de marché : `score < score(piste 3) ≤ score + Σ pénalités de marché`. Sa raison est la pénalité de marché la plus forte, à égalité dans l'ordre recrutement, salaire, IA. Un métier que seules d'autres pénalités ont fait reculer (aimant, connu, préférences d'études, alternance, région) **n'est pas un écarté**.
- **Vivier** : métiers exclus par un filtre ; métiers « de marché » parmi les 60 premiers candidats ; variantes (score ≥ celui de la piste 3, incompatibles avec une piste).
- **Choix** : affinité ≥ plus petite affinité des pistes − δ, δ ∈ {0 ; 0,02 ; 0,05 ; sans limite}, jusqu'à en avoir 3. Tri : affinité décroissante, puis filtre, marché, variante, puis code ROME. Pas deux métiers proches. Au plus **une** variante (trois au dernier palier) et **un** écarté `encadrement`. Cinq au plus.
- Un métier évoqué (Q30) écarté passe en premier, même sous le seuil d'affinité.

Mesuré (150 profils, graine 7) : 5 écartés dans 133 cas, 4 dans 11, 3 dans 6, jamais moins de 3. Raisons : refus 239, niveau d'études 127, salaire 123, encadrement 69, recrutement 49, variante 48, expérience 46, formations 22, IA 4.

### 7.3 Exemple de la page de vente

Ingénieur d'études de prix BTP (bac + 5) · Chef d'atelier engins de chantier (encadrement) · Architecte du bâtiment (bac + 5) · Conducteur de travaux paysagers (salaire : 2 000 € brut par mois en début de carrière, CIDJ) · Directeur de travaux TP (bac + 5). L'écarté « Responsable d'animation » de la version 1 disparaît : sa pénalité de salaire (0,4 du maximum) ne vaut pas une raison.

### 7.4 Métier évoqué

Inchangé : `piste`, `ecarte`, `moins_proche` (deux termes qui l'éloignent le plus, avec les réponses), `non_eligible` (manquants du catalogue). Les codes OGR de `metier_evoque_appellations` sont convertis en codes ROME par la table `appellations` du catalogue.

---

## 8. Déterminisme

### 8.1 Règles

- Ni date, ni aléa, ni réseau dans le moteur. Le panel du §3.6 est un fichier.
- Parcours en ordre fixé (dimensions dans l'ordre de `DIMENSIONS`, métiers dans l'ordre du catalogue, formations par code, réponses par clé puis option).
- **`arrondi(x) = Math.floor(x × 10⁶ + 0,5) / 10⁶`** : au plus proche, la demi-valeur vers +∞, comme `Math.round` (D8). Le prototype Python applique la même formule. On arrondit `A`, chaque pénalité, chaque bonus, le score et les clés de paires **avant** comparaison.

### 8.2 Clés de tri

Candidats : score ↓, affinité ↓, projets BMO ↓ (absent = 0), code ROME ↑. Écartés : §7.2. Formations : §8.3.

### 8.3 Formations montrées (3 à 6 par piste)

Tri : dans le rayon d'abord ; puis, si demandé, la règle d'`ordre_formations` dans cet ordre : `professionnalisantes_d_abord`, `encadrees_d_abord`, **`bts_d_abord` (Q3 bac professionnel, G5)**, `courtes_d_abord`, `apprentissage_d_abord` ou `hors_apprentissage_d_abord`, `selectives_apres` ; puis le public d'abord si `prive` ≠ `tout` ; mention de confiance haute d'abord ; distance ; code. Une formation par mention tant qu'il en reste, jusqu'à 6. `dansLeRayon` et `prive` sont portés par chaque formation.

### 8.4 Résultat

```ts
export type ResultatMoteur = {
  moteur: { version: string; catalogue: string /* sha256 */; panel: string /* sha256 */; questionnaire: 2 };
  profil: Profil;
  pistes: Piste[];                 // 3, ou moins si impossible (pistesManquantes)
  pistesManquantes: 0 | 1 | 2;
  ecartes: Ecarte[];
  evoques: { code_rome: string; situation: SituationEvoque }[];
  candidats: CandidatResume[];     // 15 premiers (LLM, évaluation)
  regleCoeur: "satisfaite" | "sans_objet" | "tombee";
  palier: 1 | 2 | 3 | 4;
  qualite: Profil["qualite"];
};
```

`Piste` porte `score`, `affinite`, `penalites`, `bonus`, `connu`, `formations`, `liens`, `contraintes` (§9).

---

## 9. Ce que reçoivent les explications (2.3)

Pour chaque piste, des **liens** « Vous avez dit que… → dans ce métier… », construits sans texte :

```ts
export type LienExplicatif = {
  dimension: Dimension;
  type: "cible" | "seuil" | "plafond";
  poidsExplicatif: number;            // wₜ × sₜ × (cible : v ; seuil ou plafond : 1)
  reponses: RefReponse[];             // seulement celles dont l'option a une `citation` (definition.ts), la plus forte d'abord
  metier: { valeur: number; niveau: number; method: string; preuves: string[] };
  citable: boolean;                   // method = "rome" ET au moins une preuve
};
export type LienContrainte =
  | { type: "etudes"; reponse: RefReponse; bacPlusMetier: number; dureeMin: number | null }
  | { type: "alternance"; reponse: RefReponse; formationsEnApprentissage: number };
```

Règles :
- **Lien candidat** : `sₜ ≥ 0,75`. Pour une cible, il faut en plus `p ≥ 0,5` et `v ≥ 0,5`. Pour une cible basse (`p < 0,5`), il faut `v ≤ 0,4` et `citable`. La similarité est calculée ici avec `v` seul, sans le mélange du §3.3 : une phrase sur le métier ne s'appuie que sur ce qu'on sait du métier.
- **Tri** : `citable` d'abord, puis `poidsExplicatif` décroissant, puis l'ordre de `DIMENSIONS`. Six liens au plus ; 2.3 en garde 3 ou 4, plus la contrainte d'études.
- **Le cœur en tête, s'il est citable (D2)** : si la piste porte la dimension de cœur à ≥ 0,6 **et** que la case est `citable`, ce lien passe en tête. Sinon, la phrase de fierté ne s'emploie que du côté de l'enfant (« sa plus grande fierté, c'est… »), jamais comme un fait sur le métier.
- Une case non citable (`rome_absence`, `domaine`, `llm`, ou `rome` sans preuve d'activité) ne produit jamais de phrase « dans ce métier… ».
- **Bornes d'études** (D5) : quand la phrase ROME d'accès donne une fourchette (« Bac + 2 à Bac + 5 »), le catalogue en garde la borne haute (`etudes.bac_plus_max`, même source). 2.3 peut alors écrire « accessible dès bac + 2, jusqu'à bac + 5 selon les postes ». Ce n'est jamais une pénalité (voir §13, D5).

Exemple, F1201 pour la page de vente : `organiser` (Q20, 0,79, « Organiser des réunions et des visites de chantier »), `equipe` (Q4, 0,78), `physique` (seuil, Q8, 0,40), contrainte d'études (Q23 « 3 ans », bac + 2). Ce sont les quatre liens de la carte.

Attention pour 2.3 : certaines preuves sont des faux amis de lexique (F1201, `fabriquer` : « Fixer les objectifs des chefs de chantier »). L'évaluation relira les preuves citées.

---

## 10. Plan de tests

### 10.1 Unitaires

- **Couverture du contrat** (G5) : chaque option de `QUESTIONS` ne produit que des effets dont le moteur connaît le type ; chaque `CritereMetier` a sa fonction ; les effets d'une option sont identiques dans toutes les variantes.
- Profil : moyenne et plafond 3 ; `diriger` ≤ 0,75 sauf concordance ; cœur et repli (`DIMENSIONS_REPLI_COEUR`, jamais `diriger` ni `physique`) ; intérêts secondaires sur `sommePoids` avant plafond ; ordre de saisie sans effet.
- Filtres : niveau ; refus (A1504 et `soins`) ; **expérience** (G1241 exclu, F1201 non exclu grâce à « ou avec ») ; **encadrement** (G1404 exclu ; E1124 et F1125 non exclus) ; formations (BUT exclu avec 2 ans, DEJEPS inconnu exclu avec 3 ans, admis avec 5) ; privé (BTS sous contrat gardé, école de commerce privée retirée, privé en apprentissage gardé avec `plus_apprentissage`).
- Score : `sim` aux bornes ; **A2** : un métier à trou sur la dimension la plus forte du profil (cas Inès / conducteur de travaux) a une affinité plus basse qu'avec la formule de la version 1 ; `k` et `q` depuis un `dimensions_controle.json` de test ; pénalités aux bornes ; donnée absente → 0 ; facteurs de Q29 ; `bonus_metier` × 0,1 ; **aucune réponse à `scolarite` ne change un score** (G1).
- Aimants : `f(m)` sur un panel de test de 3 profils ; pénalité nulle sous 0,05.
- Sélection : piste 1 = premier candidat ; règle de cœur ; deux pistes seulement quand le palier 4 échoue (catalogue de test à deux domaines).
- Écartés : raison de marché seulement à `f ≥ 0,5` ; aucun écarté « aimant » ou « connu » ; une variante et un `encadrement` au plus ; texte de la raison privé = R2.

### 10.2 Propriétés (panel seed 7, 150 profils, méthode du §3.6 avec les filtres)

1. Reproductible, octet pour octet, et indépendant de l'ordre des réponses.
2. Aucune piste ni formation montrée ne contredit un filtre (v2 §5.4).
3. **Aucune piste `experience` ni `encadrement`** (A1, R10).
4. Pistes deux à deux compatibles ; au plus 2 par grand domaine sauf palier 4.
5. **Aimants** : aucun métier dans plus de **20 %** des trios ; au moins **100** métiers distincts (mesuré : 18,7 % et 101).
6. Toute raison de marché porte un fait au-dessus du seuil du §7.2 (G6).
7. Écartés : jamais une piste, jamais deux fois le même, 5 au plus.
8. Monotonie : ajouter un refus ne fait apparaître aucun métier qui porte ce drapeau.

### 10.3 Référence

Les profils du §10.4 sont des **fixtures** (`tests/fixtures/profils-reference.json`, au format `Reponses`, recopiées du tableau ci-dessous). Le test vérifie, à l'unité, les trois pistes et les rangs suivis. Une divergence se comprend avant de toucher au test.

### 10.4 Test d'acceptation SPEC §5.9 et profils de référence (G4)

**Définition** : « très proche » de F1201 = F1201, F1205, F1208, F1135, F1106, F1137, F1202 ; « 10 meilleurs candidats » = rangs 1 à 10 de la clé du §8.2, après filtres, avant diversité. Le test construit le profil depuis `QUESTIONS` réel.

**Réponses exactes** (format `Reponses`, `version: 2`, `passees: []` ; toute clé absente = question non répondue) :

| Profil | Réponses |
|---|---|
| **exemple** | `seul_groupe: "groupe"`, `fierte: "organise"`, `rester_assis: "besoin_de_bouger"`, `annees_etudes: "trois_ans"` |
| **theo** | `situation: "seconde"`, `seul_groupe: "deux_trois_amis"`, `temps_libre: ["dessiner_musique","ecrans"]`, `aide_demandee: ["regler"]`, `mains_tete: "les_deux"`, `rester_assis: "facile"`, `week_end: "interieur"`, `role_groupe: "observe"`, `adultes_inconnus: "reserve"`, `obtenir: "se_debrouille"`, `prendre_soin: "attentionne"`, `ecrit_oral: "autrement"`, `organisation: "cadre"`, `probleme: "cherche"`, `imprevu: "laisse_faire"`, `chiffres: "outil"`, `ecrans: "cree"`, `fierte: "cree"`, `matieres: ["arts"]`, `scolarite: "inegal"`, `annees_etudes: "ne_sait_pas"`, `alternance: "ne_sait_pas"`, `prive: "non"`, `departement: "63"`, `mobilite: "rester_pres"`, `refus: ["vente"]`, `ce_qui_compte: ["creer"]` |
| **ines** | `situation: "terminale_generale"`, `specialites: ["physique_chimie","svt"]`, `seul_groupe: "groupe"`, `temps_libre: ["aider","lire_ecrire"]`, `aide_demandee: ["ecouter","expliquer"]`, `mains_tete: "tete"`, `rester_assis: "avec_pauses"`, `week_end: "ca_depend"`, `role_groupe: "plus_que_sa_part"`, `adultes_inconnus: "a_l_aise"`, `obtenir: "negocie"`, `prendre_soin: "naturellement"`, `ecrit_oral: "les_deux"`, `organisation: "prevoit"`, `probleme: "cherche"`, `imprevu: "calme"`, `chiffres: "jeu"`, `ecrans: "pas_grand_chose"`, `fierte: "aide"`, `matieres: ["maths","physique_chimie","svt"]`, `scolarite: "tres_bien"`, `annees_etudes: "plus"`, `alternance: "pourquoi_pas"`, `prive: "ne_sait_pas"`, `departement: "93"`, `mobilite: "france"`, `refus: ["rien"]`, `ce_qui_compte: ["gagner","utile"]` |
| **maxime** | `situation: "deja_bac"`, `apres_bac_activite: "arrete"`, `apres_bac_formation: "licence"`, `apres_bac_bac: "technologique"`, `seul_groupe: "groupe"`, `temps_libre: ["amis","bricoler","sport"]`, `aide_demandee: ["organiser","reparer"]`, `mains_tete: "mains"`, `rester_assis: "besoin_de_bouger"`, `week_end: "sport"`, `role_groupe: "ambiance_lien"`, `adultes_inconnus: "a_l_aise"`, `obtenir: "negocie"`, `prendre_soin: "naturellement"`, `ecrit_oral: "oral"`, `organisation: "improvise"`, `probleme: "essaie"`, `imprevu: "calme"`, `chiffres: "outil"`, `ecrans: "pas_grand_chose"`, `fierte: "responsabilite"`, `matieres: ["sport","technologie"]`, `scolarite_apres_bac: ["cadre","theorie"]`, `annees_etudes: "deux_ans"`, `alternance: "ideal"`, `prive: "alternance"`, `departement: "59"`, `mobilite: "region"`, `refus: ["bureau"]`, `ce_qui_compte: ["gagner","stable"]` |
| **lea** | `situation: "seconde"`, `seul_groupe: "deux_trois_amis"`, `temps_libre: ["animaux_nature","comprendre"]`, `aide_demandee: ["ecouter"]`, `mains_tete: "tete"`, `rester_assis: "avec_pauses"`, `week_end: "nature"`, `role_groupe: "sa_part"`, `adultes_inconnus: "poli"`, `obtenir: "demande"`, `prendre_soin: "naturellement"`, `ecrit_oral: "ecrit"`, `organisation: "prevoit"`, `probleme: "cherche"`, `imprevu: "calme"`, `chiffres: "outil"`, `ecrans: "pas_grand_chose"`, `fierte: "resolu"`, `matieres: ["francais","svt"]`, `scolarite: "bien"`, `annees_etudes: "cinq_ans"`, `alternance: "ne_sait_pas"`, `prive: "oui"`, `departement: "35"`, `mobilite: "region"`, `refus: ["nuit","soins"]`, `ce_qui_compte: ["utile"]` |
| **kevin** (critique) | `situation: "seconde"`, `seul_groupe: "deux_trois_amis"`, `temps_libre: ["bricoler","ecrans","sport"]`, `aide_demandee: ["reparer"]`, `mains_tete: "mains"`, `rester_assis: "besoin_de_bouger"`, `prendre_soin: "autrement"`, `ecrit_oral: "autrement"`, `probleme: "essaie"`, `imprevu: "calme"`, `fierte: "fabrique"`, `matieres: ["sport","technologie"]`, `annees_etudes: "moins_possible"`, `alternance: "ideal"`, `prive: "non"`, `refus: ["bureau"]`, `ce_qui_compte: ["gagner"]` |
| **chloe** (critique) | `situation: "terminale_generale"`, `specialites: ["hlp","llcer"]`, `temps_libre: ["aider","lire_ecrire"]`, `aide_demandee: ["ecouter","expliquer"]`, `mains_tete: "tete"`, `week_end: "interieur"`, `role_groupe: "idees"`, `prendre_soin: "naturellement"`, `ecrit_oral: "ecrit"`, `organisation: "prevoit"`, `probleme: "demande"`, `chiffres: "corvee"`, `fierte: "aide"`, `matieres: ["francais","langues","philosophie"]`, `annees_etudes: "cinq_ans"`, `refus: ["chiffres","soins"]`, `ce_qui_compte: ["temps","utile"]` |
| **vide** | `annees_etudes: "trois_ans"` |

**Résultats** (prototype, version 2) :

| Profil | Candidats | Cœur | 3 pistes (rang) | Écartés | Suivis |
|---|---:|---|---|---|---|
| exemple | 356 | `organiser` | Urbaniste (1) · **Chargé d'affaires BTP (2)** · Maître d'hôtel (5) | §7.3 | F1135 2ᵉ, F1137 3ᵉ, **F1201 8ᵉ** |
| theo | 352 | `creer` | Web designer (1) · Automaticien en bureau d'études (3) · Assistant maîtrise d'œuvre en architecture (7) | Designer graphique (variante) · Photographe (recrutement) · Technicien en conception industrielle (recrutement) · Ingénieur du son (salaire) · Styliste (refus vente) | designer graphique 4ᵉ |
| ines | 437 | `aider` | Chargée de développement social (1) · Médecin du travail et de prévention (2) · Infirmière en pratique avancée (3) | Ergonome · Chargée d'emploi en travail temporaire · Mandataire judiciaire (salaire) · Directrice d'accueil de loisirs (encadrement) · Médiatrice culturelle (salaire) | infirmière 4ᵉ, médecin généraliste 6ᵉ, pharmacienne 24ᵉ |
| maxime | 158 | `fabriquer` (repli) | **Conducteur de travaux du bâtiment (1)** · Maître d'hôtel (2) · Opticien (4) | Responsable de restauration collective (encadrement) · Chargé de location d'engins · Conducteur de travaux paysagers · Concepteur agencement (salaire) · Responsable de maintenance (expérience) | éducateur sportif 92ᵉ |
| lea | 371 | `comprendre` | Animatrice QSE BTP (1) · Chargée de mission RH diversité handicap (2) · Conseillère technique agricole (3) | Vétérinaire (bac + 6) · Médecin généraliste (bac + 8) · Responsable de site naturel protégé (encadrement) · Éducatrice nature environnement · Ergonome (salaire) | — |
| kevin | 154 | `fabriquer` | Technicien datacenter (1) · Technicien d'exploitation en énergie thermique (2) · Technicien-cuisiniste (3) | Foreur (salaire) · Responsable d'îlot de production (encadrement) · Éleveur d'ovins (salaire) · Technicien de maintenance des équipements (formations > 2 ans) · Ingénieur de maintenance (idem) | — |
| chloe | 381 | `aider` | Chargée de mission RH diversité handicap (1) · Chargée de développement social (2) · Ergonome (5) | Chargée d'emploi en travail temporaire (recrutement) · Chargée d'accueil (IA) · Médecin scolaire (bac + 9) · Déléguée de l'Assurance Maladie (expérience) · CESF (salaire) | éducatrice spécialisée 40ᵉ, assistante sociale 22ᵉ |
| vide | 356 | — | Producteur audiovisuel · Assistant de service juridique · Chargé de mission RH (A = 0,5 partout ; `insuffisant`) | — | — |

**Robustesse de l'exemple** (réponses ajoutées à l'exemple) :

| Variante | Premier « très proche » | F1201 |
|---|---|---:|
| exemple seul | F1135, 2ᵉ | 8ᵉ |
| `annees_etudes: "deux_ans"` | F1135, 1ᵉʳ | 6ᵉ |
| + `role_groupe: "prend_en_main"`, `adultes_inconnus: "a_l_aise"` | F1135, 1ᵉʳ | 11ᵉ |
| + `temps_libre: ["bricoler"]`, `week_end: "ville"`, `imprevu: "calme"` | F1137, 1ᵉʳ | 2ᵉ |
| + `chiffres: "jeu"`, `imprevu: "calme"`, `organisation: "prevoit"` | F1135, 1ᵉʳ | 6ᵉ |
| + `refus: ["bureau"]` | F1135, 2ᵉ | 8ᵉ |

Lecture honnête :
- **Aucun poste d'encadrement ni d'expérience** dans les huit trios ; le défaut de la version 1 (« Chef d'atelier » pour l'exemple, « Responsable d'îlot de production » pour Kevin, deux encadrants pour Maxime) est corrigé.
- **La médecine et le soin remontent** pour Inès (médecin du travail 2ᵉ, infirmière 4ᵉ). Une réserve demeure : l'**infirmière en pratique avancée** (IPA) est une spécialisation d'infirmière diplômée, que ni l'intitulé ni le texte ROME ne signalent comme telle. C'est la « porte d'entrée » proposée par la critique ; voir Doutes.
- **Chloé** reçoit des métiers d'aide et d'écrit, sans chiffres ni soins, mais éducatrice spécialisée reste 40ᵉ. Ce n'est pas un trou de la formule : Chloé a répondu « avoir du temps pour sa vie », un plafond sur `horaires`, et le métier travaille le soir et le week-end. Le moteur fait ce que la réponse demande. C'est un cas à montrer en 2.4.
- **Léa** est décrite autant comme aidante que comme amoureuse de la nature, avec `aider` à 2,4 de poids. Ses pistes mêlent les deux (QSE et environnement, RH handicap, conseil agricole) ; aucun métier animalier n'est éligible sous bac + 5 hors vétérinaire (DATA_REPORT, A15).
- **Kevin** n'a que des techniciens en BTS : les métiers manuels courts (plombier, maçon, cuisinier…) ne sont pas éligibles faute de formation Parcoursup. C'est un biais des données, écrit dans les Doutes et dans `DECISIONS.md` (D6).

---

## 11. Approches envisagées et écartées

- **Similarité** : moyenne pondérée de `1 − |p − v|` (retenue). Cosinus centré : écarté (profil « bon partout » → bruit). **Asymétrique** (testée deux fois) : elle aide un peu Théo, mais fait monter des métiers moyens partout et ne règle pas les aimants (F1201 57 trios sur 150). Écartée.
- **Incertitude de la case** : version 1, poids × `q` normalisé par métier (écarté : biais vers les métiers à trous, A2). Tirer vers 0,5 (écarté : arbitraire). **Tirer vers la moyenne de la dimension** (retenu).
- **Postes d'expérience** : pénalité de 0,05 (critique), écartée parce que mesurée insuffisante pour Maxime. **Filtre sur deux signaux** (retenu). « Porte d'entrée » par les mobilités ROME : reportée en 2.4.
- **Aimants** : CSLS par décalage de moyenne (testé à 0,2, 0,4, 0,7 : effet faible, et dégrade Léa et le profil vide) ; rang centile par métier (écarté sans mesure : il revient à λ = 1, que la critique a vu casser l'exemple) ; **pénalité de fréquence au panel** (retenue).
- **Pénalités** : filtres durs de marché (écartés), multiplicatives (écartées).
- **Diversité** : glouton, MMR (écartés) ; paire optimale sous contraintes (retenue).
- **Méconnu** : volume BMO, nombre de formations, contact public (écartés) ; liste explicite à critère écrit (retenue, étendue à 49).

---

## 12. Implémentation

- `src/lib/moteur/` : `types.ts`, `profil.ts`, `filtres.ts`, `score.ts` (`CONSTANTES` regroupe tous les nombres des §2 à §7, avec le paragraphe source), `aimants.ts`, `selection.ts` (`choisirTrio`, `validerTrio`), `ecartes.ts`, `liens.ts`, `index.ts` (`chargerIndexMoteur`, `calculerResultat`), `metiers-connus.ts`.
- **Données ajoutées par `scripts/data/catalogue.py`** (le moteur ne lit toujours que les fichiers de `data/processed/`) : `acces` (§2.2, avec la phrase et la source pour `"texte"`), `etudes.bac_plus_max` (§9), table `appellations` (OGR → ROME, pour Q30).
- **Nouveaux fichiers** : `data/processed/durees_formations.json` (une source par ligne), `data/processed/panel_moteur.json` et `scripts/data/panel_moteur.py` (200 réponses, graine 2026, au format `Reponses`).
- Les fixtures du §10.4 dans `tests/fixtures/profils-reference.json`.

---

## Doutes

- **IPA, IADE, IBODE, IDEC, médecin du travail** : spécialisations accessibles après un premier métier (infirmier, médecin). Le texte ROME de l'IPA ne le dit pas sous une forme que la règle reconnaît. La « porte d'entrée » (proposer le métier d'entrée, avec « évolution possible : … ») est la bonne réponse ; à mesurer en 2.4.
- **Aimants à 18,7 %, pas 10 %** : borne choisie pour ne pas sortir F1201 de l'exemple de la page de vente. À remesurer en 2.4 sur des profils réalistes.
- **Règle `"texte"`** : 13 métiers, par expressions régulières relues à la main sur les 93 phrases qui citent l'expérience. Un « atout » mal classé est possible. La liste est stable et testée.
- **Filtre `"intitule"`** : 95 métiers, dont quelques postes accessibles en début de carrière dans de petites structures (chef de projet web, chef de rayon). Liste d'exceptions courte ; à compléter en 2.4 si un conseiller le demande.
- **Pénalités de marché** (0,05 à 0,06) : inchangées ; amplitude à revoir en 2.4.
- **Métiers manuels courts absents** (D6) : biais des données (Parcoursup), pas du moteur. Les profils manuels reçoivent des postes de technicien en BTS. Il faut le dire au parent (2.3).
- **Liste des métiers connus** : jugement explicite, à valider par le propriétaire.
- **Départements voisins à 60 km**, **CPGE à 2 ans** : inchangés.

---

## 12 bis. Notes d'implémentation (tâche 2.2, étape implémentation)

Code : `src/lib/moteur/` (`types.ts`, `constantes.ts`, `profil.ts`, `filtres.ts`, `score.ts`, `aimants.ts`, `selection.ts`, `ecartes.ts`, `liens.ts`, `resultat.ts`, `preselection.ts`, `donnees.ts`, `metiers-connus.ts`, `profils-aleatoires.ts`, `index.ts`). Tests : `tests/moteur-unitaires.test.ts`, `tests/moteur-proprietes.test.ts`, `tests/moteur-reference.test.ts`, fixtures `tests/fixtures/profils-reference.json`.

**Réserves de la critique 2 appliquées.**
- **R1** : `reponsesEffectives` ne garde que les champs du parcours affiché et les options affichées ; test « bac pro + spécialités = bac pro ».
- **R2** : règles de `k` et `q` recopiées aux §3.2 et §3.3, recalculées au chargement, listes vérifiées par un test.
- **R3** : phrase de l'écarté `encadrement` corrigée au §2.4 (les textes eux-mêmes sont écrits en 2.3).
- **R4** : `panel_moteur.json` généré et committé avant de figer les rangs ; `f(m)` sur `A` arrondie, départage par code ROME.
- **R5** : donnée de recrutement ou d'IA absente = pénalité moyenne des métiers qui en ont une (aujourd'hui 0,0092 et 0,0105), recrutement multiplié par le facteur de Q29 ; jamais une raison d'écart.
- **R6** (données seulement, la phrase est pour 2.3) : `acces.condition_experience` et `nature_experience` (« condition » : 13 métiers, dont F1201 ; « atout » : 41), transmis comme `LienContrainte` `experience_citee` avec `voieLongueOuverte`.
- **R8** : intérêts secondaires comptés sur le trio, piste 1 comprise ; test G1 sur « difficile » et « niveau », pas sur toute la question Q22.
- **R9** : salaire net → pas de pénalité de salaire (pas de comparaison au Smic brut).
- **R10** : tout type de formation absent de la table vaut « durée inconnue ».
- R7 est transmise à 2.4.

**Écarts avec le document.**
1. **μ = 0,2 au lieu de 0,15 (§3.6).** Avec le panel committé et 0,15, F1201 sort dans 39 trios sur 150 (26 %) et 98 métiers distincts : la propriété du §10.2 (≤ 20 %, ≥ 100) échouait. Sans pénalité, la répartition est celle du document (F1201 69, H1205 44) : c'est le panel du prototype qui différait, pas le moteur. Avec 0,2 : 27 trios (18 %), 103 distincts (graines de test 1 et 2 : 19 % et 17 %, 103 et 112 distincts) ; l'exemple garde F1135 au 1er rang. Seule la constante change.
2. **Données ajoutées dans un fichier à part**, `data/processed/acces_metiers.json` (`scripts/data/acces_metiers.py`), au lieu de nouveaux champs de `catalogue.json` : le catalogue et son schéma restent inchangés. Mêmes résultats que le §2.2 (13 « texte », 95 « intitulé »). Les phrases ROME sont redécoupées en phrases (le découpage de `metiers.json` en laisse plusieurs ensemble, cas de L1512).
3. **Durées (§2.3)** : `data/processed/durees_formations.json` cite une page Onisep par ligne, relue par le script. Architecture et école vétérinaire passent par la règle « Bac + N » de l'intitulé Parcoursup (même résultat, 5 et 6). Aucune mention CPGE n'est reliée à un métier éligible : pas de ligne.
4. **Panel en TypeScript** (`scripts/data/panel_moteur.ts`, générateur mulberry32 dans `src/lib/moteur/profils-aleatoires.ts`, partagé avec les tests de propriétés) au lieu de Python : il réutilise le parcours réel du questionnaire.
5. **`pistesManquantes` peut valoir 3** quand aucun métier ne passe les filtres.
6. **Système mixte** (décision du propriétaire du 4 novembre, après la conception) : `preselectionner(reponses, options?)` renvoie environ 20 candidats compatibles avec les filtres durs, classés, au plus 4 par grand domaine, 2 par domaine professionnel, 1 par métier BMO, chacun avec ses données sourcées, ses liens explicatifs et ses contraintes, plus le résultat du calcul seul (3 pistes de repli, écartés, évoqués).
7. **Formations** : quelques formations Parcoursup n'ont ni commune, ni département, ni région ; elles restent proposables, mais n'entrent pas dans le calcul des centres de département.

**Profils de référence, rejoués et figés** (TypeScript, panel committé ; à comparer au §10.4) :

| Profil | Candidats | 3 pistes (rang) | Écart avec le §10.4 |
|---|---:|---|---|
| exemple | 355 | Chargé d'affaires BTP (1) · Urbaniste (2) · Maître d'hôtel (5) | même trio ; F1135 passe 1er (R5, mesuré aussi par la critique) ; F1137 4ᵉ, F1201 9ᵉ ; écartés identiques au §7.3 |
| theo | 352 | Web designer (1) · Automaticien en bureau d'études (2) · Assistant maîtrise d'œuvre (6) | même trio ; designer graphique 4ᵉ |
| ines | 437 | Médecin du travail (1) · Chargée de développement social (2) · Opticienne (3) | l'IPA (4ᵉ) cède la place à l'opticienne : R5 fait reculer le développement social, sans donnée BMO, et le trio se recompose ; infirmière 5ᵉ, médecin généraliste 7ᵉ |
| maxime | 158 | Conducteur de travaux (1) · Maître d'hôtel (2) · Opticien (3) | même trio |
| lea | 371 | Animatrice QSE BTP (1) · Chargée de mission RH handicap (2) · Conseillère technique agricole (3) | identique, écartés compris |
| kevin | 154 | Technicien datacenter (1) · Technicien énergie thermique (2) · Technicien-cuisiniste (3) | identique, écartés compris |
| chloe | 381 | Chargée de mission RH handicap (1) · Ergonome (2) · Psychologue (4) | le développement social (R5) cède la place à la psychologue ; éducatrice spécialisée 41ᵉ, assistante sociale 23ᵉ |
| vide | 355 | Producteur audiovisuel · Assistant de service juridique · Chargé de mission RH | identique |

**SPEC §5.9** : F1135 Chargé d'affaires BTP est **1er** des candidats et piste 1 ; dans les cinq variantes testées, un « très proche » reste dans les 10 premiers.

**Propriétés** (150 profils, graine 7) : 0 poste d'encadrement ou d'expérience dans les trios ; aucune piste ni formation contraire à un filtre ; métier le plus fréquent 18 % des trios, 103 métiers distincts ; résultat identique octet pour octet, quel que soit l'ordre des réponses.

**Temps** : chargement de l'index environ 1 s (une fois par processus), puis environ 80 ms par bilan. `formations.json` (18 Mo) n'est lu que côté serveur (`node:fs`), jamais importé par un composant client.

---

## 13. Réponses à la critique (tour 1)

**A1 — Postes d'expérience.** *Corrigé, plus fort que demandé.* Attribut `acces` (§2.2) : 13 métiers `"texte"` (phrase ROME citable), 95 `"intitule"`. **Les deux sont des filtres**, pas une pénalité : avec la pénalité de 0,05 proposée, Maxime gardait deux postes d'encadrement (mesuré). Trios contenant un tel poste, sur 150 profils : 66 → **0**. Exemple : « Chef d'atelier machines agricoles » disparaît ; F1201 passe du 9ᵉ au 8ᵉ rang, F1135 du 4ᵉ au 2ᵉ. Écarté possible, avec une raison qui ne dit que ce que le ROME dit. « Porte d'entrée » : reportée en 2.4 (Doutes).

**A2 — Pondération par la confiance.** *Corrigé selon la proposition.* Formule du §3.3 ; la phrase « n'avantage ni ne désavantage » est retirée. Inès : infirmière 8ᵉ → 4ᵉ, médecin 12ᵉ → 6ᵉ. Chloé : éducatrice spécialisée 94ᵉ → 40ᵉ, assistante sociale 30ᵉ → 22ᵉ. Exemple : F1201 13ᵉ → 8ᵉ.

**A3 — Métiers aimants.** *Corrigé autrement, et en partie.* La correction CSLS proposée a été mesurée (λ = 0,2 / 0,4 / 0,7 : F1201 dans 59 / 50 / 30 trios sur 150), mais elle dégrade des profils réels (Léa, profil vide). Retenue à la place : une pénalité de fréquence sur un panel fixe (§3.6). Résultat : métier le plus fréquent dans **28 trios sur 150 (18,7 %)**, contre 74 ; **101 métiers distincts**, contre 95. Exemple intact (F1135 2ᵉ, F1201 8ᵉ). Propriété de test : ≤ 20 % et ≥ 100 distincts. La raison de ne pas viser 10 % est écrite au §3.6.

**G1 — Malus de Q22.** *Corrigé.* Retiré du §3.4 ; `selectives_apres` ne touche que l'ordre des formations ; test « `scolarite` ne change aucun score ».

**G2 — Raison du privé.** *Corrigé* : « On ne s'y forme que dans des établissements privés, et vous avez écarté le privé payant. » (§2.4).

**G3 — Postes d'expérience renvoyés à 2.4.** *Corrigé* par A1. La phrase des Doutes de la version 1 est retirée.

**G4 — Profils non reproductibles.** *Corrigé* : réponses exactes des huit profils au format `Reponses` (§10.4), fixtures prévues (§10.3). Le prototype les joue contre la vraie définition du questionnaire.

**G5 — Effets perdus.** *Corrigé* par l'alignement sur `types.ts` (§1.1) : `bonus_metier`, `malus_metier`, `penalite_moteur`, `ordre_formations` (dont `bts_d_abord` pour Q3 bac professionnel, au §8.3), `rayon`. Le bonus de Q12 n'existe plus (réserve R7, déjà appliquée par l'implémentation). Test de couverture du contrat (§10.1).

**G6 — Raisons d'écart.** *Corrigé* : seules les trois pénalités de marché font une raison, à partir de la moitié de leur maximum (§7.2). Exemple : « Responsable d'animation » (0,4 du maximum) n'est plus écarté pour le salaire.

**D1 — Cas limites du trio.** *Corrigé* : vivier = rangs 2 à K ; moins de trois pistes possibles → deux ou une, `pistesManquantes` ; `validerTrio` exige le premier candidat (§5.2).

**D2 — Lien de cœur non citable.** *Corrigé* (§9).

**D3 — DEJEPS.** *Corrigé* : une ligne par mention de diplôme d'État, DEJEPS « inconnue » sans source (§2.3).

**D4 — Méconnu.** *Corrigé* : critère appliqué aux 545 éligibles, 49 métiers ; malus `connu` de 0,01 ; jamais « jamais pensé » pour un métier connu ou évoqué (§6).

**D5 — Borne haute des études.** *Rejeté en pénalité, gardé en information.* 151 des métiers éligibles de niveau ≤ bac + 3 ont une fourchette qui monte à bac + 5 dans leur texte ROME, F1135 compris (« Bac + 2 à Bac + 5 »). Une pénalité décalerait le classement entier sans rien distinguer. La borne haute devient une donnée pour 2.3 (« accessible dès bac + 2, jusqu'à bac + 5 selon les postes »), au §9.

**D6 — Métiers manuels courts.** *Accepté* : Doutes, `DECISIONS.md`, et Kevin entre dans les profils de référence (à reprendre dans les 20 profils de 2.4).

**D7 — Intérêts secondaires.** *Précisé* : Σw **avant** plafond (§1.3, point 6).

**D8 — Arrondi.** *Précisé* : `Math.floor(x × 10⁶ + 0,5) / 10⁶`, identique dans le prototype (§8.1).

**D9 — Plan de tests.** *Complété* (§10.1 et §10.2) : expérience et encadrement, aimants, Q22 sans effet, seuils des raisons de marché, A2, fixtures.
