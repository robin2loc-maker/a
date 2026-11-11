# Cahier des charges — Bilan 3 Pistes, V1

À lire avec `CLAUDE.md` (règles) et `docs/page-de-vente.md` (la promesse faite au client).

## 0. Ce que la page de vente promet, donc ce que le produit doit faire

| Promesse de la page | Exigence produit |
|---|---|
| « Environ 10 minutes, sur votre téléphone. Sans lui. » | Questionnaire parent mobile, de 8 à 12 minutes, sans l'enfant |
| « Il est plus à l'aise seul ou en groupe ? », « Dans quelle situation l'avez-vous vu le plus fier de lui ? », « Combien d'années d'études est-il prêt à faire ? » | Ces trois questions figurent dans le questionnaire, mot pour mot (accordées en il / elle) |
| « Vous n'avez rien à chercher : les réponses, vous les avez déjà » | Questions d'observation du quotidien, pas d'introspection ni de culture métier. « Je ne sais pas / passer » possible |
| « compare vos réponses à ce que les gens font vraiment, au quotidien, dans plus de 1 900 métiers » | Base métiers issue du ROME (France Travail), décrite par dimensions de travail réel |
| « Il écarte ce qui n'est pas réaliste pour lui, et les métiers qui recrutent peu, paient mal, ou que l'IA risque de fragiliser » | Filtres : durée d'études, recrutement (BMO), salaire, exposition à l'IA |
| « Quelques minutes plus tard, vous recevez ses trois pistes » | Génération en moins de 60 secondes, avec un écran d'attente honnête |
| Pour chaque piste : « le métier expliqué simplement, ce qu'on y gagne, les études pour y arriver, et surtout : pourquoi ça lui ressemble » | Carte piste au format de l'exemple « Conducteur de travaux » de la page de vente, avec en plus « Ça recrute ? » et « Et l'IA ? » |
| « Les deux autres pistes peuvent être très différentes. C'est voulu » | Contrainte de diversité entre les 3 pistes |
| « Y compris celles dont il n'a jamais entendu parler » | Au moins une piste hors des métiers les plus connus |
| « Les formations qui y mènent, avec leur fiche Parcoursup » | Formations réelles avec lien vers leur fiche Parcoursup, proches du département si possible |
| « Les métiers proches que nous avons écartés, et pourquoi » | 3 à 5 métiers bien classés mais exclus, avec la raison |
| « Le guide "Comment lui en parler" : comment amener le sujet sans qu'il se braque » | Page guide, imprimable |
| « Un lien à lui envoyer, pour qu'il explore ses pistes de son côté » | Page enfant en tutoiement, partageable (WhatsApp, SMS, copie du lien) |
| « Chaque chiffre vient de sources officielles » | Chaque chiffre est stocké avec sa source, affichée en petit |
| « nous ne touchons rien des écoles » | Aucune école mise en avant pour de l'argent, aucun lien affilié |
| « 27 €. Une seule fois, sans abonnement » et option 17 € « autant de bilans que vous voulez, pour tous vos enfants » | Paiement unique, case d'option à la commande, accès illimité 3 mois |
| Garantie 30 jours, remboursement par email | Email de support affiché (variable `SUPPORT_EMAIL`), pas de remboursement automatisé |
| FAQ : « Le questionnaire vous demande où il en est » (réorientation) | Gestion des élèves déjà dans le supérieur |
| FAQ : « vous pouvez la passer » | Chaque question d'observation peut être passée |
| FAQ : « sur une page à vous, avec un lien à lui envoyer » | Page de résultats permanente, accessible par un lien à jeton non devinable |

## 1. Parcours et routes

Mode par défaut `FUNNEL_MODE=pay_first`. Le mode `quiz_first` est un bonus.

