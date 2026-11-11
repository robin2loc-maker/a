/**
 * Types du conseiller IA (tâche 2.4, docs/conception/conseiller-ia.md).
 *
 * La « charge » est ce qu'on envoie au LLM (§3) ; le « contexte » garde à
 * côté ce que le validateur et les gabarits doivent savoir sans l'envoyer
 * (prénom, données du moteur). La « sortie » est la réponse du LLM (§5) ; le
 * « conseil » est ce qu'on enregistre avec le bilan (§8.1).
 */
import type { CandidatPreselection, Preselection } from "@/lib/moteur/preselection";
import type { Drapeau, MetierMoteur, Profil, RaisonEcart } from "@/lib/moteur/types";
import type { Genre } from "@/lib/questionnaire/types";

// ---------------------------------------------------------------------------
// Charge envoyée (§3)
// ---------------------------------------------------------------------------

/**
 * `terrain` n'est pas un drapeau du catalogue : le conseiller le dérive des
 * conditions de travail ROME (charge.ts, passe qualité de 2.4).
 */
export type DrapeauCitation = Drapeau | "terrain";

export type Citable = boolean | { si_metier: DrapeauCitation };

export type ReponseEnvoyee = {
  /** Option : « <clé>=<option> » ; champ libre : « <clé> ». */
  id: string;
  question: string;
  reponse?: string;
  texte?: string;
  citation?: string;
  /**
   * Trait enfant de la table (`content/conseiller.ts`), accordé (critique 2,
   * R2) ; pour une réponse écrite, l'amorce de la question au tutoiement.
   */
  trait_enfant?: string;
  citable: Citable;
  contrainte: boolean;
  enfant: boolean;
};

export type FaitEnvoye = { id: string; texte: string };

export type CandidatEnvoye = {
  code: string;
  metier: string;
  position: number;
  rang: number;
  domaine: string;
  grand_domaine: string;
  connu: boolean;
  evoque: boolean;
  souvent_propose: boolean;
  porte_le_coeur: boolean;
  incompatibles: string[];
  simplement_pre_redige: boolean;
  etudes: {
    niveau: string;
    jusqu_a: string | null;
    types_de_formation: string[];
    apprentissage: boolean;
    condition_experience: string | null;
    voie_courte_incertaine: boolean;
  };
  marche: {
    recrute_peu: boolean;
    salaire_debut_bas: boolean;
    ia_elevee: boolean;
    salaire_niveau: "bas" | "moyen" | "haut" | null;
  };
  drapeaux: string[];
  ia: { afficher: boolean; niveau: "faible" | "modérée" | "élevée" | null };
  faits: FaitEnvoye[];
  proximite: { dimension: string; reponses: string[]; faits: string[] }[];
};

export type EcarteEnvoye = {
  code: string;
  metier: string;
  motif: "etudes_niveau" | "formations" | "refus" | "encadrement";
  phrase_de_base: string;
};

export type ChargeEnvoyee = {
  pronom: Genre;
  nombre_de_pistes: number;
  coeur: { dimension: string; reponse: string | null } | null;
  reponses: ReponseEnvoyee[];
  passees: string[];
  candidats: CandidatEnvoye[];
  ecartes: EcarteEnvoye[];
};

// ---------------------------------------------------------------------------
// Contexte (non envoyé)
// ---------------------------------------------------------------------------

export type CandidatInterne = {
  envoye: CandidatEnvoye;
  metier: MetierMoteur;
  preselection: CandidatPreselection;
  /** Niveau d'accès et borne haute du texte d'accès (T13, §6.3). */
  bacPlus: number;
  bacPlusMax: number | null;
  /** Libellé accordé au genre (§7.3.1). */
  libelle: string;
  /** Texte pré-rédigé de « Le métier, simplement », s'il existe (§7.3.2). */
  simplementPreRedige: string | null;
};

export type EcarteInterne = EcarteEnvoye & { raison: RaisonEcart };

