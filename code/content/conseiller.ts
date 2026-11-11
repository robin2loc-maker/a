/**
 * Textes du conseiller (tâche 2.4) : gabarits du calcul seul et traits de la
 * version enfant (docs/conception/conseiller-ia.md §7.3).
 *
 * Ce sont les textes du mode démo sans clé, et ceux qui remplacent un texte
 * du LLM refusé par le validateur : ils passent le même validateur (test).
 *
 * Notation : `{il|elle}` (forme masculine, puis féminine) ; `{preuve}`,
 * `{de_preuve}` (« de … » ou « d'… »), `{n}`, `{max}`… sont remplis par le code.
 * Les chiffres (salaire, recrutement) viennent toujours des données sourcées.
 */
import type { Gabarit } from "@/lib/questionnaire/types";

/**
 * Un trait positif ou neutre pour chaque réponse citable autorisée à l'enfant
 * (§7.3.4), écrit avec une majuscule : la composition le garde en tête de
 * phrase. Clé : « <clé>=<option> ».
 */
const traitsEnfant: Readonly<Record<string, Gabarit>> = {
  "seul_groupe=seul": "Tu es à l'aise quand tu travailles {seul|seule}",
  "seul_groupe=deux_trois_amis": "Tu es à l'aise en petit groupe",
  "seul_groupe=groupe": "Tu es à l'aise en groupe",
  "temps_libre=sport": "Tu bouges dès que tu as du temps libre",
  "temps_libre=bricoler": "Tu aimes bricoler, construire, réparer",
  "temps_libre=cuisiner": "Tu aimes cuisiner",
  "temps_libre=dessiner_musique": "Tu dessines, tu fais de la musique ou tu filmes",
  "temps_libre=style": "Tu soignes ton style",
  "temps_libre=lire_ecrire": "Tu aimes lire et écrire",
  "temps_libre=comprendre": "Tu aimes comprendre comment marchent les choses",
  "temps_libre=animaux_nature": "Tu es bien avec les animaux et dans la nature",
  "temps_libre=aider": "Tu prends du temps pour t'occuper des autres",
  "aide_demandee=reparer": "On t'appelle pour réparer ou monter quelque chose",
  "aide_demandee=expliquer": "On vient te demander d'expliquer les choses",
  "aide_demandee=organiser": "C'est souvent toi qui organises les sorties",
  "aide_demandee=ecouter": "On vient te voir quand on a besoin de parler",
  "aide_demandee=creer": "On te demande de dessiner, de faire une affiche ou une vidéo",
  "aide_demandee=calculer": "On te confie les calculs et les comptes",
  "aide_demandee=vendre": "On te demande de vendre ou de négocier",
  "rester_assis=facile": "Tu peux rester {assis|assise} des heures sur ce qui t'intéresse",
  "rester_assis=besoin_de_bouger": "Tu as besoin de bouger",
  "week_end=nature": "Le week-end, tu files dehors, dans la nature",
  "week_end=sport": "Le week-end, tu es au sport",
  "week_end=interieur": "Tu es bien à l'intérieur",
  "role_groupe=prend_en_main": "Dans un groupe, tu prends les choses en main",
  "role_groupe=idees": "Dans un groupe, c'est toi qui proposes les idées",
  "role_groupe=ambiance_lien": "Dans un groupe, tu mets l'ambiance et tu fais le lien",
  "role_groupe=plus_que_sa_part": "Dans un groupe, tu tiens à ce que ce soit bien fait",
  "role_groupe=sa_part": "Dans un groupe, tu fais ta part, sérieusement",
  "role_groupe=observe": "Tu observes avant d'agir",
  "adultes_inconnus=a_l_aise": "Tu engages facilement la conversation, même avec des inconnus",
  "obtenir=negocie": "Tu sais négocier",
  "obtenir=se_debrouille": "Tu te débrouilles par toi-même",
  "prendre_soin=naturellement":
    "Tu t'occupes naturellement des plus jeunes et de ceux qui en ont besoin",
  "prendre_soin=autrement": "Tu aides en trouvant des solutions concrètes",
  "organisation=prevoit": "Tu prévois les choses à l'avance",
  "organisation=improvise": "Tu sais improviser et t'adapter",
  "organisation=cadre": "Tu avances bien avec un cadre clair",
  "probleme=cherche": "Face à un problème, tu cherches jusqu'à comprendre",
  "probleme=etapes": "Tu avances étape par étape",
  "probleme=essaie": "Tu essaies et recommences jusqu'à ce que ça marche",
  "probleme=demande": "Tu sais trouver la bonne personne et poser les bonnes questions",
  "imprevu=calme": "Tu gardes ton calme quand ça s'agite autour de toi",
  "chiffres=jeu": "Les chiffres, pour toi, c'est un jeu",
  "ecrans=depanne": "C'est toi qu'on appelle quand un appareil fait des siennes",
  "ecrans=cree": "Tu fais du montage, de la musique ou du dessin sur ordinateur",
  "ecrans=code": "Tu codes, tu programmes, tu montes des ordinateurs",
  "fierte=organise": "Tu as déjà organisé quelque chose de A à Z",
  "fierte=fabrique": "Tu as déjà fabriqué ou réparé quelque chose de tes mains",
  "fierte=cree": "Tu as déjà créé quelque chose : un dessin, un morceau, une vidéo, un plat",
  "fierte=aide": "Tu as déjà été là pour quelqu'un qui en avait besoin",
  "fierte=resolu": "Tu as déjà résolu quelque chose de difficile, à force de chercher",
  "fierte=responsabilite": "On t'a déjà confié des responsabilités",
  "fierte=convaincu": "Tu as déjà su convaincre des gens",
  "fierte=parole": "Tu as déjà pris la parole devant d'autres",
  "fierte=longtemps_prepare": "Tu sais préparer quelque chose longtemps et aller au bout",
  "matieres=francais": "Tu es à l'aise en français",
  "matieres=maths": "Tu es à l'aise en maths",
  "matieres=physique_chimie": "Tu es à l'aise en physique-chimie",
  "matieres=svt": "Tu es à l'aise en SVT",
  "matieres=histoire_geo": "Tu es à l'aise en histoire-géo",
  "matieres=langues": "Tu es à l'aise en langues",
  "matieres=economie": "Tu es à l'aise en économie",
  "matieres=philosophie": "Tu es à l'aise en philosophie",
  "matieres=arts": "Tu es à l'aise en arts",
  "matieres=sport": "Tu es à l'aise en sport",
  "matieres=technologie": "Tu es à l'aise en technologie et en informatique",
  "matieres=atelier": "Tu es à l'aise à l'atelier",
  "annees_etudes=moins_possible": "Tu préfères des études courtes",
  "annees_etudes=deux_ans": "Tu vises deux ans d'études au plus",
  "annees_etudes=trois_ans": "Tu vises trois ans d'études au plus",
  "annees_etudes=cinq_ans": "Tu es {prêt|prête} à faire jusqu'à cinq ans d'études",
  "annees_etudes=plus": "Tu es {prêt|prête} à faire de longues études s'il le faut",
  "alternance=ideal": "L'alternance te conviendrait bien",
  "ce_qui_compte=gagner": "Bien gagner ta vie compte pour toi",
  "ce_qui_compte=utile": "Être utile aux autres compte pour toi",
  "ce_qui_compte=patron": "Tu aimerais être {ton propre patron|ta propre patronne}",
  "ce_qui_compte=stable": "Un emploi stable compte pour toi",
  "ce_qui_compte=creer": "Créer compte pour toi",
  "ce_qui_compte=bouger": "Tu as envie de bouger, de voyager",
  "ce_qui_compte=temps": "Avoir du temps pour ta vie à côté compte pour toi",
};