1. `/` : page de vente.
2. `/commande` : récapitulatif, email, case d'option (17 €), case de renonciation au droit de rétractation (obligatoire), bouton de paiement.
3. Stripe Checkout, ou `/paiement-simule` en mode démo.
4. `/merci` : confirmation, puis bouton « Commencer le questionnaire ». L'email de confirmation contient le lien de reprise.
5. `/questionnaire/[token]` : le questionnaire, avec sauvegarde automatique et reprise possible.
6. `/generation/[token]` : écran d'attente (étapes réelles : analyse des réponses, comparaison avec les métiers, vérification des formations), puis redirection.
7. `/resultats/[token]` : page parent.
8. `/pistes/[token]` : page enfant.
9. `/guide/[token]` : le guide « Comment lui en parler ». Une version sans jeton peut exister pour l'aperçu.
10. `/espace/[token]` : espace « accès illimité » (option), pour lancer de nouveaux bilans jusqu'à expiration.
11. Pages légales : `/mentions-legales`, `/cgv`, `/confidentialite`, `/cookies`.
12. `/admin` : protégé par `ADMIN_PASSWORD`.

**Jetons** : 128 bits d'aléa minimum, encodés en URL-safe, jamais séquentiels.

## 2. Page de vente (`/`)

- Reproduire fidèlement `docs/page-de-vente.md`. **Ne pas réécrire le texte.** Une coquille évidente se corrige et se note dans `DECISIONS.md` ; tout autre doute se note sans toucher au texte.
- Look « article de presse » (advertorial) :
  - colonne de 680 px maximum ;
  - corps en 18 px minimum ;
  - titres à empattement possibles ;
  - contraste élevé ;
  - sobre, crédible pour un public de 45 ans et plus. Pas d'esthétique « startup », pas de dégradés criards.
- Les graphiques PISA sont dans `public/images/`.
- Les marqueurs `==🔵…==` deviennent des blocs visuels :
  - **images** : des placeholders propres avec le libellé du marqueur ;
  - **encadré de l'exemple « Conducteur de travaux »** : une vraie carte, identique au composant des résultats. Réutilise le composant.
  - **boutons** : de vrais boutons vers `/commande`.
- Barre d'appel à l'action collante en bas sur mobile, une fois la section prix dépassée.
- Performance :
  - page statique (server components) ;
  - JavaScript client limité au bandeau cookies, au pixel et aux boutons ;
  - LCP inférieur à 2,5 s en 4G simulée.

## 3. Commande

- Prix : 27 € TTC. Option : 17 € TTC, soit 44 € avec l'option.
- Case d'option, décochée par défaut : « Oui, j'ajoute l'accès illimité pendant 3 mois (+17 €) : autant de bilans que je veux, pour tous mes enfants. »
- Case obligatoire : « Je demande l'accès immédiat au bilan et je reconnais perdre mon droit de rétractation une fois le contenu fourni. La garantie de 30 jours s'applique. »
- Stripe Checkout (`mode=payment`), webhook `checkout.session.completed` avec vérification de signature. Une commande payée crée un « bilan » avec son jeton.
- On stocke sur la commande : UTM, fbclid, cookies `_fbc` et `_fbp`, montant, option prise ou non.

## 4. Questionnaire

### Principes

- **Observation, pas introspection.** On demande au parent ce qu'il **voit** : comportements, situations, habitudes. Jamais « Qu'est-ce qu'il veut faire ? ». C'est la raison d'être du produit (Connelly & Ones 2010).
- **Format** :
  - de 25 à 32 questions, en 8 à 12 minutes. Afficher l'estimation et la barre de progression ;
  - une question par écran, réponse en un geste la plupart du temps, retour arrière possible ;
  - sauvegarde automatique à chaque réponse ;
  - « Je ne sais pas / passer » sur toutes les questions d'observation.
- **Contenu** :
  - au maximum 2 questions en texte libre, facultatives ;
  - aucune donnée de santé ni de handicap (données sensibles au sens du RGPD).
- **Rédaction** : règles de `CLAUDE.md`. Options équilibrées, non orientées, sans jugement. Aucune option ne doit faire passer l'enfant pour « moins bien ».
- **Documentation** : chaque question est reliée à une ou plusieurs dimensions, avec des poids. Cette correspondance est documentée dans `docs/QUESTIONNAIRE.md`, avec la raison d'être de chaque question.
- **Stockage** : les questions sont définies comme données (fichier typé), pas en dur dans les composants.

### Blocs (à finaliser par toi ; exemples de formulation)

