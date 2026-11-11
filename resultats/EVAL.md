# Évaluation du pipeline (tâche 2.6)

> Généré par `npx tsx scripts/evaluation.ts` (tour1), sauf la partie 2, écrite à la main et gardée d'une génération à l'autre. Profils : `tests/fixtures/profils-evaluation.json`. Les appels réels sont gardés hors git dans `.llm/evaluation/tour1/` : relancer le script rejoue tout hors ligne, sans appel.

Deux modes pour chaque profil :
- **calcul seul** : aucun fournisseur, comme un bilan sans clé (moteur, trio du calcul, textes des gabarits) ;
- **mixte** : le conseiller IA (xAI, `LLM_REEL=1`, motif « evaluation » du compteur bloquant) choisit dans la présélection et rédige ; validateur, réparation, relance ciblée, repli.

Contrôles automatiques (`scripts/evaluation/controles.ts`), relus sur les données brutes du catalogue et non sur la charge envoyée au LLM : contraintes du parent, diversité, données affichées et leurs sources, chiffres, diplômes et établissements cités dans les textes rédigés, origine de chaque texte, latence. « Violation » : règle cassée ; « à vérifier » : à relire ; « note » : constat.

## 1. Synthèse chiffrée

Profils passés en mixte : **21 sur 21**. Modèle : grok-4.20-0309-non-reasoning. Prompt version 4, moteur 2.4.0.

### 1.1 Le conseiller (mode mixte)

