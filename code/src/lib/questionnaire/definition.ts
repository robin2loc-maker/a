/**
 * Définition du questionnaire parent : source de vérité de l'ordre, des
 * conditions, des effets et des durées (tâche 2.1).
 *
 * Conception : docs/conception/questionnaire.md (v2), avec les réserves de
 * docs/conception/questionnaire-critique-2.md (R1 à R9, améliorations 1 et 2).
 * Version 3 : docs/conception/questions-ouvertes.md (trois phrases libres sous
 * Q5, Q6 et Q20 ; Q7 `mains_tete` et Q14 `ecrit_oral` retirées), avec les
 * réserves R1 à R4 de docs/conception/questions-ouvertes-critique-2.md.
 * Les textes sont dans content/questionnaire.ts ; docs/QUESTIONNAIRE.md est
 * généré depuis ces deux fichiers (`npm run doc:questionnaire`).
 *
 * Notation des effets : `cible("organiser", 0.9, 1.2)` = cible 0,90 sur
 * `organiser`, poids 1,2 (conception §1, « Notation »).
 */
import type {
  Champ,
  ChampChoixMultiple,
  ChampChoixUnique,
  ChampTexte,
  Condition,
  Dimension,
  Drapeau,
  Ecran,
  EffetCible,
  EffetOrdreFormations,
  EffetPlafond,
  EffetSeuil,
  Option,
  Question,
  Variante,
} from "./types";

/**
 * Version stockée avec les réponses (conception §5.7). Version 3 : questions
 * ouvertes (questions-ouvertes.md §8). Aucune donnée de version 2 n'existe hors
 * du dépôt : `reponsesSchema` refuse toute autre version, et les fichiers
 * committés ont été migrés une fois par scripts/data/migrer-v3.ts.
 */
export const VERSION_QUESTIONNAIRE = 3;

// ---------------------------------------------------------------------------
// Raccourcis d'écriture
// ---------------------------------------------------------------------------

const cible = (dim: Dimension, valeur: number, poids: number): EffetCible => ({
  type: "cible",
  dim,
  valeur,
  poids,
});
const seuil = (dim: Dimension, valeur: number, poids: number): EffetSeuil => ({
  type: "seuil",
  dim,
  valeur,
  poids,
});
const plafond = (dim: Dimension, valeur: number, poids: number): EffetPlafond => ({
  type: "plafond",
  dim,
  valeur,
  poids,
});
const filtre = (drapeau: Drapeau) => ({ type: "filtre_drapeau", drapeau }) as const;
const ordre = (regle: EffetOrdreFormations["regle"]): EffetOrdreFormations => ({
  type: "ordre_formations",
  regle,
});

const si = (cle: string, ...parmi: string[]): Condition => ({ cle, parmi });

/** L'enfant a déjà le bac (Q2). */
const DEJA_BAC = si("situation", "deja_bac");

/** Formations après le bac qui donnent la variante « après le bac » de Q22. */
const FORMATIONS_SUIVIES = ["licence", "sante", "bts", "but", "prepa", "ecole", "autre_formation"];

// ---------------------------------------------------------------------------
// Champs partagés par plusieurs variantes
// ---------------------------------------------------------------------------

const OPTIONS_SPECIALITES: readonly Option[] = [
  { id: "maths", effets: [cible("chiffres", 0.65, 0.3), cible("comprendre", 0.6, 0.2)] },
  { id: "physique_chimie", effets: [cible("comprendre", 0.65, 0.3)] },
  { id: "svt", effets: [cible("comprendre", 0.6, 0.3), cible("vivant", 0.5, 0.1)] },
  { id: "ses", effets: [cible("chiffres", 0.5, 0.2), cible("convaincre", 0.5, 0.15)] },
  { id: "hggsp", effets: [cible("ecrit", 0.55, 0.25)] },
  { id: "hlp", effets: [cible("ecrit", 0.7, 0.3)] },
  { id: "llcer", effets: [cible("ecrit", 0.55, 0.2), cible("deplacements", 0.5, 0.2)] },
  { id: "lca", effets: [cible("ecrit", 0.65, 0.25)] },
  { id: "nsi", effets: [cible("numerique", 0.75, 0.35)] },
  { id: "si", effets: [cible("fabriquer", 0.6, 0.25), cible("numerique", 0.6, 0.2)] },
  { id: "arts", effets: [cible("creer", 0.75, 0.35)] },
  { id: "eppcs", effets: [seuil("physique", 0.35, 0.3)] },
  { id: "biologie_ecologie", effets: [cible("vivant", 0.7, 0.35)] },
];

const champSpecialites = (max: number): ChampChoixMultiple => ({
  type: "choix_multiple",
  cle: "specialites",
  options: OPTIONS_SPECIALITES,
  max,
});

const CHAMP_TEMPS_LIBRE: ChampChoixMultiple = {
  type: "choix_multiple",
  cle: "temps_libre",
  max: 3,
  options: [
    { id: "sport", effets: [seuil("physique", 0.35, 0.5)], citation: "toujours" },
    { id: "bricoler", effets: [cible("fabriquer", 0.85, 1)], citation: "toujours" },
    {
      id: "cuisiner",
      effets: [cible("fabriquer", 0.7, 0.6), cible("creer", 0.55, 0.3)],
      citation: "toujours",
    },
    { id: "dessiner_musique", effets: [cible("creer", 0.85, 1)], citation: "toujours" },
    { id: "style", effets: [cible("creer", 0.6, 0.4)], citation: "toujours" },
    {
      id: "lire_ecrire",
      effets: [cible("ecrit", 0.75, 0.8), cible("comprendre", 0.55, 0.2)],
      citation: "toujours",
    },
    { id: "comprendre", effets: [cible("comprendre", 0.8, 0.8)], citation: "toujours" },
    {
      id: "animaux_nature",
      effets: [cible("vivant", 0.85, 1), cible("dehors", 0.6, 0.3)],
      citation: "toujours",
    },
    { id: "aider", effets: [cible("aider", 0.8, 0.8)], citation: "toujours" },
    { id: "amis", effets: [cible("equipe", 0.7, 0.3)] },
    // Évite au parent d'un enfant qui travaille de cocher une case fausse : aucun effet.
    { id: "son_travail", effets: "neutre", si: DEJA_BAC },
    { id: "ecrans", effets: [cible("numerique", 0.45, 0.15)] },
  ],
};