export type Charge = {
  envoi: ChargeEnvoyee;
  genre: Genre;
  /** Question de chaque réponse envoyée (T30 : une case et sa précision écrite vont ensemble). */
  questions: Map<string, string>;
  /** Prénom saisi (jamais envoyé), pour T26. */
  prenom: string | null;
  profil: Profil;
  preselection: Preselection;
  candidats: Map<string, CandidatInterne>;
  reponses: Map<string, ReponseEnvoyee>;
  ecartes: EcarteInterne[];
};

// ---------------------------------------------------------------------------
// Sortie du LLM (§5)
// ---------------------------------------------------------------------------

export type LienParent = { reponses: string[]; rappel: string; metier: string; faits: string[] };
export type LienEnfant = { reponses: string[]; trait: string; metier: string; faits: string[] };

export type PisteSortie = {
  code: string;
  raison_du_choix: string;
  metier_simplement: string;
  ia_phrase: string;
  pourquoi_parent: LienParent[];
  pourquoi_enfant: LienEnfant[];
};

/**
 * Les raisons des écartés ne sont plus demandées au LLM (passe qualité de
 * 2.4) : il recopiait la phrase de base, que le code écrit de toute façon.
 */
export type SortieLlm = {
  analyse: string;
  pistes: PisteSortie[];
};

/** Réponse à une relance ciblée : les pistes réécrites, chacune avec le code qu'elle remplace. */
export type CorrectionLlm = { pistes: (PisteSortie & { remplace: string })[] };

// ---------------------------------------------------------------------------
// Validateur (§6)
// ---------------------------------------------------------------------------

export type CodeEchec =
  | "V01"
  | "V02"
  | "V03"
  | "V04"
  | "V05"
  | "V06"
  | "V07"
  | "V08"
  | "V09"
  | `T${"0" | "1" | "2" | "3"}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;

export type Echec = {
  code: CodeEchec;
  nature: "choix" | "texte";
  /** « pistes[0].pourquoi_parent[1].rappel », « ecartes[2].raison », « pistes ». */
  champ: string;
  piste?: string;
  /** Pour le modèle (§4.3), avec l'extrait fautif ; jamais journalisé. */
  message: string;
  /** T15 : la réponse citée dans trop de pistes. */
  reponse?: string;
  /** Échec de choix : les codes en cause (cibles d'une relance ciblée). */
  codes?: string[];
};

// ---------------------------------------------------------------------------
// Conseil enregistré (§8.1)
// ---------------------------------------------------------------------------

export type MotifRepli =
  null | "sans_cle" | "budget" | "delai" | "http" | "validation" | "jeton_trop_long" | "perime";

export type Origine = "llm" | "pre_redige" | "gabarit";

export type PisteConseil = {
  code_rome: string;
  /** Nom du métier accordé au genre. */
  metier: string;
  metierSimplement: { texte: string; origine: Origine };
  iaPhrase: { texte: string; origine: "llm" } | null;
  pourquoiParent: { liens: LienParent[]; texte: string; origine: "llm" | "gabarit" };
  pourquoiEnfant: { liens: LienEnfant[]; texte: string; origine: "llm" | "gabarit" };
  raisonDuChoix: string | null;
};

export type Conseil = {
  version: 1;
  /**
   * « llm » : les pistes du LLM ; « partiel » : le choix du LLM était fautif,
   * ses pistes compatibles sont gardées et complétées par le calcul (textes
   * des gabarits, `<code>.piste` dans `champsRemplaces`) ; « repli » : calcul seul.
   */
  source: "llm" | "partiel" | "repli";
  motifRepli: MotifRepli;
  empreinte: {
    prompt: number;
    moteur: string;
    catalogue: string;
    questionnaire: number;
    reponses: string;
  };
  fournisseur: { nom: string; modele: string; modeleServi: string } | null;
  pistes: PisteConseil[];
  /** Raisons écrites par le code (phrase de base) ; le LLM n'en rédige plus. */
  ecartes: { code_rome: string; metier: string; raison: string; origine: "gabarit" }[];
  analyse: string | null;
  champsRemplaces: string[];
  /** Appels envoyés au fournisseur réel pour ce conseil (0 en repli sans clé ou avec le mock). */
  appels: number;
  creeLe: string;
};