**A. Situation** (rapide)
- prénom (facultatif) ;
- « il » ou « elle » ;
- classe : Seconde, Première générale, Première technologique, Terminale générale, Terminale technologique, bac pro, déjà dans le supérieur (quelle formation, quelle année), autre ;
- spécialités ou série, selon la classe ;
- département ;
- mobilité : rester proche, partir dans la région, partout en France.

**B. Contraintes réalistes**
- « Combien d'années d'études est-il prêt à faire ? » (obligatoire, mot pour mot ; options : 2 ans, 3 ans, 5 ans, plus, je ne sais pas) ;
- l'alternance : oui, pourquoi pas, non ;
- écoles privées payantes envisageables : oui, non ;
- résultats scolaires globaux. Contrainte douce seulement, pour les formations très sélectives ;
- matières où il est le plus à l'aise ;
- domaines qu'il rejette clairement (exclusions dures) : le sang ou les soins, les chiffres, la vente, le travail de nuit ou le week-end, l'effort physique, rester au bureau toute la journée…

**C. Observation du quotidien** (le cœur, environ 18 questions). Exemples de thèmes :
- « Il est plus à l'aise seul ou en groupe ? » (mot pour mot) ;
- « Quand ses proches lui demandent de l'aide, c'est plutôt pour quoi ? » : réparer ou installer, expliquer, organiser, écouter ou conseiller, créer (dessin, vidéo), calculer ou gérer de l'argent… 2 choix maximum ;
- « Dans quelle situation l'avez-vous vu le plus fier de lui ? » (mot pour mot, texte libre court, facultatif) ;
- son temps libre, quand personne ne lui demande rien (3 choix maximum) ;
- face à un problème (objet en panne, exercice difficile) : il cherche seul, demande de l'aide, regarde un tuto, laisse tomber vite… ;
- rester assis longtemps ;
- le stress et l'urgence ;
- l'organisation ;
- l'aisance avec des adultes qu'il ne connaît pas ;
- son rôle dans un groupe : prend les choses en main, propose des idées, fait le lien, suit, reste en retrait ;
- dehors ou à l'intérieur ;
- les chiffres ;
- l'écrit et l'oral ;
- les écrans : utiliser, ou comprendre comment ça marche ;
- s'occuper des autres ;
- règles et procédures, ou faire à sa façon ;
- routine ou variété ;
- le concret ou les idées.

**D. Ce qui compte pour lui** (selon vous) : bien gagner sa vie, être utile, être indépendant, la sécurité de l'emploi, créer, bouger ou voyager. 2 choix maximum.

**E. Facultatif** : « Y a-t-il un métier dont il parle, ou dont il a déjà parlé ? » (texte libre). Ce métier n'est pas imposé. S'il est bien classé mais écarté, il apparaît dans « métiers proches écartés », avec la raison.

## 5. Moteur de recommandation

**1. Profil.** Les réponses donnent un vecteur sur une vingtaine de dimensions :
- les 6 dimensions d'intérêts façon Holland (Réaliste, Investigateur, Artistique, Social, Entreprenant, Conventionnel), sans jamais les nommer dans l'interface ;
- seul / équipe ;
- contact public ;
- terrain / extérieur / bureau ;
- physique / sédentaire ;
- manuel / technique / intellectuel ;
- précision ;
- responsabilité / leadership ;
- créativité ;
- aide aux personnes ;
- chiffres / données ;
- écrit / oral ;
- stress / urgence ;
- routine / variété ;
- horaires atypiques.