/** Précision de Q5 (questions ouvertes §2.1) : sans effet sur le score, lue par le conseiller. */
const CHAMP_TEMPS_LIBRE_PRECIS: ChampTexte = {
  type: "texte",
  cle: "temps_libre_precis",
  longueurMax: 140,
  effets: [{ type: "contexte", cle: "texte_temps_libre" }],
};

const CHAMP_OBTENIR: ChampChoixUnique = {
  type: "choix_unique",
  cle: "obtenir",
  options: [
    {
      id: "negocie",
      effets: [cible("convaincre", 0.85, 1), cible("parole", 0.6, 0.3)],
      citation: "toujours",
    },
    { id: "demande", effets: [cible("convaincre", 0.3, 0.5)] },
    // Réserve R7 : plus de bonus `independant_possible` (ne pas demander n'est pas vouloir être indépendant).
    {
      id: "se_debrouille",
      effets: [cible("organiser", 0.55, 0.3), cible("convaincre", 0.3, 0.3)],
      citation: "toujours",
    },
  ],
};

const CHAMP_MATIERES: ChampChoixMultiple = {
  type: "choix_multiple",
  cle: "matieres",
  max: 3,
  options: [
    { id: "francais", effets: [cible("ecrit", 0.7, 0.5)], citation: "toujours" },
    {
      id: "maths",
      effets: [cible("chiffres", 0.7, 0.5), cible("comprendre", 0.6, 0.3)],
      citation: "toujours",
    },
    { id: "physique_chimie", effets: [cible("comprendre", 0.7, 0.5)], citation: "toujours" },
    {
      id: "svt",
      effets: [cible("comprendre", 0.6, 0.3), cible("vivant", 0.5, 0.1)],
      citation: "toujours",
    },
    {
      id: "histoire_geo",
      effets: [cible("ecrit", 0.55, 0.3), cible("comprendre", 0.5, 0.2)],
      citation: "toujours",
    },
    {
      id: "langues",
      effets: [cible("parole", 0.55, 0.3), cible("deplacements", 0.5, 0.3)],
      citation: "toujours",
    },
    {
      id: "economie",
      effets: [
        cible("chiffres", 0.5, 0.3),
        cible("convaincre", 0.5, 0.2),
        cible("organiser", 0.5, 0.2),
      ],
      citation: "toujours",
    },
    {
      id: "philosophie",
      effets: [cible("ecrit", 0.6, 0.3), cible("comprendre", 0.6, 0.3)],
      si: si("situation", "terminale_generale", "terminale_techno", "deja_bac"),
      citation: "toujours",
    },
    { id: "arts", effets: [cible("creer", 0.75, 0.5)], citation: "toujours" },
    { id: "sport", effets: [seuil("physique", 0.35, 0.5)], citation: "toujours" },
    {
      id: "technologie",
      effets: [cible("numerique", 0.7, 0.5), cible("fabriquer", 0.55, 0.3)],
      citation: "toujours",
    },
    {
      id: "atelier",
      effets: [cible("fabriquer", 0.7, 0.4)],
      si: si("situation", "bac_pro"),
      citation: "toujours",
    },
    { id: "aucune", effets: "neutre", exclusive: true },
  ],
};

const CHAMP_SCOLARITE: ChampChoixUnique = {
  type: "choix_unique",
  cle: "scolarite",
  options: [
    { id: "tres_bien", effets: "neutre" },
    { id: "bien", effets: "neutre" },
    { id: "inegal", effets: "neutre" },
    // Réserve R3 : plus aucun malus de métier, seulement l'ordre des formations.
    { id: "difficile", effets: [ordre("selectives_apres")] },
  ],
};

const CHAMP_ANNEES_ETUDES: ChampChoixUnique = {
  type: "choix_unique",
  cle: "annees_etudes",
  options: [
    {
      id: "moins_possible",
      effets: [
        { type: "etudes", maxAnnees: 2 },
        { type: "malus_metier", critere: "aucune_formation_un_an_au_plus", poids: 0.15 },
        ordre("courtes_d_abord"),
      ],
      citation: "toujours",
    },
    { id: "deux_ans", effets: [{ type: "etudes", maxAnnees: 2 }], citation: "toujours" },
    { id: "trois_ans", effets: [{ type: "etudes", maxAnnees: 3 }], citation: "toujours" },
    { id: "cinq_ans", effets: [{ type: "etudes", maxAnnees: 5 }], citation: "toujours" },
    { id: "plus", effets: [{ type: "etudes", maxAnnees: null }], citation: "toujours" },
    {
      id: "ne_sait_pas",
      jeNeSaisPas: true,
      effets: [
        { type: "etudes", maxAnnees: 5 },
        { type: "malus_metier", critere: "etudes_au_dela_de_3_ans", poids: 0.15 },
      ],
    },
  ],
};

/** Une seule option, une seule réponse : choix unique simple, avance automatique. */
const unique = (
  cle: string,
  options: readonly Option[],
  dureeSecondes: number,
): readonly [Variante] => [
  {
    id: "principale",
    champs: [{ type: "choix_unique", cle, options }],
    passer: "je_ne_sais_pas",
    avanceAuto: true,
    dureeSecondes,
  },
];

// ---------------------------------------------------------------------------
// Les 28 questions, dans l'ordre (numéros de la v2 gardés, trous à 7 et 14)
// ---------------------------------------------------------------------------

