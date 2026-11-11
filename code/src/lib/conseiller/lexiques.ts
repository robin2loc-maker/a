/**
 * Listes fermées du validateur (conseiller-ia.md §6.3). Elles ne sont pas des
 * textes visibles : elles citent ce qui est interdit, pour l'interdire.
 *
 * Toute modification ajoute un cas de test (src/lib/conseiller/validateur.test.ts).
 * Les expressions sont écrites sous leur forme normalisée (`normaliser`).
 */

/** Mots ignorés par le contrôle de fidélité (T04). `plus`, `moins`, `mieux` n'y sont pas. */
export const MOTS_OUTILS: ReadonlySet<string> = new Set(
  (
    "avec dans pour tout toute quand fait faire fais etre avoir avait etait sont elle elles ils lui " +
    "leur leurs cette ceux celle celles comme aussi tres bien deja encore souvent chose choses " +
    "quelque quelqu entre sans sous vers chez depuis apres avant alors donc mais parce juste " +
    "vraiment autre autres meme peut peux veut veux jour jours fois cest sait savoir"
  ).split(" "),
);

/** Équivalents admis par la fidélité (T04) : le parent a répondu à « le plus fier de lui ». */
export const EQUIVALENTS: Readonly<Record<string, readonly string[]>> = {
  fier: ["fierte"],
  fiere: ["fierte"],
  fierte: ["fier", "fiere"],
};

/** Diplômes et formations (T06), en minuscules normalisées, mots entiers. */
export const LEXIQUE_DIPLOMES: readonly string[] = [
  "bac pro",
  "baccalaureat professionnel",
  "brevet professionnel",
  "licence",
  "licence pro",
  "master",
  "mastere",
  "doctorat",
  "deust",
  "dn made",
  "dnmade",
  "dcg",
  "dscg",
  "diplome d etat",
  "deas",
  "deaes",
  "dejeps",
  "bpjeps",
  "cpge",
  "prepa",
  "classe preparatoire",
  "ecole d ingenieurs",
  "ecole de commerce",
  "titre professionnel",
  "titre pro",
  "cqp",
  "mention complementaire",
  "fcil",
  "universite",
  "fac",
];

/** Sigles de diplômes reconnus seulement en capitales dans le texte d'origine (T06). */
export const SIGLES_DIPLOMES: readonly string[] = [
  "BTS",
  "BTSA",
  "BUT",
  "DUT",
  "CAP",
  "BEP",
  "BP",
  "MBA",
  "PASS",
  "LAS",
  "L.AS",
  "IUT",
  "CFA",
  "DE",
];

/** Organismes (T07). */
export const LEXIQUE_ORGANISMES: readonly string[] = [
  "france travail",
  "pole emploi",
  "onisep",
  "cidj",
  "dares",
  "insee",
  "ocde",
  "parcoursup",
  "apec",
  "cereq",
  "france competences",
  "l etudiant",
  "ministere",
  "education nationale",
  "conseil regional",
];

/** Sigles d'organismes reconnus seulement en capitales (T07). */
export const SIGLES_ORGANISMES: readonly string[] = ["OIT", "ROME", "BMO", "RNCP"];

/** Promesses, superlatifs, tics (T10). « tous les » et « toutes les » sont traités à part. */
export const FORMULES_INTERDITES: readonly string[] = [
  "fait pour lui",
  "fait pour elle",
  "fait pour toi",
  "faite pour",
  "ne pour",
  "nee pour",
  "vocation",
  "sa voie",
  "ta voie",
  "ideal",
  "ideale",
  "parfait",
  "parfaite",
  "garanti",
  "succes assure",
  "avenir assure",
  "emploi assure",
  "c est assure",
  "assurement",
  "a coup sur",
  "reussite",
  "reve",
  "la plupart",
  "la majorite",
  "n importe qui",
  "incroyable",
  "genial",
  "passionnant",
  "decouvrir",
  "decouvre",
  "explorer",
  "univers",
  "aventure",
  "veritable",
  "clairement",
  "en somme",
  "en effet",
  "n hesite",
];

