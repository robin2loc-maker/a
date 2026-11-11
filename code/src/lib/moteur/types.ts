/**
 * Types du moteur de score (tâche 2.2).
 *
 * Conception : docs/conception/moteur.md (v2), validée avec réserves par
 * docs/conception/moteur-critique-2.md. Le moteur lit les types du
 * questionnaire tels quels ; il ne connaît aucune question par son texte.
 */
import type { MetierCatalogue } from "@/lib/donnees/catalogue";
import type { VERSION_QUESTIONNAIRE } from "@/lib/questionnaire/definition";
import type {
  CritereMetier,
  Dimension,
  Drapeau,
  EffetOrdreFormations,
  EffetPrive,
  EffetRayon,
} from "@/lib/questionnaire/types";

export type { Dimension, Drapeau };

/** Une réponse du parent : clé du champ et identifiant d'option. */
export type RefReponse = { cle: string; option: string };

/**
 * Quand la réponse peut être citée dans « Pourquoi ça lui ressemble »
 * (`Option.citation` de la définition, évaluée sur les réponses) : toujours,
 * jamais, ou seulement pour un métier qui porte ce drapeau.
 */
export type CitationReponse = "toujours" | "jamais" | { siMetier: Drapeau };

export type SourceTerme = RefReponse & { valeur: number; poids: number; citation: CitationReponse };

export type Cible = { valeur: number; poids: number; sommePoids: number; sources: SourceTerme[] };
export type SensUnique = { valeur: number; poids: number; source: SourceTerme };

export type Profil = {
  version: typeof VERSION_QUESTIONNAIRE;
  cibles: Partial<Record<Dimension, Cible>>;
  seuils: Partial<Record<Dimension, SensUnique>>;
  plafonds: Partial<Record<Dimension, SensUnique>>;
  coeur: { dim: Dimension; origine: "fierte" | "repli" } | null;
  /** Deux au plus (§1.3, point 6). */
  interetsSecondaires: Dimension[];
  filtres: { etudesMax: 2 | 3 | 5 | null; refus: Drapeau[]; prive: EffetPrive["regle"] };
  bonusMalus: {
    sens: "bonus" | "malus";
    critere: CritereMetier;
    points: number;
    source: RefReponse;
  }[];
  /** 1 par défaut ; Q29 les double. */
  facteurs: { salaire_debut_bas: number; recrute_peu: number };
  formations: {
    ordre: EffetOrdreFormations["regle"][];
    rayon: EffetRayon["rayon"];
    departement: string | null;
  };
  /** Codes ROME, 2 au plus (Q30, via la table des appellations). */
  metiersEvoques: string[];
  qualite: { dimensionsDecrites: number; reponsesObservation: number; insuffisant: boolean };
  /** Réponses qui portent les filtres, pour les raisons d'écart. */
  refs: Partial<Record<"etudes" | "prive" | Drapeau, RefReponse>>;
};

export type Source = { nom: string; url: string; millesime: string };

// ---------------------------------------------------------------------------
// Données chargées
// ---------------------------------------------------------------------------

/** Accès au métier (scripts/data/acces_metiers.py, conception §2.2). */
export type AccesMetier = {
  experience: "texte" | "intitule" | null;
  preuve: string | null;
  method: "texte_rome" | "intitule_et_diriger" | null;
  /** Phrase ROME qui cite une expérience, pour un métier non filtré (critique 2, R6). */
  condition_experience: string | null;
  /** « condition » : une voie d'accès la demande ; « atout » : simple plus. */
  nature_experience: "condition" | "atout" | null;
  /** Plus haut « Bac + N » du texte d'accès, s'il dépasse le niveau minimum (§9, D5). */
  bac_plus_max: number | null;
};

export type MetierMoteur = MetierCatalogue & { acces: AccesMetier };