export const QUESTIONS: readonly Question[] = [
  // ----- Chapitre 1 : Pour commencer -----
  {
    id: "prenom_pronom",
    numero: 1,
    chapitre: "pour_commencer",
    raison:
      "Accorder toutes les questions et mettre son prénom sur ses pistes. Le prénom n'est jamais envoyé au LLM.",
    variantes: [
      {
        id: "principale",
        champs: [
          {
            type: "texte",
            cle: "prenom",
            longueurMax: 40,
            effets: [{ type: "contexte", cle: "prenom" }],
          },
          {
            type: "choix_unique",
            cle: "genre",
            options: [
              { id: "il", effets: [{ type: "contexte", cle: "genre" }] },
              { id: "elle", effets: [{ type: "contexte", cle: "genre" }] },
            ],
          },
        ],
        passer: "aucun",
        avanceAuto: false,
        dureeSecondes: 22,
      },
    ],
  },
  {
    id: "situation",
    numero: 2,
    chapitre: "pour_commencer",
    raison:
      "Réorientation (« les pistes en tiennent compte », FAQ de la page de vente), calendrier, variantes de Q3, Q5, Q12, Q21, Q22 et Q23.",
    variantes: [
      {
        id: "principale",
        champs: [
          {
            type: "choix_unique",
            cle: "situation",
            options: [
              "seconde",
              "premiere_generale",
              "premiere_techno",
              "terminale_generale",
              "terminale_techno",
              "bac_pro",
              "deja_bac",
              "autre",
            ].map((id) => ({ id, effets: [{ type: "contexte", cle: "situation" }] as const })),
          },
        ],
        passer: "aucun",
        avanceAuto: true,
        dureeSecondes: 14,
      },
    ],
  },
  {
    id: "situation_detail",
    numero: 3,
    chapitre: "pour_commencer",
    si: si(
      "situation",
      "premiere_generale",
      "premiere_techno",
      "terminale_generale",
      "terminale_techno",
      "bac_pro",
      "deja_bac",
    ),
    raison:
      "Ce que l'enfant a déjà choisi est un fait que le parent connaît. Signal faible sur les dimensions (un choix de spécialités tient aussi aux conseils reçus) ; contexte pour les textes et le guide.",
    variantes: [
      {
        id: "specialites_premiere",
        si: si("situation", "premiere_generale"),
        champs: [champSpecialites(3)],
        passer: "je_ne_sais_pas",
        avanceAuto: false,
        dureeSecondes: 27,
      },
      {
        id: "specialites_terminale",
        si: si("situation", "terminale_generale"),
        champs: [champSpecialites(2)],
        passer: "je_ne_sais_pas",
        avanceAuto: false,
        dureeSecondes: 27,
      },
      {
        id: "serie",
        si: si("situation", "premiere_techno", "terminale_techno"),
        champs: [
          {
            type: "choix_unique",
            cle: "serie",
            options: [
              {
                id: "stmg",
                effets: [
                  cible("organiser", 0.6, 0.3),
                  cible("chiffres", 0.55, 0.2),
                  cible("convaincre", 0.5, 0.2),
                ],
              },
              { id: "sti2d", effets: [cible("fabriquer", 0.6, 0.3), cible("numerique", 0.6, 0.3)] },
              { id: "st2s", effets: [cible("aider", 0.7, 0.4)] },
              { id: "stl", effets: [cible("comprendre", 0.65, 0.3)] },
              { id: "std2a", effets: [cible("creer", 0.75, 0.4)] },
              { id: "stav", effets: [cible("vivant", 0.7, 0.4), cible("dehors", 0.55, 0.2)] },
              { id: "sthr", effets: [cible("fabriquer", 0.6, 0.25), cible("public", 0.6, 0.25)] },
              { id: "s2tmd", effets: [cible("creer", 0.75, 0.4), cible("parole", 0.6, 0.2)] },
            ],
          },
        ],
        passer: "je_ne_sais_pas",
        avanceAuto: false,
        dureeSecondes: 13,
      },
      {
        id: "bac_pro",
        si: si("situation", "bac_pro"),
        champs: [
          {
            type: "choix_unique",
            cle: "bac_pro_domaine",
            options: [
              { id: "btp", effets: [cible("fabriquer", 0.75, 0.35), cible("dehors", 0.5, 0.2)] },
              { id: "industrie", effets: [cible("fabriquer", 0.75, 0.35)] },
              {
                id: "numerique",
                effets: [cible("numerique", 0.65, 0.3), cible("fabriquer", 0.55, 0.2)],
              },
              {
                id: "commerce",
                effets: [cible("convaincre", 0.65, 0.3), cible("public", 0.65, 0.3)],
              },
              { id: "gestion", effets: [cible("organiser", 0.6, 0.3)] },
              {
                id: "hotellerie",
                effets: [cible("fabriquer", 0.65, 0.3), cible("public", 0.55, 0.2)],
              },
              { id: "sante_social", effets: [cible("aider", 0.75, 0.4)] },
              {
                id: "agriculture",
                effets: [cible("vivant", 0.75, 0.4), cible("dehors", 0.6, 0.2)],
              },
              { id: "arts_communication", effets: [cible("creer", 0.7, 0.35)] },
              { id: "transport", effets: [cible("deplacements", 0.7, 0.3)] },
              { id: "securite", effets: [cible("stress", 0.6, 0.2), cible("public", 0.55, 0.2)] },
              { id: "autre_domaine", effets: "neutre" },
            ],
          },
        ],
        passer: "je_ne_sais_pas",
        avanceAuto: false,
        dureeSecondes: 23,
      },
      {
        id: "apres_bac",
        si: DEJA_BAC,
        champs: [
          {
            type: "choix_unique",
            cle: "apres_bac_activite",
            options: ["premiere_annee", "deuxieme_annee", "arrete"].map((id) => ({
              id,
              effets: [{ type: "contexte", cle: "activite_apres_bac" }] as const,
            })),
          },
          {
            type: "choix_unique",
            cle: "apres_bac_formation",
            options: [
              ...FORMATIONS_SUIVIES.map((id) => ({
                id,
                effets: [{ type: "contexte", cle: "formation_apres_bac" }] as const,
              })),
              // Réserve R9 : contredirait « en première année » ou « en deuxième année ».
              {
                id: "aucune",
                si: si("apres_bac_activite", "arrete"),
                effets: [{ type: "contexte", cle: "formation_apres_bac" }],
              },
            ],
          },
          {
            type: "choix_unique",
            cle: "apres_bac_bac",
            options: [
              { id: "general", effets: [{ type: "contexte", cle: "bac" }] },
              { id: "technologique", effets: [{ type: "contexte", cle: "bac" }] },
              {
                id: "professionnel",
                effets: [{ type: "contexte", cle: "bac" }, ordre("bts_d_abord")],
              },
            ],
          },
        ],
        passer: "je_ne_sais_pas",
        avanceAuto: false,
        dureeSecondes: 33,
      },
    ],
  },

  // ----- Chapitre 2 : Au quotidien -----
  {
    id: "seul_groupe",
    numero: 4,
    chapitre: "au_quotidien",
    pageDeVente: true,
    raison:
      "Question de la page de vente, mot pour mot. `equipe` seul est peu discriminant (grille, fiche 15) : `public` porte la dispersion, à poids faible parce que Q11 le mesure directement.",
    variantes: unique(
      "seul_groupe",
      [
        {
          id: "seul",
          effets: [cible("equipe", 0.2, 1), cible("public", 0.2, 0.3)],
          citation: "toujours",
        },
        {
          id: "deux_trois_amis",
          effets: [cible("equipe", 0.5, 0.6), cible("public", 0.3, 0.3)],
          citation: "toujours",
        },
        { id: "les_deux", effets: [cible("equipe", 0.5, 0.2)] },
        {
          id: "groupe",
          effets: [cible("equipe", 0.8, 1), cible("public", 0.65, 0.3)],
          citation: "toujours",
        },
      ],
      12,
    ),
  },
  {
    id: "temps_libre",
    numero: 5,
    chapitre: "au_quotidien",
    raison:
      "« Ce qu'il fait quand personne ne lui demande rien » : la page de vente le cite comme ce que le parent sait mieux que quiconque. Un loisir choisi est le meilleur indice observable d'un intérêt ; les amis et les écrans ne pèsent presque rien. La précision écrite dit *quoi* (l'objet, le geste) : elle départage deux candidats voisins et remplace l'ancienne Q7 « avec ses mains ou avec sa tête ».",
    variantes: [
      {
        id: "apres_bac",
        si: DEJA_BAC,
        champs: [CHAMP_TEMPS_LIBRE, CHAMP_TEMPS_LIBRE_PRECIS],
        passer: "je_ne_sais_pas",
        avanceAuto: false,
        dureeSecondes: 59,
      },
      {
        id: "principale",
        champs: [CHAMP_TEMPS_LIBRE, CHAMP_TEMPS_LIBRE_PRECIS],
        passer: "je_ne_sais_pas",
        avanceAuto: false,
        dureeSecondes: 57,
      },
    ],
  },
  {
    id: "aide_demandee",
    numero: 6,
    chapitre: "au_quotidien",
    raison:
      "Ce que les proches viennent chercher chez lui est un fait social, vu de l'extérieur : exactement le regard d'un proche. Le réglage des appareils a sa case, à poids faible, pour ne pas fausser « réparer ». La dernière demande, écrite, nomme une personne aidée ou une situation : le meilleur indice de domaine du questionnaire.",
    variantes: [
      {
        id: "principale",
        champs: [
          {
            type: "choix_multiple",
            cle: "aide_demandee",
            max: 2,
            options: [
              { id: "reparer", effets: [cible("fabriquer", 0.85, 1)], citation: "toujours" },
              // Presque tous les ados le font : jamais cité.
              { id: "regler", effets: [cible("numerique", 0.6, 0.3)] },
              {
                id: "expliquer",
                effets: [cible("parole", 0.8, 0.8), cible("comprendre", 0.6, 0.3)],
                citation: "toujours",
              },
              { id: "organiser", effets: [cible("organiser", 0.85, 1)], citation: "toujours" },
              {
                id: "ecouter",
                effets: [cible("aider", 0.85, 1), cible("parole", 0.55, 0.2)],
                citation: "toujours",
              },
              { id: "creer", effets: [cible("creer", 0.85, 1)], citation: "toujours" },
              { id: "calculer", effets: [cible("chiffres", 0.85, 1)], citation: "toujours" },
              { id: "vendre", effets: [cible("convaincre", 0.8, 0.8)], citation: "toujours" },
              { id: "rien_de_particulier", effets: "neutre", exclusive: true },
            ],
          },
          {
            type: "texte",
            cle: "aide_exemple",
            longueurMax: 140,
            effets: [{ type: "contexte", cle: "exemple_aide" }],
            // On ne demande pas un exemple de ce qui n'arrive pas (questions ouvertes §2.2).
            si: { non: si("aide_demandee", "rien_de_particulier") },
          },
        ],
        passer: "je_ne_sais_pas",
        avanceAuto: false,
        dureeSecondes: 48,
      },
    ],
  },
  {
    id: "rester_assis",
    numero: 8,
    chapitre: "au_quotidien",
    raison:
      "Réponse de l'exemple de la page de vente (« n'aime pas rester assis »). À sens unique : seule la troisième option agit, par un seuil (pouvoir rester assis ne dit pas qu'on refuse de bouger).",
    variantes: unique(
      "rester_assis",
      [
        // Aucun effet sur le score ; citable seulement pour un métier de bureau (fait du ROME).
        { id: "facile", effets: "neutre", citation: { siMetier: "bureau_toute_la_journee" } },
        { id: "avec_pauses", effets: "neutre" },
        { id: "besoin_de_bouger", effets: [seuil("physique", 0.35, 1)], citation: "toujours" },
      ],
      15,
    ),
  },
  {
    id: "week_end",
    numero: 9,
    chapitre: "au_quotidien",
    raison:
      "Thème « dehors ou à l'intérieur », ancré dans le week-end, quand il choisit. Le club de sport, ni nature ni intérieur, a sa case, en seuil.",
    variantes: unique(
      "week_end",
      [
        {
          id: "nature",
          effets: [cible("dehors", 0.75, 0.8), cible("vivant", 0.55, 0.4)],
          citation: "toujours",
        },
        { id: "ville", effets: [cible("dehors", 0.45, 0.3)] },
        { id: "sport", effets: [seuil("physique", 0.35, 0.3)], citation: "toujours" },
        { id: "interieur", effets: [cible("dehors", 0.15, 0.4)], citation: "toujours" },
        { id: "ca_depend", effets: "neutre" },
      ],
      13,
    ),
  },

  // ----- Chapitre 3 : Avec les autres -----
  {
    id: "role_groupe",
    numero: 10,
    chapitre: "avec_les_autres",
    raison:
      "Principale source de `diriger`. Six rôles, tous valorisants. « En fait plus que sa part » donne sa place à l'élève qui finit par tout faire, sans en faire un dirigeant.",
    variantes: unique(
      "role_groupe",
      [
        {
          id: "prend_en_main",
          effets: [cible("diriger", 0.85, 0.8), cible("organiser", 0.65, 0.3)],
          citation: "toujours",
        },
        {
          id: "idees",
          effets: [cible("creer", 0.65, 0.5), cible("convaincre", 0.5, 0.3)],
          citation: "toujours",
        },
        // Réserve R6 : « fait le lien » (SPEC §4 C) ; `convaincre` 0,50 (×0,2).
        {
          id: "ambiance_lien",
          effets: [
            cible("equipe", 0.75, 0.4),
            cible("public", 0.7, 0.3),
            cible("parole", 0.6, 0.4),
            cible("convaincre", 0.5, 0.2),
          ],
          citation: "toujours",
        },
        {
          id: "plus_que_sa_part",
          effets: [
            cible("precision", 0.75, 0.5),
            cible("organiser", 0.7, 0.4),
            cible("diriger", 0.4, 0.3),
          ],
          citation: "toujours",
        },
        {
          id: "sa_part",
          effets: [cible("precision", 0.65, 0.4), cible("diriger", 0.3, 0.4)],
          citation: "toujours",
        },
        {
          id: "observe",
          effets: [cible("diriger", 0.3, 0.3), cible("comprendre", 0.55, 0.2)],
          citation: "toujours",
        },
      ],
      26,
    ),
  },
  {
    id: "adultes_inconnus",
    numero: 11,
    chapitre: "avec_les_autres",
    raison: "Source principale de `public`, la dimension la plus dispersée de la grille.",
    variantes: unique(
      "adultes_inconnus",
      [
        {
          id: "a_l_aise",
          effets: [cible("public", 0.85, 1), cible("convaincre", 0.55, 0.2)],
          citation: "toujours",
        },
        { id: "poli", effets: [cible("public", 0.5, 0.5)] },
        { id: "reserve", effets: [cible("public", 0.2, 0.8)], citation: "toujours" },
      ],
      16,
    ),
  },
  {
    id: "obtenir",
    numero: 12,
    chapitre: "avec_les_autres",
    raison:
      "La négociation domestique est l'un des comportements les plus visibles d'un ado (grille, fiche 2 : « il négocie tout ») : source directe de `convaincre`.",
    variantes: [
      {
        id: "apres_bac",
        si: DEJA_BAC,
        champs: [CHAMP_OBTENIR],
        passer: "je_ne_sais_pas",
        avanceAuto: true,
        dureeSecondes: 17,
      },
      {
        id: "principale",
        champs: [CHAMP_OBTENIR],
        passer: "je_ne_sais_pas",
        avanceAuto: true,
        dureeSecondes: 17,
      },
    ],
  },
  {
    id: "prendre_soin",
    numero: 13,
    chapitre: "avec_les_autres",
    raison:
      "Seule question qui donne un signal gradué sur `aider` : sans elle, un enfant peu tourné vers le soin garderait les métiers du soin par défaut. La troisième option dit « bas » sans jugement.",
    variantes: unique(
      "prendre_soin",
      [
        { id: "naturellement", effets: [cible("aider", 0.85, 1)], citation: "toujours" },
        { id: "attentionne", effets: [cible("aider", 0.5, 0.5)] },
        { id: "autrement", effets: [cible("aider", 0.2, 0.6)], citation: "toujours" },
      ],
      19,
    ),
  },

  // ----- Chapitre 4 : Sa façon de faire -----
  {
    id: "organisation",
    numero: 15,
    chapitre: "sa_facon_de_faire",
    raison:
      "Thème « l'organisation ». Les options 2 et 4 se distinguent par ce qu'on voit : l'improvisation, ou le désordre apparent.",
    variantes: unique(
      "organisation",
      [
        {
          id: "prevoit",
          effets: [cible("organiser", 0.8, 0.8), cible("precision", 0.7, 0.4)],
          citation: "toujours",
        },
        {
          id: "improvise",
          effets: [cible("organiser", 0.4, 0.4), cible("variete", 0.65, 0.2)],
          citation: "toujours",
        },
        {
          id: "cadre",
          effets: [
            cible("organiser", 0.35, 0.4),
            cible("precision", 0.6, 0.3),
            cible("variete", 0.35, 0.2),
          ],
          citation: "toujours",
        },
        { id: "desordre", effets: [cible("organiser", 0.45, 0.2), cible("variete", 0.6, 0.2)] },
      ],
      18,
    ),
  },
  {
    id: "probleme",
    numero: 16,
    chapitre: "sa_facon_de_faire",
    raison:
      "La page de vente dit au parent qu'il sait « comment il s'y prend face à un problème » : c'est une promesse, donc une question. La scène qui mesure le mieux `comprendre` ; la deuxième option garde le thème « règles et procédures ».",
    variantes: unique(
      "probleme",
      [
        {
          id: "cherche",
          effets: [cible("comprendre", 0.8, 0.8), cible("precision", 0.6, 0.2)],
          citation: "toujours",
        },
        {
          id: "etapes",
          effets: [cible("precision", 0.8, 0.6), cible("organiser", 0.55, 0.2)],
          citation: "toujours",
        },
        { id: "essaie", effets: [cible("fabriquer", 0.7, 0.5)], citation: "toujours" },
        {
          id: "demande",
          effets: [cible("parole", 0.55, 0.3), cible("equipe", 0.6, 0.3)],
          citation: "toujours",
        },
      ],
      22,
    ),
  },
  {
    id: "imprevu",
    numero: 17,
    chapitre: "sa_facon_de_faire",
    raison:
      "Thème « le stress et l'urgence ». `stress` mesure l'urgence (secours, soin, sécurité) : la scène en est une, sans oubli ni retard, qui relèvent de l'organisation.",
    variantes: unique(
      "imprevu",
      [
        { id: "calme", effets: [cible("stress", 0.75, 1)], citation: "toujours" },
        { id: "gere", effets: [cible("stress", 0.45, 0.4)] },
        // Réserve R4 : même effet, nouvelle formulation, pas de citation.
        { id: "laisse_faire", effets: [plafond("stress", 0.5, 0.8)] },
      ],
      18,
    ),
  },
  {
    id: "chiffres",
    numero: 18,
    chapitre: "sa_facon_de_faire",
    raison:
      "Les chiffres du quotidien, pas les maths du bulletin (Q21). Une question de goût : l'échelle d'intensité est voulue ; « une corvée » est un plafond doux, le refus net est en Q28.",
    variantes: unique(
      "chiffres",
      [
        { id: "jeu", effets: [cible("chiffres", 0.85, 1)], citation: "toujours" },
        { id: "outil", effets: [cible("chiffres", 0.45, 0.4)] },
        { id: "corvee", effets: [plafond("chiffres", 0.4, 0.8)], citation: "toujours" },
      ],
      16,
    ),
  },
  {
    id: "ecrans",
    numero: 19,
    chapitre: "sa_facon_de_faire",
    raison:
      "Thème « les écrans : utiliser, ou comprendre comment ça marche ». « À part les jeux et les réseaux » retire l'usage que tous les ados partagent.",
    variantes: unique(
      "ecrans",
      [
        { id: "pas_grand_chose", effets: [cible("numerique", 0.25, 0.3)] },
        {
          id: "depanne",
          effets: [cible("numerique", 0.75, 0.8), cible("comprendre", 0.55, 0.2)],
          citation: "toujours",
        },
        {
          id: "cree",
          effets: [cible("creer", 0.75, 0.6), cible("numerique", 0.55, 0.4)],
          citation: "toujours",
        },
        {
          id: "code",
          effets: [cible("numerique", 0.9, 1), cible("comprendre", 0.6, 0.3)],
          citation: "toujours",
        },
      ],
      17,
    ),
  },
  {
    id: "fierte",
    numero: 20,
    chapitre: "sa_facon_de_faire",
    pageDeVente: true,
    raison:
      "Question de la page de vente, mot pour mot. Un choix (codé sans LLM) et une phrase facultative (les mots du parent, cités tels quels). Poids le plus fort du questionnaire (1,2) et source de la dimension de cœur ; « responsabilité », « longtemps préparé » et « autre chose » passent par le repli.",
    variantes: [
      {
        id: "principale",
        champs: [
          {
            type: "choix_unique",
            cle: "fierte",
            options: [
              {
                id: "organise",
                effets: [
                  cible("organiser", 0.9, 1.2),
                  cible("diriger", 0.6, 0.3),
                  { type: "coeur", dim: "organiser" },
                ],
                citation: "toujours",
              },
              {
                id: "fabrique",
                effets: [cible("fabriquer", 0.9, 1.2), { type: "coeur", dim: "fabriquer" }],
                citation: "toujours",
              },
              {
                id: "cree",
                effets: [cible("creer", 0.9, 1.2), { type: "coeur", dim: "creer" }],
                citation: "toujours",
              },
              {
                id: "aide",
                effets: [cible("aider", 0.9, 1.2), { type: "coeur", dim: "aider" }],
                citation: "toujours",
              },
              {
                id: "resolu",
                effets: [cible("comprendre", 0.85, 1.2), { type: "coeur", dim: "comprendre" }],
                citation: "toujours",
              },
              {
                id: "responsabilite",
                effets: [cible("diriger", 0.8, 1), cible("organiser", 0.55, 0.2)],
                citation: "toujours",
              },
              {
                id: "convaincu",
                effets: [cible("convaincre", 0.85, 1.2), { type: "coeur", dim: "convaincre" }],
                citation: "toujours",
              },
              {
                id: "parole",
                effets: [
                  cible("parole", 0.85, 1.2),
                  cible("public", 0.5, 0.2),
                  { type: "coeur", dim: "parole" },
                ],
                citation: "toujours",
              },
              // Amélioration 1 : « longtemps préparé » envoie un signal faible mais présent.
              {
                id: "longtemps_prepare",
                effets: [cible("organiser", 0.6, 0.3), cible("precision", 0.65, 0.3)],
                citation: "toujours",
              },
              { id: "autre", effets: "neutre" },
            ],
          },
          {
            type: "texte",
            cle: "fierte_recit",
            longueurMax: 140,
            effets: [{ type: "contexte", cle: "recit_fierte" }],
          },
        ],
        passer: "je_ne_sais_pas",
        avanceAuto: false,
        dureeSecondes: 62,
      },
    ],
  },

  // ----- Chapitre 5 : Ses études -----
  {
    id: "matieres",
    numero: 21,
    chapitre: "ses_etudes",
    raison:
      "« Matières où il est le plus à l'aise » (SPEC §4 B) : le bulletin est un fait que le parent voit. Signal modéré ; sert aussi aux textes.",
    variantes: [
      {
        id: "apres_bac",
        si: DEJA_BAC,
        champs: [CHAMP_MATIERES],
        passer: "je_ne_sais_pas",
        avanceAuto: false,
        dureeSecondes: 29,
      },
      {
        id: "principale",
        champs: [CHAMP_MATIERES],
        passer: "je_ne_sais_pas",
        avanceAuto: false,
        dureeSecondes: 29,
      },
    ],
  },
  {
    id: "scolarite",
    numero: 22,
    chapitre: "ses_etudes",
    raison:
      "Au lycée : « résultats scolaires globaux, contrainte douce seulement » (SPEC §4 B), sur les formations très sélectives, jamais citée. Après le bac : ce qui a coincé, qui change l'ordre des formations (promesse de la FAQ sur la réorientation).",
    variantes: [
      {
        id: "apres_bac",
        si: { tous: [DEJA_BAC, si("apres_bac_formation", ...FORMATIONS_SUIVIES)] },
        champs: [
          {
            type: "choix_multiple",
            cle: "scolarite_apres_bac",
            max: 2,
            options: [
              {
                id: "theorie",
                effets: [plafond("ecrit", 0.5, 0.4), ordre("professionnalisantes_d_abord")],
                citation: "toujours",
              },
              { id: "cadre", effets: [ordre("encadrees_d_abord")], citation: "toujours" },
              {
                id: "domaine",
                effets: [{ type: "contexte", cle: "domaine_qui_n_a_pas_plu" }],
                citation: "toujours",
              },
              // Réserve R3 : même effet que « C'est difficile en ce moment ».
              { id: "niveau", effets: [ordre("selectives_apres")] },
              { id: "rien", effets: "neutre", exclusive: true },
            ],
          },
        ],
        passer: "je_ne_sais_pas",
        avanceAuto: false,
        dureeSecondes: 25,
      },
      {
        id: "lycee_passe",
        si: DEJA_BAC,
        champs: [CHAMP_SCOLARITE],
        passer: "prefere_ne_pas_repondre",
        avanceAuto: true,
        dureeSecondes: 18,
      },
      {
        id: "lycee",
        champs: [CHAMP_SCOLARITE],
        passer: "prefere_ne_pas_repondre",
        avanceAuto: true,
        dureeSecondes: 18,
      },
    ],
  },
  {
    id: "annees_etudes",
    numero: 23,
    chapitre: "ses_etudes",
    pageDeVente: true,
    raison:
      "Question de la page de vente, mot pour mot, et premier filtre dur : la durée filtre les métiers et les formations montrées. « Le moins possible » remplace « 1 an » : 33 métiers éligibles seulement ont une formation d'un an ou moins.",
    variantes: [
      {
        id: "apres_bac",
        si: DEJA_BAC,
        champs: [CHAMP_ANNEES_ETUDES],
        passer: "aucun",
        avanceAuto: true,
        dureeSecondes: 15,
      },
      {
        id: "principale",
        champs: [CHAMP_ANNEES_ETUDES],
        passer: "aucun",
        avanceAuto: true,
        dureeSecondes: 15,
      },
    ],
  },
  {
    id: "alternance",
    numero: 24,
    chapitre: "ses_etudes",
    raison:
      "SPEC §4 B. 11 251 des 25 793 formations de la cartographie Parcoursup 2026 existent en apprentissage : un vrai levier, et un argument de la carte.",
    variantes: [
      {
        id: "principale",
        champs: [
          {
            type: "choix_unique",
            cle: "alternance",
            options: [
              {
                id: "ideal",
                effets: [
                  ordre("apprentissage_d_abord"),
                  { type: "bonus_metier", critere: "formation_en_apprentissage", poids: 0.3 },
                ],
                citation: "toujours",
              },
              {
                id: "pourquoi_pas",
                effets: [
                  { type: "bonus_metier", critere: "formation_en_apprentissage", poids: 0.1 },
                ],
              },
              {
                id: "plutot_non",
                effets: [
                  ordre("hors_apprentissage_d_abord"),
                  {
                    type: "malus_metier",
                    critere: "formations_toutes_en_apprentissage",
                    poids: 0.1,
                  },
                ],
              },
              { id: "ne_sait_pas", jeNeSaisPas: true, effets: "neutre" },
            ],
          },
        ],
        passer: "aucun",
        avanceAuto: true,
        dureeSecondes: 13,
      },
    ],
  },
  {
    id: "prive",
    numero: 25,
    chapitre: "ses_etudes",
    raison:
      "SPEC §4 B. Posée au parent (« pour vous »), puisque c'est lui qui paie ; aucune option ne dit le revenu de la famille. « Établissement privé » est toujours affiché à côté d'une formation qui n'est pas publique.",
    variantes: [
      {
        id: "principale",
        champs: [
          {
            type: "choix_unique",
            cle: "prive",
            options: [
              { id: "oui", effets: [{ type: "prive", regle: "tout" }] },
              { id: "alternance", effets: [{ type: "prive", regle: "plus_apprentissage" }] },
              { id: "non", effets: [{ type: "prive", regle: "public_et_6_types" }] },
              {
                id: "ne_sait_pas",
                jeNeSaisPas: true,
                effets: [{ type: "prive", regle: "public_d_abord" }],
              },
            ],
          },
        ],
        passer: "aucun",
        avanceAuto: true,
        dureeSecondes: 17,
      },
    ],
  },
  {
    id: "departement",
    numero: 26,
    chapitre: "ses_etudes",
    raison:
      "SPEC §0 : des formations réelles, proches du département si possible. On demande où habite la famille : c'est le même repère que Q27 (« s'éloigner de la maison »).",
    variantes: [
      {
        id: "principale",
        champs: [
          {
            type: "departement",
            cle: "departement",
            effets: [{ type: "contexte", cle: "departement" }],
          },
        ],
        passer: "je_ne_sais_pas",
        avanceAuto: false,
        dureeSecondes: 14,
      },
    ],
  },
  {
    id: "mobilite",
    numero: 27,
    chapitre: "ses_etudes",
    raison:
      "SPEC §4 A. N'écarte aucun métier ; ordonne les formations, et dit la vérité sur la distance.",
    variantes: [
      {
        id: "principale",
        champs: [
          {
            type: "choix_unique",
            cle: "mobilite",
            options: [
              {
                id: "rester_pres",
                effets: [
                  { type: "rayon", rayon: "departement_et_voisins" },
                  { type: "malus_metier", critere: "aucune_formation_dans_la_region", poids: 0.15 },
                ],
              },
              { id: "region", effets: [{ type: "rayon", rayon: "region" }] },
              { id: "france", effets: [{ type: "rayon", rayon: "france" }] },
              {
                id: "ne_sait_pas",
                jeNeSaisPas: true,
                effets: [{ type: "rayon", rayon: "region" }],
              },
            ],
          },
        ],
        passer: "aucun",
        avanceAuto: true,
        dureeSecondes: 14,
      },
    ],
  },

  // ----- Chapitre 6 : Pour finir -----
  {
    id: "refus",
    numero: 28,
    chapitre: "pour_finir",
    raison:
      "Exclusions dures (SPEC §4 B). Chaque option correspond exactement à un drapeau de la grille (dimensions.md §3.7), pris dans les faits du ROME.",
    variantes: [
      {
        id: "principale",
        champs: [
          {
            type: "choix_multiple",
            cle: "refus",
            max: null,
            options: [
              { id: "soins", effets: [filtre("soins")], citation: "toujours" },
              { id: "vente", effets: [filtre("vente")], citation: "toujours" },
              { id: "chiffres", effets: [filtre("chiffres")], citation: "toujours" },
              { id: "nuit", effets: [filtre("nuit")], citation: "toujours" },
              { id: "week_end", effets: [filtre("week_end")], citation: "toujours" },
              { id: "physique", effets: [filtre("effort_physique")], citation: "toujours" },
              { id: "bureau", effets: [filtre("bureau_toute_la_journee")], citation: "toujours" },
              { id: "rien", effets: "neutre", exclusive: true },
            ],
          },
        ],
        passer: "je_ne_sais_pas",
        avanceAuto: false,
        dureeSecondes: 34,
      },
    ],
  },
  {
    id: "ce_qui_compte",
    numero: 29,
    chapitre: "pour_finir",
    raison:
      "Bloc D de SPEC §4. Seule question qui demande un avis : on l'assume (« d'après vous »), elle vient à la fin et pèse surtout sur les pénalités et les attributs.",
    variantes: [
      {
        id: "principale",
        champs: [
          {
            type: "choix_multiple",
            cle: "ce_qui_compte",
            max: 2,
            options: [
              {
                id: "gagner",
                effets: [{ type: "penalite_moteur", penalite: "salaire_debut_bas", facteur: 2 }],
                citation: "toujours",
              },
              { id: "utile", effets: [cible("aider", 0.7, 0.4)], citation: "toujours" },
              {
                id: "patron",
                effets: [{ type: "bonus_metier", critere: "independant_possible", poids: 0.3 }],
                citation: "toujours",
              },
              {
                id: "stable",
                effets: [
                  { type: "penalite_moteur", penalite: "recrute_peu", facteur: 2 },
                  { type: "bonus_metier", critere: "secteur_public", poids: 0.1 },
                ],
                citation: "toujours",
              },
              { id: "creer", effets: [cible("creer", 0.7, 0.4)], citation: "toujours" },
              {
                id: "bouger",
                effets: [cible("deplacements", 0.7, 0.6), cible("variete", 0.65, 0.2)],
                citation: "toujours",
              },
              { id: "temps", effets: [plafond("horaires", 0.35, 0.6)], citation: "toujours" },
            ],
          },
        ],
        passer: "je_ne_sais_pas",
        avanceAuto: false,
        dureeSecondes: 27,
      },
    ],
  },
  {
    id: "metier_evoque",
    numero: 30,
    chapitre: "pour_finir",
    raison:
      "Bloc E de SPEC §4. Jamais imposé : les résultats disent où le métier se situe. Les suggestions rattachent la saisie à une appellation ROME, sans LLM ; deux champs, parce qu'un enfant qui hésite parle souvent de deux métiers.",
    variantes: [
      {
        id: "principale",
        champs: [
          {
            type: "metiers",
            cle: "metier_evoque",
            cleAppellations: "metier_evoque_appellations",
            max: 2,
            longueurMax: 80,
            effets: [{ type: "contexte", cle: "metiers_evoques" }],
          },
        ],
        passer: "je_ne_sais_pas",
        avanceAuto: false,
        dureeSecondes: 25,
      },
    ],
  },
];

