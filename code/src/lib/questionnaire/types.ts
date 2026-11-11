/**
 * Types de la définition du questionnaire parent (tâche 2.1).
 *
 * Document de conception : docs/conception/questionnaire.md (v2), validé par
 * docs/conception/questionnaire-critique-2.md, modifié par
 * docs/conception/questions-ouvertes.md (v3 : trois phrases libres, Q7 et Q14
 * retirées ; réserves R1 à R4 de questions-ouvertes-critique-2.md). Lecture pour le propriétaire :
 * docs/QUESTIONNAIRE.md, généré depuis la définition.
 *
 * La définition ne contient que des identifiants, des règles et des effets.
 * Les textes affichés vivent dans content/questionnaire.ts.
 */
import type { Dimension } from "@/lib/donnees/schema-dimensions";
import type { DRAPEAUX } from "@/lib/donnees/schema-dimensions";

export type { Dimension };
export type Drapeau = (typeof DRAPEAUX)[number];
export type Genre = "il" | "elle";

export const IDS_QUESTIONS = [
  "prenom_pronom",
  "situation",
  "situation_detail",
  "seul_groupe",
  "temps_libre",
  "aide_demandee",
  "rester_assis",
  "week_end",
  "role_groupe",
  "adultes_inconnus",
  "obtenir",
  "prendre_soin",
  "organisation",
  "probleme",
  "imprevu",
  "chiffres",
  "ecrans",
  "fierte",
  "matieres",
  "scolarite",
  "annees_etudes",
  "alternance",
  "prive",
  "departement",
  "mobilite",
  "refus",
  "ce_qui_compte",
  "metier_evoque",
] as const;
export type IdQuestion = (typeof IDS_QUESTIONS)[number];

export const IDS_CHAPITRES = [
  "pour_commencer",
  "au_quotidien",
  "avec_les_autres",
  "sa_facon_de_faire",
  "ses_etudes",
  "pour_finir",
] as const;
export type IdChapitre = (typeof IDS_CHAPITRES)[number];

/**
 * Dimensions qui peuvent être « de cœur » (conception §5.5) : jamais
 * `diriger` ni `physique`. Le type l'interdit à la compilation.
 */
export type DimensionCoeur =
  "organiser" | "fabriquer" | "creer" | "aider" | "comprendre" | "convaincre" | "parole";

// ---------------------------------------------------------------------------
// Effets : liste fermée (critique du tour 2, amélioration 2).
// ---------------------------------------------------------------------------

/** Cible : le profil tend vers `valeur` sur `dim`, avec ce poids (moyenne pondérée, §5.1). */
export interface EffetCible {
  type: "cible";
  dim: Dimension;
  valeur: number;
  poids: number;
}

/** Seuil : les métiers sous `valeur` sont pénalisés ; au-dessus, aucun bonus (§5.2). */
export interface EffetSeuil {
  type: "seuil";
  dim: Dimension;
  valeur: number;
  poids: number;
}

/** Plafond : les métiers au-dessus de `valeur` sont pénalisés ; en dessous, aucun bonus (§5.2). */
export interface EffetPlafond {
  type: "plafond";
  dim: Dimension;
  valeur: number;
  poids: number;
}

/** Dimension de cœur désignée par la fierté (Q20). Son absence vaut « repli » (§5.5). */
export interface EffetCoeur {
  type: "coeur";
  dim: DimensionCoeur;
}

/** Exclusion dure : aucun métier qui porte ce drapeau (Q28, dimensions.md §3.7). */
export interface EffetFiltreDrapeau {
  type: "filtre_drapeau";
  drapeau: Drapeau;
}

/**
 * Durée d'études maximale acceptée (Q23), en années après le bac. Filtre les
 * métiers (niveau minimum) et les formations montrées (§5.3, §5.4).
 * `null` : aucun plafond.
 */
export interface EffetEtudes {
  type: "etudes";
  maxAnnees: 2 | 3 | 5 | null;
}

/** Formations privées gardées (Q25, §5.3). */
export interface EffetPrive {
  type: "prive";
  regle:
    | "tout" // toutes les formations
    | "public_et_6_types" // public + privé sous contrat des six types (BTS, BUT, CPGE, CS et FCIL, DN MADE, diplômes d'État)
    | "plus_apprentissage" // la règle précédente + toute formation privée en apprentissage
    | "public_d_abord"; // toutes, le public d'abord
}

/** Critères de métier sur lesquels portent les bonus et malus. */
export type CritereMetier =
  | "independant_possible" // attribut de la grille
  | "secteur_public" // attribut de la grille
  | "formation_en_apprentissage" // au moins une formation reliée en apprentissage
  | "formations_toutes_en_apprentissage" // toutes les formations restantes en apprentissage
  | "aucune_formation_un_an_au_plus" // aucune formation compatible d'un an ou moins
  | "etudes_au_dela_de_3_ans" // niveau minimum au-delà de bac + 3
  | "aucune_formation_dans_la_region"; // aucune formation dans la région de Q26