/**
 * Début de phrase de la version enfant pour une réponse écrite par le parent
 * (passe qualité de 2.4) : l'amorce de la question, au tutoiement. Le trait
 * la complète avec les mots du parent (« tu peux passer des heures à démonter
 * des scooters »). Pas d'amorce pour le récit de fierté : la version enfant ne
 * parle pas de fierté.
 */
const amorcesEnfant: Readonly<Record<string, Gabarit>> = {
  temps_libre_precis: "tu peux passer des heures à",
  aide_exemple: "on t'a déjà demandé de l'aide pour",
};

/** Après le bac, les matières se disent au passé (variante `apres_bac` de Q21). */
const traitsEnfantApresBac: Readonly<Record<string, Gabarit>> = {
  "matieres=francais": "Au lycée, tu étais à l'aise en français",
  "matieres=maths": "Au lycée, tu étais à l'aise en maths",
  "matieres=physique_chimie": "Au lycée, tu étais à l'aise en physique-chimie",
  "matieres=svt": "Au lycée, tu étais à l'aise en SVT",
  "matieres=histoire_geo": "Au lycée, tu étais à l'aise en histoire-géo",
  "matieres=langues": "Au lycée, tu étais à l'aise en langues",
  "matieres=economie": "Au lycée, tu étais à l'aise en économie",
  "matieres=philosophie": "Au lycée, tu étais à l'aise en philosophie",
  "matieres=arts": "Au lycée, tu étais à l'aise en arts",
  "matieres=sport": "Au lycée, tu étais à l'aise en sport",
  "matieres=technologie": "Au lycée, tu étais à l'aise en technologie et en informatique",
};

/** « Le métier, simplement », en repli sur la définition officielle (§7.3.2). */
const metierSimplement = {
  /** `{activites}` : deux ou trois activités de la fiche ROME, reliées par « , » et « et ». */
  concretement: "Concrètement, {il|elle} {activites}.",
  /**
   * Quand la première phrase de la fiche tient de la plaquette (« joue un
   * rôle clé », « garantissant une expérience remarquable ») : les activités
   * seules (passe qualité de 2.4).
   */
  activites: "{Il|Elle} {activites}.",
};

