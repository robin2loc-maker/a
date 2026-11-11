# Critique : évaluation du pipeline (2.6), tour 1

Relecture indépendante de `docs/EVAL.md` (commit 6a70efc) par un conseiller d'orientation : 21 profils, calcul seul et mode mixte. Je n'ai écrit ni l'évaluation ni le code. Aucun appel à l'API xAI : tout ce qui suit vient d'`EVAL.md`, des données du dépôt et du moteur exécuté hors ligne.

Sources lues : `docs/roles/critique.md`, `CLAUDE.md` (§5), `docs/STYLE.md`, `TODO.md` (2.6), `docs/page-de-vente.md` (carte « Conducteur de travaux » et liste « Voici ce que vous recevez »), `docs/SPEC.md` (§5, §6, §7), `docs/EVAL.md`, `tests/fixtures/profils-evaluation.json`, `content/prompt-conseiller.ts` (version 4), `src/lib/moteur/` (`preselection.ts`, `selection.ts`, `filtres.ts`, `donnees.ts`), `src/lib/conseiller/charge.ts`, `data/processed/` (`catalogue.json`, `metier_formations.json`, `formations.json`, `durees_formations.json`, `metiers.json`).

**Mesures faites pour cette critique** (sans réseau, script jetable non commité) :
- `preselectionner()` sur les 21 profils, avec le rang de chaque candidat ;
- `classer()` sur les métiers qu'un conseiller attendrait pour chaque profil : rang, ou filtre qui les exclut ;
- `catalogue.non_eligibles` pour les métiers attendus absents de l'index ;
- durées des mentions Parcoursup de type « DE » dans `durees_formations.json`.

---

## 1. Jugement d'ensemble

**Les règles dures tiennent. Ce qui manque, c'est la justesse.** Aucune piste ne viole une contrainte du parent, aucun chiffre n'est inventé, chaque carte a son salaire, ses études et ses sources. Le travail de 2.6 est honnête, et l'analyse du développeur (§2 d'`EVAL.md`) voit juste sur presque tout. Mais lu profil par profil, avec l'œil de quelqu'un qui reçoit des familles, le résultat se range ainsi :

| Qualité des 3 pistes (mode mixte) | Profils | Ce que dirait la mère |
|---|---|---|
| Bonnes : au moins deux pistes justes, aucune absurde | Manon, Hugo, Nathan, Rayan, Louise, exemple, Théo | « Il y a du vrai. » |
| Moyennes : une piste juste, deux discutables | Léa, Inès, Chloé, Yanis, Adam, Emma, Kylian, Zoé, Noah, Clara | « Une sur trois, pour 27 € ? » |
| Fausses : l'enfant ne s'y reconnaît pas | **Tom, Sarah, Jade, Maëlys** | « Vous n'avez pas lu mes réponses. » Elle demande le remboursement. |

**Note globale : pistes 5/10, textes 5,5/10.** Ces textes sont rédigés par le LLM ; ceux des gabarits ne sont pas publiables (3/10).

Quatre profils sur vingt et un donnent une réponse qu'une mère jugera à côté. Ce sont justement ceux où elle a écrit la phrase la plus parlante :
- Tom est en bac pro cuisine, il teste des recettes de pâtisserie et a cuisiné seul pour vingt personnes. Il reçoit Technicien-cuisiniste, Technicien Datacenter et Installateur de panneaux solaires.
- Sarah soigne les chevaux et pense à vétérinaire. Elle reçoit Pédologue.
- Jade remplit des carnets de croquis, ses copines lui demandent leurs logos, et sa mère a écrit « graphiste ». Designer graphique est écarté parce qu'il serait « très proche de Photographe », que le modèle a choisi au rang 55.
- Maëlys a cousu une robe pour un mariage. Elle reçoit Technicienne d'installation d'équipements industriels.

**La cause principale n'est pas le LLM.** Il choisit dans une présélection qui, pour ces enfants, ne contient pas la bonne réponse. J'en vois quatre raisons, toutes en amont du conseiller :
1. **Le moteur ignore les phrases libres.** Aucun fichier de `src/lib/moteur/` ne lit `temps_libre_precis`, `fierte_recit` ni `aide_exemple`. Or ce sont les signaux les plus forts : « pâtisserie », « chevaux », « enfants des voisins », « robe », « séries en anglais et en espagnol ».
2. **La présélection force la diversité trop tôt.** Elle limite à 4 candidats par grand domaine et à 1 par métier BMO, puis comble avec des métiers classés jusqu'au 79ᵉ rang. Chloé a 10 candidats au-delà du 30ᵉ rang, Maëlys aussi. Pendant ce temps, Assistante sociale (24ᵉ), Éducatrice spécialisée (21ᵉ) et CESF (17ᵉ) restent dehors pour Chloé, et Designer graphique (13ᵉ), Web designer (9ᵉ) et UX-UI designer (15ᵉ) pour Jade.
3. **Le catalogue n'a pas les métiers que les familles ont en tête.** 1 378 fiches sur 1 923 ne sont pas éligibles. Parmi elles : cuisinier, pâtissier, boulanger, aide-soignant, auxiliaire de puériculture, auxiliaire vétérinaire, soigneur animalier, kinésithérapeute, orthoptiste, puéricultrice, professeur de collège et lycée, sage-femme et avocat (faute de salaire), développeur de jeux vidéo.
4. **Les drapeaux de refus, qui sont des filtres durs, ont des erreurs.** Couturière et Styliste portent « vente », ce qui les exclut pour Maëlys. Animateur socioéducatif porte « bureau toute la journée », ce qui l'exclut pour Adam. Agent d'exploitation du transport de personnes, un poste de bureau, ne porte pas ce drapeau : il sort pour l'enfant qui « n'aime pas rester assis ».

**Les trois lecteurs :**
- **La mère, sur mobile** : la partie « Pourquoi ça lui ressemble » lui saute aux yeux quand elle est fautive. Elle lira la phrase « Vous avez dit qu'il peut passer des heures à foot quatre fois par semaine » comme une faute de frappe. Et le lien « elle cuisine sur son temps libre : elle prépare et monte les verres avec précision » comme une blague.
- **Le conseiller** : dans 7 profils sur 21, il proposerait sans hésiter un métier qui est soit absent du catalogue, soit coupé par la présélection. Il retirerait aussi Mandataire judiciaire à la protection des majeurs (Chloé, Zoé). C'est un métier de seconde carrière : certificat national obligatoire, âge minimum, souvent une première expérience (à vérifier sur Légifrance, voir §6.4). Et il retirerait Maître d'hôtel pour un footballeur et pour un vendeur de baskets qui refuse le travail physique.
- **Le propriétaire** : la carte de l'exemple est moins bonne que la carte modèle de la page de vente. La fierté (« organiser, c'est le cœur du métier ») a disparu de la meilleure piste, et la piste 3 n'a, pour l'enfant, qu'une seule phrase : « Tu vises trois ans d'études au plus : tu peux y accéder dès bac + 2. »