export interface EffetBonusMetier {
  type: "bonus_metier";
  critere: CritereMetier;
  poids: number;
}

export interface EffetMalusMetier {
  type: "malus_metier";
  critere: CritereMetier;
  poids: number;
}

/** Pénalité du moteur multipliée (Q29). */
export interface EffetPenaliteMoteur {
  type: "penalite_moteur";
  penalite: "salaire_debut_bas" | "recrute_peu";
  facteur: number;
}

/** Ordre des formations montrées sous une piste : rien n'est retiré. */
export interface EffetOrdreFormations {
  type: "ordre_formations";
  regle:
    | "apprentissage_d_abord"
    | "hors_apprentissage_d_abord"
    | "professionnalisantes_d_abord" // BTS, BUT, DEUST, CS et FCIL, BPJEPS, titres pro, apprentissage
    | "encadrees_d_abord" // BTS, BUT, DN MADE, diplômes d'État, apprentissage
    | "bts_d_abord"
    | "selectives_apres" // taux d'accès Parcoursup < 20 % après les autres
    | "courtes_d_abord";
}

/** Rayon de recherche des formations (Q27), centré sur le département de Q26. */
export interface EffetRayon {
  type: "rayon";
  rayon: "departement_et_voisins" | "region" | "france";
}

/** Contexte transmis aux textes, au guide et au calendrier, sans effet sur le score. */
export interface EffetContexte {
  type: "contexte";
  cle: CleContexte;
}

export type CleContexte =
  | "genre"
  | "prenom"
  | "situation"
  | "specialites"
  | "serie"
  | "domaine_bac_pro"
  | "activite_apres_bac"
  | "formation_apres_bac"
  | "bac"
  | "recit_fierte"
  | "texte_temps_libre"
  | "exemple_aide"
  | "domaine_qui_n_a_pas_plu"
  | "departement"
  | "metiers_evoques";

export type Effet =
  | EffetCible
  | EffetSeuil
  | EffetPlafond
  | EffetCoeur
  | EffetFiltreDrapeau
  | EffetEtudes
  | EffetPrive
  | EffetBonusMetier
  | EffetMalusMetier
  | EffetPenaliteMoteur
  | EffetOrdreFormations
  | EffetRayon
  | EffetContexte;

export type TypeEffet = Effet["type"];

/** Au moins un effet, ou « neutre » écrit en toutes lettres. */
export type Effets = "neutre" | readonly [Effet, ...Effet[]];

// ---------------------------------------------------------------------------
// Conditions d'affichage
// ---------------------------------------------------------------------------

/**
 * Condition sur les réponses déjà données. `cle` désigne un champ (unique dans
 * tout le questionnaire) ; la condition est vraie si la réponse à ce champ
 * contient une des options de `parmi`. Sans réponse, elle est fausse.
 */
export type Condition =
  { cle: string; parmi: readonly string[] } | { tous: readonly Condition[] } | { non: Condition };

/** Quand une option peut être citée dans « Pourquoi ça lui ressemble ». */
export type RegleCitation =
  | "toujours"
  | { si: Condition } // selon une autre réponse
  | { siMetier: Drapeau }; // seulement pour un métier qui porte ce drapeau

// ---------------------------------------------------------------------------
// Options, champs, variantes, questions
// ---------------------------------------------------------------------------

export interface Option {
  /** Identifiant stable, jamais réutilisé pour un autre sens (§5.7). */
  id: string;
  effets: Effets;
  /** Affichée seulement si la condition est vraie. */
  si?: Condition;
  /** Décoche les autres options (et inversement). */
  exclusive?: true;
  /** L'option est le « je ne sais pas » de l'écran. */
  jeNeSaisPas?: true;
  /** Absente : l'option n'est jamais citée. Le texte est dans content/. */
  citation?: RegleCitation;
}

interface ChampBase {
  /** Clé de la réponse, unique dans tout le questionnaire. */
  cle: string;
  /**
   * Champ affiché seulement si la condition est vraie (questions ouvertes §2.2).
   * Masqué, sa réponse est gardée mais ignorée, comme une réponse sans objet.
   */
  si?: Condition;
}

export interface ChampChoixUnique extends ChampBase {
  type: "choix_unique";
  options: readonly Option[];
}

export interface ChampChoixMultiple extends ChampBase {
  type: "choix_multiple";
  options: readonly Option[];
  /** Nombre maximal de choix ; `null` : sans limite. */
  max: number | null;
}