/**
 * « Pourquoi ça lui ressemble », parent, en repli (§7.3.3). `{preuve}` est une
 * compétence de la fiche, à l'infinitif. Au conditionnel, sur l'enfant : on
 * parle de lui, pas d'un métier en général (passe qualité de 2.4).
 */
const pourquoiParent = {
  liens: [
    "dans ce métier, {il|elle} aurait à {preuve}",
    "{il|elle} serait aussi {amené|amenée} à {preuve}",
    "le métier lui demanderait aussi {de_preuve}",
  ],
  etudesBacPlus: "c'est accessible dès bac + {n}",
  etudesJusqua: "c'est accessible dès bac + {n}, jusqu'à bac + {max} selon les postes",
  etudesBac: "c'est accessible dès le bac",
  etudesSansDiplome: "aucun diplôme n'est exigé après le bac",
  sansLien:
    "Ce métier ressort de l'ensemble de vos réponses, sans qu'une seule ne suffise à l'expliquer.",
};

/**
 * Version enfant, en repli (§7.3.4), au tutoiement d'un bout à l'autre. Les
 * tournures diffèrent de celles du parent : une même proposition de cinq
 * mots ne doit pas revenir deux fois dans le bilan (T28).
 */
const pourquoiEnfant = {
  liens: [
    "ici, tu aurais à {preuve}",
    "tu serais aussi {amené|amenée} à {preuve}",
    "le métier te demanderait aussi {de_preuve}",
  ],
  etudesBacPlus: "tu peux y accéder dès bac + {n}",
  etudesJusqua: "tu peux y accéder dès bac + {n}, jusqu'à bac + {max} selon les postes",
  etudesBac: "tu peux y accéder dès le bac",
  etudesSansDiplome: "tu peux y entrer sans diplôme après le bac",
  sansLien: "Ce métier ressort de l'ensemble de ce qu'on sait de toi.",
};

/**
 * Raisons d'écart ajoutées par le conseiller (§7.3.5). Les autres
 * (niveau, durée des formations, privé, refus) sont dans
 * content/questionnaire.ts (`raisonsEcart`).
 */
const raisonsEcart = {
  experience: "La fiche officielle du métier le dit : « {preuve} » (France Travail).",
  encadrement:
    "On y dirige une équipe ({preuve}). Pour un premier métier, nous avons préféré des pistes où ce n'est pas le cas.",
  recrutement:
    "Les entreprises y prévoient peu de recrutements : {projets} projets pour la famille « {metierBmo} » en {annee} (France Travail).",
  salaire: "Le salaire de départ y est proche du Smic : {salaire}",
  /**
   * Quand la donnée est le Smic lui-même : sans la redite « proche du Smic :
   * le Smic, soit… » (passe qualité de 2.4). `{salaire}` : « 1 867 € brut par
   * mois en début de carrière (source : …) ».
   */
  salaireSmic: "Le salaire de départ y est le Smic, soit {salaire}",
  salaireAPartirDuSmic: "Le salaire de départ y commence au Smic, soit {salaire}",
  ia: "Selon l'OIT, ce métier est fortement exposé à l'IA générative. Nous avons préféré des pistes qui le sont moins.",
  variante:
    "C'est un métier très proche de « {piste} », déjà dans ses pistes : nous avons préféré lui laisser un vrai choix.",
};

/**
 * Phrase de salaire (design §6.6), écrite par le code depuis la donnée
 * sourcée, jamais par le LLM. `{montants}` : « de 1 802 à 2 500 € », « à
 * partir de 1 900 € »… ; `{unite}` : « brut par mois ».
 */
const salaire = {
  debutant: "{montants} {unite} en début de carrière",
  offres:
    "{montants} {unite}, c'est ce que proposent 80 % des offres d'emploi de ce métier, tous niveaux d'expérience confondus",
  autre: "{montants} {unite} ({type})",
  procheIntitule: ", d'après la fiche du métier « {metier} »",
  source: " (source : {source}, {millesime}).",
  montants: {
    fourchette: "de {min} à {max} €",
    minimum: "à partir de {min} €",
    valeur: "{min} €",
    valeurEnviron: "environ {min} €",
    smic: "le Smic, soit {min} €",
    smic_minimum: "à partir du Smic, soit {min} €",
    smic_fourchette: "du Smic ({min} €) à {max} €",
  },
  unites: {
    brut_mensuel: "brut par mois",
    net_mensuel: "net par mois",
    brut_annuel: "brut par an",
    net_annuel: "net par an",
  },
};

export const conseiller = {
  traitsEnfant,
  amorcesEnfant,
  traitsEnfantApresBac,
  metierSimplement,
  pourquoiParent,
  pourquoiEnfant,
  raisonsEcart,
  salaire,
};