**Le mode mixte fait-il mieux que le calcul seul ?** Oui pour les textes, nettement : les gabarits sont du jargon de fiche (« faire preuve d'appétence pour l'utilisation de logiciels numériques »), avec des liens absurdes et des accords faux. Pour les pistes, le gain est modeste : meilleur dans 8 profils (Manon, Théo, Nathan, Adam, Emma, Sarah, Maëlys, Jade, où au moins le Nez disparaît), égal dans 10, moins bon dans 2 ou 3 (Chloé et Zoé avec MJPM, Inès avec l'événementiel de particuliers). Le plafond est le même pour les deux modes : la présélection.

---

## 2. Les trois améliorations qui feraient la plus grande différence

### 2.1 Faire entrer les mots du parent dans la présélection (moteur, données présentes)

Aujourd'hui, la phrase « Il teste des recettes de pâtisserie le dimanche » n'a aucun effet sur les 20 candidats. Correction :
- dans `preselection.ts`, réserver **jusqu'à 3 places** à des « candidats des mots du parent » ;
- les trouver par rapprochement lexical entre les phrases libres (après lemmatisation simple, et une liste de mots vides) et deux données officielles de `metiers.json` : les **appellations ROME** (14 330 libellés, comme « Pâtissier de restaurant » ou « Soigneur d'équidés ») et les **centres d'intérêt** ROME ;
- n'y admettre qu'un métier éligible, qui passe les filtres durs et se classe au plus au 150ᵉ rang ;
- les marquer `mots_du_parent: true` dans la charge, avec le mot qui a déclenché le rapprochement, pour que le LLM sache pourquoi ils sont là ;
- règle de prompt : « un candidat `mots_du_parent` mérite une place s'il ne contredit aucune réponse ».

Effet attendu : Monteur vidéo pour Yanis (140ᵉ aujourd'hui), Costumière ou Couturière pour Maëlys, Technicien de production animale (45ᵉ) ou Cavalier d'entraînement pour Sarah, Éducatrice de jeunes enfants (53ᵉ) pour Léa. Pour Tom, il faut aussi le §2.3.

### 2.2 Refaire la présélection : 14 par le rang, 3 pour la diversité, 3 pour les mots du parent

Remplacer la boucle actuelle (plafond de 4 par grand domaine, 1 par métier BMO, aucune limite de rang) par :
1. **les 14 premiers** du classement, au plus 3 par domaine professionnel, sans plafond de grand domaine ni de métier BMO (la diversité du **trio** est déjà garantie par `compatibles` et la règle « deux par grand domaine au plus ») ;
2. **3 places de diversité**, prises parmi les 40 premiers rangs, dans des grands domaines absents des 14 ;
3. **3 places pour les mots du parent** (§2.1), sinon rendues aux rangs suivants ;
4. toujours : les 3 pistes du calcul seul, et tout **métier évoqué** éligible qui passe les filtres (voir §4, G5) ;
5. **jamais un candidat au-delà du 40ᵉ rang**, sauf métier évoqué ou mot du parent.

Preuve que c'est l'étape qui coûte le plus : 10 profils sur 21 ont au moins 5 candidats au-delà du 30ᵉ rang (Maëlys jusqu'au 79ᵉ, Hugo au 73ᵉ). Le LLM en a choisi 8 sur 63 au-delà de la position 10, dont Photographe (rang 55), Technicienne des industries graphiques (39), Événementiel de particuliers (23) et Agent de maintenance en bureautique (18), tous mauvais.

### 2.3 Combler le catalogue là où les données officielles du dépôt suffisent, et soumettre le reste au propriétaire

Détail au §6. En bref :
- **Un bug de durées**, à corriger tout de suite : les cinq grands diplômes d'État du soin et du social n'ont pas de durée par mention, et passent pour « trop longs » dès que le parent répond « 3 ans ». Cela touche 576 formations : Infirmier (550001, 338 formations), Éducateur spécialisé, Assistant de service social, Éducateur de jeunes enfants, Éducateur technique spécialisé. D'où « 1 formation montrée » pour Infirmière chez Manon et Zoé.
- **Faisable avec Parcoursup, le ROME et le RNCP déjà présents** : Orthoptiste (19 formations Parcoursup sous l'intitulé « Certificat de capacité d'Orthoptiste »), Kinésithérapeute (PASS, LAS et les licences « parcours accès kiné » de Parcoursup), Puéricultrice (via le D.E Infirmier), Cuisinier et Pâtissier de restaurant (via le BTS Management en hôtellerie restauration, à arbitrer).
- **Faisable avec une source déjà utilisée** (pages CIDJ, page par page) : les salaires de Sage-femme, Avocat, Développeur de jeux vidéo, Concepteur de jeux vidéo, Animateur 2D/3D et Pédicure-podologue.
- **Décision du propriétaire** : CAP, BP, D.E aide-soignant, D.E auxiliaire de puériculture et titres professionnels ne sont pas sur Parcoursup, alors que la page de vente promet « Les formations qui y mènent, avec leur fiche Parcoursup ».

---

## 3. Profil par profil

Colonnes : ce que fait le mode mixte, ce qu'un conseiller garderait, retirerait ou ajouterait (avec le rang moteur et, entre crochets, ce qui empêche le métier attendu d'arriver), puis les textes. « Mixte / calcul » : le mixte fait-il mieux ?

| Profil | Mixte | Le conseiller | Textes | Mixte / calcul |
|---|---|---|---|---|
| **exemple** | Chargé d'affaires BTP, Agent d'exploitation transport de personnes, Conducteur de travaux paysagers | Garde 1 et 3. Retire l'Agent d'exploitation : c'est un poste de bureau, et l'enfant « n'aime pas rester assis » ; en plus le permis D est obligatoire selon le ROME. Ajoute Conducteur de travaux du bâtiment (rang 10, présent, incompatible avec 1). | La meilleure piste ne cite pas la fierté (T15). La piste 3 enfant n'a que le lien d'études (gabarit). En dessous de la carte modèle. | égal |
| **Léa** (Seconde, garde des enfants, animaux) | Éducatrice nature environnement, Médiatrice sociale, Conseillère en gestion de carrière | Garde 1. Retire Gestion de carrière (bac + 5, RH, rien à voir avec une fille de 15 ans qui garde des enfants). Ajoute Éducatrice de jeunes enfants (53ᵉ), Professeure des écoles (45ᵉ, 5 ans acceptés), Infirmière (9ᵉ) [coupée par « 1 par métier BMO » au profit d'IBODE, une spécialisation qui demande 2 ans d'exercice]. | Rappel fautif (« d'avoir aidé quelqu'un et quand elle a gardé… »). « le week-end, elle file dehors, dans la nature : elle assure une présence sociale active dans les espaces publics en extérieur » : la nature n'est pas la rue. | égal |
| **Hugo** (NSI, code) | Data engineer, Ingénieur conception électrique, Ingénieur énergies renouvelables | Juste, mais trois métiers d'ingénieur : aucune surprise. Ajouterait un métier du jeu vidéo ou de la cybersécurité [non éligibles : salaire manquant]. | Rappel « qu'il code programme et monte des ordinateurs ». « les chiffres, pour lui, c'est un jeu : il gère les budgets » : contresens. | égal |
| **Inès** (SES, négocie, veut bien gagner) | Chargée de mission développement territorial, Événementiel de particuliers, Productrice audiovisuel | Garde 1. Retire Événementiel (niveau bac, 1 802 à 2 500 €, pour une très bonne élève qui veut bien gagner sa vie). Ajoute Acheteuse (17ᵉ, présente : elle a négocié le prix du voyage), Consultante en management (2ᵉ, présente), Chargée d'affaires immobilières (4ᵉ, son propre patron). | Piste 3 entièrement en gabarit, ton de plaquette (« transformant une vision artistique en un projet concret, viable et abouti »). | moins bon |
| **Nathan** (bac pro électricité, alternance) | Mécanicien en matériels agricoles, Installateur solaire, Technicien-cuisiniste | Garde 1 et 2. Remplace le Technicien-cuisiniste (un aimant : 3 trios) par un métier d'électricité de maintenance ou d'ascensoriste. Les pistes 2 et 3 montrent les mêmes 417 formations. | « ce métier se fait souvent en alternance » : non sourcé. Rappel « Qu'il n'aime pas rester assis il a besoin de bouger ». | meilleur |
| **Chloé** (ST2S, soin, pas de nuit, 3 ans) | Éducatrice PJJ, Opticienne, MJPM | Garde 1. Retire MJPM et Opticienne. Ajoute Assistante sociale (24ᵉ), Éducatrice spécialisée (21ᵉ), CESF (17ᵉ), Ergothérapeute (18ᵉ, présente) [plafond de 4 par grand domaine ; bug de durée des D.E]. | « elle cuisine sur son temps libre : elle prépare et monte les verres avec précision » : lien de mots. | moins bon |
| **Yanis** (flou, crée sur écran, « youtubeur ») | Technicien audiovisuel, Assistant maîtrise d'œuvre, Agent de maintenance bureautique | Garde 1. Retire 2 et 3. Ajoute Monteur vidéo (140ᵉ) [phrase « youtubeur » et réponse `ecrans=cree` sans effet sur le classement]. | « il est à l'aise en sport : il se rend sur les chantiers ». Piste 3 en gabarit : « à l'aise en sport : réaliser les opérations de nettoyage et de réglage ». | égal |
| **Manon** (sortie de PASS, natation) | Éducatrice sportive, Animatrice socioéducative, Manipulatrice d'électroradiologie | **Le meilleur trio.** Ajouterait Infirmière en option (1ᵉʳ rang, 1 seule formation affichée à cause du bug de durée). | Bons liens (« elle encadre les petits au club de natation »). « accessible dès le bac avec une formation en trois ans » : une durée écrite par le LLM, et fausse. | meilleur |
| **Théo** (ferme maraîchère, serres) | Mécanicien agricole, Aviculteur, Électricien de signalisation ferroviaire | Garde 1 et 3. Remplace Aviculteur (les volailles ne sont pas des serres) par Horticulteur (23ᵉ) ou une piste de maraîchage. | « Tu peux passer des heures à bosser en ferme maraîchère ». « on lui a confié les serres : il conseille les agriculteurs sur l'entretien de leurs équipements » : aucun lien. | meilleur |
| **Sarah** (chevaux, pense à vétérinaire) | Éducatrice nature environnement, Technicienne en agriculture, Pédologue | Retire Pédologue et Technicienne en agriculture. Ajoute Technicienne de production animale (45ᵉ), Technicienne des services vétérinaires (86ᵉ), Cavalière d'entraînement. Auxiliaire vétérinaire et Soigneuse animalière sont non éligibles. | « elle peut passer des heures à soigner les chevaux : elle participe à la mise en place de projets d'agriculture biologique ». « accessible dès bac + 3 » alors que la carte affiche « bac » (faux). | égal |
| **Jade** (croquis, logos, « graphiste ») | Modéliste industrielle, Assistante maîtrise d'œuvre, Photographe | Garde 1. Retire 2 et 3. **Designer graphique, le métier évoqué, est au 13ᵉ rang** [sorti de la présélection par la règle « 1 par métier BMO », puis écarté comme « très proche de Photographe »]. Ajoute aussi Web designer (9ᵉ) ou UX-UI designer (15ᵉ). | « elle crée sur ordinateur montage musique ou dessin ». Le lien vers Photographe tient à peine. | égal |
| **Adam** (foot, entraîne les U9, kiné évoqué) | Éducateur sportif, Technicien forestier, Maître d'hôtel | Garde 1, admet 2. Retire Maître d'hôtel (rang 1 du moteur pour ce profil : un aimant). **Kiné n'est mentionné nulle part** : la mère l'a écrit, et la page de vente promet d'y répondre. | Piste 3 en gabarit (« le personnel relevant de sa responsabilité »). « qu'il peut passer des heures à foot quatre fois par semaine ». | meilleur |
| **Emma** (STMG, caisse, 2 ans, alternance) | Assistante de service juridique, Chargée de promotion touristique, Agente d'exploitation transport de marchandises | Garde 3. Retire 1 : une seule formation, hors de son secteur, sans apprentissage alors qu'Emma veut l'alternance. Ajoute Assistante comptable (70ᵉ) ou Secrétaire comptable (46ᵉ) : un BTS en alternance, le choix évident pour ce profil. | « elle passe du temps à soigner son style : elle crée des brochures ». | meilleur |
| **Kylian** (bac pro commerce, baskets, veut être patron) | Conseiller immobilier, Chargé de location d'engins, Maître d'hôtel | Garde 1. Retire Maître d'hôtel (debout toute la journée, alors qu'il refuse le physique). Ajoute Conseiller commercial (6ᵉ, présent) ou Commercial grands comptes (22ᵉ, présent). | Piste 3 en gabarit (« il aurait à établir un devis »). | égal |
| **Louise** (maths, astronomie, études longues) | Ingénieure énergies renouvelables, Ingénieure qualité, Data analyst | Juste. L'astronomie ne trouve aucun métier : aucune fiche éligible n'en parle (chercheuse, ingénieure spatiale). | « des vidéos d'astronomie : elle étudie la faisabilité de projets solaires » : lien de mots. | égal |
| **Tom** (bac pro cuisine, pâtisserie) | Technicien-cuisiniste, Technicien Datacenter, Installateur solaire | **Retire les trois.** Cuisinier, Pâtissier de restaurant, Pâtissier et Commis sont non éligibles ; Chef de cuisine est exclu (encadrement). Le métier le plus proche de la cuisine dans sa présélection est Maître d'hôtel, au 33ᵉ rang. | « il peut passer des heures à tester des recettes de pâtisserie : il conçoit et installe des cuisines ». | égal (faux dans les deux modes) |
| **Maëlys** (STD2A, couture) | Modéliste industrielle, Technicienne des industries graphiques, Technicienne d'installation d'équipements industriels | Garde 1. Retire 2 (niveau CAP pour une élève de STD2A, 39ᵉ rang) et 3 (raccordements hydrauliques). Ajoute Costumière (10ᵉ, présente, non choisie) ; Couturière et Styliste [exclues à tort par le drapeau « vente »]. | Piste 3 en gabarit, jargon. | meilleur, de peu |
| **Rayan** (Réunion, répare les téléphones) | Technicien Datacenter, Technicien de centrales téléphoniques, Vérificateur de conformité | Correct. La piste 3 est en gabarit. | Bons liens sur la box et les pannes. | égal |
| **Zoé** (BTS commerce abandonné, écoute) | MJPM, Préparatrice en pharmacie, Éducatrice PJJ | Garde 2 et 3. Retire MJPM. Ajoute Assistante sociale ou Éducatrice spécialisée [bug de durée]. Ne tient pas compte de sa 2ᵉ année de BTS presque finie. | « elle s'occupe des autres : elle accompagne les jeunes » : correct. MJPM : « gère les pics d'activité avec un rythme irrégulier », lien vide. | moins bon |
| **Noah** (9 réponses) | Automaticien, Agent de maintenance bureautique, Technicien-cuisiniste | Acceptable pour un profil pauvre. | Piste 3 : « Ce métier ressort de l'ensemble de vos réponses, sans qu'une seule ne suffise à l'expliquer. » Ce texte ne peut pas être livré. | égal |
| **Clara** (langues, Irlande, voyager) | Chargée de projet emploi, Chargée de plaidoyer, Conseillère en formation | Garde 2. Aucune piste ne parle de langues ni d'étranger. Commercial export (168ᵉ), Chargée de relations internationales (116ᵉ), Guide-accompagnatrice (99ᵉ), Traductrice (426ᵉ, à écarter pour l'IA avec sa raison) [la dimension « langues » ne pèse presque rien]. | « Que sa plus grande fierté, c'est d'avoir pris la parole devant d'autres et son année d'échange en Irlande » (deux fois). | égal |

**Récapitulatif conseiller.** Un métier qu'un professionnel proposerait d'emblée existe dans le catalogue, mais n'atteint pas le LLM, pour Léa, Inès, Chloé, Yanis, Jade, Emma, Zoé, Clara et Sarah. Il est hors catalogue pour Tom, Sarah et Adam (kiné). Les pistes à retirer partout : MJPM (2 fois), Maître d'hôtel (2 fois, rang 1 du moteur pour Adam et Kylian), Technicien-cuisiniste (3 fois), Agent d'exploitation du transport (2 fois).

**Au moins une piste inattendue ?** Oui dans la plupart des trios, et souvent la bonne (Électricien de signalisation ferroviaire pour Théo, Manipulatrice pour Manon, Mécanicien agricole pour Nathan). Le défaut inverse domine : trop d'inattendu, et pas assez d'évident juste.

---

## 4. Les problèmes relevés par le développeur : confirmation et rang

Je les confirme tous les quatre. Je les classe autrement : ce qui coûte le plus de remboursements vient des **pistes**, pas des textes.

| Rang | Problème | Confirmé ? | Gravité | Où se corrige |
|---|---|---|---|---|
| 1 | **Métiers attendus absents de la présélection** (non relevé par le développeur, la cause de 4 profils faux) | mesuré (§2.2) | bloquant | présélection, moteur |
| 2 | **Lacune du catalogue** | oui, et plus large que dit : bug de durée des D.E, drapeaux faux | bloquant pour Tom et Sarah, grave ailleurs | données (§6) |
| 3 | **Trios partiels** (7 sur 21) | oui | grave : 19 « pourquoi » sur 126 en gabarit, dont « ressort de l'ensemble » | orchestration, prompt |
| 4 | **Liens qui ne tiennent pas** (environ 1 sur 7) | oui, j'en compte autant | grave : c'est ce que la mère lit en premier | prompt, validateur, charge |
| 5 | **Rappels mal écrits** (une douzaine sur 200) | oui | grave, mais le plus facile à supprimer : il suffit que le code les compose | réparation |

### 4.1 Trios partiels → objectif 0

La relance « choisis un autre candidat » échoue 7 fois sur 8. Le modèle remplace par un code déjà présent (V04) ou garde la paire fautive. Il ne faut plus lui redemander de choisir :
- **schéma** : ajouter au premier appel `secours: string[]`, de 2 à 4 codes de candidats classés après les 3 pistes, sans texte (environ 30 jetons de plus) ;
- **orchestration** : si V05 ou V04, le code retire la piste fautive (la moins bien rangée par le LLM) et prend le premier code de `secours` compatible avec les deux autres. Si aucun ne convient, il prend le meilleur candidat compatible du classement ;
- **relance ciblée** : « Rédige la piste {code} », et non plus « choisis » ; le choix n'est plus en cause, la relance ne porte que sur des textes ;
- **analyse** (`schema.ts`) : refuser tout `remplace` qui pointe vers un code déjà dans le trio ;
- **prompt** (§1, avant « Range les pistes ») : « Dans `secours`, donne 2 à 4 autres candidats que tu retiendrais si l'une de tes pistes devait être remplacée, du meilleur au moins bon. »

Vérification : 0 trio partiel sur les 21 profils. Les pistes ajoutées par le calcul n'existent plus que si le LLM échoue entièrement.

### 4.2 Rappels : c'est au code de les écrire

Le LLM ne doit plus recomposer la réponse du parent. Il choisit `reponse` et `precision` ; le code compose le rappel.
- **Réponse à cases** : la `citation` du questionnaire, telle quelle. Elle est déjà juste : « il garde son calme quand les autres paniquent ».
- **Réponse écrite** : le texte du parent, à peine transformé. Point final retiré, premier mot mis en minuscule, `[prénom]` remplacé par il ou elle. On ajoute une amorce par question, choisie selon le premier mot du texte :
  - texte qui commence par un sujet (il, elle, toute la famille, ses copines…) : sans amorce. « Toute la famille l'appelle quand une prise ou un luminaire ne marche plus. » devient « toute la famille l'appelle quand une prise ou un luminaire ne marche plus » ;
  - `fierte_recit` qui commence par « quand », « le jour où », un nom ou un déterminant : « sa plus grande fierté, c'est » + texte. Cela donne « sa plus grande fierté, c'est le jour où il a organisé, tout seul, un week-end entre copains » (la carte modèle), ou « sa plus grande fierté, c'est son année d'échange en Irlande, partie seule à 16 ans » ;
  - `fierte_recit` qui commence par « Il/Elle a… » : « sa plus grande fierté, c'est le jour où » + texte ;
  - texte sans verbe (« Foot quatre fois par semaine, et il regarde tous les matchs. ») : amorce de la question et guillemets, par exemple « sur son temps libre, c'est « foot quatre fois par semaine, et il regarde tous les matchs » ».
- **La case et le récit ne se combinent jamais.** Si un récit existe pour la question, c'est lui qu'on cite, pas l'option. C'est ce qui produit aujourd'hui « c'est d'avoir pris la parole devant d'autres et son année d'échange en Irlande ».
- **Texte trop long** (plus de 16 mots) : le LLM peut donner `extrait`, un passage **continu** du texte du parent, qui s'arrête sur une ponctuation ou en fin de phrase. Le validateur vérifie que c'est une sous-chaîne exacte d'au moins 4 mots.
- **Version enfant** : même principe. Le `trait_enfant` de la case, tel quel. Pour un texte, une reformulation courte au tutoiement, avec un contrôle de plus : l'amorce « tu peux passer des heures à » doit être suivie d'un infinitif (`/^tu peux passer des heures à (\S+(er|ir|re|oir))\b/`). Sinon, refus. C'est la règle qui manque pour « Tu peux passer des heures à bosser en ferme maraîchère » et « à foot ».

Vérification : aucun rappel fautif dans les 21 bilans ; test unitaire sur les 21 phrases libres de la fixture.

### 4.3 Liens : demander la raison, et la contrôler

Le validateur vérifie que la réponse et le fait existent. Il ne vérifie pas que l'un explique l'autre. Or le code dispose déjà de ce lien : la charge envoie, pour chaque candidat, `proximite`, c'est-à-dire la dimension, les réponses qui la portent et les faits qui la prouvent (`charge.ts`, l. 557). Trois corrections :
1. **Validateur, nouvelle règle T34** : un lien parent est « porté » si sa `reponse` et l'un de ses `faits` figurent dans la même entrée de `proximite`. Au moins deux liens portés par piste ; un seul lien « libre » au plus. Échec, puis relance ciblée sur le texte de la piste ; à la réparation, on supprime le lien libre s'il en reste deux portés. C'est vérifiable par le code, et cela supprime d'un coup « elle cuisine : elle monte les verres » et « soigner les chevaux : agriculture biologique » : aucune dimension ne relie ces deux réponses à ces deux faits.
2. **Charge** : ajouter à chaque entrée de `proximite` un libellé en mots simples de la dimension (« effort physique », « contact avec le public », « travail de précision des mains »). Ajouter aussi une ligne au prompt : « Le "metier" dit, avec un fait concret, ce que ce métier a en commun avec la réponse : la même activité, la même situation ou la même qualité. Pas un fait voisin. » Mauvais : « il est à l'aise en sport : il se rend sur les chantiers ». Bon : « il est à l'aise en sport : c'est un métier où l'on porte, monte et se déplace toute la journée » (si un fait le dit).
3. **Exemple de prompt** : remplacer l'exemple de la Manipulatrice d'électroradiologie, qui a été choisie pour Manon (risque d'aimant), par un métier qui ne sort dans aucune des 21 présélections. Garder Chaudronnier.

T15 (une réponse dans deux pistes au plus) : l'assouplir comme le propose le développeur, dès qu'il y a moins de 6 réponses citables hors contrainte. Ajouter une exception : **la fierté (`coeur`) peut toujours figurer dans la piste 1**. C'est la meilleure raison de la carte modèle.

---

## 5. Erreurs graves (citations exactes et corrections)

**G1. Un métier écarté pour une raison que les pistes ne respectent pas** (`ecartes.ts`). Les deux phrases sont sur la même page.
- Manon, écarté : « Conseillère en économie sociale et familiale (CESF) (K1225) : Le salaire de départ y est proche du Smic : 1 944 € brut par mois en début de carrière ». Piste 1 de la même page : Éducatrice sportive, « 1 867,02 à 2 000 € brut par mois ».
- Sarah, écarté : « Technicienne forestière (A1311) : Le salaire de départ y est proche du Smic : environ 2 000 € brut par mois ». Piste 1 : Éducatrice nature environnement, « 1 802 à 2 240 € ».

Correction : après le choix final, un écarté pour raison de marché (salaire, recrutement, IA) n'est affiché que si **chaque** piste du trio fait strictement mieux sur ce critère. Sinon, passer à l'écarté suivant. Test sur Manon et Sarah.

**G2. Niveau d'études faux dans « Pourquoi ça lui ressemble ».** Sarah, Éducatrice nature environnement : « Et qu'elle est prête à faire jusqu'à 5 ans d'études : c'est accessible dès bac + 3. » La rubrique « Les études » de la même carte affiche « bac ». Manon : « c'est accessible dès le bac avec une formation en trois ans » (une durée en lettres, interdite par le prompt, que T05 ne voit pas).

Correction : **le lien sur les études est écrit par le code, jamais par le LLM** : « c'est accessible dès {niveau affiché}[, jusqu'à bac + {jusqu_a} selon les postes] ». Le LLM indique seulement s'il le place. En plus, T05 doit refuser les nombres en lettres suivis d'une unité (`/\b(un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix) (ans?|années?|mois)\b/i`).

**G3. Fait non sourcé.** Nathan, Installateur solaire : « ce métier se fait souvent en alternance sur les chantiers ». Correction (validateur, T31 élargi) : « souvent », « la plupart », « beaucoup », « en général » sont refusés dans un `metier` si aucun des faits cités ne contient le même mot.

**G4. Durées manquantes pour cinq diplômes d'État** (`durees_formations.json`). `par_mention` n'a de ligne que pour 551001 (D.E Infirmier, 1 formation en apprentissage). Il n'en a pas pour 550001 (D.E Infirmier, 338 formations), 560001 (Assistant de service social, 73), 560002 (Éducateur de jeunes enfants, 62), 560003 (Éducateur spécialisé, 87) ni 560004 (Éducateur technique spécialisé, 16). Pour le type DE, `dureesParMention` ne lit que `par_mention` : ces 576 formations ont une durée inconnue, donc sont « trop longues » dès que le parent répond 3 ans ou moins. Correction : ajouter ces 5 lignes, avec les pages Onisep déjà lues pour 551001 et 561001, ou indexer `par_mention` par intitulé. Vérification : Infirmière montre au moins 3 formations dans le Grand Est pour Manon.

**G5. Le métier évoqué par le parent est maltraité.**
- Jade : « Designer graphique (E1205) : C'est un métier très proche de « Photographe professionnelle », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix. » La mère a écrit « graphiste ». Le métier est 13ᵉ et répond à trois de ses phrases (croquis, logos, affiche). On le sacrifie à une piste de rang 55.
- Adam : « Kinésithérapeute » évoqué, et rien sur la page. La page de vente dit : « Plus besoin de lancer un « tu pourrais être kiné » en espérant qu'il accroche. »

Corrections :
- (présélection) un métier évoqué, éligible et qui passe les filtres entre toujours dans les candidats ;
- (validateur, V10) si un candidat `evoque` est dans la présélection, aucune piste ne peut lui être incompatible, sauf si ce candidat est lui-même retenu ;
- (écartés) pour un métier évoqué **non éligible**, appliquer quand même les filtres dont la donnée existe. Kinésithérapeute a un niveau sourcé (RNCP40025, « bac + 5 » dans `metier_formations.json`) : « Kinésithérapeute : il faut 5 ans d'études après le bac, et vous avez répondu « 3 ans » ». Si aucun motif n'est sourcé, une phrase honnête : « Kinésithérapeute : nous n'avons pas encore assez de données officielles sur ce métier pour en faire une piste. »

**G6. Textes qu'on ne peut pas livrer à 27 €.**
- Noah, piste 3 : « Ce métier ressort de l'ensemble de vos réponses, sans qu'une seule ne suffise à l'expliquer. » ;
- exemple, piste 3, version enfant : « Tu vises trois ans d'études au plus : tu peux y accéder dès bac + 2. » (seule phrase) ;
- Maëlys, gabarit : « elle serait aussi amenée à faire preuve d'appétence pour l'utilisation de logiciels numériques et de nouvelles technologies ».

Correction : la règle de 4.1 supprime presque tous ces cas. En plus (composer) : une version enfant sans aucun lien de trait n'est jamais publiée. On reprend alors les liens parent validés, transposés par le code (`citation` vers `trait_enfant`, verbe du métier au conditionnel), ou on retire la rubrique pour cette piste.

**G7. Filtre d'expérience trop étroit** (`acces_metiers`). IBODE (J1504) est dans la présélection de Léa, au 6ᵉ rang, alors que le texte ROME dit : « Suite au Diplôme d'Etat d'infirmier ou de sage-femme et 2 ans d'activité professionnelle, il est possible de faire la spécialisation ». Ajouter « activité professionnelle » et « d'exercice » aux motifs du filtre d'expérience, et relancer l'extraction. Même famille : « Le Permis D est obligatoire » (N4204). Il faut le signaler comme une condition d'accès, au même titre que l'expérience : un lycéen de 16 ans doit le savoir.

**G8. Drapeaux faux sur des filtres durs** (`dimensions_metiers.json`, étiquetage 2.5). B1803 Couturière : `vente`. B1805 Styliste : `vente` et `bureau_toute_la_journee`. K1217 Animateur socioéducatif : `bureau_toute_la_journee`. N4204, poste de régulation au bureau : aucun de ces drapeaux. Un faux positif fait disparaître la meilleure piste sans laisser de trace. Correction : les drapeaux `vente` et `bureau_toute_la_journee` d'origine `llm` ne deviennent des filtres durs que s'ils sont confirmés par un fait ROME (contexte de travail « En bureau » ; savoir-faire contenant « vend », « commercial »). Sinon, ce sont des pénalités. Relire à la main les 30 métiers les plus souvent présélectionnés.

---

## 6. Le catalogue : ce qui se corrige avec les données présentes

Constat (`catalogue.json`) : 545 éligibles, 1 378 non éligibles. 906 n'ont pas de formation reliée, 906 pas de salaire, 201 pas de niveau d'études (les manques se recoupent).

### 6.1 Corrigeable tout de suite, avec Parcoursup, le ROME et le RNCP du dépôt

| Métier | Ce qui manque | Correction, données présentes |
|---|---|---|
| Infirmière, Éducatrice spécialisée, Assistante sociale, Éducatrice de jeunes enfants, Éducatrice technique spécialisée | durée de la mention D.E (G4) | ajouter les lignes, mêmes pages Onisep |
| Orthoptiste (J1407) | formation : le ROME dit « Diplôme d'État d'orthoptiste », Parcoursup « Certificat de capacité d'Orthoptiste » (19 formations, type DE) | alias d'intitulé, méthode `manuel` sourcée |
| Kinésithérapeute (J1404) | formation : les IFMK recrutent après une première année universitaire | règle `manuel`, comme pour les études MMOP : PASS, LAS, et les licences de Parcoursup dont l'intitulé dit « accès kiné » ou « Kinésithérapie » (une vingtaine). Niveau bac + 5 (RNCP40025) : écarté pour 3 ans, mais au moins expliqué (G5) |
| Puéricultrice (J1507) | formation : la spécialisation suit le D.E Infirmier | relier au D.E Infirmier si le texte d'accès ROME cite ce prérequis (à vérifier fiche par fiche), avec la durée totale |
| Cuisinier (G1609), Pâtissier de restaurant (G1610) | formation : CAP, BP, certificat de spécialisation, rien sur Parcoursup | le BTS Management en hôtellerie restauration (237 formations, 157 en apprentissage) mène à la production culinaire. Il est relié aujourd'hui à Chef de cuisine (G1601), qui est la mobilité ROME de Cuisinier. Relier G1609 et G1610 à cette mention par la mobilité ROME est défendable, mais c'est un lien indirect : **à arbitrer par le propriétaire**. Pour Tom, c'est exactement la poursuite d'études qu'un conseiller lui proposerait |

### 6.2 Corrigeable avec une source déjà utilisée (CIDJ, page par page)

Salaires manquants pour des métiers que les parents nomment : Sage-femme (J1104), Avocat (K1915), Développeur de jeux vidéo (M1831), Concepteur de jeux vidéo (E1125), Chef de projet jeux vidéo (E1115), Animateur 2D/3D (L1510), Pédicure-podologue (J1409), Développeur multimédia (M1837), Guide-interprète (G1227). Lancer `recuperer_cidj.py` sur cette liste, en recopiant chaque page avec son URL, comme pour les autres. Jamais de mémoire.

### 6.3 Pas corrigeable sans décision ni nouvelle source

CAP, BP, bac pro, D.E aide-soignant, D.E auxiliaire de puériculture et titres professionnels ne sont pas sur Parcoursup. Sont concernés : boulanger, pâtissier (D1104), boucher, fleuriste, plombier, maçon, carrossier, serveur, aide-soignant, auxiliaire de puériculture, auxiliaire vétérinaire, soigneur animalier, toiletteur, palefrenier. Deux voies, à soumettre au propriétaire (`DECISIONS.md`) :
1. **Admettre une certification RNCP comme « formation »** pour ces métiers. Le diplôme est déjà relié et sourcé dans `metier_formations.json`, par exemple « CAP Cuisine, RNCP38430 ». La carte afficherait « CAP Cuisine (2 ans, en lycée professionnel ou en apprentissage) », avec le lien vers la fiche RNCP de France compétences, mais **sans établissement**. C'est contraire à la lettre de la page de vente (« avec leur fiche Parcoursup »), mais juste pour un élève de bac pro ou en réorientation.
2. **Ajouter une source d'établissements**. Le « Catalogue des formations en apprentissage » du réseau des Carif-Oref est publié sur data.gouv.fr, sous licence ouverte ; il couvre CAP, BP, titres et la plupart des centres de formation. Pour les formations en lycée professionnel et les instituts paramédicaux (IFAS, IFAP), il faudrait l'Onisep, inaccessible en 1.1 (403) : retenter par le jeu « Idéo – formations initiales » de data.gouv.fr. Tâche de données de 2 à 4 heures, hors du tour 2 du conseiller.

Avis de conseiller : la voie 1 suffit pour la V1, à une condition. Ces pistes ne se proposent qu'aux profils pour qui un CAP ou un BP a du sens : bac pro, réorientation, « le moins possible » d'études, alternance idéale. Pour un élève de Seconde générale qui accepte 5 ans d'études, ce ne serait pas rendre service.

### 6.4 À vérifier hors du dépôt avant toute règle

MJPM (K1102) : le texte ROME ne cite que la licence professionnelle et le certificat national. D'après mon expérience de conseiller, l'accès au certificat demande un âge minimum et une expérience professionnelle. **À vérifier sur Légifrance** (Code de l'action sociale et des familles, partie réglementaire sur les mandataires) avant d'ajouter une règle `manuel` sourcée. En attendant, le prompt peut ajouter : « un métier qu'on n'exerce qu'après une première carrière n'est pas un premier métier ».

---

## 7. Autres constats, moins graves

- **Aimants** : Conducteur de travaux forestiers est dans 10 présélections sur 21, Maître d'hôtel dans 9 (rang 1 du moteur pour Adam et Kylian). Urbaniste, Préparatrice en pharmacie, Installateur solaire et Conducteur de travaux du bâtiment sont dans 7 chacun, Agent d'exploitation du transport de personnes dans 6. Il faut augmenter la pénalité `aimants.ts` en la calculant aussi sur les 21 profils, et vérifier pourquoi Maître d'hôtel obtient une affinité élevée sur des dimensions génériques (groupe, accueil).
- **Le moteur ne pèse pas les langues** : Traducteur est 426ᵉ et Interprète 363ᵉ pour Clara (LLCER, séries en VO, un an en Irlande). Même pour l'écarter à cause de l'IA, il faudrait qu'il soit bien classé. À vérifier dans `dimensions` : la réponse `matieres=langues` et la spécialité LLCER doivent nourrir une dimension que les fiches ROME portent (« anglais », « international », « étranger »).
- **`ce_qui_compte = gagner`** n'est qu'un départage « à mérite égal ». Inès reçoit une piste à 1 802 € pour une seule raison : elle a négocié le voyage de classe. Prompt (§1) : « Si bien gagner sa vie compte pour l'enfant, n'en retiens pas plus d'une dont `marche.salaire_niveau` vaut "bas". »
- **Temps des verbes, version enfant** : présent et conditionnel mélangés dans une quinzaine de textes sur 63. Validateur : dans `pourquoi_enfant`, le premier verbe après « tu » doit être au conditionnel (`/^(ici, )?tu \S*(rais|rait)\b/`). Sinon, réparation par le code pour les verbes du premier groupe (« tu conçois » donne « tu concevrais »), relance pour les autres.
- **« Les études » sous le niveau de l'enfant** : « CAP ou équivalent (avant le bac) » pour Nathan et Théo, qui ont déjà le bac ou le préparent, avec des BTS dans la liste. Afficher « accessible avec son bac » quand le niveau minimum est inférieur à sa situation.
- **Salaires** : centimes (« 1 867,02 € ») à arrondir à l'euro au rendu. Fourchettes d'offres très larges (« 1 896 à 7 448 € ») : la borne haute des offres n'est pas un salaire de début. Préférer le niveau 1 (début de carrière) quand il existe, sinon afficher « à partir de {min} € ».
- **« Et l'IA ? »** : 35 phrases au même moule. C'est secondaire, mais le prompt pourrait demander de commencer par ce qui reste au métier une fois sur deux.
- **Réorientation** : Zoé est en 2ᵉ année de BTS ; aucune piste ne tient compte d'un diplôme presque acquis. À noter pour une version future (passerelles), pas pour ce tour.
- **Données du test d'acceptation** : SPEC §5.9 passe (Chargé d'affaires BTP 1ᵉʳ, Conducteur de travaux 10ᵉ). Je propose d'ajouter une attente plus exigeante, qui ne coûte rien : dans l'exemple, la piste 1 cite la fierté.

---

## 8. Liste ordonnée des corrections pour le tour 2

Ordre : d'abord tout ce qui se fait **sans appel** (code et données, mesuré hors ligne sur les 21 profils), puis **un seul passage réel**.

| # | Correction | Où | Vérification hors ligne |
|---|---|---|---|
| 1 | Durées des 5 mentions D.E (G4) | `durees_formations.json` | Infirmière, au moins 3 formations dans la région pour Manon |
| 2 | Écartés cohérents avec le trio (G1) | `ecartes.ts` | Manon et Sarah sans contradiction |
| 3 | Lien d'études écrit par le code, nombres en lettres refusés (G2) | `composer.ts`, validateur T05 | aucun « bac + N » différent de la rubrique « Les études » |
| 4 | Métier évoqué : toujours présélectionné, V10, écarté expliqué même non éligible (G5) | `preselection.ts`, validateur, `ecartes.ts` | Designer graphique pour Jade ; phrase sur le kiné pour Adam |
| 5 | Présélection 14 + 3 + 3, rang 40 au plus (§2.2) | `preselection.ts` | aucun candidat au-delà du 40ᵉ rang hors exceptions ; ASS, ES et CESF présents pour Chloé ; Designer graphique ou Web designer pour Jade |
| 6 | Candidats des mots du parent (§2.1) | `preselection.ts`, `profil.ts`, `charge.ts`, prompt | Monteur vidéo pour Yanis ; Costumière ou Couturière pour Maëlys ; un métier du cheval ou de la production animale pour Sarah ; Éducatrice de jeunes enfants pour Léa |
| 7 | Drapeaux `vente` et `bureau` confirmés par un fait ROME (G8), filtre d'expérience élargi (G7) | étiquetage 2.5, `acces_metiers` | Couturière et Styliste rendues à Maëlys ; IBODE hors de la présélection de Léa |
| 8 | Catalogue, partie données présentes (§6.1) ; salaires CIDJ (§6.2) | `scripts/data/` | Orthoptiste et Kinésithérapeute éligibles ; nombre d'éligibles en hausse dans `DATA_REPORT.md` |
| 9 | Aimants recalculés sur les 21 profils (§7) | `aimants.ts`, `panel_moteur` | Maître d'hôtel et Conducteur de travaux forestiers dans moins de 5 présélections |
| 10 | `secours` et choix par le code, relance « rédige » (§4.1) | `schema.ts`, `index.ts`, prompt | tests d'orchestration avec un rejeu V05 et V04 simulé |
| 11 | Rappels composés par le code (§4.2) | `reparation.ts`, `composer.ts`, prompt §5 et §6 | test sur les 21 phrases libres ; plus aucun rappel dans les sorties gardées du tour 1 |
| 12 | T34 « lien porté par une proximité », libellé de dimension, consigne « même activité, situation ou qualité », exemple de prompt changé (§4.3) | validateur, `charge.ts`, prompt | rejeu des réponses du tour 1 : les liens cités au §2.2 d'`EVAL.md` sont tous refusés |
| 13 | T15 assoupli, la fierté toujours permise en piste 1 ; conditionnel enfant ; « souvent » non sourcé (G3) ; `gagner` | validateur, prompt | rejeu : l'exemple cite la fierté en piste 1 |
| 14 | Version enfant jamais vide de traits (G6) | `composer.ts` | aucune version enfant réduite au lien d'études |
| 15 | Passage réel : 21 profils, `VERSION_PROMPT` 5 | `scripts/evaluation.ts --tour tour2 --plafond 49` | voir ci-dessous |

**Budget du tour 2.** 21 premiers appels, plus au plus une relance par profil : 42 au maximum, sous le plafond de 49. Les 7 de marge servent à repasser jusqu'à 3 profils si une correction de code est nécessaire en cours de route. Avec `secours`, la relance n'est plus qu'une rédaction : il faut s'attendre à environ 30 appels.

**Critères pour un VALIDÉ au tour 2** (mesurés dans `EVAL.md`) :
- 0 trio partiel ; « pourquoi » au gabarit sous 5 % ;
- 0 rappel fautif ; au plus 1 lien sur 20 sans raison à la relecture ;
- aucune contradiction entre écartés et pistes, ni entre le lien d'études et la rubrique « Les études » ;
- pour **chaque** profil, au moins une piste qu'un conseiller proposerait d'emblée. Il faut donc au moins un métier attendu du §3 dans la présélection pour 19 profils sur 21 (Tom et Sarah peuvent dépendre de la décision du §6.3) ;
- l'exemple : Chargé d'affaires BTP ou Conducteur de travaux en piste 1, avec la fierté citée ;
- le métier évoqué est retenu, ou bien écarté avec une raison sourcée, dans les 4 profils où il existe.

Pour mesurer le 4ᵉ critère sans appel, je conseille d'ajouter à la fixture un champ `attendus_conseiller` : 2 à 4 codes par profil, tirés du §3. Il faut aussi une colonne « attendus présents dans la présélection » dans `EVAL.md`. C'est le seul indicateur qui mesure la justesse plutôt que la conformité.

---

## 9. Verdict

**À REVOIR.**

Les contrôles automatiques sont verts, et le travail d'évaluation est rigoureux. Mais, en conseiller, je ne signerais pas 4 bilans sur 21 : Tom, Sarah, Jade et Maëlys. J'hésiterais sur 10 autres. Il reste aussi des erreurs graves visibles par le parent : écartés contradictoires (G1), niveau d'études faux (G2), métier évoqué sacrifié ou ignoré (G5), textes inachevés (G6). Les corrections les plus rentables ne coûtent aucun appel LLM : la présélection, les mots du parent, le bug des durées D.E, les drapeaux et le métier évoqué. Elles se mesurent entièrement hors ligne avant le seul passage réel du tour 2.