export interface ChampTexte extends ChampBase {
  type: "texte";
  longueurMax: number;
  effets: Effets;
  /**
   * Drapeaux du conseiller (conseiller-ia.md §3.2) : absents, ils valent `true`.
   * `false` : la réponse n'est jamais citée (`citable`) ou jamais reprise dans
   * la version enfant (`enfant`). Inutilisés par les trois champs actuels.
   */
  citable?: boolean;
  enfant?: boolean;
}

export interface ChampDepartement extends ChampBase {
  type: "departement";
  effets: Effets;
}

/** Métiers évoqués (Q30) : saisies libres, et appellations ROME choisies parmi les suggestions. */
export interface ChampMetiers extends ChampBase {
  type: "metiers";
  /** Clé des codes OGR des appellations choisies. */
  cleAppellations: string;
  max: number;
  longueurMax: number;
  effets: Effets;
}

export type Champ =
  ChampChoixUnique | ChampChoixMultiple | ChampTexte | ChampDepartement | ChampMetiers;

export type ChampAOptions = ChampChoixUnique | ChampChoixMultiple;

/**
 * Lien de l'écran pour ne pas répondre :
 * - `je_ne_sais_pas` : « Je ne sais pas, passer » ;
 * - `prefere_ne_pas_repondre` : « Je préfère ne pas répondre » (Q22 au lycée) ;
 * - `aucun` : la question est obligatoire, ou a sa propre option « Je ne sais pas ».
 */
export type LienPasser = "je_ne_sais_pas" | "prefere_ne_pas_repondre" | "aucun";

export interface Variante {
  id: string;
  /**
   * La première variante dont la condition est vraie est affichée. La dernière
   * n'a pas de condition, sauf si celle de la question suffit (Q3).
   */
  si?: Condition;
  champs: readonly [Champ, ...Champ[]];
  passer: LienPasser;
  /** Le toucher enregistre et passe à l'écran suivant ; sinon, bouton « Continuer ». */
  avanceAuto: boolean;
  /** Durée estimée, en secondes (conception §7). */
  dureeSecondes: number;
}

export interface Question {
  id: IdQuestion;
  /**
   * Numéro de référence (1 à 30), celui des documents de conception. Les
   * numéros 7 et 14 sont des trous depuis la version 3 (questions-ouvertes §8.3) :
   * l'en-tête « Question n sur total » vient du rang dans le parcours.
   */
  numero: number;
  chapitre: IdChapitre;
  /** Question reprise mot pour mot de la page de vente. */
  pageDeVente?: true;
  /** Question sautée si la condition est fausse. */
  si?: Condition;
  /** Pourquoi cette question (documentation, jamais affichée). */
  raison: string;
  variantes: readonly [Variante, ...Variante[]];
}

/** Écrans hors questions (conception §2.2). */
export interface Ecran {
  id: "accueil" | "transition_observation" | "transition_pratique" | "fin";
  /** Placé juste avant cette question ; `null` : après la dernière. */
  avant: IdQuestion | null;
  dureeSecondes: number;
}

// ---------------------------------------------------------------------------
// Forme des textes (content/questionnaire.ts)
// ---------------------------------------------------------------------------

/**
 * Un texte avec accords : `{il|elle}` donne la forme masculine puis féminine ;
 * `{prenom}`, `{de_prenom}` (« de Lucas », « d'Anaïs »), `{que_prenom}` et
 * toute autre `{variable}` sont remplacés au rendu (src/lib/questionnaire/accords.ts).
 */
export type Gabarit = string;

/** Texte qui change selon qu'un prénom a été saisi ou non. */
export type TexteSelonPrenom = Gabarit | { avecPrenom: Gabarit; sansPrenom: Gabarit };

export interface ContenuOption {
  libelle: Gabarit;
  /** Proposition qui suit « Vous avez dit qu' » / « Vous avez dit que ». */
  citation?: Gabarit;
}

export interface ContenuChamp {
  libelle?: Gabarit;
  aide?: Gabarit;
  /** Exemple grisé dans un champ texte. */
  exemple?: Gabarit;
  /**
   * Amorce de citation d'un champ libre (questions-ouvertes §4.2) : début de
   * proposition qui suit « Vous avez dit qu' » / « que », que le LLM complète
   * avec les mots du parent. Jamais affichée au parent ; lue par `amorceDe`.
   */
  citation?: Gabarit;
}

export interface ContenuVariante {
  titre?: TexteSelonPrenom;
  aide?: Gabarit;
  /** Remplace le libellé ou la citation d'une option dans cette variante. */
  options?: Readonly<Record<string, Partial<ContenuOption>>>;
}

export interface ContenuQuestion {
  surtitre?: Gabarit;
  /** Absent seulement si chaque variante a le sien. */
  titre?: TexteSelonPrenom;
  aide?: Gabarit;
  champs?: Readonly<Record<string, ContenuChamp>>;
  options?: Readonly<Record<string, ContenuOption>>;
  variantes?: Readonly<Record<string, ContenuVariante>>;
}