/** Unités de temps après lesquelles « tous les » et « toutes les » sont permis (T10). */
export const UNITES_TOUS_LES: ReadonlySet<string> = new Set([
  "jours",
  "matins",
  "soirs",
  "semaines",
  "week",
  "ans",
  "mois",
]);

/** Traits négatifs, interdits dans le `trait` enfant (T20) : préfixes de mots. */
export const TRAITS_NEGATIFS_PREFIXES: readonly string[] = [
  "desorganis",
  "bordel",
  "paress",
  "flemm",
  "faineant",
  "feignant",
  "timide",
  "reserve",
  "immatur",
  "capric",
  "agressi",
  "colerique",
  "tetu",
  "distrait",
  "dissip",
  "instable",
  "decroch",
];

/** Traits négatifs (T20) : expressions entières. */
export const TRAITS_NEGATIFS_EXPRESSIONS: readonly string[] = [
  "nul en",
  "nulle en",
  "faible en",
  "mauvais en",
  "mauvaise en",
  "en difficulte",
  "en echec",
  "manque de",
  "du mal a",
];

/** Attribution de la source, interdite dans la version enfant (T19). */
export const ATTRIBUTION: readonly string[] = [
  "ta mere",
  "ta maman",
  "ton pere",
  "ton papa",
  "tes parents",
  "ta famille",
  "tes proches",
  "on nous a dit",
  "on m a dit",
  "d apres",
  "selon ta",
  "selon ton",
  "selon tes",
  "il parait",
  "fier",
  "fiere",
  "fierte",
];

/** Vouvoiement (T16, T17). */
export const MOTS_VOUS: readonly string[] = ["vous", "votre", "vos"];

/** Tutoiement (T16, T17), mots normalisés (« t' » devient « t »). */
export const MOTS_TU: readonly string[] = ["tu", "te", "t", "toi", "ton", "ta", "tes"];

/** « Et l'IA ? » : ni alarme ni promesse (T23), préfixes normalisés. */
export const IA_INTERDITS: readonly string[] = [
  "jamais",
  "aucun risque",
  "remplac",
  "menac",
  "dispar",
  "a l abri",
  "toujours",
];

/** Mots en « h » qui font élider « que » (§6.5). */
export const H_MUETS: ReadonlySet<string> = new Set([
  "habite",
  "habitue",
  "habituee",
  "habituellement",
  "habille",
  "hesite",
  "heureux",
  "heureuse",
  "histoire",
  "hiver",
  "humain",
  "heure",
  "heures",
  "herbe",
  "hopital",
]);

/**
 * Détails de métier qu'un texte du LLM ne peut affirmer que si un fait de la
 * piste les porte (T31, passe qualité de 2.4) : un lieu, un véhicule, une
 * posture, un horaire. `dit` : mots ou expressions du texte (préfixes pour un
 * mot seul) ; `appuis` : ce qu'un fait doit contenir (mêmes conventions). Les
 * conditions de travail ROME sont un fait de chaque candidat (« c »).
 */
export const DETAILS_METIER: readonly {
  nom: string;
  dit: readonly string[];
  appuis: readonly string[];
}[] = [
  {
    nom: "terrain",
    dit: ["terrain"],
    appuis: [
      "terrain",
      "chantier",
      "exterieur",
      "deplacement",
      "domicile",
      "sur site",
      "exploitation",
    ],
  },
  { nom: "chantier", dit: ["chantier"], appuis: ["chantier"] },
  {
    nom: "dehors",
    dit: ["dehors", "en exterieur", "a l exterieur", "plein air"],
    appuis: ["exterieur", "dehors", "plein air"],
  },
  { nom: "debout", dit: ["debout"], appuis: ["debout"] },
  {
    nom: "véhicule",
    dit: ["camion", "fourgon", "vehicule", "voiture", "utilitaire"],
    // Ni « conducteur » ni « conduite » : « conducteur de travaux », « conduite de projet ».
    appuis: ["camion", "fourgon", "vehicule", "voiture", "conduire"],
  },
  {
    nom: "route",
    dit: ["sur la route", "sur les routes"],
    appuis: ["route", "routier", "deplacement"],
  },
  { nom: "atelier", dit: ["atelier"], appuis: ["atelier"] },
  { nom: "usine", dit: ["usine"], appuis: ["usine", "industriel"] },
  { nom: "bureau", dit: ["bureau"], appuis: ["bureau"] },
  { nom: "nuit", dit: ["nuit"], appuis: ["nuit"] },
  { nom: "week-end", dit: ["week end", "weekend", "dimanche"], appuis: ["week", "dimanche"] },
  { nom: "laboratoire", dit: ["laboratoire", "labo"], appuis: ["laboratoire"] },
  {
    nom: "hôpital",
    dit: ["hopital", "clinique"],
    appuis: ["hopital", "hospitalier", "clinique", "etablissement de sante"],
  },
  {
    nom: "mer",
    dit: ["bateau", "navire", "en mer"],
    appuis: ["bateau", "navire", "maritime", "portuaire", "mer"],
  },
  { nom: "avion", dit: ["avion", "aeroport"], appuis: ["avion", "aeroport", "aerien"] },
];