| Mesure | Valeur |
|---|---|
| Source finale : llm | 14 (67 %) |
| Source finale : partiel (trio complété par le calcul) | 7 (33 %) |
| Source finale : repli total (calcul seul et gabarits) | 0 (0 %) |
| « Pourquoi ça lui ressemble » (parent et enfant) écrits par un gabarit | 19 sur 126 (15 %) |
| « Le métier, simplement » : LLM / pré-rédigé / gabarit | 56 / 0 / 7 sur 63 |
| Phrases « Et l'IA ? » rédigées | 35 sur 47 pistes où l'exposition est affichable |
| Champs remplacés par le code (motifs) | pourquoi_enfant×25, pourquoi_parent×25, ia_phrase×15, piste×7, metier_simplement×1 |
| Appels réels | 35 (7 bilans à 1 appel, 14 à 2) ; erreurs : aucune |
| Règles en échec au premier appel | T11×93 T04×31 T30×23 T15×15 T23×13 T14×12 T12×11 T19×9 V05×8 T10×5 T33×5 T28×4 T22×3 T32×2 T18×2 T31×2 T06×1 T02×1 T05×1 T13×1 T08×1 T17×1 T09×1 V06×1 |
| Règles en échec après la relance | T11×56 T28×35 T04×22 T30×14 T15×11 T14×8 T23×5 T19×5 V04×5 T32×2 T33×2 V05×2 T12×2 V06×2 T02×1 T22×1 T17×1 T18×1 T05×1 T13×1 |
| Durée du conseiller (bilan entier) : médiane / 90ᵉ centile / maximum | 21,5 s / 27,3 s / 36,1 s ; au-delà de 55 s : 0 |
| Premier appel : médiane / maximum | 18,0 s / 21,6 s |
| Relance : médiane / maximum | 5,5 s / 15,4 s |
| Jetons : entrée (dont cache) / sortie | 923691 (122368) / 54561 |
| Coût (rendu par l'API) | 1,163 $ au total, 0,055 $ par bilan |
| Compteur partagé après ce tour | 72 / 150 ; part évaluation 35 / 84 (plafond du tour1 : 42) |
| Rejeu hors ligne fidèle | oui, pour tous les profils |

### 1.2 Contrôles automatiques (21 bilans par mode)

| Contrôle | Calcul seul : violations / à vérifier | Mixte : violations / à vérifier |
|---|---:|---:|
| Contraintes du parent (études, refus, privé, expérience) | 0 / 7 | 0 / 4 |
| Diversité (familles, métiers proches, un métier méconnu) | 0 / 0 | 0 / 0 |
| Données affichées présentes et sourcées | 0 / 2 | 0 / 2 |
| Chiffres, diplômes, établissements dans les textes | 0 / 0 | 0 / 0 |

Les notes (voie courte qui demande une expérience, aucune formation en apprentissage montrée) sont listées sous chaque profil.

### 1.3 Calcul seul et mixte, diversité sur les 21 profils

| Mesure | Calcul seul | Mixte |
|---|---|---|
| Métiers distincts dans les trios | 42 sur 63 pistes | 49 sur 63 pistes |
| Métier le plus fréquent | Conducteur / Conductrice de travaux du bâtiment : 3 profils (14 %) | Technicien-cuisiniste / Technicienne-cuisiniste en cuisines professionnelles : 3 profils (14 %) |
| Pistes marquées « souvent proposé » (aimants du panel) | 6 | 3 |
| Pistes parmi les métiers connus | 7 | 6 |
| Trio identique au calcul seul | — | 0 sur 21 |
| Pistes en commun avec le calcul seul (0 / 1 / 2 / 3) | — | 1 / 8 / 12 / 0 |
| Position des pistes choisies dans la liste envoyée (1 à 20) : médiane, au-delà de 10 | — | 4 ; 8 sur 63 |

Les plus fréquents, calcul seul : Conducteur / Conductrice de travaux du bâtiment (F1201) 3 ; Maître / Maîtresse d'hôtel (G1802) 3 ; Nez (H1505) 3 ; Technicien-cuisiniste / Technicienne-cuisiniste en cuisines professionnelles (I1325) 3 ; Technicien / Technicienne Datacenter (I1403) 3 ; Conducteur / Conductrice de travaux forestiers (A1213) 2 ; Technicien / Technicienne en agriculture (A1301) 2 ; Assistant / Assistante maîtrise d'œuvre en architecture (F1126) 2.

Les plus fréquents, mixte : Technicien-cuisiniste / Technicienne-cuisiniste en cuisines professionnelles (I1325) 3 ; Assistant / Assistante maîtrise d'œuvre en architecture (F1126) 2 ; Installateur mainteneur / Installatrice mainteneuse en systèmes solaires, thermiques et photovoltaïques (F1610) 2 ; Educateur sportif / Educatrice sportive (G1204) 2 ; Educateur / Educatrice nature environnement (G1240) 2 ; Maître / Maîtresse d'hôtel (G1802) 2 ; Modéliste industriel / Modéliste industrielle (H1205) 2 ; Ingénieur / Ingénieure énergies renouvelables (H1237) 2.

### 1.4 SPEC §5.9

| Exigence | Résultat |
|---|---|
| Test d'acceptation : « conducteur de travaux » ou un métier très proche dans les 10 meilleurs candidats de l'exemple | **OK** : Chargé / Chargée d'affaires BTP (F1135) au rang 1 ; Conducteur de travaux du bâtiment (F1201) au rang 10 |
| Métier très proche dans les pistes de l'exemple | calcul seul : Chargé d'affaires BTP ; mixte : Chargé d'affaires BTP |
| Études compatibles, diversité, aucune donnée manquante affichée, aucun chiffre non sourcé : calcul seul | **OK** sur les 21 bilans |
| Les mêmes, mixte | **OK** sur les 21 bilans passés |

<!-- analyse:debut -->

## 2. Lecture : ce qui est faible (tour 1, état mesuré sans aucun réglage)

Relecture humaine des 21 bilans mixtes et des 21 bilans du calcul seul, après les contrôles automatiques. Rien n'a été corrigé dans ce tour : le prompt, le validateur et le moteur sont ceux de 2.4 et 2.5. Les problèmes sont classés par effet sur ce que lit le parent.

### 2.1 Ce qui tient

- **Aucune règle dure cassée**, dans les deux modes : aucune piste incompatible avec la durée d'études, un métier refusé, le privé ou une expérience exigée ; trois familles de métiers différentes et au moins un métier méconnu dans chaque trio ; salaire, études et formations présents et sourcés sur les 126 cartes ; aucun chiffre, diplôme ou établissement absent des données dans les 224 textes rédigés du mode mixte (ni dans les 189 du calcul seul).
- **SPEC §5.9 passe** : Chargé d'affaires BTP 1ᵉʳ candidat de l'exemple, Conducteur de travaux du bâtiment 10ᵉ ; les deux modes gardent Chargé d'affaires BTP, et le mode mixte prend aussi Conducteur de travaux paysagers, très proche de la carte modèle.
- **Plus de repli total** : 0 sur 21 (2 sur 5 dans les essais de 2.4). Le premier appel n'est jamais accepté tel quel (21 sur 21 en échec de validation), mais la réparation par le code et la relance ciblée suffisent à garder le choix du modèle dans 14 cas sur 21.
- **Latence** : 21,5 s de médiane, 36,1 s au pire, pour 55 s permis. La relance ciblée prend 5,5 s de médiane : le seuil de 40 s n'a jamais coupé une relance.
- **Le mode mixte choisit vraiment** : aucun trio identique au calcul seul, 49 métiers distincts sur 63 pistes (42 en calcul seul), deux fois moins de métiers « souvent proposés » (3 contre 6). Plusieurs choix sont nettement meilleurs que le calcul : Éducatrice sportive et Manipulatrice d'électroradiologie pour Manon (réorientation après la PASS), Mécanicien en matériels agricoles et Aviculteur pour Théo, Modéliste industrielle pour Maëlys, Préparatrice en pharmacie pour Zoé.

### 2.2 Les trois problèmes principaux

**1. Un trio sur trois est « partiel », et la relance ciblée ne corrige presque jamais un choix fautif.** 8 premiers appels sur 21 proposent deux métiers que le moteur déclare incompatibles (V05), alors que chaque candidat porte la liste `incompatibles`. La relance ciblée n'en corrige qu'un (Jade). Dans 5 cas, le modèle « remplace » la piste fautive par un code déjà présent dans le trio (V04 : Adam, Kylian, Maëlys, Rayan, Noah) ; dans 2 cas, il garde la paire incompatible (Inès, Yanis). Résultat : 7 trios partiels, dont la 3ᵉ piste est choisie par le calcul et entièrement écrite par les gabarits (« Maître d'hôtel » pour Adam et Kylian, « Technicienne d'installation d'équipements industriels » pour Maëlys, « Technicien-cuisiniste » sans un seul lien pour Noah). C'est la cause de presque tous les « pourquoi » au gabarit : **19 sur 126 (15 %)**, pour une cible de moins de 10 %.

**2. Des rappels mal écrits, en tête du texte que lit le parent.** Le code compose « Vous avez dit que… » à partir des mots du parent ; le modèle les recopie sans la ponctuation, ou colle l'option et la phrase libre. Une douzaine de rappels sur environ 200 sont fautifs, par exemple :
- « Que sa plus grande fierté, c'est d'avoir aidé quelqu'un et quand elle a gardé tout un été les enfants des voisins » (Léa) ;
- « Qu'il n'aime pas rester assis il a besoin de bouger », « il peut passer des heures à démonter tout ce qui a un moteur en ce moment une vieille tondeuse » (Nathan) ;
- « qu'il code programme et monte des ordinateurs » (Hugo), « qu'elle crée sur ordinateur montage musique ou dessin » (Jade, Maëlys) ;
- « qu'il peut passer des heures à foot quatre fois par semaine et regarder tous les matchs » (Adam), « Tu peux passer des heures à bosser en ferme maraîchère » (Théo) : l'amorce « passer des heures à » de la question est plaquée sur une phrase qui n'y répond pas ;
- « c'est d'avoir pris la parole devant d'autres et son année d'échange en Irlande partie seule à 16 ans » (Clara, deux fois).

Le validateur vérifie que les mots viennent du parent (T04), pas que la phrase est française. Pour une mère, c'est la première phrase de la partie la plus importante de la carte.

**3. Des liens « réponse → métier » qui ne tiennent pas, invisibles pour le validateur.** Chaque lien cite une vraie réponse et un vrai fait du métier, mais le « donc » manque. Environ 30 liens parent sur 200 (un sur sept) relèvent d'un rapprochement de mots, pas d'une raison :
- « elle cuisine sur son temps libre : elle prépare et monte les verres avec précision » (Opticienne, Chloé) ;
- « il peut passer des heures à tester des recettes de pâtisserie : il conçoit et installe des cuisines » (Technicien-cuisiniste, Tom) ;
- « il est à l'aise en sport : il se rend sur les chantiers » (Assistant maîtrise d'œuvre, Yanis) ;
- « elle garde son calme quand les autres paniquent : elle réalise des audits » (Ingénieure qualité, Louise) ;
- « elle s'occupe tout naturellement des plus jeunes : elle identifie et évalue les compétences de chaque personne » (Conseillère en gestion de carrière, Léa) ;
- « son exposé sur les loups : elle assure une veille technologique et réglementaire » (Technicienne en agriculture, Sarah) ;
- « elle peut passer des heures à regarder des séries en anglais : elle rédige des documents de positionnement » (Chargée de plaidoyer, Clara).

Les textes de l'enfant mêlent aussi le présent et le conditionnel (« tu animes », « tu conçois et installes », « tu élèves et soignes » à côté de « tu organiserais ») dans une quinzaine de textes sur 63.

### 2.3 Les pistes, vues par un conseiller d'orientation

- **Des familles entières de métiers manquent au catalogue, et le moteur ne peut pas les proposer.** Tom (bac pro cuisine, le plus fier d'un repas pour vingt personnes) ne reçoit ni cuisinier ni pâtissier : G1609, G1610, D1104, G1602 sont « non éligibles », faute de formation reliée. Même cause pour Sarah (animaux) : auxiliaire vétérinaire, soigneur animalier, éducateur canin non éligibles ; pour Adam : Kinésithérapeute évoqué par le parent, non éligible ; pour Léa : auxiliaire de puériculture, animatrice petite enfance non éligibles, Éducatrice de jeunes enfants 53ᵉ. Le mode mixte fait alors des choix de contournement (Technicien-cuisiniste pour Tom, Pédologue pour Sarah). C'est le premier sujet du tour 2 côté données (formations hors Parcoursup : CAP, titres, écoles paramédicales), à arbitrer avec le propriétaire.
- **Des pistes discutables pour l'âge ou le profil** : Conseillère en gestion de carrière (bac + 5, ressources humaines) pour Léa, en Seconde, qui garde des enfants et aime les animaux (le calcul seul proposait Chargée de mission RH diversité handicap) ; Agent d'exploitation transport routier (planification au bureau) dans l'exemple, pour un enfant qui « n'aime pas rester assis » ; rien d'international ni de linguistique pour Clara (langues, voyage) ; Événementiel de particuliers pour Inès (SES, très bonne élève, veut bien gagner sa vie).
- **Profils pauvres** : Noah (9 réponses d'observation) reçoit Automaticien, Agent de maintenance bureautique et Technicien-cuisiniste « qui ressort de l'ensemble de vos réponses » : le texte n'explique rien. Le Technicien-cuisiniste est aussi la piste la plus fréquente du mode mixte (3 profils sur 21) : un aimant des profils techniques ou peu décrits.
- **L'exemple de la page de vente** : la carte modèle cite d'abord la fierté (« organiser, c'est le cœur du métier »). Dans le mode mixte, Chargé d'affaires BTP ne la cite pas côté parent : la règle « une réponse dans deux pistes au plus » (T15) l'a réservée aux deux autres pistes. Avec quatre réponses, la contrainte prive la meilleure piste de sa meilleure raison.
- **Manipulatrice d'électroradiologie**, choisie pour Manon, est aussi l'un des deux exemples du prompt. Le choix se défend ici, mais à surveiller : un exemple de prompt peut devenir un aimant.

### 2.4 Autres constats

- **« Et l'IA ? »** : 35 phrases, toutes sur le même moule (« L'IA peut… Mais…, ça reste humain / ça se fait en personne / sur le terrain »). Lue sur trois cartes de suite, la répétition se voit.
- **Champs non montrés trop longs** : 104 `raison_du_choix` et 35 `analyse` dépassent leur longueur, à chaque appel. Sans effet visible (ils ne déclenchent ni relance ni gabarit), mais du bruit dans les motifs et de la sortie payée pour rien.
- **Coût** : 0,055 $ par bilan, au-dessus de l'estimation de la conception (0,021 à 0,048 $). Environ 26 000 jetons d'entrée par premier appel, dont 13 % seulement servis depuis le cache.
- **Gabarits (calcul seul, et toute piste ajoutée par le calcul)** : liens absurdes (« il est à l'aise en sport : réaliser les opérations de nettoyage et de réglage sur les matériels »), jargon de fiche (« faire preuve d'appétence pour l'utilisation de logiciels numériques », « le personnel relevant de sa responsabilité »), accords faux (« Elle est chargé de l'installation », « L'animateur nature environnement » dans un texte au féminin), « Le métier, simplement » en ton de plaquette (« transformant une vision artistique en un projet concret, viable et abouti »).
- **Données affichées** : fourchettes de salaire d'offres d'emploi très larges (« 1 896 à 7 448 € brut par mois », Chargée de mission RH diversité handicap), montants à centimes (« 1 867,02 à 1 900 € ») ; quatre pistes mixtes sans aucune formation dans le rayon demandé (Théo, Chloé, Zoé, Emma) ; deux pistes avec une ou deux formations seulement (Agent d'exploitation transport routier, Assistante de service juridique, celle-ci sans apprentissage alors qu'Emma le voulait).
- **Faits plausibles mais non vérifiables par le code** (liste fermée de T31) : « parfois en anglais » (I1329), « avec des charges lourdes » (I1325), « ce métier se fait souvent en alternance » (F1610 : « souvent » n'est pas sourcé), « au milieu des champs » (I1603). À trancher en relecture.

### 2.5 Pour le tour 2 (à décider, rien n'est appliqué)

Par ordre d'effet attendu :
1. **Choix** : rendre l'incompatibilité impossible plutôt que demandée (par exemple, le code retire des candidats proposés à la relance ceux qui sont incompatibles avec les pistes gardées, et refuse un `remplace` vers un code déjà présent), ou remplacer la piste fautive par le meilleur candidat compatible avant toute relance ; viser 0 trio partiel.
2. **Rappels** : composer « Vous avez dit que… » à partir de la citation officielle de l'option quand elle existe, et ne reprendre la phrase libre que telle quelle, ponctuation comprise ; refuser un rappel qui colle deux propositions sans ponctuation.
3. **Liens** : consigne et exemples de prompt sur le « parce que » (le fait du métier doit être la même activité, la même situation ou la même qualité que la réponse) ; un contrôle léger de recouvrement de sens n'est pas à la portée du code, d'où l'importance du prompt.
4. **T15** : l'assouplir pour les profils à moins de 6 réponses citables (l'exemple).
5. **Catalogue** : rendre éligibles les métiers dont les formations sont hors Parcoursup (CAP, écoles paramédicales, titres professionnels), si le propriétaire l'accepte : c'est hors du conseiller, et plus long.

Budget : 35 appels consommés sur les 42 permis pour ce tour ; la part « évaluation » en garde 49 pour le tour 2.

<!-- analyse:fin -->

## 3. Les 21 profils

### 3.1. `exemple`

L'exemple de la page de vente, mot pour mot : plus à l'aise en groupe, le plus fier d'avoir organisé seul un week-end entre copains (avec ce récit), n'aime pas rester assis, pas plus de 3 ans d'études. Rien d'autre.

*Incomplet, volontairement* : La page de vente ne donne que ces quatre réponses et le récit : c'est le cas du test d'acceptation de SPEC §5.9.

- Situation : — ; genre : —
- Contraintes : études trois_ans ; alternance — ; privé — ; département —, mobilité — ; refus — ; ce qui compte —
- Phrases libres : fierte_recit « Le jour où il a organisé, tout seul, un week-end entre copains. »

#### Calcul seul

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 11 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,1 s.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Chargé d'affaires BTP (F1135) | 1 | 1 | Conception et études | 1 972 à 3 750 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Chargé / Chargée d'affaires BTP » (France Travail, France entière) ; France Travail, Métierscope, fiche métier F1135, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 1 424 projets, 63 % difficiles (Cadres des études BTP, des études géologiques, du métré de la construction et du contrôle et diagnostic technique du BTP ; 2026) |
| 2 | Urbaniste (K1807) | 2 | 2 | Développement territorial et emploi | 2 500 € brut par mois (salaire brut mensuel de début de carrière du métier « Urbaniste » ; CIDJ, fiche métier « Urbaniste », 2024) | bac + 3 | non affiché (donnée absente) |
| 3 | Maître d'hôtel (G1802) | 5 | 4 | Service | 1 833 à 2 605 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Maître / Maîtresse d'hôtel » (France Travail, France entière) ; France Travail, Métierscope, fiche métier G1802, encadré « Salaires des offres d'emploi », 2026) | bac | 93 769 projets, 42 % difficiles (Serveurs de cafés restaurants ; 2026) |

- Formations, F1135 : 6 montrées sur 555 : BTS - Production - Systèmes constructifs bois et habitat - en apprentissage (Soissons), apprentissage ; BTS - Production - Management économique de la construction (Antibes) ; BUT - Génie civil - Construction durable (La Rochelle) ; …
- Formations, K1807 : 6 montrées sur 78 : Licence - Géographie et aménagement (Nice) ; BUT - Carrières sociales parcours villes et territoires durables (Aix-en-Provence) ; C.M.I - Cursus Master en Ingénierie - Géographie et aménagement - Cursus Master en Ingénierie (CMI) : Sciences de l'information géographique pour l'innovation territoriale (SIGIT) (Besançon) ; …
- Formations, G1802 : 6 montrées sur 238 : BTS - Services - Management en hôtellerie restauration (Soissons) ; BTS - Services - Management en hôtellerie restauration - en apprentissage (Argenton-sur-Creuse), apprentissage ; BTS - Services - Management en hôtellerie restauration (Cusset) ; …

Écartés :

- Chef d'atelier machines agricoles (I1110) : On y dirige une équipe (optimiser l'utilisation des ressources de l'atelier). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.
- Ingénieur d'études de prix BTP (F1106) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 3 ans ».
- Architecte du bâtiment (F1101) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 3 ans ».
- Conducteur de travaux paysagers (A1221) : Le salaire de départ y est proche du Smic : environ 2 000 € brut par mois en début de carrière (source : CIDJ, fiche métier « Conducteur / Conductrice de travaux paysagers », 2026).
- Directeur de travaux TP - Travaux Publics (F1210) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 3 ans ».

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Chargé d'affaires BTP**. *Le métier, simplement* (gabarit) : Il pilote les aspects commerciaux et techniques des projets de construction et accompagne les clients dans la réalisation des travaux. Concrètement, il élabore des propositions techniques et commerciales adaptées aux besoins des clients, supervise et coordonne les projets de construction ou de rénovation et assure la liaison entre les différents intervenants sur le chantier et les clients.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir organisé quelque chose de A à Z : dans ce métier, il aurait à coordonner les études techniques et les études de prix. Et qu'il ne veut pas plus de 3 ans d'études : c'est accessible dès bac + 2, jusqu'à bac + 5 selon les postes.
  *Pour l'enfant* : Tu as déjà organisé quelque chose de A à Z : ici, tu aurais à coordonner les études techniques et les études de prix. Tu vises trois ans d'études au plus : tu peux y accéder dès bac + 2, jusqu'à bac + 5 selon les postes.
- **Urbaniste**. *Le métier, simplement* (gabarit) : Il gère la conception et l'aménagement des espaces urbains à travers des projets de développement durable. Concrètement, il analyse les besoins des populations et les contraintes environnementales pour optimiser une organisation spatiale des villes et collabore avec des acteurs professionnels pour la mise en œuvre des projets en collectant des données économiques, démographiques et sociologiques.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir organisé quelque chose de A à Z : dans ce métier, il aurait à coordonner les projets d'urbanisme avec les autres services municipaux. Et qu'il ne veut pas plus de 3 ans d'études : c'est accessible dès bac + 3.
  *Pour l'enfant* : Tu as déjà organisé quelque chose de A à Z : ici, tu aurais à coordonner les projets d'urbanisme avec les autres services municipaux. Tu vises trois ans d'études au plus : tu peux y accéder dès bac + 3.
- **Maître d'hôtel**. *Le métier, simplement* (gabarit) : Il accueille et conseille les clients dès leur arrivée dans l'établissement, coordonne et supervise le travail de l'équipe de salle et assure la gestion des réservations et l'organisation des tables.
  *Pourquoi* : Vous avez dit qu'il est plus à l'aise en groupe : dans ce métier, il aurait à coordonner les réservations et optimiser l'occupation de la salle.
  *Pour l'enfant* : Tu es à l'aise en groupe : ici, tu aurais à coordonner les réservations et optimiser l'occupation de la salle. Tu vises trois ans d'études au plus : tu peux y accéder dès le bac.

</details>

#### Mixte

Source : **llm**. Champs remplacés : F1135.pourquoi_enfant, N4204.pourquoi_parent, N4204.pourquoi_enfant, N4204.ia_phrase, A1221.pourquoi_parent, A1221.pourquoi_enfant, F1135.pourquoi_parent. Durée du conseiller : 15,2 s.

Appels : appel 1 (conseil) : echec_validation, 11,5 s, 21696 jetons en entrée (128 en cache), 1532 en sortie, 0,031 $ ; règles en échec : T04×4 T11×4 T23 T32×2 T15×4 ; appel 2 (correction) : echec_validation, 3,5 s, 23757 jetons en entrée (128 en cache), 440 en sortie, 0,031 $ ; règles en échec : T04×5 T11×4 T23 T32×2 T15×4.

Contrôles : aucune violation, 1 à vérifier, 0 note(s) ; 4 nombre(s) et 0 diplôme(s) cités dans 11 textes. Liens parent + enfant par piste : 3+3, 2+2, 2+1.

  - à vérifier · donnees · N4204 : 2 formation(s) montrée(s), 3 à 6 attendues (SPEC §6)

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Chargé d'affaires BTP (F1135) | 1 | 1 | Conception et études | 1 972 à 3 750 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Chargé / Chargée d'affaires BTP » (France Travail, France entière) ; France Travail, Métierscope, fiche métier F1135, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 1 424 projets, 63 % difficiles (Cadres des études BTP, des études géologiques, du métré de la construction et du contrôle et diagnostic technique du BTP ; 2026) |
| 2 | Agent d'exploitation transport routier de personnes (N4204) | 6 | 5 | Personnel d'encadrement du transport routier | 1 802 à 2 600 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Agent / Agente d'exploitation transport routier de personnes » (France Travail, France entière) ; France Travail, Métierscope, fiche métier N4204, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 3 162 projets, 22 % difficiles (Agents d'exploitation du transport ; 2026) |
| 3 | Conducteur de travaux paysagers (A1221) | 8 | 7 | Espaces naturels et espaces verts | environ 2 000 € brut par mois (salaire brut mensuel de début de carrière du métier « Conducteur / Conductrice de travaux paysagers » ; CIDJ, fiche métier « Conducteur / Conductrice de travaux paysagers », 2026) | bac + 2 | 30 695 projets, 41 % difficiles (Jardiniers des espaces verts et naturels ; 2026) |

- Formations, F1135 : 6 montrées sur 555 : BTS - Production - Systèmes constructifs bois et habitat - en apprentissage (Soissons), apprentissage ; BTS - Production - Management économique de la construction (Antibes) ; BUT - Génie civil - Construction durable (La Rochelle) ; …
- Formations, N4204 : 2 montrées sur 2 : Formation professionnelle - Titre professionnel - Exploitant régulateur en transport routier de voyageurs (Bac +2) - en apprentissage (Wasquehal), apprentissage ; Formation professionnelle - Titre professionnel - Exploitant régulateur en transport routier de voyageurs (Bac +2) - en apprentissage (Artigues-près-Bordeaux), apprentissage
- Formations, A1221 : 6 montrées sur 133 : BTS - Agricole - Aménagements paysagers (Antibes) ; BTS - Agricole - Aménagements paysagers - en apprentissage (Le Subdray), apprentissage ; BTS - Agricole - Aménagements paysagers (Saintes) ; …

Écartés :

- Chef d'atelier machines agricoles (I1110) : On y dirige une équipe (optimiser l'utilisation des ressources de l'atelier). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.
- Ingénieur d'études de prix BTP (F1106) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 3 ans ».
- Architecte du bâtiment (F1101) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 3 ans ».
- Directeur de travaux TP - Travaux Publics (F1210) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 3 ans ».
- Régisseur de spectacles (L1512) : La fiche officielle du métier le dit : « Une expérience confirmée dans la production du spectacle vivant est en général requise » (France Travail).

Les textes du mode mixte :

**1. Chargé d'affaires BTP (F1135)**

**Le métier, simplement** (llm). Il pilote des projets de construction du début à la fin. Il prépare les propositions pour les clients, coordonne les équipes sur le chantier, fait le lien avec eux et vérifie que tout est conforme aux normes. Il passe du bureau aux chantiers selon les jours.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut générer des propositions techniques ou des plannings. Mais négocier avec un client sur un chantier ou ajuster en direct avec les équipes, ça reste une affaire de contact humain.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'il est plus à l'aise en groupe : il assure la liaison entre les équipes sur le chantier et les clients. Qu'il a besoin de bouger : il passe régulièrement du bureau d'études au chantier. Et qu'il ne veut pas plus de 3 ans d'études : c'est accessible dès bac + 2.

**Pour l'enfant** (llm). Tu as déjà organisé quelque chose de A à Z : tu piloterais un projet de construction en coordonnant les études et les délais. Tu es à l'aise en groupe : tu ferais le lien entre les équipes sur le chantier et les clients. Tu as besoin de bouger : tu passerais du bureau au terrain selon les jours.

**2. Agent d'exploitation transport routier de personnes (N4204)**

**Le métier, simplement** (llm). Il organise les trajets et les plannings des véhicules de transport de personnes. Il coordonne les conducteurs, gère les imprévus en temps réel et veille à ce que tout roule en respectant les règles de sécurité. Il travaille en lien avec les équipes sur le terrain.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que sa plus grande fierté, c'est d'avoir organisé quelque chose de A à Z : il organise et supervise les itinéraires et les plannings des conducteurs. Et qu'il est plus à l'aise en groupe : il coordonne les activités des conducteurs et maintient la communication avec les équipes sur le terrain.

**Pour l'enfant** (llm). Tu as déjà organisé quelque chose de A à Z : tu organiserais les itinéraires et les plannings des véhicules. Tu es à l'aise en groupe : tu coordonnerais les conducteurs et communiquerais avec les équipes sur le terrain.

**3. Conducteur de travaux paysagers (A1221)**

**Le métier, simplement** (llm). Il organise plusieurs chantiers d'espaces paysagers en même temps. Il définit les équipes et le matériel, planifie les travaux, coordonne les interventions sur place et vérifie que tout est fait dans les délais et les règles. Il passe beaucoup de temps dehors.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut aider à planifier des plannings. Mais coordonner une équipe sur un chantier en extérieur ou négocier avec un client sur place, ça reste du contact direct.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que sa plus grande fierté, c'est d'avoir organisé un week-end entre copains tout seul : il définit les moyens et planifie l'affectation des équipes et des équipements. Et qu'il a besoin de bouger : il travaille en extérieur sur les chantiers.

**Pour l'enfant** (gabarit). Tu vises trois ans d'études au plus : tu peux y accéder dès bac + 2.

### 3.2. `lea_seconde`

Léa, Seconde, Nantes. Attentive aux autres, garde des enfants, aime les animaux. Prête à 5 ans d'études, mobile dans sa région. Refuse les chiffres.

- Situation : seconde ; genre : elle
- Contraintes : études cinq_ans ; alternance ne_sait_pas ; privé ne_sait_pas ; département 44, mobilité region ; refus chiffres ; ce qui compte utile, temps
- Phrases libres : temps_libre_precis « Elle garde les deux petits des voisins presque tous les mercredis. » ; fierte_recit « Quand elle a gardé tout un été les enfants des voisins et qu'ils pleuraient le jour où elle est partie. »
- Questions passées : metier_evoque

#### Calcul seul

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 4 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,2 s.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Chargée de mission RH diversité handicap (M1510) | 1 | 1 | Ressources humaines | 1 896 à 7 448 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Chargé / Chargée de mission RH diversité handicap » (France Travail, France entière) ; France Travail, Métierscope, fiche métier M1510, encadré « Salaires des offres d'emploi », 2026) | bac + 3 | 24 818 projets, 23 % difficiles (Agents administratifs ; 2026) |
| 2 | Médiatrice sociale (K1204) | 2 | 2 | Action sociale, socio-éducative et socio-culturelle | 1 867,02 à 1 900 € brut par mois (salaire brut mensuel de début de carrière du métier « Médiateur social / Médiatrice sociale » ; CIDJ, fiche métier « Médiateur social / Médiatrice sociale », 2025) | bac | 10 060 projets, 45 % difficiles (Professionnels de l'action sociale ; 2026) |
| 3 | Educatrice nature environnement (G1240) | 4 | 4 | Animation d'activités de loisirs | 1 802 à 2 240 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Educateur / Educatrice nature environnement » (France Travail, France entière) ; France Travail, Métierscope, fiche métier G1240, encadré « Salaires des offres d'emploi », 2026) | bac | 64 780 projets, 43 % difficiles (Professionnels de l'animation socioculturelle ; 2026) |

- Formations, M1510 : 6 montrées sur 181 : BUT - Gestion des entreprises et des administrations (Nantes) ; Licence - Psychologie - Accès Santé (LAS) (Nantes) ; BUT - Gestion des entreprises et des administrations - en apprentissage (Mantes-la-Jolie), apprentissage ; …
- Formations, K1204 : 6 montrées sur 159 : BUT - Carrières sociales Parcours animation sociale et socioculturelle (Cholet) ; Licence - Sciences et Techniques des Activités Physiques et Sportives - STAPS (sports) - Accès Santé (LAS) (Nantes) ; DEUST - Intervention Sociale (Loos) ; …
- Formations, G1240 : 6 montrées sur 80 : BUT - Carrières sociales Parcours animation sociale et socioculturelle (Cholet) ; BTS - Agricole - Gestion et protection de la nature (La Roche-sur-Yon) ; BTS - Agricole - Gestion et protection de la nature - en apprentissage (Nantes), apprentissage ; …

Écartés :

- Médecin du travail et de prévention (J1101) : Il faut au moins 9 ans d'études après le bac, et vous avez répondu « 5 ans ».
- Educatrice sportive (G1204) : Le salaire de départ y est proche du Smic : du Smic (1 867 €) à 2 000 € brut par mois en début de carrière (source : CIDJ, fiche métier « Éducateur sportif / Éducatrice sportive », 2024).
- Conseillère en gestion de carrière (M1508) : Les entreprises y prévoient peu de recrutements : 1 235 projets pour la famille « Cadres des ressources humaines et du recrutement » en 2026 (France Travail).

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Chargée de mission RH diversité handicap**. *Le métier, simplement* (gabarit) : Elle participe à la prévention de la discrimination et valorise et promeut l'inclusion au sein de l'entreprise. Concrètement, elle développe et met en œuvre des politiques de diversité et d'inclusion, assure le suivi des indicateurs de diversité et propose des améliorations et organise des formations et sensibilisation sur le handicap et la diversité.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir aidé quelqu'un : dans ce métier, elle aurait à intégrer un collaborateur en situation de handicap. Qu'elle prévoit tout à l'avance : elle serait aussi amenée à organiser des campagnes de sensibilisation. Qu'elle est à l'aise en français : le métier lui demanderait aussi de rédiger un rapport, un compte rendu d'activité. Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 3, jusqu'à bac + 5 selon les postes.
  *Pour l'enfant* : Tu as déjà été là pour quelqu'un qui en avait besoin : ici, tu aurais à intégrer un collaborateur en situation de handicap. Tu prévois les choses à l'avance : tu serais aussi amenée à organiser des campagnes de sensibilisation. Tu es à l'aise en français : le métier te demanderait aussi de rédiger un rapport, un compte rendu d'activité.
- **Médiatrice sociale**. *Le métier, simplement* (gabarit) : Elle facilite l'accès aux services et aux droits, lève les incompréhensions entre les personnes et les institutions et aide à la prévention et à la résolution de conflits. Concrètement, elle surveille et assure une présence sociale active dans les espaces publics et intervient dans des situations de conflit pour apaiser les tensions.
  *Pourquoi* : Vous avez dit que le week-end, elle file dehors, dans la nature : dans ce métier, elle aurait à établir un dialogue avec les individus dans l'espace public. Que dans un groupe, c'est elle qui met l'ambiance et fait le lien : elle serait aussi amenée à faire preuve de pédagogie pour faciliter la compréhension. Qu'elle garde son calme quand les autres paniquent : le métier lui demanderait aussi d'assurer la médiation dans des situations de conflit mineur pour apaiser les tensions. Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès le bac.
  *Pour l'enfant* : Le week-end, tu files dehors, dans la nature : ici, tu aurais à établir un dialogue avec les individus dans l'espace public. Dans un groupe, tu mets l'ambiance et tu fais le lien : tu serais aussi amenée à faire preuve de pédagogie pour faciliter la compréhension. Tu gardes ton calme quand ça s'agite autour de toi : le métier te demanderait aussi d'assurer la médiation dans des situations de conflit mineur pour apaiser les tensions.
- **Educatrice nature environnement**. *Le métier, simplement* (gabarit) : L'animateur nature environnement sensibilise le public à la connaissance et à la protection de la nature et de la biodiversité. Concrètement, elle conçoit et anime des activités pédagogiques en milieu naturel, organise des sorties de découverte et d'observation de la faune et de la flore et développe des programmes d'éducation environnementale pour différents publics.
  *Pourquoi* : Vous avez dit que dès qu'elle peut, elle s'occupe d'animaux ou va dans la nature : dans ce métier, elle aurait à gérer des groupes en milieu naturel. Que le week-end, elle file dehors, dans la nature : elle serait aussi amenée à accompagner des groupes lors de visites guidées ou sorties en extérieur. Et qu'elle prévoit tout à l'avance : le métier lui demanderait aussi d'organiser et planifier une activité.
  *Pour l'enfant* : Tu es bien avec les animaux et dans la nature : ici, tu aurais à gérer des groupes en milieu naturel. Le week-end, tu files dehors, dans la nature : tu serais aussi amenée à accompagner des groupes lors de visites guidées ou sorties en extérieur. Tu prévois les choses à l'avance : le métier te demanderait aussi d'organiser et planifier une activité.

</details>

#### Mixte

Source : **llm**. Champs remplacés : G1240.pourquoi_parent, G1240.pourquoi_enfant, M1508.pourquoi_enfant, M1508.ia_phrase. Durée du conseiller : 24,4 s.

Appels : appel 1 (conseil) : echec_validation, 18,7 s, 25449 jetons en entrée (128 en cache), 2258 en sortie, 0,037 $ ; règles en échec : T10×2 T11×5 T04×3 T23 T33 ; appel 2 (correction) : echec_validation, 5,3 s, 28061 jetons en entrée (128 en cache), 776 en sortie, 0,037 $ ; règles en échec : T04×3 T11×4 T23 T33.

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 3 nombre(s) et 0 diplôme(s) cités dans 11 textes. Liens parent + enfant par piste : 4+3, 3+3, 4+3.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Educatrice nature environnement (G1240) | 4 | 4 | Animation d'activités de loisirs | 1 802 à 2 240 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Educateur / Educatrice nature environnement » (France Travail, France entière) ; France Travail, Métierscope, fiche métier G1240, encadré « Salaires des offres d'emploi », 2026) | bac | 64 780 projets, 43 % difficiles (Professionnels de l'animation socioculturelle ; 2026) |
| 2 | Médiatrice sociale (K1204) | 2 | 2 | Action sociale, socio-éducative et socio-culturelle | 1 867,02 à 1 900 € brut par mois (salaire brut mensuel de début de carrière du métier « Médiateur social / Médiatrice sociale » ; CIDJ, fiche métier « Médiateur social / Médiatrice sociale », 2025) | bac | 10 060 projets, 45 % difficiles (Professionnels de l'action sociale ; 2026) |
| 3 | Conseillère en gestion de carrière (M1508) | 5 | 5 | Ressources humaines | 1 850 à 3 333 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Conseiller / Conseillère en gestion de carrière » (France Travail, France entière) ; France Travail, Métierscope, fiche métier M1508, encadré « Salaires des offres d'emploi », 2026) | bac + 5 | 1 235 projets, 26 % difficiles (Cadres des ressources humaines et du recrutement ; 2026) |

- Formations, G1240 : 6 montrées sur 80 : BUT - Carrières sociales Parcours animation sociale et socioculturelle (Cholet) ; BTS - Agricole - Gestion et protection de la nature (La Roche-sur-Yon) ; BTS - Agricole - Gestion et protection de la nature - en apprentissage (Nantes), apprentissage ; …
- Formations, K1204 : 6 montrées sur 159 : BUT - Carrières sociales Parcours animation sociale et socioculturelle (Cholet) ; Licence - Sciences et Techniques des Activités Physiques et Sportives - STAPS (sports) - Accès Santé (LAS) (Nantes) ; DEUST - Intervention Sociale (Loos) ; …
- Formations, M1508 : 6 montrées sur 77 : Licence - Psychologie - Accès Santé (LAS) (Nantes) ; Licence - Psychologie (Nantes) ; Licence - Psychologie (Angers) ; …

Écartés :

- Médecin du travail et de prévention (J1101) : Il faut au moins 9 ans d'études après le bac, et vous avez répondu « 5 ans ».
- Educatrice sportive (G1204) : Le salaire de départ y est proche du Smic : du Smic (1 867 €) à 2 000 € brut par mois en début de carrière (source : CIDJ, fiche métier « Éducateur sportif / Éducatrice sportive », 2024).
- Chargée de mission RH diversité handicap (M1510) : C'est un métier très proche de « Conseillère en gestion de carrière », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Conseillère technique agricole (A1304) : Le salaire de départ y est proche du Smic : du Smic (1 867 €) à 2 200 € brut par mois en début de carrière, d'après la fiche du métier « Conseiller agricole / Conseillère agricole » (source : CIDJ, fiche métier « Conseiller agricole / Conseillère agricole », 2025).
- Responsable de structure multi accueil petite enfance (K1216) : On y dirige une équipe (animer, coordonner une équipe). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.

Les textes du mode mixte :

**1. Educatrice nature environnement (G1240)**

**Le métier, simplement** (llm). Elle conçoit des activités pour faire connaître la nature et la biodiversité aux groupes. Elle organise des sorties en forêt ou en campagne pour observer les plantes et les animaux, prépare du matériel pédagogique et accompagne les participants sur le terrain.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut générer des fiches sur les espèces ou des parcours. Mais guider un groupe en pleine nature, répondre à leurs questions sur place et adapter l'activité au moment, ça reste humain.

**Pourquoi ça lui ressemble** (gabarit). Vous avez dit que dès qu'elle peut, elle s'occupe d'animaux ou va dans la nature : dans ce métier, elle aurait à gérer des groupes en milieu naturel. Que le week-end, elle file dehors, dans la nature : elle serait aussi amenée à accompagner des groupes lors de visites guidées ou sorties en extérieur. Qu'elle prévoit tout à l'avance : le métier lui demanderait aussi d'organiser et planifier une activité. Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès le bac.

**Pour l'enfant** (llm). Tu es bien avec les animaux et dans la nature : tu organiserais des sorties pour observer les plantes et les animaux avec des groupes. Tu as déjà été là pour quelqu'un qui en avait besoin : tu animes des ateliers pour faire connaître et protéger la nature. Tu es à l'aise en SVT : tu préparerais des supports pédagogiques sur la biodiversité.

**2. Médiatrice sociale (K1204)**

**Le métier, simplement** (llm). Elle facilite l'accès aux droits et aux services pour les personnes en difficulté. Elle va à leur rencontre dans les espaces publics, apaise les conflits, les informe sur les aides disponibles et organise des événements pour renforcer les liens dans le quartier.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut trier des informations sur les droits ou rédiger des fiches. Mais aller vers les gens dans la rue, écouter leur situation et trouver la bonne solution avec eux, ça se fait en personne.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle garde son calme quand les autres paniquent : elle intervient dans des situations de conflit pour apaiser les tensions. Que dans un groupe, c'est elle qui met l'ambiance et fait le lien : elle anime un réseau et renforce les liens sociaux dans le quartier. Et que le week-end, elle file dehors, dans la nature : elle assure une présence sociale active dans les espaces publics en extérieur.

**Pour l'enfant** (llm). Tu gardes ton calme quand ça s'agite autour de toi : tu interviendrais pour apaiser les tensions entre les personnes. Dans un groupe, tu mets l'ambiance et tu fais le lien : tu organiserais des événements pour améliorer la vie du quartier. Le week-end, tu files dehors, dans la nature : tu ferais des patrouilles et du dialogue dans les espaces publics.

**3. Conseillère en gestion de carrière (M1508)**

**Le métier, simplement** (llm). Elle accompagne les salariés dans leur évolution professionnelle. Elle évalue leurs compétences, construit avec eux des plans de formation personnalisés et les conseille pour qu'ils trouvent leur place et se développent dans l'entreprise.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que ses proches viennent la voir quand ça ne va pas : elle accompagne les collaborateurs dans leur évolution professionnelle. Qu'elle s'occupe tout naturellement des plus jeunes, des plus âgés, de ceux qui ne vont pas bien : elle identifie et évalue les compétences de chaque personne. Que sa plus grande fierté, c'est d'avoir aidé quelqu'un et quand elle a gardé tout un été les enfants des voisins : elle conçoit des plans de formation adaptés aux besoins de chacun. Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 5.

**Pour l'enfant** (llm). On vient te voir quand on a besoin de parler : tu accompagnerais les gens dans leur évolution de carrière. Tu t'occupes naturellement des plus jeunes et de ceux qui en ont besoin : tu évaluerais les compétences de chaque personne. Tu as déjà été là pour quelqu'un qui en avait besoin : tu construirais des plans de formation sur mesure.

### 3.3. `hugo_premiere_nsi`

Hugo, Première générale (maths, NSI, physique), Toulouse. Plutôt seul, code, aime résoudre. 5 ans d'études, partout en France. Refuse la vente. Aucune phrase libre.

- Situation : premiere_generale (maths, nsi, physique_chimie) ; genre : il
- Contraintes : études cinq_ans ; alternance pourquoi_pas ; privé ne_sait_pas ; département 31, mobilité france ; refus vente ; ce qui compte gagner, creer
- Phrases libres : aucune
- Questions passées : metier_evoque

#### Calcul seul

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 7 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,2 s.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Data engineer (M1811) | 1 | 1 | Systèmes d'information et de télécommunication | 3 000 € brut par mois (salaire brut mensuel de début de carrière du métier « Data engineer » ; CIDJ, fiche métier « Data engineer », 2025) | bac + 2 | 4 758 projets, 45 % difficiles (Experts et consultants en systèmes d'information ; 2026) |
| 2 | Ingénieur études conception électrique (F1141) | 2 | 2 | Conception et études | 2 275 à 3 750 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Ingénieur / Ingénieure études conception électrique » (France Travail, France entière) ; France Travail, Métierscope, fiche métier F1141, encadré « Salaires des offres d'emploi », 2026) | bac + 5 | 1 424 projets, 63 % difficiles (Cadres des études BTP, des études géologiques, du métré de la construction et du contrôle et diagnostic technique du BTP ; 2026) |
| 3 | Ingénieur qualité (H1520) | 3 | 3 | Qualité et analyses industrielles | 2 700 € brut par mois (salaire brut mensuel de début de carrière du métier « Ingénieur qualité / Ingénieure qualité » ; CIDJ, fiche métier « Ingénieur qualité / Ingénieure qualité », 2025) | bac + 5 | 2 171 projets, 42 % difficiles (Ingénieurs des méthodes de production, du contrôle qualité ; 2026) |

- Formations, M1811 : 6 montrées sur 760 : BUT - Informatique (Toulouse) ; Licence - Informatique (Toulouse) ; Formation d'ingénieur Bac + 5 - Bac Général (Toulouse) ; …
- Formations, F1141 : 6 montrées sur 91 : Licence - Génie civil (Toulouse) ; Licence - Génie urbain (Champs-sur-Marne) ; Licence - Informatique (Toulouse) ; …
- Formations, H1520 : 6 montrées sur 626 : Formation d'ingénieur Bac + 5 - Bac Général (Toulouse) ; Formation d'ingénieur Bac + 5 - bac STI2D (Toulouse) ; Formation d'ingénieur Bac + 5 - Double diplôme (Toulouse) ; …

Écartés :

- Actuaire en assurances (C1105) : Il faut vendre, et vous avez dit qu'il ne le voulait pas.
- Géomètre (F1107) : Les entreprises y prévoient peu de recrutements : 464 projets pour la famille « Géomètres » en 2026 (France Travail).
- Ingénieur statisticien (M1414) : Selon l'OIT, ce métier est fortement exposé à l'IA générative. Nous avons préféré des pistes qui le sont moins.

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Data engineer**. *Le métier, simplement* (gabarit) : Il développe des solutions de traitement et d'industrialisation de ces données en mobilisant son expertise technique (technologies du Big et data, langages,..) en lien avec les équipes qui les analysent et les équipes métier.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir résolu quelque chose de difficile à force de chercher : dans ce métier, il aurait à modéliser une base de données. Qu'on lui confie les calculs et les comptes : il serait aussi amené à anticiper des coûts. Qu'il code, programme, monte des ordinateurs : le métier lui demanderait aussi de déployer, intégrer un logiciel, un système d'informations, une application. Et qu'il est prêt à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 2, jusqu'à bac + 5 selon les postes.
  *Pour l'enfant* : Tu as déjà résolu quelque chose de difficile, à force de chercher : ici, tu aurais à modéliser une base de données. On te confie les calculs et les comptes : tu serais aussi amené à anticiper des coûts. Tu codes, tu programmes, tu montes des ordinateurs : le métier te demanderait aussi de déployer, intégrer un logiciel, un système d'informations, une application.
- **Ingénieur études conception électrique**. *Le métier, simplement* (gabarit) : Il est responsable des études de dimensionnement, de performance et de conformité des équipements permettant la production, le transport et l'utilisation de l'énergie électrique. Concrètement, il analyse les besoins et réalise des études de faisabilité technique et économique pour de nouveaux projets, définit les cahiers des charges et suit l'exécution des projets et collabore avec des équipes multidisciplinaires.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir résolu quelque chose de difficile à force de chercher : dans ce métier, il aurait à réaliser des études de faisabilité technique et financière. Qu'on lui confie les calculs et les comptes : il serait aussi amené à analyser et gérer les risques financiers. Qu'il code, programme, monte des ordinateurs : le métier lui demanderait aussi de réaliser l'analyse fonctionnelle de l'installation et la décliner en un programme d'automatisation. Et qu'il est prêt à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 5.
  *Pour l'enfant* : Tu as déjà résolu quelque chose de difficile, à force de chercher : ici, tu aurais à réaliser des études de faisabilité technique et financière. On te confie les calculs et les comptes : tu serais aussi amené à analyser et gérer les risques financiers. Tu codes, tu programmes, tu montes des ordinateurs : le métier te demanderait aussi de réaliser l'analyse fonctionnelle de l'installation et la décliner en un programme d'automatisation.
- **Ingénieur qualité**. *Le métier, simplement* (gabarit) : Il définit et met en œuvre les procédures de contrôle qualité conformément aux normes en vigueur et collabore avec les fournisseurs pour assurer la conformité des matières premières et composants.
  *Pourquoi* : Ce métier ressort de l'ensemble de vos réponses, sans qu'une seule ne suffise à l'expliquer.
  *Pour l'enfant* : Tu as déjà résolu quelque chose de difficile, à force de chercher : ici, tu aurais à réaliser des analyses statistiques pour identifier les tendances de qualité. On te confie les calculs et les comptes : tu serais aussi amené à contrôler la certification et la conformité des outils de mesure et de contrôle. Tu es prêt à faire jusqu'à cinq ans d'études : tu peux y accéder dès bac + 5.

</details>

#### Mixte

Source : **llm**. Champs remplacés : M1811.ia_phrase, H1237.ia_phrase. Durée du conseiller : 15,6 s.

Appels : appel 1 (conseil) : echec_validation, 15,3 s, 25733 jetons en entrée (4736 en cache), 2104 en sortie, 0,032 $ ; règles en échec : T23×2 T11×4.

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 3 nombre(s) et 0 diplôme(s) cités dans 10 textes. Liens parent + enfant par piste : 4+3, 3+2, 3+3.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Data engineer (M1811) | 1 | 1 | Systèmes d'information et de télécommunication | 3 000 € brut par mois (salaire brut mensuel de début de carrière du métier « Data engineer » ; CIDJ, fiche métier « Data engineer », 2025) | bac + 2 | 4 758 projets, 45 % difficiles (Experts et consultants en systèmes d'information ; 2026) |
| 2 | Ingénieur études conception électrique (F1141) | 2 | 2 | Conception et études | 2 275 à 3 750 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Ingénieur / Ingénieure études conception électrique » (France Travail, France entière) ; France Travail, Métierscope, fiche métier F1141, encadré « Salaires des offres d'emploi », 2026) | bac + 5 | 1 424 projets, 63 % difficiles (Cadres des études BTP, des études géologiques, du métré de la construction et du contrôle et diagnostic technique du BTP ; 2026) |
| 3 | Ingénieur énergies renouvelables (H1237) | 5 | 5 | Conception, recherche, études et développement | 2 700 € brut par mois (salaire brut mensuel de début de carrière du métier « Ingénieur / Ingénieure en énergies renouvelables » ; CIDJ, fiche métier « Ingénieur / Ingénieure en énergies renouvelables », 2026) | bac + 5 | 10 948 projets, 47 % difficiles (Ingénieurs et cadres d'étude, recherche et développement (industrie) ; 2026) |

- Formations, M1811 : 6 montrées sur 760 : BUT - Informatique (Toulouse) ; Licence - Informatique (Toulouse) ; Formation d'ingénieur Bac + 5 - Bac Général (Toulouse) ; …
- Formations, F1141 : 6 montrées sur 91 : Licence - Génie civil (Toulouse) ; Licence - Génie urbain (Champs-sur-Marne) ; Licence - Informatique (Toulouse) ; …
- Formations, H1237 : 6 montrées sur 16 : Licence - Electronique, énergie électrique, automatique (Toulouse) ; Licence - Génie civil (Toulouse) ; Licence - Electronique, énergie électrique, automatique - Accès Santé (LAS) (Toulouse) ; …

Écartés :

- Actuaire en assurances (C1105) : Il faut vendre, et vous avez dit qu'il ne le voulait pas.
- Géomètre (F1107) : Les entreprises y prévoient peu de recrutements : 464 projets pour la famille « Géomètres » en 2026 (France Travail).
- Ingénieur statisticien (M1414) : Selon l'OIT, ce métier est fortement exposé à l'IA générative. Nous avons préféré des pistes qui le sont moins.
- Dessinateur-projeteur en électricité-électronique (H1236) : Les entreprises y prévoient peu de recrutements : 903 projets pour la famille « Techniciens du dessin industriel » en 2026 (France Travail).

Les textes du mode mixte :

**1. Data engineer (M1811)**

**Le métier, simplement** (llm). Il collecte de grandes quantités de données, les organise et les prépare pour qu'elles soient utilisables. Il développe des outils et des programmes pour traiter ces données, les teste et les maintient dans le temps. Il travaille souvent en équipe avec ceux qui les analysent et ceux qui en ont besoin dans l'entreprise.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'il passe du temps à chercher comment marchent les choses : il collecte et organise des volumes importants de données pour en faire des solutions utilisables. Que sa plus grande fierté, c'est d'avoir résolu quelque chose de difficile à force de chercher : il développe des solutions de traitement et les maintient sur leur cycle de vie. Qu'il code programme et monte des ordinateurs : il déploie et intègre des systèmes d'information ou des applications. Et qu'il est prêt à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 2 et jusqu'à bac + 5 selon les postes.

**Pour l'enfant** (llm). Tu aimes comprendre comment marchent les choses : tu collectes et organises des données pour en faire des outils concrets. Tu as déjà résolu quelque chose de difficile, à force de chercher : tu développes des solutions de traitement et tu les fais durer dans le temps. Tu codes, tu programmes, tu montes des ordinateurs : tu déploies et intègres des applications ou des systèmes.

**2. Ingénieur études conception électrique (F1141)**

**Le métier, simplement** (llm). Il étudie des équipements électriques pour la production ou le transport d'énergie. Il analyse les besoins, fait des calculs de dimensionnement et de coût, définit les plans et suit leur réalisation. Il travaille en bureau d'études avec des équipes de différents métiers.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut calculer rapidement des options de dimensionnement. Mais analyser un besoin réel sur site, collaborer avec les équipes et valider physiquement un système, ça se fait avec des personnes et sur le terrain.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'il est à l'aise en physique-chimie : il réalise des études de faisabilité technique sur des équipements électriques. Que dans un groupe, c'est lui qui propose les idées : il définit les cahiers des charges et crée des dessins techniques ou des plans. Et que créer compte pour lui : il conçoit l'architecture électrique de systèmes ou de machines spéciales.

**Pour l'enfant** (llm). Tu es à l'aise en physique-chimie : tu fais des études de faisabilité technique sur des installations électriques. Dans un groupe, c'est toi qui proposes les idées : tu définis les besoins et tu crées les plans techniques.

**3. Ingénieur énergies renouvelables (H1237)**

**Le métier, simplement** (llm). Il conçoit des projets d'énergie solaire, éolienne ou hydraulique. Il réalise des études techniques et économiques, optimise les systèmes et vérifie qu'ils respectent les normes environnementales. Il travaille en bureau d'études avec des équipes variées et se déplace sur les sites.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'il passe du temps à chercher comment marchent les choses : il conçoit des systèmes d'énergie renouvelable adaptés aux besoins. Que face à un problème, il cherche jusqu'à comprendre : il réalise des études de faisabilité et analyse les données de performance. Et que les chiffres, pour lui, c'est un jeu : il gère les budgets et optimise les rendements des systèmes.

**Pour l'enfant** (llm). Tu aimes comprendre comment marchent les choses : tu conçois des projets d'énergie solaire ou éolienne. Face à un problème, tu cherches jusqu'à comprendre : tu fais des études de faisabilité et tu analyses les performances. Les chiffres, pour toi, c'est un jeu : tu gères les budgets et tu optimises les rendements.

### 3.4. `ines_terminale_ses`

Inès, Terminale générale (SES, HGGSP), Lyon. En groupe, prend les choses en main, négocie, a convaincu le proviseur. 5 ans d'études. Refuse les soins. Veut bien gagner sa vie et être son propre patron.

- Situation : terminale_generale (ses, hggsp) ; genre : elle
- Contraintes : études cinq_ans ; alternance plutot_non ; privé oui ; département 69, mobilité france ; refus soins ; ce qui compte gagner, patron
- Phrases libres : aide_exemple « C'est elle qui a négocié le prix du voyage de fin d'année avec l'agence. » ; fierte_recit « Elle a convaincu le proviseur de rouvrir le foyer des lycéens le midi, avec une pétition. »
- Questions passées : metier_evoque

#### Calcul seul

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 6 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,2 s.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Chargée de mission développement territorial (K1404) | 1 | 1 | Conception et mise en oeuvre des politiques publiques | 1 900 à 3 000 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Chargé / Chargée de mission développement territorial » (France Travail, France entière) ; France Travail, Métierscope, fiche métier K1404, encadré « Salaires des offres d'emploi », 2026) | bac + 3 | non affiché (donnée absente) |
| 2 | Productrice audiovisuel et cinéma (L1302) | 3 | 3 | Conception et production de spectacles | 1 802 à 2 692 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Producteur / Productrice audiovisuel et cinéma » (France Travail, France entière) ; France Travail, Métierscope, fiche métier L1302, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 28 833 projets, 10 % difficiles (Professionnels des spectacles ; 2026) |
| 3 | Conductrice de travaux du bâtiment (F1201) · souvent proposé | 5 | 5 | Conduite et encadrement de chantier - travaux | 2 200 à 2 700 € brut par mois (salaire brut mensuel de début de carrière du métier « Conducteur / Conductrice de travaux » ; CIDJ, fiche métier « Conducteur / Conductrice de travaux », 2026) | bac + 2 | 6 478 projets, 62 % difficiles (Ingénieurs du bâtiment et des travaux publics, chefs de chantier et conducteurs de travaux (cadres) ; 2026) |

- Formations, K1404 : 6 montrées sur 13 : Licence - Administration publique - Droit (Lyon) ; Licence - Etudes européennes et internationales - Parcours Etudes européennes et internationales franco-espagnoles (Clermont-Ferrand) ; Licence - Administration publique (Saint-Étienne) ; …
- Formations, L1302 : 6 montrées sur 9 : Licence - Cinéma et Audiovisuel (Montpellier) ; Double licence - Cinéma / Gestion - (Paris) ; Licence - Cinéma et Audiovisuel (Strasbourg) ; …
- Formations, F1201 : 6 montrées sur 231 : BUT - Génie civil - Construction durable (Villeurbanne) ; Licence - Génie civil - Parcours Sciences Exactes et Appliquées (Limoges) ; BTS - Production - Bâtiment (Lyon) ; …

Écartés :

- Directrice d'office du tourisme (G1105) : On y dirige une équipe (animer, coordonner une équipe). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.
- Responsable d'agence immobilière (C1505) : La fiche officielle du métier le dit : « Une expérience d'au moins 3 ans en entreprise ou en agence est généralement requise » (France Travail).
- Conceptrice agencement (F1140) : Le salaire de départ y est proche du Smic : de 1 802 à 2 123 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier F1140, encadré « Salaires des offres d'emploi », 2026).
- Chargée de plaidoyer (E1131) : Les entreprises y prévoient peu de recrutements : 1 220 projets pour la famille « Cadres de la communication » en 2026 (France Travail).
- Notaire (K1901) : Les entreprises y prévoient peu de recrutements : 1 164 projets pour la famille « Professionnels du droit » en 2026 (France Travail).

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Chargée de mission développement territorial**. *Le métier, simplement* (gabarit) : Elle favorise l'émergence et l'accompagnement des projets locaux dans le cadre des dispositifs de développement des territoires. Concrètement, elle met en œuvre l'action des pouvoirs publics au niveau du territoire (commune, département, région, union et européenne, etc.) et dans un ou des domaines de compétences spécifiques.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir convaincu des gens, ou vendu quelque chose : dans ce métier, elle aurait à mener des négociations complexes avec des acteurs clés. Que c'est à elle qu'on demande d'organiser les sorties : elle serait aussi amenée à concevoir et gérer un projet. Que dans un groupe, c'est elle qui prend les choses en main : le métier lui demanderait aussi de favoriser des relations d'échanges et un climat de coopération. Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 3, jusqu'à bac + 5 selon les postes.
  *Pour l'enfant* : Tu as déjà su convaincre des gens : ici, tu aurais à mener des négociations complexes avec des acteurs clés. C'est souvent toi qui organises les sorties : tu serais aussi amenée à concevoir et gérer un projet. Dans un groupe, tu prends les choses en main : le métier te demanderait aussi de favoriser des relations d'échanges et un climat de coopération.
- **Productrice audiovisuel et cinéma**. *Le métier, simplement* (gabarit) : Elle pilote la création d'une œuvre cinématographique en transformant une vision artistique en un projet concret, viable et abouti, de l'idée initiale jusqu'à sa diffusion. Concrètement, elle développe les projets en sélectionnant les scénarios et en accompagnant l'écriture et recherche et sécurise les financements tout en élaborant et en contrôlant le budget.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir convaincu des gens, ou vendu quelque chose : dans ce métier, elle aurait à étudier un devis général et par poste selon les indications d'une équipe de réalisation. Que c'est à elle qu'on demande d'organiser les sorties : elle serait aussi amenée à gérer un planning. Que dans un groupe, c'est elle qui prend les choses en main : le métier lui demanderait aussi de définir une stratégie de communication. Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 2, jusqu'à bac + 5 selon les postes.
  *Pour l'enfant* : Tu as déjà su convaincre des gens : ici, tu aurais à étudier un devis général et par poste selon les indications d'une équipe de réalisation. C'est souvent toi qui organises les sorties : tu serais aussi amenée à gérer un planning. Dans un groupe, tu prends les choses en main : le métier te demanderait aussi de définir une stratégie de communication.
- **Conductrice de travaux du bâtiment**. *Le métier, simplement* (gabarit) : Elle supervise un ou plusieurs chantiers, de construction ou de rénovation, dont elle coordonne l'organisation, la qualité et la sécurité jusqu'à l'achèvement des travaux. Concrètement, elle définit et organise les moyens de production, planifie et supervise les différentes étapes du chantier et coordonne le travail des équipes et des sous-traitants.
  *Pourquoi* : Ce métier ressort de l'ensemble de vos réponses, sans qu'une seule ne suffise à l'expliquer.
  *Pour l'enfant* : Tu as déjà su convaincre des gens : ici, tu aurais à assister le directeur de travaux dans les phases de réponse aux appels d'offres. C'est souvent toi qui organises les sorties : tu serais aussi amenée à organiser des réunions et des visites de chantier. Dans un groupe, tu prends les choses en main : le métier te demanderait aussi d'assurer la gestion financière des chantiers.

</details>

#### Mixte

Source : **partiel**. Champs remplacés : K1404.pourquoi_enfant, L1302.piste. Durée du conseiller : 27,3 s.

Appels : appel 1 (conseil) : echec_validation, 15,9 s, 26935 jetons en entrée (4864 en cache), 2272 en sortie, 0,034 $ ; règles en échec : V05 T04×3 T11×5 T10 T15×2 ; appel 2 (correction) : echec_validation, 10,8 s, 29772 jetons en entrée (4736 en cache), 1414 en sortie, 0,036 $ ; règles en échec : V05 T04×2 T11×4 T15.

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 6 nombre(s) et 0 diplôme(s) cités dans 11 textes. Liens parent + enfant par piste : 4+3, 3+3, 3+3.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Chargée de mission développement territorial (K1404) | 1 | 1 | Conception et mise en oeuvre des politiques publiques | 1 900 à 3 000 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Chargé / Chargée de mission développement territorial » (France Travail, France entière) ; France Travail, Métierscope, fiche métier K1404, encadré « Salaires des offres d'emploi », 2026) | bac + 3 | non affiché (donnée absente) |
| 2 | Conseillère en organisation d'événementiel de particuliers (E1117) | 23 | 19 | Edition et communication | 1 802 à 2 500 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Conseiller / Conseillère en organisation d'événementiel de particuliers » (France Travail, France entière) ; France Travail, Métierscope, fiche métier E1117, encadré « Salaires des offres d'emploi », 2026) | bac | 4 126 projets (Assistants de la communication ; 2026) |
| 3 | Productrice audiovisuel et cinéma (L1302) | 3 | 3 | Conception et production de spectacles | 1 802 à 2 692 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Producteur / Productrice audiovisuel et cinéma » (France Travail, France entière) ; France Travail, Métierscope, fiche métier L1302, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 28 833 projets, 10 % difficiles (Professionnels des spectacles ; 2026) |

- Formations, K1404 : 6 montrées sur 13 : Licence - Administration publique - Droit (Lyon) ; Licence - Etudes européennes et internationales - Parcours Etudes européennes et internationales franco-espagnoles (Clermont-Ferrand) ; Licence - Administration publique (Saint-Étienne) ; …
- Formations, E1117 : 6 montrées sur 479 : BUT - Information communication Parcours communication des organisations (Lyon) ; BUT - Techniques de commercialisation (Villeurbanne) ; BTS - Services - Communication (Lyon) ; …
- Formations, L1302 : 6 montrées sur 9 : Licence - Cinéma et Audiovisuel (Montpellier) ; Double licence - Cinéma / Gestion - (Paris) ; Licence - Cinéma et Audiovisuel (Strasbourg) ; …

Écartés :

- Directrice d'office du tourisme (G1105) : On y dirige une équipe (animer, coordonner une équipe). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.
- Responsable d'agence immobilière (C1505) : La fiche officielle du métier le dit : « Une expérience d'au moins 3 ans en entreprise ou en agence est généralement requise » (France Travail).
- Conceptrice agencement (F1140) : Le salaire de départ y est proche du Smic : de 1 802 à 2 123 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier F1140, encadré « Salaires des offres d'emploi », 2026).
- Chargée d'affaires foncières (F1133) : C'est un métier très proche de « Chargée de mission développement territorial », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Chargée de développement d'activités sportives (G1213) : Le salaire de départ y est proche du Smic : de 1 802 à 2 288 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier G1213, encadré « Salaires des offres d'emploi », 2026).

Les textes du mode mixte :

**1. Chargée de mission développement territorial (K1404)**

**Le métier, simplement** (llm). Elle favorise l'émergence de projets locaux et met en œuvre les actions des pouvoirs publics sur un territoire. Elle mène des négociations avec différents acteurs, conçoit des projets et anime un réseau de professionnels pour les faire avancer.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut aider à analyser des données sur un territoire. Mais négocier avec les élus, animer une réunion sur place et construire une relation de confiance avec les acteurs locaux, ça reste une affaire de contact humain.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que sa plus grande fierté, c'est d'avoir convaincu le proviseur de rouvrir le foyer avec une pétition : elle mène des négociations complexes avec les acteurs clés pour faire émerger des projets locaux. Que dans un groupe, c'est elle qui prend les choses en main : elle peut superviser ou organiser un service d'une collectivité territoriale. Qu'elle sait négocier, et obtient souvent gain de cause : elle conçoit et gère un projet en cadrant ses actions selon les orientations des pouvoirs publics. Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 3 et jusqu'à bac + 5 selon les postes.

**Pour l'enfant** (llm). Tu as déjà su convaincre des gens : tu mènerais des négociations avec les acteurs du territoire pour faire avancer des projets. Dans un groupe, tu prends les choses en main : tu organiserais un service ou superviserais des actions sur le territoire. On t'a déjà demandé de l'aide pour négocier le prix du voyage : tu concevrais et gérerais des projets de développement local.

**2. Conseillère en organisation d'événementiel de particuliers (E1117)**

**Le métier, simplement** (llm). Elle conçoit des événements pour des particuliers du choix du lieu jusqu'au jour J. Elle coordonne la logistique, négocie avec les prestataires, gère le planning et veille au bon déroulement pour que tout se passe bien.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut suggérer des plannings ou des idées de thèmes. Mais choisir un lieu qui convient vraiment, négocier sur place avec un traiteur et ajuster en direct si un imprévu survient, ça se fait avec les gens.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle prévoit tout à l'avance : elle planifie les différentes tâches nécessaires à la réalisation de l'événement. Que dans un groupe, c'est elle qui prend les choses en main : elle supervise l'événement pour s'assurer du bon déroulement du planning. Et qu'elle sait négocier, et obtient souvent gain de cause : elle négocie avec les prestataires pour obtenir les meilleurs tarifs.

**Pour l'enfant** (llm). Tu prévois les choses à l'avance : tu planifierais les différentes tâches pour réaliser l'événement. Dans un groupe, tu prends les choses en main : tu superviserais l'événement pour que tout se passe bien. On t'a déjà demandé de l'aide pour négocier le prix du voyage : tu négocierais avec les prestataires pour avoir les meilleurs prix.

**3. Productrice audiovisuel et cinéma (L1302)**

**Le métier, simplement** (gabarit). Elle pilote la création d'une œuvre cinématographique en transformant une vision artistique en un projet concret, viable et abouti, de l'idée initiale jusqu'à sa diffusion. Concrètement, elle développe les projets en sélectionnant les scénarios et en accompagnant l'écriture et recherche et sécurise les financements tout en élaborant et en contrôlant le budget.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (gabarit). Vous avez dit que sa plus grande fierté, c'est d'avoir convaincu des gens, ou vendu quelque chose : dans ce métier, elle aurait à étudier un devis général et par poste selon les indications d'une équipe de réalisation. Que c'est à elle qu'on demande d'organiser les sorties : elle serait aussi amenée à gérer un planning. Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 2, jusqu'à bac + 5 selon les postes.

**Pour l'enfant** (gabarit). Tu as déjà su convaincre des gens : ici, tu aurais à étudier un devis général et par poste selon les indications d'une équipe de réalisation. C'est souvent toi qui organises les sorties : tu serais aussi amenée à gérer un planning. Dans un groupe, tu prends les choses en main : le métier te demanderait aussi de définir une stratégie de communication.

### 3.5. `nathan_bacpro_elec`

Nathan, bac pro industrie (électricité), Lille. Bricoleur, a besoin de bouger, a refait l'électricité d'une cabane. 2 ans d'études au plus, alternance idéale, rester près de chez lui. Refuse le bureau.

- Situation : bac_pro (industrie) ; genre : il
- Contraintes : études deux_ans ; alternance ideal ; privé alternance ; département 59, mobilité rester_pres ; refus bureau ; ce qui compte stable, gagner
- Phrases libres : temps_libre_precis « Il démonte tout ce qui a un moteur, en ce moment une vieille tondeuse. » ; aide_exemple « Toute la famille l'appelle quand une prise ou un luminaire ne marche plus. » ; fierte_recit « Il a refait toute l'électricité de la cabane du jardin avec son oncle, et tout a marché du premier coup. »
- Questions passées : metier_evoque

#### Calcul seul

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 4 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,1 s.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Technicien-cuisiniste en cuisines professionnelles (I1325) | 1 | 1 | Equipements de production, équipements collectifs | 1 833 à 2 991 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien-cuisiniste / Technicienne-cuisiniste en cuisines professionnelles » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1325, encadré « Salaires des offres d'emploi », 2026) | bac | 2 950 projets, 81 % difficiles (Techniciens et agents de maîtrise en installation et maintenance en froid et conditionnement d'air ; 2026) |
| 2 | Technicien d'exploitation en production d'énergie thermique (H2701) | 4 | 3 | Energie | 1 802 à 2 583 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien / Technicienne d'exploitation en production d'énergie thermique » (France Travail, France entière) ; France Travail, Métierscope, fiche métier H2701, encadré « Salaires des offres d'emploi », 2026) | bac | 5 708 projets, 44 % difficiles (Techniciens des industries de process ; 2026) |
| 3 | Technicien Datacenter (I1403) | 5 | 4 | Equipements domestiques et informatique | 1 900 à 4 336 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien / Technicienne Datacenter » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1403, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 7 667 projets, 48 % difficiles (Techniciens de production, d'exploitation, d'installation, et de maintenance, support et services aux utilisateurs en informatique ; 2026) |

- Formations, I1325 : 6 montrées sur 417 : BTS - Production - Electrotechnique - en apprentissage (Lille), apprentissage ; BTS - Production - Electrotechnique (Lille) ; BTS - Production - Electrotechnique - en apprentissage (Tourcoing), apprentissage ; …
- Formations, H2701 : 3 montrées sur 3 : Certificat de Spécialisation - Technicien(ne) des services à l'énergie - en apprentissage (Marcq-en-Barœul), apprentissage ; Certificat de Spécialisation - Technicien(ne) des services à l'énergie - en apprentissage (Lille), apprentissage ; Certificat de Spécialisation - Technicien(ne) des services à l'énergie - en apprentissage (Nice), apprentissage
- Formations, I1403 : 6 montrées sur 376 : BTS - Services - Communication - en apprentissage (Lille), apprentissage ; DEUST - Infrastructures numériques (Villeneuve-d'Ascq) ; BTS - Services - Communication (Lille) ; …

Écartés :

- Technicien de maintenance réseaux mobiles (I1319) : Les formations qui y mènent durent au moins 3 ans, et vous avez répondu « 2 ans ».
- Foreur (F1401) : Le salaire de départ y est le Smic, soit 1 867 € brut par mois en début de carrière (source : CIDJ, fiche métier « Foreur », 2026).
- Ingénieur calcul et structure (F1112) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 2 ans ».
- Opérateur consoliste en raffinerie (H2711) : Le salaire de départ y est proche du Smic : à partir de 1 800 € brut par mois en début de carrière, d'après la fiche du métier « Opérateur / Opératrice de raffinerie » (source : CIDJ, fiche métier « Opérateur / Opératrice de raffinerie », 2025).
- Eclairagiste (L1504) : Les formations qui y mènent durent au moins 3 ans, et vous avez répondu « 2 ans ».

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Technicien-cuisiniste en cuisines professionnelles**. *Le métier, simplement* (gabarit) : Il conçoit et installe des cuisines professionnelles adaptées aux besoins des clients, professionnels de l'hôtellerie - restauration . Concrètement, il effectue la pose et les raccordements aux réseaux dans le respect des normes de sécurité, optimise l'espace et l'efficacité des cuisines et assure la maintenance et la réparation des équipements de cuisine.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir fabriqué ou réparé quelque chose de ses mains : dans ce métier, il aurait à installer des équipements de cuisines professionnelles. Qu'il improvise, et il s'adapte : il serait aussi amené à organiser les opérations de maintenance. Qu'il est à l'aise en maths : le métier lui demanderait aussi de réaliser des mesures de locaux et les calculs de surfaces. Et qu'il ne veut pas plus de 2 ans d'études : c'est accessible dès le bac.
  *Pour l'enfant* : Tu as déjà fabriqué ou réparé quelque chose de tes mains : ici, tu aurais à installer des équipements de cuisines professionnelles. Tu sais improviser et t'adapter : tu serais aussi amené à organiser les opérations de maintenance. Tu es à l'aise en maths : le métier te demanderait aussi de réaliser des mesures de locaux et les calculs de surfaces.
- **Technicien d'exploitation en production d'énergie thermique**. *Le métier, simplement* (gabarit) : Il conduit et surveille les installations afin de réaliser le programme de production, réalise la maintenance préventive et corrective des équipements et assure la conformité des opérations avec les normes environnementales et de sécurité.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir fabriqué ou réparé quelque chose de ses mains : dans ce métier, il aurait à régler les paramètres des machines de production. Que le week-end, il file dehors, dans la nature : il serait aussi amené à effectuer des rondes de contrôle et vérification des installations. Et qu'il garde son calme quand les autres paniquent : le métier lui demanderait aussi de gérer les urgences et les pannes critiques.
  *Pour l'enfant* : Tu as déjà fabriqué ou réparé quelque chose de tes mains : ici, tu aurais à régler les paramètres des machines de production. Le week-end, tu files dehors, dans la nature : tu serais aussi amené à effectuer des rondes de contrôle et vérification des installations. Tu gardes ton calme quand ça s'agite autour de toi : le métier te demanderait aussi de gérer les urgences et les pannes critiques.
- **Technicien Datacenter**. *Le métier, simplement* (gabarit) : Il assure le bon fonctionnement des équipements informatiques et des infrastructures physiques d'un centre de données. Concrètement, il réalise des prestations de service et de support de premier niveau et fait l'interface avec le client et assure la gestion opérationnelle des bâtiments, la surveillance des systèmes et la gestion des incidents pour garantir la continuité de service.
  *Pourquoi* : Vous avez dit qu'il improvise, et il s'adapte : dans ce métier, il aurait à planifier et suivre des opérations de maintenance. Que c'est lui qu'on appelle quand un appareil ne marche pas : il serait aussi amené à installer les équipements actifs mêlant courant faible et courant fort. Et qu'il ne veut pas plus de 2 ans d'études : c'est accessible dès bac + 2, jusqu'à bac + 3 selon les postes.
  *Pour l'enfant* : Tu as déjà fabriqué ou réparé quelque chose de tes mains : ici, tu aurais à monter, assembler, démonter les équipements informatiques. Tu sais improviser et t'adapter : tu serais aussi amené à planifier et suivre des opérations de maintenance. C'est toi qu'on appelle quand un appareil fait des siennes : le métier te demanderait aussi d'installer les équipements actifs mêlant courant faible et courant fort.

</details>

#### Mixte

Source : **llm**. Champs remplacés : I1603.pourquoi_parent, I1603.pourquoi_enfant, F1610.pourquoi_parent, F1610.pourquoi_enfant, I1325.pourquoi_enfant. Durée du conseiller : 20,8 s.

Appels : appel 1 (conseil) : echec_validation, 20,5 s, 27289 jetons en entrée (4864 en cache), 2308 en sortie, 0,035 $ ; règles en échec : T11×6 T30×2 T06 T14 T22 T04×3 T18.

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 0 nombre(s) et 0 diplôme(s) cités dans 12 textes. Liens parent + enfant par piste : 3+2, 4+2, 3+3.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Mécanicien-réparateur en matériels agricoles (I1603) | 12 | 7 | Véhicules, engins, aéronefs | 1 802 à 2 365 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Mécanicien-réparateur / Mécanicienne-réparatrice en matériels agricoles » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1603, encadré « Salaires des offres d'emploi », 2026) | CAP ou équivalent (avant le bac) | 19 495 projets, 72 % difficiles (Ouvriers mécaniciens de véhicules ; 2026) |
| 2 | Installateur mainteneur en systèmes solaires, thermiques et photovoltaïques (F1610) | 9 | 6 | Second oeuvre | 1 802 à 2 500 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Installateur mainteneur / Installatrice mainteneuse en systèmes solaires, thermiques et photovoltaïques » (France Travail, France entière) ; France Travail, Métierscope, fiche métier F1610, encadré « Salaires des offres d'emploi », 2026) | bac | 8 896 projets, 79 % difficiles (Couvreurs ; 2026) |
| 3 | Technicien-cuisiniste en cuisines professionnelles (I1325) | 1 | 1 | Equipements de production, équipements collectifs | 1 833 à 2 991 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien-cuisiniste / Technicienne-cuisiniste en cuisines professionnelles » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1325, encadré « Salaires des offres d'emploi », 2026) | bac | 2 950 projets, 81 % difficiles (Techniciens et agents de maîtrise en installation et maintenance en froid et conditionnement d'air ; 2026) |

- Formations, I1603 : 6 montrées sur 48 : BTS - Production - Techniques et services en matériels agricoles - en apprentissage (Hazebrouck), apprentissage ; BTS - Production - Maintenance des matériels de construction et de manutention (Bruay-la-Buissière) ; BTS - Production - Techniques et services en matériels agricoles (Savy-Berlette) ; …
- Formations, F1610 : 6 montrées sur 417 : BTS - Production - Electrotechnique - en apprentissage (Lille), apprentissage ; BTS - Production - Electrotechnique (Lille) ; BTS - Production - Electrotechnique - en apprentissage (Tourcoing), apprentissage ; …
- Formations, I1325 : 6 montrées sur 417 : BTS - Production - Electrotechnique - en apprentissage (Lille), apprentissage ; BTS - Production - Electrotechnique (Lille) ; BTS - Production - Electrotechnique - en apprentissage (Tourcoing), apprentissage ; …

Écartés :

- Technicien de maintenance réseaux mobiles (I1319) : Les formations qui y mènent durent au moins 3 ans, et vous avez répondu « 2 ans ».
- Foreur (F1401) : Le salaire de départ y est le Smic, soit 1 867 € brut par mois en début de carrière (source : CIDJ, fiche métier « Foreur », 2026).
- Ingénieur calcul et structure (F1112) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 2 ans ».
- Opérateur consoliste en raffinerie (H2711) : Le salaire de départ y est proche du Smic : à partir de 1 800 € brut par mois en début de carrière, d'après la fiche du métier « Opérateur / Opératrice de raffinerie » (source : CIDJ, fiche métier « Opérateur / Opératrice de raffinerie », 2025).
- Eclairagiste (L1504) : Les formations qui y mènent durent au moins 3 ans, et vous avez répondu « 2 ans ».

Les textes du mode mixte :

**1. Mécanicien-réparateur en matériels agricoles (I1603)**

**Le métier, simplement** (llm). Il répare et entretient des tracteurs, moissonneuses et autres machines agricoles. Il diagnostique les pannes, change les pièces, fait les réglages et vérifie que tout fonctionne avant de rendre l'engin à l'agriculteur. Il peut intervenir directement sur les exploitations.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut aider à analyser les données des capteurs. Mais démonter, diagnostiquer une panne mécanique et régler la machine sur place, ça reste un travail manuel et sur le terrain.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que sa plus grande fierté, c'est d'avoir refait toute l'électricité de la cabane du jardin avec son oncle : il diagnostique les pannes sur les machines agricoles puis change les pièces et les règle jusqu'à ce que tout fonctionne. Qu'il peut passer des heures à démonter tout ce qui a un moteur en ce moment une vieille tondeuse : il démonte et remonte les moteurs et les circuits hydrauliques des matériels agricoles. Et que le week-end, il file dehors, dans la nature : il intervient souvent directement sur les exploitations agricoles en extérieur.

**Pour l'enfant** (llm). Tu essaies et recommences jusqu'à ce que ça marche : tu diagnostiques la panne puis changes les pièces et règles jusqu'à ce que l'engin reparte. Le week-end, tu files dehors, dans la nature : tu interviendrais souvent sur les exploitations en extérieur.

**2. Installateur mainteneur en systèmes solaires, thermiques et photovoltaïques (F1610)**

**Le métier, simplement** (llm). Il installe des panneaux solaires et des systèmes thermiques sur les toits. Il fixe les supports, raccorde les câbles électriques, vérifie l'étanchéité et teste que tout produit de l'énergie. Il fait aussi l'entretien quand quelque chose ne marche plus.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut calculer la meilleure orientation des panneaux. Mais les fixer en hauteur, réaliser les raccordements et vérifier sur place que l'installation est étanche, ça se fait avec les mains et sur le toit.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que sa plus grande fierté, c'est d'avoir refait toute l'électricité de la cabane du jardin avec son oncle : il raccorde les panneaux au réseau électrique et vérifie que l'installation fonctionne du premier coup. Qu'on lui a demandé de l'aide pour une prise ou un luminaire qui ne marche plus : il assure la maintenance corrective quand un panneau ou un système ne produit plus. Qu'il n'aime pas rester assis il a besoin de bouger : il travaille en extérieur sur les toits et les chantiers. Et que l'alternance lui conviendrait bien : ce métier se fait souvent en alternance sur les chantiers.

**Pour l'enfant** (llm). Tu as déjà fabriqué ou réparé quelque chose de tes mains : tu raccorderais les panneaux et vérifierais que tout produit de l'énergie. Tu as besoin de bouger : tu travaillerais en hauteur et en extérieur sur les chantiers.

**3. Technicien-cuisiniste en cuisines professionnelles (I1325)**

**Le métier, simplement** (llm). Il conçoit et installe des cuisines professionnelles pour les restaurants. Il mesure les locaux, prépare les équipements, les raccorde aux réseaux et les met en service. Il répare aussi quand un appareil tombe en panne.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut aider à dessiner les plans de cuisine. Mais mesurer le local, porter et raccorder les équipements lourds sur place, ça se fait avec le client et sur le terrain.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que sur son temps libre, il bricole, construit, répare et peut passer des heures à démonter tout ce qui a un moteur : il installe des équipements lourds qu'il raccorde et met en service sur place. Que dans un groupe, il en fait plus que sa part, pour que ce soit bien fait : il optimise l'espace et vérifie que chaque équipement est parfaitement installé. Et qu'il garde son calme quand les autres paniquent : il assure la maintenance et la réparation des équipements même en cas d'urgence.

**Pour l'enfant** (llm). Tu aimes bricoler, construire, réparer : tu installerais et raccorderais les équipements dans les cuisines professionnelles. Dans un groupe, tu tiens à ce que ce soit bien fait : tu optimiserais l'espace pour que chaque appareil soit à sa place. Tu gardes ton calme quand ça s'agite autour de toi : tu réparerais les équipements même quand ça tombe en panne au mauvais moment.

### 3.6. `chloe_premiere_st2s`

Chloé, Première technologique ST2S, Marseille. Prend soin des autres, reste calme, écoute. 3 ans d'études. Refuse la nuit. Veut se sentir utile.

- Situation : premiere_techno (st2s) ; genre : elle
- Contraintes : études trois_ans ; alternance pourquoi_pas ; privé non ; département 13, mobilité region ; refus nuit ; ce qui compte utile, stable
- Phrases libres : fierte_recit « Quand sa grand-mère est venue vivre chez nous, c'est elle qui l'aidait chaque soir. »
- Questions passées : metier_evoque

#### Calcul seul

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 8 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,1 s.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Educatrice de la protection judiciaire de la jeunesse (K1210) | 1 | 1 | Action sociale, socio-éducative et socio-culturelle | 2 262 € net par mois (salaire net mensuel de début de carrière du métier « Educatrice / Educateur de la Protection judiciaire de la jeunesse » ; CIDJ, fiche métier « Educatrice / Educateur de la Protection judiciaire de la jeunesse », 2026) | bac + 3 | 23 920 projets, 51 % difficiles (Educateurs spécialisés et autres intervenants socio-éducatifs ; 2026) |
| 2 | Opticienne (J1405) · connu | 4 | 3 | Rééducation et appareillage | 1 820 à 2 833 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Opticien / Opticienne » (France Travail, France entière) ; France Travail, Métierscope, fiche métier J1405, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 2 551 projets, 59 % difficiles (Spécialistes de l'appareillage médical ; 2026) |
| 3 | Préparatrice en pharmacie (J1307) · connu · souvent proposé | 5 | 4 | Professionnels médico-techniques | 1 802 à 2 427 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Préparateur / Préparatrice en pharmacie » (France Travail, France entière) ; France Travail, Métierscope, fiche métier J1307, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 7 237 projets, 58 % difficiles (Techniciens médicaux et préparateurs ; 2026) |

- Formations, K1210 : 6 montrées sur 193 : Licence - Sciences et Techniques des Activités Physiques et Sportives - Tronc commun - (Site de Luminy) - Accès Santé (LAS) (Marseille) ; BUT - Carrières sociales Parcours éducation spécialisée (Menton) ; D.E Educateur Spécialisé - en apprentissage (Marseille), apprentissage ; …
- Formations, J1405 : 6 montrées sur 73 : BTS - Services - Opticien-Lunetier (Marseille) ; BTS - Services - Opticien-Lunetier - en apprentissage (Marseille), apprentissage ; BTS - Services - Opticien-Lunetier (Le Muy) ; …
- Formations, J1307 : 6 montrées sur 17 : DEUST - Préparateur/Technicien en pharmacie - en apprentissage (Nice), apprentissage ; DEUST - Préparateur/Technicien en pharmacie - en apprentissage (Montpellier), apprentissage ; DEUST - Préparateur/Technicien en pharmacie - en apprentissage (Perpignan), apprentissage ; …

Écartés :

- Directrice de centre de séjour de vacances (G1241) : La fiche officielle du métier le dit : « Une première expérience est souvent demandée » (France Travail).
- Ergonome (M1412) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 3 ans ».
- Médiatrice culturelle (K1213) : C'est un métier très proche de « Educatrice de la protection judiciaire de la jeunesse », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Chargée d'accueil (M1601) : Selon l'OIT, ce métier est fortement exposé à l'IA générative. Nous avons préféré des pistes qui le sont moins.
- Audioprothésiste (J1401) : Le salaire de départ y est proche du Smic : du Smic (1 867 €) à 2 000 € brut par mois en début de carrière (source : CIDJ, fiche métier « Audioprothésiste », 2025).

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Educatrice de la protection judiciaire de la jeunesse**. *Le métier, simplement* (gabarit) : Elle accompagne les jeunes en conflit avec la loi dans leur développement personnel et social et élabore et met en œuvre des projets éducatifs adaptés à chaque situation individuelle.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir aidé quelqu'un : dans ce métier, elle aurait à conseiller, accompagner une personne. Que ses proches lui demandent de leur expliquer les choses : elle serait aussi amenée à informer et sensibiliser aux thèmes de la violence, la toxicomanie, la sexualité, l'illettrisme. Et qu'elle ne veut pas plus de 3 ans d'études : c'est accessible dès bac + 3.
  *Pour l'enfant* : Tu as déjà été là pour quelqu'un qui en avait besoin : ici, tu aurais à conseiller, accompagner une personne. On vient te demander d'expliquer les choses : tu serais aussi amenée à informer et sensibiliser aux thèmes de la violence, la toxicomanie, la sexualité, l'illettrisme. Tu vises trois ans d'études au plus : tu peux y accéder dès bac + 3.
- **Opticienne**. *Le métier, simplement* (gabarit) : Elle est un professionnel de la vision mettant à disposition des équipements de correction optique aux personnes atteintes de troubles visuels. Concrètement, elle conseille les clients dans le choix de montures, de verres et de lentilles de contact adaptés à leurs besoins et mesure l'acuité visuelle et réalise l'ajustement, le montage des lunettes pour garantir un confort optimal.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir aidé quelqu'un : dans ce métier, elle aurait à interpréter les résultats des examens de la vue et les imageries médicales. Qu'elle cuisine sur son temps libre : elle serait aussi amenée à préparer les verres, procéder à l'essayage sur le client et effectuer les ajustements. Que ses proches lui demandent de leur expliquer les choses : le métier lui demanderait aussi d'analyser la vision du client pour adapter les verres. Et qu'elle ne veut pas plus de 3 ans d'études : c'est accessible dès bac + 2.
  *Pour l'enfant* : Tu as déjà été là pour quelqu'un qui en avait besoin : ici, tu aurais à interpréter les résultats des examens de la vue et les imageries médicales. Tu aimes cuisiner : tu serais aussi amenée à préparer les verres, procéder à l'essayage sur le client et effectuer les ajustements. On vient te demander d'expliquer les choses : le métier te demanderait aussi d'analyser la vision du client pour adapter les verres.
- **Préparatrice en pharmacie**. *Le métier, simplement* (gabarit) : Elle en collaboration étroite avec le pharmacien, assure la préparation, la gestion et la délivrance des médicaments aux patients. Concrètement, elle prépare et délivre les médicaments sous la supervision d'un pharmacien, conseille et informe les clients sur l'utilisation des produits pharmaceutiques et la compatibilité avec d'autres et gère les stocks de médicaments et passe les commandes nécessaires.
  *Pourquoi* : Vous avez dit qu'elle prévoit tout à l'avance : dans ce métier, elle aurait à réaliser le suivi de délivrance des médicaments dans l'ordonnancier.
  *Pour l'enfant* : Tu as déjà été là pour quelqu'un qui en avait besoin : ici, tu aurais à identifier la demande du service de soins ou du patient. Tu prévois les choses à l'avance : tu serais aussi amenée à réaliser le suivi de délivrance des médicaments dans l'ordonnancier. Tu vises trois ans d'études au plus : tu peux y accéder dès bac + 2.

</details>

#### Mixte

Source : **llm**. Champs remplacés : K1210.pourquoi_enfant, J1405.ia_phrase, K1102.ia_phrase. Durée du conseiller : 14,4 s.

Appels : appel 1 (conseil) : echec_validation, 14,1 s, 25515 jetons en entrée (4864 en cache), 2006 en sortie, 0,032 $ ; règles en échec : T04 T11×4 T23 T33.

Contrôles : aucune violation, 1 à vérifier, 0 note(s) ; 2 nombre(s) et 0 diplôme(s) cités dans 10 textes. Liens parent + enfant par piste : 4+3, 3+3, 3+3.

  - à vérifier · mobilite · K1102 : aucune des 6 formations montrées dans le rayon « region »

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Educatrice de la protection judiciaire de la jeunesse (K1210) | 1 | 1 | Action sociale, socio-éducative et socio-culturelle | 2 262 € net par mois (salaire net mensuel de début de carrière du métier « Educatrice / Educateur de la Protection judiciaire de la jeunesse » ; CIDJ, fiche métier « Educatrice / Educateur de la Protection judiciaire de la jeunesse », 2026) | bac + 3 | 23 920 projets, 51 % difficiles (Educateurs spécialisés et autres intervenants socio-éducatifs ; 2026) |
| 2 | Opticienne (J1405) · connu | 4 | 3 | Rééducation et appareillage | 1 820 à 2 833 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Opticien / Opticienne » (France Travail, France entière) ; France Travail, Métierscope, fiche métier J1405, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 2 551 projets, 59 % difficiles (Spécialistes de l'appareillage médical ; 2026) |
| 3 | Mandataire judiciaire à la protection des majeurs (MJPM) (K1102) | 6 | 5 | Accompagnement de la personne | 1 863 à 2 314 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Mandataire judiciaire à la protection des majeurs (MJPM) » (France Travail, France entière) ; France Travail, Métierscope, fiche métier K1102, encadré « Salaires des offres d'emploi », 2026) | bac + 3 | 10 060 projets, 45 % difficiles (Professionnels de l'action sociale ; 2026) |

- Formations, K1210 : 6 montrées sur 193 : Licence - Sciences et Techniques des Activités Physiques et Sportives - Tronc commun - (Site de Luminy) - Accès Santé (LAS) (Marseille) ; BUT - Carrières sociales Parcours éducation spécialisée (Menton) ; D.E Educateur Spécialisé - en apprentissage (Marseille), apprentissage ; …
- Formations, J1405 : 6 montrées sur 73 : BTS - Services - Opticien-Lunetier (Marseille) ; BTS - Services - Opticien-Lunetier - en apprentissage (Marseille), apprentissage ; BTS - Services - Opticien-Lunetier (Le Muy) ; …
- Formations, K1102 : 6 montrées sur 14 : BUT - Carrières juridiques (Narbonne) ; BUT - Carrières juridiques (Grenoble) ; BUT - Carrières juridiques (Annonay) ; …

Écartés :

- Directrice de centre de séjour de vacances (G1241) : La fiche officielle du métier le dit : « Une première expérience est souvent demandée » (France Travail).
- Ergonome (M1412) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 3 ans ».
- Médiatrice culturelle (K1213) : C'est un métier très proche de « Educatrice de la protection judiciaire de la jeunesse », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Chargée d'accueil (M1601) : Selon l'OIT, ce métier est fortement exposé à l'IA générative. Nous avons préféré des pistes qui le sont moins.
- Audioprothésiste (J1401) : Le salaire de départ y est proche du Smic : du Smic (1 867 €) à 2 000 € brut par mois en début de carrière (source : CIDJ, fiche métier « Audioprothésiste », 2025).

Les textes du mode mixte :

**1. Educatrice de la protection judiciaire de la jeunesse (K1210)**

**Le métier, simplement** (llm). Elle accompagne des jeunes en difficulté pour les aider à se réinsérer. Elle élabore des projets adaptés à chacun, travaille avec les familles et les écoles, intervient en cas de crise pour apaiser les conflits.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut trier des données ou rédiger des modèles de rapports. Mais écouter un jeune, construire une relation de confiance et intervenir en face à face dans une crise, ça reste humain.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que sa plus grande fierté, c'est d'avoir aidé quelqu'un comme quand elle aidait sa grand-mère chaque soir : elle accompagne chaque jeune en difficulté pour l'aider à retrouver sa place. Qu'elle garde son calme quand les autres paniquent : elle intervient dans les situations de crise pour apaiser les conflits. Que ses proches viennent la voir quand ça ne va pas : elle écoute et conseille les jeunes pour les accompagner dans leur développement. Et qu'elle ne veut pas plus de 3 ans d'études : c'est accessible dès bac + 3.

**Pour l'enfant** (llm). Tu as déjà été là pour quelqu'un qui en avait besoin : tu accompagnerais chaque jeune pour l'aider à se réinsérer. Tu gardes ton calme quand ça s'agite autour de toi : tu interviendrais dans les moments de crise pour proposer des solutions. Tu t'occupes naturellement de ceux qui en ont besoin : tu construis un projet éducatif adapté à chaque situation.

**2. Opticienne (J1405)**

**Le métier, simplement** (llm). Elle accueille des clients qui ont des problèmes de vue. Elle mesure leur acuité, les conseille sur les montures et les verres, prépare et ajuste les lunettes en atelier avant de les essayer sur eux.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle cuisine sur son temps libre : elle prépare et monte les verres avec précision avant l'essayage. Que ses proches lui demandent de leur expliquer les choses : elle guide chaque client dans le choix des équipements adaptés à ses besoins. Et qu'elle est à l'aise en SVT : elle analyse la vision et interprète les résultats des examens.

**Pour l'enfant** (llm). Tu aimes cuisiner : tu préparerais et ajusterais les verres avec précision. On vient te voir quand on a besoin de parler : tu écouterais chaque client pour bien comprendre ses besoins visuels. Tu es à l'aise en SVT : tu mesurerais l'acuité visuelle et interpréterais les résultats.

**3. Mandataire judiciaire à la protection des majeurs (MJPM) (K1102)**

**Le métier, simplement** (llm). Elle protège les intérêts des personnes majeures vulnérables. Elle gère leurs biens, les accompagne dans leurs démarches, collabore avec les familles et les services sociaux pour veiller à leur bien-être au quotidien.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle s'occupe tout naturellement des plus jeunes, des plus âgés, de ceux qui ne vont pas bien : elle veille au bien-être matériel et financier des personnes vulnérables. Qu'elle prévoit tout à l'avance : elle planifie les mesures de protection nécessaires pour chaque situation. Et qu'elle garde son calme quand les autres paniquent : elle intervient régulièrement quand une mesure de protection est nécessaire.

**Pour l'enfant** (llm). Tu t'occupes naturellement des plus jeunes et de ceux qui en ont besoin : tu accompagnerais les personnes vulnérables dans leurs démarches quotidiennes. Tu prévois les choses à l'avance : tu évaluerais les besoins spécifiques pour organiser leur protection. Être utile aux autres compte pour toi : tu collaborerais avec les familles et les services pour une prise en charge globale.

### 3.7. `yanis_seconde_flou`

Yanis, Seconde, Reims. Profil flou : écrans et copains, « ça dépend », plusieurs questions passées, ne sait pas combien d'années d'études. Parle de « youtubeur ».

- Situation : seconde ; genre : il
- Contraintes : études ne_sait_pas ; alternance ne_sait_pas ; privé ne_sait_pas ; département 51, mobilité ne_sait_pas ; refus rien ; ce qui compte passée ; métier évoqué : youtubeur
- Phrases libres : aucune
- Questions passées : aide_demandee, role_groupe, probleme, fierte, ce_qui_compte

#### Calcul seul

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 0 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,1 s.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Technicien d'exploitation et de maintenance des équipements audiovisuels (I1329) | 1 | 1 | Equipements de production, équipements collectifs | 1 820 à 3 000 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien / Technicienne d'exploitation et de maintenance des équipements audiovisuels » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1329, encadré « Salaires des offres d'emploi », 2026) | bac | 2 856 projets, 48 % difficiles (Techniciens et agents de maîtrise en maintenance électrique, électronique et automatismes ; 2026) |
| 2 | Nez (H1505) | 2 | 2 | Qualité et analyses industrielles | 1 802 à 4 615 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Nez » (France Travail, France entière) ; France Travail, Métierscope, fiche métier H1505, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 5 708 projets, 44 % difficiles (Techniciens des industries de process ; 2026) |
| 3 | Assistant maîtrise d'œuvre en architecture (F1126) | 5 | 4 | Conception et études | 1 840 à 2 908 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Assistant / Assistante maîtrise d'œuvre en architecture » (France Travail, France entière) ; France Travail, Métierscope, fiche métier F1126, encadré « Salaires des offres d'emploi », 2026) | bac | 1 567 projets, 65 % difficiles (Dessinateurs en bâtiment et en travaux publics ; 2026) |

- Formations, I1329 : 6 montrées sur 64 : BUT - Génie électrique et informatique industrielle (Troyes) ; Licence - Electronique, énergie électrique, automatique (Mulhouse) ; BUT - Génie électrique et informatique industrielle (Cosnes-et-Romain) ; …
- Formations, H1505 : 6 montrées sur 198 : BTS - Services - Métiers de l'esthétique-cosmétique-parfumerie - en apprentissage (Reims), apprentissage ; BTS - Services - Métiers de l'esthétique-cosmétique-parfumerie (Reims) ; BTS - Services - Métiers de l'esthétique-cosmétique-parfumerie (Strasbourg) ; …
- Formations, F1126 : 6 montrées sur 65 : BTS - Agricole - Gestion et maitrise de l'eau (Obernai) ; BTS - Agricole - Aménagements paysagers (Wintzenheim) ; BTS - Agricole - Gestion et maitrise de l'eau (Sainte-Maure) ; …

Écartés :

- Technicien en contrôles et essais non destructifs (CND END) (H1522) : Le salaire de départ y est proche du Smic : 2 000 € brut par mois en début de carrière, d'après la fiche du métier « Technicien / Technicienne de contrôle non destructif » (source : CIDJ, fiche métier « Technicien / Technicienne de contrôle non destructif », 2025).
- Chauffagiste (I1308) : C'est un métier très proche de « Technicien d'exploitation et de maintenance des équipements audiovisuels », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Régisseur de spectacles (L1512) : La fiche officielle du métier le dit : « Une expérience confirmée dans la production du spectacle vivant est en général requise » (France Travail).

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Technicien d'exploitation et de maintenance des équipements audiovisuels**. *Le métier, simplement* (gabarit) : Il assure l'entretien, la réparation et le dépannage des équipements utilisés dans des contextes professionnels tels que les studios d'enregistrement, les salles de spectacle et les installations de production. Concrètement, il diagnostique et résout les pannes, les dysfonctionnements et réalise les interventions de maintenance préventive et corrective auprès des utilisateurs en s'assurant du bon fonctionnement.
  *Pourquoi* : Ce métier ressort de l'ensemble de vos réponses, sans qu'une seule ne suffise à l'expliquer.
  *Pour l'enfant* : Tu fais du montage, de la musique ou du dessin sur ordinateur : ici, tu aurais à connecter des équipements électroniques.
- **Nez**. *Le métier, simplement* (gabarit) : Il compose des arômes, des fragrances destinés à des produits alimentaires, cosmétiques (gels douche, lait pour le corps, etc.) ou de parfumerie et en effectue l'analyse chimique et sensorielle (gustative et olfactive). Concrètement, il intervient selon les normes de fabrication et les attentes des consommateurs et peut former aux techniques de dégustation et d'olfaction.
  *Pourquoi* : Ce métier ressort de l'ensemble de vos réponses, sans qu'une seule ne suffise à l'expliquer.
  *Pour l'enfant* : Tu fais du montage, de la musique ou du dessin sur ordinateur : ici, tu aurais à composer des accords harmonieux entre différentes notes aromatiques.
- **Assistant maîtrise d'œuvre en architecture**. *Le métier, simplement* (gabarit) : Il participe à la conception et au suivi de projets de construction, de rénovation, d'aménagement paysager et d'urbanisme. Concrètement, il réalise des dessins techniques et des maquettes numériques, participe à l'élaboration des dossiers de demande administrative et participe à la coordination avec les différents intervenants du projet.
  *Pourquoi* : Ce métier ressort de l'ensemble de vos réponses, sans qu'une seule ne suffise à l'expliquer.
  *Pour l'enfant* : Tu fais du montage, de la musique ou du dessin sur ordinateur : ici, tu aurais à créer un dessin technique, un plan, ou une carte.

</details>

#### Mixte

Source : **partiel**. Champs remplacés : I1329.pourquoi_parent, F1126.pourquoi_parent, I1409.piste. Durée du conseiller : 17,0 s.

Appels : appel 1 (conseil) : echec_validation, 12,8 s, 21280 jetons en entrée (4864 en cache), 1607 en sortie, 0,026 $ ; règles en échec : V05 T12×3 T02 T11×5 T15×3 ; appel 2 (correction) : echec_validation, 3,6 s, 23387 jetons en entrée (4736 en cache), 514 en sortie, 0,026 $ ; règles en échec : V05 T02 T04 T11×5 T12×2 T15×3.

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 0 nombre(s) et 0 diplôme(s) cités dans 11 textes. Liens parent + enfant par piste : 3+2, 3+2, 1+1.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Technicien d'exploitation et de maintenance des équipements audiovisuels (I1329) | 1 | 1 | Equipements de production, équipements collectifs | 1 820 à 3 000 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien / Technicienne d'exploitation et de maintenance des équipements audiovisuels » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1329, encadré « Salaires des offres d'emploi », 2026) | bac | 2 856 projets, 48 % difficiles (Techniciens et agents de maîtrise en maintenance électrique, électronique et automatismes ; 2026) |
| 2 | Assistant maîtrise d'œuvre en architecture (F1126) | 5 | 4 | Conception et études | 1 840 à 2 908 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Assistant / Assistante maîtrise d'œuvre en architecture » (France Travail, France entière) ; France Travail, Métierscope, fiche métier F1126, encadré « Salaires des offres d'emploi », 2026) | bac | 1 567 projets, 65 % difficiles (Dessinateurs en bâtiment et en travaux publics ; 2026) |
| 3 | Agent de maintenance en bureautique (I1409) | 18 | 12 | Equipements domestiques et informatique | 1 810 à 2 500 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Agent / Agente de maintenance en bureautique » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1409, encadré « Salaires des offres d'emploi », 2026) | bac | 7 667 projets, 48 % difficiles (Techniciens de production, d'exploitation, d'installation, et de maintenance, support et services aux utilisateurs en informatique ; 2026) |

- Formations, I1329 : 6 montrées sur 64 : BUT - Génie électrique et informatique industrielle (Troyes) ; Licence - Electronique, énergie électrique, automatique (Mulhouse) ; BUT - Génie électrique et informatique industrielle (Cosnes-et-Romain) ; …
- Formations, F1126 : 6 montrées sur 65 : BTS - Agricole - Gestion et maitrise de l'eau (Obernai) ; BTS - Agricole - Aménagements paysagers (Wintzenheim) ; BTS - Agricole - Gestion et maitrise de l'eau (Sainte-Maure) ; …
- Formations, I1409 : 6 montrées sur 85 : BUT - Réseaux et télécommunications (Châlons-en-Champagne) ; BUT - Réseaux et télécommunications - en apprentissage (Vandœuvre-lès-Nancy), apprentissage ; BUT - Informatique (Reims) ; …

Écartés :

- Scénographe (L1513) : Le salaire de départ y est le Smic, soit 1 867 € brut par mois en début de carrière, d'après la fiche du métier « Décorateur-scénographe / Décoratrice scénographe » (source : CIDJ, fiche métier « Décorateur-scénographe / Décoratrice scénographe », 2025).
- Technicien en contrôles et essais non destructifs (CND END) (H1522) : Le salaire de départ y est proche du Smic : 2 000 € brut par mois en début de carrière, d'après la fiche du métier « Technicien / Technicienne de contrôle non destructif » (source : CIDJ, fiche métier « Technicien / Technicienne de contrôle non destructif », 2025).
- Chauffagiste (I1308) : C'est un métier très proche de « Technicien d'exploitation et de maintenance des équipements audiovisuels », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Ingénieur du son (L1508) : Le salaire de départ y est proche du Smic : de 1 802 à 2 291 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier L1508, encadré « Salaires des offres d'emploi », 2026).
- Menuisier (H2206) : Le salaire de départ y est proche du Smic : de 1 802 à 2 123 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier H2206, encadré « Salaires des offres d'emploi », 2026).

Les textes du mode mixte :

**1. Technicien d'exploitation et de maintenance des équipements audiovisuels (I1329)**

**Le métier, simplement** (llm). Il installe, entretient et répare les équipements son et vidéo dans les studios, les salles de spectacle ou les lieux de production. Il diagnostique les pannes, configure les systèmes selon les besoins et explique les solutions aux utilisateurs. Il se déplace souvent sur site.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut aider à analyser des signaux ou à optimiser des réglages. Mais diagnostiquer une panne sur place, connecter les câbles et rassurer une équipe en direct, ça reste un travail manuel et humain.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'il crée sur ordinateur, montage, musique, dessin : il configure et connecte les équipements son et vidéo pour qu'ils fonctionnent ensemble. Qu'il aide plutôt en trouvant des solutions concrètes : il diagnostique les pannes et répare les équipements pour que tout reparte. Et qu'il est à l'aise en langues : il lit et interprète les documents techniques parfois en anglais.

**Pour l'enfant** (llm). Tu fais du montage, de la musique ou du dessin sur ordinateur : tu configures et connectes les équipements son et vidéo. Tu aides en trouvant des solutions concrètes : tu diagnostiques les pannes et tu répares pour que tout fonctionne.

**2. Assistant maîtrise d'œuvre en architecture (F1126)**

**Le métier, simplement** (llm). Il participe à la conception de bâtiments ou d'aménagements. Il réalise des plans techniques, des maquettes numériques et aide à préparer les dossiers pour les permis. Il coordonne avec les différents corps de métier sur le terrain.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut générer des esquisses ou calculer des volumes. Mais ajuster un plan sur site avec l'architecte et vérifier la faisabilité avec les artisans, ça se fait en présence et avec le geste.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'il est à l'aise en sport : il se rend sur les chantiers pour suivre l'avancement des travaux. Qu'il aide plutôt en trouvant des solutions concrètes : il coordonne avec les ingénieurs et les entrepreneurs pour résoudre les problèmes du projet. Et qu'il est à l'aise en langues : il lit et interprète les documents techniques.

**Pour l'enfant** (llm). Tu fais du montage, de la musique ou du dessin sur ordinateur : tu réalises des plans et des maquettes numériques. Tu es à l'aise en sport : tu passes du temps sur les chantiers pour voir l'avancement.

**3. Agent de maintenance en bureautique (I1409)**

**Le métier, simplement** (gabarit). Il assure la fiabilité et la performance du parc informatique. Concrètement, il effectue l'installation, la réparation et l'entretien régulier des équipements bureautiques tels que les ordinateurs, imprimantes, photocopieurs et les scanners et détecte les pannes, répare les pièces défectueuses et résout les problèmes techniques en suivant les procédures établies.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (gabarit). Vous avez dit qu'il est à l'aise en sport : dans ce métier, il aurait à réaliser les opérations de nettoyage et de réglage sur les matériels et équipements.

**Pour l'enfant** (gabarit). Tu es à l'aise en sport : ici, tu aurais à réaliser les opérations de nettoyage et de réglage sur les matériels et équipements.

### 3.8. `manon_reorientation_pass`

Manon, bac général, en première année de PASS (santé) à Strasbourg : trop de théorie, niveau trop dur. Sportive, s'occupe des autres. Plus que 3 ans d'études. Ne refuse rien.

- Situation : deja_bac (premiere_annee, sante, bac general ; ce qui n'a pas marché : theorie, niveau) ; genre : elle
- Contraintes : études trois_ans ; alternance pourquoi_pas ; privé non ; département 67, mobilité region ; refus rien ; ce qui compte utile, bouger
- Phrases libres : temps_libre_precis « Elle encadre les petits au club de natation le samedi matin. » ; fierte_recit « Son diplôme de surveillante de baignade, qu'elle a préparé seule pendant un an. »
- Questions passées : metier_evoque

#### Calcul seul

Contrôles : aucune violation, 2 à vérifier, 0 note(s) ; 3 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,1 s.

  - à vérifier · mobilite · J1506 : aucune des 1 formations montrées dans le rayon « region »
  - à vérifier · donnees · J1506 : 1 formation(s) montrée(s), 3 à 6 attendues (SPEC §6)

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Infirmière en soins généraux (IDE) (J1506) · connu | 1 | 1 | Soins paramédicaux | 2 083 à 3 000 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Infirmier / Infirmière en soins généraux (IDE) » (France Travail, France entière) ; France Travail, Métierscope, fiche métier J1506, encadré « Salaires des offres d'emploi », 2026) | bac + 3 | 36 491 projets, 60 % difficiles (Infirmiers et sages-femmes ; 2026) |
| 2 | Animatrice socioéducative (K1217) | 2 | 2 | Action sociale, socio-éducative et socio-culturelle | 1 802 à 2 600 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Animateur socioéducatif / Animatrice socioéducative » (France Travail, France entière) ; France Travail, Métierscope, fiche métier K1217, encadré « Salaires des offres d'emploi », 2026) | bac | 64 780 projets, 43 % difficiles (Professionnels de l'animation socioculturelle ; 2026) |
| 3 | Mandataire judiciaire à la protection des majeurs (MJPM) (K1102) | 4 | 4 | Accompagnement de la personne | 1 863 à 2 314 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Mandataire judiciaire à la protection des majeurs (MJPM) » (France Travail, France entière) ; France Travail, Métierscope, fiche métier K1102, encadré « Salaires des offres d'emploi », 2026) | bac + 3 | 10 060 projets, 45 % difficiles (Professionnels de l'action sociale ; 2026) |

- Formations, J1506 : 1 montrées sur 1 : D.E infirmier - en apprentissage (Lyon), apprentissage
- Formations, K1217 : 6 montrées sur 63 : BUT - Carrières sociales Parcours animation sociale et socioculturelle (Châlons-en-Champagne) ; Licence - Sciences de l'éducation et de la formation - Parcours Métiers de la formation et de l’intervention éducative (Strasbourg) ; BUT - Carrières sociales Parcours animation sociale et socioculturelle - en apprentissage (Paris), apprentissage ; …
- Formations, K1102 : 6 montrées sur 14 : BUT - Carrières juridiques (Colmar) ; BUT - Carrières juridiques (Troyes) ; BUT - Carrières juridiques (Laon) ; …

Écartés :

- Directrice de centre de séjour de vacances (G1241) : La fiche officielle du métier le dit : « Une première expérience est souvent demandée » (France Travail).
- Animatrice jeunesse (G1203) : Le salaire de départ y est proche du Smic : de 1 802 à 2 100 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier G1203, encadré « Salaires des offres d'emploi », 2026).
- Médecin du travail et de prévention (J1101) : Il faut au moins 9 ans d'études après le bac, et vous avez répondu « 3 ans ».
- Médiatrice culturelle (K1213) : Le salaire de départ y est proche du Smic : du Smic (1 867 €) à 2 000 € brut par mois en début de carrière (source : CIDJ, fiche métier « Médiateur culturel / Médiatrice culturelle », 2025).
- Professeure des écoles (K2106) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 3 ans ».

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Infirmière en soins généraux (IDE)**. *Le métier, simplement* (gabarit) : Elle dispense des soins de nature préventive, curative, ou palliative visant à promouvoir, maintenir, améliorer ou rétablir la santé du patient. Concrètement, elle evalue une situation clinique et établit un diagnostic dans le domaine infirmier, coordonne et organise les activités en collaboration avec l'équipe soignante et réalise les soins prescrits et surveille ses effets.
  *Pourquoi* : Vous avez dit que ses proches viennent la voir quand ça ne va pas : dans ce métier, elle aurait à appliquer un protocole de soin. Qu'elle est plus à l'aise en groupe : elle serait aussi amenée à rechercher, traiter et transmettre les informations pour assurer la continuité des soins et des activités. Que ses proches lui demandent de leur expliquer les choses : le métier lui demanderait aussi de réaliser un diagnostic infirmier. Et qu'elle ne veut pas plus de 3 ans d'études : c'est accessible dès bac + 3.
  *Pour l'enfant* : On vient te voir quand on a besoin de parler : ici, tu aurais à appliquer un protocole de soin. Tu es à l'aise en groupe : tu serais aussi amenée à rechercher, traiter et transmettre les informations pour assurer la continuité des soins et des activités. On vient te demander d'expliquer les choses : le métier te demanderait aussi de réaliser un diagnostic infirmier.
- **Animatrice socioéducative**. *Le métier, simplement* (gabarit) : En cohérence avec le projet de la structure, l'Animateur socioéducatif est chargé d'une mission d'insertion, de suivi ou pédagogique pour laquelle il conçoit, organise et encadre des activités proposées aux différents publics.
  *Pourquoi* : Vous avez dit que ses proches viennent la voir quand ça ne va pas : dans ce métier, elle aurait à organiser des activités éducatives adaptées à l'âge des enfants. Que ses proches lui demandent de leur expliquer les choses : elle serait aussi amenée à assurer la sécurité dans un environnement éducatif. Qu'elle a envie de bouger, de voyager : le métier lui demanderait aussi de faciliter des sessions de brainstorming pour des projets communautaires. Et qu'elle ne veut pas plus de 3 ans d'études : c'est accessible dès le bac.
  *Pour l'enfant* : On vient te voir quand on a besoin de parler : ici, tu aurais à organiser des activités éducatives adaptées à l'âge des enfants. On vient te demander d'expliquer les choses : tu serais aussi amenée à assurer la sécurité dans un environnement éducatif. Tu as envie de bouger, de voyager : le métier te demanderait aussi de faciliter des sessions de brainstorming pour des projets communautaires.
- **Mandataire judiciaire à la protection des majeurs (MJPM)**. *Le métier, simplement* (gabarit) : Le Mandataire judiciaire à la protection des majeurs assure la protection des personnes majeures vulnérables dans l'exercice de leurs droits tout en préservant leur autonomie. Concrètement, elle représente et défend les intérêts des personnes majeures protégées devant les institutions et les tribunaux et gère les biens et les revenus des personnes protégées en veillant à leur bien-être matériel et financier.
  *Pourquoi* : Vous avez dit qu'elle prévoit tout à l'avance : dans ce métier, elle aurait à évaluer les menaces potentielles et planifier les mesures de protection nécessaires.
  *Pour l'enfant* : On vient te voir quand on a besoin de parler : ici, tu aurais à guider, accompagner une personne ou une famille dans ses démarches. Tu prévois les choses à l'avance : tu serais aussi amenée à évaluer les menaces potentielles et planifier les mesures de protection nécessaires. On vient te demander d'expliquer les choses : le métier te demanderait aussi d'informer les personnes sur leurs droits et devoirs.

</details>

#### Mixte

Source : **llm**. Champs remplacés : G1204.pourquoi_enfant. Durée du conseiller : 13,8 s.

Appels : appel 1 (conseil) : echec_validation, 13,5 s, 26277 jetons en entrée (4864 en cache), 2087 en sortie, 0,033 $ ; règles en échec : T22 T11×4.

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 4 nombre(s) et 0 diplôme(s) cités dans 12 textes. Liens parent + enfant par piste : 4+2, 3+3, 4+3.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Educatrice sportive (G1204) · connu | 3 | 3 | Animation d'activités de loisirs | 1 867,02 à 2 000 € brut par mois (salaire brut mensuel de début de carrière du métier « Éducateur sportif / Éducatrice sportive » ; CIDJ, fiche métier « Éducateur sportif / Éducatrice sportive », 2024) | bac | 22 247 projets, 45 % difficiles (Sportifs et animateurs sportifs ; 2026) |
| 2 | Animatrice socioéducative (K1217) | 2 | 2 | Action sociale, socio-éducative et socio-culturelle | 1 802 à 2 600 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Animateur socioéducatif / Animatrice socioéducative » (France Travail, France entière) ; France Travail, Métierscope, fiche métier K1217, encadré « Salaires des offres d'emploi », 2026) | bac | 64 780 projets, 43 % difficiles (Professionnels de l'animation socioculturelle ; 2026) |
| 3 | Manipulatrice d'électroradiologie médicale (J1306) | 8 | 6 | Professionnels médico-techniques | 2 000 à 3 333 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Manipulateur / Manipulatrice d'électroradiologie médicale » (France Travail, France entière) ; France Travail, Métierscope, fiche métier J1306, encadré « Salaires des offres d'emploi », 2026) | bac + 3 | 7 237 projets, 58 % difficiles (Techniciens médicaux et préparateurs ; 2026) |

- Formations, G1204 : 6 montrées sur 199 : DEUST - Pratique et gestion des activités physiques, sportives et de loisirs pour les publics séniors (Strasbourg) ; DEUST - Activités physiques et sportives et inadaptations sociales (Strasbourg) ; DEUST - Activités physiques et sportives adaptées : déficiences intellectuelles, troubles psychiques (Strasbourg) ; …
- Formations, K1217 : 6 montrées sur 63 : BUT - Carrières sociales Parcours animation sociale et socioculturelle (Châlons-en-Champagne) ; Licence - Sciences de l'éducation et de la formation - Parcours Métiers de la formation et de l’intervention éducative (Strasbourg) ; BUT - Carrières sociales Parcours animation sociale et socioculturelle - en apprentissage (Paris), apprentissage ; …
- Formations, J1306 : 6 montrées sur 64 : DTS Imagerie médicale et radiologie thérapeutique (Strasbourg) ; D.E manipulateur/trice en électroradiologie médicale (Colmar) ; D.E manipulateur/trice en électroradiologie médicale (Nancy) ; …

Écartés :

- Directrice de centre de séjour de vacances (G1241) : La fiche officielle du métier le dit : « Une première expérience est souvent demandée » (France Travail).
- Animatrice jeunesse (G1203) : C'est un métier très proche de « Educatrice sportive », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Médecin du travail et de prévention (J1101) : Il faut au moins 9 ans d'études après le bac, et vous avez répondu « 3 ans ».
- Professeure des écoles (K2106) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 3 ans ».
- Conseillère en économie sociale et familiale (CESF) (K1225) : Le salaire de départ y est proche du Smic : 1 944 € brut par mois en début de carrière (source : CIDJ, fiche métier « Conseillère / Conseiller en économie sociale et familiale - CESF », 2026).

Les textes du mode mixte :

**1. Educatrice sportive (G1204)**

**Le métier, simplement** (llm). Elle encadre des activités sportives pour des groupes d'enfants ou d'adultes, selon leur niveau. Elle prépare les séances, explique les règles, veille à la sécurité de chacun et anime les exercices sur le terrain.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut proposer des exercices ou analyser des performances. Mais expliquer un geste, motiver un groupe en direct et veiller à la sécurité sur place, ça reste humain.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle encadre les petits au club de natation le samedi matin : elle encadre et anime des activités sportives adaptées au public. Qu'elle s'occupe tout naturellement des plus jeunes : elle veille à la sécurité de chacun pendant les séances. Que dans un groupe, elle en fait plus que sa part, pour que ce soit bien fait : elle participe à l'organisation d'événements et à la gestion du club. Et qu'elle ne veut pas plus de 3 ans d'études : c'est accessible dès le bac avec une formation en trois ans.

**Pour l'enfant** (llm). Tu t'occupes naturellement des plus jeunes : tu veillerais à la sécurité de chacun pendant les séances. Dans un groupe, tu tiens à ce que ce soit bien fait : tu participerais à l'organisation d'événements sportifs.

**2. Animatrice socioéducative (K1217)**

**Le métier, simplement** (llm). Elle conçoit et anime des activités pour aider des jeunes ou des personnes en difficulté. Elle écoute leurs besoins, organise des ateliers sportifs ou éducatifs et les accompagne pour qu'ils progressent.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut suggérer des idées d'activités. Mais écouter une personne, adapter un atelier en direct et créer du lien sur le terrain, ça se fait en présence.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle peut passer des heures à encadrer les petits au club de natation : elle organise et encadre des activités éducatives et sportives. Que ses proches viennent la voir quand ça ne va pas : elle évalue les besoins des publics et adapte les programmes. Et qu'être utile aux autres compte pour elle : elle favorise l'intégration sociale à travers des projets collectifs.

**Pour l'enfant** (llm). Tu peux passer des heures à encadrer les petits : tu organiserais et animerais des activités pour différents publics. On vient te voir quand on a besoin de parler : tu évaluerais les besoins de chacun pour adapter les ateliers. Être utile aux autres compte pour toi : tu aiderais les gens à s'intégrer grâce à des projets collectifs.

**3. Manipulatrice d'électroradiologie médicale (J1306)**

**Le métier, simplement** (llm). Elle prépare les patients et réalise des examens d'imagerie médicale. Elle les accueille, leur explique le déroulement, règle les appareils et traite les images avant de les transmettre au médecin.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut aider à repérer des détails sur les images. Mais accueillir un patient, le rassurer et régler l'appareil pour lui, ça se fait en personne.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que ses proches lui demandent de leur expliquer les choses : elle prépare les patients et les informe sur le déroulement des examens. Que face à un problème, elle suit les étapes, une par une : elle identifie l'examen prescrit et vérifie les conditions de faisabilité. Qu'elle parle facilement à des adultes qu'elle ne connaît pas : elle accueille et oriente les patients. Et qu'elle ne veut pas plus de 3 ans d'études : c'est accessible dès bac + 3.

**Pour l'enfant** (llm). On vient te demander d'expliquer les choses : tu expliquerais le déroulement des examens à chaque patient. Tu avances étape par étape : tu vérifierais les conditions avant chaque examen. Tu engages facilement la conversation avec des inconnus : tu accueillerais et orienterais les patients.

### 3.9. `theo_reorientation_arret`

Théo, bac technologique, a arrêté sa licence, Haute-Vienne (rural). Travaille dans une ferme le week-end, a besoin d'être dehors. Le moins d'études possible, alternance idéale, rester près. Refuse le bureau et les chiffres.

- Situation : deja_bac (arrete, licence, bac technologique ; ce qui n'a pas marché : theorie, cadre) ; genre : il
- Contraintes : études moins_possible ; alternance ideal ; privé alternance ; département 87, mobilité rester_pres ; refus bureau, chiffres ; ce qui compte bouger, stable
- Phrases libres : temps_libre_precis « Il bosse en extra dans une ferme maraîchère le week-end, il ne s'en plaint jamais. » ; fierte_recit « Le patron de la ferme lui a confié les serres pendant ses vacances. »
- Questions passées : metier_evoque

#### Calcul seul

Contrôles : aucune violation, 1 à vérifier, 0 note(s) ; 2 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,2 s.

  - à vérifier · mobilite · L1403 : aucune des 6 formations montrées dans le rayon « departement_et_voisins »

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Aviculteur (A1409) | 1 | 1 | Production | 1 802 à 1 957 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Aviculteur / Avicultrice » (France Travail, France entière) ; France Travail, Métierscope, fiche métier A1409, encadré « Salaires des offres d'emploi », 2026) | bac | 6 970 projets, 49 % difficiles (Eleveurs ; 2026) |
| 2 | Technicien en agriculture (A1301) | 2 | 2 | Etudes et assistance technique | 1 802 à 2 500 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien / Technicienne en agriculture » (France Travail, France entière) ; France Travail, Métierscope, fiche métier A1301, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 3 964 projets, 47 % difficiles (Techniciens et agents d'encadrement d'exploitations agricoles ; 2026) |
| 3 | Cavalier d'entraînement (L1403) | 6 | 5 | Sport professionnel | 1 802 à 1 974 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Cavalier / Cavalière d'entraînement » (France Travail, France entière) ; France Travail, Métierscope, fiche métier L1403, encadré « Salaires des offres d'emploi », 2026) | bac | 22 247 projets, 45 % difficiles (Sportifs et animateurs sportifs ; 2026) |

- Formations, A1409 : 6 montrées sur 50 : BTS - Agricole - Métiers de l'élevage: développement, production et conseil (Verneuil-sur-Vienne) ; Certificat de Spécialisation Agricole - Conduite d'un élevage de production avicole - en apprentissage (Bressuire), apprentissage ; Certificat de Spécialisation Agricole - Conduite d'un élevage de production avicole - en apprentissage (Orthez), apprentissage ; …
- Formations, A1301 : 6 montrées sur 91 : BTS - Agricole - Génie des équipements agricoles - en apprentissage (Saint-Yrieix-la-Perche), apprentissage ; BTS - Agricole - Métiers du Végétal : Alimentation, Ornement, Environnement (Voutezac) ; BTS - Agricole - Viticulture-Oenologie (La Couronne) ; …
- Formations, L1403 : 6 montrées sur 10 : Certificat de Spécialisation Agricole - Education et travail des jeunes équidés - en apprentissage (Nérac), apprentissage ; Certificat de Spécialisation Agricole - Education et travail des jeunes équidés - en apprentissage (Yssingeaux), apprentissage ; Certificat de Spécialisation Agricole - Education et travail des jeunes équidés - en apprentissage (Laval), apprentissage ; …

Écartés :

- Vétérinaire (A1504) : Il faut au moins 6 ans d'études après le bac, et vous avez répondu « le moins possible ».
- Aquaculteur (A1404) : C'est un métier très proche de « Aviculteur », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Chef d'équipe de travaux de milieux naturels (A1207) : On y dirige une équipe (coordonner les activités sur le chantier). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.
- Foreur (F1401) : Le salaire de départ y est le Smic, soit 1 867 € brut par mois en début de carrière (source : CIDJ, fiche métier « Foreur », 2026).

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Aviculteur**. *Le métier, simplement* (gabarit) : Il produit des volailles pour la consommation de viande, la production d'œufs ou d'autres produits dérivés. Concrètement, il élève et soigne les volailles dans le respect du bien-être et de la santé des animaux, gère l'alimentation et l'hygiène quotidienne des volailles et surveille la santé des animaux et administre les traitements nécessaires.
  *Pourquoi* : Vous avez dit qu'on l'appelle quand il faut réparer ou monter quelque chose : dans ce métier, il aurait à répartir les animaux dans des locaux d'élevage ou en plein air. Que dès qu'il peut, il s'occupe d'animaux ou va dans la nature : il serait aussi amené à administrer des produits vétérinaires. Qu'il n'aime pas rester assis : le métier lui demanderait aussi de nettoyer les installations avicoles. Et qu'il veut des études les plus courtes possible : c'est accessible dès le bac.
  *Pour l'enfant* : On t'appelle pour réparer ou monter quelque chose : ici, tu aurais à répartir les animaux dans des locaux d'élevage ou en plein air. Tu es bien avec les animaux et dans la nature : tu serais aussi amené à administrer des produits vétérinaires. Tu as besoin de bouger : le métier te demanderait aussi de nettoyer les installations avicoles.
- **Technicien en agriculture**. *Le métier, simplement* (gabarit) : Il conseille et assiste les professionnels de l'agriculture, en particulier dans le maraichage et l'horticulture, afin d'optimiser la production. Concrètement, il supervise et optimise les processus de production agricole en respectant l'environnement et conseille les agriculteurs sur les techniques culturales et les innovations agricoles.
  *Pourquoi* : Vous avez dit qu'on l'appelle quand il faut réparer ou monter quelque chose : dans ce métier, il aurait à effectuer la maintenance de premier niveau des outillages et des équipements. Que dès qu'il peut, il s'occupe d'animaux ou va dans la nature : il serait aussi amené à planifier des rotations de cultures pour maintenir la fertilité du sol. Et qu'il veut des études les plus courtes possible : c'est accessible dès bac + 2.
  *Pour l'enfant* : On t'appelle pour réparer ou monter quelque chose : ici, tu aurais à effectuer la maintenance de premier niveau des outillages et des équipements. Tu es bien avec les animaux et dans la nature : tu serais aussi amené à planifier des rotations de cultures pour maintenir la fertilité du sol. Tu préfères des études courtes : tu peux y accéder dès bac + 2.
- **Cavalier d'entraînement**. *Le métier, simplement* (gabarit) : Il travaille sous la responsabilité d'un entraîneur et participe à la préparation physique et mentale des chevaux de courses (galop ou trot) en vue des compétitions. Concrètement, il monte les chevaux de course à l'entraînement selon les consignes de l'entraîneur, adapte le travail en fonction du niveau et des besoins de chaque cheval et assure les soins quotidiens aux chevaux.
  *Pourquoi* : Vous avez dit qu'il n'aime pas rester assis : dans ce métier, il aurait à faire preuve d'endurance et de sang-froid.
  *Pour l'enfant* : Tu es bien avec les animaux et dans la nature : ici, tu aurais à participer aux séances d'entraînement pour chevaux. Tu as besoin de bouger : tu serais aussi amené à faire preuve d'endurance et de sang-froid. On t'appelle pour réparer ou monter quelque chose : le métier te demanderait aussi d'entretenir l'espace de vie d'un animal.

</details>

#### Mixte

Source : **llm**. Champs remplacés : I1603.pourquoi_parent, I1603.pourquoi_enfant, A1409.pourquoi_enfant, F1629.ia_phrase. Durée du conseiller : 16,2 s.

Appels : appel 1 (conseil) : echec_validation, 15,9 s, 26703 jetons en entrée (128 en cache), 2284 en sortie, 0,039 $ ; règles en échec : T30×2 T14 T11×4 T04×2 T23.

Contrôles : aucune violation, 1 à vérifier, 0 note(s) ; 0 nombre(s) et 0 diplôme(s) cités dans 11 textes. Liens parent + enfant par piste : 4+3, 4+3, 3+3.

  - à vérifier · mobilite · I1603 : aucune des 6 formations montrées dans le rayon « departement_et_voisins »

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Mécanicien-réparateur en matériels agricoles (I1603) | 10 | 7 | Véhicules, engins, aéronefs | 1 802 à 2 365 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Mécanicien-réparateur / Mécanicienne-réparatrice en matériels agricoles » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1603, encadré « Salaires des offres d'emploi », 2026) | CAP ou équivalent (avant le bac) | 19 495 projets, 72 % difficiles (Ouvriers mécaniciens de véhicules ; 2026) |
| 2 | Aviculteur (A1409) | 1 | 1 | Production | 1 802 à 1 957 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Aviculteur / Avicultrice » (France Travail, France entière) ; France Travail, Métierscope, fiche métier A1409, encadré « Salaires des offres d'emploi », 2026) | bac | 6 970 projets, 49 % difficiles (Eleveurs ; 2026) |
| 3 | Electricien de signalisation ferroviaire (F1629) | 9 | 6 | Second oeuvre | 1 833 à 2 704 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Electricien / Electricienne de signalisation ferroviaire » (France Travail, France entière) ; France Travail, Métierscope, fiche métier F1629, encadré « Salaires des offres d'emploi », 2026) | CAP ou équivalent (avant le bac) | 10 795 projets, 62 % difficiles (Ouvriers en électricité du bâtiment ; 2026) |

- Formations, I1603 : 6 montrées sur 48 : BTS - Production - Techniques et services en matériels agricoles - en apprentissage (Neuvic), apprentissage ; BTS - Production - Techniques et services en matériels agricoles (Neuvic) ; BTS - Production - Maintenance des matériels de construction et de manutention (Gannat) ; …
- Formations, A1409 : 6 montrées sur 50 : BTS - Agricole - Métiers de l'élevage: développement, production et conseil (Verneuil-sur-Vienne) ; Certificat de Spécialisation Agricole - Conduite d'un élevage de production avicole - en apprentissage (Bressuire), apprentissage ; Certificat de Spécialisation Agricole - Conduite d'un élevage de production avicole - en apprentissage (Orthez), apprentissage ; …
- Formations, F1629 : 6 montrées sur 417 : BTS - Production - Electrotechnique - en apprentissage (Limoges), apprentissage ; BTS - Production - Electrotechnique (Limoges) ; BTS - Production - Electrotechnique - en apprentissage (Brive-la-Gaillarde), apprentissage ; …

Écartés :

- Vétérinaire (A1504) : Il faut au moins 6 ans d'études après le bac, et vous avez répondu « le moins possible ».
- Aquaculteur (A1404) : C'est un métier très proche de « Aviculteur », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Chef d'équipe de travaux de milieux naturels (A1207) : On y dirige une équipe (coordonner les activités sur le chantier). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.
- Foreur (F1401) : Le salaire de départ y est le Smic, soit 1 867 € brut par mois en début de carrière (source : CIDJ, fiche métier « Foreur », 2026).
- Conducteur d'engins d'exploitation forestière (A1102) : Le salaire de départ y est proche du Smic : de 1 802 à 2 083 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier A1102, encadré « Salaires des offres d'emploi », 2026).

Les textes du mode mixte :

**1. Mécanicien-réparateur en matériels agricoles (I1603)**

**Le métier, simplement** (llm). Il répare et entretient les tracteurs, moissonneuses et autres machines agricoles. Il diagnostique la panne, change les pièces, fait les réglages et teste pour que tout fonctionne à nouveau. Il intervient souvent directement sur l'exploitation.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut aider à repérer certaines pannes courantes. Mais poser le diagnostic sur place, démonter et remonter la machine au milieu des champs, ça reste un travail manuel et sur le terrain.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'il bosse en extra dans une ferme maraîchère le week-end et ne s'en plaint jamais : il intervient directement sur l'exploitation pour réparer les machines en panne. Qu'on l'appelle quand il faut réparer ou monter quelque chose : il diagnostique les pannes et effectue les réparations sur le matériel agricole. Qu'il essaie et recommence jusqu'à ce que ça marche : il fait la maintenance préventive et corrective jusqu'à ce que l'engin reparte. Et que sa plus grande fierté, c'est qu'on lui ait confié les serres pendant les vacances : il conseille les agriculteurs sur l'entretien de leurs équipements.

**Pour l'enfant** (llm). Tu peux passer des heures à bosser en ferme maraîchère : tu interviens directement sur l'exploitation pour réparer les machines en panne. On t'appelle pour réparer ou monter quelque chose : tu diagnostiques les pannes et tu répares le matériel agricole. Tu gardes ton calme quand ça s'agite autour de toi : tu gères les dépannages sur site même quand le travail est arrêté.

**2. Aviculteur (A1409)**

**Le métier, simplement** (llm). Il élève des volailles pour la viande ou les œufs. Il les nourrit, surveille leur santé, leur donne les soins nécessaires et nettoie les bâtiments tous les jours. Il travaille souvent dehors ou dans les poulaillers.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut suivre certains paramètres d'ambiance dans les bâtiments. Mais soigner les animaux un par un, vérifier leur comportement et maintenir les installations, ça se fait sur place avec le regard et les gestes.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que dès qu'il peut, il s'occupe d'animaux ou va dans la nature et bosse en ferme maraîchère : il élève et soigne les volailles dans le respect du bien-être animal. Que sa plus grande fierté, c'est qu'on lui ait confié les serres pendant les vacances : il gère l'alimentation et l'hygiène quotidienne des volailles. Qu'il garde son calme quand les autres paniquent : il surveille la santé des animaux et administre les traitements nécessaires. Et qu'il veut des études les plus courtes possible : c'est accessible dès le bac en apprentissage.

**Pour l'enfant** (llm). Tu es bien avec les animaux et dans la nature : tu élèves et soignes les volailles tous les jours. On t'a déjà confié des responsabilités : tu gères l'alimentation et l'hygiène des animaux. Tu essaies et recommences jusqu'à ce que ça marche : tu assures le suivi des naissances et la croissance des volailles.

**3. Electricien de signalisation ferroviaire (F1629)**

**Le métier, simplement** (llm). Il installe et entretient les signaux, les aiguillages et les systèmes électriques le long des voies ferrées. Il vérifie les câbles, répare les pannes et s'assure que tout fonctionne pour la sécurité des trains. Il travaille dehors sur les voies ou en atelier.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'on l'appelle quand il faut réparer ou monter quelque chose : il assure la maintenance préventive et corrective des installations électriques. Qu'il garde son calme quand les autres paniquent : il diagnostique et répare les pannes pour rétablir rapidement le service. Et qu'il n'aime pas rester assis : il travaille en extérieur sur les voies ferrées et les chantiers.

**Pour l'enfant** (llm). On t'appelle pour réparer ou monter quelque chose : tu assures la maintenance et tu répares les installations de signalisation. Tu gardes ton calme quand ça s'agite autour de toi : tu diagnostiques les pannes et tu rétablis le service rapidement. Tu as envie de bouger : tu travailles sur les voies et les chantiers en extérieur.

### 3.10. `sarah_terminale_veto`

Sarah, Terminale générale (SVT, physique-chimie), Rennes. Animaux, nature, sérieuse. Pense à vétérinaire, mais 5 ans d'études au plus. Refuse la vente.

- Situation : terminale_generale (svt, physique_chimie) ; genre : elle
- Contraintes : études cinq_ans ; alternance plutot_non ; privé non ; département 35, mobilité france ; refus vente ; ce qui compte utile ; métier évoqué : Vétérinaire
- Phrases libres : temps_libre_precis « Elle passe des heures au centre équestre, à soigner les chevaux plus qu'à monter. » ; fierte_recit « Son exposé sur les loups, préparé pendant des semaines, qui a eu 19. »

#### Calcul seul

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 11 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,2 s.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Technicienne en agriculture (A1301) | 1 | 1 | Etudes et assistance technique | 1 802 à 2 500 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien / Technicienne en agriculture » (France Travail, France entière) ; France Travail, Métierscope, fiche métier A1301, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 3 964 projets, 47 % difficiles (Techniciens et agents d'encadrement d'exploitations agricoles ; 2026) |
| 2 | Conductrice de travaux forestiers (A1213) | 2 | 2 | Espaces naturels et espaces verts | 1 802 à 2 730 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Conducteur / Conductrice de travaux forestiers » (France Travail, France entière) ; France Travail, Métierscope, fiche métier A1213, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 2 695 projets, 67 % difficiles (Bûcherons, sylviculteurs et agents forestiers ; 2026) |
| 3 | Animatrice QSE - Qualité Sécurité Environnement BTP (F1204) | 4 | 3 | Conduite et encadrement de chantier - travaux | 1 820 à 3 750 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Animateur / Animatrice QSE - Qualité Sécurité Environnement BTP » (France Travail, France entière) ; France Travail, Métierscope, fiche métier F1204, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 2 284 projets, 72 % difficiles (Techniciens du contrôle qualité ; 2026) |

- Formations, A1301 : 6 montrées sur 103 : BTS - Agricole - Métiers du Végétal : Alimentation, Ornement, Environnement (Coutances) ; BTS - Agricole - Viticulture-Oenologie (Fondettes) ; BUT - Génie biologique Parcours agronomie (Angers) ; …
- Formations, A1213 : 6 montrées sur 36 : BTS - Agricole - Gestion forestière (Rouillon) ; BTS - Agricole - Gestion forestière - en apprentissage (Rouillon), apprentissage ; BTS - Agricole - Gestion forestière (Nogent-sur-Vernisson) ; …
- Formations, F1204 : 6 montrées sur 20 : BUT - Hygiène Sécurité Environnement (Vire Normandie) ; BUT - Hygiène Sécurité Environnement - en apprentissage (Colmar), apprentissage ; BUT - Hygiène Sécurité Environnement (Lorient) ; …

Écartés :

- Vétérinaire (A1504) : Il faut au moins 6 ans d'études après le bac, et vous avez répondu « 5 ans ».
- Responsable de site naturel protégé (A1216) : On y dirige une équipe (superviser et coordonner la mise en œuvre d'un un programme d'action pour un espace protégé). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.
- Educatrice nature environnement (G1240) : Le salaire de départ y est proche du Smic : de 1 802 à 2 240 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier G1240, encadré « Salaires des offres d'emploi », 2026).
- Technicienne forestière (A1311) : Le salaire de départ y est proche du Smic : environ 2 000 € brut par mois en début de carrière (source : CIDJ, fiche métier « Technicien forestier / Technicienne forestière », 2025).
- Foreuse (F1401) : Le salaire de départ y est le Smic, soit 1 867 € brut par mois en début de carrière (source : CIDJ, fiche métier « Foreur », 2026).

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Technicienne en agriculture**. *Le métier, simplement* (gabarit) : Elle conseille et assiste les professionnels de l'agriculture, en particulier dans le maraichage et l'horticulture, afin d'optimiser la production. Concrètement, elle supervise et optimise les processus de production agricole en respectant l'environnement et conseille les agriculteurs sur les techniques culturales et les innovations agricoles.
  *Pourquoi* : Vous avez dit que face à un problème, elle cherche jusqu'à comprendre : dans ce métier, elle aurait à procéder à des tests, expérimentations. Que dès qu'elle peut, elle s'occupe d'animaux ou va dans la nature : elle serait aussi amenée à planifier des rotations de cultures pour maintenir la fertilité du sol. Qu'elle prévoit tout à l'avance : le métier lui demanderait aussi de planifier une opération de semis, de traitement ou de récolte sur un site d'exploitation. Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 2.
  *Pour l'enfant* : Face à un problème, tu cherches jusqu'à comprendre : ici, tu aurais à procéder à des tests, expérimentations. Tu es bien avec les animaux et dans la nature : tu serais aussi amenée à planifier des rotations de cultures pour maintenir la fertilité du sol. Tu prévois les choses à l'avance : le métier te demanderait aussi de planifier une opération de semis, de traitement ou de récolte sur un site d'exploitation.
- **Conductrice de travaux forestiers**. *Le métier, simplement* (gabarit) : Elle orchestre la gestion des travaux forestiers, en alliant expertise technique et respect de l'environnement pour préserver et valoriser le patrimoine naturel. Concrètement, elle manage une équipe opérationnelle et met en œuvre des objectifs opérationnels, ouvre, suit et réceptionne un chantier et veille au respect des normes environnementales et de sécurité lors des interventions forestières.
  *Pourquoi* : Vous avez dit que dès qu'elle peut, elle s'occupe d'animaux ou va dans la nature : dans ce métier, elle aurait à former le personnel aux normes de sécurité forestière. Qu'elle prévoit tout à l'avance : elle serait aussi amenée à organiser le travail d'une équipe. Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 2, jusqu'à bac + 5 selon les postes.
  *Pour l'enfant* : Tu es bien avec les animaux et dans la nature : ici, tu aurais à former le personnel aux normes de sécurité forestière. Tu prévois les choses à l'avance : tu serais aussi amenée à organiser le travail d'une équipe. Tu es prête à faire jusqu'à cinq ans d'études : tu peux y accéder dès bac + 2, jusqu'à bac + 5 selon les postes.
- **Animatrice QSE - Qualité Sécurité Environnement BTP**. *Le métier, simplement* (gabarit) : L'animateur QSE - Qualité, Sécurité, Environnement BTP analyse les risques sur un chantier et promeut les pratiques de sécurité et de respect de l'environnement. Concrètement, elle élabore et met en œuvre des procédures, qualité et sécurité.
  *Pourquoi* : Vous avez dit que le week-end, elle file dehors, dans la nature : dans ce métier, elle aurait à suivre et analyser des données statistiques d'un chantier sur la sécurité, la santé, les accidents du travail.
  *Pour l'enfant* : Le week-end, tu files dehors, dans la nature : ici, tu aurais à suivre et analyser des données statistiques d'un chantier sur la sécurité, la santé, les accidents du travail. Tu prévois les choses à l'avance : tu serais aussi amenée à assurer la conformité des installations avec les normes de sécurité. Tu es prête à faire jusqu'à cinq ans d'études : tu peux y accéder dès bac + 2, jusqu'à bac + 5 selon les postes.

</details>

#### Mixte

Source : **llm**. Champs remplacés : G1240.pourquoi_parent, A1301.pourquoi_parent, F1119.ia_phrase. Durée du conseiller : 21,5 s.

Appels : appel 1 (conseil) : echec_validation, 15,6 s, 25951 jetons en entrée (4864 en cache), 2165 en sortie, 0,033 $ ; règles en échec : T10 T30×4 T14×2 T11×4 T33 ; appel 2 (correction) : echec_validation, 5,5 s, 28412 jetons en entrée (128 en cache), 735 en sortie, 0,037 $ ; règles en échec : T30×3 T14×2 T11×4 T33.

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 4 nombre(s) et 0 diplôme(s) cités dans 11 textes. Liens parent + enfant par piste : 4+3, 4+3, 3+3.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Educatrice nature environnement (G1240) | 5 | 4 | Animation d'activités de loisirs | 1 802 à 2 240 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Educateur / Educatrice nature environnement » (France Travail, France entière) ; France Travail, Métierscope, fiche métier G1240, encadré « Salaires des offres d'emploi », 2026) | bac | 64 780 projets, 43 % difficiles (Professionnels de l'animation socioculturelle ; 2026) |
| 2 | Technicienne en agriculture (A1301) | 1 | 1 | Etudes et assistance technique | 1 802 à 2 500 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien / Technicienne en agriculture » (France Travail, France entière) ; France Travail, Métierscope, fiche métier A1301, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 3 964 projets, 47 % difficiles (Techniciens et agents d'encadrement d'exploitations agricoles ; 2026) |
| 3 | Pédologue (F1119) | 8 | 6 | Conception et études | 2 300 € brut par mois (salaire brut mensuel de début de carrière du métier « Pédologue » ; CIDJ, fiche métier « Pédologue », 2024) | bac + 5 | 1 424 projets, 63 % difficiles (Cadres des études BTP, des études géologiques, du métré de la construction et du contrôle et diagnostic technique du BTP ; 2026) |

- Formations, G1240 : 6 montrées sur 75 : BUT - Carrières sociales Parcours animation sociale et socioculturelle (Rennes) ; BTS - Agricole - Gestion et protection de la nature (Sées) ; BTS - Agricole - Gestion et protection de la nature - en apprentissage (Saint-Aubin-du-Cormier), apprentissage ; …
- Formations, A1301 : 6 montrées sur 103 : BTS - Agricole - Métiers du Végétal : Alimentation, Ornement, Environnement (Coutances) ; BTS - Agricole - Viticulture-Oenologie (Fondettes) ; BUT - Génie biologique Parcours agronomie (Angers) ; …
- Formations, F1119 : 6 montrées sur 248 : Licence - Sciences de la vie et de la terre - Biologie générale, Biologie cellulaire moléculaire, Sciences de l'environnement, Biologie Biotechnologies, Biologie Biosanté, TACB (Vannes) ; Licence - Sciences de la terre (Caen) ; Licence - Sciences de la Terre et environnement (Tours) ; …

Écartés :

- Vétérinaire (A1504) : Il faut au moins 6 ans d'études après le bac, et vous avez répondu « 5 ans ».
- Responsable de site naturel protégé (A1216) : On y dirige une équipe (superviser et coordonner la mise en œuvre d'un un programme d'action pour un espace protégé). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.
- Technicienne forestière (A1311) : Le salaire de départ y est proche du Smic : environ 2 000 € brut par mois en début de carrière (source : CIDJ, fiche métier « Technicien forestier / Technicienne forestière », 2025).
- Foreuse (F1401) : Le salaire de départ y est le Smic, soit 1 867 € brut par mois en début de carrière (source : CIDJ, fiche métier « Foreur », 2026).
- Agente de diagnostic et de contrôle en agriculture (A1302) : C'est un métier très proche de « Technicienne en agriculture », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.

Les textes du mode mixte :

**1. Educatrice nature environnement (G1240)**

**Le métier, simplement** (llm). Elle conçoit et anime des activités pour faire connaître la nature et la biodiversité aux gens. Elle organise des sorties pour observer la faune et la flore, prépare des supports pédagogiques et accompagne les groupes en plein air.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut générer des fiches sur les espèces ou des cartes. Mais guider un groupe en forêt, répondre aux questions sur place et adapter l'activité au moment, ça reste humain.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle peut passer des heures à soigner les chevaux au centre équestre : elle organise des sorties d'observation de la faune et de la flore en milieu naturel. Que ses proches lui demandent de leur expliquer les choses : elle conçoit et anime des activités pédagogiques sur la protection de la nature. Qu'elle prévoit tout à l'avance : elle planifie et organise les ateliers de sensibilisation à l'écologie. Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 3.

**Pour l'enfant** (llm). Tu es bien avec les animaux et dans la nature : tu organiserais des sorties pour observer la faune et la flore avec des groupes. On vient te demander d'expliquer les choses : tu concevrais et animerais des activités pédagogiques sur la nature. Le week-end, tu files dehors, dans la nature : tu accompagnerais des groupes lors de visites guidées en extérieur.

**2. Technicienne en agriculture (A1301)**

**Le métier, simplement** (llm). Elle conseille les agriculteurs et optimise la production en maraîchage ou horticulture. Elle réalise des analyses de sol, planifie les cultures, applique les traitements et contrôle la qualité des produits en respectant l'environnement.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut modéliser des rotations de cultures ou analyser des données de sol. Mais prélever sur le terrain, observer les plantes et conseiller un agriculteur en direct, ça se fait en personne.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle peut passer des heures à soigner les chevaux au centre équestre : elle participe à la mise en place de projets d'agriculture biologique. Qu'elle est à l'aise en SVT : elle réalise des études de sol et des analyses pour améliorer les cultures. Que sa plus grande fierté, c'est son exposé sur les loups préparé pendant des semaines : elle assure une veille technologique et réglementaire pour adapter les pratiques. Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 2.

**Pour l'enfant** (llm). Tu es bien avec les animaux et dans la nature : tu planifierais des rotations de cultures pour maintenir la fertilité du sol. Tu sais préparer quelque chose longtemps et aller au bout : tu ferais une veille technique pour anticiper les évolutions. Face à un problème, tu cherches jusqu'à comprendre : tu procéderais à des tests et expérimentations sur les cultures.

**3. Pédologue (F1119)**

**Le métier, simplement** (llm). Elle analyse les caractéristiques des sols, leur fertilité et leur évolution. Elle conseille sur les pratiques agricoles, réalise des études d'impact et collabore avec agriculteurs et urbanistes pour une gestion durable des terres.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que face à un problème, elle cherche jusqu'à comprendre : elle définit et coordonne des méthodes d'études de sols et sous-sols. Qu'elle est à l'aise en physique-chimie : elle analyse les caractéristiques physiques chimiques et biologiques des sols. Et qu'elle lit et écrit sur son temps libre : elle participe à des projets de recherche pour améliorer la gestion des sols.

**Pour l'enfant** (llm). Tu es à l'aise en SVT : tu évaluerais la fertilité des sols et conseillerais sur les pratiques agricoles. Tu prévois les choses à l'avance : tu concevrais et gérerais un projet d'étude des terrains. Être utile aux autres compte pour toi : tu contribuerais à la préservation des écosystèmes par une gestion durable.

### 3.11. `jade_premiere_arts`

Jade, Première générale (arts, HLP, LLCER), Paris. Dessine, crée, affiche du spectacle. 5 ans d'études, le privé est possible, partout en France. Pense à graphiste. Refuse les chiffres.

- Situation : premiere_generale (arts, hlp, llcer) ; genre : elle
- Contraintes : études cinq_ans ; alternance plutot_non ; privé oui ; département 75, mobilité france ; refus chiffres ; ce qui compte creer, temps ; métier évoqué : Graphiste
- Phrases libres : temps_libre_precis « Elle remplit des carnets de croquis, surtout des gens dans le métro. » ; aide_exemple « Ses copines lui demandent leurs logos pour leurs comptes Instagram. » ; fierte_recit « L'affiche du spectacle de fin d'année, qu'on a vue partout dans le quartier. »

#### Calcul seul

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 9 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,2 s.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Assistante maîtrise d'œuvre en architecture (F1126) | 1 | 1 | Conception et études | 1 840 à 2 908 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Assistant / Assistante maîtrise d'œuvre en architecture » (France Travail, France entière) ; France Travail, Métierscope, fiche métier F1126, encadré « Salaires des offres d'emploi », 2026) | bac | 1 567 projets, 65 % difficiles (Dessinateurs en bâtiment et en travaux publics ; 2026) |
| 2 | Nez (H1505) | 2 | 2 | Qualité et analyses industrielles | 1 802 à 4 615 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Nez » (France Travail, France entière) ; France Travail, Métierscope, fiche métier H1505, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 5 708 projets, 44 % difficiles (Techniciens des industries de process ; 2026) |
| 3 | Modéliste industrielle (H1205) · souvent proposé | 4 | 4 | Conception, recherche, études et développement | 1 802 à 3 500 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Modéliste industriel / Modéliste industrielle » (France Travail, France entière) ; France Travail, Métierscope, fiche métier H1205, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 2 218 projets, 56 % difficiles (Ouvriers, techniciens et agents de maîtrise de l'habillement ; 2026) |

- Formations, F1126 : 6 montrées sur 65 : BTS - Agricole - Aménagements paysagers (Montreuil) ; BTS - Agricole - Gestion et maitrise de l'eau (Mesnils-sur-Iton) ; BTS - Agricole - Aménagements paysagers (Paris) ; …
- Formations, H1505 : 6 montrées sur 198 : BTS - Services - Métiers de l'esthétique-cosmétique-parfumerie (Paris) ; BTS - Services - Métiers de l'esthétique-cosmétique-parfumerie - en apprentissage (Paris), apprentissage ; BTS - Services - Métiers de l'esthétique-cosmétique-parfumerie (Sceaux) ; …
- Formations, H1205 : 6 montrées sur 7 : BTS - Production - Métiers de la mode-chaussure et maroquinerie (Paris) ; BTS - Production - Métiers de la mode-chaussure et maroquinerie (Issoudun) ; BTS - Production - Métiers de la mode-chaussure et maroquinerie (Fougères) ; …

Écartés :

- Technicienne en conception industrielle en mécanique (H1235) : Les entreprises y prévoient peu de recrutements : 903 projets pour la famille « Techniciens du dessin industriel » en 2026 (France Travail).
- Dessinatrice en électricité-électronique (H1202) : Les entreprises y prévoient peu de recrutements : 903 projets pour la famille « Techniciens du dessin industriel » en 2026 (France Travail).
- Designer (H1204) : C'est un métier très proche de « Assistante maîtrise d'œuvre en architecture », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Assistante maîtrise d'œuvre en architecture**. *Le métier, simplement* (gabarit) : Elle participe à la conception et au suivi de projets de construction, de rénovation, d'aménagement paysager et d'urbanisme. Concrètement, elle réalise des dessins techniques et des maquettes numériques, participe à l'élaboration des dossiers de demande administrative et participe à la coordination avec les différents intervenants du projet.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir créé quelque chose : dans ce métier, elle aurait à créer un dessin technique, un plan, ou une carte. Qu'elle lit et écrit sur son temps libre : elle serait aussi amenée à participer à l'élaboration de dossiers administratifs. Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès le bac.
  *Pour l'enfant* : Tu as déjà créé quelque chose, un dessin, un morceau, une vidéo, un plat : ici, tu aurais à créer un dessin technique, un plan, ou une carte. Tu aimes lire et écrire : tu serais aussi amenée à participer à l'élaboration de dossiers administratifs. Tu es prête à faire jusqu'à cinq ans d'études : tu peux y accéder dès le bac.
- **Nez**. *Le métier, simplement* (gabarit) : Elle compose des arômes, des fragrances destinés à des produits alimentaires, cosmétiques (gels douche, lait pour le corps, etc.) ou de parfumerie et en effectue l'analyse chimique et sensorielle (gustative et olfactive). Concrètement, elle intervient selon les normes de fabrication et les attentes des consommateurs et peut former aux techniques de dégustation et d'olfaction.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir créé quelque chose : dans ce métier, elle aurait à composer des accords harmonieux entre différentes notes aromatiques. Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 2.
  *Pour l'enfant* : Tu as déjà créé quelque chose, un dessin, un morceau, une vidéo, un plat : ici, tu aurais à composer des accords harmonieux entre différentes notes aromatiques. Tu es prête à faire jusqu'à cinq ans d'études : tu peux y accéder dès bac + 2.
- **Modéliste industrielle**. *Le métier, simplement* (gabarit) : Elle transforme une idée de styliste ou un dessin de collection en prototype concret de vêtements, prêt à être industrialisé. Concrètement, elle réalise la mise au point technique et qualitative d'articles par modification ou création de patrons modèles à partir d'un cahier des charges, un croquis et travaille en étroite collaboration avec les équipes de design, de production et de contrôle qualité.
  *Pourquoi* : Vous avez dit qu'elle lit et écrit sur son temps libre : dans ce métier, elle aurait à adapter un patron ou un gabarit à partir du croquis.
  *Pour l'enfant* : Tu as déjà créé quelque chose, un dessin, un morceau, une vidéo, un plat : ici, tu aurais à porter une appréciation esthétique ou artistique. Tu aimes lire et écrire : tu serais aussi amenée à adapter un patron ou un gabarit à partir du croquis. Tu es prête à faire jusqu'à cinq ans d'études : tu peux y accéder dès bac + 2, jusqu'à bac + 3 selon les postes.

</details>

#### Mixte

Source : **llm**. Champs remplacés : H1205.pourquoi_parent, H1205.pourquoi_enfant, F1126.pourquoi_enfant, E1201.pourquoi_parent, F1126.pourquoi_parent. Durée du conseiller : 25,1 s.

Appels : appel 1 (conseil) : echec_validation, 18,0 s, 25996 jetons en entrée (4864 en cache), 2218 en sortie, 0,033 $ ; règles en échec : V05 T31 T04×3 T11×5 T19×2 T15×3 ; appel 2 (correction) : echec_validation, 6,6 s, 28906 jetons en entrée (128 en cache), 713 en sortie, 0,038 $ ; règles en échec : T04×3 T11×4 T19 T15×3.

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 0 nombre(s) et 0 diplôme(s) cités dans 12 textes. Liens parent + enfant par piste : 3+2, 2+2, 2+3.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Modéliste industrielle (H1205) · souvent proposé | 4 | 4 | Conception, recherche, études et développement | 1 802 à 3 500 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Modéliste industriel / Modéliste industrielle » (France Travail, France entière) ; France Travail, Métierscope, fiche métier H1205, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 2 218 projets, 56 % difficiles (Ouvriers, techniciens et agents de maîtrise de l'habillement ; 2026) |
| 2 | Assistante maîtrise d'œuvre en architecture (F1126) | 1 | 1 | Conception et études | 1 840 à 2 908 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Assistant / Assistante maîtrise d'œuvre en architecture » (France Travail, France entière) ; France Travail, Métierscope, fiche métier F1126, encadré « Salaires des offres d'emploi », 2026) | bac | 1 567 projets, 65 % difficiles (Dessinateurs en bâtiment et en travaux publics ; 2026) |
| 3 | Photographe professionnelle (E1201) · connu | 55 | 19 | Images et sons | 1 802 à 2 200 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Photographe professionnel / Photographe professionnelle » (France Travail, France entière) ; France Travail, Métierscope, fiche métier E1201, encadré « Salaires des offres d'emploi », 2026) | sans diplôme exigé | 576 projets, 59 % difficiles (Photographes ; 2026) |

- Formations, H1205 : 6 montrées sur 7 : BTS - Production - Métiers de la mode-chaussure et maroquinerie (Paris) ; BTS - Production - Métiers de la mode-chaussure et maroquinerie (Issoudun) ; BTS - Production - Métiers de la mode-chaussure et maroquinerie (Fougères) ; …
- Formations, F1126 : 6 montrées sur 65 : BTS - Agricole - Aménagements paysagers (Montreuil) ; BTS - Agricole - Gestion et maitrise de l'eau (Mesnils-sur-Iton) ; BTS - Agricole - Aménagements paysagers (Paris) ; …
- Formations, E1201 : 6 montrées sur 21 : BTS - Services - Photographie (Paris) ; BTS - Services - Photographie - en apprentissage (Paris), apprentissage ; BTS - Services - Photographie (Ivry-sur-Seine) ; …

Écartés :

- Designer graphique (E1205) : C'est un métier très proche de « Photographe professionnelle », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Technicienne en conception industrielle en mécanique (H1235) : C'est un métier très proche de « Modéliste industrielle », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Dessinatrice en électricité-électronique (H1202) : C'est un métier très proche de « Modéliste industrielle », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Editrice (E1105) : La fiche officielle du métier le dit : « Une première expérience de 1 à 2 ans dans le secteur ou dans des fonctions similaires est requise » (France Travail).
- Eclairagiste (L1504) : Le salaire de départ y est proche du Smic : de 1 802 à 2 200 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier L1504, encadré « Salaires des offres d'emploi », 2026).

Les textes du mode mixte :

**1. Modéliste industrielle (H1205)**

**Le métier, simplement** (llm). Elle transforme un dessin ou une idée en prototype de vêtement concret. Elle crée ou modifie des patrons à partir d'un croquis, ajuste les formes et les tailles, puis vérifie que le modèle est conforme avant d'être industrialisé.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut générer des variantes de patrons. Mais apprécier l'équilibre esthétique d'un prototype et l'ajuster sur un mannequin, ça reste son geste.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle peut passer des heures à remplir des carnets de croquis surtout des gens dans le métro : elle transforme un croquis en patron modèle qu'elle modifie jusqu'au prototype concret. Que dans un groupe, c'est elle qui propose les idées : elle travaille en étroite collaboration avec les équipes de design. Et que sa plus grande fierté, c'est d'avoir créé l'affiche du spectacle de fin d'année : elle évalue la conformité esthétique et fonctionnelle du prototype.

**Pour l'enfant** (llm). Tu peux passer des heures à remplir des carnets de croquis : tu transformerais un croquis en patron que tu modifies jusqu'au prototype. Dans un groupe, c'est toi qui proposes les idées : tu travaillerais en étroite collaboration avec les équipes de design.

**2. Assistante maîtrise d'œuvre en architecture (F1126)**

**Le métier, simplement** (llm). Elle participe à la conception de bâtiments ou d'aménagements. Elle réalise des dessins techniques et des maquettes numériques, prépare les dossiers pour les permis et coordonne avec les entrepreneurs et les clients sur le terrain.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut produire des plans ou des variantes de maquettes. Mais discuter avec le client sur le chantier, adapter un dessin en fonction du terrain et coordonner les intervenants, ça se fait en personne.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle peut passer des heures à remplir des carnets de croquis surtout des gens dans le métro : elle réalise des dessins techniques et des maquettes numériques pour les projets. Et que dans un groupe, c'est elle qui propose les idées : elle participe à la coordination avec les différents intervenants du projet.

**Pour l'enfant** (llm). Tu peux passer des heures à remplir des carnets de croquis : tu réaliserais des dessins techniques et des maquettes numériques. Dans un groupe, c'est toi qui proposes les idées : tu coordonnerais avec les différents intervenants du projet.

**3. Photographe professionnelle (E1201)**

**Le métier, simplement** (llm). Elle réalise des prises de vue en studio ou en extérieur. Elle repère les lieux, organise sa logistique, règle l'éclairage et cadre ses photos puis elle traite et retouche les images pour obtenir l'effet voulu.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut retoucher des images ou suggérer des compositions. Mais repérer un lieu, choisir le bon moment et décider de l'éclairage avec la personne en face, ça reste son regard.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle crée sur ordinateur montage musique ou dessin : elle traite et retouche les images pour obtenir la qualité et l'effet désirés. Et que sa plus grande fierté, c'est l'affiche du spectacle de fin d'année qu'on a vue partout dans le quartier : elle multiplie ses prises et agit sur les réglages face aux conditions et imprévus sur le terrain.

**Pour l'enfant** (llm). Tu peux passer des heures à remplir des carnets de croquis : tu réaliserais des prises de vue après avoir repéré le lieu. Tu fais du montage ou du dessin sur ordinateur : tu traiterais et retoucherais les images pour obtenir l'effet voulu. Tu sais improviser et t'adapter : tu multiplierais tes prises et ajusterais les réglages face aux imprévus sur le terrain.

### 3.12. `adam_terminale_sport`

Adam, Terminale générale (EPPCS, SVT), Bordeaux. En groupe, sportif, entraîne les petits de son club, met l'ambiance. Scolarité inégale, 3 ans d'études. Refuse le bureau. On lui a parlé de kiné.

- Situation : terminale_generale (eppcs, svt) ; genre : il
- Contraintes : études trois_ans ; alternance pourquoi_pas ; privé ne_sait_pas ; département 33, mobilité region ; refus bureau ; ce qui compte bouger, utile ; métier évoqué : Kinésithérapeute
- Phrases libres : temps_libre_precis « Foot quatre fois par semaine, et il regarde tous les matchs. » ; fierte_recit « Il entraîne les U9 de son club le mercredi, et les parents le remercient à chaque fois. »

#### Calcul seul

Contrôles : aucune violation, 1 à vérifier, 0 note(s) ; 3 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,1 s.

  - à vérifier · mobilite · K2136 : aucune des 6 formations montrées dans le rayon « region »

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Maître d'hôtel (G1802) | 1 | 1 | Service | 1 833 à 2 605 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Maître / Maîtresse d'hôtel » (France Travail, France entière) ; France Travail, Métierscope, fiche métier G1802, encadré « Salaires des offres d'emploi », 2026) | bac | 93 769 projets, 42 % difficiles (Serveurs de cafés restaurants ; 2026) |
| 2 | Educateur nature environnement (G1240) | 2 | 2 | Animation d'activités de loisirs | 1 802 à 2 240 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Educateur / Educatrice nature environnement » (France Travail, France entière) ; France Travail, Métierscope, fiche métier G1240, encadré « Salaires des offres d'emploi », 2026) | bac | 64 780 projets, 43 % difficiles (Professionnels de l'animation socioculturelle ; 2026) |
| 3 | Professeur territorial d'enseignement artistique (K2136) · connu | 3 | 3 | Formation initiale et continue | 2 048 à 4 095 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Professeur territorial / Professeure territoriale d'enseignement artistique » (France Travail, France entière) ; France Travail, Métierscope, fiche métier K2136, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 51 022 projets, 6 % difficiles (Artistes (musique, danse, spectacles) ; 2026) |

- Formations, G1802 : 6 montrées sur 238 : BTS - Services - Management en hôtellerie restauration (Talence) ; BTS - Services - Management en hôtellerie restauration - en apprentissage (Talence), apprentissage ; BTS - Services - Management en hôtellerie restauration (Bergerac) ; …
- Formations, G1240 : 6 montrées sur 80 : BUT - Carrières sociales Parcours animation sociale et socioculturelle (Bordeaux) ; BTS - Agricole - Gestion et protection de la nature (Coulounieix-Chamiers) ; BTS - Agricole - Gestion et protection de la nature - en apprentissage (Bordeaux), apprentissage ; …
- Formations, K2136 : 6 montrées sur 8 : Licence - Etudes théâtrales (Montpellier) ; Double licence - Etudes théâtrales / Cinéma et Audiovisuel - (Paris) ; Double licence - Etudes théâtrales / Lettres - (Paris) ; …

Écartés :

- Directeur de centre de séjour de vacances (G1241) : La fiche officielle du métier le dit : « Une première expérience est souvent demandée » (France Travail).
- Educateur sportif (G1204) : Le salaire de départ y est proche du Smic : du Smic (1 867 €) à 2 000 € brut par mois en début de carrière (source : CIDJ, fiche métier « Éducateur sportif / Éducatrice sportive », 2024).
- Responsable d'animation (G1239) : On y dirige une équipe (superviser la sécurité des espaces de loisirs). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.
- Technicien forestier (A1311) : Le salaire de départ y est proche du Smic : environ 2 000 € brut par mois en début de carrière (source : CIDJ, fiche métier « Technicien forestier / Technicienne forestière », 2025).
- Chargé de projet emploi (K1812) : On y reste au bureau toute la journée, et vous avez dit qu'il ne le voulait pas.

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Maître d'hôtel**. *Le métier, simplement* (gabarit) : Il accueille et conseille les clients dès leur arrivée dans l'établissement, coordonne et supervise le travail de l'équipe de salle et assure la gestion des réservations et l'organisation des tables.
  *Pourquoi* : Vous avez dit qu'il parle facilement à des adultes qu'il ne connaît pas : dans ce métier, il aurait à accueillir le client et l'installer. Qu'il est plus à l'aise en groupe : il serait aussi amené à coordonner les réservations et optimiser l'occupation de la salle. Que sa plus grande fierté, c'est qu'on lui ait confié une responsabilité : le métier lui demanderait aussi de planifier et organiser l'activité du personnel relevant de sa responsabilité. Et qu'il ne veut pas plus de 3 ans d'études : c'est accessible dès le bac.
  *Pour l'enfant* : Tu engages facilement la conversation, même avec des inconnus : ici, tu aurais à accueillir le client et l'installer. Tu es à l'aise en groupe : tu serais aussi amené à coordonner les réservations et optimiser l'occupation de la salle. On t'a déjà confié des responsabilités : le métier te demanderait aussi de planifier et organiser l'activité du personnel relevant de sa responsabilité.
- **Educateur nature environnement**. *Le métier, simplement* (gabarit) : L'animateur nature environnement sensibilise le public à la connaissance et à la protection de la nature et de la biodiversité. Concrètement, il conçoit et anime des activités pédagogiques en milieu naturel, organise des sorties de découverte et d'observation de la faune et de la flore et développe des programmes d'éducation environnementale pour différents publics.
  *Pourquoi* : Vous avez dit que c'est à lui qu'on demande d'organiser les sorties : dans ce métier, il aurait à organiser et planifier une activité. Que ses proches lui demandent de leur expliquer les choses : il serait aussi amené à accompagner des groupes lors de visites guidées ou sorties en extérieur. Et qu'il ne veut pas plus de 3 ans d'études : c'est accessible dès le bac.
  *Pour l'enfant* : C'est souvent toi qui organises les sorties : ici, tu aurais à organiser et planifier une activité. On vient te demander d'expliquer les choses : tu serais aussi amené à accompagner des groupes lors de visites guidées ou sorties en extérieur. Tu vises trois ans d'études au plus : tu peux y accéder dès le bac.
- **Professeur territorial d'enseignement artistique**. *Le métier, simplement* (gabarit) : Le Professeur d'enseignement artistique est un créateur et transmetteur de savoir artistique, incluant le dessin, le design, l'illustration et les outils numériques. Concrètement, il enseigne diverses techniques artistiques et théories de l'art, développe la créativité et les compétences techniques des étudiants et prépare et anime des ateliers pratiques et théoriques.
  *Pourquoi* : Vous avez dit que c'est à lui qu'on demande d'organiser les sorties : dans ce métier, il aurait à organiser des expositions d'œuvres d'élèves. Que ses proches lui demandent de leur expliquer les choses : il serait aussi amené à animer des activités culturelles et artistiques. Et que sa plus grande fierté, c'est qu'on lui ait confié une responsabilité : le métier lui demanderait aussi d'encourager la créativité et l'innovation.
  *Pour l'enfant* : C'est souvent toi qui organises les sorties : ici, tu aurais à organiser des expositions d'œuvres d'élèves. On vient te demander d'expliquer les choses : tu serais aussi amené à animer des activités culturelles et artistiques. On t'a déjà confié des responsabilités : le métier te demanderait aussi d'encourager la créativité et l'innovation.

</details>

#### Mixte

Source : **partiel**. Champs remplacés : G1204.pourquoi_parent, G1204.pourquoi_enfant, A1311.pourquoi_parent, G1802.piste. Durée du conseiller : 25,1 s.

Appels : appel 1 (conseil) : echec_validation, 16,1 s, 26455 jetons en entrée (4864 en cache), 1712 en sortie, 0,032 $ ; règles en échec : V05 T04×4 T11×4 T10 T15 T33 T28×2 ; appel 2 (correction) : echec_validation, 8,7 s, 28800 jetons en entrée (128 en cache), 1083 en sortie, 0,039 $ ; règles en échec : V04 T04×3 T11×4 T28×7.

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 2 nombre(s) et 0 diplôme(s) cités dans 11 textes. Liens parent + enfant par piste : 3+3, 4+3, 4+3.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Educateur sportif (G1204) · connu | 16 | 14 | Animation d'activités de loisirs | 1 867,02 à 2 000 € brut par mois (salaire brut mensuel de début de carrière du métier « Éducateur sportif / Éducatrice sportive » ; CIDJ, fiche métier « Éducateur sportif / Éducatrice sportive », 2024) | bac | 22 247 projets, 45 % difficiles (Sportifs et animateurs sportifs ; 2026) |
| 2 | Technicien forestier (A1311) | 5 | 5 | Etudes et assistance technique | environ 2 000 € brut par mois (salaire brut mensuel de début de carrière du métier « Technicien forestier / Technicienne forestière » ; CIDJ, fiche métier « Technicien forestier / Technicienne forestière », 2025) | bac | 3 964 projets, 47 % difficiles (Techniciens et agents d'encadrement d'exploitations agricoles ; 2026) |
| 3 | Maître d'hôtel (G1802) | 1 | 1 | Service | 1 833 à 2 605 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Maître / Maîtresse d'hôtel » (France Travail, France entière) ; France Travail, Métierscope, fiche métier G1802, encadré « Salaires des offres d'emploi », 2026) | bac | 93 769 projets, 42 % difficiles (Serveurs de cafés restaurants ; 2026) |

- Formations, G1204 : 6 montrées sur 220 : Licence - Sciences et Techniques des Activités Physiques et Sportives - Accès Santé (LAS) (Pessac) ; DEUST - Animation et gestion des activités physiques, sportives ou culturelles (Brive-la-Gaillarde) ; BPJEPS - Spécialité Educateur sportif - Mention Activités aquatiques et de la natation (Talence) ; …
- Formations, A1311 : 6 montrées sur 82 : BTS - Agricole - Gestion forestière (Bazas) ; BTS - Agricole - Gestion forestière - en apprentissage (Bazas), apprentissage ; BTS - Agricole - Métiers de l'élevage: développement, production et conseil (Melle) ; …
- Formations, G1802 : 6 montrées sur 238 : BTS - Services - Management en hôtellerie restauration (Talence) ; BTS - Services - Management en hôtellerie restauration - en apprentissage (Talence), apprentissage ; BTS - Services - Management en hôtellerie restauration (Bergerac) ; …

Écartés :

- Directeur de centre de séjour de vacances (G1241) : La fiche officielle du métier le dit : « Une première expérience est souvent demandée » (France Travail).
- Educateur nature environnement (G1240) : C'est un métier très proche de « Educateur sportif », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Encadrant technique d'insertion socioprofessionnelle (K1224) : On y dirige une équipe (coordonner les activités d'une équipe sur un chantier d'insertion). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.
- Conseiller consultant en formation (K2101) : On y reste au bureau toute la journée, et vous avez dit qu'il ne le voulait pas.
- Régisseur de spectacles (L1512) : La fiche officielle du métier le dit : « Une expérience confirmée dans la production du spectacle vivant est en général requise » (France Travail).

Les textes du mode mixte :

**1. Educateur sportif (G1204)**

**Le métier, simplement** (llm). Il enseigne et encadre des activités sportives selon les attentes du public, en initiation, loisir ou compétition. Il veille à la sécurité de chacun, explique les règles et peut organiser des événements ou gérer une petite structure.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut aider à préparer des fiches d'exercices. Mais montrer un mouvement, corriger un geste sur le terrain et motiver un groupe, ça se fait en direct avec les participants.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'il peut passer des heures à foot quatre fois par semaine et regarder tous les matchs : il enseigne et encadre des activités sportives selon le public. Que dans un groupe, c'est lui qui met l'ambiance et fait le lien : il facilite la coopération au sein d'une équipe ou d'un groupe. Et qu'il ne veut pas plus de 3 ans d'études : c'est accessible dès le bac.

**Pour l'enfant** (llm). Tu peux passer des heures à foot quatre fois par semaine : tu enseignerais et encadrerais des activités sportives. Dans un groupe, tu mets l'ambiance et tu fais le lien : tu faciliterais la coopération entre les participants. On t'a déjà confié des responsabilités : tu organiserais des événements sportifs.

**2. Technicien forestier (A1311)**

**Le métier, simplement** (llm). Il gère et surveille les forêts, planifie les opérations de reboisement ou de coupe et conseille les propriétaires. Il renseigne le public sur la biodiversité et participe à la prévention des risques naturels en travaillant dehors avec d'autres professionnels.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut modéliser des scénarios de gestion forestière. Mais observer les arbres sur place, décider d'une intervention avec l'équipe et expliquer aux propriétaires, ça se fait sur le terrain.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'il est à l'aise en SVT : il renseigne et sensibilise le public à la biodiversité. Qu'il a envie de bouger, de voyager : il travaille en extérieur avec des déplacements fréquents. Que c'est à lui qu'on demande d'organiser les sorties : il organise des chantiers forestiers et coordonne des projets. Et que sa plus grande fierté, c'est qu'on lui ait confié une responsabilité : il coordonne des projets de conservation de la biodiversité.

**Pour l'enfant** (llm). Tu es à l'aise en SVT : tu renseignerais le public sur la biodiversité. Tu as envie de bouger, de voyager : tu travaillerais en extérieur avec des déplacements. C'est souvent toi qui organises les sorties : tu organiserais des chantiers forestiers.

**3. Maître d'hôtel (G1802)**

**Le métier, simplement** (gabarit). Il accueille et conseille les clients dès leur arrivée dans l'établissement, coordonne et supervise le travail de l'équipe de salle et assure la gestion des réservations et l'organisation des tables.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (gabarit). Vous avez dit qu'il parle facilement à des adultes qu'il ne connaît pas : dans ce métier, il aurait à accueillir le client et l'installer. Qu'il est plus à l'aise en groupe : il serait aussi amené à coordonner les réservations et optimiser l'occupation de la salle. Que sa plus grande fierté, c'est qu'on lui ait confié une responsabilité : le métier lui demanderait aussi de planifier et organiser l'activité du personnel relevant de sa responsabilité. Et qu'il ne veut pas plus de 3 ans d'études : c'est accessible dès le bac.

**Pour l'enfant** (gabarit). Tu engages facilement la conversation, même avec des inconnus : ici, tu aurais à accueillir le client et l'installer. Tu es à l'aise en groupe : tu serais aussi amené à coordonner les réservations et optimiser l'occupation de la salle. On t'a déjà confié des responsabilités : le métier te demanderait aussi de planifier et organiser l'activité du personnel relevant de sa responsabilité.

### 3.13. `emma_stmg`

Emma, Terminale technologique STMG, Pas-de-Calais. Organisée, à l'aise avec les chiffres utiles, a tenu la caisse de la kermesse. 2 ans d'études, alternance idéale, rester près. Refuse la nuit et le week-end.

- Situation : terminale_techno (stmg) ; genre : elle
- Contraintes : études deux_ans ; alternance ideal ; privé alternance ; département 62, mobilité rester_pres ; refus nuit, week_end ; ce qui compte stable, temps
- Phrases libres : fierte_recit « Quand elle a tenu la caisse du stand de la kermesse toute la journée, sans une erreur. »
- Questions passées : metier_evoque

#### Calcul seul

Contrôles : aucune violation, 1 à vérifier, 1 note(s) ; 12 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,1 s.

  - à vérifier · mobilite · A1213 : aucune des 6 formations montrées dans le rayon « departement_et_voisins »
  - note · experience · F1201 : la voie courte demande une expérience, la voie longue dépasse la durée acceptée

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Ingénieure R&D en industrie (H1206) | 1 | 1 | Conception, recherche, études et développement | 1 972 à 4 167 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Ingénieur / Ingénieure R&D en industrie » (France Travail, France entière) ; France Travail, Métierscope, fiche métier H1206, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 10 948 projets, 47 % difficiles (Ingénieurs et cadres d'étude, recherche et développement (industrie) ; 2026) |
| 2 | Conductrice de travaux forestiers (A1213) | 2 | 2 | Espaces naturels et espaces verts | 1 802 à 2 730 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Conducteur / Conductrice de travaux forestiers » (France Travail, France entière) ; France Travail, Métierscope, fiche métier A1213, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 2 695 projets, 67 % difficiles (Bûcherons, sylviculteurs et agents forestiers ; 2026) |
| 3 | Conductrice de travaux du bâtiment (F1201) · souvent proposé | 3 | 3 | Conduite et encadrement de chantier - travaux | 2 200 à 2 700 € brut par mois (salaire brut mensuel de début de carrière du métier « Conducteur / Conductrice de travaux » ; CIDJ, fiche métier « Conducteur / Conductrice de travaux », 2026) | bac + 2 | 6 478 projets, 62 % difficiles (Ingénieurs du bâtiment et des travaux publics, chefs de chantier et conducteurs de travaux (cadres) ; 2026) |

- Formations, H1206 : 6 montrées sur 48 : BTS - Production - Métiers de la chimie - en apprentissage (Armentières), apprentissage ; BTS - Production - Métiers de la chimie (Armentières) ; DEUST - Physique appliquée et capteurs industriels - en apprentissage (Bruz), apprentissage ; …
- Formations, A1213 : 6 montrées sur 36 : BTS - Agricole - Gestion forestière - en apprentissage (Bellegarde), apprentissage ; BTS - Agricole - Gestion forestière (Saint-Laurent) ; BTS - Agricole - Gestion forestière - en apprentissage (Les Loges-Margueron), apprentissage ; …
- Formations, F1201 : 6 montrées sur 195 : BTS - Production - Finitions, aménagement des bâtiments: conception et réalisation - en apprentissage (Lumbres), apprentissage ; BTS - Production - Systèmes constructifs bois et habitat - en apprentissage (Lumbres), apprentissage ; DEUST - Bâtiment et travaux publics - en apprentissage (Calais), apprentissage ; …

Écartés :

- Architecte-urbaniste (F1127) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 2 ans ».
- Dessinatrice-projeteuse en électricité-électronique (H1236) : Les entreprises y prévoient peu de recrutements : 903 projets pour la famille « Techniciens du dessin industriel » en 2026 (France Travail).
- Ingénieure génie civil (F1111) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 2 ans ».
- Chargée d'études socio-économiques (M1403) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 2 ans ».
- Responsable Qualité Sécurité Environnement -QSE- en industrie (H1523) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 2 ans ».

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Ingénieure R&D en industrie**. *Le métier, simplement* (gabarit) : Elle conçoit et finalise de nouveaux produits ou de nouvelles technologies. Concrètement, elle fait évoluer ceux déjà existants, dans un objectif de développement commercial et d'innovation en milieu industriel, définit des moyens, méthodes et techniques de valorisation et de mise en oeuvre des résultats de recherche et peut superviser et coordonner un projet, une équipe, un service ou un département.
  *Pourquoi* : Vous avez dit que c'est à elle qu'on demande d'organiser les sorties : dans ce métier, elle aurait à concevoir et gérer un projet. Qu'on lui confie les calculs et les comptes : elle serait aussi amenée à concevoir des modèles théoriques. Et qu'elle ne veut pas plus de 2 ans d'études : c'est accessible dès bac + 2, jusqu'à bac + 5 selon les postes.
  *Pour l'enfant* : C'est souvent toi qui organises les sorties : ici, tu aurais à concevoir et gérer un projet. On te confie les calculs et les comptes : tu serais aussi amenée à concevoir des modèles théoriques. Tu vises deux ans d'études au plus : tu peux y accéder dès bac + 2, jusqu'à bac + 5 selon les postes.
- **Conductrice de travaux forestiers**. *Le métier, simplement* (gabarit) : Elle orchestre la gestion des travaux forestiers, en alliant expertise technique et respect de l'environnement pour préserver et valoriser le patrimoine naturel. Concrètement, elle manage une équipe opérationnelle et met en œuvre des objectifs opérationnels, ouvre, suit et réceptionne un chantier et veille au respect des normes environnementales et de sécurité lors des interventions forestières.
  *Pourquoi* : Vous avez dit que c'est à elle qu'on demande d'organiser les sorties : dans ce métier, elle aurait à organiser le travail d'une équipe. Qu'on lui confie les calculs et les comptes : elle serait aussi amenée à assurer la gestion administrative d'une activité. Et qu'elle ne veut pas plus de 2 ans d'études : c'est accessible dès bac + 2, jusqu'à bac + 5 selon les postes.
  *Pour l'enfant* : C'est souvent toi qui organises les sorties : ici, tu aurais à organiser le travail d'une équipe. On te confie les calculs et les comptes : tu serais aussi amenée à assurer la gestion administrative d'une activité. Tu vises deux ans d'études au plus : tu peux y accéder dès bac + 2, jusqu'à bac + 5 selon les postes.
- **Conductrice de travaux du bâtiment**. *Le métier, simplement* (gabarit) : Elle supervise un ou plusieurs chantiers, de construction ou de rénovation, dont elle coordonne l'organisation, la qualité et la sécurité jusqu'à l'achèvement des travaux. Concrètement, elle définit et organise les moyens de production, planifie et supervise les différentes étapes du chantier et coordonne le travail des équipes et des sous-traitants.
  *Pourquoi* : Ce métier ressort de l'ensemble de vos réponses, sans qu'une seule ne suffise à l'expliquer.
  *Pour l'enfant* : C'est souvent toi qui organises les sorties : ici, tu aurais à organiser des réunions et des visites de chantier. On te confie les calculs et les comptes : tu serais aussi amenée à assurer la gestion financière des chantiers.

</details>

#### Mixte

Source : **llm**. Champs remplacés : M1612.pourquoi_parent, M1612.pourquoi_enfant, N4203.pourquoi_parent. Durée du conseiller : 36,1 s.

Appels : appel 1 (conseil) : echec_validation, 20,2 s, 26282 jetons en entrée (4864 en cache), 2126 en sortie, 0,033 $ ; règles en échec : T23×3 T30×2 T05 T13 T14 T12×8 T04 T08 T17 T11×4 ; appel 2 (correction) : echec_validation, 15,4 s, 29024 jetons en entrée (4736 en cache), 1903 en sortie, 0,036 $ ; règles en échec : T30×2 T14 T22 T17 T11×4 T28.

Contrôles : aucune violation, 2 à vérifier, 1 note(s) ; 3 nombre(s) et 0 diplôme(s) cités dans 9 textes. Liens parent + enfant par piste : 4+2, 3+2, 2+3.

  - à vérifier · mobilite · M1612 : aucune des 1 formations montrées dans le rayon « departement_et_voisins »
  - note · alternance · M1612 : aucune formation montrée en apprentissage
  - à vérifier · donnees · M1612 : 1 formation(s) montrée(s), 3 à 6 attendues (SPEC §6)

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Assistante de service juridique (M1612) | 10 | 10 | Secrétariat et assistance | 1 802 à 2 761 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Assistant / Assistante de service juridique » (France Travail, France entière) ; France Travail, Métierscope, fiche métier M1612, encadré « Salaires des offres d'emploi », 2026) | bac | 26 530 projets, 29 % difficiles (Secrétaires bureautiques et assimilés ; 2026) |
| 2 | Chargée de promotion touristique (G1102) | 6 | 6 | Accueil et promotion touristique | 1 820 à 3 333 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Chargé / Chargée de promotion touristique » (France Travail, France entière) ; France Travail, Métierscope, fiche métier G1102, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 5 241 projets, 28 % difficiles (Employés du tourisme et agent de billetterie des transports ; 2026) |
| 3 | Agente d'exploitation en transport routier de marchandises (N4203) | 7 | 7 | Personnel d'encadrement du transport routier | 1 805 à 2 578 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Agent / Agente d'exploitation en transport routier de marchandises » (France Travail, France entière) ; France Travail, Métierscope, fiche métier N4203, encadré « Salaires des offres d'emploi », 2026) | bac | 3 162 projets, 22 % difficiles (Agents d'exploitation du transport ; 2026) |

- Formations, M1612 : 1 montrées sur 1 : DEUST - Assistant juridique (Créteil)
- Formations, G1102 : 6 montrées sur 354 : BTS - Services - Tourisme - en apprentissage (Calais), apprentissage ; BTS - Services - Tourisme (Wingles) ; DEUST - Accueil d'excellence en tourisme (Angers) ; …
- Formations, N4203 : 6 montrées sur 248 : BTS - Services - Gestion des transports et logistique associée - en apprentissage (Hénin-Beaumont), apprentissage ; BTS - Services - Gestion des transports et logistique associée (Hénin-Beaumont) ; Formation professionnelle - Titre professionnel Gestionnaire des opérations de transport routier de marchandises (Bac +2) - en apprentissage (Poitiers), apprentissage ; …

Écartés :

- Architecte-urbaniste (F1127) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 2 ans ».
- Dessinatrice-projeteuse en électricité-électronique (H1236) : Les entreprises y prévoient peu de recrutements : 903 projets pour la famille « Techniciens du dessin industriel » en 2026 (France Travail).
- Ingénieure génie civil (F1111) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 2 ans ».
- Chargée d'études socio-économiques (M1403) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 2 ans ».
- Responsable Qualité Sécurité Environnement -QSE- en industrie (H1523) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 2 ans ».

Les textes du mode mixte :

**1. Assistante de service juridique (M1612)**

**Le métier, simplement** (llm). Elle soutient les avocats ou les services juridiques en préparant les documents, en faisant des recherches dans les bases de données et en gérant les dossiers. Elle organise les rendez-vous, suit les factures et assure la liaison entre les clients, les tribunaux et l'équipe.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que sa plus grande fierté, c'est quand elle a tenu la caisse du stand de la kermesse toute la journée sans une erreur : elle gère les dossiers avec précision et suit chaque étape jusqu'au bout. Que c'est à elle qu'on demande d'organiser les sorties : elle organise les agendas, les rendez-vous et les déplacements. Qu'on lui confie les calculs et les comptes : elle suit les factures et les recouvrements avec le service comptable. Et qu'elle ne veut pas plus de 2 ans d'études : c'est accessible dès le bac.

**Pour l'enfant** (gabarit). On te confie les calculs et les comptes : ici, tu aurais à effectuer le suivi des commandes, la facturation. Tu vises deux ans d'études au plus : tu peux y accéder dès le bac.

**2. Chargée de promotion touristique (G1102)**

**Le métier, simplement** (llm). Elle crée des brochures et des campagnes pour faire connaître les sites touristiques d'une région. Elle organise des événements, choisit les images et les textes, et travaille avec les offices de tourisme et les partenaires locaux pour attirer les visiteurs.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle passe du temps à soigner son style : elle crée des brochures et du matériel promotionnel attractif. Que c'est à elle qu'on demande d'organiser les sorties : elle planifie des événements touristiques et coordonne les campagnes. Et qu'elle est à l'aise en économie : elle analyse les tendances du marché pour adapter les offres.

**Pour l'enfant** (llm). Tu soignes ton style : tu crées des brochures et du matériel promotionnel qui attire l'œil. C'est souvent toi qui organises les sorties : tu planifies des événements et tu organises la diffusion des supports.

**3. Agente d'exploitation en transport routier de marchandises (N4203)**

**Le métier, simplement** (llm). Elle planifie les tournées de camions, établit les plannings des conducteurs et optimise les chargements de marchandises. Elle suit les délais, gère les documents et communique avec les clients et les transporteurs pour que tout arrive à temps.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (gabarit). Vous avez dit qu'on lui confie les calculs et les comptes : dans ce métier, elle aurait à renseigner et mettre à jour des outils de suivi et de traçabilité de l'activité. Et qu'elle ne veut pas plus de 2 ans d'études : c'est accessible dès le bac.

**Pour l'enfant** (llm). Tu prévois les choses à l'avance : tu établis les plannings des conducteurs et des véhicules. Dans un groupe, tu fais ta part, sérieusement : tu communiques avec les conducteurs, les clients et les sous-traitants. Tu es à l'aise en maths : tu évalues les délais, les coûts et la faisabilité d'une prestation.

### 3.14. `kylian_bacpro_commerce`

Kylian, bac pro commerce, Seine-Saint-Denis. En groupe, négocie, revend des baskets. Le moins d'études possible, alternance idéale, rester près. Refuse le physique. Veut gagner et être son patron.

- Situation : bac_pro (commerce) ; genre : il
- Contraintes : études moins_possible ; alternance ideal ; privé alternance ; département 93, mobilité rester_pres ; refus physique ; ce qui compte gagner, patron
- Phrases libres : aide_exemple « Il revend des baskets sur internet, il connaît les prix par cœur. »
- Questions passées : metier_evoque

#### Calcul seul

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 4 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,1 s.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Maître d'hôtel (G1802) | 1 | 1 | Service | 1 833 à 2 605 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Maître / Maîtresse d'hôtel » (France Travail, France entière) ; France Travail, Métierscope, fiche métier G1802, encadré « Salaires des offres d'emploi », 2026) | bac | 93 769 projets, 42 % difficiles (Serveurs de cafés restaurants ; 2026) |
| 2 | Chargé d'affaires BTP (F1135) | 2 | 2 | Conception et études | 1 972 à 3 750 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Chargé / Chargée d'affaires BTP » (France Travail, France entière) ; France Travail, Métierscope, fiche métier F1135, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 1 424 projets, 63 % difficiles (Cadres des études BTP, des études géologiques, du métré de la construction et du contrôle et diagnostic technique du BTP ; 2026) |
| 3 | Conseiller immobilier (C1504) · connu | 5 | 5 | Immobilier | 1 802 à 3 097 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Conseiller / Conseillère immobilier » (France Travail, France entière) ; France Travail, Métierscope, fiche métier C1504, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 9 688 projets, 59 % difficiles (Employés et professions intermédiaires de l'immobilier ; 2026) |

- Formations, G1802 : 6 montrées sur 238 : BTS - Services - Management en hôtellerie restauration - en apprentissage (Paris), apprentissage ; BTS - Services - Management en hôtellerie restauration (Dugny) ; BTS - Services - Management en hôtellerie restauration - en apprentissage (Clichy), apprentissage ; …
- Formations, F1135 : 6 montrées sur 492 : BTS - Production - Electrotechnique - en apprentissage (Drancy), apprentissage ; BTS - Production - Management économique de la construction (Paris) ; BTS - Production - Electrotechnique (Paris) ; …
- Formations, C1504 : 6 montrées sur 61 : Formation professionnelle - Titre professionnel - Assistant immobilier (Bac +2) - en apprentissage (Versailles), apprentissage ; BTS - Services - Professions immobilières (Noisy-le-Sec) ; BTS - Services - Professions immobilières (Paris) ; …

Écartés :

- Chef d'atelier machines agricoles (I1110) : C'est un travail physique, et vous avez dit qu'il ne le voulait pas.
- Manager en restauration rapide (G1409) : On y dirige une équipe (superviser l'élaboration des menus, des cartes et des tarifs). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.
- Conducteur de travaux du bâtiment (F1201) : C'est un métier très proche de « Chargé d'affaires BTP », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Responsable du développement commercial (M1707) : Il faut au moins 3 ans d'études après le bac, et vous avez répondu « le moins possible ».
- Concepteur agencement (F1140) : Le salaire de départ y est proche du Smic : de 1 802 à 2 123 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier F1140, encadré « Salaires des offres d'emploi », 2026).

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Maître d'hôtel**. *Le métier, simplement* (gabarit) : Il accueille et conseille les clients dès leur arrivée dans l'établissement, coordonne et supervise le travail de l'équipe de salle et assure la gestion des réservations et l'organisation des tables.
  *Pourquoi* : Vous avez dit qu'il parle facilement à des adultes qu'il ne connaît pas : dans ce métier, il aurait à accueillir le client et l'installer. Que sa plus grande fierté, c'est d'avoir convaincu des gens, ou vendu quelque chose : il serait aussi amené à établir un devis. Qu'il est plus à l'aise en groupe : le métier lui demanderait aussi de planifier et organiser l'activité du personnel relevant de sa responsabilité. Et qu'il veut des études les plus courtes possible : c'est accessible dès le bac.
  *Pour l'enfant* : Tu engages facilement la conversation, même avec des inconnus : ici, tu aurais à accueillir le client et l'installer. Tu as déjà su convaincre des gens : tu serais aussi amené à établir un devis. Tu es à l'aise en groupe : le métier te demanderait aussi de planifier et organiser l'activité du personnel relevant de sa responsabilité.
- **Chargé d'affaires BTP**. *Le métier, simplement* (gabarit) : Il pilote les aspects commerciaux et techniques des projets de construction et accompagne les clients dans la réalisation des travaux. Concrètement, il élabore des propositions techniques et commerciales adaptées aux besoins des clients, supervise et coordonne les projets de construction ou de rénovation et assure la liaison entre les différents intervenants sur le chantier et les clients.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir convaincu des gens, ou vendu quelque chose : dans ce métier, il aurait à développer un portefeuille clients et prospects. Et qu'il veut des études les plus courtes possible : c'est accessible dès bac + 2, jusqu'à bac + 5 selon les postes.
  *Pour l'enfant* : Tu as déjà su convaincre des gens : ici, tu aurais à développer un portefeuille clients et prospects. Tu préfères des études courtes : tu peux y accéder dès bac + 2, jusqu'à bac + 5 selon les postes.
- **Conseiller immobilier**. *Le métier, simplement* (gabarit) : Il réalise des transactions immobilières et/ou foncières (location, vente) et conseille des clients sur les possibilités d'acquisition, de location, de vente selon la législation de l'immobilier. Concrètement, il peut être spécialisé dans un domaine et peut diriger une agence immobilière ou un réseau d'agences.
  *Pourquoi* : Vous avez dit qu'il parle facilement à des adultes qu'il ne connaît pas : dans ce métier, il aurait à analyser les besoins des clients. Et qu'il improvise, et il s'adapte : il serait aussi amené à organiser et planifier la visite de biens immobiliers.
  *Pour l'enfant* : Tu as déjà su convaincre des gens : ici, tu aurais à conclure une transaction. Tu engages facilement la conversation, même avec des inconnus : tu serais aussi amené à analyser les besoins des clients. Tu sais improviser et t'adapter : le métier te demanderait aussi d'organiser et planifier la visite de biens immobiliers.

</details>

#### Mixte

Source : **partiel**. Champs remplacés : D1224.ia_phrase, G1802.piste. Durée du conseiller : 24,9 s.

Appels : appel 1 (conseil) : echec_validation, 19,3 s, 25334 jetons en entrée (4864 en cache), 2066 en sortie, 0,032 $ ; règles en échec : V05 T11×4 T23×2 T28 ; appel 2 (correction) : echec_validation, 5,2 s, 27653 jetons en entrée (4864 en cache), 597 en sortie, 0,031 $ ; règles en échec : V04 V06 T11×4 T23×2 T28×6.

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 1 nombre(s) et 0 diplôme(s) cités dans 10 textes. Liens parent + enfant par piste : 4+3, 3+3, 3+3.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Conseiller immobilier (C1504) · connu | 5 | 5 | Immobilier | 1 802 à 3 097 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Conseiller / Conseillère immobilier » (France Travail, France entière) ; France Travail, Métierscope, fiche métier C1504, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 9 688 projets, 59 % difficiles (Employés et professions intermédiaires de l'immobilier ; 2026) |
| 2 | Chargé de location d'engins et de matériel de chantier (D1224) | 15 | 11 | Commerce non alimentaire et de prestations de confort | 1 802 à 2 244 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Chargé / Chargée de location d'engins et de matériel de chantier » (France Travail, France entière) ; France Travail, Métierscope, fiche métier D1224, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 5 241 projets, 28 % difficiles (Employés du tourisme et agent de billetterie des transports ; 2026) |
| 3 | Maître d'hôtel (G1802) | 1 | 1 | Service | 1 833 à 2 605 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Maître / Maîtresse d'hôtel » (France Travail, France entière) ; France Travail, Métierscope, fiche métier G1802, encadré « Salaires des offres d'emploi », 2026) | bac | 93 769 projets, 42 % difficiles (Serveurs de cafés restaurants ; 2026) |

- Formations, C1504 : 6 montrées sur 61 : Formation professionnelle - Titre professionnel - Assistant immobilier (Bac +2) - en apprentissage (Versailles), apprentissage ; BTS - Services - Professions immobilières (Noisy-le-Sec) ; BTS - Services - Professions immobilières (Paris) ; …
- Formations, D1224 : 6 montrées sur 88 : BTS - Production - Travaux publics - en apprentissage (Beauvais), apprentissage ; BTS - Production - Travaux publics (Paris) ; DEUST - Bâtiment et travaux publics - en apprentissage (Calais), apprentissage ; …
- Formations, G1802 : 6 montrées sur 238 : BTS - Services - Management en hôtellerie restauration - en apprentissage (Paris), apprentissage ; BTS - Services - Management en hôtellerie restauration (Dugny) ; BTS - Services - Management en hôtellerie restauration - en apprentissage (Clichy), apprentissage ; …

Écartés :

- Chef d'atelier machines agricoles (I1110) : C'est un travail physique, et vous avez dit qu'il ne le voulait pas.
- Manager en restauration rapide (G1409) : On y dirige une équipe (superviser l'élaboration des menus, des cartes et des tarifs). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.
- Responsable du développement commercial (M1707) : Il faut au moins 3 ans d'études après le bac, et vous avez répondu « le moins possible ».
- Chargé de plaidoyer (E1131) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « le moins possible ».
- Architecte du bâtiment (F1101) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « le moins possible ».

Les textes du mode mixte :

**1. Conseiller immobilier (C1504)**

**Le métier, simplement** (llm). Il rencontre des clients pour leur présenter des biens à vendre ou à louer. Il les écoute, leur montre les endroits, répond à leurs questions et négocie les conditions jusqu'à conclure l'affaire. Il organise aussi les visites et suit les dossiers.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut trier des annonces ou calculer des estimations. Mais convaincre un client en visitant un bien avec lui et en répondant à ses hésitations, ça reste une discussion humaine.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que sa plus grande fierté, c'est d'avoir convaincu des gens, ou vendu quelque chose : il rencontre des clients et conclut la vente ou la location après avoir négocié. Qu'il sait négocier, et obtient souvent gain de cause : il négocie les conditions de la transaction avec le client et les parties. Qu'il parle facilement à des adultes qu'il ne connaît pas : il accueille les clients et organise les visites de biens avec eux. Et qu'il veut des études les plus courtes possible : c'est accessible dès bac + 2.

**Pour l'enfant** (llm). Tu as déjà su convaincre des gens : tu présenterais des biens et tu conclurais la vente ou la location. Tu sais négocier : tu négocierais les conditions avec les clients jusqu'à l'accord. Tu engages facilement la conversation, même avec des inconnus : tu accueillerais les clients et tu organiserais les visites avec eux.

**2. Chargé de location d'engins et de matériel de chantier (D1224)**

**Le métier, simplement** (llm). Il conseille des entreprises de construction sur le choix de machines et d'engins. Il négocie les conditions de location, organise les livraisons sur les chantiers, forme les utilisateurs et suit les contrats jusqu'au retour du matériel.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'il sait négocier, et obtient souvent gain de cause : il négocie les conditions de location avec les clients. Qu'il parle facilement à des adultes qu'il ne connaît pas : il accueille les clients et les informe sur le matériel. Et que l'alternance lui conviendrait bien : c'est une voie possible en apprentissage.

**Pour l'enfant** (llm). Tu sais négocier : tu négocierais les conditions de location avec les clients. Tu engages facilement la conversation, même avec des inconnus : tu accueillerais les clients et tu leur présenterais le matériel. Dans un groupe, tu prends les choses en main : tu coordonnerais les livraisons et les retours sur les chantiers.

**3. Maître d'hôtel (G1802)**

**Le métier, simplement** (gabarit). Il accueille et conseille les clients dès leur arrivée dans l'établissement, coordonne et supervise le travail de l'équipe de salle et assure la gestion des réservations et l'organisation des tables.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (gabarit). Vous avez dit que sa plus grande fierté, c'est d'avoir convaincu des gens, ou vendu quelque chose : dans ce métier, il aurait à établir un devis. Qu'il est plus à l'aise en groupe : il serait aussi amené à planifier et organiser l'activité du personnel relevant de sa responsabilité. Et qu'il veut des études les plus courtes possible : c'est accessible dès le bac.

**Pour l'enfant** (gabarit). Tu engages facilement la conversation, même avec des inconnus : ici, tu aurais à accueillir le client et l'installer. Tu as déjà su convaincre des gens : tu serais aussi amené à établir un devis. Tu es à l'aise en groupe : le métier te demanderait aussi de planifier et organiser l'activité du personnel relevant de sa responsabilité.

### 3.15. `louise_terminale_sciences`

Louise, Terminale générale (maths, physique-chimie), Rennes. Seule, comprend tout, adore les problèmes, très bonne élève. Plus de 5 ans d'études possibles, partout en France, pas de privé. Refuse les soins et la vente.

- Situation : terminale_generale (maths, physique_chimie) ; genre : elle
- Contraintes : études plus ; alternance plutot_non ; privé non ; département 35, mobilité france ; refus soins, vente ; ce qui compte utile, creer
- Phrases libres : temps_libre_precis « Elle regarde des vidéos d'astronomie le soir et nous les raconte au dîner. » ; fierte_recit « Un problème des Olympiades de maths sur lequel elle a passé tout un week-end. »
- Questions passées : metier_evoque

#### Calcul seul

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 4 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,1 s.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Ingénieure énergies renouvelables (H1237) | 1 | 1 | Conception, recherche, études et développement | 2 700 € brut par mois (salaire brut mensuel de début de carrière du métier « Ingénieur / Ingénieure en énergies renouvelables » ; CIDJ, fiche métier « Ingénieur / Ingénieure en énergies renouvelables », 2026) | bac + 5 | 10 948 projets, 47 % difficiles (Ingénieurs et cadres d'étude, recherche et développement (industrie) ; 2026) |
| 2 | Ingénieure qualité (H1520) | 2 | 2 | Qualité et analyses industrielles | 2 700 € brut par mois (salaire brut mensuel de début de carrière du métier « Ingénieur qualité / Ingénieure qualité » ; CIDJ, fiche métier « Ingénieur qualité / Ingénieure qualité », 2025) | bac + 5 | 2 171 projets, 42 % difficiles (Ingénieurs des méthodes de production, du contrôle qualité ; 2026) |
| 3 | Ingénieure études conception électrique (F1141) | 3 | 3 | Conception et études | 2 275 à 3 750 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Ingénieur / Ingénieure études conception électrique » (France Travail, France entière) ; France Travail, Métierscope, fiche métier F1141, encadré « Salaires des offres d'emploi », 2026) | bac + 5 | 1 424 projets, 63 % difficiles (Cadres des études BTP, des études géologiques, du métré de la construction et du contrôle et diagnostic technique du BTP ; 2026) |

- Formations, H1237 : 6 montrées sur 16 : Licence - Electronique, énergie électrique, automatique (Caen) ; Licence - Génie civil (La Rochelle) ; Licence - Portail Sciences de l'ingénieur : Électronique, Mécanique - Accès Santé (LAS) (Paris) ; …
- Formations, H1520 : 6 montrées sur 175 : Formation d'ingénieur Bac + 5 - Agroalimentaire - 5 ans à Rennes (Rennes) ; Formation d'ingénieur Bac + 5 - Bac Général (Rennes) ; Formation d'ingénieur Bac + 5 - Double diplôme - Parcours MICA (Mathématiques Informatique Civil et Automatique) (Rennes) ; …
- Formations, F1141 : 6 montrées sur 89 : Licence - Génie civil (La Rochelle) ; Licence - Génie urbain (Champs-sur-Marne) ; Licence - Portail informatique, sciences et technologies du numérique parcours Défi (Rennes) ; …

Écartés :

- Actuaire en assurances (C1105) : Il faut vendre, et vous avez dit qu'elle ne le voulait pas.
- Biostatisticienne (K2403) : Selon l'OIT, ce métier est fortement exposé à l'IA générative. Nous avons préféré des pistes qui le sont moins.
- Directrice des ventes (D1406) : Il faut vendre, et vous avez dit qu'elle ne le voulait pas.

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Ingénieure énergies renouvelables**. *Le métier, simplement* (gabarit) : Elle élabore, développe et supervise des projets de production d'énergie utilisant des sources renouvelables afin de contribuer à la transition énergétique et réduire les émissions de carbone. Concrètement, elle conçoit des projets d'énergies renouvelables telles que l'énergie solaire, éolienne, hydraulique, biomasse, ou géothermique et réalise des études de faisabilité technique et économique.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir résolu quelque chose de difficile à force de chercher : dans ce métier, elle aurait à réaliser des études de faisabilité technique et économique pour le montage de projets d'énergie renouvelable. Qu'on lui confie les calculs et les comptes : elle serait aussi amenée à participer à la définition du planning, du budget global et des délais. Et qu'elle est prête à faire de longues études si c'est ce qu'il faut : c'est accessible dès bac + 5.
  *Pour l'enfant* : Tu as déjà résolu quelque chose de difficile, à force de chercher : ici, tu aurais à réaliser des études de faisabilité technique et économique pour le montage de projets d'énergie renouvelable. On te confie les calculs et les comptes : tu serais aussi amenée à participer à la définition du planning, du budget global et des délais. Tu es prête à faire de longues études s'il le faut : tu peux y accéder dès bac + 5.
- **Ingénieure qualité**. *Le métier, simplement* (gabarit) : Elle définit et met en œuvre les procédures de contrôle qualité conformément aux normes en vigueur et collabore avec les fournisseurs pour assurer la conformité des matières premières et composants.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir résolu quelque chose de difficile à force de chercher : dans ce métier, elle aurait à réaliser des analyses statistiques pour identifier les tendances de qualité. Qu'on lui confie les calculs et les comptes : elle serait aussi amenée à contrôler la certification et la conformité des outils de mesure et de contrôle. Et qu'elle est prête à faire de longues études si c'est ce qu'il faut : c'est accessible dès bac + 5.
  *Pour l'enfant* : Tu as déjà résolu quelque chose de difficile, à force de chercher : ici, tu aurais à réaliser des analyses statistiques pour identifier les tendances de qualité. On te confie les calculs et les comptes : tu serais aussi amenée à contrôler la certification et la conformité des outils de mesure et de contrôle. Tu es prête à faire de longues études s'il le faut : tu peux y accéder dès bac + 5.
- **Ingénieure études conception électrique**. *Le métier, simplement* (gabarit) : Elle est responsable des études de dimensionnement, de performance et de conformité des équipements permettant la production, le transport et l'utilisation de l'énergie électrique. Concrètement, elle analyse les besoins et réalise des études de faisabilité technique et économique pour de nouveaux projets et définit les cahiers des charges et suit l'exécution des projets.
  *Pourquoi* : Vous avez dit qu'elle prévoit tout à l'avance : dans ce métier, elle aurait à encadrer et coordonner une équipe.
  *Pour l'enfant* : Tu as déjà résolu quelque chose de difficile, à force de chercher : ici, tu aurais à réaliser des études de faisabilité technique et financière. On te confie les calculs et les comptes : tu serais aussi amenée à analyser et gérer les risques financiers. Tu prévois les choses à l'avance : le métier te demanderait aussi d'encadrer et coordonner une équipe.

</details>

#### Mixte

Source : **llm**. Champs remplacés : H1237.pourquoi_parent, H1237.pourquoi_enfant, H1520.pourquoi_parent, H1520.pourquoi_enfant, M1419.pourquoi_parent. Durée du conseiller : 24,0 s.

Appels : appel 1 (conseil) : echec_validation, 18,5 s, 26802 jetons en entrée (4864 en cache), 1886 en sortie, 0,033 $ ; règles en échec : T30 T14 T04×5 T11×4 T18 ; appel 2 (correction) : echec_validation, 5,2 s, 28950 jetons en entrée (4864 en cache), 561 en sortie, 0,032 $ ; règles en échec : T30 T14 T04×5 T11×4 T18.

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 2 nombre(s) et 0 diplôme(s) cités dans 11 textes. Liens parent + enfant par piste : 4+2, 3+3, 3+2.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Ingénieure énergies renouvelables (H1237) | 1 | 1 | Conception, recherche, études et développement | 2 700 € brut par mois (salaire brut mensuel de début de carrière du métier « Ingénieur / Ingénieure en énergies renouvelables » ; CIDJ, fiche métier « Ingénieur / Ingénieure en énergies renouvelables », 2026) | bac + 5 | 10 948 projets, 47 % difficiles (Ingénieurs et cadres d'étude, recherche et développement (industrie) ; 2026) |
| 2 | Ingénieure qualité (H1520) | 2 | 2 | Qualité et analyses industrielles | 2 700 € brut par mois (salaire brut mensuel de début de carrière du métier « Ingénieur qualité / Ingénieure qualité » ; CIDJ, fiche métier « Ingénieur qualité / Ingénieure qualité », 2025) | bac + 5 | 2 171 projets, 42 % difficiles (Ingénieurs des méthodes de production, du contrôle qualité ; 2026) |
| 3 | Data analyst (M1419) | 15 | 7 | Organisation et études | 3 000 € brut par mois (salaire brut mensuel de début de carrière du métier « Data analyst / Data scientist » ; CIDJ, fiche métier « Data analyst / Data scientist », 2026) | bac + 3 | 1 273 projets, 39 % difficiles (Chargés d'études socio-économiques ; 2026) |

- Formations, H1237 : 6 montrées sur 16 : Licence - Electronique, énergie électrique, automatique (Caen) ; Licence - Génie civil (La Rochelle) ; Licence - Portail Sciences de l'ingénieur : Électronique, Mécanique - Accès Santé (LAS) (Paris) ; …
- Formations, H1520 : 6 montrées sur 175 : Formation d'ingénieur Bac + 5 - Agroalimentaire - 5 ans à Rennes (Rennes) ; Formation d'ingénieur Bac + 5 - Bac Général (Rennes) ; Formation d'ingénieur Bac + 5 - Double diplôme - Parcours MICA (Mathématiques Informatique Civil et Automatique) (Rennes) ; …
- Formations, M1419 : 6 montrées sur 328 : Licence - Mathématiques et informatique appliquées aux sciences humaines et sociales (Rennes) ; BUT - Science des données (Vannes) ; Licence - Double diplôme - Licence Informatique, Mathématiques - Licence Double-Diplôme Informatique, Mathématiques (Orsay) ; …

Écartés :

- Actuaire en assurances (C1105) : Il faut vendre, et vous avez dit qu'elle ne le voulait pas.
- Ingénieure d'études de prix BTP (F1106) : C'est un métier très proche de « Ingénieure énergies renouvelables », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Biostatisticienne (K2403) : Selon l'OIT, ce métier est fortement exposé à l'IA générative. Nous avons préféré des pistes qui le sont moins.
- Directrice des ventes (D1406) : Il faut vendre, et vous avez dit qu'elle ne le voulait pas.

Les textes du mode mixte :

**1. Ingénieure énergies renouvelables (H1237)**

**Le métier, simplement** (llm). Elle conçoit des projets pour produire de l'électricité avec le soleil, le vent ou l'eau. Elle étudie si c'est possible techniquement et financièrement, dessine les systèmes, calcule leur rendement et travaille avec des équipes pour les réaliser.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle peut passer des heures à regarder des vidéos d'astronomie le soir et nous les raconte au dîner : elle étudie la faisabilité technique et économique de projets solaires ou éoliens. Que sa plus grande fierté, c'est d'avoir résolu un problème des Olympiades de maths sur lequel elle a passé tout un week-end : elle analyse les données de performance des systèmes pour les optimiser. Que face à un problème elle cherche seule jusqu'à comprendre : elle conçoit des systèmes d'énergie renouvelable adaptés aux besoins. Et qu'elle est prête à faire de longues études si c'est ce qu'il faut : c'est accessible dès bac + 5.

**Pour l'enfant** (llm). Tu as déjà résolu quelque chose de difficile, à force de chercher : tu analyses les données pour améliorer le rendement des installations. Face à un problème, tu cherches jusqu'à comprendre : tu réalises des études de faisabilité technique et économique.

**2. Ingénieure qualité (H1520)**

**Le métier, simplement** (llm). Elle définit les règles pour que les produits industriels soient conformes et fiables. Elle analyse les chiffres de production, repère ce qui ne va pas, propose des améliorations et forme les équipes aux nouvelles procédures.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut traiter rapidement de grandes séries de mesures. Mais analyser une anomalie sur une ligne de production, discuter avec les opérateurs et décider des ajustements, ça reste un travail humain.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que sa plus grande fierté, c'est d'avoir résolu quelque chose de difficile à force de chercher : elle analyse les données de production pour identifier les causes des défaillances. Qu'elle garde son calme quand les autres paniquent : elle réalise des audits pour vérifier l'application des procédures. Et que ses proches lui demandent de leur expliquer les choses : elle forme le personnel aux pratiques de qualité.

**Pour l'enfant** (gabarit). Tu as déjà résolu quelque chose de difficile, à force de chercher : ici, tu aurais à réaliser des analyses statistiques pour identifier les tendances de qualité. On te confie les calculs et les comptes : tu serais aussi amenée à contrôler la certification et la conformité des outils de mesure et de contrôle. Tu es prête à faire de longues études s'il le faut : tu peux y accéder dès bac + 5.

**3. Data analyst (M1419)**

**Le métier, simplement** (llm). Elle transforme des masses de chiffres en tableaux et graphiques qui parlent. Elle collecte les données, cherche les tendances, construit des tableaux de bord et explique ses conclusions aux équipes pour les aider à décider.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut générer des graphiques et repérer des corrélations. Mais choisir quelles données garder, comprendre le contexte métier et présenter les résultats de façon convaincante, ça se fait avec les gens.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que les chiffres, pour elle, c'est un jeu : elle conçoit des tableaux de bord pour suivre les performances. Qu'elle passe du temps à chercher comment marchent les choses : elle collecte les données pour en extraire des tendances. Et qu'être utile aux autres compte pour elle : elle collabore avec les équipes pour comprendre leurs besoins en données.

**Pour l'enfant** (llm). Les chiffres, pour toi, c'est un jeu : tu crées des tableaux de bord pour que chacun voie les résultats. Face à un problème, tu cherches jusqu'à comprendre : tu transformes les données en informations pour résoudre des problèmes.

### 3.16. `tom_bacpro_cuisine`

Tom, bac pro hôtellerie-restauration, Dijon. Cuisine, a besoin de bouger, gère les coups de feu. 2 ans d'études, alternance idéale, dans sa région. Ne refuse rien, pas même la nuit ni le week-end.

- Situation : bac_pro (hotellerie) ; genre : il
- Contraintes : études deux_ans ; alternance ideal ; privé alternance ; département 21, mobilité region ; refus rien ; ce qui compte gagner, creer
- Phrases libres : temps_libre_precis « Il teste des recettes de pâtisserie le dimanche, et on goûte tout. » ; fierte_recit « Il a cuisiné seul le repas des 60 ans de sa grand-mère, pour vingt personnes. »
- Questions passées : metier_evoque

#### Calcul seul

Contrôles : aucune violation, 0 à vérifier, 1 note(s) ; 4 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,1 s.

  - note · experience · F1201 : la voie courte demande une expérience, la voie longue dépasse la durée acceptée

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Technicien Datacenter (I1403) | 1 | 1 | Equipements domestiques et informatique | 1 900 à 4 336 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien / Technicienne Datacenter » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1403, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 7 667 projets, 48 % difficiles (Techniciens de production, d'exploitation, d'installation, et de maintenance, support et services aux utilisateurs en informatique ; 2026) |
| 2 | Technicien-cuisiniste en cuisines professionnelles (I1325) | 2 | 2 | Equipements de production, équipements collectifs | 1 833 à 2 991 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien-cuisiniste / Technicienne-cuisiniste en cuisines professionnelles » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1325, encadré « Salaires des offres d'emploi », 2026) | bac | 2 950 projets, 81 % difficiles (Techniciens et agents de maîtrise en installation et maintenance en froid et conditionnement d'air ; 2026) |
| 3 | Conducteur de travaux du bâtiment (F1201) · souvent proposé | 3 | 3 | Conduite et encadrement de chantier - travaux | 2 200 à 2 700 € brut par mois (salaire brut mensuel de début de carrière du métier « Conducteur / Conductrice de travaux » ; CIDJ, fiche métier « Conducteur / Conductrice de travaux », 2026) | bac + 2 | 6 478 projets, 62 % difficiles (Ingénieurs du bâtiment et des travaux publics, chefs de chantier et conducteurs de travaux (cadres) ; 2026) |

- Formations, I1403 : 6 montrées sur 376 : BTS - Services - Communication - en apprentissage (Dijon), apprentissage ; BTS - Services - Communication (Auxonne) ; DEUST - Infrastructures numériques (Villeneuve-d'Ascq) ; …
- Formations, I1325 : 6 montrées sur 417 : BTS - Production - Electrotechnique - en apprentissage (Dole), apprentissage ; BTS - Production - Electrotechnique (Dijon) ; BTS - Production - Electrotechnique - en apprentissage (Montceau-les-Mines), apprentissage ; …
- Formations, F1201 : 6 montrées sur 195 : BTS - Production - Systèmes constructifs bois et habitat - en apprentissage (Mouchard), apprentissage ; BTS - Production - Bâtiment - en apprentissage (Besançon), apprentissage ; BTS - Production - Finitions, aménagement des bâtiments: conception et réalisation - en apprentissage (Dijon), apprentissage ; …

Écartés :

- Agent de maintenance en bureautique (I1409) : Les formations qui y mènent durent au moins 3 ans, et vous avez répondu « 2 ans ».
- Opérateur consoliste en raffinerie (H2711) : Le salaire de départ y est proche du Smic : à partir de 1 800 € brut par mois en début de carrière, d'après la fiche du métier « Opérateur / Opératrice de raffinerie » (source : CIDJ, fiche métier « Opérateur / Opératrice de raffinerie », 2025).
- Technicien en risques technologiques (I1503) : Il faut au moins 3 ans d'études après le bac, et vous avez répondu « 2 ans ».
- Ingénieur du son (L1508) : Les formations qui y mènent durent au moins 3 ans, et vous avez répondu « 2 ans ».
- Eleveur de porcins (A1411) : Le salaire de départ y est proche du Smic : de 1 802 à 1 850 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier A1411, encadré « Salaires des offres d'emploi », 2026).

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Technicien Datacenter**. *Le métier, simplement* (gabarit) : Il assure le bon fonctionnement des équipements informatiques et des infrastructures physiques d'un centre de données. Concrètement, il réalise des prestations de service et de support de premier niveau et fait l'interface avec le client et assure la gestion opérationnelle des bâtiments, la surveillance des systèmes et la gestion des incidents pour garantir la continuité de service.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir fabriqué ou réparé quelque chose de ses mains : dans ce métier, il aurait à monter, assembler, démonter les équipements informatiques. Que c'est à lui qu'on demande d'organiser les sorties : il serait aussi amené à planifier et suivre des opérations de maintenance. Que dans un groupe, il en fait plus que sa part, pour que ce soit bien fait : le métier lui demanderait aussi de réaliser des interventions de maintenance simples sur des équipements informatiques. Et qu'il ne veut pas plus de 2 ans d'études : c'est accessible dès bac + 2, jusqu'à bac + 3 selon les postes.
  *Pour l'enfant* : Tu as déjà fabriqué ou réparé quelque chose de tes mains : ici, tu aurais à monter, assembler, démonter les équipements informatiques. C'est souvent toi qui organises les sorties : tu serais aussi amené à planifier et suivre des opérations de maintenance. Dans un groupe, tu tiens à ce que ce soit bien fait : le métier te demanderait aussi de réaliser des interventions de maintenance simples sur des équipements informatiques.
- **Technicien-cuisiniste en cuisines professionnelles**. *Le métier, simplement* (gabarit) : Il conçoit et installe des cuisines professionnelles adaptées aux besoins des clients, professionnels de l'hôtellerie - restauration . Concrètement, il effectue la pose et les raccordements aux réseaux dans le respect des normes de sécurité, optimise l'espace et l'efficacité des cuisines et assure la maintenance et la réparation des équipements de cuisine.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir fabriqué ou réparé quelque chose de ses mains : dans ce métier, il aurait à installer des équipements de cuisines professionnelles. Que c'est à lui qu'on demande d'organiser les sorties : il serait aussi amené à organiser les opérations de maintenance. Qu'il est plus à l'aise en groupe : le métier lui demanderait aussi d'analyser les besoins des clients. Et qu'il ne veut pas plus de 2 ans d'études : c'est accessible dès le bac.
  *Pour l'enfant* : Tu as déjà fabriqué ou réparé quelque chose de tes mains : ici, tu aurais à installer des équipements de cuisines professionnelles. C'est souvent toi qui organises les sorties : tu serais aussi amené à organiser les opérations de maintenance. Tu es à l'aise en groupe : le métier te demanderait aussi d'analyser les besoins des clients.
- **Conducteur de travaux du bâtiment**. *Le métier, simplement* (gabarit) : Il supervise un ou plusieurs chantiers, de construction ou de rénovation, dont il coordonne l'organisation, la qualité et la sécurité jusqu'à l'achèvement des travaux. Concrètement, il définit et organise les moyens de production, planifie et supervise les différentes étapes du chantier et coordonne le travail des équipes et des sous-traitants.
  *Pourquoi* : Vous avez dit qu'il est plus à l'aise en groupe : dans ce métier, il aurait à encadrer les équipes sous sa responsabilité.
  *Pour l'enfant* : C'est souvent toi qui organises les sorties : ici, tu aurais à organiser des réunions et des visites de chantier. Tu es à l'aise en groupe : tu serais aussi amené à encadrer les équipes sous sa responsabilité.

</details>

#### Mixte

Source : **llm**. Champs remplacés : I1325.pourquoi_enfant, I1403.pourquoi_enfant, F1610.pourquoi_parent. Durée du conseiller : 24,7 s.

Appels : appel 1 (conseil) : echec_validation, 19,0 s, 26467 jetons en entrée (4864 en cache), 2088 en sortie, 0,033 $ ; règles en échec : T19×3 T11×4 T15 ; appel 2 (correction) : echec_validation, 5,4 s, 28782 jetons en entrée (4864 en cache), 636 en sortie, 0,032 $ ; règles en échec : T19×2 T11×4 T05 T13 T28.

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 3 nombre(s) et 0 diplôme(s) cités dans 11 textes. Liens parent + enfant par piste : 4+2, 4+2, 3+2.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Technicien-cuisiniste en cuisines professionnelles (I1325) | 2 | 2 | Equipements de production, équipements collectifs | 1 833 à 2 991 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien-cuisiniste / Technicienne-cuisiniste en cuisines professionnelles » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1325, encadré « Salaires des offres d'emploi », 2026) | bac | 2 950 projets, 81 % difficiles (Techniciens et agents de maîtrise en installation et maintenance en froid et conditionnement d'air ; 2026) |
| 2 | Technicien Datacenter (I1403) | 1 | 1 | Equipements domestiques et informatique | 1 900 à 4 336 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien / Technicienne Datacenter » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1403, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 7 667 projets, 48 % difficiles (Techniciens de production, d'exploitation, d'installation, et de maintenance, support et services aux utilisateurs en informatique ; 2026) |
| 3 | Installateur mainteneur en systèmes solaires, thermiques et photovoltaïques (F1610) | 10 | 7 | Second oeuvre | 1 802 à 2 500 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Installateur mainteneur / Installatrice mainteneuse en systèmes solaires, thermiques et photovoltaïques » (France Travail, France entière) ; France Travail, Métierscope, fiche métier F1610, encadré « Salaires des offres d'emploi », 2026) | bac | 8 896 projets, 79 % difficiles (Couvreurs ; 2026) |

- Formations, I1325 : 6 montrées sur 417 : BTS - Production - Electrotechnique - en apprentissage (Dole), apprentissage ; BTS - Production - Electrotechnique (Dijon) ; BTS - Production - Electrotechnique - en apprentissage (Montceau-les-Mines), apprentissage ; …
- Formations, I1403 : 6 montrées sur 376 : BTS - Services - Communication - en apprentissage (Dijon), apprentissage ; BTS - Services - Communication (Auxonne) ; DEUST - Infrastructures numériques (Villeneuve-d'Ascq) ; …
- Formations, F1610 : 6 montrées sur 417 : BTS - Production - Electrotechnique - en apprentissage (Dole), apprentissage ; BTS - Production - Electrotechnique (Dijon) ; BTS - Production - Electrotechnique - en apprentissage (Montceau-les-Mines), apprentissage ; …

Écartés :

- Agent de maintenance en bureautique (I1409) : Les formations qui y mènent durent au moins 3 ans, et vous avez répondu « 2 ans ».
- Opérateur consoliste en raffinerie (H2711) : Le salaire de départ y est proche du Smic : à partir de 1 800 € brut par mois en début de carrière, d'après la fiche du métier « Opérateur / Opératrice de raffinerie » (source : CIDJ, fiche métier « Opérateur / Opératrice de raffinerie », 2025).
- Technicien en risques technologiques (I1503) : Il faut au moins 3 ans d'études après le bac, et vous avez répondu « 2 ans ».
- Ingénieur du son (L1508) : Les formations qui y mènent durent au moins 3 ans, et vous avez répondu « 2 ans ».
- Eleveur de porcins (A1411) : Le salaire de départ y est proche du Smic : de 1 802 à 1 850 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier A1411, encadré « Salaires des offres d'emploi », 2026).

Les textes du mode mixte :

**1. Technicien-cuisiniste en cuisines professionnelles (I1325)**

**Le métier, simplement** (llm). Il conçoit et installe des cuisines professionnelles pour des restaurants ou des hôtels. Il mesure l'espace, pose les équipements, les raccorde et les met en service. Il répare aussi ces appareils quand ils tombent en panne.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut aider à dessiner des plans de cuisine. Mais poser les équipements sur place, les raccorder et former les cuisiniers, ça reste un travail manuel et en présence des clients.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'il peut passer des heures à tester des recettes de pâtisserie le dimanche : il conçoit et installe des cuisines adaptées aux besoins des professionnels de la restauration. Que sa plus grande fierté, c'est d'avoir cuisiné seul le repas des 60 ans de sa grand-mère pour vingt personnes : il assemble et met en service les équipements après les avoir installés. Qu'il essaie et recommence jusqu'à ce que ça marche : il assure la maintenance et la réparation des équipements de cuisine. Et qu'il a besoin de bouger : il travaille en déplacements chez les clients avec des charges lourdes.

**Pour l'enfant** (llm). Tu peux passer des heures à tester des recettes de pâtisserie : tu conçois et installes des cuisines pour les restaurants et les hôtels. Tu essaies et recommences jusqu'à ce que ça marche : tu répares les équipements quand ils tombent en panne.

**2. Technicien Datacenter (I1403)**

**Le métier, simplement** (llm). Il installe et entretient les serveurs et les systèmes informatiques dans des centres de données. Il monte les équipements, vérifie leur fonctionnement et intervient quand il y a un problème pour que tout reste en marche.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que sa plus grande fierté, c'est d'avoir fabriqué ou réparé quelque chose de ses mains : il monte, assemble et démonte les équipements informatiques. Qu'il est à l'aise à l'atelier : il réalise des interventions de maintenance corrective et préventive. Que dans un groupe, il en fait plus que sa part, pour que ce soit bien fait : il assure la gestion opérationnelle et la surveillance des systèmes. Et qu'il ne veut pas plus de 2 ans d'études : c'est accessible dès bac + 2.

**Pour l'enfant** (llm). Tu es à l'aise à l'atelier : tu fais de la maintenance préventive et corrective sur les machines. Dans un groupe, tu tiens à ce que ce soit bien fait : tu surveilles les systèmes pour que tout fonctionne sans arrêt.

**3. Installateur mainteneur en systèmes solaires, thermiques et photovoltaïques (F1610)**

**Le métier, simplement** (llm). Il installe des panneaux solaires et des systèmes thermiques sur les toits ou au sol. Il fixe les supports, raccorde les équipements et vérifie que tout produit bien de l'énergie. Il fait aussi l'entretien quand c'est nécessaire.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut calculer l'orientation optimale des panneaux. Mais les fixer en hauteur, les raccorder sur place et vérifier leur étanchéité, ça se fait avec les mains et sur le terrain.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'il essaie et recommence jusqu'à ce que ça marche : il effectue les tests et la maintenance corrective des installations. Qu'il a besoin de bouger : il travaille en extérieur en grande hauteur et sur chantier. Et qu'il est à l'aise à l'atelier : il choisit les outils et réalise le raccordement d'étanchéité.

**Pour l'enfant** (llm). Tu essaies et recommences jusqu'à ce que ça marche : tu fais les tests et l'entretien des systèmes. Tu es à l'aise à l'atelier : tu choisis les outils pour assembler les panneaux.

### 3.17. `maelys_std2a`

Maëlys, Première technologique STD2A, Clermont-Ferrand. Dessine, couture, crée. 3 ans d'études, pas de privé (budget), rester près. Refuse la vente et les chiffres.

- Situation : premiere_techno (std2a) ; genre : elle
- Contraintes : études trois_ans ; alternance pourquoi_pas ; privé non ; département 63, mobilité rester_pres ; refus vente, chiffres ; ce qui compte creer, stable
- Phrases libres : temps_libre_precis « Elle retouche et transforme des vêtements achetés en friperie, à la machine à coudre. » ; fierte_recit « La robe qu'elle a cousue pour le mariage de sa cousine. »
- Questions passées : metier_evoque

#### Calcul seul

Contrôles : aucune violation, 1 à vérifier, 0 note(s) ; 9 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,1 s.

  - à vérifier · mobilite · H1204 : aucune des 6 formations montrées dans le rayon « departement_et_voisins »

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Designer (H1204) | 1 | 1 | Conception, recherche, études et développement | 1 870 à 6 250 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Designer » (France Travail, France entière) ; France Travail, Métierscope, fiche métier H1204, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 3 755 projets, 20 % difficiles (Graphistes, dessinateurs, stylistes, décorateurs et créateurs de supports de communication visuelle ; 2026) |
| 2 | Technicienne d'installation d'équipements industriels (I1324) | 3 | 3 | Equipements de production, équipements collectifs | 1 802 à 2 750 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien / Technicienne d'installation d'équipements industriels » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1324, encadré « Salaires des offres d'emploi », 2026) | bac | 3 495 projets, 72 % difficiles (Techniciens et agents de maîtrise en maintenance générale et mécanique industrielle ; 2026) |
| 3 | Nez (H1505) | 4 | 4 | Qualité et analyses industrielles | 1 802 à 4 615 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Nez » (France Travail, France entière) ; France Travail, Métierscope, fiche métier H1505, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 5 708 projets, 44 % difficiles (Techniciens des industries de process ; 2026) |

- Formations, H1204 : 6 montrées sur 6 : BUT - Packaging, emballage et conditionnement (Le Bourget-du-Lac) ; BUT - Packaging, emballage et conditionnement (Dole) ; BUT - Packaging, emballage et conditionnement (Castres) ; …
- Formations, I1324 : 6 montrées sur 470 : BTS - Production - Contrôle industriel et régulation automatique (Clermont-Ferrand) ; BTS - Production - Electrotechnique (Clermont-Ferrand) ; BTS - Production - Electrotechnique - en apprentissage (Clermont-Ferrand), apprentissage ; …
- Formations, H1505 : 6 montrées sur 108 : BTS - Services - Métiers de l'esthétique-cosmétique-parfumerie (Clermont-Ferrand) ; BTS - Services - Métiers de l'esthétique-cosmétique-parfumerie - en apprentissage (Clermont-Ferrand), apprentissage ; BTS - Services - Métiers de l'esthétique-cosmétique-parfumerie (Vichy) ; …

Écartés :

- Technicienne en conception industrielle en mécanique (H1235) : Les entreprises y prévoient peu de recrutements : 903 projets pour la famille « Techniciens du dessin industriel » en 2026 (France Travail).
- Modéliste industrielle (H1205) : C'est un métier très proche de « Designer », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Dessinatrice en électricité-électronique (H1202) : Les entreprises y prévoient peu de recrutements : 903 projets pour la famille « Techniciens du dessin industriel » en 2026 (France Travail).
- Scénographe (L1513) : Le salaire de départ y est le Smic, soit 1 867 € brut par mois en début de carrière, d'après la fiche du métier « Décorateur-scénographe / Décoratrice scénographe » (source : CIDJ, fiche métier « Décorateur-scénographe / Décoratrice scénographe », 2025).
- Conductrice de machines d'impression (E1301) : Le salaire de départ y est proche du Smic : de 1 802 à 2 093 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier E1301, encadré « Salaires des offres d'emploi », 2026).

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Designer**. *Le métier, simplement* (gabarit) : Elle imagine et conçoit de nouveaux objets industrialisables pour une entreprise, en intégrant à ses créations des contraintes esthétiques, fonctionnelles, ergonomiques, commerciales, budgétaires, environnementales et de sécurité.
  *Pourquoi* : Vous avez dit qu'elle est à l'aise en technologie et en informatique : dans ce métier, elle aurait à élaborer le modèle numérique de conception détaillé. Et qu'elle ne veut pas plus de 3 ans d'études : c'est accessible dès bac + 2, jusqu'à bac + 5 selon les postes.
  *Pour l'enfant* : Tu es à l'aise en technologie et en informatique : ici, tu aurais à élaborer le modèle numérique de conception détaillé. Tu vises trois ans d'études au plus : tu peux y accéder dès bac + 2, jusqu'à bac + 5 selon les postes.
- **Technicienne d'installation d'équipements industriels**. *Le métier, simplement* (gabarit) : Elle est chargé de l'installation et de la mise en service des équipements et des machines utilisés dans divers secteurs industriels. Concrètement, elle installe et configure des équipements industriels selon les spécifications techniques, assure la maintenance préventive et corrective des machines et optimise les processus pour améliorer l'efficacité des équipements.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir fabriqué ou réparé quelque chose de ses mains : dans ce métier, elle aurait à réaliser les raccordements hydrauliques, électriques, mécaniques des équipements et des accessoires. Qu'elle est à l'aise en technologie et en informatique : elle serait aussi amenée à faire preuve d'appétence pour l'utilisation de logiciels numériques et de nouvelles technologies. Qu'elle avance mieux avec un cadre clair : le métier lui demanderait aussi de mettre le réseau en service et contrôler l'installation. Et qu'elle ne veut pas plus de 3 ans d'études : c'est accessible dès le bac.
  *Pour l'enfant* : Tu as déjà fabriqué ou réparé quelque chose de tes mains : ici, tu aurais à réaliser les raccordements hydrauliques, électriques, mécaniques des équipements et des accessoires. Tu es à l'aise en technologie et en informatique : tu serais aussi amenée à faire preuve d'appétence pour l'utilisation de logiciels numériques et de nouvelles technologies. Tu avances bien avec un cadre clair : le métier te demanderait aussi de mettre le réseau en service et contrôler l'installation.
- **Nez**. *Le métier, simplement* (gabarit) : Elle compose des arômes, des fragrances destinés à des produits alimentaires, cosmétiques (gels douche, lait pour le corps, etc.) ou de parfumerie et en effectue l'analyse chimique et sensorielle (gustative et olfactive). Concrètement, elle intervient selon les normes de fabrication et les attentes des consommateurs et peut former aux techniques de dégustation et d'olfaction.
  *Pourquoi* : Vous avez dit qu'on lui demande de dessiner, de faire une affiche ou une vidéo : dans ce métier, elle aurait à composer des accords harmonieux entre différentes notes aromatiques.
  *Pour l'enfant* : On te demande de dessiner, de faire une affiche ou une vidéo : ici, tu aurais à composer des accords harmonieux entre différentes notes aromatiques. Tu vises trois ans d'études au plus : tu peux y accéder dès bac + 2.

</details>

#### Mixte

Source : **partiel**. Champs remplacés : H1205.pourquoi_parent, H1205.pourquoi_enfant, I1324.piste. Durée du conseiller : 28,1 s.

Appels : appel 1 (conseil) : echec_validation, 21,6 s, 25533 jetons en entrée (4864 en cache), 2221 en sortie, 0,032 $ ; règles en échec : V05 T30×6 T14×2 T19×2 T11×4 T09 ; appel 2 (correction) : echec_validation, 6,0 s, 28399 jetons en entrée (4864 en cache), 722 en sortie, 0,032 $ ; règles en échec : V04 T30×5 T14×2 T19 T11×4 T28×8.

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 3 nombre(s) et 0 diplôme(s) cités dans 11 textes. Liens parent + enfant par piste : 4+2, 3+3, 4+3.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Modéliste industrielle (H1205) · souvent proposé | 2 | 2 | Conception, recherche, études et développement | 1 802 à 3 500 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Modéliste industriel / Modéliste industrielle » (France Travail, France entière) ; France Travail, Métierscope, fiche métier H1205, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 2 218 projets, 56 % difficiles (Ouvriers, techniciens et agents de maîtrise de l'habillement ; 2026) |
| 2 | Technicienne des industries graphiques (E1308) | 39 | 13 | Industries graphiques | 1 802 à 2 583 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien / Technicienne des industries graphiques » (France Travail, France entière) ; France Travail, Métierscope, fiche métier E1308, encadré « Salaires des offres d'emploi », 2026) | CAP ou équivalent (avant le bac) | 1 329 projets, 57 % difficiles (Ouvriers, techniciens et agents de maîtrise de l'imprimerie ; 2026) |
| 3 | Technicienne d'installation d'équipements industriels (I1324) | 3 | 3 | Equipements de production, équipements collectifs | 1 802 à 2 750 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien / Technicienne d'installation d'équipements industriels » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1324, encadré « Salaires des offres d'emploi », 2026) | bac | 3 495 projets, 72 % difficiles (Techniciens et agents de maîtrise en maintenance générale et mécanique industrielle ; 2026) |

- Formations, H1205 : 6 montrées sur 7 : BTS - Production - Métiers de la mode-chaussure et maroquinerie (Saint-Éloy-les-Mines) ; BTS - Production - Métiers de la mode-chaussure et maroquinerie (Issoudun) ; BTS - Production - Métiers de la mode-chaussure et maroquinerie (Romans-sur-Isère) ; …
- Formations, E1308 : 6 montrées sur 18 : BTS - Services - Etudes de réalisation d'un projet de communication - 1ère année commune (Clermont-Ferrand) ; BTS - Services - Edition (Paris) ; BTS - Services - Etudes de réalisation d'un projet de communication - 1ère année commune (Limoges) ; …
- Formations, I1324 : 6 montrées sur 470 : BTS - Production - Contrôle industriel et régulation automatique (Clermont-Ferrand) ; BTS - Production - Electrotechnique (Clermont-Ferrand) ; BTS - Production - Electrotechnique - en apprentissage (Clermont-Ferrand), apprentissage ; …

Écartés :

- Technicienne en conception industrielle en mécanique (H1235) : C'est un métier très proche de « Modéliste industrielle », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Conductrice de machines d'impression (E1301) : Le salaire de départ y est proche du Smic : de 1 802 à 2 093 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier E1301, encadré « Salaires des offres d'emploi », 2026).
- Cheffe de cuisine (G1601) : On y dirige une équipe (anticiper les périodes de travail plus soutenues en recrutant des saisonniers et des intérimaires). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.

Les textes du mode mixte :

**1. Modéliste industrielle (H1205)**

**Le métier, simplement** (llm). Elle transforme un dessin ou une idée en prototype de vêtement concret. Elle crée ou modifie des patrons, assemble les pièces, ajuste les formes et vérifie que tout tombe bien sur le corps. Elle travaille en atelier avec les équipes de design et de production.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut générer des idées de patrons ou simuler des tombés de tissu. Mais choisir les bons matériaux, ajuster sur une personne réelle et retoucher à la main jusqu'au bon rendu, ça reste manuel.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle peut passer des heures à retoucher et transformer des vêtements achetés en friperie à la machine à coudre : elle transforme un croquis en prototype concret de vêtement prêt à être industrialisé. Que sa plus grande fierté, c'est la robe qu'elle a cousue pour le mariage de sa cousine : elle réalise la mise au point technique et qualitative d'articles par modification de patrons. Qu'elle passe du temps à soigner son style : elle porte une appréciation esthétique ou artistique sur les prototypes. Et qu'elle ne veut pas plus de 3 ans d'études : c'est accessible dès bac + 2.

**Pour l'enfant** (llm). Tu peux passer des heures à retoucher et transformer des vêtements : tu transformes un croquis en prototype concret de vêtement. Créer compte pour toi : tu portes une appréciation esthétique sur chaque prototype.

**2. Technicienne des industries graphiques (E1308)**

**Le métier, simplement** (llm). Elle prépare des fichiers pour l'impression, règle les machines et lance la production d'affiches, de livres ou d'emballages. Elle fait des tests, ajuste les couleurs et les coupes, puis contrôle que le résultat final est net. Elle travaille en atelier avec les équipes de conception.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut préparer des fichiers ou optimiser des mises en page. Mais régler la machine en vrai, lancer une épreuve, ajuster les couleurs à l'œil et contrôler le rendu final, ça se fait sur place.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle crée sur ordinateur montage vidéo musique dessin : elle conçoit et prépare les fichiers pour l'impression selon les spécifications. Qu'elle essaie et recommence jusqu'à ce que ça marche : elle réalise des tests et des ajustements sur les machines d'impression. Et qu'elle est à l'aise en arts : elle contrôle la qualité des produits imprimés pour qu'ils soient conformes.

**Pour l'enfant** (llm). Tu fais du montage, de la musique ou du dessin sur ordinateur : tu prépares les fichiers pour l'impression selon les spécifications. Tu essaies et recommences jusqu'à ce que ça marche : tu réalises des tests et des ajustements sur les machines. Tu avances bien avec un cadre clair : tu contrôles la qualité pour respecter les normes précises.

**3. Technicienne d'installation d'équipements industriels (I1324)**

**Le métier, simplement** (gabarit). Elle est chargé de l'installation et de la mise en service des équipements et des machines utilisés dans divers secteurs industriels. Concrètement, elle installe et configure des équipements industriels selon les spécifications techniques, assure la maintenance préventive et corrective des machines et optimise les processus pour améliorer l'efficacité des équipements.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (gabarit). Vous avez dit que sa plus grande fierté, c'est d'avoir fabriqué ou réparé quelque chose de ses mains : dans ce métier, elle aurait à réaliser les raccordements hydrauliques, électriques, mécaniques des équipements et des accessoires. Qu'elle est à l'aise en technologie et en informatique : elle serait aussi amenée à faire preuve d'appétence pour l'utilisation de logiciels numériques et de nouvelles technologies. Qu'elle avance mieux avec un cadre clair : le métier lui demanderait aussi de mettre le réseau en service et contrôler l'installation. Et qu'elle ne veut pas plus de 3 ans d'études : c'est accessible dès le bac.

**Pour l'enfant** (gabarit). Tu as déjà fabriqué ou réparé quelque chose de tes mains : ici, tu aurais à réaliser les raccordements hydrauliques, électriques, mécaniques des équipements et des accessoires. Tu es à l'aise en technologie et en informatique : tu serais aussi amenée à faire preuve d'appétence pour l'utilisation de logiciels numériques et de nouvelles technologies. Tu avances bien avec un cadre clair : le métier te demanderait aussi de mettre le réseau en service et contrôler l'installation.

### 3.18. `rayan_seconde_reunion`

Rayan, Seconde, La Réunion. Démonte et répare, dépanne les écrans de la famille, scolarité difficile. 2 ans d'études, alternance idéale, rester sur l'île. Ne refuse rien. Son prénom est dans une phrase libre.

- Situation : seconde ; genre : il
- Contraintes : études deux_ans ; alternance ideal ; privé ne_sait_pas ; département 974, mobilité rester_pres ; refus rien ; ce qui compte stable, gagner
- Phrases libres : temps_libre_precis « Rayan regarde des tutos de réparation de téléphones et répare ceux de ses cousins. » ; aide_exemple « Quand la box ne marche plus, c'est Rayan qu'on appelle, pas le technicien. »
- Questions passées : metier_evoque

#### Calcul seul

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 10 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,1 s.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Technicien d'installation d'équipements industriels (I1324) | 1 | 1 | Equipements de production, équipements collectifs | 1 802 à 2 750 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien / Technicienne d'installation d'équipements industriels » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1324, encadré « Salaires des offres d'emploi », 2026) | bac | 3 495 projets, 72 % difficiles (Techniciens et agents de maîtrise en maintenance générale et mécanique industrielle ; 2026) |
| 2 | Technicien Datacenter (I1403) | 4 | 3 | Equipements domestiques et informatique | 1 900 à 4 336 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien / Technicienne Datacenter » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1403, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 7 667 projets, 48 % difficiles (Techniciens de production, d'exploitation, d'installation, et de maintenance, support et services aux utilisateurs en informatique ; 2026) |
| 3 | Vérificateur de conformité industrielle (H1305) | 10 | 4 | Hygiène Sécurité Environnement -HSE- industriels | 1 802 à 3 454 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Vérificateur / Vérificatrice de conformité industrielle » (France Travail, France entière) ; France Travail, Métierscope, fiche métier H1305, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 2 284 projets, 72 % difficiles (Techniciens du contrôle qualité ; 2026) |

- Formations, I1324 : 6 montrées sur 457 : BTS - Production - Electrotechnique - en apprentissage (Saint-Denis), apprentissage ; BTS - Production - Contrôle industriel et régulation automatique (Saint-Benoît) ; BTS - Production - Electrotechnique (Saint-Denis) ; …
- Formations, I1403 : 6 montrées sur 378 : BTS - Services - Communication - en apprentissage (Saint-Paul), apprentissage ; BTS - Services - Communication (Saint-Denis) ; DEUST - Infrastructures numériques (Villeneuve-d'Ascq) ; …
- Formations, H1305 : 6 montrées sur 70 : BTS - Production - Contrôle industriel et régulation automatique (Saint-Benoît) ; BTS - Production - Contrôle industriel et régulation automatique - en apprentissage (Vitrolles), apprentissage ; BTS - Production - Contrôle industriel et régulation automatique - en apprentissage (Bagnols-sur-Cèze), apprentissage ; …

Écartés :

- Dessinateur en électricité-électronique (H1202) : Les formations qui y mènent durent au moins 3 ans, et vous avez répondu « 2 ans ».
- Technicien de maintenance industrielle (I1304) : Le salaire de départ y est le Smic, soit 1 867 € brut par mois en début de carrière (source : CIDJ, fiche métier « Technicien / Technicienne de maintenance industrielle », 2025).
- Ingénieur calcul et structure (F1112) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 2 ans ».
- Technicien d'installation de centrales téléphoniques (I1330) : C'est un métier très proche de « Technicien d'installation d'équipements industriels », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Expert métrologue (H1516) : Il faut au moins 3 ans d'études après le bac, et vous avez répondu « 2 ans ».

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Technicien d'installation d'équipements industriels**. *Le métier, simplement* (gabarit) : Il est chargé de l'installation et de la mise en service des équipements et des machines utilisés dans divers secteurs industriels. Concrètement, il installe et configure des équipements industriels selon les spécifications techniques, assure la maintenance préventive et corrective des machines et optimise les processus pour améliorer l'efficacité des équipements.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir fabriqué ou réparé quelque chose de ses mains : dans ce métier, il aurait à réaliser les raccordements hydrauliques, électriques, mécaniques des équipements et des accessoires. Que c'est lui qu'on appelle quand un appareil ne marche pas : il serait aussi amené à faire preuve d'appétence pour l'utilisation de logiciels numériques et de nouvelles technologies. Que dans un groupe, il fait sa part, sérieusement : le métier lui demanderait aussi de mettre le réseau en service et contrôler l'installation. Et qu'il ne veut pas plus de 2 ans d'études : c'est accessible dès le bac.
  *Pour l'enfant* : Tu as déjà fabriqué ou réparé quelque chose de tes mains : ici, tu aurais à réaliser les raccordements hydrauliques, électriques, mécaniques des équipements et des accessoires. C'est toi qu'on appelle quand un appareil fait des siennes : tu serais aussi amené à faire preuve d'appétence pour l'utilisation de logiciels numériques et de nouvelles technologies. Dans un groupe, tu fais ta part, sérieusement : le métier te demanderait aussi de mettre le réseau en service et contrôler l'installation.
- **Technicien Datacenter**. *Le métier, simplement* (gabarit) : Il assure le bon fonctionnement des équipements informatiques et des infrastructures physiques d'un centre de données. Concrètement, il réalise des prestations de service et de support de premier niveau et fait l'interface avec le client et assure la gestion opérationnelle des bâtiments, la surveillance des systèmes et la gestion des incidents pour garantir la continuité de service.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir fabriqué ou réparé quelque chose de ses mains : dans ce métier, il aurait à monter, assembler, démonter les équipements informatiques. Que c'est lui qu'on appelle quand un appareil ne marche pas : il serait aussi amené à installer les équipements actifs mêlant courant faible et courant fort. Et qu'il ne veut pas plus de 2 ans d'études : c'est accessible dès bac + 2, jusqu'à bac + 3 selon les postes.
  *Pour l'enfant* : Tu as déjà fabriqué ou réparé quelque chose de tes mains : ici, tu aurais à monter, assembler, démonter les équipements informatiques. C'est toi qu'on appelle quand un appareil fait des siennes : tu serais aussi amené à installer les équipements actifs mêlant courant faible et courant fort. Tu vises deux ans d'études au plus : tu peux y accéder dès bac + 2, jusqu'à bac + 3 selon les postes.
- **Vérificateur de conformité industrielle**. *Le métier, simplement* (gabarit) : Il s'assure que les produits et processus respectent les normes et réglementations en vigueur. Concrètement, il inspecte et vérifie la conformité des installations et équipements industriels selon les normes en vigueur et réalise des audits de sécurité pour s'assurer que les installations respectent les réglementations locales et internationales.
  *Pourquoi* : Vous avez dit qu'il passe du temps à chercher comment marchent les choses : dans ce métier, il aurait à analyser et prévenir les risques.
  *Pour l'enfant* : Tu as déjà fabriqué ou réparé quelque chose de tes mains : ici, tu aurais à contrôler la conformité d'un équipement, d'une machine, d'une installation. Tu aimes comprendre comment marchent les choses : tu serais aussi amené à analyser et prévenir les risques. Tu vises deux ans d'études au plus : tu peux y accéder dès bac + 2, jusqu'à bac + 5 selon les postes.

</details>

#### Mixte

Source : **partiel**. Champs remplacés : I1330.pourquoi_parent, H1305.piste. Durée du conseiller : 26,8 s.

Appels : appel 1 (conseil) : echec_validation, 20,3 s, 26524 jetons en entrée (128 en cache), 2145 en sortie, 0,038 $ ; règles en échec : V05 V06 T30×5 T14×3 T19×2 T11×4 T28 ; appel 2 (correction) : echec_validation, 6,2 s, 29319 jetons en entrée (128 en cache), 674 en sortie, 0,038 $ ; règles en échec : V04 V06 T11×4 T30×3 T14×2 T19 T28×6.

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 8 nombre(s) et 0 diplôme(s) cités dans 10 textes. Liens parent + enfant par piste : 4+3, 3+3, 3+3.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Technicien Datacenter (I1403) | 4 | 3 | Equipements domestiques et informatique | 1 900 à 4 336 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien / Technicienne Datacenter » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1403, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 7 667 projets, 48 % difficiles (Techniciens de production, d'exploitation, d'installation, et de maintenance, support et services aux utilisateurs en informatique ; 2026) |
| 2 | Technicien d'installation de centrales téléphoniques (I1330) | 2 | 2 | Equipements de production, équipements collectifs | 1 802 à 2 750 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien / Technicienne d'installation de centrales téléphoniques » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1330, encadré « Salaires des offres d'emploi », 2026) | bac | 2 668 projets, 48 % difficiles (Techniciens et agents de maîtrise en assistance et support technique client et en installation et maintenance télécoms et courants faibles ; 2026) |
| 3 | Vérificateur de conformité industrielle (H1305) | 10 | 4 | Hygiène Sécurité Environnement -HSE- industriels | 1 802 à 3 454 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Vérificateur / Vérificatrice de conformité industrielle » (France Travail, France entière) ; France Travail, Métierscope, fiche métier H1305, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 2 284 projets, 72 % difficiles (Techniciens du contrôle qualité ; 2026) |

- Formations, I1403 : 6 montrées sur 378 : BTS - Services - Communication - en apprentissage (Saint-Paul), apprentissage ; BTS - Services - Communication (Saint-Denis) ; DEUST - Infrastructures numériques (Villeneuve-d'Ascq) ; …
- Formations, I1330 : 6 montrées sur 417 : BTS - Production - Electrotechnique - en apprentissage (Saint-Denis), apprentissage ; BTS - Production - Electrotechnique (Saint-Denis) ; BTS - Production - Electrotechnique - en apprentissage (Saint-Benoît), apprentissage ; …
- Formations, H1305 : 6 montrées sur 70 : BTS - Production - Contrôle industriel et régulation automatique (Saint-Benoît) ; BTS - Production - Contrôle industriel et régulation automatique - en apprentissage (Vitrolles), apprentissage ; BTS - Production - Contrôle industriel et régulation automatique - en apprentissage (Bagnols-sur-Cèze), apprentissage ; …

Écartés :

- Dessinateur en électricité-électronique (H1202) : Les formations qui y mènent durent au moins 3 ans, et vous avez répondu « 2 ans ».
- Technicien de maintenance industrielle (I1304) : Le salaire de départ y est le Smic, soit 1 867 € brut par mois en début de carrière (source : CIDJ, fiche métier « Technicien / Technicienne de maintenance industrielle », 2025).
- Ingénieur calcul et structure (F1112) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 2 ans ».
- Expert métrologue (H1516) : Il faut au moins 3 ans d'études après le bac, et vous avez répondu « 2 ans ».
- Foreur (F1401) : Le salaire de départ y est le Smic, soit 1 867 € brut par mois en début de carrière (source : CIDJ, fiche métier « Foreur », 2026).

Les textes du mode mixte :

**1. Technicien Datacenter (I1403)**

**Le métier, simplement** (llm). Il monte, assemble et maintient les serveurs et équipements dans un centre de données. Il installe les baies, fait les câblages électriques et réseaux, puis surveille et répare pour que tout tourne sans arrêt.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que sa plus grande fierté, c'est d'avoir fabriqué ou réparé quelque chose de ses mains : il monte, assemble et démonte les équipements informatiques. Que c'est lui qu'on appelle quand un appareil ne marche pas : il réalise des interventions de maintenance corrective sur les équipements. Qu'il est à l'aise en technologie et en informatique : il installe les équipements mêlant courant faible et courant fort. Et qu'il ne veut pas plus de 2 ans d'études : c'est accessible en alternance dès bac + 2.

**Pour l'enfant** (llm). Tu aimes bricoler, construire, réparer : tu monterais, assemblerais et démonterais les serveurs et baies. C'est toi qu'on appelle quand un appareil fait des siennes : tu ferais les interventions de maintenance pour que tout fonctionne. Tu essaies et recommences jusqu'à ce que ça marche : tu assurerais la maintenance corrective après avoir trouvé la panne.

**2. Technicien d'installation de centrales téléphoniques (I1330)**

**Le métier, simplement** (llm). Il installe et configure des centrales téléphoniques et des équipements de communication. Il monte les câbles, règle les systèmes, fait les tests de fonctionnement et répare en urgence si une panne arrive.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut aider à configurer certains paramètres. Mais hisser et fixer les câbles sur site, tester en conditions réelles et intervenir en urgence, ça se fait par une personne sur place.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'il passe du temps à chercher comment marchent les choses : il analyse les spécifications techniques pour l'installation. Qu'on lui a demandé de l'aide pour la box qui ne marche plus : il intervient en urgence pour réparer des pannes critiques. Et qu'il garde son calme quand les autres paniquent : il assure la maintenance corrective des équipements.

**Pour l'enfant** (llm). Tu aimes comprendre comment marchent les choses : tu analyserais les spécifications pour installer les systèmes. On t'appelle pour réparer ou monter quelque chose : tu réaliserais le montage, l'assemblage et les réglages. Tu gardes ton calme quand ça s'agite autour de toi : tu interviendrais pour réparer les pannes critiques.

**3. Vérificateur de conformité industrielle (H1305)**

**Le métier, simplement** (gabarit). Il s'assure que les produits et processus respectent les normes et réglementations en vigueur. Concrètement, il inspecte et vérifie la conformité des installations et équipements industriels selon les normes en vigueur et réalise des audits de sécurité pour s'assurer que les installations respectent les réglementations locales et internationales.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (gabarit). Vous avez dit que sa plus grande fierté, c'est d'avoir fabriqué ou réparé quelque chose de ses mains : dans ce métier, il aurait à contrôler la conformité d'un équipement, d'une machine, d'une installation. Qu'il passe du temps à chercher comment marchent les choses : il serait aussi amené à analyser et prévenir les risques. Et qu'il ne veut pas plus de 2 ans d'études : c'est accessible dès bac + 2, jusqu'à bac + 5 selon les postes.

**Pour l'enfant** (gabarit). Tu as déjà fabriqué ou réparé quelque chose de tes mains : ici, tu aurais à contrôler la conformité d'un équipement, d'une machine, d'une installation. Tu aimes comprendre comment marchent les choses : tu serais aussi amené à analyser et prévenir les risques. Tu vises deux ans d'études au plus : tu peux y accéder dès bac + 2, jusqu'à bac + 5 selon les postes.

### 3.19. `zoe_reorientation_bts`

Zoé, bac technologique, en 2ᵉ année de BTS (commerce) à Rouen : ce domaine ne lui plaît pas. Écoute, explique, a fait réviser son petit frère. 3 ans d'études. Refuse la vente.

- Situation : deja_bac (deuxieme_annee, bts, bac technologique ; ce qui n'a pas marché : domaine) ; genre : elle
- Contraintes : études trois_ans ; alternance pourquoi_pas ; privé non ; département 76, mobilité region ; refus vente ; ce qui compte utile, stable
- Phrases libres : aide_exemple « Ses amies l'appellent le soir quand ça ne va pas, elle passe des heures au téléphone. » ; fierte_recit « Quand son petit frère a enfin eu la moyenne en maths, après tout un trimestre où elle l'a fait réviser. »
- Questions passées : metier_evoque

#### Calcul seul

Contrôles : aucune violation, 3 à vérifier, 0 note(s) ; 5 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,1 s.

  - à vérifier · mobilite · J1307 : aucune des 6 formations montrées dans le rayon « region »
  - à vérifier · mobilite · J1506 : aucune des 1 formations montrées dans le rayon « region »
  - à vérifier · donnees · J1506 : 1 formation(s) montrée(s), 3 à 6 attendues (SPEC §6)

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Chargée de mission RH diversité handicap (M1510) | 1 | 1 | Ressources humaines | 1 896 à 7 448 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Chargé / Chargée de mission RH diversité handicap » (France Travail, France entière) ; France Travail, Métierscope, fiche métier M1510, encadré « Salaires des offres d'emploi », 2026) | bac + 3 | 24 818 projets, 23 % difficiles (Agents administratifs ; 2026) |
| 2 | Préparatrice en pharmacie (J1307) · connu · souvent proposé | 2 | 2 | Professionnels médico-techniques | 1 802 à 2 427 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Préparateur / Préparatrice en pharmacie » (France Travail, France entière) ; France Travail, Métierscope, fiche métier J1307, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 7 237 projets, 58 % difficiles (Techniciens médicaux et préparateurs ; 2026) |
| 3 | Infirmière en soins généraux (IDE) (J1506) · connu | 3 | 3 | Soins paramédicaux | 2 083 à 3 000 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Infirmier / Infirmière en soins généraux (IDE) » (France Travail, France entière) ; France Travail, Métierscope, fiche métier J1506, encadré « Salaires des offres d'emploi », 2026) | bac + 3 | 36 491 projets, 60 % difficiles (Infirmiers et sages-femmes ; 2026) |

- Formations, M1510 : 6 montrées sur 165 : BUT - Gestion des entreprises et des administrations (Le Havre) ; Licence - Psychologie (Mont-Saint-Aignan) ; BUT - Gestion des entreprises et des administrations - en apprentissage (Mantes-la-Jolie), apprentissage ; …
- Formations, J1307 : 6 montrées sur 17 : DEUST - Préparateur/Technicien en pharmacie - en apprentissage (Douai), apprentissage ; DEUST - Préparateur/Technicien en pharmacie - en apprentissage (La Roche-sur-Yon), apprentissage ; DEUST - Préparateur/Technicien en pharmacie - en apprentissage (Lorient), apprentissage ; …
- Formations, J1506 : 1 montrées sur 1 : D.E infirmier - en apprentissage (Lyon), apprentissage

Écartés :

- Médecin du travail et de prévention (J1101) : Il faut au moins 9 ans d'études après le bac, et vous avez répondu « 3 ans ».
- Conseillère en gestion de carrière (M1508) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 3 ans ».
- Responsable de structure multi accueil petite enfance (K1216) : On y dirige une équipe (animer, coordonner une équipe). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.
- Directrice de centre de séjour de vacances (G1241) : La fiche officielle du métier le dit : « Une première expérience est souvent demandée » (France Travail).
- Chargée d'emploi en entreprise de travail temporaire (K1814) : Il faut vendre, et vous avez dit qu'elle ne le voulait pas.

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Chargée de mission RH diversité handicap**. *Le métier, simplement* (gabarit) : Elle participe à la prévention de la discrimination et valorise et promeut l'inclusion au sein de l'entreprise. Concrètement, elle développe et met en œuvre des politiques de diversité et d'inclusion, assure le suivi des indicateurs de diversité et propose des améliorations et organise des formations et sensibilisation sur le handicap et la diversité.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir aidé quelqu'un : dans ce métier, elle aurait à intégrer un collaborateur en situation de handicap. Que ses proches lui demandent de leur expliquer les choses : elle serait aussi amenée à concevoir et mettre en oeuvre des actions de sensibilisation. Qu'elle prévoit tout à l'avance : le métier lui demanderait aussi d'organiser des campagnes de sensibilisation. Et qu'elle ne veut pas plus de 3 ans d'études : c'est accessible dès bac + 3, jusqu'à bac + 5 selon les postes.
  *Pour l'enfant* : Tu as déjà été là pour quelqu'un qui en avait besoin : ici, tu aurais à intégrer un collaborateur en situation de handicap. On vient te demander d'expliquer les choses : tu serais aussi amenée à concevoir et mettre en oeuvre des actions de sensibilisation. Tu prévois les choses à l'avance : le métier te demanderait aussi d'organiser des campagnes de sensibilisation.
- **Préparatrice en pharmacie**. *Le métier, simplement* (gabarit) : Elle en collaboration étroite avec le pharmacien, assure la préparation, la gestion et la délivrance des médicaments aux patients. Concrètement, elle prépare et délivre les médicaments sous la supervision d'un pharmacien, conseille et informe les clients sur l'utilisation des produits pharmaceutiques et la compatibilité avec d'autres et gère les stocks de médicaments et passe les commandes nécessaires.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir aidé quelqu'un : dans ce métier, elle aurait à identifier la demande du service de soins ou du patient. Qu'elle prévoit tout à l'avance : elle serait aussi amenée à réaliser le suivi de délivrance des médicaments dans l'ordonnancier. Que ses proches lui demandent de leur expliquer les choses : le métier lui demanderait aussi de communiquer avec les patients et leurs familles. Et qu'elle ne veut pas plus de 3 ans d'études : c'est accessible dès bac + 2.
  *Pour l'enfant* : Tu as déjà été là pour quelqu'un qui en avait besoin : ici, tu aurais à identifier la demande du service de soins ou du patient. Tu prévois les choses à l'avance : tu serais aussi amenée à réaliser le suivi de délivrance des médicaments dans l'ordonnancier. On vient te demander d'expliquer les choses : le métier te demanderait aussi de communiquer avec les patients et leurs familles.
- **Infirmière en soins généraux (IDE)**. *Le métier, simplement* (gabarit) : Elle dispense des soins de nature préventive, curative, ou palliative visant à promouvoir, maintenir, améliorer ou rétablir la santé du patient. Concrètement, elle evalue une situation clinique et établit un diagnostic dans le domaine infirmier, coordonne et organise les activités en collaboration avec l'équipe soignante et réalise les soins prescrits et surveille ses effets.
  *Pourquoi* : Vous avez dit qu'elle est plus à l'aise avec deux ou trois amis qu'en grand groupe : dans ce métier, elle aurait à rechercher, traiter et transmettre les informations pour assurer la continuité des soins et des activités.
  *Pour l'enfant* : Tu as déjà été là pour quelqu'un qui en avait besoin : ici, tu aurais à appliquer un protocole de soin. Tu es à l'aise en petit groupe : tu serais aussi amenée à rechercher, traiter et transmettre les informations pour assurer la continuité des soins et des activités. On vient te demander d'expliquer les choses : le métier te demanderait aussi de réaliser un diagnostic infirmier.

</details>

#### Mixte

Source : **llm**. Champs remplacés : K1102.ia_phrase, J1307.metier_simplement, J1307.ia_phrase, K1210.pourquoi_parent, K1210.ia_phrase. Durée du conseiller : 20,1 s.

Appels : appel 1 (conseil) : echec_validation, 19,8 s, 26432 jetons en entrée (4864 en cache), 2217 en sortie, 0,033 $ ; règles en échec : T11×7 T31 T30 T14.

Contrôles : aucune violation, 1 à vérifier, 0 note(s) ; 2 nombre(s) et 0 diplôme(s) cités dans 9 textes. Liens parent + enfant par piste : 4+3, 3+3, 3+3.

  - à vérifier · mobilite · J1307 : aucune des 6 formations montrées dans le rayon « region »

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Mandataire judiciaire à la protection des majeurs (MJPM) (K1102) | 4 | 4 | Accompagnement de la personne | 1 863 à 2 314 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Mandataire judiciaire à la protection des majeurs (MJPM) » (France Travail, France entière) ; France Travail, Métierscope, fiche métier K1102, encadré « Salaires des offres d'emploi », 2026) | bac + 3 | 10 060 projets, 45 % difficiles (Professionnels de l'action sociale ; 2026) |
| 2 | Préparatrice en pharmacie (J1307) · connu · souvent proposé | 2 | 2 | Professionnels médico-techniques | 1 802 à 2 427 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Préparateur / Préparatrice en pharmacie » (France Travail, France entière) ; France Travail, Métierscope, fiche métier J1307, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 7 237 projets, 58 % difficiles (Techniciens médicaux et préparateurs ; 2026) |
| 3 | Educatrice de la protection judiciaire de la jeunesse (K1210) | 5 | 5 | Action sociale, socio-éducative et socio-culturelle | 2 262 € net par mois (salaire net mensuel de début de carrière du métier « Educatrice / Educateur de la Protection judiciaire de la jeunesse » ; CIDJ, fiche métier « Educatrice / Educateur de la Protection judiciaire de la jeunesse », 2026) | bac + 3 | 23 920 projets, 51 % difficiles (Educateurs spécialisés et autres intervenants socio-éducatifs ; 2026) |

- Formations, K1102 : 6 montrées sur 14 : BUT - Carrières juridiques (Rouen) ; BUT - Carrières juridiques (Villetaneuse) ; BUT - Carrières juridiques (Cuffies) ; …
- Formations, J1307 : 6 montrées sur 17 : DEUST - Préparateur/Technicien en pharmacie - en apprentissage (Douai), apprentissage ; DEUST - Préparateur/Technicien en pharmacie - en apprentissage (La Roche-sur-Yon), apprentissage ; DEUST - Préparateur/Technicien en pharmacie - en apprentissage (Lorient), apprentissage ; …
- Formations, K1210 : 6 montrées sur 193 : Licence - Sciences et Techniques des Activités Physiques et Sportives (Mont-Saint-Aignan) ; BUT - Carrières sociales Parcours éducation spécialisée (Évreux) ; D.E Educateur Spécialisé - en apprentissage (Alençon), apprentissage ; …

Écartés :

- Médecin du travail et de prévention (J1101) : Il faut au moins 9 ans d'études après le bac, et vous avez répondu « 3 ans ».
- Conseillère en gestion de carrière (M1508) : Il faut au moins 5 ans d'études après le bac, et vous avez répondu « 3 ans ».
- Responsable de structure multi accueil petite enfance (K1216) : On y dirige une équipe (animer, coordonner une équipe). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.
- Directrice de centre de séjour de vacances (G1241) : La fiche officielle du métier le dit : « Une première expérience est souvent demandée » (France Travail).
- Chargée d'emploi en entreprise de travail temporaire (K1814) : Il faut vendre, et vous avez dit qu'elle ne le voulait pas.

Les textes du mode mixte :

**1. Mandataire judiciaire à la protection des majeurs (MJPM) (K1102)**

**Le métier, simplement** (llm). Elle représente et défend les intérêts de personnes majeures vulnérables. Elle gère leurs biens, les conseille sur leurs droits et démarches, collabore avec les familles et les services sociaux pour veiller à leur bien-être. Elle se déplace souvent à leur domicile.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle s'occupe tout naturellement des plus jeunes, des plus âgés, de ceux qui ne vont pas bien : elle protège les majeurs vulnérables et veille à leur bien-être matériel et financier. Qu'elle garde son calme quand les autres paniquent : elle intervient dans des situations de protection et gère les pics d'activité avec un rythme irrégulier. Qu'elle prévoit tout à l'avance : elle évalue les menaces et planifie les mesures de protection nécessaires. Et qu'elle ne veut pas plus de 3 ans d'études : c'est accessible dès bac + 3.

**Pour l'enfant** (llm). Tu t'occupes naturellement des plus jeunes et de ceux qui en ont besoin : tu protégerais des personnes vulnérables et veillerais à leur bien-être au quotidien. Tu gardes ton calme quand ça s'agite autour de toi : tu interviendrais dans des situations délicates pour défendre leurs intérêts. Tu prévois les choses à l'avance : tu évaluerais les besoins et planifierais les mesures de protection.

**2. Préparatrice en pharmacie (J1307)**

**Le métier, simplement** (llm). Elle prépare et délivre les médicaments avec le pharmacien. Elle conseille les clients sur leur utilisation, gère les stocks, suit les dossiers patients et veille à l'hygiène et à la sécurité.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que ses amies l'appellent le soir quand ça ne va pas, elle passe des heures au téléphone : elle identifie la demande du patient et le conseille sur les produits. Qu'elle prévoit tout à l'avance : elle gère les stocks, passe les commandes et suit les dossiers patients. Et que ses proches lui demandent de leur expliquer les choses : elle informe les clients sur l'utilisation des médicaments et leur compatibilité.

**Pour l'enfant** (llm). On vient te voir quand on a besoin de parler : tu identifierais la demande des patients et tu les conseillerais. Tu prévois les choses à l'avance : tu gérerais les stocks et tu suivrais les dossiers avec précision. On vient te demander d'expliquer les choses : tu expliquerais aux clients comment utiliser les médicaments.

**3. Educatrice de la protection judiciaire de la jeunesse (K1210)**

**Le métier, simplement** (llm). Elle accompagne des jeunes en difficulté dans leur réinsertion. Elle élabore des projets éducatifs adaptés, travaille avec les familles et les écoles, anime des actions de prévention et rédige des rapports pour suivre leurs progrès.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que sur son temps libre, elle s'occupe des autres : elle accompagne les jeunes dans leur développement personnel et social. Que dans un groupe, c'est elle qui met l'ambiance et fait le lien : elle travaille en collaboration avec les familles, les écoles et les institutions. Et que sa plus grande fierté, c'est quand son petit frère a enfin eu la moyenne en maths après tout un trimestre où elle l'a fait réviser : elle élabore des projets éducatifs adaptés et participe à la prévention auprès des jeunes.

**Pour l'enfant** (llm). Tu prends du temps pour t'occuper des autres : tu accompagnerais des jeunes en difficulté dans leur vie quotidienne. Dans un groupe, tu mets l'ambiance et tu fais le lien : tu travaillerais avec les familles et les écoles pour favoriser leur intégration. Tu as déjà été là pour quelqu'un qui en avait besoin : tu élaborerais des projets pour les aider à progresser.

### 3.20. `noah_terminale_minimal`

Noah, Terminale générale (maths, SES). Le parent a passé beaucoup de questions : 9 réponses d'observation seulement, aucune phrase libre, ne sait pas combien d'années d'études ni où.

*Incomplet, volontairement* : Voulu : le parent qui passe une question sur deux (écran de fin « message doux »).

- Situation : terminale_generale (maths, ses) ; genre : il
- Contraintes : études ne_sait_pas ; alternance passée ; privé passée ; département passée, mobilité ne_sait_pas ; refus rien ; ce qui compte passée
- Phrases libres : aucune
- Questions passées : temps_libre, aide_demandee, role_groupe, prendre_soin, probleme, fierte, matieres, alternance, prive, departement, ce_qui_compte, metier_evoque

#### Calcul seul

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 0 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,0 s.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Technicien-cuisiniste en cuisines professionnelles (I1325) | 1 | 1 | Equipements de production, équipements collectifs | 1 833 à 2 991 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien-cuisiniste / Technicienne-cuisiniste en cuisines professionnelles » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1325, encadré « Salaires des offres d'emploi », 2026) | bac | 2 950 projets, 81 % difficiles (Techniciens et agents de maîtrise en installation et maintenance en froid et conditionnement d'air ; 2026) |
| 2 | Inspecteur de conformité (H1301) | 2 | 2 | Hygiène Sécurité Environnement -HSE- industriels | 1 802 à 2 583 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Inspecteur / Inspectrice de conformité » (France Travail, France entière) ; France Travail, Métierscope, fiche métier H1301, encadré « Salaires des offres d'emploi », 2026) | bac + 2 | 2 284 projets, 72 % difficiles (Techniciens du contrôle qualité ; 2026) |
| 3 | Automaticien en bureau d'études (H1208) | 4 | 4 | Conception, recherche, études et développement | 1 870 à 3 940 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Automaticien / Automaticienne en bureau d'études » (France Travail, France entière) ; France Travail, Métierscope, fiche métier H1208, encadré « Salaires des offres d'emploi », 2026) | bac + 3 | 2 856 projets, 48 % difficiles (Techniciens et agents de maîtrise en maintenance électrique, électronique et automatismes ; 2026) |

- Formations, I1325 : 6 montrées sur 417 : BTS - Production - Electrotechnique (Bourg-en-Bresse) ; BTS - Production - Electrotechnique - en apprentissage (Yzeure), apprentissage ; BTS - Production - Electrotechnique (Trévoux) ; …
- Formations, H1301 : 6 montrées sur 357 : BUT - Hygiène Sécurité Environnement (Charleville-Mézières) ; BUT - Hygiène Sécurité Environnement - en apprentissage (Colmar), apprentissage ; Licence - Droit - Droit. (Bourg-en-Bresse) ; …
- Formations, H1208 : 6 montrées sur 55 : BUT - Génie électrique et informatique industrielle (Cuffies) ; Formation professionnelle - Développeur Informatique (Bac +2) - en apprentissage - Entièrement en distanciel (Paris), apprentissage ; BUT - Génie électrique et informatique industrielle (Montluçon) ; …

Écartés :

- Dessinateur en électricité-électronique (H1202) : Les entreprises y prévoient peu de recrutements : 903 projets pour la famille « Techniciens du dessin industriel » en 2026 (France Travail).
- Diagnostiqueur immobilier (F1103) : Le salaire de départ y est proche du Smic : à partir de 2 000 € brut par mois en début de carrière (source : CIDJ, fiche métier « Diagnostiqueur / Diagnostiqueuse immobilier », 2025).
- Brasseur de bière (A1413) : Le salaire de départ y est proche du Smic : de 1 802 à 2 359 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier A1413, encadré « Salaires des offres d'emploi », 2026).
- Technicien en Hygiène, Sécurité, Environnement industriel (HSE) (H1303) : C'est un métier très proche de « Technicien-cuisiniste en cuisines professionnelles », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Technicien en contrôles et essais non destructifs (CND END) (H1522) : Le salaire de départ y est proche du Smic : 2 000 € brut par mois en début de carrière, d'après la fiche du métier « Technicien / Technicienne de contrôle non destructif » (source : CIDJ, fiche métier « Technicien / Technicienne de contrôle non destructif », 2025).

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Technicien-cuisiniste en cuisines professionnelles**. *Le métier, simplement* (gabarit) : Il conçoit et installe des cuisines professionnelles adaptées aux besoins des clients, professionnels de l'hôtellerie - restauration . Concrètement, il effectue la pose et les raccordements aux réseaux dans le respect des normes de sécurité, optimise l'espace et l'efficacité des cuisines et assure la maintenance et la réparation des équipements de cuisine.
  *Pourquoi* : Ce métier ressort de l'ensemble de vos réponses, sans qu'une seule ne suffise à l'expliquer.
  *Pour l'enfant* : Ce métier ressort de l'ensemble de ce qu'on sait de toi.
- **Inspecteur de conformité**. *Le métier, simplement* (gabarit) : L'Inspecteur/ Inspectrice de conformité assure le respect des normes et réglementations en vigueur. Concrètement, il contrôle la conformité des installations et des équipements selon les normes, rédige des rapports détaillés sur les inspections et les audits effectués en suivant les actions correctives dans les délais et vérifie l'efficacité des mesures correctives.
  *Pourquoi* : Ce métier ressort de l'ensemble de vos réponses, sans qu'une seule ne suffise à l'expliquer.
  *Pour l'enfant* : Ce métier ressort de l'ensemble de ce qu'on sait de toi.
- **Automaticien en bureau d'études**. *Le métier, simplement* (gabarit) : Il réalise des études et des développements d'installations ou de systèmes industriels automatisés, sur des applications de type contrôle-commande, de supervision courants faibles (automates programmables, terminaux hommes-machines) ou courants forts (électronique de puissance).
  *Pourquoi* : Vous avez dit qu'il improvise, et il s'adapte : dans ce métier, il aurait à analyser les besoins des clients par la définition des projets et la proposition de choix techniques.
  *Pour l'enfant* : Tu sais improviser et t'adapter : ici, tu aurais à analyser les besoins des clients par la définition des projets et la proposition de choix techniques.

</details>

#### Mixte

Source : **partiel**. Champs remplacés : I1409.ia_phrase, I1325.piste. Durée du conseiller : 20,8 s.

Appels : appel 1 (conseil) : echec_validation, 15,7 s, 21642 jetons en entrée (4864 en cache), 1684 en sortie, 0,026 $ ; règles en échec : V05 T11×4 T23 T15 ; appel 2 (correction) : echec_validation, 4,7 s, 23589 jetons en entrée (4864 en cache), 550 en sortie, 0,026 $ ; règles en échec : V04 T11×3 T23 T28×6.

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 0 nombre(s) et 0 diplôme(s) cités dans 10 textes. Liens parent + enfant par piste : 3+2, 3+2, 0+0.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Automaticien en bureau d'études (H1208) | 4 | 4 | Conception, recherche, études et développement | 1 870 à 3 940 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Automaticien / Automaticienne en bureau d'études » (France Travail, France entière) ; France Travail, Métierscope, fiche métier H1208, encadré « Salaires des offres d'emploi », 2026) | bac + 3 | 2 856 projets, 48 % difficiles (Techniciens et agents de maîtrise en maintenance électrique, électronique et automatismes ; 2026) |
| 2 | Agent de maintenance en bureautique (I1409) | 18 | 12 | Equipements domestiques et informatique | 1 810 à 2 500 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Agent / Agente de maintenance en bureautique » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1409, encadré « Salaires des offres d'emploi », 2026) | bac | 7 667 projets, 48 % difficiles (Techniciens de production, d'exploitation, d'installation, et de maintenance, support et services aux utilisateurs en informatique ; 2026) |
| 3 | Technicien-cuisiniste en cuisines professionnelles (I1325) | 1 | 1 | Equipements de production, équipements collectifs | 1 833 à 2 991 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Technicien-cuisiniste / Technicienne-cuisiniste en cuisines professionnelles » (France Travail, France entière) ; France Travail, Métierscope, fiche métier I1325, encadré « Salaires des offres d'emploi », 2026) | bac | 2 950 projets, 81 % difficiles (Techniciens et agents de maîtrise en installation et maintenance en froid et conditionnement d'air ; 2026) |

- Formations, H1208 : 6 montrées sur 55 : BUT - Génie électrique et informatique industrielle (Cuffies) ; Formation professionnelle - Développeur Informatique (Bac +2) - en apprentissage - Entièrement en distanciel (Paris), apprentissage ; BUT - Génie électrique et informatique industrielle (Montluçon) ; …
- Formations, I1409 : 6 montrées sur 85 : BUT - Réseaux et télécommunications (Biot) ; BUT - Réseaux et télécommunications - en apprentissage (Montbéliard), apprentissage ; BUT - Informatique (Bourg-en-Bresse) ; …
- Formations, I1325 : 6 montrées sur 417 : BTS - Production - Electrotechnique (Bourg-en-Bresse) ; BTS - Production - Electrotechnique - en apprentissage (Yzeure), apprentissage ; BTS - Production - Electrotechnique (Trévoux) ; …

Écartés :

- Dessinateur en électricité-électronique (H1202) : C'est un métier très proche de « Automaticien en bureau d'études », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Technicien en contrôles et essais non destructifs (CND END) (H1522) : Le salaire de départ y est proche du Smic : 2 000 € brut par mois en début de carrière, d'après la fiche du métier « Technicien / Technicienne de contrôle non destructif » (source : CIDJ, fiche métier « Technicien / Technicienne de contrôle non destructif », 2025).
- Expert métrologue (H1516) : Selon l'OIT, ce métier est fortement exposé à l'IA générative. Nous avons préféré des pistes qui le sont moins.
- Formaliste (K1912) : Les entreprises y prévoient peu de recrutements : 1 164 projets pour la famille « Professionnels du droit » en 2026 (France Travail).
- Costumier (L1502) : Le salaire de départ y est proche du Smic : du Smic (1 867 €) à 2 000 € brut par mois en début de carrière (source : CIDJ, fiche métier « Costumière / Costumier », 2025).

Les textes du mode mixte :

**1. Automaticien en bureau d'études (H1208)**

**Le métier, simplement** (llm). Il réalise des études pour créer des systèmes automatisés dans l'industrie. Il analyse ce que veut le client, écrit les programmes, teste tout sur des bancs d'essai et met les installations en service sur site.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut générer des bouts de code ou simuler des tests. Mais comprendre le besoin exact du client et régler l'installation sur place avec les équipes, ça reste un travail humain.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'il peut rester assis des heures : il passe beaucoup de temps en bureau d'études à concevoir et programmer les automates. Qu'il préfère être à l'intérieur : il travaille principalement en bureau d'études avant d'aller parfois sur site. Et qu'il improvise, et il s'adapte : il analyse les besoins du client et propose les choix techniques qui conviennent.

**Pour l'enfant** (llm). Tu peux rester assis des heures sur ce qui t'intéresse : tu passerais du temps en bureau à concevoir des programmes d'automatisation. Tu sais improviser et t'adapter : tu analyserais les besoins du client pour proposer les solutions techniques.

**2. Agent de maintenance en bureautique (I1409)**

**Le métier, simplement** (llm). Il installe, répare et entretient les ordinateurs, imprimantes et photocopieurs. Il détecte les pannes, change les pièces, forme les utilisateurs et gère les stocks de pièces détachées.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que quand il veut quelque chose, il se débrouille par lui-même : il détecte les pannes et répare les équipements en suivant les procédures. Qu'il improvise, et il s'adapte : il gère les urgences et les interventions qui n'étaient pas prévues. Et qu'il préfère être à l'intérieur : il intervient souvent dans des bureaux ou des locaux professionnels.

**Pour l'enfant** (llm). Tu te débrouilles par toi-même : tu détecterais les pannes et tu réparerais les équipements. Tu sais improviser et t'adapter : tu gérerais les interventions qui arrivent à l'improviste.

**3. Technicien-cuisiniste en cuisines professionnelles (I1325)**

**Le métier, simplement** (gabarit). Il conçoit et installe des cuisines professionnelles adaptées aux besoins des clients, professionnels de l'hôtellerie - restauration . Concrètement, il effectue la pose et les raccordements aux réseaux dans le respect des normes de sécurité, optimise l'espace et l'efficacité des cuisines et assure la maintenance et la réparation des équipements de cuisine.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (gabarit). Ce métier ressort de l'ensemble de vos réponses, sans qu'une seule ne suffise à l'expliquer.

**Pour l'enfant** (gabarit). Ce métier ressort de l'ensemble de ce qu'on sait de toi.

### 3.21. `clara_terminale_langues`

Clara, Terminale générale (LLCER, HGGSP), Montpellier. Bavarde, à l'aise avec les inconnus, lit beaucoup, a passé un an en Irlande. 5 ans d'études, partout en France. Refuse les soins.

- Situation : terminale_generale (llcer, hggsp) ; genre : elle
- Contraintes : études cinq_ans ; alternance ne_sait_pas ; privé ne_sait_pas ; département 34, mobilité france ; refus soins ; ce qui compte bouger, gagner
- Phrases libres : temps_libre_precis « Elle regarde toutes ses séries en anglais et en espagnol, sans sous-titres. » ; fierte_recit « Son année d'échange en Irlande, partie seule à 16 ans. »
- Questions passées : metier_evoque

#### Calcul seul

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 4 nombre(s) et 0 diplôme(s) cités dans 9 textes. Durée : 0,1 s.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Chargée de projet emploi (K1812) | 1 | 1 | Développement territorial et emploi | 1 917 à 3 000 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Chargé / Chargée de projet emploi » (France Travail, France entière) ; France Travail, Métierscope, fiche métier K1812, encadré « Salaires des offres d'emploi », 2026) | bac + 3 | 1 138 projets, 36 % difficiles (Professionnels de l’orientation et de l’insertion professionnelle ; 2026) |
| 2 | Chargée de plaidoyer (E1131) | 2 | 2 | Edition et communication | 2 600 € brut par mois (salaire brut mensuel de début de carrière du métier « Chargé / Chargée de plaidoyer » ; CIDJ, fiche métier « Chargé / Chargée de plaidoyer », 2026) | bac + 5 | 1 220 projets, 26 % difficiles (Cadres de la communication ; 2026) |
| 3 | Consultante en management (M1429) | 4 | 4 | Organisation et études | 2 154 à 4 000 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Consultant / Consultante en management » (France Travail, France entière) ; France Travail, Métierscope, fiche métier M1429, encadré « Salaires des offres d'emploi », 2026) | bac + 5 | 8 524 projets, 33 % difficiles (Cadres administratifs, comptables et financiers (hors juristes) ; 2026) |

- Formations, K1812 : 6 montrées sur 181 : BUT - Gestion des entreprises et des administrations (Montpellier) ; Licence - Psychologie (Montpellier) ; BUT - Gestion des entreprises et des administrations - en apprentissage (Nîmes), apprentissage ; …
- Formations, E1131 : 6 montrées sur 364 : Licence - Science politique - Parcours Science politique (Faculté de Droit et Science Politique) (Montpellier) ; Licence - Économie, Science politique - Parcours Bi-Licence - Économie / Science politique (Facultés d'Économie et de Droit/Science politique) (Montpellier) ; Licence - Etudes européennes et internationales - Parcours Etudes européennes et internationales franco-espagnoles (Clermont-Ferrand) ; …
- Formations, M1429 : 6 montrées sur 59 : Formation des écoles de commerce et de management Bac + 5 (Strasbourg) ; Formation des écoles de commerce et de management Bac + 5 - Programme Grande École (Grabels) ; Formation des écoles de commerce et de management Bac + 5 (Castelnau-le-Lez) ; …

Écartés :

- Chargée de location d'engins et de matériel de chantier (D1224) : Le salaire de départ y est proche du Smic : de 1 802 à 2 244 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier D1224, encadré « Salaires des offres d'emploi », 2026).
- Chargée de recrutement (M1502) : C'est un métier très proche de « Chargée de projet emploi », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Chargée de développement d'activités sportives (G1213) : Le salaire de départ y est proche du Smic : de 1 802 à 2 288 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier G1213, encadré « Salaires des offres d'emploi », 2026).

<details><summary>Textes du calcul seul (gabarits)</summary>

- **Chargée de projet emploi**. *Le métier, simplement* (gabarit) : Elle est un acteur dynamique impliqué dans l'insertion professionnelle et le marché du travail. Concrètement, elle identifie les besoins en emploi et compétences des entreprises locales, met en place des projets d'insertion professionnelle et de formation visant à faciliter l'accès à l'emploi et assure la liaison entre les entreprises et les demandeurs d'emploi en ciblant les offres d'emploi adaptées à chaque profil.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir pris la parole devant d'autres : dans ce métier, elle aurait à développer et animer un réseau de partenaires et de prestataires. Que c'est à elle qu'on demande d'organiser les sorties : elle serait aussi amenée à utiliser des outils de gestion de projet pour le suivi. Qu'elle est plus à l'aise en groupe : le métier lui demanderait aussi de coordonner les efforts d'équipe dans les projets d'emploi. Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 3.
  *Pour l'enfant* : Tu as déjà pris la parole devant d'autres : ici, tu aurais à développer et animer un réseau de partenaires et de prestataires. C'est souvent toi qui organises les sorties : tu serais aussi amenée à utiliser des outils de gestion de projet pour le suivi. Tu es à l'aise en groupe : le métier te demanderait aussi de coordonner les efforts d'équipe dans les projets d'emploi.
- **Chargée de plaidoyer**. *Le métier, simplement* (gabarit) : Elle met en œuvre des stratégie de défense et de promotion des intérêts d'une organisation ou d'une cause auprès des institutionnels et des politiques afin d'influencer des décisions. Concrètement, elle élabore et met en œuvre des stratégies de plaidoyer, collabore avec les décideurs politiques et les parties prenantes et analyse l'environnement politique et législatif pour anticiper les évolutions.
  *Pourquoi* : Vous avez dit que sa plus grande fierté, c'est d'avoir pris la parole devant d'autres : dans ce métier, elle aurait à adapter les stratégies de plaidoyer aux changements de contexte. Que c'est à elle qu'on demande d'organiser les sorties : elle serait aussi amenée à organiser des campagnes de sensibilisation. Qu'elle sait négocier, et obtient souvent gain de cause : le métier lui demanderait aussi de présenter des arguments convaincants lors de réunions. Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 5.
  *Pour l'enfant* : Tu as déjà pris la parole devant d'autres : ici, tu aurais à adapter les stratégies de plaidoyer aux changements de contexte. C'est souvent toi qui organises les sorties : tu serais aussi amenée à organiser des campagnes de sensibilisation. Tu sais négocier : le métier te demanderait aussi de présenter des arguments convaincants lors de réunions.
- **Consultante en management**. *Le métier, simplement* (gabarit) : Elle analyse les pratiques d'une entreprise pour proposer des stratégies visant à améliorer son efficacité et sa performance. Concrètement, elle conseille les entreprises sur la stratégie et l'organisation, optimise les processus pour améliorer l'efficacité opérationnelle et accompagne les changements et la transformation des structures.
  *Pourquoi* : Vous avez dit qu'elle parle facilement à des adultes qu'elle ne connaît pas : dans ce métier, elle aurait à réaliser des prestations d'expertise et de conseil. Et que ses proches lui demandent de leur expliquer les choses : elle serait aussi amenée à coordonner des projets d'intelligence économique.
  *Pour l'enfant* : Tu as déjà pris la parole devant d'autres : ici, tu aurais à conseiller une structure dans la gestion de son activité. C'est souvent toi qui organises les sorties : tu serais aussi amenée à animer, coordonner une équipe. Tu engages facilement la conversation, même avec des inconnus : le métier te demanderait aussi de réaliser des prestations d'expertise et de conseil.

</details>

#### Mixte

Source : **llm**. Champs remplacés : K1812.pourquoi_enfant, E1131.pourquoi_enfant, E1131.ia_phrase, K2101.pourquoi_enfant, K2101.ia_phrase. Durée du conseiller : 19,0 s.

Appels : appel 1 (conseil) : echec_validation, 18,6 s, 26585 jetons en entrée (4864 en cache), 2257 en sortie, 0,034 $ ; règles en échec : T04×2 T11×4 T23 T22 T33.

Contrôles : aucune violation, 0 à vérifier, 0 note(s) ; 2 nombre(s) et 0 diplôme(s) cités dans 10 textes. Liens parent + enfant par piste : 4+3, 3+3, 3+3.

| # | Métier (code) | Rang moteur | Position dans la liste | Domaine | Ce qu'on y gagne | Études | Ça recrute ? |
|---|---|---:|---:|---|---|---|---|
| 1 | Chargée de projet emploi (K1812) | 1 | 1 | Développement territorial et emploi | 1 917 à 3 000 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Chargé / Chargée de projet emploi » (France Travail, France entière) ; France Travail, Métierscope, fiche métier K1812, encadré « Salaires des offres d'emploi », 2026) | bac + 3 | 1 138 projets, 36 % difficiles (Professionnels de l’orientation et de l’insertion professionnelle ; 2026) |
| 2 | Chargée de plaidoyer (E1131) | 2 | 2 | Edition et communication | 2 600 € brut par mois (salaire brut mensuel de début de carrière du métier « Chargé / Chargée de plaidoyer » ; CIDJ, fiche métier « Chargé / Chargée de plaidoyer », 2026) | bac + 5 | 1 220 projets, 26 % difficiles (Cadres de la communication ; 2026) |
| 3 | Conseillère consultante en formation (K2101) | 16 | 13 | Formation initiale et continue | 1 802 à 3 750 € brut par mois (salaires bruts mensuels proposés par 80 % des offres d'emploi du métier « Conseiller consultant / Conseillère consultante en formation » (France Travail, France entière) ; France Travail, Métierscope, fiche métier K2101, encadré « Salaires des offres d'emploi », 2026) | bac + 3 | 1 235 projets, 26 % difficiles (Cadres des ressources humaines et du recrutement ; 2026) |

- Formations, K1812 : 6 montrées sur 181 : BUT - Gestion des entreprises et des administrations (Montpellier) ; Licence - Psychologie (Montpellier) ; BUT - Gestion des entreprises et des administrations - en apprentissage (Nîmes), apprentissage ; …
- Formations, E1131 : 6 montrées sur 364 : Licence - Science politique - Parcours Science politique (Faculté de Droit et Science Politique) (Montpellier) ; Licence - Économie, Science politique - Parcours Bi-Licence - Économie / Science politique (Facultés d'Économie et de Droit/Science politique) (Montpellier) ; Licence - Etudes européennes et internationales - Parcours Etudes européennes et internationales franco-espagnoles (Clermont-Ferrand) ; …
- Formations, K2101 : 6 montrées sur 58 : Licence - Sciences de l'éducation et de la formation (Montpellier) ; Licence - Sciences de l'éducation et de la formation (Aix-en-Provence) ; Licence - Sciences de l'éducation et de la formation - Sciences de l'Education mineure Sociologie ou Sciences du langage (Toulouse) ; …

Écartés :

- Chargée de recrutement (M1502) : C'est un métier très proche de « Chargée de projet emploi », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.
- Chargée de développement d'activités sportives (G1213) : Le salaire de départ y est proche du Smic : de 1 802 à 2 288 € brut par mois, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus (source : France Travail, Métierscope, fiche métier G1213, encadré « Salaires des offres d'emploi », 2026).
- Médecin du travail et de prévention (J1101) : Il faut au moins 9 ans d'études après le bac, et vous avez répondu « 5 ans ».
- Coordinatrice pédagogique (K2102) : La fiche officielle du métier le dit : « Une expérience dans la coordination pédagogique ou dans la gestion de dispositifs de formation est souvent requise » (France Travail).
- Assistante service clients (D1432) : Selon l'OIT, ce métier est fortement exposé à l'IA générative. Nous avons préféré des pistes qui le sont moins.

Les textes du mode mixte :

**1. Chargée de projet emploi (K1812)**

**Le métier, simplement** (llm). Elle identifie les besoins en emploi des entreprises locales et met en place des projets pour aider les gens à trouver du travail. Elle organise des ateliers, des événements de networking et fait le lien entre les demandeurs d'emploi et les entreprises. Elle travaille en mode projet, avec des déplacements et des partenaires variés.

**Et l'IA ?** (phrase du LLM, après le niveau sourcé). L'IA peut trier des offres d'emploi ou analyser des données de compétences. Mais créer un lien de confiance avec une personne en difficulté, animer un atelier ou négocier avec un employeur, ça reste humain.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que sa plus grande fierté, c'est d'avoir pris la parole devant d'autres et son année d'échange en Irlande partie seule à 16 ans : elle représente sa structure lors d'événements et anime un réseau de partenaires. Que dans un groupe, c'est elle qui met l'ambiance et fait le lien : elle assure la liaison entre les entreprises et les demandeurs d'emploi. Que c'est à elle qu'on demande d'organiser les sorties : elle organise des événements de networking et des ateliers de compétences. Et qu'elle a envie de bouger, de voyager : elle fait des déplacements professionnels et travaille en mode projet sur le territoire.

**Pour l'enfant** (llm). Tu as déjà pris la parole devant d'autres : tu représenterais ta structure lors d'événements et tu animerais un réseau de partenaires. Dans un groupe, tu mets l'ambiance et tu fais le lien : tu assurerais la liaison entre les entreprises et les personnes qui cherchent du travail. Tu as envie de bouger, de voyager : tu ferais des déplacements et tu travaillerais sur des projets variés sur le territoire.

**2. Chargée de plaidoyer (E1131)**

**Le métier, simplement** (llm). Elle défend les intérêts d'une organisation ou d'une cause auprès des décideurs politiques. Elle rédige des argumentaires, organise des rencontres et collabore avec des partenaires pour influencer les décisions. Elle analyse le contexte politique et suit l'impact de ses actions.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit qu'elle sait négocier, et obtient souvent gain de cause : elle présente des arguments convaincants lors de réunions et négocie des accords. Qu'elle peut passer des heures à regarder toutes ses séries en anglais et en espagnol sans sous-titres : elle rédige des documents de positionnement et analyse l'environnement politique. Et qu'elle est à l'aise en histoire-géo : elle collabore avec les décideurs politiques et analyse le contexte législatif.

**Pour l'enfant** (llm). Tu sais négocier : tu présenterais des arguments convaincants et tu négocierais des accords. Tu peux passer des heures à regarder des séries en anglais : tu rédigerais des documents et tu analyserais le contexte politique. Tu es à l'aise en histoire-géo : tu collaborerais avec des décideurs et tu analyserais l'environnement législatif.

**3. Conseillère consultante en formation (K2101)**

**Le métier, simplement** (llm). Elle analyse les besoins en compétences des entreprises et conçoit des programmes de formation sur mesure. Elle accompagne leur mise en place, évalue les résultats et conseille les salariés et les managers. Elle travaille avec des partenaires et suit l'évolution des méthodes pédagogiques.

**Et l'IA ?** Pas de phrase rédigée : seul le niveau sourcé, s'il est affichable.

**Pourquoi ça lui ressemble** (llm). Vous avez dit que ses proches lui demandent de leur expliquer les choses : elle conçoit des programmes de formation et accompagne leur mise en œuvre. Que sa plus grande fierté, c'est d'avoir pris la parole devant d'autres et son année d'échange en Irlande partie seule à 16 ans : elle conseille les entreprises et définit les objectifs d'apprentissage. Et qu'elle prévoit tout à l'avance : elle planifie la stratégie de formation et assure le suivi des actions.

**Pour l'enfant** (llm). On vient te demander d'expliquer les choses : tu concevrais des programmes de formation et tu accompagnerais leur mise en place. Tu as déjà pris la parole devant d'autres : tu conseillerais les entreprises et tu définirais les objectifs d'apprentissage. Tu prévois les choses à l'avance : tu planifierais la stratégie de formation et tu suivrais les résultats.