/** Écrans hors questions et leur durée (conception §2.2 et §7). */
export const ECRANS: readonly Ecran[] = [
  { id: "accueil", avant: "prenom_pronom", dureeSecondes: 18 },
  { id: "transition_observation", avant: "seul_groupe", dureeSecondes: 14 },
  { id: "transition_pratique", avant: "matieres", dureeSecondes: 7 },
  { id: "fin", avant: null, dureeSecondes: 3 },
];

/** Questions d'observation qui comptent pour l'écran de fin : Q4 à Q20 (réserve R9). */
export const OBSERVATION = { premier: 4, dernier: 20 } as const;
/** En dessous, message ferme sur l'écran de fin (conception §2.2). */
export const MIN_REPONSES_OBSERVATION = 8;
/** À partir de là, message doux sur l'écran de fin. */
export const SEUIL_PASSEES_MESSAGE_DOUX = 6;

/**
 * Dimension de cœur, repli (conception §5.5, point 3) : quand Q20 n'en désigne
 * pas, le moteur la cherche parmi ces dimensions (profil ≥ 0,6 et Σw ≥ 1).
 */
export const DIMENSIONS_REPLI_COEUR: readonly Dimension[] = [
  "aider",
  "convaincre",
  "organiser",
  "fabriquer",
  "creer",
  "comprendre",
  "chiffres",
  "numerique",
  "vivant",
  "parole",
];