/** Une formation Parcoursup, réduite à ce que le moteur et la carte utilisent. */
export type FormationIndex = {
  code: number;
  intitule: string;
  type: string;
  etablissement: string;
  commune: string | null;
  departement: string | null;
  region: string | null;
  statut: "public" | "prive_sous_contrat" | "prive";
  apprentissage: boolean;
  lien: string;
  gps: [number, number] | null;
  /** Taux d'accès Parcoursup en %, ou `null` (formations_admission.json). */
  tauxAcces: number | null;
};

export type DureeConnue = { duree: number; source: Source };

/** Index construit une fois au chargement ; les fonctions du moteur le reçoivent en argument. */
export type IndexMoteur = {
  metiers: MetierMoteur[];
  parCode: ReadonlyMap<string, MetierMoteur>;
  /** Mentions Parcoursup du catalogue : code_formation → type, intitulé, codes des formations. */
  mentions: ReadonlyMap<string, { type: string; intitule: string; codes: number[] }>;
  formations: ReadonlyMap<number, FormationIndex>;
  /** Formations reliées à chaque métier, sans proximité (précalculées). */
  formationsParMetier: ReadonlyMap<string, FormationCompatible[]>;
  /** Durée par mention (code_formation), ou `null` si inconnue (§2.3). */
  dureesParMention: ReadonlyMap<string, DureeConnue | null>;
  departements: ReadonlyMap<string, { lat: number; lon: number; region: string }>;
  /** Fiabilité de la dimension (§3.2). */
  k: Readonly<Record<Dimension, number>>;
  /** Dimensions en échec sur l'absence informative (§3.3). */
  echecAbsence: ReadonlySet<Dimension>;
  /** Moyenne de chaque dimension sur les métiers éligibles (§3.1). */
  moyennes: Readonly<Record<Dimension, number>>;
  /** Pénalités moyennes, pour une donnée de marché absente (critique 2, R5). */
  penaliteMoyenne: { recrutement: number; ia: number };
  /** Part des profils du panel où le métier est dans les 10 premiers par affinité (§3.6). */
  frequences: ReadonlyMap<string, number>;
  appellations: ReadonlyMap<string, string>;
  /** Source des phrases d'accès citées (ROME 4.0, France Travail). */
  sourceAcces: Source;
  nonEligibles: ReadonlyMap<string, { libelle: string; manquants: string[] }>;
  empreintes: { catalogue: string; panel: string };
};

// ---------------------------------------------------------------------------
// Filtres
// ---------------------------------------------------------------------------

export type FormationCompatible = {
  code: number;
  codeFormation: string;
  intitule: string;
  type: string;
  etablissement: string;
  commune: string | null;
  departement: string | null;
  region: string | null;
  lien: string;
  prive: boolean;
  statut: FormationIndex["statut"];
  apprentissage: boolean;
  /** Durée en années, avec sa source, ou `null` si inconnue. */
  duree: DureeConnue | null;
  tauxAcces: number | null;
  confianceMention: "haute" | "moyenne";
  distanceKm: number | null;
  dansLeRayon: boolean;
};

export type Exclusion =
  | { code: "etudes_niveau"; bacPlusMetier: number; etudesMax: 2 | 3 | 5; reponse: RefReponse }
  | { code: "refus"; drapeau: Drapeau; reponse: RefReponse }
  | { code: "experience"; preuve: string; source: Source }
  | { code: "encadrement"; preuvesDiriger: string[] }
  | {
      code: "formations";
      parDuree: number;
      parPrive: number;
      dureeMin: number | null;
      reponseEtudes?: RefReponse;
      reponsePrive?: RefReponse;
    };

export type ResultatFiltre = { exclusions: Exclusion[]; formations: FormationCompatible[] };

// ---------------------------------------------------------------------------
// Score
// ---------------------------------------------------------------------------

export type TypeTerme = "cible" | "seuil" | "plafond";