**2. Métiers.** Chaque métier ROME est décrit sur les mêmes dimensions :
- d'abord par une correspondance **déterministe** depuis les données ROME (contextes de travail, savoir-être, compétences) ;
- pour les trous seulement, étiquetage par LLM (`method: "llm"`), selon une grille écrite, par lots, avec un contrôle de cohérence (ré-étiqueter 30 métiers et mesurer l'accord).

**3. Filtres durs** :
- niveau d'études minimum supérieur au maximum accepté ;
- exclusions déclarées ;
- métier non éligible (données manquantes, voir `CLAUDE.md` §3).

**4. Score** : similarité entre le profil et le métier, puis :
- pénalités : recrutement faible, salaire de début bas, exposition à l'IA élevée ;
- léger bonus « méconnu », pour avoir au moins une piste hors des métiers les plus connus.

**5. Diversité** : les 3 pistes appartiennent à des familles de métiers différentes. Pas trois variantes du même métier.

**6. Écartés** : 3 à 5 métiers bien classés pour l'affinité mais exclus par un filtre, chacun avec sa raison en une phrase.

**7. Explications** « Pourquoi ça lui ressemble » :
- 3 ou 4 liens « vous avez dit que… → dans ce métier… », générés par gabarits à partir des dimensions qui ont le plus pesé ;
- si une clé API existe, le LLM reçoit les ~15 meilleurs candidats, les réponses et les données vérifiées. Il choisit les 3 pistes en respectant la diversité, puis reformule ;
- sortie en JSON strict, passée au validateur (`CLAUDE.md` §3). En cas d'échec, gabarits ;
- **ne jamais envoyer au LLM** le prénom, l'email ou une autre donnée identifiante. Remplacer par « l'enfant » et réinjecter après.

**8. Fonctions pures, testées unitairement.** Résultat reproductible pour des réponses identiques, hors LLM.

**9. Évaluation** :
- 20 profils de parents fictifs mais réalistes, plus le profil de l'exemple de la page de vente ;
- `docs/EVAL.md` donne, pour chaque profil, les 3 pistes, les écartés et les contrôles automatiques : études compatibles, diversité, aucune donnée manquante affichée, aucun chiffre non sourcé ;
- **test d'acceptation** : avec les réponses de l'exemple (plus à l'aise en groupe, fier d'avoir organisé seul un week-end entre copains, n'aime pas rester assis, 3 ans d'études maximum), « conducteur de travaux » ou un métier très proche doit figurer dans les 10 meilleurs candidats.

## 6. Page résultats parent (`/resultats/[token]`)

- En-tête : « Les 3 pistes de [Prénom] », et la date.
- **3 cartes piste**, structure identique à l'exemple de la page de vente :
  - **nom du métier** ;
  - **Le métier, simplement** : 2 à 4 phrases ;
  - **Ce qu'on y gagne** : salaire de début de carrière, en fourchette si disponible, avec la source et l'année ;
  - **Les études** : diplômes concrets et durée, alternance possible ou non, puis 3 à 6 formations réelles avec ville et lien vers la fiche Parcoursup, proches du département en priorité ;
  - **Ça recrute ?** : chiffre BMO et source ;
  - **Et l'IA ?** : niveau d'exposition et une phrase honnête, source ;
  - **Pourquoi ça lui ressemble** : citations de ses réponses.
- **Métiers proches écartés, et pourquoi.**
- Bloc **« Et maintenant ? »** : 3 actions simples :
  - lire le guide ;
  - envoyer le lien à l'enfant ;
  - repérer une journée portes ouvertes (lien vers les fiches Parcoursup).
- Boutons : « Envoyer à [Prénom] » (Web Share API, avec repli WhatsApp, SMS, copie du lien), « Lire le guide », « Imprimer ».
- Les sources sont affichées en petit sous chaque chiffre. Une ligne en bas de page : « Données : France Travail, Onisep, Parcoursup… (millésimes) ».

## 7. Page enfant (`/pistes/[token]`)

- Tutoiement, ton sobre, lisible en 2 minutes.
- Les mêmes 3 pistes, avec métier, salaire, études, formations et liens.
- « Pourquoi ça pourrait te correspondre » : traits **positifs ou neutres uniquement**, reformulés sans attribuer de jugement au parent. Jamais « ta mère a dit que… », jamais de trait négatif (« désorganisé »…).
- Aucune réponse brute du parent, aucun métier écarté.

## 8. Guide « Comment lui en parler »

Une page imprimable, de 600 à 900 mots, selon les règles de rédaction. Plan :

1. **Le bon moment** : un moment calme, comme le repas. Pas juste avant un contrôle ni pendant un conflit.
2. **Présenter plutôt qu'interroger** : apporter les 3 pistes, ne pas le questionner sur ce qu'il veut faire.
3. **Ce qu'on peut dire** : phrases d'exemple, naturelles.
4. **Ce qu'on évite** : imposer, comparer avec un frère, une sœur ou un cousin, insister le soir même.
5. **S'il se braque** : laisser le lien, en reparler plus tard sans pression.
6. **La suite** : regarder une formation, une journée portes ouvertes, parler à quelqu'un qui fait le métier.

Aucune affirmation non sourcée, aucune statistique.

## 9. Option « accès illimité 3 mois »

- Lien magique par email vers `/espace/[token]`.
- Lancer autant de nouveaux bilans que voulu jusqu'à la date d'expiration (achat + 90 jours), voir ses bilans, expiration affichée.

## 10. Emails (transactionnels uniquement)

1. Confirmation de commande, avec le lien du questionnaire (reprise possible).
2. Résultats prêts, avec le lien des résultats, le lien enfant et le lien du guide.
3. Option : accès à l'espace.
4. Relance si le questionnaire n'est pas terminé après 24 h. Une seule fois.

Pas d'email marketing (consentement RGPD). Expéditeur via `EMAIL_FROM`, support via `SUPPORT_EMAIL`.

## 11. Admin (`/admin`)

- **Entonnoir** : visites → commande commencée → payée → questionnaire commencé → terminé → résultats vus → lien enfant ouvert.
- **Abandon question par question.**
- Taux de prise de l'option.
- Liste des commandes. Export CSV anonymisé en bonus.
- Événements stockés en base, sans donnée personnelle dans les logs.

## 12. Tracking Meta (essentiel : tout le trafic vient de Meta Ads)

- Pixel Meta (`NEXT_PUBLIC_META_PIXEL_ID`), **chargé uniquement après consentement** (exigence CNIL, bandeau cookies avec « Refuser » aussi visible que « Accepter »).
- **Événements** :
  - `PageView` ;
  - `ViewContent` : 50 % de la page de vente lus ;
  - `InitiateCheckout` : arrivée sur `/commande` ;
  - `Purchase` : `value` 27 ou 44, `currency` EUR.
- **API Conversions côté serveur** pour `Purchase` (`META_CAPI_TOKEN`), avec `event_id` partagé pour la déduplication, et email haché en SHA-256.

## 13. Légal et RGPD (gabarits à faire valider par un juriste)

- **Mentions légales** : champs à remplir `[RAISON SOCIALE]`, `[FORME]`, `[SIRET]`, `[ADRESSE]`, `[DIRECTEUR DE PUBLICATION]`, `[HÉBERGEUR]`, `[EMAIL]`.
- **CGV** : produit numérique, prix TTC, livraison immédiate, renonciation expresse au droit de rétractation pour un contenu numérique fourni immédiatement (Code de la consommation, article L221-28 ; formulation à faire valider), garantie commerciale de 30 jours, médiation de la consommation `[MÉDIATEUR]`.
- **Confidentialité** :
  - les réponses portent sur un mineur et sont fournies par le parent : minimisation ;
  - base légale : exécution du contrat ;
  - conservation des réponses : 12 mois, puis anonymisation. C'est une décision à valider : la noter dans `DECISIONS.md` ;
  - droits d'accès et d'effacement par email ;
  - sous-traitants : hébergeur, Stripe, Resend, Anthropic si activé, Meta si consentement ;
  - transferts hors UE et clauses contractuelles types.
- Bandeau en tête de chaque gabarit : « À FAIRE VALIDER ».

## 14. Design

- Sobre, rassurant, lisible : texte de 17 px minimum dans l'application, boutons de 48 px de haut minimum, contraste AA.
- Palette calme (bleu nuit, une couleur d'accent chaude pour les boutons). Une seule police lisible plus, éventuellement, une police de titres.
- Mobile d'abord. Tester à 360 px de large.
- Logo provisoire : le texte « touslesmetiers.com ».
- **Captures d'écran** Playwright (mobile 390 × 844) de chaque page dans `docs/screenshots/`, versionnées, pour que le propriétaire voie le résultat depuis GitHub sans rien installer.

## 15. Hors périmètre V1

- Tuteur IA à 19 €/mois. Seule une page d'offre factice derrière un flag est prévue, en bonus.
- Comptes avec mot de passe : on fonctionne par liens à jeton et liens magiques.
- Applications mobiles, autres langues.