/**
 * Diriger une équipe (T32) : un verbe de ces préfixes suivi, à six mots
 * normalisés au plus (« le travail de toute l équipe »), d'un de ces noms. Mis en avant dans « Pourquoi ça lui ressemble »
 * alors qu'un métier est écarté parce qu'on y dirige une équipe, il contredit
 * la phrase de l'écarté.
 */
export const VERBES_ENCADREMENT: readonly string[] = [
  "dirig",
  "encadr",
  "supervis",
  "manag",
  "coordonn",
  "pilot",
  "command",
];
export const NOMS_EQUIPE: readonly string[] = [
  "equipe",
  "equipes",
  "personnel",
  "collaborateurs",
  "salaries",
  "ouvriers",
  "employes",
  "agents",
  "serveurs",
];

/** « Et l'IA ? » : ce mot ne revient pas d'une piste à l'autre (T33). */
export const IA_MOT_REPETITIF = "humain";

/** Clés de réponses jamais utilisables dans la version enfant (§3.2). */
export const CLES_INTERDITES_ENFANT: ReadonlySet<string> = new Set([
  "refus",
  "scolarite",
  "scolarite_apres_bac",
  "metier_evoque",
]);

/** Réponses précises jamais utilisables dans la version enfant (§3.2). */
export const REPONSES_INTERDITES_ENFANT: ReadonlySet<string> = new Set([
  "chiffres=corvee",
  "adultes_inconnus=reserve",
  "imprevu=laisse_faire",
]);

/** Clés dont les options sont envoyées sans jamais être citables (§3.2 : un refus n'explique rien). */
export const CLES_NON_CITABLES: ReadonlySet<string> = new Set(["refus"]);

/** Clés jamais envoyées au LLM (§3.1). */
export const CLES_JAMAIS_ENVOYEES: ReadonlySet<string> = new Set([
  "prenom",
  "genre",
  "departement",
  "mobilite",
]);

/** Clé de la réponse « contrainte » (durée d'études, T13, T14). */
export const CLE_CONTRAINTE = "annees_etudes";

/** Nombres écrits en lettres (T05), comptés seulement devant une unité. */
export const NOMBRES_EN_LETTRES: Readonly<Record<string, number>> = {
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
  seize: 16,
  vingt: 20,
  trente: 30,
  quarante: 40,
  cinquante: 50,
  soixante: 60,
  cent: 100,
  mille: 1000,
  dizaine: 10,
  dizaines: 10,
  centaine: 100,
  centaines: 100,
  millier: 1000,
  milliers: 1000,
};

/** Unités qui font d'un mot un nombre (T05). */
export const UNITES_NOMBRE: ReadonlySet<string> = new Set([
  "an",
  "ans",
  "annee",
  "annees",
  "mois",
  "semaine",
  "semaines",
  "jour",
  "jours",
  "heure",
  "heures",
  "h",
  "euro",
  "euros",
  "personne",
  "personnes",
  "salarie",
  "salaries",
  "metier",
  "metiers",
  "offre",
  "offres",
  "fois",
]);

/** Toujours interdits dans un texte LLM (T05). */
export const SYMBOLES_INTERDITS: readonly RegExp[] = [
  /%/,
  /€/,
  /(?<!\p{L})euros?(?!\p{L})/iu,
  /(?<!\p{L})pour ?cent(?!\p{L})/iu,
];