export type Terme = {
  dim: Dimension;
  type: TypeTerme;
  valeur: number;
  /** Wₜ : poids du profil. */
  poids: number;
  sources: SourceTerme[];
};

export type DetailScore = {
  affinite: number;
  score: number;
  penalites: Record<string, number>;
  bonus: Record<string, number>;
  /** Fractions brutes des pénalités de marché, avant facteur (`null` : donnée absente). */
  marche: { recrutement: number | null; salaire: number | null; ia: number | null };
};

// ---------------------------------------------------------------------------
// Résultat
// ---------------------------------------------------------------------------

export type LienExplicatif = {
  dimension: Dimension;
  type: TypeTerme;
  poidsExplicatif: number;
  /** Réponses citables, la plus forte d'abord. */
  reponses: RefReponse[];
  metier: { valeur: number; niveau: number; method: string; preuves: string[] };
  citable: boolean;
};

export type LienContrainte =
  | {
      type: "etudes";
      reponse: RefReponse;
      bacPlusMetier: number;
      /** Borne haute du texte d'accès ROME (§9, D5), ou `null`. */
      bacPlusMax: number | null;
      dureeMin: number | null;
    }
  | { type: "alternance"; reponse: RefReponse; formationsEnApprentissage: number }
  | {
      /** Critique 2, R6 : la fiche ROME cite une expérience (souvent pour la voie courte). */
      type: "experience_citee";
      preuve: string;
      source: Source;
      nature: "condition" | "atout";
      /** Vrai si la plus longue voie citée tient dans la durée d'études répondue. */
      voieLongueOuverte: boolean;
    };

export type Piste = {
  code_rome: string;
  libelle: string;
  /** Rang parmi les candidats (1 = premier). */
  rang: number;
  score: number;
  affinite: number;
  penalites: Record<string, number>;
  bonus: Record<string, number>;
  connu: boolean;
  /** 3 à 6 formations montrées (§8.3). */
  formations: FormationCompatible[];
  formationsCompatibles: number;
  liens: LienExplicatif[];
  contraintes: LienContrainte[];
};

export type RaisonEcart =
  | Exclusion
  | { code: "recrutement"; projets: number; metierBmo: string; source: Source }
  | { code: "salaire"; salaire: MetierCatalogue["salaire"] }
  | { code: "ia"; niveau: "élevée"; source: Source }
  | { code: "variante"; de: string };

export type Ecarte = {
  code_rome: string;
  libelle: string;
  affinite: number;
  raison: RaisonEcart;
  autresRaisons: RaisonEcart[];
  evoque: boolean;
};

export type SituationEvoque =
  | { statut: "piste"; rang: number }
  | { statut: "ecarte"; raisons: RaisonEcart[] }
  | { statut: "moins_proche"; rang: number; ecarts: LienExplicatif[] }
  | { statut: "non_eligible"; libelle: string | null; manquants: string[] };

export type CandidatResume = {
  code_rome: string;
  libelle: string;
  rang: number;
  score: number;
  affinite: number;
  domaine: string;
  grandDomaine: string;
  metierBmo: string | null;
  valeurCoeur: number | null;
  connu: boolean;
};

export type ResultatMoteur = {
  moteur: {
    version: string;
    catalogue: string;
    panel: string;
    questionnaire: typeof VERSION_QUESTIONNAIRE;
  };
  profil: Profil;
  /** 3, ou moins si les filtres n'en laissent pas davantage (`pistesManquantes`). */
  pistes: Piste[];
  pistesManquantes: 0 | 1 | 2 | 3;
  ecartes: Ecarte[];
  evoques: { code_rome: string; situation: SituationEvoque }[];
  /** 15 premiers candidats (LLM, évaluation). */
  candidats: CandidatResume[];
  nombreCandidats: number;
  regleCoeur: "satisfaite" | "sans_objet" | "tombee";
  palier: 1 | 2 | 3 | 4;
  qualite: Profil["qualite"];
};
