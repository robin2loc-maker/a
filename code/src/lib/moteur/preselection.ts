/**
 * Présélection pour le système mixte (décision du propriétaire, après la
 * conception 2.2) : le moteur applique les filtres durs et classe ; un LLM
 * choisit ensuite les 3 pistes **uniquement** dans cette présélection et
 * rédige les textes. Si le LLM échoue, les 3 pistes du calcul seul servent
 * de repli.
 *
 * Fonction pure des réponses et de l'index : mêmes réponses, même présélection.
 */
import type { Reponses } from "@/lib/questionnaire/reponses";
import { chargerIndexMoteur } from "./donnees";
import { formationsMontrees } from "./filtres";
import { contraintes, liensExplicatifs } from "./liens";
import { METIERS_CONNUS } from "./metiers-connus";
import { calculerResultatDepuis, classer } from "./resultat";
import type { Candidat } from "./selection";
import type {
  FormationCompatible,
  IndexMoteur,
  LienContrainte,
  LienExplicatif,
  MetierMoteur,
  ResultatMoteur,
} from "./types";

export type OptionsPreselection = {
  /** Index du moteur (défaut : celui de data/processed/, chargé une fois). */
  index?: IndexMoteur;
  /** Nombre visé de candidats (défaut 20). */
  nombre?: number;
  /** Au plus N candidats d'un même grand domaine (défaut 4). */
  maxParGrandDomaine?: number;
  /** Au plus N candidats d'un même domaine professionnel (défaut 2). */
  maxParDomaine?: number;
};

export type CandidatPreselection = {
  code_rome: string;
  libelle: string;
  definition: string;
  rang: number;
  score: number;
  affinite: number;
  grandDomaine: { code: string; libelle: string };
  domaine: { code: string; libelle: string };
  connu: boolean;
  /** Données sourcées, telles que le catalogue les publie (CLAUDE.md §5). */
  donnees: {
    salaire: MetierMoteur["salaire"];
    etudes: MetierMoteur["etudes"];
    recrutement: MetierMoteur["recrutement"];
    expositionIa: MetierMoteur["exposition_ia"];
    formations: FormationCompatible[];
    formationsCompatibles: number;
  };
  /** Raisons de proximité : dimensions du métier et réponses du parent qui les portent. */
  liens: LienExplicatif[];
  contraintes: LienContrainte[];
  penalites: Record<string, number>;
  bonus: Record<string, number>;
  valeurCoeur: number | null;
  /** Vrai si le métier fait partie des 3 pistes du calcul seul. */
  pisteDuRepli: boolean;
};

export type Preselection = {
  moteur: ResultatMoteur["moteur"];
  profil: ResultatMoteur["profil"];
  candidats: CandidatPreselection[];
  /** Le calcul seul : 3 pistes (repli), écartés, métiers évoqués. */
  repli: ResultatMoteur;
};

const DEFAUTS = { nombre: 20, maxParGrandDomaine: 4, maxParDomaine: 2 };

/**
 * Environ `nombre` candidats compatibles avec les filtres durs (donc aucun
 * poste d'encadrement ou d'expérience), dans l'ordre du classement, diversifiés :
 * au plus 4 par grand domaine, 2 par domaine professionnel, un par métier BMO.
 * Les 3 pistes du calcul seul y sont toujours.
 */
export function preselectionner(
  reponses: Reponses,
  options: OptionsPreselection = {},
): Preselection {
  const { nombre, maxParGrandDomaine, maxParDomaine } = { ...DEFAUTS, ...options };
  const index = options.index ?? chargerIndexMoteur();
  const classement = classer(reponses, index);
  const repli = calculerResultatDepuis(classement, index);
  const { profil, termes, candidats } = classement;
  const codesRepli = new Set(repli.pistes.map((p) => p.code_rome));

  const choisis: Candidat[] = candidats.filter((c) => codesRepli.has(c.metier.code_rome));
  const compte = (cle: (m: MetierMoteur) => string | undefined, m: MetierMoteur) =>
    choisis.filter((c) => cle(c.metier) !== undefined && cle(c.metier) === cle(m)).length;
  for (const c of candidats) {
    if (choisis.length >= nombre) break;
    if (codesRepli.has(c.metier.code_rome)) continue;
    if (compte((m) => m.grand_domaine.code, c.metier) >= maxParGrandDomaine) continue;
    if (compte((m) => m.domaine_professionnel.code, c.metier) >= maxParDomaine) continue;
    if (compte((m) => m.recrutement?.metier_bmo.code, c.metier) >= 1) continue;
    choisis.push(c);
  }
  choisis.sort((a, b) => a.rang - b.rang);

  return {
    moteur: repli.moteur,
    profil,
    repli,
    candidats: choisis.map((c) => ({
      code_rome: c.metier.code_rome,
      libelle: c.metier.libelle,
      definition: c.metier.definition,
      rang: c.rang,
      score: c.detail.score,
      affinite: c.detail.affinite,
      grandDomaine: c.metier.grand_domaine,
      domaine: c.metier.domaine_professionnel,
      connu: METIERS_CONNUS.has(c.metier.code_rome),
      donnees: {
        salaire: c.metier.salaire,
        etudes: c.metier.etudes,
        recrutement: c.metier.recrutement,
        expositionIa: c.metier.exposition_ia,
        formations: formationsMontrees(c.formations, profil),
        formationsCompatibles: c.formations.length,
      },
      liens: liensExplicatifs(profil, termes, c.metier, index),
      contraintes: contraintes(profil, c.metier, c.formations, index),
      penalites: c.detail.penalites,
      bonus: c.detail.bonus,
      valeurCoeur: profil.coeur ? (c.metier.dimensions.vecteur[profil.coeur.dim] ?? 0) : null,
      pisteDuRepli: codesRepli.has(c.metier.code_rome),
    })),
  };
}