/**
 * `diriger` ne décide pas seul (conception §5.5, point 5) : sa confiance est
 * plafonnée, sauf si Q10 et Q20 concordent.
 */
export const PLAFOND_CONFIANCE_DIRIGER = {
  dim: "diriger",
  confianceMax: 0.5,
  saufSi: { tous: [si("role_groupe", "prend_en_main"), si("fierte", "responsabilite")] },
} as const satisfies { dim: Dimension; confianceMax: number; saufSi: Condition };

// ---------------------------------------------------------------------------
// Accès
// ---------------------------------------------------------------------------

const PAR_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export function questionParId(id: string): Question | undefined {
  return PAR_ID.get(id as Question["id"]);
}

/** Tous les champs d'une question, toutes variantes confondues (un champ partagé n'apparaît qu'une fois). */
export function champsDeLaQuestion(question: Question): Champ[] {
  const vus = new Set<Champ>();
  for (const variante of question.variantes) for (const champ of variante.champs) vus.add(champ);
  return [...vus];
}

/** Champs de tout le questionnaire, regroupés par clé (un même champ peut exister en plusieurs versions : spécialités). */
export function champsParCle(): Map<string, { question: Question; champs: Champ[] }> {
  const index = new Map<string, { question: Question; champs: Champ[] }>();
  for (const question of QUESTIONS) {
    for (const champ of champsDeLaQuestion(question)) {
      const entree = index.get(champ.cle) ?? { question, champs: [] };
      entree.champs.push(champ);
      index.set(champ.cle, entree);
    }
  }
  return index;
}
